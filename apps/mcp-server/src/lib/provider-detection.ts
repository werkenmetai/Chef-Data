/**
 * AI Provider Detection
 *
 * Detects which AI provider is making requests based on User-Agent header.
 * Used for personalized privacy tips and usage analytics.
 */

export type AIProvider = 'claude' | 'chatgpt' | 'copilot' | 'cursor' | 'unknown';

export interface ProviderInfo {
  provider: AIProvider;
  displayName: string;
  color: string;
  bgColor: string;
}

/**
 * Provider display information for UI
 */
export const providerInfo: Record<AIProvider, Omit<ProviderInfo, 'provider'>> = {
  claude: {
    displayName: 'Claude',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
  },
  chatgpt: {
    displayName: 'ChatGPT',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
  },
  copilot: {
    displayName: 'Copilot',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
  },
  cursor: {
    displayName: 'Cursor',
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-100',
  },
  unknown: {
    displayName: 'Onbekend',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
  },
};

/**
 * Detect AI provider from User-Agent header
 *
 * @param userAgent - The User-Agent header value
 * @returns The detected AI provider
 */
export function detectAIProvider(userAgent: string | null): AIProvider {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  // Claude / Anthropic detection
  if (ua.includes('claude') || ua.includes('anthropic')) {
    return 'claude';
  }

  // OpenAI / ChatGPT detection
  if (ua.includes('openai') || ua.includes('chatgpt') || ua.includes('gpt-')) {
    return 'chatgpt';
  }

  // GitHub Copilot detection
  if (ua.includes('copilot') || ua.includes('github')) {
    return 'copilot';
  }

  // Cursor detection
  if (ua.includes('cursor')) {
    return 'cursor';
  }

  return 'unknown';
}

/**
 * Get full provider info from User-Agent
 *
 * @param userAgent - The User-Agent header value
 * @returns Provider info including display name and colors
 */
export function getProviderInfo(userAgent: string | null): ProviderInfo {
  const provider = detectAIProvider(userAgent);
  return {
    provider,
    ...providerInfo[provider],
  };
}

/**
 * Get privacy settings URL for a provider
 *
 * @param provider - The AI provider
 * @returns URL to the provider's privacy settings
 */
export function getProviderPrivacyUrl(provider: AIProvider): string {
  switch (provider) {
    case 'claude':
      return 'https://trust.anthropic.com';
    case 'chatgpt':
      return 'https://help.openai.com/en/articles/7730893';
    case 'copilot':
      return 'https://github.com/settings/copilot';
    case 'cursor':
      return 'https://cursor.com/privacy';
    default:
      return '/docs/ai-privacy';
  }
}

/**
 * Check if provider is using a business/enterprise tier (heuristic)
 * Note: This is a best-effort detection and not guaranteed accurate
 *
 * @param userAgent - The User-Agent header value
 * @returns Whether the provider appears to be on a business tier
 */
export function isBusinessTier(userAgent: string | null): boolean {
  if (!userAgent) return false;

  const ua = userAgent.toLowerCase();

  // Look for enterprise/business indicators in User-Agent
  return (
    ua.includes('enterprise') ||
    ua.includes('business') ||
    ua.includes('team') ||
    ua.includes('api')
  );
}
