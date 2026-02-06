/**
 * Feedback Submission API
 *
 * POST /api/feedback/submit
 *
 * Accepts feedback from widget, email responses, and manual submissions.
 */

import type { APIContext } from 'astro';
import { Database } from '../../../lib/database';

interface FeedbackSubmission {
  type: 'nps' | 'widget' | 'testimonial' | 'churn';
  trigger_event?: string;
  nps_score?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  feedback_text?: string;
  improvement_category?: string;
  testimonial_quote?: string;
  testimonial_display_name?: string;
  testimonial_company?: string;
  testimonial_role?: string;
  permission_website?: boolean;
  permission_marketing?: boolean;
  campaign_token?: string; // Links to email campaign
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

    // Check if user has opted out of feedback
    const user = await env.DB.prepare(`
      SELECT feedback_opt_out FROM users WHERE id = ?
    `).bind(userId).first<{ feedback_opt_out: number }>();

    if (user?.feedback_opt_out) {
      return new Response(JSON.stringify({ error: 'User has opted out of feedback requests' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as FeedbackSubmission;

    // Validate required fields
    if (!body.type) {
      return new Response(JSON.stringify({ error: 'Feedback type is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate NPS score if provided
    if (body.nps_score !== undefined && (body.nps_score < 1 || body.nps_score > 10)) {
      return new Response(JSON.stringify({ error: 'NPS score must be between 1 and 10' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine sentiment from NPS if not provided
    let sentiment = body.sentiment;
    if (!sentiment && body.nps_score) {
      if (body.nps_score >= 9) sentiment = 'positive';
      else if (body.nps_score >= 7) sentiment = 'neutral';
      else sentiment = 'negative';
    }

    // Get client info
    const ipAddress = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Determine source
    const source = body.campaign_token ? 'email' : 'widget';

    // Insert feedback
    const feedbackId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO feedback (
        id, user_id, feedback_type, trigger_event,
        nps_score, sentiment, feedback_text, improvement_category,
        testimonial_quote, testimonial_display_name, testimonial_company, testimonial_role,
        permission_website, permission_marketing,
        source, email_campaign_id, ip_address, user_agent,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      feedbackId,
      userId,
      body.type,
      body.trigger_event || null,
      body.nps_score || null,
      sentiment || null,
      body.feedback_text || null,
      body.improvement_category || null,
      body.testimonial_quote || null,
      body.testimonial_display_name || null,
      body.testimonial_company || null,
      body.testimonial_role || null,
      body.permission_website ? 1 : 0,
      body.permission_marketing ? 1 : 0,
      source,
      body.campaign_token || null,
      ipAddress,
      userAgent,
      body.testimonial_quote ? 'received' : 'reviewed' // Testimonials need review
    ).run();

    // Update campaign if this was from an email
    if (body.campaign_token) {
      await env.DB.prepare(`
        UPDATE feedback_campaigns
        SET responded_at = CURRENT_TIMESTAMP, status = 'responded'
        WHERE response_token = ?
      `).bind(body.campaign_token).run();
    }

    // Update user's last feedback timestamp
    await env.DB.prepare(`
      UPDATE users SET last_feedback_request = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(userId).run();

    // If this is a promoter (NPS 9-10), schedule testimonial request
    if (body.nps_score && body.nps_score >= 9 && body.type === 'nps') {
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + 3); // 3 days later

      await env.DB.prepare(`
        INSERT INTO feedback_campaigns (id, user_id, campaign_type, scheduled_for, tracking_token, response_token, status)
        SELECT ?, ?, 'testimonial_request', ?, ?, ?, 'scheduled'
        WHERE NOT EXISTS (
          SELECT 1 FROM feedback_campaigns
          WHERE user_id = ? AND campaign_type = 'testimonial_request'
        )
      `).bind(
        crypto.randomUUID(),
        userId,
        scheduledFor.toISOString(),
        crypto.randomUUID(),
        crypto.randomUUID(),
        userId
      ).run();
    }

    // Return success with optional follow-up message
    let message = 'Bedankt voor je feedback!';
    let followUp = null;

    if (sentiment === 'positive' && !body.testimonial_quote) {
      followUp = {
        type: 'testimonial_prompt',
        message: 'Fijn dat je positief bent! Wil je een korte quote delen voor onze website?',
      };
    } else if (sentiment === 'negative') {
      followUp = {
        type: 'support_offer',
        message: 'Vervelend om te horen. Wil je dat we contact met je opnemen om te helpen?',
      };
    }

    return new Response(JSON.stringify({
      success: true,
      message,
      feedback_id: feedbackId,
      follow_up: followUp,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Feedback API] Error:', error);
    return new Response(JSON.stringify({
      error: 'Er ging iets mis bij het opslaan van je feedback',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
