/**
 * AIOPS-001: Response Templates API - Single Template Operations
 *
 * GET /api/admin/templates/[id] - Get single template
 * PUT /api/admin/templates/[id] - Update template
 * DELETE /api/admin/templates/[id] - Delete template
 */

import type { APIContext } from 'astro';
import { Database } from '../../../../lib/database';

// Template type definition
interface ResponseTemplate {
  id: string;
  name: string;
  category: 'bug' | 'feature' | 'question' | 'proactive' | 'general';
  subject_template: string;
  body_template: string;
  variables: string | null;
  is_active: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Helper to check admin
async function checkAdmin(
  db: Database,
  env: Record<string, unknown>,
  cookies: { get: (name: string) => { value?: string } | undefined }
): Promise<{ isAdmin: boolean; userId?: string; email?: string }> {
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
    email: session.user.email,
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

  const templateId = params.id;
  if (!templateId) {
    return new Response(JSON.stringify({ error: 'Template ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const template = await env.DB.prepare('SELECT * FROM response_templates WHERE id = ?')
      .bind(templateId)
      .first<ResponseTemplate>();

    if (!template) {
      return new Response(JSON.stringify({ error: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      template: {
        ...template,
        variables: template.variables ? JSON.parse(template.variables) : [],
        is_active: Boolean(template.is_active),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Templates API] Error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(context: APIContext): Promise<Response> {
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

  const templateId = params.id;
  if (!templateId) {
    return new Response(JSON.stringify({ error: 'Template ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if template exists
  const existing = await env.DB.prepare('SELECT id FROM response_templates WHERE id = ?')
    .bind(templateId)
    .first<{ id: string }>();

  if (!existing) {
    return new Response(JSON.stringify({ error: 'Template not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse request body
  let body: {
    name?: string;
    category?: string;
    subject_template?: string;
    body_template?: string;
    variables?: string[];
    is_active?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate category if provided
  const validCategories = ['bug', 'feature', 'question', 'proactive', 'general'];
  if (body.category && !validCategories.includes(body.category)) {
    return new Response(JSON.stringify({
      error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Build update query dynamically
    const updates: string[] = ['updated_at = ?'];
    const values: (string | number)[] = [new Date().toISOString()];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.category !== undefined) {
      updates.push('category = ?');
      values.push(body.category);
    }
    if (body.subject_template !== undefined) {
      updates.push('subject_template = ?');
      values.push(body.subject_template);
    }
    if (body.body_template !== undefined) {
      updates.push('body_template = ?');
      values.push(body.body_template);
    }
    if (body.variables !== undefined) {
      updates.push('variables = ?');
      values.push(JSON.stringify(body.variables));
    }
    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(body.is_active ? 1 : 0);
    }

    values.push(templateId);

    await env.DB.prepare(`UPDATE response_templates SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    // Fetch updated template
    const template = await env.DB.prepare('SELECT * FROM response_templates WHERE id = ?')
      .bind(templateId)
      .first<ResponseTemplate>();

    return new Response(JSON.stringify({
      success: true,
      template: {
        ...template,
        variables: template?.variables ? JSON.parse(template.variables) : [],
        is_active: Boolean(template?.is_active),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Templates API] Error updating template:', error);
    return new Response(JSON.stringify({ error: 'Failed to update template' }), {
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

  const templateId = params.id;
  if (!templateId) {
    return new Response(JSON.stringify({ error: 'Template ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await env.DB.prepare('DELETE FROM response_templates WHERE id = ?')
      .bind(templateId)
      .run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Template deleted',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Templates API] Error deleting template:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete template' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
