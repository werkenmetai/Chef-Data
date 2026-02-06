/**
 * MCP Protocol Server
 *
 * Handles the Model Context Protocol communication with Claude.
 */

import {
  Env,
  MCPRequest,
  MCPResponse,
  MCPError,
  ToolDefinition,
  PromptDefinition,
  GetPromptResult,
} from '../types';
import { logger } from '../lib/logger';
import { ToolRegistry } from './tools';
import { AuthContext } from '../auth/api-key';

export class MCPServer {
  private env: Env;
  private ctx: ExecutionContext;
  private toolRegistry: ToolRegistry;
  private authContext: AuthContext | null;

  constructor(env: Env, ctx: ExecutionContext, authContext: AuthContext | null) {
    this.env = env;
    this.ctx = ctx;
    this.authContext = authContext;
    this.toolRegistry = new ToolRegistry();
  }

  /**
   * Get list of available tools (for public /tools endpoint)
   */
  getToolsList(): ToolDefinition[] {
    return this.toolRegistry.listTools();
  }

  async handleRequest(request: Request): Promise<Response> {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return this.errorResponse(
        null,
        -32600,
        'Invalid Request: Only POST method is allowed'
      );
    }

    // Parse JSON body
    let body: MCPRequest;
    try {
      body = await request.json();
    } catch {
      return this.errorResponse(null, -32700, 'Parse error: Invalid JSON');
    }

    // Validate JSON-RPC format
    if (body.jsonrpc !== '2.0' || !body.method) {
      return this.errorResponse(
        body.id ?? null,
        -32600,
        'Invalid Request: Missing jsonrpc version or method'
      );
    }

