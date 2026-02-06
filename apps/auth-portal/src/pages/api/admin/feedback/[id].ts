/**
 * Admin Feedback Item API
 *
 * GET /api/admin/feedback/[id] - Get single feedback
 * PATCH /api/admin/feedback/[id] - Update feedback (approve testimonial, etc.)
 * DELETE /api/admin/feedback/[id] - Delete feedback
 */

import type { APIContext } from 'astro';
import { Database } from '../../../../lib/database';

interface UpdateFeedback {
  status?: 'received' | 'reviewed' | 'published' | 'archived' | 'spam';
  testimonial_approved?: boolean;
  testimonial_quote?: string;
  testimonial_display_name?: string;
  admin_notes?: string;
}

// Helper to check admin
async function checkAdmin(
  db: Database,
  env: Record<string, unknown>,
  cookies: { get: (name: string) => { value?: string } | undefined }
): Promise<{ isAdmin: boolean; userId?: string }> {
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

export async function GET(context: APIContext): Promise<Response> {
  const { params, cookies, locals } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);
  const admin = await checkAdmin(db, env, cookies);

  if (!admin.isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = params;

  try {
    const feedback = await env.DB.prepare(`
      SELECT
        f.*,
        u.email as user_email,
        u.name as user_name,
        u.created_at as user_created_at
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.id = ?
    `).bind(id).first();

    if (!feedback) {
      return new Response(JSON.stringify({ error: 'Feedback not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user's other feedback for context
    const otherFeedback = await env.DB.prepare(`
      SELECT id, feedback_type, nps_score, sentiment, created_at
      FROM feedback
      WHERE user_id = (SELECT user_id FROM feedback WHERE id = ?)
        AND id != ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(id, id).all();

    return new Response(JSON.stringify({
      feedback,
      user_history: otherFeedback.results,
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

export async function PATCH(context: APIContext): Promise<Response> {
  const { params, request, cookies, locals } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);
  const admin = await checkAdmin(db, env, cookies);

  if (!admin.isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = params;
  const body = await request.json() as UpdateFeedback;

  try {
    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.status !== undefined) {
      updates.push('status = ?');
      values.push(body.status);

      // If publishing, set reviewed timestamp
      if (body.status === 'published' || body.status === 'reviewed') {
        updates.push('reviewed_at = CURRENT_TIMESTAMP');
        updates.push('reviewed_by = ?');
        values.push(admin.userId || 'admin');
      }
    }

    if (body.testimonial_approved !== undefined) {
      updates.push('testimonial_approved = ?');
      values.push(body.testimonial_approved ? 1 : 0);
    }

    if (body.testimonial_quote !== undefined) {
      updates.push('testimonial_quote = ?');
      values.push(body.testimonial_quote);
    }

    if (body.testimonial_display_name !== undefined) {
      updates.push('testimonial_display_name = ?');
      values.push(body.testimonial_display_name);
    }

    if (body.admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      values.push(body.admin_notes);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (id === undefined) {
      return new Response(JSON.stringify({ error: 'Missing feedback ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    values.push(id);

    await env.DB.prepare(`
      UPDATE feedback SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    // Fetch updated record
    const updated = await env.DB.prepare(`
      SELECT * FROM feedback WHERE id = ?
    `).bind(id).first();

    return new Response(JSON.stringify({
      success: true,
      feedback: updated,
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

export async function DELETE(context: APIContext): Promise<Response> {
  const { params, cookies, locals } = context;
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);
  const admin = await checkAdmin(db, env, cookies);

  if (!admin.isAdmin) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = params;

  try {
    await env.DB.prepare(`DELETE FROM feedback WHERE id = ?`).bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
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
