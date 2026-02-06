/**
 * Admin Support Lessons API Endpoint
 *
 * GET /api/admin/support/lessons - Get all lessons
 * POST /api/admin/support/lessons - Create new lesson
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

    const limit = parseInt(url.searchParams.get('limit') || '50');
    const lessons = await db.getLessons(limit);

    return new Response(JSON.stringify({ lessons }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get lessons error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ cookies, locals, request }) => {
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

    const body = await request.json() as {
      conversation_id?: string;
      title: string;
      description: string;
      root_cause?: string;
      solution?: string;
      prevention?: string;
      category?: string;
      tags?: string[];
      created_pattern_id?: string;
      created_article_id?: string;
      code_fix_pr?: string;
    };

    if (!body.title || !body.description) {
      return new Response(JSON.stringify({ error: 'Title and description are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lesson = await db.createLesson({
      ...body,
      created_by: admin.userId!,
    });

    return new Response(JSON.stringify({ lesson }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create lesson error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
