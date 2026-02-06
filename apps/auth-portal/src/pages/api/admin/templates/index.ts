/**
 * AIOPS-001: Response Templates API
 *
 * GET /api/admin/templates - List all templates
 * POST /api/admin/templates - Create new template
 */

import type { APIContext } from 'astro';
import { Database } from '../../../../lib/database';
import { requireAdmin } from '../../../../lib/admin';

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

// Generate secure random ID
function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return 'tpl_' + Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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

  try {
    // Get query params for filtering
    const category = url.searchParams.get('category');
    const activeOnly = url.searchParams.get('active') === 'true';

    let query = 'SELECT * FROM response_templates WHERE 1=1';
    const params: (string | number)[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (activeOnly) {
      query += ' AND is_active = 1';
    }

    query += ' ORDER BY category, name';

    const result = await env.DB.prepare(query).bind(...params).all<ResponseTemplate>();

    // Parse variables JSON for each template
    const templates = (result.results || []).map(tpl => ({
      ...tpl,
      variables: tpl.variables ? JSON.parse(tpl.variables) : [],
      is_active: Boolean(tpl.is_active),
    }));

    return new Response(JSON.stringify({
      templates,
      total: templates.length,
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

export async function POST(context: APIContext): Promise<Response> {
  const { request, cookies, locals } = context;
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

  // Validate required fields
  const { name, category, subject_template, body_template, variables, is_active } = body;

  if (!name || !category || !subject_template || !body_template) {
    return new Response(JSON.stringify({
      error: 'Missing required fields: name, category, subject_template, body_template'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate category
  const validCategories = ['bug', 'feature', 'question', 'proactive', 'general'];
  if (!validCategories.includes(category)) {
    return new Response(JSON.stringify({
      error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const id = generateId();
    const now = new Date().toISOString();
    const variablesJson = variables ? JSON.stringify(variables) : null;

    await env.DB.prepare(`
      INSERT INTO response_templates (id, name, category, subject_template, body_template, variables, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      name,
      category,
      subject_template,
      body_template,
      variablesJson,
      is_active !== false ? 1 : 0,
      now,
      now
    ).run();

    // Fetch the created template
    const template = await env.DB.prepare('SELECT * FROM response_templates WHERE id = ?')
      .bind(id)
      .first<ResponseTemplate>();

    return new Response(JSON.stringify({
      success: true,
      template: {
        ...template,
        variables: template?.variables ? JSON.parse(template.variables) : [],
        is_active: Boolean(template?.is_active),
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Templates API] Error creating template:', error);
    return new Response(JSON.stringify({ error: 'Failed to create template' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
