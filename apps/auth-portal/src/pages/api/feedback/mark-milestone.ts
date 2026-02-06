/**
 * Mark Milestone API
 *
 * POST /api/feedback/mark-milestone
 *
 * Marks a feedback milestone as shown for the current user.
 * This prevents showing the same milestone prompt again.
 */

import type { APIContext } from 'astro';
import { Database } from '../../../lib/database';

interface MarkMilestoneRequest {
  milestone: 'milestone_10' | 'milestone_50' | 'upgrade_prompt_80pct' | 'retention_30d';
}

// Map milestone names to database columns
const MILESTONE_COLUMNS: Record<string, string> = {
  milestone_10: 'milestone_10_shown',
  milestone_50: 'milestone_50_shown',
  upgrade_prompt_80pct: 'milestone_80pct_shown',
  retention_30d: 'milestone_30d_shown',
};

export async function POST(context: APIContext): Promise<Response> {
  const { request, cookies, locals } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);

  try {
    // Get user from session
    const sessionId = cookies.get('session_id')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sessionResult = await db.validateSession(sessionId);
    if (!sessionResult) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = sessionResult.user.id;

    const body = await request.json() as MarkMilestoneRequest;

    // Validate milestone
    if (!body.milestone || !MILESTONE_COLUMNS[body.milestone]) {
      return new Response(JSON.stringify({ error: 'Invalid milestone' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const column = MILESTONE_COLUMNS[body.milestone];

    // Update the milestone flag
    // Note: For 80% milestone, also track the month to allow re-showing next month
    if (body.milestone === 'upgrade_prompt_80pct') {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      await env.DB.prepare(`
        UPDATE users
        SET ${column} = 1, milestone_80pct_month = ?
        WHERE id = ?
      `).bind(currentMonth, userId).run();
    } else {
      await env.DB.prepare(`
        UPDATE users SET ${column} = 1 WHERE id = ?
      `).bind(userId).run();
    }

    return new Response(JSON.stringify({
      success: true,
      milestone: body.milestone,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Mark Milestone API] Error:', error);
    return new Response(JSON.stringify({
      error: 'Er ging iets mis',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
