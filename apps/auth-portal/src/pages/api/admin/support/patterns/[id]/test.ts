/**
 * Pattern Test API Endpoint
 *
 * POST /api/admin/support/patterns/[id]/test - Test pattern matching
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../../../../lib/database';
import { SupportAI } from '../../../../../../lib/support-ai';

// Helper to check admin
async function isAdmin(db: Database, env: Record<string, unknown>, cookies: { get: (name: string) => { value?: string } | undefined }): Promise<boolean> {
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) return false;

  const session = await db.validateSession(sessionId);
  if (!session) return false;

  const adminEmails = ((env.ADMIN_EMAILS as string) || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  const userEmail = session.user.email.toLowerCase();
  return adminEmails.length > 0 && adminEmails.includes(userEmail);
}

export const POST: APIRoute = async ({ cookies, locals, params, request }) => {
  try {
    const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);

    if (!(await isAdmin(db, env, cookies))) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const patternId = params.id;
    if (!patternId) {
      return new Response(JSON.stringify({ error: 'Pattern ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pattern = await db.getPattern(patternId);
    if (!pattern) {
      return new Response(JSON.stringify({ error: 'Pattern not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as { message: string };
    if (!body.message) {
      return new Response(JSON.stringify({ error: 'Test message required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ai = new SupportAI(db);
    const matches = ai.matchPatterns(body.message, [pattern]);

    const result = matches.length > 0 ? matches[0] : null;

    return new Response(JSON.stringify({
      matched: result !== null,
      confidence: result?.confidence || 0,
      matchedKeywords: result?.matchedKeywords || [],
      wouldAutoRespond: result ? result.confidence >= pattern.min_confidence : false,
      response: result && result.confidence >= pattern.min_confidence
        ? ai.generateResponse(pattern, undefined, 'nl')
        : null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Test pattern error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
