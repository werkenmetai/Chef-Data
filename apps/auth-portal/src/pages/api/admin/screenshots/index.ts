/**
 * Admin Screenshots List API
 *
 * GET /api/admin/screenshots
 *
 * Lists all screenshots from R2 for admin viewing.
 * Requires admin authentication.
 *
 * @see docs/strategy/FEEDBACK-LOOP-STRATEGY.md
 */

import type { APIContext } from 'astro';
import { Database } from '../../../../lib/database';

interface ScreenshotListItem {
  id: string;
  key: string;
  userId: string;
  feedbackId?: string;
  errorType?: string;
  size: number;
  createdAt: string;
  expiresAt: string;
}

export async function GET(context: APIContext): Promise<Response> {
  const { url, cookies, locals } = context;
  const env = locals.runtime?.env;

  // Check if R2 bucket is available
  if (!env?.SCREENSHOTS_BUCKET) {
    return new Response(
      JSON.stringify({ error: 'Screenshot storage not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check if database is available
  if (!env?.DB) {
    return new Response(
      JSON.stringify({ error: 'Database not available' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Authenticate admin
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
  const session = await db.validateSession(sessionId);

  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Invalid session' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check if user is admin
  const adminEmails = (env.ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e.length > 0);

  const isAdmin = adminEmails.includes(session.user.email.toLowerCase());

  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Admin access required' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse query parameters
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const cursor = url.searchParams.get('cursor') || undefined;
  const userId = url.searchParams.get('userId');

  try {
    // List objects from R2
    const listOptions: R2ListOptions = {
      prefix: userId ? `screenshots/${userId}/` : 'screenshots/',
      limit: Math.min(limit, 100),
      cursor,
    };

    const listResult = await env.SCREENSHOTS_BUCKET.list(listOptions);

    // Get metadata for each object
    const screenshots: ScreenshotListItem[] = [];
    const now = new Date();

    for (const object of listResult.objects) {
      // Extract screenshot ID from key: screenshots/{userId}/{screenshotId}.png
      const keyParts = object.key.split('/');
      const filename = keyParts[keyParts.length - 1];
      const screenshotId = filename.replace('.png', '').replace('.jpg', '').replace('.webp', '');
      const objectUserId = keyParts[1] || 'unknown';

      // Get full object to access custom metadata
      const fullObject = await env.SCREENSHOTS_BUCKET.head(object.key);

      const metadata = fullObject?.customMetadata || {};
      const expiresAt = metadata.expiresAt || '';

      // Skip expired screenshots (they'll be cleaned up separately)
      if (expiresAt && new Date(expiresAt) < now) {
        continue;
      }

      screenshots.push({
        id: screenshotId,
        key: object.key,
        userId: metadata.userId || objectUserId,
        feedbackId: metadata.feedbackId || undefined,
        errorType: metadata.errorType || undefined,
        size: object.size,
        createdAt: metadata.createdAt || object.uploaded.toISOString(),
        expiresAt: expiresAt,
      });
    }

    // Sort by creation date (newest first)
    screenshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return new Response(
      JSON.stringify({
        screenshots,
        cursor: listResult.truncated ? listResult.cursor : null,
        hasMore: listResult.truncated,
        total: screenshots.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Failed to list screenshots:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list screenshots' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /api/admin/screenshots/cleanup
 *
 * Cleans up expired screenshots (can be called by cron or manually).
 */
export async function POST(context: APIContext): Promise<Response> {
  const { url, cookies, locals } = context;
  const env = locals.runtime?.env;

  // Check action
  const action = url.searchParams.get('action');
  if (action !== 'cleanup') {
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check if R2 bucket is available
  if (!env?.SCREENSHOTS_BUCKET) {
    return new Response(
      JSON.stringify({ error: 'Screenshot storage not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check if database is available
  if (!env?.DB) {
    return new Response(
      JSON.stringify({ error: 'Database not available' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Authenticate admin
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
  const session = await db.validateSession(sessionId);

  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Invalid session' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check if user is admin
  const adminEmails = (env.ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e.length > 0);

  const isAdmin = adminEmails.includes(session.user.email.toLowerCase());

  if (!isAdmin) {
    return new Response(
      JSON.stringify({ error: 'Admin access required' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // List all objects
    let cursor: string | undefined;
    let deleted = 0;
    const now = new Date();

    do {
      const listResult = await env.SCREENSHOTS_BUCKET.list({
        prefix: 'screenshots/',
        limit: 100,
        cursor,
      });

      for (const object of listResult.objects) {
        const fullObject = await env.SCREENSHOTS_BUCKET.head(object.key);
        const expiresAt = fullObject?.customMetadata?.expiresAt;

        if (expiresAt && new Date(expiresAt) < now) {
          await env.SCREENSHOTS_BUCKET.delete(object.key);
          deleted++;
          console.log(`[Screenshot Cleanup] Deleted expired: ${object.key}`);
        }
      }

      cursor = listResult.truncated ? listResult.cursor : undefined;
    } while (cursor);

    return new Response(
      JSON.stringify({
        success: true,
        deleted,
        timestamp: now.toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Failed to cleanup screenshots:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to cleanup screenshots' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
