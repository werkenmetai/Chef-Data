/**
 * Public Testimonials API
 *
 * GET /api/testimonials
 *
 * Returns approved testimonials for display on the website.
 * No authentication required - public endpoint.
 */

import type { APIContext } from 'astro';

interface PublicTestimonial {
  id: string;
  quote: string;
  name: string;
  company: string | null;
  role: string | null;
  nps_score: number | null;
  created_at: string;
}

export async function GET(context: APIContext): Promise<Response> {
  const { locals } = context;
  const db = locals.runtime.env.DB;

  try {
    const limit = parseInt(context.url.searchParams.get('limit') || '10', 10);
    const offset = parseInt(context.url.searchParams.get('offset') || '0', 10);

    // Fetch approved testimonials
    const result = await db.prepare(`
      SELECT
        id,
        testimonial_quote as quote,
        testimonial_display_name as name,
        testimonial_company as company,
        testimonial_role as role,
        nps_score,
        created_at
      FROM feedback
      WHERE testimonial_approved = 1
        AND permission_website = 1
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all<PublicTestimonial>();

    // Get total count
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total
      FROM feedback
      WHERE testimonial_approved = 1 AND permission_website = 1
    `).first<{ total: number }>();

    const testimonials: PublicTestimonial[] = (result.results || []).map(t => ({
      id: t.id,
      quote: t.quote,
      name: t.name || 'Tevreden klant',
      company: t.company,
      role: t.role,
      nps_score: t.nps_score,
      created_at: t.created_at,
    }));

    return new Response(JSON.stringify({
      testimonials,
      total: countResult?.total || 0,
      limit,
      offset,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('[Testimonials API] Error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
