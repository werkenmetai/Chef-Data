/**
 * COMM-005: File Attachment Download Endpoint
 *
 * Handles file downloads for support message attachments.
 * Validates user access before serving files from R2.
 *
 * Routes:
 * - GET /api/support/attachments/[id] - Download attachment
 * - DELETE /api/support/attachments/[id] - Delete attachment (owner only)
 */

import type { APIRoute } from 'astro';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { Database } from '../../../../lib/database';
import { isAdminEmail } from '../../../../lib/admin';

interface AttachmentRecord {
  id: string;
  message_id: string | null;
  conversation_id: string | null;
  user_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  r2_key: string;
  uploaded_by: string;
}

export const GET: APIRoute = async ({ params, locals, cookies }) => {
  const env = locals.runtime?.env as {
    DB?: D1Database;
    ATTACHMENTS_BUCKET?: R2Bucket;
    TOKEN_ENCRYPTION_KEY?: string;
    ADMIN_EMAILS?: string;
  } | undefined;

  const attachmentId = params.id;

  if (!attachmentId) {
    return new Response(JSON.stringify({ error: 'Attachment ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env?.DB || !env?.ATTACHMENTS_BUCKET) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Authenticate user
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
  const session = await db.validateSession(sessionId);

  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get attachment metadata
  const attachment = await env.DB
    .prepare('SELECT * FROM message_attachments WHERE id = ?')
    .bind(attachmentId)
    .first<AttachmentRecord>();

  if (!attachment) {
    return new Response(JSON.stringify({ error: 'Attachment not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check access: user must own the attachment OR be admin
  const isAdmin = isAdminEmail(session.user.email, env);
  if (attachment.user_id !== session.user.id && !isAdmin) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch file from R2
  const object = await env.ATTACHMENTS_BUCKET.get(attachment.r2_key);

  if (!object) {
    console.error(`[Attachments] File not found in R2: ${attachment.r2_key}`);
    return new Response(JSON.stringify({ error: 'File not found in storage' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Return file with appropriate headers
  // Use arrayBuffer() to avoid ReadableStream type incompatibility between CF workers and standard web types
  const body = await object.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': attachment.content_type,
      'Content-Length': attachment.size_bytes.toString(),
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
};

export const DELETE: APIRoute = async ({ params, locals, cookies }) => {
  const env = locals.runtime?.env as {
    DB?: D1Database;
    ATTACHMENTS_BUCKET?: R2Bucket;
    TOKEN_ENCRYPTION_KEY?: string;
    ADMIN_EMAILS?: string;
  } | undefined;

  const attachmentId = params.id;

  if (!attachmentId) {
    return new Response(JSON.stringify({ error: 'Attachment ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env?.DB || !env?.ATTACHMENTS_BUCKET) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Authenticate user
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
  const session = await db.validateSession(sessionId);

  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get attachment metadata
  const attachment = await env.DB
    .prepare('SELECT * FROM message_attachments WHERE id = ?')
    .bind(attachmentId)
    .first<AttachmentRecord>();

  if (!attachment) {
    return new Response(JSON.stringify({ error: 'Attachment not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check access: user must own the attachment OR be admin
  const isAdmin = isAdminEmail(session.user.email, env);
  if (attachment.user_id !== session.user.id && !isAdmin) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Delete from R2
    await env.ATTACHMENTS_BUCKET.delete(attachment.r2_key);

    // Delete metadata from database
    await env.DB
      .prepare('DELETE FROM message_attachments WHERE id = ?')
      .bind(attachmentId)
      .run();

    console.log(`[Attachments] File deleted: ${attachment.r2_key} by user ${session.user.email}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Attachments] Delete error:', error);
    return new Response(
      JSON.stringify({
        error: 'Delete failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
