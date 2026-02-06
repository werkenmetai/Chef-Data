/**
 * Resend Inbound Email Webhook Handler
 *
 * Receives inbound emails from Resend and stores them in the support system.
 *
 * Webhook URL: https://praatmetjeboekhouding.nl/api/email/inbound
 *
 * Required environment variables:
 * - RESEND_WEBHOOK_SECRET: Webhook signing secret from Resend dashboard
 *
 * Flow:
 * 1. Customer replies to support email or emails support@praatmetjeboekhouding.nl
 * 2. Resend receives the email and forwards to this webhook
 * 3. We match the sender to a user in our database
 * 4. Create or update support conversation
 * 5. Add message to support_messages
 * 6. Send admin notification
 */

import type { APIRoute } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';
import { sendAdminAlert, sendEmail, supportReplyNotificationEmail, supportAcknowledgmentEmail } from '../../../lib/email';
import { escapeHtml, isValidEmail } from '../../../lib/security';

// Resend webhook payload types
interface ResendInboundEmail {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  reply_to?: string;
  subject: string;
  text?: string;
  html?: string;
  created_at: string;
  headers?: Array<{ name: string; value: string }>;
  attachments?: Array<{
    filename: string;
    content_type: string;
    size: number;
  }>;
}

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: ResendInboundEmail;
}

// Generate secure random ID
function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify Resend webhook signature using Svix
 * Resend uses Svix for webhook delivery, which uses HMAC SHA256
 */
async function verifyResendSignature(
  payload: string,
  headers: Headers,
  secret: string
): Promise<boolean> {
  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.warn('[Inbound Email] Missing Svix headers');
    return false;
  }

  // Check timestamp to prevent replay attacks (5 minute tolerance)
  const timestamp = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    console.warn('[Inbound Email] Timestamp too old or in future');
    return false;
  }

  // Construct the signed payload
  const signedPayload = `${svixId}.${svixTimestamp}.${payload}`;

  // Parse the secret (base64 encoded, may have "whsec_" prefix)
  const secretKey = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const secretBytes = Uint8Array.from(atob(secretKey), (c) => c.charCodeAt(0));

  // Create HMAC signature
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedPayload)
  );

  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  // Svix signature header can contain multiple signatures (v1,signature v1,signature2)
  const signatures = svixSignature.split(' ');
  for (const sig of signatures) {
    const [version, signature] = sig.split(',');
    if (version === 'v1' && signature === expectedSignature) {
      return true;
    }
  }

  console.warn('[Inbound Email] Signature verification failed');
  return false;
}

/**
 * Extract and validate email address from "Name <email>" format
 * SEC-002: Uses strict RFC 5322 compliant email validation
 */
function extractEmail(from: string): string | null {
  const match = from.match(/<([^>]+)>/);
  const email = match ? match[1].toLowerCase() : from.toLowerCase().trim();

  // SEC-002: Validate email format before processing
  if (!isValidEmail(email)) {
    console.warn(`[Inbound Email] Invalid email format: ${email}`);
    return null;
  }

  return email;
}

/**
 * Extract name from "Name <email>" format
 */
function extractName(from: string): string | null {
  const match = from.match(/^([^<]+)\s*</);
  return match ? match[1].trim() : null;
}

/**
 * Find user by email (checks primary email and aliases)
 */
async function findUserByEmail(
  db: D1Database,
  email: string
): Promise<{ id: string; email: string; name: string | null } | null> {
  const normalizedEmail = email.toLowerCase();

  // First check primary email
  const primaryResult = await db
    .prepare('SELECT id, email, name FROM users WHERE LOWER(email) = ?')
    .bind(normalizedEmail)
    .first<{ id: string; email: string; name: string | null }>();

  if (primaryResult) {
    return primaryResult;
  }

  // Check email aliases
  const aliasResult = await db
    .prepare(`
      SELECT u.id, u.email, u.name
      FROM users u
      INNER JOIN user_email_aliases a ON u.id = a.user_id
      WHERE LOWER(a.email) = ?
    `)
    .bind(normalizedEmail)
    .first<{ id: string; email: string; name: string | null }>();

  return aliasResult || null;
}

/**
 * Find existing open conversation for user
 */
async function findOpenConversation(
  db: D1Database,
  userId: string
): Promise<{ id: string; subject: string } | null> {
  const result = await db
    .prepare(`
      SELECT id, subject FROM support_conversations
      WHERE user_id = ? AND status NOT IN ('resolved', 'closed')
      ORDER BY updated_at DESC
      LIMIT 1
    `)
    .bind(userId)
    .first<{ id: string; subject: string }>();
  return result || null;
}

