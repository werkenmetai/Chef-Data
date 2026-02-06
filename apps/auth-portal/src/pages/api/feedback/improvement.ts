/**
 * Improvement Feedback Submission API
 *
 * POST /api/feedback/improvement
 *
 * Handles detailed feedback from detractors (NPS 1-6).
 */

import type { APIContext } from 'astro';
import { Database } from '../../../lib/database';

interface ImprovementSubmission {
  token?: string;
  nps_score?: number;
  improvement_category?: string;
  feedback_text?: string;
  contact_me?: string;
}

export async function POST(context: APIContext): Promise<Response> {
  const { request, cookies, locals } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const database = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);

  try {
    const contentType = request.headers.get('content-type') || '';
    let body: ImprovementSubmission;

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = {
        token: formData.get('token')?.toString(),
        nps_score: formData.get('nps_score') ? parseInt(formData.get('nps_score') as string, 10) : undefined,
        improvement_category: formData.get('improvement_category')?.toString(),
        feedback_text: formData.get('feedback_text')?.toString(),
        contact_me: formData.get('contact_me')?.toString(),
      };
    }

    // Get user ID from session or token
    let userId: string | undefined;

    // Try session first
    const sessionId = cookies.get('session_id')?.value;
    if (sessionId) {
      const sessionResult = await database.validateSession(sessionId);
      if (sessionResult) {
        userId = sessionResult.user.id;
      }
    }

    // Try token if no session
    if (!userId && body.token) {
      const campaign = await env.DB.prepare(`
        SELECT user_id FROM feedback_campaigns WHERE response_token = ?
      `).bind(body.token).first<{ user_id: string }>();

      if (campaign) {
        userId = campaign.user_id;
      }
    }

    if (!userId) {
      if (!contentType.includes('application/json')) {
        return context.redirect('/connect?return=/feedback/improve');
      }
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine sentiment from NPS score
    let sentiment: 'positive' | 'neutral' | 'negative' = 'negative';
    if (body.nps_score) {
      if (body.nps_score >= 9) sentiment = 'positive';
      else if (body.nps_score >= 7) sentiment = 'neutral';
    }

    // Insert improvement feedback
    const feedbackId = crypto.randomUUID();
    const contactRequested = body.contact_me === '1' || body.contact_me === 'true';

    await env.DB.prepare(`
      INSERT INTO feedback (
        id, user_id, feedback_type, trigger_event,
        nps_score, sentiment,
        feedback_text, improvement_category,
        source, status
      ) VALUES (?, ?, 'nps', 'page_submission', ?, ?, ?, ?, 'web', 'received')
    `).bind(
      feedbackId,
      userId,
      body.nps_score || null,
      sentiment,
      body.feedback_text?.trim() || null,
      body.improvement_category || null
    ).run();

    // Update campaign if token was provided
    if (body.token) {
      await env.DB.prepare(`
        UPDATE feedback_campaigns
        SET responded_at = CURRENT_TIMESTAMP, status = 'responded'
        WHERE response_token = ?
      `).bind(body.token).run();
    }

    // If contact requested, flag for follow-up
    if (contactRequested) {
      await env.DB.prepare(`
        UPDATE feedback SET admin_notes = 'CONTACT REQUESTED - Follow up required' WHERE id = ?
      `).bind(feedbackId).run();
    }

    // Redirect or respond
    if (!contentType.includes('application/json')) {
      return context.redirect(`/feedback/submitted?type=improvement${contactRequested ? '&contact=1' : ''}`);
    }

    return new Response(JSON.stringify({
      success: true,
      feedback_id: feedbackId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Improvement API] Error:', error);

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return context.redirect('/feedback/improve?error=server_error');
    }

    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
