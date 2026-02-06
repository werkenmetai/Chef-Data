import type { APIRoute } from 'astro';
import { Database } from '../../../lib/database';
import { TOS_VERSION } from '../../../lib/constants';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  // Get session
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Niet ingelogd' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get environment
  const env = locals.runtime?.env;
  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database niet beschikbaar' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);

  // Validate session
  const sessionResult = await db.validateSession(sessionId);
  if (!sessionResult) {
    return new Response(JSON.stringify({ error: 'Sessie verlopen' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { user } = sessionResult;

  // Parse request body
  let body: { version?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Ongeldige request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const version = body.version || TOS_VERSION;

  // Get request metadata
  const ipAddress = request.headers.get('CF-Connecting-IP') ||
                    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
                    'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';

  try {
    // Record acceptance in audit table
    await db.run(
      `INSERT INTO tos_acceptances (user_id, tos_version, ip_address, user_agent)
       VALUES (?, ?, ?, ?)`,
      [user.id, version, ipAddress, userAgent]
    );

    // Update user record
    await db.run(
      `UPDATE users SET tos_accepted_version = ?, tos_accepted_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`,
      [version, user.id]
    );

    return new Response(JSON.stringify({
      success: true,
      version,
      accepted_at: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('ToS acceptance error:', error);
    return new Response(JSON.stringify({ error: 'Opslaan mislukt' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
