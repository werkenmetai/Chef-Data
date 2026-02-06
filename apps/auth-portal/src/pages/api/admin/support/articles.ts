/**
 * Admin Knowledge Base Articles API Endpoint
 *
 * GET /api/admin/support/articles - Get all articles (including unpublished)
 * POST /api/admin/support/articles - Create new article
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../../lib/database';

// Helper to check admin
async function isAdmin(db: Database, env: Record<string, unknown>, cookies: { get: (name: string) => { value?: string } | undefined }): Promise<boolean> {
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) return false;

  const session = await db.validateSession(sessionId);
  if (!session) return false;

  const adminEmails = ((env.ADMIN_EMAILS as string) || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  const userEmail = session.user.email.toLowerCase();
  return adminEmails.length > 0 && adminEmails.includes(userEmail);
}

export const GET: APIRoute = async ({ cookies, locals }) => {
  try {
    const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);

    if (!(await isAdmin(db, env, cookies))) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const articles = await db.getAllArticles();

    return new Response(JSON.stringify({ articles }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get articles error:', error);
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

    if (!(await isAdmin(db, env, cookies))) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as {
      slug: string;
      title_nl: string;
      title_en?: string;
      content_nl: string;
      content_en?: string;
      category: string;
      tags?: string[];
      published?: boolean;
      featured?: boolean;
    };

    if (!body.slug || !body.title_nl || !body.content_nl || !body.category) {
      return new Response(JSON.stringify({ error: 'Required fields: slug, title_nl, content_nl, category' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if slug already exists
    const existing = await db.getArticle(body.slug);
    if (existing) {
      return new Response(JSON.stringify({ error: 'Article with this slug already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const article = await db.createArticle(body);

    return new Response(JSON.stringify({ article }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create article error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
