/**
 * API endpoint for customers to send messages (support, feedback, etc.)
 *
 * POST /api/messages/send
 *
 * Creates a communication_event record with direction='out' (from customer to us)
 * and optionally sends email notification to support team.
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../lib/database';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const env = locals.runtime?.env;
    if (!env?.DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database niet beschikbaar' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);

    // Verify session
    const sessionId = cookies.get('session_id')?.value;
    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Niet ingelogd' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = await db.validateSession(sessionId);
    if (!session) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sessie verlopen' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json() as { category?: string; subject?: string; content?: string };
    const { category, subject, content } = body;

    // Validate input
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Onderwerp is verplicht' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bericht is verplicht' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique ID
    const id = crypto.randomUUID();

    // Determine type based on category
    let type: 'email' | 'support' | 'feedback' = 'support';
    if (category === 'feedback') {
      type = 'feedback';
    } else if (category === 'bug' || category === 'feature' || category === 'question') {
      type = 'support';
    }

    // Create support conversation for tracking in "Mijn Gesprekken"
    const conversationId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO support_conversations (id, user_id, subject, status, priority, category, created_at, updated_at)
      VALUES (?, ?, ?, 'open', 'normal', ?, datetime('now'), datetime('now'))
    `).bind(
      conversationId,
      session.user.id,
      subject.trim(),
      category || 'general'
    ).run();

    // Add the first message to the conversation
    const messageId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO support_messages (id, conversation_id, sender_type, sender_id, content, created_at)
      VALUES (?, ?, 'user', ?, ?, datetime('now'))
    `).bind(
      messageId,
      conversationId,
      session.user.id,
      content.trim()
    ).run();

    // Create communication event for timeline (direction='out' = from customer to us)
    await env.DB.prepare(`
      INSERT INTO communication_events (id, type, direction, user_id, subject, content, metadata, related_id, created_at)
      VALUES (?, ?, 'out', ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id,
      type,
      session.user.id,
      subject.trim(),
      content.trim(),
      JSON.stringify({ category, user_email: session.user.email, user_name: session.user.name }),
      conversationId
    ).run();

    // Send email notification to support team
    const { sendAdminAlert } = await import('../../../lib/email');
    const alertMessage = `
      <strong>Van:</strong> ${session.user.email}<br>
      <strong>Naam:</strong> ${session.user.name || 'Niet opgegeven'}<br>
      <strong>Categorie:</strong> ${category || 'general'}<br>
      <strong>Onderwerp:</strong> ${subject.trim()}<br>
      <strong>Bericht:</strong><br>
      <div style="background: #f3f4f6; padding: 12px; border-radius: 4px; margin-top: 8px;">
        ${content.trim().replace(/\n/g, '<br>')}
      </div>
      <br>
      <a href="https://praatmetjeboekhouding.nl/admin/customer/${session.user.id}" style="color: #0066FF;">
        Bekijk klantprofiel →
      </a>
    `;
    await sendAdminAlert(env, `Nieuw bericht: ${subject.trim()}`, alertMessage);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bericht verzonden',
        id,
        conversationId,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Send message error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Onbekende fout',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
