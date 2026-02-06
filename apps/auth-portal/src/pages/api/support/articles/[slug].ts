/**
 * Knowledge Base Article Detail API Endpoint
 *
 * GET /api/support/articles/[slug] - Get article by slug
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../../lib/database';

export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);

    const slug = params.slug;
    if (!slug) {
      return new Response(JSON.stringify({ error: 'Article slug required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const article = await db.getArticle(slug);

    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only return published articles (unless admin - but we check that elsewhere)
    if (!article.published) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Track view
    await db.trackArticleView(slug);

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
