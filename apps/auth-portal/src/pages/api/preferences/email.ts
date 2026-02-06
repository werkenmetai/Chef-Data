/**
 * API endpoint for managing email notification preferences
 *
 * GET /api/preferences/email - Get current preferences
 * POST /api/preferences/email - Update preferences
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../lib/database';

interface EmailPreferences {
  email_support_replies: boolean;
  email_privacy_tips: boolean;
  email_provider_news: boolean;
  email_product_updates: boolean;
}

export const GET: APIRoute = async ({ cookies, locals }) => {
  try {
    const env = locals.runtime?.env;
    if (!env?.DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database niet beschikbaar' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);

    // Verify session
    const sessionId = cookies.get('session_id')?.value;
    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Niet ingelogd' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await db.validateSession(sessionId);
    if (!session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sessie verlopen' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get email preferences
    const result = await env.DB.prepare(`
      SELECT
        COALESCE(email_support_replies, 1) as email_support_replies,
        COALESCE(email_privacy_tips, 1) as email_privacy_tips,
        COALESCE(email_provider_news, 1) as email_provider_news,
        COALESCE(email_product_updates, 1) as email_product_updates
      FROM users WHERE id = ?
    `).bind(session.user.id).first<{
      email_support_replies: number;
      email_privacy_tips: number;
      email_provider_news: number;
      email_product_updates: number;
    }>();

    if (!result) {
      return new Response(
        JSON.stringify({ success: false, error: 'Gebruiker niet gevonden' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        preferences: {
          email_support_replies: result.email_support_replies === 1,
          email_privacy_tips: result.email_privacy_tips === 1,
          email_provider_news: result.email_provider_news === 1,
          email_product_updates: result.email_product_updates === 1,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get email preferences error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Onbekende fout',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const env = locals.runtime?.env;
    if (!env?.DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database niet beschikbaar' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);

    // Verify session
    const sessionId = cookies.get('session_id')?.value;
    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Niet ingelogd' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await db.validateSession(sessionId);
    if (!session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sessie verlopen' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json() as Partial<EmailPreferences>;

    // Build dynamic update query
    const updates: string[] = [];
    const values: (number | string)[] = [];

    if (typeof body.email_support_replies === 'boolean') {
      updates.push('email_support_replies = ?');
      values.push(body.email_support_replies ? 1 : 0);
    }
    if (typeof body.email_privacy_tips === 'boolean') {
      updates.push('email_privacy_tips = ?');
      values.push(body.email_privacy_tips ? 1 : 0);
    }
    if (typeof body.email_provider_news === 'boolean') {
      updates.push('email_provider_news = ?');
      values.push(body.email_provider_news ? 1 : 0);
    }
    if (typeof body.email_product_updates === 'boolean') {
      updates.push('email_product_updates = ?');
      values.push(body.email_product_updates ? 1 : 0);
    }

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Geen voorkeuren opgegeven' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add user id to values
    values.push(session.user.id);

    await env.DB.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Voorkeuren opgeslagen',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Update email preferences error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Onbekende fout',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
