/**
 * MCP Protocol Types
 */

/**
 * JSON-RPC 2.0 Request
 */
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

/**
 * JSON-RPC 2.0 Response
 */
export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: MCPError;
}

/**
 * JSON-RPC 2.0 Error
 */
export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * MCP Tool Annotations
 * @see https://modelcontextprotocol.io/specification/2024-11-05/server/tools#tool-annotations
 */
export interface ToolAnnotations {
  /**
   * If true, the tool does not modify any state and only reads data.
   * All Exact Online MCP tools are read-only.
   */
  readOnlyHint?: boolean;
  /**
   * If true, the tool may perform destructive operations (delete, overwrite).
   * None of our tools are destructive.
   */
  destructiveHint?: boolean;
  /**
   * If true, calling the tool multiple times with same args has no additional effect.
   * All our read-only tools are idempotent.
   */
  idempotentHint?: boolean;
  /**
   * If true, the tool interacts with external entities.
   * Our tools interact with Exact Online API.
   */
  openWorldHint?: boolean;
}

/**
 * MCP Tool Definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, PropertySchema>;
    required?: string[];
  };
  /**
   * Output schema for the tool response
   * Improves IDE autocomplete and tool discovery
   * @see MCP-002 in operations/ROADMAP.md
   */
  outputSchema?: {
    type: 'object';
    properties: Record<string, PropertySchema>;
    required?: string[];
  };
  /**
   * Tool annotations for MCP clients
   * @see https://modelcontextprotocol.io/specification/2024-11-05/server/tools#tool-annotations
   */
  annotations?: ToolAnnotations;
}

/**
 * JSON Schema Property
 */
export interface PropertySchema {
  type: string;
  description?: string;
  enum?: (string | number)[];
  default?: unknown;
  format?: string;
  items?: PropertySchema;
}

/**
 * MCP Tool Result
 */
export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/**
 * MCP Server Capabilities
 */
export interface ServerCapabilities {
  tools?: Record<string, never>;
  resources?: Record<string, never>;
  prompts?: Record<string, never>;
}

/**
 * MCP Server Info
 */
export interface ServerInfo {
  name: string;
  version: string;
}

/**
 * MCP Prompt Argument Definition
 */
export interface PromptArgument {
  name: string;
  description: string;
  required?: boolean;
}

/**
 * MCP Prompt Definition
 */
export interface PromptDefinition {
  name: string;
  description: string;
  arguments?: PromptArgument[];
}

/**
 * MCP Prompt Message
 */
export interface PromptMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text';
    text: string;
  };
}

/**
 * MCP Get Prompt Result
 */
export interface GetPromptResult {
  description?: string;
  messages: PromptMessage[];
}
