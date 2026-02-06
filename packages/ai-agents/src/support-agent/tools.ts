/**
 * Support Agent Tools
 *
 * Tools available to the Support Agent for handling customer issues.
 * Tools receive context (database, etc) when created.
 *
 * Guard Rails:
 * - Human request detection (immediate escalation)
 * - Response limit (max 5 AI responses per conversation)
 * - Content filtering (blocked patterns for sensitive operations)
 * - Confidence threshold (auto-escalate if too low)
 */

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, ParameterSchema>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

interface ParameterSchema {
  type: string;
  description: string;
  required?: boolean;
}

// ============================================================
// GUARD RAILS
// ============================================================

/**
 * Maximum number of AI responses per conversation before auto-escalation
 */
export const AI_RESPONSE_LIMIT = 5;

/**
 * Minimum confidence threshold for auto-response
 */
export const CONFIDENCE_THRESHOLD = 0.5;

/**
 * Patterns that detect when a customer wants to talk to a human
 */
export const HUMAN_REQUEST_PATTERNS = [
  // Dutch
  /\b(mens|persoon|medewerker|iemand)\b/i,
  /\b(echt|echte)\s*(mens|persoon|medewerker)/i,
  /\b(wil|kan|mag|graag).*praten.*met/i,
  /\b(wil|kan|mag|graag).*spreken.*met/i,
  /\b(niet|geen).*(robot|ai|bot|automatisch)/i,
  /\bgesproken\s*contact\b/i,
  /\btel(efoon|efonisch)\b/i,
  /\bbellen?\b/i,
  /\bsupport\s*team\b/i,
  // English
  /\b(human|person|agent|someone|real\s*person)\b/i,
  /\b(speak|talk).*to.*(human|person|someone|agent)\b/i,
  /\b(not|no).*(robot|ai|bot|automated)\b/i,
  /\bcall\s*(me|back)\b/i,
  /\bphone\s*(support|call)\b/i,
];

/**
 * Blocked content patterns - responses containing these will be rejected
 */
export const BLOCKED_CONTENT_PATTERNS = [
  // Refunds and financial operations
  /refund/i,
  /terugbetaling/i,
  /geld\s*terug/i,
  /crediteren/i,
  // Account deletion
  /delete.*account/i,
  /verwijder.*account/i,
  /account.*verwijderen/i,
  /account.*opheffen/i,
  // Sensitive data
  /password|wachtwoord/i,
  /api[-_]?key|apikey/i,
  /token/i,
  /credit\s*card|creditcard/i,
  /bank\s*gegevens/i,
  // Promises about features or timelines
  /we\s*zullen\s*(binnenkort|snel).*toevoegen/i,
  /feature.*komt.*binnenkort/i,
];

/**
 * Check if a customer message indicates they want human assistance
 */
