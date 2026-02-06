/**
 * Knowledge Base Articles API Endpoint
 *
 * GET /api/support/articles - List/search published articles
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../../lib/database';

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);

    const query = url.searchParams.get('q');
    const category = url.searchParams.get('category');
    const lang = (url.searchParams.get('lang') || 'nl') as 'nl' | 'en';
    const featured = url.searchParams.get('featured') === 'true';

    let articles;

    if (query) {
      // Search articles
      articles = await db.searchArticles(query, lang);
    } else if (featured) {
      // Get featured articles
      articles = await db.getFeaturedArticles();
    } else {
      // Get all published articles (optionally filtered by category)
      articles = await db.getPublishedArticles(category || undefined);
    }

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
