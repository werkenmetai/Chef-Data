/**
 * Exact Online API Health Check
 *
 * Provides proactive health monitoring for Exact Online API connectivity.
 * Uses a lightweight endpoint to check API availability and measure latency.
 *
 * @see EXACT-009 in operations/ROADMAP.md
 */

import { ConnectionInfo } from '../auth/api-key';
import { REGION_CONFIGS, ExactRegion } from './regions';

/**
 * Result of an API health check
 */
export interface HealthCheckResult {
  /** Whether the API is responding successfully */
  healthy: boolean;
  /** Round-trip latency in milliseconds */
  latencyMs: number;
  /** Error message if unhealthy */
  error?: string;
}

/**
 * Check the health of the Exact Online API for a given connection and division.
 *
 * Uses the system/Divisions endpoint with minimal data retrieval ($top=1, $select=Code)
 * to verify API connectivity with minimal overhead.
 *
 * @param connection - The connection info containing access token and region
 * @param division - The division code to check
 * @returns Health check result with status, latency, and any error
 *
 * @example
 * ```typescript
 * const result = await checkExactApiHealth(connection, 12345);
 * if (result.healthy) {
 *   console.log(`API healthy, latency: ${result.latencyMs}ms`);
 * } else {
 *   console.error(`API unhealthy: ${result.error}`);
 * }
 * ```
 */
export async function checkExactApiHealth(
  connection: ConnectionInfo,
  division: number
): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    // Get the API base URL for the connection's region
    const regionConfig = REGION_CONFIGS[connection.region as ExactRegion];
    if (!regionConfig) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: `Unknown region: ${connection.region}`,
      };
    }

    // Use a lightweight endpoint to check connectivity
    // system/Divisions is available without division context and returns minimal data
    const url = `${regionConfig.apiBaseUrl}/${division}/system/Divisions?$top=1&$select=Code`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        Accept: 'application/json',
      },
    });

    const latencyMs = Date.now() - start;

    if (response.ok) {
      return { healthy: true, latencyMs };
    }

    // Include status code and status text in error
    return {
      healthy: false,
      latencyMs,
      error: `HTTP ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    // Handle network errors, timeouts, etc.
    const latencyMs = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      healthy: false,
      latencyMs,
      error: errorMessage,
    };
  }
}

/**
 * Check the health of multiple connections in parallel.
 *
 * Useful for monitoring all user connections at once.
 *
 * @param connections - Array of connection info objects
 * @param getDivision - Function to get division code for each connection
 * @returns Map of connection ID to health check result
 *
 * @example
 * ```typescript
 * const results = await checkMultipleConnections(
 *   authContext.connections,
 *   (conn) => conn.divisions[0]?.code ?? 0
 * );
 * for (const [connId, result] of results) {
 *   console.log(`${connId}: ${result.healthy ? 'OK' : result.error}`);
 * }
 * ```
 */
export async function checkMultipleConnections(
  connections: ConnectionInfo[],
  getDivision: (connection: ConnectionInfo) => number
): Promise<Map<string, HealthCheckResult>> {
  const results = new Map<string, HealthCheckResult>();

  const checks = connections.map(async (connection) => {
    const division = getDivision(connection);
    const result = await checkExactApiHealth(connection, division);
    return { id: connection.id, result };
  });

  const settledChecks = await Promise.all(checks);

  for (const { id, result } of settledChecks) {
    results.set(id, result);
  }

  return results;
}
