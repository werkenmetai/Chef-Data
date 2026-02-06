/**
 * Support Agent
 *
 * Handles L1/L2 customer support automatically.
 * Uses Claude to understand customer issues and respond appropriately.
 */

import { SUPPORT_AGENT_PROMPT } from './prompt';
import {
  createSupportAgentTools,
  type SupportToolContext,
  customerWantsHuman,
  containsBlockedContent,
  checkGuardRails,
  AI_RESPONSE_LIMIT,
  CONFIDENCE_THRESHOLD,
  HUMAN_REQUEST_PATTERNS,
  BLOCKED_CONTENT_PATTERNS,
} from './tools';
import { runAgent, type AgentMessage, type ToolCallRecord } from '../lib/anthropic';

// Re-export guard rails for use by other modules
export {
  customerWantsHuman,
  containsBlockedContent,
  checkGuardRails,
  AI_RESPONSE_LIMIT,
  CONFIDENCE_THRESHOLD,
  HUMAN_REQUEST_PATTERNS,
  BLOCKED_CONTENT_PATTERNS,
};

export class SupportAgent {
  private prompt: string;
  private apiKey: string;
  private toolContext: SupportToolContext;

  constructor(apiKey: string, toolContext: SupportToolContext) {
    this.prompt = SUPPORT_AGENT_PROMPT;
    this.apiKey = apiKey;
    this.toolContext = toolContext;
  }

  /**
   * Handle a new support ticket
   */
  async handleTicket(
    conversationId: string,
    context: SupportContext
  ): Promise<SupportResult> {
    console.log(`[Support Agent] Handling conversation: ${conversationId}`);

    // Build conversation history for Claude
    const messages: AgentMessage[] = [];

    // Add previous messages as context
    if (context.previousMessages && context.previousMessages.length > 0) {
      for (const msg of context.previousMessages) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }

    // Add the current ticket content
    messages.push({
      role: 'user',
      content: this.buildUserMessage(context),
    });

    // Get tools with context
    const tools = createSupportAgentTools(this.toolContext);

    try {
      // Run the agent
      const result = await runAgent(this.apiKey, {
        systemPrompt: this.prompt,
        tools,
        messages,
        maxIterations: 5,
      });

      if (!result.success) {
        console.error(`[Support Agent] Failed:`, result.error);
        return {
          conversationId,
          action: 'pending',
          message: 'Er is een fout opgetreden bij het verwerken van je vraag.',
          error: result.error,
        };
      }

      // Analyze the result to determine action
      const action = this.determineAction(result.toolCalls);

      return {
        conversationId,
        action,
        message: result.response,
        toolCalls: result.toolCalls,
        escalateTo: action === 'escalated' ? this.getEscalationTarget(result.toolCalls) : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Support Agent] Error:`, errorMessage);

      return {
        conversationId,
        action: 'pending',
        message: 'Er is een onverwachte fout opgetreden.',
        error: errorMessage,
      };
    }
  }

  /**
   * Build the user message with context
   */
  private buildUserMessage(context: SupportContext): string {
    let message = context.ticketContent;

    if (context.customerId) {
      message = `[Klant ID: ${context.customerId}]\n\n${message}`;
    }

    if (context.category) {
      message = `[Categorie: ${context.category}]\n\n${message}`;
    }

    if (context.errorCode) {
      message = `[Error Code: ${context.errorCode}]\n\n${message}`;
    }

    // Add admin instructions if present
    if (context.adminInstructions) {
      message = `[Admin Instructie van ${context.adminInstructedAt || 'nu'}]\n${context.adminInstructions}\n\n---\nOriginele vraag van klant:\n${message}`;
    }

    return message;
  }

  /**
   * Determine the action based on tool calls
   */
  private determineAction(
    toolCalls: ToolCallRecord[]
  ): 'resolved' | 'escalated' | 'responded' | 'pending' {
    // Check if escalated to devops or admin
    const escalatedToDevops = toolCalls.some((tc) => tc.name === 'escalate_to_devops');
    const escalatedToAdmin = toolCalls.some((tc) => tc.name === 'escalate_to_admin');
    if (escalatedToDevops || escalatedToAdmin) return 'escalated';

    // Check if responded to customer with ticket close
    const responded = toolCalls.find((tc) => tc.name === 'respond_to_customer');
    if (responded) {
      const input = responded.input as { close_ticket?: boolean };
      return input.close_ticket ? 'resolved' : 'responded';
    }

    // Check if any action was taken
    if (toolCalls.length > 0) {
      return 'responded';
    }

    return 'pending';
  }

  /**
   * Get escalation target from tool calls
   */
  private getEscalationTarget(
    toolCalls: ToolCallRecord[]
  ): 'devops' | 'human' | undefined {
    const escalationToDevops = toolCalls.find((tc) => tc.name === 'escalate_to_devops');
    if (escalationToDevops) return 'devops';

    const escalationToAdmin = toolCalls.find((tc) => tc.name === 'escalate_to_admin');
    if (escalationToAdmin) return 'human';

    return undefined;
  }

  /**
   * Analyze a message to determine triage info without full tool execution
   */
  async analyzeMessage(content: string): Promise<MessageAnalysis> {
    // Use Claude to analyze the message
    const analysisPrompt = `
Analyseer dit support bericht en geef de volgende informatie:
- category: connection, billing, bug, feature, account, of other
- priority: low, normal, high, of urgent
- sentiment: positive, neutral, of negative
- keywords: relevante zoektermen (max 5)
- requires_human: true als dit menselijke aandacht nodig heeft

Bericht:
${content}

Geef je antwoord in JSON formaat.`;

    try {
      const result = await runAgent(this.apiKey, {
        systemPrompt: 'Je bent een support message analyzer. Geef alleen JSON output.',
        tools: [],
        messages: [{ role: 'user', content: analysisPrompt }],
        maxIterations: 1,
      });

      // Parse JSON from response
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as MessageAnalysis;
      }

      return this.defaultAnalysis();
    } catch {
      return this.defaultAnalysis();
    }
  }

  private defaultAnalysis(): MessageAnalysis {
    return {
      category: 'other',
      priority: 'normal',
      sentiment: 'neutral',
      keywords: [],
      requires_human: false,
    };
  }

  /**
   * Get available tools for this agent
   */
  getTools() {
    return createSupportAgentTools(this.toolContext);
  }

  /**
   * Get the system prompt
   */
  getPrompt(): string {
    return this.prompt;
  }
}

export interface SupportContext {
  customerId?: string;
  ticketContent: string;
  category?: string;
  errorCode?: string;
  previousMessages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    sender_type?: 'user' | 'ai' | 'admin' | 'system';
  }>;
  /** Admin instructions to follow (from email reply) */
  adminInstructions?: string;
  /** When the admin instructed */
  adminInstructedAt?: string;
  /** Source of the trigger (e.g., 'admin_email_reply') */
  source?: string;
}

export interface SupportResult {
  conversationId: string;
  action: 'resolved' | 'escalated' | 'responded' | 'pending';
  message: string;
  toolCalls?: ToolCallRecord[];
  escalateTo?: 'devops' | 'human';
  error?: string;
}

export interface MessageAnalysis {
  category: string;
  priority: string;
  sentiment: string;
  keywords: string[];
  requires_human: boolean;
}
