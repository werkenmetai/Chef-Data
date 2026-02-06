/**
 * Admin Email Logs API Endpoint
 *
 * GET /api/admin/emails - Get all email logs with filters
 */

import type { APIRoute } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';
import { Database } from '../../../../lib/database';
import { isAdmin } from '../../../../lib/admin';

export const GET: APIRoute = async ({ cookies, locals, url }) => {
  try {
    const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);
    const admin = await isAdmin(db, env, cookies);

    if (!admin.isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse filters from query params with bounds validation (LOW security fix)
    const rawLimit = parseInt(url.searchParams.get('limit') || '50', 10);
    const rawOffset = parseInt(url.searchParams.get('offset') || '0', 10);

    const filters = {
      userId: url.searchParams.get('user_id') || undefined,
      status: url.searchParams.get('status') || undefined,
      startDate: url.searchParams.get('start_date') || undefined,
      endDate: url.searchParams.get('end_date') || undefined,
      limit: Math.max(1, Math.min(isNaN(rawLimit) ? 50 : rawLimit, 200)),
      offset: Math.max(0, isNaN(rawOffset) ? 0 : rawOffset),
    };

    const result = await db.getEmailLogs(filters);

    return new Response(
      JSON.stringify({
        emails: result.emails,
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get email logs error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
