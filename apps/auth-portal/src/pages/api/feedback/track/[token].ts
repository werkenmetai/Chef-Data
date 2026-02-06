/**
 * Email Tracking API
 *
 * GET /api/feedback/track/[token]
 *
 * Tracks email opens (via 1x1 pixel) and clicks.
 * Token is the tracking_token from feedback_campaigns.
 */

import type { APIContext } from 'astro';

// 1x1 transparent GIF
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(context: APIContext): Promise<Response> {
  const { params, request, locals } = context;
  const db = locals.runtime.env.DB;

  const token = params.token;
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'open';
  const redirect = url.searchParams.get('redirect');

  if (!token) {
    return new Response('Invalid token', { status: 400 });
  }

  try {
    // Find the campaign
    const campaign = await db.prepare(`
      SELECT id, status FROM feedback_campaigns WHERE tracking_token = ?
    `).bind(token).first<{ id: string; status: string }>();

    if (campaign) {
      // Update based on action
      if (action === 'open' && campaign.status === 'sent') {
        await db.prepare(`
          UPDATE feedback_campaigns
          SET opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP), status = 'opened'
          WHERE id = ?
        `).bind(campaign.id).run();
      } else if (action === 'click') {
        await db.prepare(`
          UPDATE feedback_campaigns
          SET clicked_at = COALESCE(clicked_at, CURRENT_TIMESTAMP), status = 'clicked'
          WHERE id = ? AND status IN ('sent', 'opened')
        `).bind(campaign.id).run();
      }
    }

    // If this is a click with redirect, send them there
    if (action === 'click' && redirect) {
      const decodedRedirect = decodeURIComponent(redirect);

      // SEC-001: Validate redirect URL to prevent open redirect attacks
      const isValidRedirect = (url: string): boolean => {
        // Allow relative paths
        if (url.startsWith('/') && !url.startsWith('//')) {
          return true;
        }
        // Allow only praatmetjeboekhouding.nl domain
        try {
          const parsed = new URL(url);
          return parsed.hostname === 'praatmetjeboekhouding.nl' ||
                 parsed.hostname.endsWith('.praatmetjeboekhouding.nl');
        } catch {
          return false;
        }
      };

      if (!isValidRedirect(decodedRedirect)) {
        console.warn('[Email Tracking] Blocked invalid redirect:', decodedRedirect);
        return new Response('Invalid redirect URL', { status: 400 });
      }

      return new Response(null, {
        status: 302,
        headers: {
          'Location': decodedRedirect,
          'Cache-Control': 'no-store',
        },
      });
    }

    // Return tracking pixel for opens
    return new Response(TRACKING_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('[Email Tracking] Error:', error);

    // Still return something so email clients don't show broken images
    return new Response(TRACKING_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store',
      },
    });
  }
}
