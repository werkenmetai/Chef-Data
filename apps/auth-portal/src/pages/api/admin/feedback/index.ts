/**
 * Admin Feedback Management API
 *
 * GET /api/admin/feedback - List all feedback
 * GET /api/admin/feedback?type=testimonial&status=received - Filter feedback
 */

import type { APIContext } from 'astro';
import { Database } from '../../../../lib/database';
import { requireAdmin } from '../../../../lib/admin';

export async function GET(context: APIContext): Promise<Response> {
  const { url, cookies, locals } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);

  // Validate session
  const sessionId = cookies.get('session_id')?.value;
  const session = sessionId ? await db.validateSession(sessionId) : null;

  // Check admin access
  const errorResponse = requireAdmin(session, env);
  if (errorResponse) {
    return errorResponse;
  }

  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status');
  const sentiment = url.searchParams.get('sentiment');
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  try {
    // Build query with filters
    let whereClause = '1=1';
    const params: (string | number)[] = [];

    if (type) {
      whereClause += ' AND f.feedback_type = ?';
      params.push(type);
    }

    if (status) {
      whereClause += ' AND f.status = ?';
      params.push(status);
    }

    if (sentiment) {
      whereClause += ' AND f.sentiment = ?';
      params.push(sentiment);
    }

    // Get feedback with user info
    const feedbackQuery = `
      SELECT
        f.*,
        u.email as user_email,
        u.name as user_name
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const feedback = await env.DB.prepare(feedbackQuery).bind(...params).all();

    // Get counts for dashboard
    const counts = await env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as pending_review,
        SUM(CASE WHEN feedback_type = 'nps' THEN 1 ELSE 0 END) as nps_responses,
        SUM(CASE WHEN testimonial_quote IS NOT NULL AND status = 'received' THEN 1 ELSE 0 END) as pending_testimonials,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        AVG(CASE WHEN nps_score IS NOT NULL THEN nps_score END) as avg_nps,
        SUM(CASE WHEN nps_score >= 9 THEN 1 ELSE 0 END) as promoters,
        SUM(CASE WHEN nps_score <= 6 THEN 1 ELSE 0 END) as detractors
      FROM feedback
    `).first<{
      total: number;
      pending_review: number;
      nps_responses: number;
      pending_testimonials: number;
      published: number;
      avg_nps: number;
      promoters: number;
      detractors: number;
    }>();

    // Calculate NPS score
    const totalNpsResponses = (counts?.promoters || 0) + (counts?.detractors || 0);
    const npsScore = totalNpsResponses > 0
      ? Math.round(((counts?.promoters || 0) - (counts?.detractors || 0)) / totalNpsResponses * 100)
      : null;

    return new Response(JSON.stringify({
      feedback: feedback.results,
      stats: {
        ...counts,
        nps_score: npsScore,
      },
      pagination: {
        limit,
        offset,
        has_more: (feedback.results?.length || 0) === limit,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Admin Feedback API] Error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
