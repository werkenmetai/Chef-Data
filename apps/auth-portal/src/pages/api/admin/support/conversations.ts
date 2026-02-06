/**
 * Admin Support Conversations API Endpoint
 *
 * GET /api/admin/support/conversations - Get all conversations with filters
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../../lib/database';

// Helper to check admin
async function isAdmin(db: Database, env: Record<string, unknown>, cookies: { get: (name: string) => { value?: string } | undefined }): Promise<{ isAdmin: boolean; userId?: string }> {
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
  };
}

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

    // Parse filters from query params
    const filters = {
      status: url.searchParams.get('status') || undefined,
      category: url.searchParams.get('category') || undefined,
      assignedTo: url.searchParams.get('assigned_to') || undefined,
      priority: url.searchParams.get('priority') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '50'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    const result = await db.getAllConversations(filters);

    // Get user info for each conversation
    const conversationsWithUsers = await Promise.all(
      result.conversations.map(async (conv) => {
        const user = await db.findUserById(conv.user_id);
        return {
          ...conv,
          user: user ? { id: user.id, email: user.email, name: user.name, plan: user.plan } : null,
        };
      })
    );

    return new Response(JSON.stringify({
      conversations: conversationsWithUsers,
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