/**
 * Create new support conversation
 */
async function createConversation(
  db: D1Database,
  userId: string,
  subject: string,
  category: string = 'other'
): Promise<string> {
  const id = generateId();
  await db
    .prepare(`
      INSERT INTO support_conversations (id, user_id, subject, status, priority, category, created_at, updated_at)
      VALUES (?, ?, ?, 'open', 'normal', ?, datetime('now'), datetime('now'))
    `)
    .bind(id, userId, subject, category)
    .run();
  return id;
}

/**
 * Add message to conversation
 */
async function addMessage(
  db: D1Database,
  conversationId: string,
  senderId: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const id = generateId();
  await db
    .prepare(`
      INSERT INTO support_messages (id, conversation_id, sender_type, sender_id, content, metadata, created_at)
      VALUES (?, ?, 'user', ?, ?, ?, datetime('now'))
    `)
    .bind(id, conversationId, senderId, content, metadata ? JSON.stringify(metadata) : null)
    .run();

  // Update conversation timestamp and status
  await db
    .prepare(`
      UPDATE support_conversations
      SET updated_at = datetime('now'), status = 'open'
      WHERE id = ?
    `)
    .bind(conversationId)
    .run();

  return id;
}

/**
 * Create communication event for timeline
 */
async function createCommunicationEvent(
  db: D1Database,
  userId: string,
  subject: string,
  content: string,
  conversationId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const id = generateId();
  await db
    .prepare(`
      INSERT INTO communication_events (id, type, direction, user_id, subject, content, metadata, related_id, created_at)
      VALUES (?, 'email', 'out', ?, ?, ?, ?, ?, datetime('now'))
    `)
    .bind(id, userId, subject, content, JSON.stringify(metadata), conversationId)
    .run();
}

/**
 * Store unknown sender email for manual review
 */
async function storeUnknownSenderEmail(
  db: D1Database,
  email: ResendInboundEmail
): Promise<void> {
  // Store in a simple log table or just log for now
  console.log('[Inbound Email] Unknown sender, storing for review:', {
    from: email.from,
    subject: email.subject,
    received_at: new Date().toISOString(),
  });

  // Create a system-level communication event (no user_id)
  const id = generateId();
  await db
    .prepare(`
      INSERT INTO communication_events (id, type, direction, user_id, subject, content, metadata, created_at)
      VALUES (?, 'email', 'out', NULL, ?, ?, ?, datetime('now'))
    `)
    .bind(
      id,
      email.subject || '(geen onderwerp)',
      email.text || email.html || '(geen inhoud)',
      JSON.stringify({
        from_email: email.from,
        to: email.to,
        unknown_sender: true,
        headers: email.headers,
        has_attachments: (email.attachments?.length || 0) > 0,
      })
    )
    .run();
}

/**
 * Parse conversation ID from support+{id}@ format in To address
 * Returns the conversation ID if found, null otherwise
 */
