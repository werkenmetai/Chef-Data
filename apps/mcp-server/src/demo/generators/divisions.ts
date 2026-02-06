/**
 * Demo Generator: list_divisions
 *
 * Returns demo division info for the current demo industry.
 */

import { getCurrentIndustryConfig, DEMO_AUTH_CONTEXT } from '../context';

export function generateListDivisionsResponse(
  _params: Record<string, unknown>
): unknown {
  const config = getCurrentIndustryConfig();

  // Simulate token status - always healthy in demo mode
  const connectionStatus = [
    {
      region: 'NL',
      token_expires_in_seconds: 3600, // 1 hour
      token_is_healthy: true,
    },
  ];

  return {
    divisions: [
      {
        code: config.division.code,
        name: config.division.name,
        region: 'NL',
        is_default: true,
      },
    ],
    total: 1,
    regions: ['NL'],
    user: DEMO_AUTH_CONTEXT.email,
    connection_status: connectionStatus,
    _demo: true,
    industry: config.company.industry,
    company: {
      name: config.company.name,
      city: config.company.city,
      description: config.company.description,
    },
  };
}
