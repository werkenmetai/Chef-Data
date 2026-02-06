/**
 * Article Feedback API Endpoint
 *
 * POST /api/support/articles/[slug]/feedback - Submit helpful/not helpful feedback
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../../../lib/database';

export const POST: APIRoute = async ({ locals, params, request }) => {
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

    // Parse request
    const body = await request.json() as { helpful: boolean };
    if (typeof body.helpful !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Helpful field required (boolean)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if article exists
    const article = await db.getArticle(slug);
    if (!article || !article.published) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Track feedback
    await db.trackArticleFeedback(slug, body.helpful);

    return new Response(JSON.stringify({
      success: true,
      message: 'Feedback submitted',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Article feedback error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
