/**
 * Testimonial Submission API
 *
 * POST /api/feedback/testimonial
 *
 * Handles testimonial quote submissions from the thank you page.
 */

import type { APIContext } from 'astro';
import { Database } from '../../../lib/database';

interface TestimonialSubmission {
  token?: string;
  nps_score?: number;
  testimonial_quote?: string;
  testimonial_display_name?: string;
  testimonial_company?: string;
  testimonial_role?: string;
  permission_website?: string;
}

export async function POST(context: APIContext): Promise<Response> {
  const { request, cookies, locals } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const database = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);

  try {
    const contentType = request.headers.get('content-type') || '';
    let body: TestimonialSubmission;

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = {
        token: formData.get('token')?.toString(),
        nps_score: formData.get('nps_score') ? parseInt(formData.get('nps_score') as string, 10) : undefined,
        testimonial_quote: formData.get('testimonial_quote')?.toString(),
        testimonial_display_name: formData.get('testimonial_display_name')?.toString(),
        testimonial_company: formData.get('testimonial_company')?.toString(),
        testimonial_role: formData.get('testimonial_role')?.toString(),
        permission_website: formData.get('permission_website')?.toString(),
      };
    }

    // Get user ID from session or token
    let userId: string | undefined;

    // Try session first
    const sessionId = cookies.get('session_id')?.value;
    if (sessionId) {
      const sessionResult = await database.validateSession(sessionId);
      if (sessionResult) {
        userId = sessionResult.user.id;
      }
    }

    // Try token if no session
    if (!userId && body.token) {
      const campaign = await env.DB.prepare(`
        SELECT user_id FROM feedback_campaigns WHERE response_token = ?
      `).bind(body.token).first<{ user_id: string }>();

      if (campaign) {
        userId = campaign.user_id;
      }
    }

    if (!userId) {
      // Redirect to login if form submission
      if (!contentType.includes('application/json')) {
        return context.redirect('/connect?return=/feedback/thanks');
      }
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    if (!body.testimonial_quote?.trim()) {
      if (!contentType.includes('application/json')) {
        return context.redirect('/feedback/thanks?error=quote_required');
      }
      return new Response(JSON.stringify({ error: 'Quote is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build display name
    let displayName = body.testimonial_display_name?.trim() || 'Anoniem';
    if (body.testimonial_role && body.testimonial_company) {
      displayName = `${displayName}, ${body.testimonial_role} bij ${body.testimonial_company}`;
    } else if (body.testimonial_company) {
      displayName = `${displayName}, ${body.testimonial_company}`;
    } else if (body.testimonial_role) {
      displayName = `${displayName}, ${body.testimonial_role}`;
    }

    // Insert testimonial feedback
    const feedbackId = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO feedback (
        id, user_id, feedback_type, trigger_event,
        nps_score, sentiment,
        testimonial_quote, testimonial_display_name, testimonial_company, testimonial_role,
        permission_website, permission_marketing,
        source, status
      ) VALUES (?, ?, 'testimonial', 'page_submission', ?, 'positive', ?, ?, ?, ?, ?, 0, 'web', 'received')
    `).bind(
      feedbackId,
      userId,
      body.nps_score || null,
      body.testimonial_quote.trim(),
      displayName,
      body.testimonial_company || null,
      body.testimonial_role || null,
      body.permission_website === '1' || body.permission_website === 'true' ? 1 : 0
    ).run();

    // Update campaign if token was provided
    if (body.token) {
      await env.DB.prepare(`
        UPDATE feedback_campaigns
        SET responded_at = CURRENT_TIMESTAMP, status = 'responded'
        WHERE response_token = ?
      `).bind(body.token).run();
    }

    // Redirect or respond
    if (!contentType.includes('application/json')) {
      return context.redirect('/feedback/submitted?type=testimonial');
    }

    return new Response(JSON.stringify({
      success: true,
      feedback_id: feedbackId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Testimonial API] Error:', error);

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return context.redirect('/feedback/thanks?error=server_error');
    }

    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
