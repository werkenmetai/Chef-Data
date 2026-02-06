/**
 * NPS Score API (from email links)
 *
 * GET /api/feedback/nps/[token]/[score]
 *
 * Records NPS score from email click and redirects to thank you page.
 */

import type { APIContext } from 'astro';

export async function GET(context: APIContext): Promise<Response> {
  const { params, locals } = context;
  const db = locals.runtime.env.DB;

  const { token, score } = params;

  // Validate score
  const npsScore = parseInt(score || '0', 10);
  if (isNaN(npsScore) || npsScore < 1 || npsScore > 10) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/feedback/error?reason=invalid_score' },
    });
  }

  if (!token) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/feedback/error?reason=invalid_token' },
    });
  }

  try {
    // Find the campaign and user
    const campaign = await db.prepare(`
      SELECT fc.id, fc.user_id, fc.status, fc.campaign_type
      FROM feedback_campaigns fc
      WHERE fc.response_token = ?
    `).bind(token).first<{
      id: string;
      user_id: string;
      status: string;
      campaign_type: string;
    }>();

    if (!campaign) {
      return new Response(null, {
        status: 302,
        headers: { 'Location': '/feedback/error?reason=expired' },
      });
    }

    // Check if already responded
    if (campaign.status === 'responded') {
      return new Response(null, {
        status: 302,
        headers: { 'Location': '/feedback/thanks?already=true' },
      });
    }

    // Determine sentiment
    let sentiment: 'positive' | 'neutral' | 'negative';
    if (npsScore >= 9) sentiment = 'positive';
    else if (npsScore >= 7) sentiment = 'neutral';
    else sentiment = 'negative';

    // Record the feedback
    const feedbackId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO feedback (
        id, user_id, feedback_type, trigger_event,
        nps_score, sentiment, source, email_campaign_id, status
      ) VALUES (?, ?, 'nps', ?, ?, ?, 'email', ?, 'reviewed')
    `).bind(
      feedbackId,
      campaign.user_id,
      campaign.campaign_type,
      npsScore,
      sentiment,
      campaign.id
    ).run();

    // Update campaign status
    await db.prepare(`
      UPDATE feedback_campaigns
      SET responded_at = CURRENT_TIMESTAMP, status = 'responded'
      WHERE id = ?
    `).bind(campaign.id).run();

    // If promoter, schedule testimonial request (if not already scheduled)
    if (npsScore >= 9) {
      const existingTestimonialRequest = await db.prepare(`
        SELECT 1 FROM feedback_campaigns
        WHERE user_id = ? AND campaign_type = 'testimonial_request'
        LIMIT 1
      `).bind(campaign.user_id).first();

      if (!existingTestimonialRequest) {
        const scheduledFor = new Date();
        scheduledFor.setDate(scheduledFor.getDate() + 3);

        await db.prepare(`
          INSERT INTO feedback_campaigns (
            id, user_id, campaign_type, scheduled_for,
            tracking_token, response_token, status
          ) VALUES (?, ?, 'testimonial_request', ?, ?, ?, 'scheduled')
        `).bind(
          crypto.randomUUID(),
          campaign.user_id,
          scheduledFor.toISOString(),
          crypto.randomUUID(),
          crypto.randomUUID()
        ).run();
      }
    }

    // Redirect based on score
    if (npsScore >= 9) {
      // Promoter - ask for testimonial
      return new Response(null, {
        status: 302,
        headers: { 'Location': `/feedback/thanks?score=${npsScore}&type=promoter&id=${feedbackId}` },
      });
    } else if (npsScore <= 6) {
      // Detractor - ask for improvement feedback
      return new Response(null, {
        status: 302,
        headers: { 'Location': `/feedback/improve?score=${npsScore}&id=${feedbackId}` },
      });
    } else {
      // Passive - simple thank you
      return new Response(null, {
        status: 302,
        headers: { 'Location': `/feedback/thanks?score=${npsScore}` },
      });
    }

  } catch (error) {
    console.error('[NPS API] Error:', error);
    return new Response(null, {
      status: 302,
      headers: { 'Location': '/feedback/error?reason=server_error' },
    });
  }
}
