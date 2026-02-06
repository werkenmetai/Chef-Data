/**
 * Support Conversation to Article API Endpoint
 *
 * POST /api/admin/support/to-article
 * Generates a suggested knowledge base article from a resolved support conversation.
 *
 * Uses Claude AI to analyze the conversation and extract:
 * - A clear title for the article
 * - Content that explains the problem and solution
 * - Relevant category and tags
 */

import type { APIRoute } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';
import { Database } from '../../../../lib/database';

// Helper to check admin
async function isAdmin(
  db: Database,
  env: Record<string, unknown>,
  cookies: { get: (name: string) => { value?: string } | undefined }
): Promise<boolean> {
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) return false;

  const session = await db.validateSession(sessionId);
  if (!session) return false;

  const adminEmails = ((env.ADMIN_EMAILS as string) || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  const userEmail = session.user.email.toLowerCase();
  return adminEmails.length > 0 && adminEmails.includes(userEmail);
}

interface ToArticleRequest {
  conversation_id: string;
}

interface SuggestedArticle {
  title_nl: string;
  content_nl: string;
  category: string;
  tags: string[];
}

/**
 * Generate article suggestion using Claude AI
 */
async function generateArticleSuggestion(
  apiKey: string,
  conversationMessages: Array<{ sender_type: string; content: string }>,
  conversationSubject: string,
  conversationCategory: string | null
): Promise<SuggestedArticle> {
  const messagesText = conversationMessages
    .map((m) => {
      const label =
        m.sender_type === 'user'
          ? 'Klant'
          : m.sender_type === 'ai'
            ? 'AI'
            : m.sender_type === 'admin'
              ? 'Admin'
              : 'Systeem';
      return `${label}: ${m.content}`;
    })
    .join('\n\n');

  const prompt = `Analyseer dit support gesprek en genereer een kennisbank artikel.

Onderwerp: ${conversationSubject}
Categorie: ${conversationCategory || 'Onbekend'}

Gesprek:
${messagesText}

Genereer een artikel in het volgende JSON formaat:
{
  "title_nl": "Korte, duidelijke titel van het probleem/vraag",
  "content_nl": "Artikel tekst met:\\n1. Beschrijving van het probleem\\n2. Stappen voor de oplossing\\n3. Tips indien relevant",
  "category": "connection|billing|bug|feature|account|other",
  "tags": ["relevante", "zoektermen", "max", "5"]
}

Schrijf het artikel in het Nederlands, informeel maar professioneel.
Geef ALLEEN de JSON, geen uitleg.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[to-article] Claude API error:', errorText);
      throw new Error('Failed to generate article');
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
    };

    // Extract JSON from response
    const textContent = data.content.find((c) => c.type === 'text')?.text || '';
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as SuggestedArticle;
      return parsed;
    }

    throw new Error('No valid JSON in response');
  } catch (error) {
    console.error('[to-article] Error generating article:', error);

    // Fallback: generate basic article from conversation
    const firstUserMessage = conversationMessages.find((m) => m.sender_type === 'user');
    const lastAdminMessage = [...conversationMessages]
      .reverse()
      .find((m) => m.sender_type === 'admin' || m.sender_type === 'ai');

    return {
      title_nl: conversationSubject || 'Support vraag',
      content_nl: `## Vraag\n${firstUserMessage?.content || 'Geen vraag beschikbaar'}\n\n## Antwoord\n${lastAdminMessage?.content || 'Geen antwoord beschikbaar'}`,
      category: conversationCategory || 'other',
      tags: ['support', 'faq'],
    };
  }
}

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  try {
    const env = (locals as { runtime?: { env?: Record<string, unknown> } }).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new Database(env.DB as D1Database, env.TOKEN_ENCRYPTION_KEY as string | undefined);

    if (!(await isAdmin(db, env, cookies))) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = (await request.json()) as ToArticleRequest;
    const { conversation_id } = body;

    if (!conversation_id) {
      return new Response(JSON.stringify({ error: 'conversation_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get conversation
    const conversation = await db.getConversation(conversation_id);
    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get messages (exclude internal notes)
    const messages = await db.getMessages(conversation_id);
    const publicMessages = messages
      .filter((m) => !m.is_internal)
      .map((m) => ({
        sender_type: m.sender_type,
        content: m.content,
      }));

    if (publicMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages in conversation' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for API key
    const anthropicApiKey = env.ANTHROPIC_API_KEY as string | undefined;

    let suggestedArticle: SuggestedArticle;

    if (anthropicApiKey) {
      // Use Claude AI to generate article
      suggestedArticle = await generateArticleSuggestion(
        anthropicApiKey,
        publicMessages,
        conversation.subject,
        conversation.category
      );
    } else {
      // Fallback without AI
      const firstUserMessage = publicMessages.find((m) => m.sender_type === 'user');
      const lastAdminMessage = [...publicMessages]
        .reverse()
        .find((m) => m.sender_type === 'admin' || m.sender_type === 'ai');

      suggestedArticle = {
        title_nl: conversation.subject || 'Support vraag',
        content_nl: `## Vraag\n${firstUserMessage?.content || 'Geen vraag beschikbaar'}\n\n## Antwoord\n${lastAdminMessage?.content || 'Geen antwoord beschikbaar'}`,
        category: conversation.category || 'other',
        tags: ['support', 'faq'],
      };
    }

    return new Response(
      JSON.stringify({
        suggested_article: suggestedArticle,
        conversation_id,
        conversation_subject: conversation.subject,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[to-article] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