export function customerWantsHuman(message: string): boolean {
  return HUMAN_REQUEST_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Check if a response contains blocked content
 */
export function containsBlockedContent(content: string): { blocked: boolean; reason?: string } {
  for (const pattern of BLOCKED_CONTENT_PATTERNS) {
    if (pattern.test(content)) {
      return {
        blocked: true,
        reason: `Response bevat geblokkeerde content: ${pattern.source}`,
      };
    }
  }
  return { blocked: false };
}

/**
 * Guard rails check result
 */
export interface GuardRailsResult {
  allowed: boolean;
  action?: 'escalate' | 'block' | 'limit_reached';
  reason?: string;
}

/**
 * Check all guard rails before AI responds
 */
export async function checkGuardRails(
  latestUserMessage: string,
  responseContent: string,
  aiResponseCount: number
): Promise<GuardRailsResult> {
  // 1. Check if customer wants human
  if (customerWantsHuman(latestUserMessage)) {
    return {
      allowed: false,
      action: 'escalate',
      reason: 'Klant vraagt om menselijke hulp',
    };
  }

  // 2. Check response limit
  if (aiResponseCount >= AI_RESPONSE_LIMIT) {
    return {
      allowed: false,
      action: 'limit_reached',
      reason: `Maximum AI responses (${AI_RESPONSE_LIMIT}) bereikt`,
    };
  }

  // 3. Check blocked content
  const blockedCheck = containsBlockedContent(responseContent);
  if (blockedCheck.blocked) {
    return {
      allowed: false,
      action: 'block',
      reason: blockedCheck.reason,
    };
  }

  return { allowed: true };
}

/**
 * Context needed for tool execution
 */
export interface SupportToolContext {
  // Database query functions
  searchArticles: (query: string, limit?: number) => Promise<Article[]>;
  getCustomer: (customerId: string) => Promise<Customer | null>;
  getCustomerConnections: (customerId: string) => Promise<Connection[]>;
  getCustomerErrors: (customerId: string, hoursBack?: number) => Promise<ErrorLog[]>;
  getActivePatterns: () => Promise<Pattern[]>;
  addMessage: (conversationId: string, message: MessageInput) => Promise<void>;
  updateConversation: (conversationId: string, updates: ConversationUpdate) => Promise<void>;
  createEscalation: (data: EscalationData) => Promise<string>;
  sendEmail: (to: string, subject: string, body: string) => Promise<boolean>;

  // New functions for escalation and guard rails
  sendEscalationEmail: (options: EscalationEmailOptions) => Promise<boolean>;
  getAIResponseCount: (conversationId: string) => Promise<number>;
  getConversationMessages: (conversationId: string) => Promise<ConversationMessage[]>;
  getCustomerConversations?: (customerId: string, limit?: number) => Promise<CustomerConversation[]>;
  getCustomerUsage?: (customerId: string) => Promise<CustomerUsage>;

  // Current conversation context
  conversationId: string;
  customerId?: string;
}

// New type definitions for extended context
export interface EscalationEmailOptions {
  conversationId: string;
  customerEmail: string;
  customerName: string | null;
  customerPlan: string;
  subject: string;
  messages: Array<{ sender_type: string; content: string; created_at: string }>;
  aiAnalysis: {
    category: string;
    confidence: number;
    attemptedSolutions: string[];
  };
}

export interface ConversationMessage {
  id: string;
  sender_type: 'user' | 'ai' | 'admin' | 'system';
  content: string;
  created_at: string;
  ai_confidence?: number;
}

export interface CustomerConversation {
  id: string;
  subject: string;
  status: string;
  category: string | null;
  created_at: string;
  resolved_at: string | null;
  resolution_type: string | null;
}

export interface CustomerUsage {
  plan: string;
  apiCallsUsed: number;
  apiCallsLimit: number;
  divisionsUsed: number;
  divisionsLimit: number;
}

// Type definitions for context functions
export interface Article {
  id: string;
  slug: string;
  title_nl: string;
  content_nl: string;
  category: string;
  view_count: number;
}

export interface Customer {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  created_at: string;
}

export interface Connection {
  id: string;
  exact_user_id: string;
  division_code: number;
  division_name: string;
  status: string;
  token_expires_at: string | null;
  last_used_at: string | null;
}

export interface ErrorLog {
  id: string;
  error_type: string;
  error_code: string | null;
  error_message: string;
  created_at: string;
}

export interface Pattern {
  id: string;
  name: string;
  trigger_keywords: string;
  error_codes: string | null;
  category: string;
  response_template_nl: string;
}

export interface MessageInput {
  sender_type: 'user' | 'ai' | 'admin' | 'system';
  sender_id?: string;
  content: string;
  ai_confidence?: number;
}

export interface ConversationUpdate {
  status?: string;
  priority?: string;
  handled_by?: string;
}

export interface EscalationData {
  customer_id: string;
  conversation_id: string;
  summary: string;
  priority: string;
  error_context?: string;
}

/**
 * Create support agent tools with context
 */
export function createSupportAgentTools(context: SupportToolContext): AgentTool[] {
  return [
    {
      name: 'search_docs',
      description: 'Zoek in de documentatie en knowledge base naar relevante artikelen',
      parameters: {
        query: {
          type: 'string',
          description: 'Zoekterm of vraag',
          required: true,
        },
      },
      execute: async ({ query }) => {
        console.log(`[Support] Searching docs for: ${query}`);
        try {
          const articles = await context.searchArticles(query as string, 5);

          if (articles.length === 0) {
            return {
              success: true,
              results: [],
              message: 'Geen relevante artikelen gevonden.',
            };
          }

          return {
            success: true,
            results: articles.map((a) => ({
              title: a.title_nl,
              slug: a.slug,
              category: a.category,
              excerpt: a.content_nl.substring(0, 200) + '...',
              url: `/support/articles/${a.slug}`,
            })),
            message: `${articles.length} artikel(en) gevonden.`,
          };
        } catch (error) {
          console.error('[Support] search_docs error:', error);
          return {
            success: false,
            results: [],
            message: 'Fout bij zoeken in documentatie.',
          };
        }
      },
    },

    {
      name: 'get_customer_status',
      description: 'Haal de status op van een klant en hun Exact Online connecties',
      parameters: {
        customer_id: {
          type: 'string',
          description: 'Customer ID',
          required: true,
        },
      },
      execute: async ({ customer_id }) => {
        console.log(`[Support] Getting status for customer: ${customer_id}`);
        try {
          const customer = await context.getCustomer(customer_id as string);

          if (!customer) {
            return {
              success: false,
              customer: null,
              connections: [],
              message: 'Klant niet gevonden.',
            };
          }

          const connections = await context.getCustomerConnections(customer_id as string);

          // Check connection health
          const now = new Date();
          const connectionStatus = connections.map((conn) => {
            const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at) : null;
            const isExpired = expiresAt && expiresAt < now;
            const isExpiringSoon = expiresAt && expiresAt < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            return {
              division_name: conn.division_name,
              division_code: conn.division_code,
              status: conn.status,
              token_status: isExpired ? 'expired' : isExpiringSoon ? 'expiring_soon' : 'valid',
              last_used: conn.last_used_at,
            };
          });

          const hasIssues = connectionStatus.some(
            (c) => c.status !== 'active' || c.token_status !== 'valid'
          );

          return {
            success: true,
            customer: {
              email: customer.email,
              name: customer.name,
              plan: customer.plan,
              member_since: customer.created_at,
            },
            connections: connectionStatus,
            has_issues: hasIssues,
            message: hasIssues
              ? 'Er zijn problemen gevonden met de connecties.'
              : 'Alle connecties zijn actief.',
          };
        } catch (error) {
          console.error('[Support] get_customer_status error:', error);
          return {
            success: false,
            customer: null,
            connections: [],
            message: 'Fout bij ophalen klantgegevens.',
          };
        }
      },
    },

    {
      name: 'get_customer_errors',
      description: 'Bekijk recente errors voor een specifieke klant',
      parameters: {
        customer_id: {
          type: 'string',
          description: 'Customer ID',
          required: true,
        },
        hours: {
          type: 'number',
          description: 'Aantal uur terug te kijken (default: 24)',
          required: false,
        },
      },
      execute: async ({ customer_id, hours = 24 }) => {
        console.log(`[Support] Getting errors for ${customer_id} (last ${hours}h)`);
        try {
          const errors = await context.getCustomerErrors(customer_id as string, hours as number);

          if (errors.length === 0) {
            return {
              success: true,
              errors: [],
              message: `Geen errors gevonden in de afgelopen ${hours} uur.`,
            };
          }

          // Group by error type
          const errorGroups = errors.reduce((acc, err) => {
            const type = err.error_type;
            if (!acc[type]) {
              acc[type] = { count: 0, latest: err, code: err.error_code };
            }
            acc[type].count++;
            return acc;
          }, {} as Record<string, { count: number; latest: ErrorLog; code: string | null }>);

          return {
            success: true,
            total_errors: errors.length,
            error_types: Object.entries(errorGroups).map(([type, data]) => ({
              type,
              count: data.count,
              code: data.code,
              latest_message: data.latest.error_message,
              latest_at: data.latest.created_at,
            })),
            message: `${errors.length} error(s) gevonden.`,
          };
        } catch (error) {
          console.error('[Support] get_customer_errors error:', error);
          return {
            success: false,
            errors: [],
            message: 'Fout bij ophalen errors.',
          };
        }
      },
    },

    {
      name: 'check_known_issues',
      description: 'Check of een error matcht met bekende issues en krijg oplossingen',
      parameters: {
        error_type: {
          type: 'string',
          description: 'Type error (bijv. AUTH_FAILED, RATE_LIMIT)',
          required: true,
        },
        error_message: {
          type: 'string',
          description: 'De error message',
          required: false,
        },
      },
      execute: async ({ error_type, error_message = '' }) => {
        console.log(`[Support] Checking known issues for: ${error_type}`);
        try {
          const patterns = await context.getActivePatterns();

          // Find matching patterns
          const matches = patterns.filter((pattern) => {
            // Check error codes
            if (pattern.error_codes) {
              const codes = pattern.error_codes.split(',').map((c) => c.trim().toLowerCase());
              if (codes.includes((error_type as string).toLowerCase())) {
                return true;
              }
            }

            // Check keywords
            const keywords = pattern.trigger_keywords.split(',').map((k) => k.trim().toLowerCase());
            const searchText = `${error_type} ${error_message}`.toLowerCase();
            const matchedKeywords = keywords.filter((k) => searchText.includes(k));

            return matchedKeywords.length >= 2;
          });

          if (matches.length === 0) {
            return {
              success: true,
              is_known: false,
              matches: [],
              message: 'Dit is geen bekend issue. Mogelijk een nieuw probleem.',
            };
          }

          return {
            success: true,
            is_known: true,
            matches: matches.map((m) => ({
              name: m.name,
              category: m.category,
              solution: m.response_template_nl,
            })),
            message: `${matches.length} bekende issue(s) gevonden met oplossingen.`,
          };
        } catch (error) {
          console.error('[Support] check_known_issues error:', error);
          return {
            success: false,
            is_known: false,
            matches: [],
            message: 'Fout bij checken bekende issues.',
          };
        }
      },
    },

    {
      name: 'trigger_reauth',
      description: 'Stuur een re-authenticatie email naar de klant om hun Exact Online connectie te vernieuwen',
      parameters: {
        customer_id: {
          type: 'string',
          description: 'Customer ID',
          required: true,
        },
        reason: {
          type: 'string',
          description: 'Reden voor re-auth (bijv. token_expired, token_expiring)',
          required: false,
        },
      },
      execute: async ({ customer_id, reason = 'token_expired' }) => {
        console.log(`[Support] Triggering reauth for ${customer_id}, reason: ${reason}`);
        try {
          const customer = await context.getCustomer(customer_id as string);

          if (!customer) {
            return {
              success: false,
              message: 'Klant niet gevonden.',
            };
          }

          // Build re-auth email
          const subject = 'Vernieuw je Exact Online verbinding';
          const body = `
Hoi${customer.name ? ` ${customer.name}` : ''},

${
  reason === 'token_expired'
    ? 'Je Exact Online verbinding is verlopen.'
    : 'Je Exact Online verbinding verloopt binnenkort.'
}

Klik op onderstaande link om opnieuw te verbinden:
https://mcp.chefdata.nl/connect

Dit duurt minder dan 2 minuten en voorkomt onderbrekingen.

Groet,
Het Support Team
          `.trim();

          const sent = await context.sendEmail(customer.email, subject, body);

          if (sent) {
            // Add system message to conversation
            await context.addMessage(context.conversationId, {
              sender_type: 'system',
              content: `Re-authenticatie email verzonden naar ${customer.email}.`,
            });
          }

          return {
            success: sent,
            email: customer.email,
            message: sent
              ? `Re-authenticatie email verzonden naar ${customer.email}.`
              : 'Kon email niet verzenden.',
          };
        } catch (error) {
          console.error('[Support] trigger_reauth error:', error);
          return {
            success: false,
            message: 'Fout bij verzenden email.',
          };
        }
      },
    },

    {
      name: 'escalate_to_devops',
      description: 'Escaleer een technisch issue naar het DevOps team voor verdere analyse',
      parameters: {
        customer_id: {
          type: 'string',
          description: 'Customer ID',
          required: true,
        },
        summary: {
          type: 'string',
          description: 'Korte samenvatting van het probleem',
          required: true,
        },
        priority: {
          type: 'string',
          description: 'Prioriteit: low, normal, high, urgent',
          required: true,
        },
        error_context: {
          type: 'string',
          description: 'Relevante error details',
          required: false,
        },
      },
      execute: async ({ customer_id, summary, priority, error_context }) => {
        console.log(`[Support] Escalating to DevOps: ${summary} (${priority})`);
        try {
          const escalationId = await context.createEscalation({
            customer_id: customer_id as string,
            conversation_id: context.conversationId,
            summary: summary as string,
            priority: priority as string,
            error_context: error_context as string | undefined,
          });

          // Update conversation
          await context.updateConversation(context.conversationId, {
            status: 'waiting_support',
            priority: priority as string,
            handled_by: 'hybrid',
          });

          // Add system message
          await context.addMessage(context.conversationId, {
            sender_type: 'system',
            content: `Issue geëscaleerd naar DevOps team. Escalatie ID: ${escalationId}`,
          });

          return {
            success: true,
            escalation_id: escalationId,
            message: 'Issue is geëscaleerd naar het DevOps team. We kijken er zo snel mogelijk naar.',
          };
        } catch (error) {
          console.error('[Support] escalate_to_devops error:', error);
          return {
            success: false,
            escalation_id: null,
            message: 'Fout bij escaleren.',
          };
        }
      },
    },

    {
      name: 'respond_to_customer',
      description: 'Stuur een response naar de klant in het huidige gesprek',
      parameters: {
        message: {
          type: 'string',
          description: 'Bericht naar de klant',
          required: true,
        },
        close_ticket: {
          type: 'boolean',
          description: 'Markeer gesprek als opgelost na versturen',
          required: false,
        },
        confidence: {
          type: 'number',
          description: 'Confidence score (0-1) van het antwoord',
          required: false,
        },
      },
      execute: async ({ message, close_ticket = false, confidence = 0.8 }) => {
        console.log(`[Support] Responding to customer, close: ${close_ticket}`);
        try {
          // Guard rail: Check response limit
          const responseCount = await context.getAIResponseCount(context.conversationId);
          if (responseCount >= AI_RESPONSE_LIMIT) {
            console.log(`[Support] Response limit reached (${responseCount}/${AI_RESPONSE_LIMIT}), auto-escalating`);
            return {
              success: false,
              blocked: true,
              reason: `Maximum AI responses (${AI_RESPONSE_LIMIT}) bereikt, escalatie nodig`,
              message: 'Response limit bereikt. Escaleer naar admin.',
            };
          }

          // Guard rail: Check for blocked content
          const blockedCheck = containsBlockedContent(message as string);
          if (blockedCheck.blocked) {
            console.log(`[Support] Blocked content detected: ${blockedCheck.reason}`);
            return {
              success: false,
              blocked: true,
              reason: blockedCheck.reason,
              message: 'Response bevat geblokkeerde content.',
            };
          }

          // Add AI message to conversation
          await context.addMessage(context.conversationId, {
            sender_type: 'ai',
            content: message as string,
            ai_confidence: confidence as number,
          });

          // Update conversation status
          const status = close_ticket ? 'resolved' : 'waiting_user';
          await context.updateConversation(context.conversationId, {
            status,
            handled_by: 'ai',
          });

          return {
            success: true,
            message_sent: true,
            ticket_closed: close_ticket,
            responses_remaining: AI_RESPONSE_LIMIT - responseCount - 1,
            message: close_ticket
              ? 'Bericht verstuurd en gesprek gemarkeerd als opgelost.'
              : 'Bericht verstuurd, wachten op reactie klant.',
          };
        } catch (error) {
          console.error('[Support] respond_to_customer error:', error);
          return {
            success: false,
            message_sent: false,
            message: 'Fout bij versturen bericht.',
          };
        }
      },
    },

    {
      name: 'escalate_to_admin',
      description: 'Escaleer naar admin via email als AI het probleem niet kan oplossen. Gebruik dit wanneer je niet zeker weet hoe je moet helpen, de klant om een mens vraagt, of het probleem te complex is.',
      parameters: {
        reason: {
          type: 'string',
          description: 'Waarom escalatie nodig is',
          required: true,
        },
        attempted_solutions: {
          type: 'array',
          description: 'Wat al geprobeerd is (array van strings)',
          required: false,
        },
        category: {
          type: 'string',
          description: 'Categorie van het probleem: connection, billing, bug, feature, account, other',
          required: false,
        },
        confidence: {
          type: 'number',
          description: 'Je confidence score (0-1) over dit probleem',
          required: false,
        },
      },
      execute: async ({ reason, attempted_solutions = [], category = 'other', confidence = 0.3 }) => {
        console.log(`[Support] Escalating to admin: ${reason}`);
        try {
          // Get customer info
          const customer = context.customerId
            ? await context.getCustomer(context.customerId)
            : null;

          // Get conversation messages for context
          const messages = await context.getConversationMessages(context.conversationId);

          // Send escalation email
          if (context.sendEscalationEmail && customer) {
            await context.sendEscalationEmail({
              conversationId: context.conversationId,
              customerEmail: customer.email,
              customerName: customer.name,
              customerPlan: customer.plan,
              subject: reason as string,
              messages: messages.map((m) => ({
                sender_type: m.sender_type,
                content: m.content,
                created_at: m.created_at,
              })),
              aiAnalysis: {
                category: category as string,
                confidence: confidence as number,
                attemptedSolutions: (attempted_solutions as string[]) || [],
              },
            });
          }

          // Update conversation status
          await context.updateConversation(context.conversationId, {
            status: 'waiting_support',
            handled_by: 'hybrid',
          });

          // Add system message to conversation
          await context.addMessage(context.conversationId, {
            sender_type: 'system',
            content: `Doorgestuurd naar support team. Reden: ${reason}`,
          });

          // Add AI message to inform customer
          await context.addMessage(context.conversationId, {
            sender_type: 'ai',
            content:
              'Ik heb je vraag doorgestuurd naar ons support team. Een medewerker neemt zo snel mogelijk contact met je op. Je ontvangt een email zodra we reageren.',
            ai_confidence: 1.0,
          });

          return {
            success: true,
            escalated: true,
            reason: reason as string,
            message: 'Issue geëscaleerd naar admin. Klant is geïnformeerd.',
          };
        } catch (error) {
          console.error('[Support] escalate_to_admin error:', error);
          return {
            success: false,
            escalated: false,
            message: 'Fout bij escaleren naar admin.',
          };
        }
      },
    },

    {
      name: 'get_customer_history',
      description: 'Bekijk eerdere support gesprekken van deze klant om context te krijgen',
      parameters: {
        customer_id: {
          type: 'string',
          description: 'Customer ID',
          required: true,
        },
        limit: {
          type: 'number',
          description: 'Maximum aantal gesprekken (default: 5)',
          required: false,
        },
      },
      execute: async ({ customer_id, limit = 5 }) => {
        console.log(`[Support] Getting history for customer: ${customer_id}`);
        try {
          if (!context.getCustomerConversations) {
            return {
              success: false,
              message: 'Functie niet beschikbaar.',
            };
          }

          const conversations = await context.getCustomerConversations(
            customer_id as string,
            limit as number
          );

          if (conversations.length === 0) {
            return {
              success: true,
              total_conversations: 0,
              conversations: [],
              message: 'Dit is het eerste support gesprek van deze klant.',
            };
          }

          return {
            success: true,
            total_conversations: conversations.length,
            conversations: conversations.map((c) => ({
              id: c.id,
              subject: c.subject,
              status: c.status,
              category: c.category,
              created_at: c.created_at,
              resolution: c.resolution_type,
            })),
            message: `${conversations.length} eerdere gesprek(ken) gevonden.`,
          };
        } catch (error) {
          console.error('[Support] get_customer_history error:', error);
          return {
            success: false,
            message: 'Fout bij ophalen geschiedenis.',
          };
        }
      },
    },

    {
      name: 'get_plan_usage',
      description: 'Check plan limieten en huidig gebruik van de klant',
      parameters: {
        customer_id: {
          type: 'string',
          description: 'Customer ID',
          required: true,
        },
      },
      execute: async ({ customer_id }) => {
        console.log(`[Support] Getting plan usage for: ${customer_id}`);
        try {
          if (!context.getCustomerUsage) {
            return {
              success: false,
              message: 'Functie niet beschikbaar.',
            };
          }

          const usage = await context.getCustomerUsage(customer_id as string);

          const apiPercentage = Math.round((usage.apiCallsUsed / usage.apiCallsLimit) * 100);
          const atLimit = usage.apiCallsUsed >= usage.apiCallsLimit;
          const nearLimit = apiPercentage >= 80;

          return {
            success: true,
            plan: usage.plan,
            api_calls: {
              used: usage.apiCallsUsed,
              limit: usage.apiCallsLimit,
              percentage: apiPercentage,
              at_limit: atLimit,
            },
            divisions: {
              used: usage.divisionsUsed,
              limit: usage.divisionsLimit,
              at_limit: usage.divisionsUsed >= usage.divisionsLimit,
            },
            recommendation: atLimit
              ? 'Klant heeft limiet bereikt - upgrade naar hoger plan suggereren'
              : nearLimit
                ? 'Klant nadert limiet (>80%) - overweeg upgrade te bespreken'
                : null,
            message: atLimit
              ? 'Klant heeft API limiet bereikt.'
              : `Klant gebruikt ${apiPercentage}% van API limiet.`,
          };
        } catch (error) {
          console.error('[Support] get_plan_usage error:', error);
          return {
            success: false,
            message: 'Fout bij ophalen usage.',
          };
        }
      },
    },
  ];
}

// Legacy export for backwards compatibility
export const supportAgentTools: AgentTool[] = [];
