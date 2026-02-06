/**
 * Screenshot Upload API
 *
 * POST /api/screenshots/upload
 *
 * Handles the actual upload of screenshot data to R2.
 * Validates signature from signed-url endpoint.
 *
 * @see docs/strategy/FEEDBACK-LOOP-STRATEGY.md
 */

import type { APIContext } from 'astro';
import type { ScreenshotMetadata } from '../../../lib/screenshots';

export async function POST(context: APIContext): Promise<Response> {
  const { request, url, locals } = context;
  const env = locals.runtime?.env;

  // Check if R2 bucket is available
  if (!env?.SCREENSHOTS_BUCKET) {
    return new Response(
      JSON.stringify({ error: 'Screenshot storage not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get query parameters
  const screenshotId = url.searchParams.get('id');
  const objectKey = url.searchParams.get('key');
  const signature = url.searchParams.get('sig');
  const metaBase64 = url.searchParams.get('meta');

  if (!screenshotId || !objectKey || !signature || !metaBase64) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Decode and validate metadata
  let metadata: ScreenshotMetadata;
  try {
    const metadataJson = atob(metaBase64);
    metadata = JSON.parse(metadataJson);

    // Verify signature
    const encoder = new TextEncoder();
    const data = encoder.encode(metadataJson + (env.SESSION_SECRET || 'default-secret'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);

    if (signature !== expectedSignature) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if upload is expired (give 5 minute window)
    const now = new Date();
    const createdAt = new Date(metadata.createdAt);
    const fiveMinutes = 5 * 60 * 1000;

    if (now.getTime() - createdAt.getTime() > fiveMinutes) {
      return new Response(
        JSON.stringify({ error: 'Upload URL expired' }),
        { status: 410, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Failed to parse metadata:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid metadata' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get the request body (image data)
  const contentType = request.headers.get('Content-Type') || 'image/png';

  // Validate content type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(contentType)) {
    return new Response(
      JSON.stringify({ error: 'Invalid content type. Allowed: png, jpeg, webp' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Read the body
  const body = await request.arrayBuffer();

  // Validate size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (body.byteLength > maxSize) {
    return new Response(
      JSON.stringify({ error: 'Image too large (max 5MB)' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Update metadata with actual size
  metadata.size = body.byteLength;
  metadata.contentType = contentType;

  try {
    // Upload to R2
    await env.SCREENSHOTS_BUCKET.put(objectKey, body, {
      httpMetadata: {
        contentType,
        cacheControl: 'private, max-age=86400', // 1 day cache
      },
      customMetadata: {
        id: metadata.id,
        userId: metadata.userId,
        feedbackId: metadata.feedbackId || '',
        errorType: metadata.errorType || '',
        createdAt: metadata.createdAt,
        expiresAt: metadata.expiresAt,
      },
    });

    // Log the upload for audit
    console.log(`[Screenshot Upload] id=${screenshotId} user=${metadata.userId} size=${body.byteLength} bytes`);

    return new Response(
      JSON.stringify({
        success: true,
        screenshotId,
        size: body.byteLength,
        expiresAt: metadata.expiresAt,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Failed to upload to R2:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to store screenshot' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
