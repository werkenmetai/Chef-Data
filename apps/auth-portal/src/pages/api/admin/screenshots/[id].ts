/**
 * Admin Screenshot Viewer API
 *
 * GET /api/admin/screenshots/:id
 *
 * Retrieves a screenshot from R2 for admin viewing.
 * Requires admin authentication.
 *
 * @see docs/strategy/FEEDBACK-LOOP-STRATEGY.md
 */

import type { APIContext } from 'astro';
import { Database } from '../../../../lib/database';

export async function GET(context: APIContext): Promise<Response> {
  const { params, cookies, locals } = context;
  const env = locals.runtime?.env;
  const screenshotId = params.id;

  if (!screenshotId) {
    return new Response(
      JSON.stringify({ error: 'Screenshot ID required' }),
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
    // List objects to find the screenshot by ID
    // Screenshots are stored as: screenshots/{userId}/{screenshotId}.png
    const listResult = await env.SCREENSHOTS_BUCKET.list({
      prefix: 'screenshots/',
      limit: 1000,
    });

    let objectKey: string | null = null;

    for (const object of listResult.objects) {
      if (object.key.includes(screenshotId)) {
        objectKey = object.key;
        break;
      }
    }

    if (!objectKey) {
      return new Response(
        JSON.stringify({ error: 'Screenshot not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the object from R2
    const object = await env.SCREENSHOTS_BUCKET.get(objectKey);

    if (!object) {
      return new Response(
        JSON.stringify({ error: 'Screenshot not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get metadata
    const metadata = object.customMetadata || {};
    const contentType = object.httpMetadata?.contentType || 'image/png';

    // Check if expired
    if (metadata.expiresAt) {
      const expiryDate = new Date(metadata.expiresAt);
      if (expiryDate < new Date()) {
        // Delete expired screenshot
        await env.SCREENSHOTS_BUCKET.delete(objectKey);
        return new Response(
          JSON.stringify({ error: 'Screenshot expired' }),
          { status: 410, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Log access for audit
    console.log(`[Screenshot Access] admin=${session.user.email} screenshot=${screenshotId}`);

    // Return the image with appropriate headers
    return new Response(object.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'X-Screenshot-Id': screenshotId,
        'X-Screenshot-User': metadata.userId || 'unknown',
        'X-Screenshot-Created': metadata.createdAt || 'unknown',
        'X-Screenshot-Expires': metadata.expiresAt || 'unknown',
      },
    });
  } catch (error) {
    console.error('Failed to retrieve screenshot:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve screenshot' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /api/admin/screenshots/:id
 *
 * Deletes a screenshot from R2 (admin only).
 */
export async function DELETE(context: APIContext): Promise<Response> {
  const { params, cookies, locals } = context;
  const env = locals.runtime?.env;
  const screenshotId = params.id;

  if (!screenshotId) {
    return new Response(
      JSON.stringify({ error: 'Screenshot ID required' }),
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
    // List objects to find the screenshot by ID
    const listResult = await env.SCREENSHOTS_BUCKET.list({
      prefix: 'screenshots/',
      limit: 1000,
    });

    let objectKey: string | null = null;

    for (const object of listResult.objects) {
      if (object.key.includes(screenshotId)) {
        objectKey = object.key;
        break;
      }
    }

    if (!objectKey) {
      return new Response(
        JSON.stringify({ error: 'Screenshot not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete the object
    await env.SCREENSHOTS_BUCKET.delete(objectKey);

    // Log deletion for audit
    console.log(`[Screenshot Delete] admin=${session.user.email} screenshot=${screenshotId}`);

    return new Response(
      JSON.stringify({ success: true, deleted: screenshotId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Failed to delete screenshot:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete screenshot' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