function parseConversationIdFromTo(toAddresses: string[]): string | null {
  for (const addr of toAddresses) {
    // Match support+{conversationId}@praatmetjeboekhouding.nl
    const match = addr.match(/support\+([a-f0-9]{32})@praatmetjeboekhouding\.nl/i);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Check if sender is an admin email
 */
function isAdminEmail(email: string, adminEmails: string): boolean {
  const admins = adminEmails.split(',').map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

/**
 * Get conversation by ID
 */
async function getConversationById(
  db: D1Database,
  conversationId: string
): Promise<{ id: string; user_id: string; subject: string; status: string } | null> {
  const result = await db
    .prepare('SELECT id, user_id, subject, status FROM support_conversations WHERE id = ?')
    .bind(conversationId)
    .first<{ id: string; user_id: string; subject: string; status: string }>();
  return result || null;
}

/**
 * Add admin message to conversation
 */
async function addAdminMessage(
  db: D1Database,
  conversationId: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const id = generateId();
  await db
    .prepare(`
      INSERT INTO support_messages (id, conversation_id, sender_type, sender_id, content, metadata, created_at)
      VALUES (?, ?, 'admin', NULL, ?, ?, datetime('now'))
    `)
    .bind(id, conversationId, content, metadata ? JSON.stringify(metadata) : null)
    .run();

  // Update conversation timestamp and status to waiting_user (admin has responded)
  await db
    .prepare(`
      UPDATE support_conversations
      SET updated_at = datetime('now'), status = 'waiting_user', handled_by = COALESCE(handled_by, 'human')
      WHERE id = ?
    `)
    .bind(conversationId)
    .run();

  return id;
}

/**
 * Get user by ID
 */
async function getUserById(
  db: D1Database,
  userId: string
): Promise<{ id: string; email: string; name: string | null; plan: string } | null> {
  const result = await db
    .prepare('SELECT id, email, name, plan FROM users WHERE id = ?')
    .bind(userId)
    .first<{ id: string; email: string; name: string | null; plan: string }>();
  return result || null;
}

/**
 * Trigger the support agent to process admin instructions
 * This calls the trigger endpoint internally
 */
async function triggerSupportAgentWithAdminContext(
  conversationId: string,
  baseUrl: string
): Promise<void> {
  try {
    // Internal call to trigger endpoint with admin_instruction flag
    const response = await fetch(`${baseUrl}/api/support/agent/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        source: 'admin_email_reply',
      }),
    });

    if (!response.ok) {
      console.warn(`[Inbound Email] Failed to trigger support agent: ${response.status}`);
    } else {
      console.log(`[Inbound Email] Support agent triggered for conversation: ${conversationId}`);
    }
  } catch (error) {
    console.error('[Inbound Email] Error triggering support agent:', error);
  }
}

/**
 * Extract clean reply content from email (remove quoted text)
 * Simple heuristic: take content before "On ... wrote:" or similar patterns
 */
function extractReplyContent(content: string): string {
  // Common reply markers
  const markers = [
    /\n\s*On .+ wrote:\s*\n/i,
    /\n\s*-----\s*Oorspronkelijk bericht\s*-----/i,
    /\n\s*-----\s*Original Message\s*-----/i,
    /\n\s*Van:.+\nVerzonden:.+\nAan:.+\nOnderwerp:/i,
    /\n\s*From:.+\nSent:.+\nTo:.+\nSubject:/i,
    /\n\s*>\s+/,  // Quoted text markers
  ];

  let cleanContent = content;

  for (const marker of markers) {
    const match = content.match(marker);
    if (match && match.index !== undefined) {
      cleanContent = content.substring(0, match.index).trim();
      break;
    }
  }

  return cleanContent || content;
}

export const POST: APIRoute = async ({ request, locals, url }) => {
  const env = locals.runtime?.env as {
    DB?: D1Database;
    RESEND_WEBHOOK_SECRET?: string;
    TOKEN_ENCRYPTION_KEY?: string;
    ADMIN_EMAILS?: string;
    RESEND_API_KEY?: string;
  } | undefined;
  const baseUrl = `${url.protocol}//${url.host}`;

  if (!env?.DB) {
    console.error('[Inbound Email] Database not configured');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get raw payload for signature verification
  const payload = await request.text();

  // SECURITY: Webhook secret is REQUIRED - reject requests if not configured
  if (!env.RESEND_WEBHOOK_SECRET) {
    console.error('[Inbound Email] RESEND_WEBHOOK_SECRET not configured');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify webhook signature
  const isValid = await verifyResendSignature(payload, request.headers, env.RESEND_WEBHOOK_SECRET);
  if (!isValid) {
    console.error('[Inbound Email] Invalid webhook signature');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse webhook payload
  let webhookData: ResendWebhookPayload;
  try {
    webhookData = JSON.parse(payload);
  } catch (e) {
    console.error('[Inbound Email] Invalid JSON payload:', e);
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Only process email.received events
  if (webhookData.type !== 'email.received') {
    console.log(`[Inbound Email] Ignoring event type: ${webhookData.type}`);
    return new Response(JSON.stringify({ received: true, note: 'Event type ignored' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const email = webhookData.data;
  console.log(`[Inbound Email] Received email from: ${email.from}, subject: ${email.subject}, to: ${email.to.join(', ')}`);

  try {
    // Extract and validate sender email (SEC-002)
    const senderEmail = extractEmail(email.from);

    // SEC-002: Reject emails with invalid sender format
    if (!senderEmail) {
      console.warn(`[Inbound Email] Rejected email with invalid sender format: ${email.from}`);
      return new Response(
        JSON.stringify({
          received: true,
          note: 'Rejected - invalid sender email format',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const senderName = extractName(email.from);

    // =====================================================================
    // ADMIN REPLY FLOW: Check if this is a reply to support+{id}@ format
    // =====================================================================
    const conversationIdFromTo = parseConversationIdFromTo(email.to);
    const adminEmails = env.ADMIN_EMAILS || '';
    const isAdmin = isAdminEmail(senderEmail, adminEmails);

    if (conversationIdFromTo && isAdmin) {
      console.log(`[Inbound Email] Admin reply detected for conversation: ${conversationIdFromTo}`);

      // Get the conversation
      const conversation = await getConversationById(env.DB, conversationIdFromTo);
      if (!conversation) {
        console.warn(`[Inbound Email] Conversation not found: ${conversationIdFromTo}`);
        return new Response(
          JSON.stringify({
            received: true,
            note: 'Conversation not found',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Extract clean reply content (remove quoted text)
      const rawContent = email.text || email.html?.replace(/<[^>]*>/g, '') || '(geen inhoud)';
      const replyContent = extractReplyContent(rawContent);

      // Add admin message to conversation
      await addAdminMessage(env.DB, conversationIdFromTo, replyContent, {
        source: 'email_reply',
        admin_email: senderEmail,
        original_subject: email.subject,
        is_admin_instruction: true,
      });

      // Get customer info to send notification
      const customer = await getUserById(env.DB, conversation.user_id);

      if (customer) {
        // Send notification email to customer
        const notificationEmail = supportReplyNotificationEmail({
          conversationId: conversationIdFromTo,
          customerName: customer.name,
          subject: conversation.subject,
          replyContent: replyContent,
        });
        notificationEmail.to = customer.email;
        notificationEmail.userId = customer.id;

        await sendEmail(
          { RESEND_API_KEY: env.RESEND_API_KEY },
          notificationEmail
        );

        console.log(`[Inbound Email] Sent reply notification to customer: ${customer.email}`);
      }

      // Trigger support agent to continue with admin instructions
      await triggerSupportAgentWithAdminContext(conversationIdFromTo, baseUrl);

      console.log(`[Inbound Email] Admin reply processed for conversation: ${conversationIdFromTo}`);

      return new Response(
        JSON.stringify({
          received: true,
          type: 'admin_reply',
          conversationId: conversationIdFromTo,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // =====================================================================
    // CUSTOMER REPLY TO EXISTING CONVERSATION FLOW
    // (when they reply to support+{id}@ but are not admin)
    // =====================================================================
    if (conversationIdFromTo && !isAdmin) {
      console.log(`[Inbound Email] Customer reply to conversation: ${conversationIdFromTo}`);

      const conversation = await getConversationById(env.DB, conversationIdFromTo);
      if (!conversation) {
        console.warn(`[Inbound Email] Conversation not found for customer reply: ${conversationIdFromTo}`);
        // Fall through to normal flow to create new conversation
      } else {
        const content = email.text || email.html?.replace(/<[^>]*>/g, '') || '(geen inhoud)';

        // Find user by email
        const user = await findUserByEmail(env.DB, senderEmail);

        // Add message to existing conversation
        const metadata = {
          source: 'email_reply',
          original_from: email.from,
          original_subject: email.subject,
          has_attachments: (email.attachments?.length || 0) > 0,
          attachment_count: email.attachments?.length || 0,
        };

        const messageId = generateId();
        await env.DB
          .prepare(`
            INSERT INTO support_messages (id, conversation_id, sender_type, sender_id, content, metadata, created_at)
            VALUES (?, ?, 'user', ?, ?, ?, datetime('now'))
          `)
          .bind(messageId, conversationIdFromTo, user?.id || null, content, JSON.stringify(metadata))
          .run();

        // Update conversation status to open (customer replied)
        await env.DB
          .prepare(`
            UPDATE support_conversations
            SET updated_at = datetime('now'), status = 'open'
            WHERE id = ?
          `)
          .bind(conversationIdFromTo)
          .run();

        // Send admin notification
        await sendAdminAlert(
          { RESEND_API_KEY: env.RESEND_API_KEY, ADMIN_EMAILS: env.ADMIN_EMAILS },
          `Reply op support ticket: ${conversation.subject}`,
          `
            <strong>Van:</strong> ${escapeHtml(senderName || senderEmail)}<br>
            <strong>Ticket:</strong> #${conversationIdFromTo.slice(0, 8)}<br>
            <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb;">
            <div style="background: #f3f4f6; padding: 12px; border-radius: 4px; white-space: pre-wrap;">
              ${escapeHtml(content.substring(0, 2000))}${content.length > 2000 ? '...' : ''}
            </div>
            <br>
            <a href="https://praatmetjeboekhouding.nl/admin/support/conversations/${conversationIdFromTo}" style="color: #0066FF;">
              Bekijk gesprek →
            </a>
          `
        );

        // Trigger support agent
        await triggerSupportAgentWithAdminContext(conversationIdFromTo, baseUrl);

        return new Response(
          JSON.stringify({
            received: true,
            type: 'customer_reply',
            conversationId: conversationIdFromTo,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // =====================================================================
    // STANDARD FLOW: New email or reply without conversation ID
    // =====================================================================

    // Ignore emails from our own domain to prevent loops
    const ownDomains = ['praatmetjeboekhouding.nl', 'chefdata.nl'];
    const senderDomain = senderEmail.split('@')[1]?.toLowerCase();
    if (senderDomain && ownDomains.includes(senderDomain)) {
      console.log(`[Inbound Email] Ignoring email from own domain: ${senderEmail}`);
      return new Response(
        JSON.stringify({
          received: true,
          note: 'Ignored - email from own domain',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Try to find user by email
    const user = await findUserByEmail(env.DB, senderEmail);

    if (!user) {
      // Unknown sender - store for manual review (no instant alert - use daily digest instead)
      console.log(`[Inbound Email] Unknown sender: ${senderEmail}`);
      await storeUnknownSenderEmail(env.DB, email);

      // Note: No instant admin alert - unknown sender emails are visible in admin dashboard
      // and can be included in a daily digest report

      return new Response(
        JSON.stringify({
          received: true,
          note: 'Unknown sender - stored for review',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // User found - process the email
    const content = email.text || email.html?.replace(/<[^>]*>/g, '') || '(geen inhoud)';
    const subject = email.subject || '(geen onderwerp)';

    // Find existing open conversation or create new one
    let conversationId: string;
    let isNewConversation = false;

    const existingConversation = await findOpenConversation(env.DB, user.id);
    if (existingConversation) {
      conversationId = existingConversation.id;
      console.log(`[Inbound Email] Adding to existing conversation: ${conversationId}`);
    } else {
      conversationId = await createConversation(env.DB, user.id, subject);
      isNewConversation = true;
      console.log(`[Inbound Email] Created new conversation: ${conversationId}`);
    }

    // Add message to conversation
    const metadata = {
      source: 'email',
      original_from: email.from,
      original_subject: email.subject,
      has_attachments: (email.attachments?.length || 0) > 0,
      attachment_count: email.attachments?.length || 0,
      headers: email.headers?.filter((h) =>
        ['Message-ID', 'In-Reply-To', 'References'].includes(h.name)
      ),
    };

    await addMessage(env.DB, conversationId, user.id, content, metadata);

    // Create communication event for timeline
    await createCommunicationEvent(env.DB, user.id, subject, content, conversationId, {
      ...metadata,
      sender_name: senderName,
      sender_email: senderEmail,
    });

    // Send admin notification
    await sendAdminAlert(
      { RESEND_API_KEY: env.RESEND_API_KEY, ADMIN_EMAILS: env.ADMIN_EMAILS },
      `${isNewConversation ? 'Nieuwe' : 'Reply op'} support email: ${subject}`,
      `
        <strong>Van:</strong> ${escapeHtml(user.name || user.email)} (${escapeHtml(user.email)})<br>
        <strong>Onderwerp:</strong> ${escapeHtml(subject)}<br>
        <strong>Conversatie:</strong> ${isNewConversation ? 'Nieuw gesprek' : 'Bestaand gesprek'}<br>
        ${email.attachments?.length ? `<strong>Bijlagen:</strong> ${email.attachments.length} bestand(en)<br>` : ''}
        <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb;">
        <strong>Bericht:</strong><br>
        <div style="background: #f3f4f6; padding: 12px; border-radius: 4px; margin-top: 8px; white-space: pre-wrap;">
          ${escapeHtml(content.substring(0, 2000))}${content.length > 2000 ? '...' : ''}
        </div>
        <br>
        <a href="https://praatmetjeboekhouding.nl/admin/support/conversations/${conversationId}" style="color: #0066FF;">
          Bekijk gesprek →
        </a>
      `
    );

    // Send acknowledgment email to customer for new conversations
    if (isNewConversation) {
      const ackEmail = supportAcknowledgmentEmail({
        conversationId,
        customerName: user.name,
        subject,
      });
      ackEmail.to = user.email;
      ackEmail.userId = user.id;

      await sendEmail(
        { RESEND_API_KEY: env.RESEND_API_KEY },
        ackEmail
      );

      console.log(`[Inbound Email] Sent acknowledgment email to: ${user.email}`);
    }

    // Trigger support agent to process the new message
    await triggerSupportAgentWithAdminContext(conversationId, baseUrl);

    console.log(`[Inbound Email] Successfully processed email for user: ${user.email}`);

    return new Response(
      JSON.stringify({
        received: true,
        userId: user.id,
        conversationId,
        isNewConversation,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Inbound Email] Error processing email:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process email',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Also handle GET for webhook verification (some providers send GET to verify endpoint)
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ status: 'ok', endpoint: 'inbound-email-webhook' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
