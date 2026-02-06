/**
 * Admin Pattern Detail API Endpoint
 *
 * GET /api/admin/support/patterns/[id] - Get pattern
 * PUT /api/admin/support/patterns/[id] - Update pattern
 * DELETE /api/admin/support/patterns/[id] - Delete pattern
 */

import type { APIRoute } from 'astro';
import { Database, type SupportPattern } from '../../../../../lib/database';

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

export const GET: APIRoute = async ({ cookies, locals, params }) => {
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

    // Parse JSON fields
    const parsedPattern = {
      ...pattern,
      trigger_keywords: JSON.parse(pattern.trigger_keywords),
      error_codes: pattern.error_codes ? JSON.parse(pattern.error_codes) : null,
      solution_steps: pattern.solution_steps ? JSON.parse(pattern.solution_steps) : null,
      related_articles: pattern.related_articles ? JSON.parse(pattern.related_articles) : null,
      success_rate: pattern.times_triggered > 0 ? pattern.times_resolved / pattern.times_triggered : 0,
    };

    return new Response(JSON.stringify({ pattern: parsedPattern }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get pattern error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ cookies, locals, params, request }) => {
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

    const body = await request.json() as Partial<SupportPattern>;
    await db.updatePattern(patternId, body);

    const updatedPattern = await db.getPattern(patternId);

    return new Response(JSON.stringify({
      pattern: {
        ...updatedPattern,
        trigger_keywords: JSON.parse(updatedPattern!.trigger_keywords),
        error_codes: updatedPattern!.error_codes ? JSON.parse(updatedPattern!.error_codes) : null,
        solution_steps: updatedPattern!.solution_steps ? JSON.parse(updatedPattern!.solution_steps) : null,
        related_articles: updatedPattern!.related_articles ? JSON.parse(updatedPattern!.related_articles) : null,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update pattern error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ cookies, locals, params }) => {
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

    const deleted = await db.deletePattern(patternId);
    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Pattern not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete pattern error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