    // Route to appropriate handler
    try {
      const result = await this.handleMethod(body.method, body.params);
      return this.successResponse(body.id, result);
    } catch (error) {
      if (error instanceof MCPMethodError) {
        return this.errorResponse(body.id, error.code, error.message, error.data);
      }
      logger.error('Unexpected error in MCP server', error instanceof Error ? error : undefined);
      return this.errorResponse(
        body.id,
        -32603,
        'Internal error',
        error instanceof Error ? error.message : undefined
      );
    }
  }

  private async handleMethod(
    method: string,
    params?: Record<string, unknown>
  ): Promise<unknown> {
    switch (method) {
      case 'initialize':
        return this.handleInitialize(params);

      case 'tools/list':
        return this.handleToolsList();

      case 'tools/call':
        return this.handleToolsCall(params);

      case 'resources/list':
        return this.handleResourcesList();

      case 'resources/read':
        return this.handleResourcesRead(params);

      case 'prompts/list':
        return this.handlePromptsList();

      case 'prompts/get':
        return this.handlePromptsGet(params);

      default:
        throw new MCPMethodError(-32601, `Method not found: ${method}`);
    }
  }

  private handleInitialize(params?: Record<string, unknown>): object {
    // Negotiate protocol version with client
    // Support both older (2025-06-18) and newer (2025-11-25) versions
    const supportedVersions = ['2025-11-25', '2025-06-18'];
    const clientVersion = (params?.protocolVersion as string) || '2025-11-25';
    const protocolVersion = supportedVersions.includes(clientVersion)
      ? clientVersion
      : '2025-06-18'; // Fallback to widely supported version

    // Include user info if authenticated
    const userInfo = this.authContext
      ? {
          email: this.authContext.email,
          plan: this.authContext.plan,
          connections: this.authContext.connections.length,
          divisions: this.authContext.connections.reduce(
            (sum, c) => sum + c.divisions.length,
            0
          ),
        }
      : null;

    return {
      protocolVersion,
      serverInfo: {
        name: 'exact-online-mcp',
        version: '0.1.0',
        description: 'MCP server for Exact Online financial data',
      },
      // @see MCP-003 in operations/ROADMAP.md
      capabilities: {
        tools: { listChanged: true },
        resources: {},
        prompts: {},
      },
      ...(userInfo && { userInfo }),
    };
  }

  private handleToolsList(): object {
    const tools = this.toolRegistry.listTools();
    return { tools };
  }

  private async handleToolsCall(
    params?: Record<string, unknown>
  ): Promise<object> {
    if (!params || typeof params.name !== 'string') {
      throw new MCPMethodError(-32602, 'Invalid params: tool name required');
    }

    const toolName = params.name;
    const toolArgs = (params.arguments as Record<string, unknown>) ?? {};

    // Pass auth context to tool registry
    const result = await this.toolRegistry.callTool(
      toolName,
      toolArgs,
      this.env,
      this.ctx,
      this.authContext
    );

    return result;
  }

  private handleResourcesList(): object {
    const resources: Array<{
      uri: string;
      name: string;
      description: string;
      mimeType: string;
    }> = [
      {
        uri: 'exact://divisions',
        name: 'Exact Online Divisions',
        description: 'List of available divisions for the authenticated user',
        mimeType: 'application/json',
      },
      {
        uri: 'exact://connections',
        name: 'Exact Online Connections',
        description: 'List of Exact Online connections and their status',
        mimeType: 'application/json',
      },
    ];

    return { resources };
  }

  private handleResourcesRead(params?: Record<string, unknown>): object {
    if (!params || typeof params.uri !== 'string') {
      throw new MCPMethodError(-32602, 'Invalid params: uri required');
    }

    const uri = params.uri;

    switch (uri) {
      case 'exact://divisions': {
        if (!this.authContext) {
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Not authenticated', divisions: [] }),
              },
            ],
          };
        }

        const divisions = this.authContext.connections.flatMap((conn) =>
          conn.divisions.map((div) => ({
            code: div.code,
            name: div.name,
            isDefault: div.isDefault,
            connectionId: conn.id,
            region: conn.region,
          }))
        );

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ divisions }),
            },
          ],
        };
      }

      case 'exact://connections': {
        if (!this.authContext) {
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({ error: 'Not authenticated', connections: [] }),
              },
            ],
          };
        }

        const connections = this.authContext.connections.map((conn) => ({
          id: conn.id,
          region: conn.region,
          tokenExpiresAt: conn.tokenExpiresAt.toISOString(),
          divisionCount: conn.divisions.length,
        }));

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                email: this.authContext.email,
                plan: this.authContext.plan,
                connections,
              }),
            },
          ],
        };
      }

      default:
        throw new MCPMethodError(-32602, `Unknown resource URI: ${uri}`);
    }
  }

  /**
   * Available prompt templates
   */
  private static readonly PROMPTS: PromptDefinition[] = [
    {
      name: 'financial_analysis',
      description: 'Analyze financial data from Exact Online for a specific division',
      arguments: [
        { name: 'division', description: 'Division code to analyze', required: true },
        {
          name: 'period',
          description: 'Time period to analyze (e.g., "2024-Q1", "2024", "last-month")',
          required: false,
        },
      ],
    },
    {
      name: 'invoice_summary',
      description: 'Summarize outstanding invoices and receivables status',
      arguments: [
        { name: 'division', description: 'Division code', required: true },
        {
          name: 'status',
          description: 'Filter by invoice status (e.g., "open", "overdue", "all")',
          required: false,
        },
      ],
    },
    {
      name: 'cash_flow_overview',
      description: 'Get an overview of cash flow including receivables and payables',
      arguments: [{ name: 'division', description: 'Division code', required: true }],
    },
    // MCP-PROMPTS: New workflow prompts added 2026-02-04
    {
      name: 'financial_health_check',
      description: 'Maandelijkse financiële gezondheidscheck: P&L, cashflow en openstaande posten',
      arguments: [
        { name: 'division', description: 'Division code', required: true },
        {
          name: 'month',
          description: 'Maand om te analyseren (bijv. "januari", "2026-01"). Zonder = vorige maand.',
          required: false,
        },
      ],
    },
    {
      name: 'debtor_collection',
      description: 'Debiteurenbeheer workflow: achterstallige facturen identificeren en actie ondernemen',
      arguments: [
        { name: 'division', description: 'Division code', required: true },
        {
          name: 'days_overdue',
          description: 'Minimaal aantal dagen achterstallig (default: 14)',
          required: false,
        },
      ],
    },
    {
      name: 'vat_preparation',
      description: 'BTW aangifte voorbereiding: BTW samenvatting, controles en export',
      arguments: [
        { name: 'division', description: 'Division code', required: true },
        {
          name: 'period',
          description: 'BTW periode (bijv. "Q1-2026", "januari-2026"). Zonder = huidige kwartaal.',
          required: false,
        },
      ],
    },
  ];

  private handlePromptsList(): object {
    return { prompts: MCPServer.PROMPTS };
  }

  private handlePromptsGet(params?: Record<string, unknown>): GetPromptResult {
    if (!params || typeof params.name !== 'string') {
      throw new MCPMethodError(-32602, 'Invalid params: prompt name required');
    }

    const promptName = params.name;
    const promptArgs = (params.arguments as Record<string, string>) ?? {};

    const prompt = MCPServer.PROMPTS.find((p) => p.name === promptName);
    if (!prompt) {
      throw new MCPMethodError(-32602, `Unknown prompt: ${promptName}`);
    }

    // Validate required arguments
    const requiredArgs = prompt.arguments?.filter((arg) => arg.required) ?? [];
    for (const arg of requiredArgs) {
      if (!promptArgs[arg.name]) {
        throw new MCPMethodError(
          -32602,
          `Missing required argument: ${arg.name}`
        );
      }
    }

    // Generate prompt content based on the template
    const content = this.generatePromptContent(promptName, promptArgs);

    return {
      description: prompt.description,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: content,
          },
        },
      ],
    };
  }

  private generatePromptContent(
    promptName: string,
    args: Record<string, string>
  ): string {
    switch (promptName) {
      case 'financial_analysis': {
        const period = args.period ? ` for ${args.period}` : '';
        return `Please analyze the financial data from Exact Online for division ${args.division}${period}.

Use the available MCP tools to:
1. Retrieve the general ledger accounts and their balances
2. Get the trial balance data
3. Analyze revenue and expense trends
4. Identify any notable patterns or anomalies

Provide a summary with key insights and recommendations.`;
      }

      case 'invoice_summary': {
        const statusFilter = args.status ? ` Filter by status: ${args.status}.` : '';
        return `Please provide a summary of invoices for division ${args.division}.${statusFilter}

Use the available MCP tools to:
1. List all outstanding invoices (receivables)
2. Calculate the total amount due
3. Identify overdue invoices and their aging
4. Summarize by customer if possible

Highlight any invoices that require immediate attention.`;
      }

      case 'cash_flow_overview': {
        return `Please provide a cash flow overview for division ${args.division}.

Use the available MCP tools to:
1. Get current receivables (money owed to the company)
2. Get current payables (money the company owes)
3. Calculate net cash position
4. Identify upcoming payment obligations

Provide a clear picture of the company's short-term liquidity.`;
      }

      // MCP-PROMPTS: New workflow prompts
      case 'financial_health_check': {
        const month = args.month ? ` voor ${args.month}` : ' voor de afgelopen maand';
        return `Voer een financiële gezondheidscheck uit voor administratie ${args.division}${month}.

Gebruik de beschikbare MCP tools voor:
1. **Winst & Verlies (get_profit_loss)**: Omzet, kosten, brutowinst
2. **Cashflow (get_cashflow_forecast)**: Verwachte in- en uitgaande geldstromen
3. **Openstaande facturen (get_outstanding_invoices)**: Debiteuren en crediteuren
4. **Ouderdomsanalyse (get_aging_analysis)**: Verouderde openstaande posten

Geef een samenvatting met:
- Financiële kerncijfers (omzet, kosten, winst)
- Cashpositie en liquiditeitsstatus
- Aandachtspunten (achterstallige facturen, grote openstaande posten)
- Aanbevelingen voor actie

Presenteer dit als een executive summary voor de ondernemer.`;
      }

      case 'debtor_collection': {
        const minDays = args.days_overdue || '14';
        return `Start een debiteurenbeheer workflow voor administratie ${args.division}.
Focus op facturen die minimaal ${minDays} dagen achterstallig zijn.

Gebruik de beschikbare MCP tools voor:
1. **Openstaande facturen (get_outstanding_invoices)**: Filter op debiteuren (te ontvangen)
2. **Ouderdomsanalyse (get_aging_receivables)**: Categoriseer naar ouderdom
3. **Klantgegevens (search_relations)**: Contactinformatie voor follow-up

Geef per achterstallige factuur:
- Factuurnummer, bedrag, vervaldatum
- Aantal dagen achterstallig
- Klantgegevens (naam, contactpersoon indien beschikbaar)
- Suggestie voor actie (herinnering, telefonisch contact, incasso)

Prioriteer de lijst op:
1. Hoogste bedragen eerst
2. Langst achterstallig

Sluit af met een totaaloverzicht: aantal achterstallige facturen, totaalbedrag, gemiddelde ouderdom.`;
      }

      case 'vat_preparation': {
        const period = args.period ? ` voor ${args.period}` : ' voor het huidige kwartaal';
        return `Bereid de BTW aangifte voor${period} voor administratie ${args.division}.

Gebruik de beschikbare MCP tools voor:
1. **BTW samenvatting (get_vat_summary)**: Totaal af te dragen en te vorderen BTW
2. **Verkoopfacturen (get_sales_invoices)**: Uitgaande facturen met BTW
3. **Inkoopfacturen (get_purchase_invoices)**: Inkomende facturen met BTW
4. **Grootboekrekeningen (get_gl_accounts)**: BTW-gerelateerde rekeningen

Controleer:
- Totaal BTW verschuldigd (verkopen)
- Totaal BTW voorheffing (inkopen)
- Netto af te dragen / te ontvangen
- Afwijkingen of inconsistenties

Geef een overzicht in het format:
| Omschrijving | Bedrag |
|--------------|--------|
| BTW op verkopen (1a) | € ... |
| BTW op inkopen (5b) | € ... |
| **Te betalen** | € ... |

Voeg eventuele aandachtspunten toe (ontbrekende facturen, ongebruikelijke bedragen).`;
      }

      default:
        throw new MCPMethodError(-32602, `Unknown prompt: ${promptName}`);
    }
  }

  private successResponse(id: string | number | null, result: unknown): Response {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: id ?? 0,
      result,
    };
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private errorResponse(
    id: string | number | null,
    code: number,
    message: string,
    data?: unknown
  ): Response {
    const error: MCPError = { code, message };
    if (data !== undefined) {
      error.data = data;
    }

    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: id ?? 0,
      error,
    };
    return new Response(JSON.stringify(response), {
      status: code === -32700 || code === -32600 ? 400 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

class MCPMethodError extends Error {
  code: number;
  data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = 'MCPMethodError';
  }
}
