/**
 * Feedback Campaigns Cron Job
 *
 * POST /api/cron/feedback-campaigns
 *
 * Scheduled task to send feedback request emails.
 * Should be called daily by Cloudflare Workers Cron or external scheduler.
 *
 * Protected by CRON_SECRET environment variable.
 */

import type { APIContext } from 'astro';
import { Database } from '../../../lib/database';
import { sendEmail, feedbackDay7Email, testimonialRequestEmail, churnPreventionEmail } from '../../../lib/email';

interface ScheduledCampaign {
  id: string;
  user_id: string;
  campaign_type: string;
  tracking_token: string;
  response_token: string;
  user_email: string;
  user_name: string;
  query_count?: number;
  nps_score?: number;
  days_inactive?: number;
}

export async function POST(context: APIContext): Promise<Response> {
  const { request, locals } = context;
  const db = locals.runtime.env.DB;
  const env = locals.runtime.env;

  // Verify cron secret
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '');
  if (!env.CRON_SECRET || cronSecret !== env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = {
    day7: { scheduled: 0, sent: 0, errors: 0 },
    testimonial: { scheduled: 0, sent: 0, errors: 0 },
    churn: { scheduled: 0, sent: 0, errors: 0 },
  };

  const baseUrl = env.PUBLIC_SITE_URL || 'https://praatmetjeboekhouding.nl';

  try {
    // 1. Schedule Day 7 Check-ins
    // Users who registered 7 days ago and have made at least 5 queries
    const day7Candidates = await db.prepare(`
      SELECT u.id, u.email, u.name,
             COUNT(al.id) as query_count
      FROM users u
      LEFT JOIN api_logs al ON al.user_id = u.id AND al.success = 1
      WHERE u.created_at <= datetime('now', '-7 days')
        AND u.created_at > datetime('now', '-8 days')
        AND u.feedback_opt_out = 0
        AND NOT EXISTS (
          SELECT 1 FROM feedback_campaigns fc
          WHERE fc.user_id = u.id AND fc.campaign_type = 'day_7'
        )
      GROUP BY u.id
      HAVING query_count >= 5
    `).all<{ id: string; email: string; name: string; query_count: number }>();

    for (const user of day7Candidates.results || []) {
      const campaignId = crypto.randomUUID();
      const trackingToken = crypto.randomUUID();
      const responseToken = crypto.randomUUID();

      await db.prepare(`
        INSERT INTO feedback_campaigns (id, user_id, campaign_type, scheduled_for, tracking_token, response_token, status)
        VALUES (?, ?, 'day_7', CURRENT_TIMESTAMP, ?, ?, 'scheduled')
      `).bind(campaignId, user.id, trackingToken, responseToken).run();

      results.day7.scheduled++;
    }

    // 2. Schedule Day 30 Testimonial Requests (for promoters)
    const testimonialCandidates = await db.prepare(`
      SELECT DISTINCT u.id, u.email, u.name, f.nps_score
      FROM users u
      JOIN feedback f ON f.user_id = u.id
      WHERE u.created_at <= datetime('now', '-30 days')
        AND u.created_at > datetime('now', '-31 days')
        AND u.feedback_opt_out = 0
        AND (f.nps_score >= 8 OR f.sentiment = 'positive')
        AND NOT EXISTS (
          SELECT 1 FROM feedback_campaigns fc
          WHERE fc.user_id = u.id AND fc.campaign_type = 'testimonial_request'
        )
        AND NOT EXISTS (
          SELECT 1 FROM feedback tf
          WHERE tf.user_id = u.id AND tf.feedback_type = 'testimonial'
        )
    `).all<{ id: string; email: string; name: string; nps_score: number }>();

    for (const user of testimonialCandidates.results || []) {
      const campaignId = crypto.randomUUID();
      const trackingToken = crypto.randomUUID();
      const responseToken = crypto.randomUUID();

      await db.prepare(`
        INSERT INTO feedback_campaigns (id, user_id, campaign_type, scheduled_for, tracking_token, response_token, status)
        VALUES (?, ?, 'testimonial_request', CURRENT_TIMESTAMP, ?, ?, 'scheduled')
      `).bind(campaignId, user.id, trackingToken, responseToken).run();

      results.testimonial.scheduled++;
    }

    // 3. Schedule Churn Prevention (14 days inactive after active usage)
    const churnCandidates = await db.prepare(`
      SELECT u.id, u.email, u.name,
             MAX(al.created_at) as last_activity,
             COUNT(al.id) as total_queries,
             CAST((julianday('now') - julianday(MAX(al.created_at))) AS INTEGER) as days_inactive
      FROM users u
      JOIN api_logs al ON al.user_id = u.id AND al.success = 1
      WHERE u.feedback_opt_out = 0
      GROUP BY u.id
      HAVING total_queries >= 3
        AND days_inactive >= 14
        AND days_inactive < 60
        AND NOT EXISTS (
          SELECT 1 FROM feedback_campaigns fc
          WHERE fc.user_id = u.id
            AND fc.campaign_type = 'churn_14'
            AND fc.created_at > datetime('now', '-30 days')
        )
    `).all<{ id: string; email: string; name: string; days_inactive: number }>();

    for (const user of churnCandidates.results || []) {
      const campaignId = crypto.randomUUID();
      const trackingToken = crypto.randomUUID();
      const responseToken = crypto.randomUUID();

      await db.prepare(`
        INSERT INTO feedback_campaigns (id, user_id, campaign_type, scheduled_for, tracking_token, response_token, status)
        VALUES (?, ?, 'churn_14', CURRENT_TIMESTAMP, ?, ?, 'scheduled')
      `).bind(campaignId, user.id, trackingToken, responseToken).run();

      results.churn.scheduled++;
    }

    // 4. Send scheduled campaigns
    const pendingCampaigns = await db.prepare(`
      SELECT fc.*, u.email as user_email, u.name as user_name
      FROM feedback_campaigns fc
      JOIN users u ON fc.user_id = u.id
      WHERE fc.status = 'scheduled'
        AND fc.scheduled_for <= CURRENT_TIMESTAMP
      LIMIT 50
    `).all<ScheduledCampaign>();

    for (const campaign of pendingCampaigns.results || []) {
      try {
        let emailOptions;
        const firstName = campaign.user_name?.split(' ')[0] || 'daar';

        // Get additional data for email personalization
        let queryCount = 0;
        let npsScore: number | undefined;
        let daysInactive = 0;

        if (campaign.campaign_type === 'day_7') {
          const stats = await db.prepare(`
            SELECT COUNT(*) as count FROM api_logs WHERE user_id = ? AND success = 1
          `).bind(campaign.user_id).first<{ count: number }>();
          queryCount = stats?.count || 0;

          emailOptions = feedbackDay7Email({
            userName: firstName,
            trackingToken: campaign.tracking_token,
            responseToken: campaign.response_token,
            queryCount,
          });
        } else if (campaign.campaign_type === 'testimonial_request') {
          const lastFeedback = await db.prepare(`
            SELECT nps_score FROM feedback WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
          `).bind(campaign.user_id).first<{ nps_score: number }>();
          npsScore = lastFeedback?.nps_score;

          emailOptions = testimonialRequestEmail({
            userName: firstName,
            trackingToken: campaign.tracking_token,
            responseToken: campaign.response_token,
            queryCount: 0,
            npsScore,
          });
        } else if (campaign.campaign_type === 'churn_14') {
          const activity = await db.prepare(`
            SELECT
              CAST((julianday('now') - julianday(MAX(created_at))) AS INTEGER) as days,
              MAX(created_at) as last_query
            FROM api_logs WHERE user_id = ? AND success = 1
          `).bind(campaign.user_id).first<{ days: number; last_query: string }>();
          daysInactive = activity?.days || 14;
          const lastQueryDate = activity?.last_query ? new Date(activity.last_query).toLocaleDateString('nl-NL') : 'onbekend';

          emailOptions = churnPreventionEmail({
            userName: firstName,
            trackingToken: campaign.tracking_token,
            responseToken: campaign.response_token,
            queryCount: 0,
            daysInactive,
            lastQueryDate,
          });
        }

        if (emailOptions) {
          await sendEmail(env, {
            ...emailOptions,
            to: campaign.user_email,
          });

          await db.prepare(`
            UPDATE feedback_campaigns SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ?
          `).bind(campaign.id).run();

          if (campaign.campaign_type === 'day_7') results.day7.sent++;
          else if (campaign.campaign_type === 'testimonial_request') results.testimonial.sent++;
          else if (campaign.campaign_type === 'churn_14') results.churn.sent++;
        }
      } catch (error) {
        console.error(`[Cron] Failed to send campaign ${campaign.id}:`, error);

        await db.prepare(`
          UPDATE feedback_campaigns SET status = 'failed' WHERE id = ?
        `).bind(campaign.id).run();

        if (campaign.campaign_type === 'day_7') results.day7.errors++;
        else if (campaign.campaign_type === 'testimonial_request') results.testimonial.errors++;
        else if (campaign.campaign_type === 'churn_14') results.churn.errors++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Cron] Feedback campaigns error:', error);
    return new Response(JSON.stringify({
      error: 'Cron job failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Also support GET for manual testing (with admin auth)
export async function GET(context: APIContext): Promise<Response> {
  const { cookies, locals } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check admin auth
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const database = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);
  const session = await database.validateSession(sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminEmails = ((env.ADMIN_EMAILS as string) || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e.length > 0);

  const isAdmin = adminEmails.length > 0 && adminEmails.includes(session.user.email.toLowerCase());
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Forward to POST handler
  return POST(context);
}
