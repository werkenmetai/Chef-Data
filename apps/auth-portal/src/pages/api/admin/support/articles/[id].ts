/**
 * Admin Article Detail API Endpoint
 *
 * GET /api/admin/support/articles/[id] - Get article
 * PUT /api/admin/support/articles/[id] - Update article
 * DELETE /api/admin/support/articles/[id] - Delete article
 */

import type { APIRoute } from 'astro';
import { Database, type KnowledgeArticle } from '../../../../../lib/database';

interface UpdateArticleBody extends Partial<KnowledgeArticle> {
  published_at?: string;
}

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

export const GET: APIRoute = async ({ cookies, locals, params }) => {
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

    const articleId = params.id;
    if (!articleId) {
      return new Response(JSON.stringify({ error: 'Article ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const article = await db.getArticleById(articleId);
    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ article }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get article error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ cookies, locals, params, request }) => {
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

    const articleId = params.id;
    if (!articleId) {
      return new Response(JSON.stringify({ error: 'Article ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const article = await db.getArticleById(articleId);
    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as UpdateArticleBody;

    // If publishing, set published_at
    const updates: UpdateArticleBody = { ...body };
    if (body.published && !article.published) {
      updates.published_at = new Date().toISOString();
    }

    await db.updateArticle(articleId, updates);

    const updatedArticle = await db.getArticleById(articleId);

    return new Response(JSON.stringify({ article: updatedArticle }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update article error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ cookies, locals, params }) => {
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

    const articleId = params.id;
    if (!articleId) {
      return new Response(JSON.stringify({ error: 'Article ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const deleted = await db.deleteArticle(articleId);
    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete article error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
