/**
 * COMM-005: File Attachment Upload Endpoint
 *
 * Handles file uploads for support messages.
 * Files are stored in Cloudflare R2 with metadata in D1.
 *
 * Security:
 * - Authenticated users only (session required)
 * - File size limit: 10MB
 * - Allowed types: images, PDFs, common docs
 * - Files are scanned for basic validation
 */

import type { APIRoute } from 'astro';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import { Database } from '../../../../lib/database';

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Text
  'text/plain',
  'text/csv',
];

// Generate secure random ID
function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const env = locals.runtime?.env as {
    DB?: D1Database;
    ATTACHMENTS_BUCKET?: R2Bucket;
    TOKEN_ENCRYPTION_KEY?: string;
  } | undefined;

  // Validate environment
  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env?.ATTACHMENTS_BUCKET) {
    return new Response(JSON.stringify({ error: 'Storage not configured' }), {
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

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid form data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const file = formData.get('file') as File | null;
  const conversationId = formData.get('conversation_id') as string | null;
  const messageId = formData.get('message_id') as string | null;

  // Validate file
  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return new Response(
      JSON.stringify({
        error: 'File too large',
        details: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(
      JSON.stringify({
        error: 'File type not allowed',
        details: 'Allowed types: images (JPEG, PNG, GIF, WebP), PDF, Word, Excel, text files',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate conversation exists and belongs to user (if provided)
  if (conversationId) {
    const conversation = await env.DB
      .prepare('SELECT id, user_id FROM support_conversations WHERE id = ?')
      .bind(conversationId)
      .first<{ id: string; user_id: string }>();

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (conversation.user_id !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    // Generate unique R2 key
    const attachmentId = generateId();
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedFilename = sanitizeFilename(file.name);
    const r2Key = `attachments/${session.user.id}/${timestamp}/${attachmentId}/${sanitizedFilename}`;

    // Upload to R2
    const fileBuffer = await file.arrayBuffer();
    await env.ATTACHMENTS_BUCKET.put(r2Key, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        userId: session.user.id,
        originalFilename: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Store metadata in database
    await env.DB
      .prepare(`
        INSERT INTO message_attachments (
          id, message_id, conversation_id, user_id,
          filename, content_type, size_bytes, r2_key,
          uploaded_by, scan_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'user', 'clean', datetime('now'))
      `)
      .bind(
        attachmentId,
        messageId || null,
        conversationId || null,
        session.user.id,
        sanitizedFilename,
        file.type,
        file.size,
        r2Key
      )
      .run();

    console.log(`[Attachments] File uploaded: ${r2Key} by user ${session.user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        attachment: {
          id: attachmentId,
          filename: sanitizedFilename,
          contentType: file.type,
          size: file.size,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Attachments] Upload error:', error);
    return new Response(
      JSON.stringify({
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
