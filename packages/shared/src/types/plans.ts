/**
 * Plan Limits - Single Source of Truth
 *
 * These limits are used across:
 * - MCP Server (rate limiting enforcement)
 * - Auth Portal (dashboard display, upgrade prompts)
 *
 * IMPORTANT: "calls" = tool calls, NOT user prompts
 * One user question can trigger 2-4 tool calls on average.
 *
 * PRICING STRATEGY: See docs/strategy/PRICING-STRATEGY.md
 * - Phase 1 (Launch Q1-Q2 2026): Current values
 * - Phase 2 (Growth Q3-Q4 2026): Adjust after 200+ paying users
 * - Phase 3 (Mature 2027+): Premium pricing
 *
 * BILLING: Via Exact Online App Store
 */

export const PLAN_LIMITS = {
  /**
   * Gratis plan - Royaal voor adoptie
   * Target: Proberen, ZZP incidenteel gebruik
   * ~60 vragen/maand (200 calls / 3 avg per vraag)
   */
  free: {
    apiCalls: 200,
    divisions: 2, // Holding + werkmaatschappij
    apiKeys: 3,
    price: 0,
    priceDisplay: 'Gratis',
  },

  /**
   * Starter plan - Lage instap voor conversie
   * Target: ZZP actief, klein MKB
   * ~250 vragen/maand (750 calls / 3 avg per vraag)
   */
  starter: {
    apiCalls: 750,
    divisions: 3,
    apiKeys: 5,
    price: 9,
    priceDisplay: '€9/maand',
  },

  /**
   * Pro plan - MKB en accountants
   * Target: MKB, accountants met meerdere klanten
   * ~800 vragen/maand (2500 calls / 3 avg per vraag)
   */
  pro: {
    apiCalls: 2500,
    divisions: 10,
    apiKeys: 10,
    price: 25,
    priceDisplay: '€25/maand',
  },

  /**
   * Enterprise plan - Custom voor grote organisaties
   * Target: Accountantskantoren, grote MKB
   * Pricing via partnermanager
   */
  enterprise: {
    apiCalls: Infinity,
    divisions: Infinity,
    apiKeys: Infinity,
    price: null, // Custom pricing
    priceDisplay: 'Op aanvraag',
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

/**
 * Plan display names for UI
 */
export const PLAN_NAMES: Record<PlanType, string> = {
  free: 'Gratis',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

/**
 * Plan descriptions for pricing page
 */
export const PLAN_DESCRIPTIONS: Record<PlanType, string> = {
  free: 'Ideaal om uit te proberen',
  starter: 'Voor ZZP en freelancers',
  pro: 'Voor MKB en accountants',
  enterprise: 'Voor grote organisaties',
};

/**
 * Features per plan for pricing page
 */
export const PLAN_FEATURES: Record<PlanType, string[]> = {
  free: [
    '~60 vragen per maand',
    '2 administraties',
    'ChatGPT, Claude & Copilot',
    'Read-only toegang',
  ],
  starter: [
    '~250 vragen per maand',
    '3 administraties',
    'Alles van Gratis',
    'Email support',
  ],
  pro: [
    '~800 vragen per maand',
    '10 administraties',
    'Alles van Starter',
    'Priority support',
  ],
  enterprise: [
    'Onbeperkt vragen',
    'Onbeperkt administraties',
    'Dedicated support',
    'Custom integraties',
  ],
};

/**
 * Get the limit for a specific plan
 */
export function getPlanLimit(
  plan: PlanType,
  limitType: 'apiCalls' | 'divisions' | 'apiKeys'
): number {
  return PLAN_LIMITS[plan][limitType];
}

/**
 * Get plan price
 */
export function getPlanPrice(plan: PlanType): number | null {
  return PLAN_LIMITS[plan].price;
}

/**
 * Check if user should see upgrade prompt
 * Returns true if usage > 80% of limit
 */
export function shouldShowUpgradePrompt(
  plan: PlanType,
  currentUsage: number
): boolean {
  const limit = PLAN_LIMITS[plan].apiCalls;
  if (limit === Infinity) return false;
  return currentUsage >= limit * 0.8;
}

/**
 * Get next plan for upgrade
 */
export function getNextPlan(currentPlan: PlanType): PlanType | null {
  const planOrder: PlanType[] = ['free', 'starter', 'pro', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlan);
  if (currentIndex === -1 || currentIndex >= planOrder.length - 1) {
    return null;
  }
  return planOrder[currentIndex + 1];
}
