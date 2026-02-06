/**
 * Admin Support Patterns API Endpoint
 *
 * GET /api/admin/support/patterns - Get all patterns
 * POST /api/admin/support/patterns - Create new pattern
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../../lib/database';

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

export const GET: APIRoute = async ({ cookies, locals }) => {
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

    const patterns = await db.getAllPatterns();

    // Parse JSON fields for response
    const parsedPatterns = patterns.map(p => ({
      ...p,
      trigger_keywords: JSON.parse(p.trigger_keywords),
      error_codes: p.error_codes ? JSON.parse(p.error_codes) : null,
      solution_steps: p.solution_steps ? JSON.parse(p.solution_steps) : null,
      related_articles: p.related_articles ? JSON.parse(p.related_articles) : null,
      success_rate: p.times_triggered > 0 ? p.times_resolved / p.times_triggered : 0,
    }));

    return new Response(JSON.stringify({ patterns: parsedPatterns }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get patterns error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ cookies, locals, request }) => {
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

    const body = await request.json() as {
      name: string;
      trigger_keywords: string[];
      trigger_regex?: string;
      error_codes?: string[];
      category: string;
      response_template_nl: string;
      response_template_en?: string;
      solution_steps?: string[];
      related_articles?: string[];
      min_confidence?: number;
    };

    if (!body.name || !body.trigger_keywords || !body.category || !body.response_template_nl) {
      return new Response(JSON.stringify({ error: 'Required fields: name, trigger_keywords, category, response_template_nl' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pattern = await db.createPattern(body);

    return new Response(JSON.stringify({ pattern }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create pattern error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
