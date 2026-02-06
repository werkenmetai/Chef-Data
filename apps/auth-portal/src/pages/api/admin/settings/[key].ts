/**
 * AIOPS-002: Admin Settings API - Single Setting Operations
 *
 * GET /api/admin/settings/[key] - Get single feature flag
 * PUT /api/admin/settings/[key] - Update feature flag
 */

import type { APIContext } from 'astro';
import { Database } from '../../../../lib/database';

// Feature flag type definition
interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: number;
  config: string | null;
  updated_at: string;
  updated_by: string | null;
}

// Helper to check admin
async function checkAdmin(
  db: Database,
  env: Record<string, unknown>,
  cookies: { get: (name: string) => { value?: string } | undefined }
): Promise<{ isAdmin: boolean; userId?: string; email?: string }> {
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) return { isAdmin: false };

  const session = await db.validateSession(sessionId);
  if (!session) return { isAdmin: false };

  const adminEmails = ((env.ADMIN_EMAILS as string) || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  const userEmail = session.user.email.toLowerCase();
  return {
    isAdmin: adminEmails.length > 0 && adminEmails.includes(userEmail),
    userId: session.user.id,
    email: session.user.email,
  };
}

export async function GET(context: APIContext): Promise<Response> {
  const { params, cookies, locals } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);
  const admin = await checkAdmin(db, env, cookies);

  if (!admin.isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const key = params.key;
  if (!key) {
    return new Response(JSON.stringify({ error: 'Setting key required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const flag = await env.DB.prepare('SELECT * FROM feature_flags WHERE key = ?')
      .bind(key)
      .first<FeatureFlag>();

    if (!flag) {
      return new Response(JSON.stringify({ error: 'Feature flag not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      featureFlag: {
        ...flag,
        enabled: Boolean(flag.enabled),
        config: flag.config ? JSON.parse(flag.config) : null,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Settings API] Error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(context: APIContext): Promise<Response> {
  const { params, request, cookies, locals } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);
  const admin = await checkAdmin(db, env, cookies);

  if (!admin.isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const key = params.key;
  if (!key) {
    return new Response(JSON.stringify({ error: 'Setting key required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if flag exists
  const existing = await env.DB.prepare('SELECT id FROM feature_flags WHERE key = ?')
    .bind(key)
    .first<{ id: string }>();

  if (!existing) {
    return new Response(JSON.stringify({ error: 'Feature flag not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse request body
  let body: {
    enabled?: boolean;
    config?: Record<string, unknown>;
    name?: string;
    description?: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Build update query dynamically
    const updates: string[] = ['updated_at = ?', 'updated_by = ?'];
    const values: (string | number | null)[] = [new Date().toISOString(), admin.userId || null];

    if (body.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(body.enabled ? 1 : 0);
    }
    if (body.config !== undefined) {
      updates.push('config = ?');
      values.push(JSON.stringify(body.config));
    }
    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }

    values.push(key);

    await env.DB.prepare(`UPDATE feature_flags SET ${updates.join(', ')} WHERE key = ?`)
      .bind(...values)
      .run();

    // Fetch updated flag
    const flag = await env.DB.prepare('SELECT * FROM feature_flags WHERE key = ?')
      .bind(key)
      .first<FeatureFlag>();

    return new Response(JSON.stringify({
      success: true,
      featureFlag: {
        ...flag,
        enabled: Boolean(flag?.enabled),
        config: flag?.config ? JSON.parse(flag.config) : null,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Settings API] Error updating flag:', error);
    return new Response(JSON.stringify({ error: 'Failed to update setting' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
