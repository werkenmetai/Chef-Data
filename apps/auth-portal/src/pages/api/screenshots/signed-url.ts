/**
 * Screenshot Upload Signed URL API
 *
 * POST /api/screenshots/signed-url
 *
 * Generates a pre-signed URL for uploading error screenshots to R2.
 * The screenshot is stored with 30-day auto-expiry and linked to feedback.
 *
 * @see docs/strategy/FEEDBACK-LOOP-STRATEGY.md
 */

import type { APIContext } from 'astro';
import { Database } from '../../../lib/database';
import {
  generateScreenshotId,
  calculateExpiryDate,
  type ScreenshotMetadata,
} from '../../../lib/screenshots';

interface SignedUrlRequest {
  feedbackId?: string;
  errorType?: string;
  errorMessage?: string;
  contentType?: string;
}

interface SignedUrlResponse {
  uploadUrl: string;
  screenshotId: string;
  expiresAt: string;
}

export async function POST(context: APIContext): Promise<Response> {
  const { request, cookies, locals } = context;
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

  // Authenticate user (optional - allow anonymous for error reporting)
  let userId: string | undefined;
  const sessionId = cookies.get('session_id')?.value;

  if (sessionId) {
    try {
      const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
      const session = await db.validateSession(sessionId);
      if (session) {
        userId = session.user.id;
      }
    } catch (error) {
      console.warn('Session validation failed:', error);
    }
  }

  // Parse request body
  let body: SignedUrlRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Generate screenshot ID and metadata
  const screenshotId = generateScreenshotId();
  const expiresAt = calculateExpiryDate();
  const contentType = body.contentType || 'image/png';

  // Create metadata object for R2 custom metadata
  const metadata: ScreenshotMetadata = {
    id: screenshotId,
    userId: userId || 'anonymous',
    feedbackId: body.feedbackId,
    errorType: body.errorType,
    errorMessage: body.errorMessage ? body.errorMessage.substring(0, 500) : undefined,
    contentType,
    size: 0, // Will be updated after upload
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  // R2 key path: screenshots/{userId}/{screenshotId}.png
  const objectKey = `screenshots/${userId || 'anonymous'}/${screenshotId}.png`;

  try {
    // For Cloudflare R2, we use direct upload with the Workers API
    // Since R2 doesn't have true pre-signed URLs in Workers, we return
    // a custom upload endpoint URL that will handle the actual upload
    const uploadUrl = `/api/screenshots/upload?id=${screenshotId}&key=${encodeURIComponent(objectKey)}`;

    // Store pending upload info in a temporary KV or just validate on upload
    // For now, we encode the metadata in the URL (signed with a simple hash)
    const metadataJson = JSON.stringify(metadata);
    const encoder = new TextEncoder();
    const data = encoder.encode(metadataJson + (env.SESSION_SECRET || 'default-secret'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);

    const signedUploadUrl = `${uploadUrl}&sig=${signature}&meta=${encodeURIComponent(btoa(metadataJson))}`;

    const response: SignedUrlResponse = {
      uploadUrl: signedUploadUrl,
      screenshotId,
      expiresAt,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate upload URL' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
