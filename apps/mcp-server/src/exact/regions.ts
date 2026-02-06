/**
 * Exact Online Regional Configuration
 *
 * Exact Online has different API endpoints per region.
 * Each region has its own base URL and OAuth endpoints.
 *
 * @see docs/exact-online-api/README.md
 */

export type ExactRegion = 'NL' | 'BE' | 'UK' | 'DE' | 'US' | 'ES' | 'FR';

export interface RegionConfig {
  /** Region code */
  code: ExactRegion;
  /** Display name */
  name: string;
  /** Base domain */
  domain: string;
  /** API base URL */
  apiBaseUrl: string;
  /** OAuth authorization endpoint */
  authUrl: string;
  /** OAuth token endpoint */
  tokenUrl: string;
}

export const REGION_CONFIGS: Record<ExactRegion, RegionConfig> = {
  NL: {
    code: 'NL',
    name: 'Netherlands',
    domain: 'start.exactonline.nl',
    apiBaseUrl: 'https://start.exactonline.nl/api/v1',
    authUrl: 'https://start.exactonline.nl/api/oauth2/auth',
    tokenUrl: 'https://start.exactonline.nl/api/oauth2/token',
  },
  BE: {
    code: 'BE',
    name: 'Belgium',
    domain: 'start.exactonline.be',
    apiBaseUrl: 'https://start.exactonline.be/api/v1',
    authUrl: 'https://start.exactonline.be/api/oauth2/auth',
    tokenUrl: 'https://start.exactonline.be/api/oauth2/token',
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    domain: 'start.exactonline.co.uk',
    apiBaseUrl: 'https://start.exactonline.co.uk/api/v1',
    authUrl: 'https://start.exactonline.co.uk/api/oauth2/auth',
    tokenUrl: 'https://start.exactonline.co.uk/api/oauth2/token',
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    domain: 'start.exactonline.de',
    apiBaseUrl: 'https://start.exactonline.de/api/v1',
    authUrl: 'https://start.exactonline.de/api/oauth2/auth',
    tokenUrl: 'https://start.exactonline.de/api/oauth2/token',
  },
  US: {
    code: 'US',
    name: 'United States',
    domain: 'start.exactonline.com',
    apiBaseUrl: 'https://start.exactonline.com/api/v1',
    authUrl: 'https://start.exactonline.com/api/oauth2/auth',
    tokenUrl: 'https://start.exactonline.com/api/oauth2/token',
  },
  ES: {
    code: 'ES',
    name: 'Spain',
    domain: 'start.exactonline.es',
    apiBaseUrl: 'https://start.exactonline.es/api/v1',
    authUrl: 'https://start.exactonline.es/api/oauth2/auth',
    tokenUrl: 'https://start.exactonline.es/api/oauth2/token',
  },
  FR: {
    code: 'FR',
    name: 'France',
    domain: 'start.exactonline.fr',
    apiBaseUrl: 'https://start.exactonline.fr/api/v1',
    authUrl: 'https://start.exactonline.fr/api/oauth2/auth',
    tokenUrl: 'https://start.exactonline.fr/api/oauth2/token',
  },
};

/**
 * Get region config by code
 */
export function getRegionConfig(region: ExactRegion): RegionConfig {
  const config = REGION_CONFIGS[region];
  if (!config) {
    throw new Error(`Unknown region: ${region}. Valid regions: ${Object.keys(REGION_CONFIGS).join(', ')}`);
  }
  return config;
}

/**
 * Detect region from domain or URL
 */
export function detectRegion(urlOrDomain: string): ExactRegion | null {
  const lowerUrl = urlOrDomain.toLowerCase();

  for (const [code, config] of Object.entries(REGION_CONFIGS)) {
    if (lowerUrl.includes(config.domain)) {
      return code as ExactRegion;
    }
  }

  return null;
}

/**
 * Get all available regions
 */
export function getAllRegions(): RegionConfig[] {
  return Object.values(REGION_CONFIGS);
}

/**
 * Default region (Netherlands - most common)
 */
export const DEFAULT_REGION: ExactRegion = 'NL';
