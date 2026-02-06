/**
 * Manual Outreach Run API
 *
 * POST /api/admin/outreach/run - Manually trigger outreach processing
 *
 * For testing/admin purposes. Production should use cron.
 *
 * @author Sophie (Customer Success)
 */

import type { APIRoute } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';
import { Database } from '../../../../lib/database';
import { createOutreachEngine } from '../../../../lib/outreach';

// Helper to check admin access
async function isAdmin(request: Request, env: { DB: D1Database; TOKEN_ENCRYPTION_KEY?: string; ADMIN_EMAILS?: string }, cookies: { get: (name: string) => { value: string } | undefined }): Promise<boolean> {
  const adminEmails = (env.ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e.length > 0);

  if (adminEmails.length === 0) return false;

  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) return false;

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
  const session = await db.validateSession(sessionId);

  if (!session) return false;

  return adminEmails.includes(session.user.email.toLowerCase());
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const env = locals.runtime?.env;

  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check admin access
  if (!(await isAdmin(request, env, cookies))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { campaign_id, dry_run } = body as { campaign_id?: string; dry_run?: boolean };

    const engine = createOutreachEngine(env.DB, env);
    const startTime = Date.now();

    let results;

    if (campaign_id) {
      // Run specific campaign
      const campaign = await engine.getCampaign(campaign_id);
      if (!campaign) {
        return new Response(JSON.stringify({ error: 'Campaign not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (dry_run) {
        // Just return what would be processed
        return new Response(
          JSON.stringify({
            dry_run: true,
            campaign: campaign.name,
            message: 'Dry run mode - no emails sent',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const campaignResults = await engine.runCampaign(campaign);
      results = {
        processed: campaignResults.length,
        sent: campaignResults.filter(r => r.success).length,
        errors: campaignResults.filter(r => !r.success).length,
        results: campaignResults,
      };
    } else {
      // Run all campaigns
      if (dry_run) {
        const campaigns = await engine.getActiveCampaigns();
        return new Response(
          JSON.stringify({
            dry_run: true,
            active_campaigns: campaigns.length,
            campaigns: campaigns.map(c => ({ id: c.id, name: c.name, trigger_type: c.trigger_type })),
            message: 'Dry run mode - no emails sent',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      results = await engine.runAllCampaigns();
    }

    const duration = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          processed: results.processed,
          sent: results.sent,
          errors: results.errors,
          duration_ms: duration,
        },
        results: results.results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
