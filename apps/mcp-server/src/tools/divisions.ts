/**
 * List Divisions Tool
 *
 * Lists all Exact Online divisions (administraties) accessible to the user.
 * This is typically the first tool used to discover which divisions are available.
 *
 * Note: This tool proactively refreshes expired tokens to ensure accurate
 * token status reporting (since it doesn't make Exact API calls that would
 * trigger automatic refresh).
 */

import { ToolDefinition } from '../types';
import { BaseTool, DEFAULT_TOOL_ANNOTATIONS } from './_base';
import { ConnectionInfo } from '../auth/api-key';

export class ListDivisionsTool extends BaseTool {
  /**
   * Ensure token is fresh before reporting status.
   * This tool doesn't make Exact API calls, so we need to proactively
   * refresh expired tokens to get accurate status.
   */
  private async ensureTokenFresh(connection: ConnectionInfo): Promise<ConnectionInfo> {
    const now = Date.now();
    const expiresAt = connection.tokenExpiresAt.getTime();
    const bufferMs = 3 * 60 * 1000; // 3 minutes buffer (same as exactRequest)

    // If token is valid, return as-is
    if (expiresAt - now > bufferMs) {
      return connection;
    }

    // Token expired or expiring soon - try to refresh
    try {
      await this.refreshToken(connection);
      // Connection object is mutated by refreshToken (tokenExpiresAt updated)
      // Return the updated connection
      return connection;
    } catch {
      // Refresh failed - return original connection (status will show expired)
      return connection;
    }
  }

  definition: ToolDefinition = {
    name: 'list_divisions',
    description:
      'List all Exact Online divisions (administraties) accessible to the current user. ' +
      'Returns division code, name, and region for each division. ' +
      'Use this to discover which divisions are available before querying other data.',
    inputSchema: {
      type: 'object',
      properties: {
        region: {
          type: 'string',
          description: 'Filter by region (NL, BE, DE, UK, US, ES, FR). Leave empty for all regions.',
          enum: ['NL', 'BE', 'DE', 'UK', 'US', 'ES', 'FR'],
        },
      },
    },
    annotations: DEFAULT_TOOL_ANNOTATIONS,
  };

  async run(params: Record<string, unknown>): Promise<unknown> {
    const regionFilter = params.region as string | undefined;

    // Check if user has any connections
    if (!this.authContext || this.authContext.connections.length === 0) {
      return {
        error: 'No Exact Online connections found. Please connect at https://praatmetjeboekhouding.nl/connect',
        divisions: [],
        total: 0,
      };
    }

    // Filter connections by region if specified
    const connections = regionFilter
      ? this.authContext.connections.filter(c => c.region === regionFilter)
      : this.authContext.connections;

    if (connections.length === 0) {
      return {
        error: `No connection found for region: ${regionFilter}. Available regions: ${this.authContext.connections.map(c => c.region).join(', ')}`,
        divisions: [],
        total: 0,
      };
    }

    // Collect all divisions from all matching connections
    const divisions: Array<{
      code: number;
      name: string;
      region: string;
      is_default: boolean;
    }> = [];

    for (const conn of connections) {
      for (const div of conn.divisions) {
        divisions.push({
          code: div.code,
          name: div.name,
          region: conn.region,
          is_default: div.isDefault,
        });
      }
    }

    // Sort by region, then by name
    divisions.sort((a, b) => {
      if (a.region !== b.region) return a.region.localeCompare(b.region);
      return a.name.localeCompare(b.name);
    });

    // Add token status for debugging/transparency
    // BUG-006/P15: Include token expiry info to help diagnose token issues
    // Proactively refresh expired tokens to ensure accurate status reporting
    const connectionStatus = await Promise.all(connections.map(async conn => {
      // Check if token needs refresh (expired or within 3-minute buffer)
      const refreshedConn = await this.ensureTokenFresh(conn);
      const tokenStatus = this.getTokenStatus(refreshedConn);
      return {
        region: refreshedConn.region,
        ...tokenStatus,
      };
    }));

    return {
      divisions,
      total: divisions.length,
      regions: [...new Set(connections.map(c => c.region))],
      user: this.authContext.email,
      connection_status: connectionStatus,
    };
  }
}
