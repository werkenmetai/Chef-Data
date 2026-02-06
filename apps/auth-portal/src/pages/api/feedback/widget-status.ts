/**
 * Feedback Widget Status API
 *
 * GET /api/feedback/widget-status
 *
 * Returns whether the feedback widget should be shown to the current user.
 */

import type { APIContext } from 'astro';
import { Database } from '../../../lib/database';

// Query count thresholds at which to show the widget
const WIDGET_TRIGGERS = [25, 100, 250, 500, 1000, 2500, 5000];

export async function GET(context: APIContext): Promise<Response> {
  const { cookies, locals } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ show_widget: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const database = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);

  try {
    const sessionId = cookies.get('session_id')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ show_widget: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sessionResult = await database.validateSession(sessionId);
    if (!sessionResult) {
      return new Response(JSON.stringify({ show_widget: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = sessionResult.user.id;

    // Get user feedback status
    const user = await env.DB.prepare(`
      SELECT
        feedback_opt_out,
        total_queries_count,
        last_feedback_request
      FROM users WHERE id = ?
    `).bind(userId).first<{
      feedback_opt_out: number;
      total_queries_count: number;
      last_feedback_request: string | null;
    }>();

    if (!user) {
      return new Response(JSON.stringify({ show_widget: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // User has opted out
    if (user.feedback_opt_out) {
      return new Response(JSON.stringify({
        show_widget: false,
        reason: 'opted_out',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if gave feedback in last 30 days
    const recentFeedback = await env.DB.prepare(`
      SELECT 1 FROM feedback
      WHERE user_id = ?
        AND source = 'widget'
        AND created_at > datetime('now', '-30 days')
      LIMIT 1
    `).bind(userId).first();

    if (recentFeedback) {
      return new Response(JSON.stringify({
        show_widget: false,
        reason: 'recent_feedback',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if current query count matches a trigger
    const queryCount = user.total_queries_count || 0;

    // Find if we just hit a trigger (within 5 queries of a threshold)
    const matchingTrigger = WIDGET_TRIGGERS.find(trigger =>
      queryCount >= trigger && queryCount < trigger + 5
    );

    // Also check if they've already been shown widget at this threshold
    if (matchingTrigger) {
      const alreadyTriggered = await env.DB.prepare(`
        SELECT 1 FROM feedback
        WHERE user_id = ?
          AND trigger_event = ?
        LIMIT 1
      `).bind(userId, `query_${matchingTrigger}`).first();

      if (alreadyTriggered) {
        return new Response(JSON.stringify({
          show_widget: false,
          reason: 'already_triggered',
          query_count: queryCount,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const shouldShow = matchingTrigger !== undefined;

    return new Response(JSON.stringify({
      show_widget: shouldShow,
      trigger: matchingTrigger ? `query_${matchingTrigger}` : null,
      query_count: queryCount,
      next_trigger: WIDGET_TRIGGERS.find(t => t > queryCount) || null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Widget Status API] Error:', error);
    return new Response(JSON.stringify({
      show_widget: false,
      error: 'Could not check widget status',
    }), {
      status: 200, // Still return 200 to not break the widget
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
