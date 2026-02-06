/**
 * AIOPS-002: Admin Settings API
 *
 * GET /api/admin/settings - Get all settings including feature flags
 */

import type { APIContext } from 'astro';
import { Database } from '../../../../lib/database';
import { requireAdmin } from '../../../../lib/admin';

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

export async function GET(context: APIContext): Promise<Response> {
  const { cookies, locals } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);

  // Validate session
  const sessionId = cookies.get('session_id')?.value;
  const session = sessionId ? await db.validateSession(sessionId) : null;

  // Check admin access
  const errorResponse = requireAdmin(session, env);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    // Get all feature flags
    const flagsResult = await env.DB.prepare('SELECT * FROM feature_flags ORDER BY name')
      .all<FeatureFlag>();

    // Get all system settings
    const settingsResult = await env.DB.prepare('SELECT key, value FROM system_settings')
      .all<{ key: string; value: string }>();

    // Parse feature flags
    const featureFlags = (flagsResult.results || []).map(flag => ({
      ...flag,
      enabled: Boolean(flag.enabled),
      config: flag.config ? JSON.parse(flag.config) : null,
    }));

    // Parse system settings into object
    const systemSettings: Record<string, string> = {};
    for (const setting of settingsResult.results || []) {
      systemSettings[setting.key] = setting.value;
    }

    return new Response(JSON.stringify({
      featureFlags,
      systemSettings,
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
