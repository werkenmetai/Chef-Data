/**
 * Outreach Campaigns API
 *
 * GET /api/admin/outreach/campaigns - List all campaigns
 * POST /api/admin/outreach/campaigns - Create new campaign
 * PATCH /api/admin/outreach/campaigns - Update campaign
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

export const GET: APIRoute = async ({ request, locals, cookies }) => {
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
    const engine = createOutreachEngine(env.DB, env);
    const campaigns = await engine.getAllCampaigns();
    const stats = await engine.getStats();

    return new Response(
      JSON.stringify({ campaigns, stats }),
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

export const PATCH: APIRoute = async ({ request, locals, cookies }) => {
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
    const body = await request.json();
    const { id, action, ...updates } = body as { id: string; action?: string; [key: string]: unknown };

    if (!id) {
      return new Response(JSON.stringify({ error: 'Campaign ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const engine = createOutreachEngine(env.DB, env);

    // Handle toggle action
    if (action === 'toggle') {
      const campaign = await engine.getCampaign(id);
      if (!campaign) {
        return new Response(JSON.stringify({ error: 'Campaign not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await engine.toggleCampaign(id, !campaign.is_active);

      return new Response(
        JSON.stringify({ success: true, is_active: !campaign.is_active }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle general update
    await engine.updateCampaign(id, updates);

    const updated = await engine.getCampaign(id);

    return new Response(
      JSON.stringify({ success: true, campaign: updated }),
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
