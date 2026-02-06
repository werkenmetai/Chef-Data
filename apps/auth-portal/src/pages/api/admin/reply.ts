/**
 * COMM-003: Email Reply API Endpoint
 *
 * POST /api/admin/reply
 *
 * Allows admins to send messages/emails to customers and non-customers.
 *
 * For CUSTOMERS (userId provided):
 * - sendEmail: true → Send email + add to dashboard
 * - sendEmail: false → Only add to dashboard (no email)
 * - Respects customer's email_support_replies preference
 * - Includes opt-out PS in emails
 *
 * For NON-CUSTOMERS (no userId):
 * - Always sends email (they have no dashboard)
 * - No opt-out PS (they're not in our system)
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../lib/database';
import { sendEmail, type Env } from '../../../lib/email';
import { escapeHtml } from '../../../lib/security';

// Generate secure random ID
function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface ReplyRequestBody {
  userId?: string;
  toEmail?: string;
  subject?: string;
  content?: string;
  conversationId?: string;
  signature?: string;
  /** If true, send email. If false, only add to dashboard. Default: true */
  sendEmail?: boolean;
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const env = (locals as { runtime?: { env: Env & { DB: unknown; TOKEN_ENCRYPTION_KEY?: string; ADMIN_EMAILS?: string } } }).runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB as import('@cloudflare/workers-types').D1Database, env.TOKEN_ENCRYPTION_KEY);

  // Verify admin session
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = await db.validateSession(sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check admin access
  const adminEmails = (env.ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e.length > 0);

  const isAdmin = adminEmails.includes(session.user.email.toLowerCase());
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden - admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse request body
  let body: ReplyRequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { userId, toEmail, subject, content, conversationId, signature } = body;
  // Default sendEmail to true
  const shouldSendEmail = body.sendEmail !== false;

  // Determine if this is a customer or non-customer
  const isCustomer = !!userId;

  // Validate required fields
  if (!toEmail || !subject || !content) {
    return new Response(JSON.stringify({ error: 'Missing required fields: toEmail, subject, content' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(toEmail)) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // For non-customers, email is mandatory (they have no dashboard)
  if (!isCustomer && !shouldSendEmail) {
    return new Response(JSON.stringify({
      error: 'Voor niet-klanten is email verplicht (zij hebben geen dashboard)',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if customer has email notifications enabled
  let customerEmailEnabled = true;
  if (isCustomer) {
    const userResult = await (env.DB as import('@cloudflare/workers-types').D1Database).prepare(`
      SELECT email_support_replies FROM users WHERE id = ?
    `).bind(userId).first<{ email_support_replies: number | null }>();

    if (userResult && userResult.email_support_replies === 0) {
      customerEmailEnabled = false;
    }
  }

  try {
    const emailId = generateId();
    let emailSent = false;
    let messageSaved = false;

    // Determine if we should actually send the email
    const willSendEmail = shouldSendEmail && (isCustomer ? customerEmailEnabled : true);

    if (willSendEmail) {
      // Build HTML email
      const htmlContent = buildAdminReplyEmail({
        subject,
        content,
        senderName: session.user.name || session.user.email,
        signature: signature || undefined,
        isCustomer,
        userId: userId || undefined,
      });

      // Send email via Resend
      emailSent = await sendEmail(env, {
        to: toEmail,
        subject: subject,
        html: htmlContent,
        text: content,
        userId: userId || undefined,
        templateName: 'admin_reply',
      });

      if (!emailSent) {
        console.error('Failed to send email');
      }
    }

    // For customers: add reply to support_messages (dashboard)
    if (isCustomer && conversationId) {
      const messageId = generateId();
      await (env.DB as import('@cloudflare/workers-types').D1Database).prepare(`
        INSERT INTO support_messages (id, conversation_id, sender_type, sender_id, content, metadata, created_at)
        VALUES (?, ?, 'admin', ?, ?, ?, datetime('now'))
      `).bind(
        messageId,
        conversationId,
        session.user.id,
        content,
        JSON.stringify({ email_sent: emailSent, send_email_requested: shouldSendEmail })
      ).run();

      // Update conversation status
      await (env.DB as import('@cloudflare/workers-types').D1Database).prepare(`
        UPDATE support_conversations SET status = 'waiting_user', updated_at = datetime('now') WHERE id = ?
      `).bind(conversationId).run();

      messageSaved = true;
    }

    // Create communication event for timeline
    await db.createCommunicationEvent({
      type: 'email',
      direction: 'in', // From customer perspective, admin reply is incoming
      userId: userId || undefined,
      subject,
      content,
      metadata: {
        template: 'admin_reply',
        sent_by: session.user.email,
        sent_by_name: session.user.name || null,
        email_id: emailId,
        conversation_id: conversationId || null,
        email_sent: emailSent,
        is_customer: isCustomer,
        to_email: toEmail,
      },
      relatedId: conversationId || emailId,
    });

    // Build response message
    let responseMessage: string;
    if (isCustomer) {
      if (shouldSendEmail) {
        if (customerEmailEnabled) {
          responseMessage = emailSent
            ? 'Reactie opgeslagen in dashboard en email verzonden'
            : 'Reactie opgeslagen in dashboard, maar email verzenden mislukt';
        } else {
          responseMessage = 'Reactie opgeslagen in dashboard (klant heeft email notificaties uitgeschakeld)';
        }
      } else {
        responseMessage = 'Reactie opgeslagen in dashboard (geen email verzonden)';
      }
    } else {
      responseMessage = emailSent
        ? 'Email verzonden naar niet-klant'
        : 'Email verzenden mislukt';
    }

    return new Response(JSON.stringify({
      success: true,
      message: responseMessage,
      emailId,
      emailSent,
      messageSaved,
      isCustomer,
      conversationId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin reply error:', error);
    return new Response(JSON.stringify({ error: 'Fout bij versturen reactie' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * Build HTML email template for admin replies
 */
function buildAdminReplyEmail(options: {
  subject: string;
  content: string;
  senderName: string;
  signature?: string;
  isCustomer: boolean;
  userId?: string;
}): string {
  // Convert line breaks to paragraphs and escape HTML
  const paragraphs = options.content
    .split('\n\n')
    .map(p => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');

  // Use custom signature if provided, otherwise default
  const signatureHtml = options.signature
    ? escapeHtml(options.signature).replace(/\n/g, '<br>')
    : `Met vriendelijke groet,<br>
      <strong>${escapeHtml(options.senderName)}</strong><br>
      Praat met je Boekhouding Support`;

  // Opt-out PS only for customers
  const optOutPs = options.isCustomer
    ? `
      <p style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9CA3AF;">
        PS: Wil je geen email notificaties meer ontvangen bij support berichten?
        <a href="https://praatmetjeboekhouding.nl/dashboard#notificaties" style="color: #6B7280;">
          Zet 'Support reacties' uit in je dashboard
        </a>.
      </p>
    `
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #0066FF; font-size: 24px; margin: 0;">Praat met je Boekhouding</h1>
  </div>

  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
    ${paragraphs}
  </div>

  <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
    <p style="margin: 0; font-size: 14px; color: #6b7280;">
      ${signatureHtml}
    </p>
  </div>

  ${optOutPs}

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
    <p>
      <a href="https://praatmetjeboekhouding.nl/docs" style="color: #0066FF;">Documentatie</a> ·
      <a href="https://praatmetjeboekhouding.nl/dashboard" style="color: #0066FF;">Dashboard</a> ·
      <a href="mailto:support@praatmetjeboekhouding.nl" style="color: #0066FF;">Support</a>
    </p>
    <p>&copy; ${new Date().getFullYear()} Chef Data B.V.</p>
  </div>

</body>
</html>
  `.trim();
}
