/**
 * Anthropic Claude API Client
 *
 * Handles tool-use loops and message processing for AI agents.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AgentTool } from '../support-agent/tools';

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string | Anthropic.ContentBlock[];
}

export interface AgentRunOptions {
  systemPrompt: string;
  tools: AgentTool[];
  messages: AgentMessage[];
  maxIterations?: number;
  model?: string;
}

export interface AgentRunResult {
  success: boolean;
  response: string;
  toolCalls: ToolCallRecord[];
  iterations: number;
  error?: string;
}

export interface ToolCallRecord {
  name: string;
  input: Record<string, unknown>;
  output: unknown;
  timestamp: string;
}

/**
 * Convert internal AgentTool format to Anthropic tool format
 */
function convertToAnthropicTools(tools: AgentTool[]): Anthropic.Tool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object' as const,
      properties: Object.fromEntries(
        Object.entries(tool.parameters).map(([key, schema]) => [
          key,
          {
            type: schema.type,
            description: schema.description,
          },
        ])
      ),
      required: Object.entries(tool.parameters)
        .filter(([_, schema]) => schema.required)
        .map(([key]) => key),
    },
  }));
}

/**
 * Execute a tool call
 */
async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  tools: AgentTool[]
): Promise<{ result: unknown; error?: string }> {
  const tool = tools.find((t) => t.name === toolName);

  if (!tool) {
    return { result: null, error: `Unknown tool: ${toolName}` };
  }

  try {
    const result = await tool.execute(toolInput);
    return { result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Agent] Tool ${toolName} failed:`, errorMessage);
    return { result: null, error: errorMessage };
  }
}

/**
 * Extract text content from Claude response
 */
function extractTextContent(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

/**
 * Run an agent with tool-use loop
 *
 * This function handles the conversation loop where Claude can call tools
 * multiple times before giving a final response.
 */
export async function runAgent(
  apiKey: string,
  options: AgentRunOptions
): Promise<AgentRunResult> {
  const {
    systemPrompt,
    tools,
    messages: initialMessages,
    maxIterations = 10,
    model = 'claude-sonnet-4-20250514',
  } = options;

  const client = new Anthropic({ apiKey });
  const anthropicTools = convertToAnthropicTools(tools);

  // Convert messages to Anthropic format
  const messages: Anthropic.MessageParam[] = initialMessages.map((msg) => ({
    role: msg.role,
    content:
      typeof msg.content === 'string'
        ? msg.content
        : (msg.content as Anthropic.MessageParam['content']),
  }));

  const toolCalls: ToolCallRecord[] = [];
  let iterations = 0;

  try {
    while (iterations < maxIterations) {
      iterations++;

      // Call Claude
      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        tools: anthropicTools,
        messages,
      });

      // Check if Claude wants to use tools
      if (response.stop_reason === 'tool_use') {
        // Extract tool use blocks
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        if (toolUseBlocks.length === 0) {
          // No tool calls, return the text response
          return {
            success: true,
            response: extractTextContent(response.content),
            toolCalls,
            iterations,
          };
        }

        // Add assistant message with tool calls
        messages.push({
          role: 'assistant',
          content: response.content as Anthropic.MessageParam['content'],
        });

        // Execute each tool and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          const { result, error } = await executeTool(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
            tools
          );

          // Record the tool call
          toolCalls.push({
            name: toolUse.name,
            input: toolUse.input as Record<string, unknown>,
            output: error || result,
            timestamp: new Date().toISOString(),
          });

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: error
              ? `Error: ${error}`
              : typeof result === 'string'
              ? result
              : JSON.stringify(result, null, 2),
          });
        }

        // Add tool results as user message
        messages.push({
          role: 'user',
          content: toolResults,
        });

        // Continue the loop
        continue;
      }

      // Claude finished without more tool calls
      return {
        success: true,
        response: extractTextContent(response.content),
        toolCalls,
        iterations,
      };
    }

    // Max iterations reached
    return {
      success: false,
      response: 'Agent reached maximum iterations without completing.',
      toolCalls,
      iterations,
      error: 'Max iterations reached',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Agent] Run failed:', errorMessage);

    return {
      success: false,
      response: '',
      toolCalls,
      iterations,
      error: errorMessage,
    };
  }
}

/**
 * Create a simple completion without tools
 */
export async function createCompletion(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  model = 'claude-sonnet-4-20250514'
): Promise<string> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return extractTextContent(response.content);
}
