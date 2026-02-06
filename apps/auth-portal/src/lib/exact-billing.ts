/**
 * Exact Online App Store Billing Integration
 *
 * Handles webhook verification and subscription management
 * for the Exact Online App Store billing system.
 *
 * Exact Online App Store Documentation:
 * - App Store handles subscription management and invoicing
 * - Webhooks notify us of subscription lifecycle events
 * - We track subscription status and update user plans accordingly
 *
 * Key behaviors:
 * - UPGRADES: Take effect immediately
 * - DOWNGRADES: Take effect at end of billing period
 */

import type { D1Database } from '@cloudflare/workers-types';
import { PLAN_LIMITS, type PlanType } from './constants';

// ============================================
// Types
// ============================================

export type BillingEventType =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'subscription_cancelled'
  | 'subscription_renewed'
  | 'trial_started'
  | 'trial_ended'
  | 'payment_succeeded'
  | 'payment_failed';

export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'trialing'
  | 'suspended'
  | 'pending_downgrade';

export interface BillingEvent {
  id: string;
  user_id: string | null;
  event_type: BillingEventType;
  plan: PlanType | null;
  exact_subscription_id: string | null;
  exact_contract_id: string | null;
  exact_invoice_id: string | null;
  amount_cents: number | null;
  currency: string;
  metadata: string | null;
  webhook_payload: string | null;
  created_at: string;
}

export interface SubscriptionStatusRecord {
  user_id: string;
  plan: PlanType;
  pending_plan: PlanType | null; // For downgrades at end of period
  exact_subscription_id: string | null;
  exact_contract_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  downgrade_at_period_end: boolean;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  updated_at: string;
}

/**
 * Expected webhook payload structure from Exact Online App Store
 */
export interface ExactWebhookPayload {
  event_id: string;
  event_type: string;
  timestamp: string;
  data: {
    subscription_id: string;
    contract_id?: string;
    customer_id?: string;
    customer_email?: string;
    plan_id?: string;
    plan_name?: string;
    previous_plan_id?: string;
    previous_plan_name?: string;
    status?: string;
    period_start?: string;
    period_end?: string;
    amount?: number;
    currency?: string;
    invoice_id?: string;
    is_trial?: boolean;
    trial_ends_at?: string;
    cancel_at_period_end?: boolean;
    downgrade_at_period_end?: boolean;
    cancelled_at?: string;
    is_upgrade?: boolean;
    is_downgrade?: boolean;
  };
}

// ============================================
// Plan Mapping
// ============================================

const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

/**
 * Determine if a plan change is an upgrade or downgrade
 */
export function getPlanChangeType(
  currentPlan: PlanType,
  newPlan: PlanType
): 'upgrade' | 'downgrade' | 'same' {
  const currentLevel = PLAN_HIERARCHY[currentPlan];
  const newLevel = PLAN_HIERARCHY[newPlan];

  if (newLevel > currentLevel) return 'upgrade';
  if (newLevel < currentLevel) return 'downgrade';
  return 'same';
}

const EXACT_PLAN_MAP: Record<string, PlanType> = {
  'exact_free': 'free',
  'exact_starter': 'starter',
  'exact_starter_monthly': 'starter',
  'exact_pro': 'pro',
  'exact_pro_monthly': 'pro',
  'exact_enterprise': 'enterprise',
  'free': 'free',
  'starter': 'starter',
  'pro': 'pro',
  'enterprise': 'enterprise',
};

export function mapExactPlanToInternal(
  planId: string | undefined,
  planName: string | undefined
): PlanType {
  if (planId && EXACT_PLAN_MAP[planId.toLowerCase()]) {
    return EXACT_PLAN_MAP[planId.toLowerCase()];
  }

  if (planName) {
    const normalizedName = planName.toLowerCase().trim();
    if (EXACT_PLAN_MAP[normalizedName]) {
      return EXACT_PLAN_MAP[normalizedName];
    }
    if (normalizedName.includes('enterprise')) return 'enterprise';
    if (normalizedName.includes('pro')) return 'pro';
    if (normalizedName.includes('starter')) return 'starter';
  }

  return 'free';
}

export function mapExactEventType(exactEventType: string): BillingEventType {
  const eventMap: Record<string, BillingEventType> = {
    'subscription.created': 'subscription_created',
    'subscription.activated': 'subscription_created',
    'subscription.updated': 'subscription_updated',
    'subscription.upgraded': 'subscription_upgraded',
    'subscription.downgraded': 'subscription_downgraded',
    'subscription.cancelled': 'subscription_cancelled',
    'subscription.canceled': 'subscription_cancelled',
    'subscription.renewed': 'subscription_renewed',
    'trial.started': 'trial_started',
    'trial.ended': 'trial_ended',
    'payment.succeeded': 'payment_succeeded',
    'payment.failed': 'payment_failed',
  };

  return eventMap[exactEventType.toLowerCase()] || 'subscription_updated';
}

export function mapExactStatus(exactStatus: string | undefined): SubscriptionStatus {
  if (!exactStatus) return 'active';

  const statusMap: Record<string, SubscriptionStatus> = {
    'active': 'active',
    'trialing': 'trialing',
    'trial': 'trialing',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
    'past_due': 'past_due',
    'overdue': 'past_due',
    'suspended': 'suspended',
    'paused': 'suspended',
    'pending_downgrade': 'pending_downgrade',
  };

  return statusMap[exactStatus.toLowerCase()] || 'active';
}

// ============================================
// Webhook Verification
// ============================================

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    console.warn('Missing signature or secret for webhook verification');
    return false;
  }

  try {
    let signatureHex = signature;
    if (signature.startsWith('sha256=')) {
      signatureHex = signature.slice(7);
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return constantTimeEqual(computedSignature, signatureHex.toLowerCase());
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ============================================
// Database Operations
// ============================================

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function isEventProcessed(
  db: D1Database,
  eventId: string
): Promise<boolean> {
  const result = await db
    .prepare('SELECT id FROM billing_events WHERE id = ?')
    .bind(eventId)
    .first<{ id: string }>();

  return result !== null;
}

export async function logBillingEvent(
  db: D1Database,
  event: {
    id: string;
    userId: string | null;
    eventType: BillingEventType;
    plan?: PlanType | null;
    exactSubscriptionId?: string | null;
    exactContractId?: string | null;
    exactInvoiceId?: string | null;
    amountCents?: number | null;
    currency?: string;
    metadata?: Record<string, unknown>;
    webhookPayload?: string;
  }
): Promise<void> {
  await db
    .prepare(`
      INSERT INTO billing_events (
        id, user_id, event_type, plan, exact_subscription_id,
        exact_contract_id, exact_invoice_id, amount_cents, currency,
        metadata, webhook_payload, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    .bind(
      event.id,
      event.userId,
      event.eventType,
      event.plan || null,
      event.exactSubscriptionId || null,
      event.exactContractId || null,
      event.exactInvoiceId || null,
      event.amountCents || null,
      event.currency || 'EUR',
      event.metadata ? JSON.stringify(event.metadata) : null,
      event.webhookPayload || null
    )
    .run();
}

export async function getSubscriptionStatus(
  db: D1Database,
  userId: string
): Promise<SubscriptionStatusRecord | null> {
  type DbRow = {
    user_id: string;
    plan: PlanType;
    pending_plan: PlanType | null;
    exact_subscription_id: string | null;
    exact_contract_id: string | null;
    status: SubscriptionStatus;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: number;
    downgrade_at_period_end: number;
    trial_ends_at: string | null;
    cancelled_at: string | null;
    updated_at: string;
  };

  const result = await db
    .prepare('SELECT * FROM subscription_status WHERE user_id = ?')
    .bind(userId)
    .first() as DbRow | null;

  if (!result) return null;

  return {
    user_id: result.user_id,
    plan: result.plan,
    pending_plan: result.pending_plan,
    exact_subscription_id: result.exact_subscription_id,
    exact_contract_id: result.exact_contract_id,
    status: result.status,
    current_period_start: result.current_period_start,
    current_period_end: result.current_period_end,
    cancel_at_period_end: Boolean(result.cancel_at_period_end),
    downgrade_at_period_end: Boolean(result.downgrade_at_period_end),
    trial_ends_at: result.trial_ends_at,
    cancelled_at: result.cancelled_at,
    updated_at: result.updated_at,
  };
}

/**
 * Handle plan upgrade - takes effect IMMEDIATELY
 */
export async function processUpgrade(
  db: D1Database,
  userId: string,
  newPlan: PlanType,
  exactData: {
    subscriptionId?: string;
    contractId?: string;
    periodEnd?: string;
  }
): Promise<void> {
  // Update user plan immediately
  await db
    .prepare(`
      UPDATE users SET
        plan = ?,
        exact_subscription_id = COALESCE(?, exact_subscription_id),
        exact_contract_id = COALESCE(?, exact_contract_id),
        exact_subscription_status = 'active',
        updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(newPlan, exactData.subscriptionId || null, exactData.contractId || null, userId)
    .run();

  // Update or create subscription status
  await db
    .prepare(`
      INSERT INTO subscription_status (user_id, plan, status, exact_subscription_id, exact_contract_id, current_period_end, updated_at)
      VALUES (?, ?, 'active', ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        plan = excluded.plan,
        pending_plan = NULL,
        status = 'active',
        downgrade_at_period_end = 0,
        exact_subscription_id = COALESCE(excluded.exact_subscription_id, subscription_status.exact_subscription_id),
        exact_contract_id = COALESCE(excluded.exact_contract_id, subscription_status.exact_contract_id),
        current_period_end = COALESCE(excluded.current_period_end, subscription_status.current_period_end),
        updated_at = datetime('now')
    `)
    .bind(userId, newPlan, exactData.subscriptionId || null, exactData.contractId || null, exactData.periodEnd || null)
    .run();
}

/**
 * Handle plan downgrade - scheduled for END OF BILLING PERIOD
 */
export async function processDowngrade(
  db: D1Database,
  userId: string,
  newPlan: PlanType,
  exactData: {
    subscriptionId?: string;
    contractId?: string;
    periodEnd?: string;
  }
): Promise<void> {
  // Don't change current plan, but schedule the downgrade
  await db
    .prepare(`
      UPDATE users SET
        exact_subscription_id = COALESCE(?, exact_subscription_id),
        exact_contract_id = COALESCE(?, exact_contract_id),
        exact_subscription_status = 'pending_downgrade',
        updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(exactData.subscriptionId || null, exactData.contractId || null, userId)
    .run();

  // Store pending downgrade in subscription status
  await db
    .prepare(`
      INSERT INTO subscription_status (user_id, plan, pending_plan, status, downgrade_at_period_end, exact_subscription_id, exact_contract_id, current_period_end, updated_at)
      VALUES (?, (SELECT plan FROM users WHERE id = ?), ?, 'pending_downgrade', 1, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        pending_plan = excluded.pending_plan,
        status = 'pending_downgrade',
        downgrade_at_period_end = 1,
        exact_subscription_id = COALESCE(excluded.exact_subscription_id, subscription_status.exact_subscription_id),
        exact_contract_id = COALESCE(excluded.exact_contract_id, subscription_status.exact_contract_id),
        current_period_end = COALESCE(excluded.current_period_end, subscription_status.current_period_end),
        updated_at = datetime('now')
    `)
    .bind(userId, userId, newPlan, exactData.subscriptionId || null, exactData.contractId || null, exactData.periodEnd || null)
    .run();
}

/**
 * Apply pending downgrades (called on subscription renewal or period end)
 */
export async function applyPendingDowngrade(
  db: D1Database,
  userId: string
): Promise<boolean> {
  const subscription = await getSubscriptionStatus(db, userId);

  if (!subscription || !subscription.downgrade_at_period_end || !subscription.pending_plan) {
    return false;
  }

  // Apply the downgrade
  await db
    .prepare(`
      UPDATE users SET
        plan = ?,
        exact_subscription_status = 'active',
        updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(subscription.pending_plan, userId)
    .run();

  // Clear pending downgrade
  await db
    .prepare(`
      UPDATE subscription_status SET
        plan = pending_plan,
        pending_plan = NULL,
        status = 'active',
        downgrade_at_period_end = 0,
        updated_at = datetime('now')
      WHERE user_id = ?
    `)
    .bind(userId)
    .run();

  return true;
}

export async function updateUserPlan(
  db: D1Database,
  userId: string,
  plan: PlanType,
  exactData?: {
    subscriptionId?: string | null;
    contractId?: string | null;
    status?: string | null;
    cancelAtPeriodEnd?: boolean;
  }
): Promise<void> {
  const updates: string[] = ['plan = ?', "updated_at = datetime('now')"];
  const params: unknown[] = [plan];

  if (exactData?.subscriptionId !== undefined) {
    updates.push('exact_subscription_id = ?');
    params.push(exactData.subscriptionId);
  }
  if (exactData?.contractId !== undefined) {
    updates.push('exact_contract_id = ?');
    params.push(exactData.contractId);
  }
  if (exactData?.status !== undefined) {
    updates.push('exact_subscription_status = ?');
    params.push(exactData.status);
  }
  if (exactData?.cancelAtPeriodEnd !== undefined) {
    updates.push('exact_cancel_at_period_end = ?');
    params.push(exactData.cancelAtPeriodEnd ? 1 : 0);
  }

  params.push(userId);

  await db
    .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();
}

export async function findUserByExactSubscriptionId(
  db: D1Database,
  subscriptionId: string
): Promise<{ id: string; email: string; plan: PlanType } | null> {
  return await db
    .prepare('SELECT id, email, plan FROM users WHERE exact_subscription_id = ?')
    .bind(subscriptionId)
    .first<{ id: string; email: string; plan: PlanType }>();
}

export async function findUserByEmail(
  db: D1Database,
  email: string
): Promise<{ id: string; email: string; plan: PlanType } | null> {
  return await db
    .prepare('SELECT id, email, plan FROM users WHERE email = ?')
    .bind(email.toLowerCase())
    .first<{ id: string; email: string; plan: PlanType }>();
}

// ============================================
// Billing Status API
// ============================================

export interface BillingStatusResponse {
  plan: PlanType;
  planName: string;
  status: SubscriptionStatus;
  pendingPlan: PlanType | null;
  pendingPlanName: string | null;
  isActive: boolean;
  isCancelled: boolean;
  cancelAtPeriodEnd: boolean;
  downgradeAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  limits: {
    apiCalls: number;
    divisions: number;
    apiKeys: number;
  };
  usage: {
    apiCalls: number;
    apiCallsPercent: number;
  };
  canUpgrade: boolean;
  canDowngrade: boolean;
}

const PLAN_NAMES: Record<PlanType, string> = {
  free: 'Gratis',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export async function getBillingStatus(
  db: D1Database,
  userId: string
): Promise<BillingStatusResponse> {
  const user = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first<{
      id: string;
      plan: PlanType;
      api_calls_used: number;
      exact_subscription_id: string | null;
      exact_subscription_status: string | null;
      exact_cancel_at_period_end: number;
    }>();

  const subscription = await getSubscriptionStatus(db, userId);

  const plan = user?.plan || 'free';
  const limits = PLAN_LIMITS[plan];
  const apiCallsUsed = user?.api_calls_used || 0;
  const apiCallsPercent = limits.apiCalls === Infinity
    ? 0
    : Math.min((apiCallsUsed / limits.apiCalls) * 100, 100);

  const status = subscription?.status || mapExactStatus(user?.exact_subscription_status || undefined);
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end || Boolean(user?.exact_cancel_at_period_end);
  const downgradeAtPeriodEnd = subscription?.downgrade_at_period_end || false;
  const pendingPlan = subscription?.pending_plan || null;

  return {
    plan,
    planName: PLAN_NAMES[plan],
    status,
    pendingPlan,
    pendingPlanName: pendingPlan ? PLAN_NAMES[pendingPlan] : null,
    isActive: status === 'active' || status === 'trialing' || status === 'pending_downgrade',
    isCancelled: status === 'cancelled',
    cancelAtPeriodEnd,
    downgradeAtPeriodEnd,
    currentPeriodEnd: subscription?.current_period_end || null,
    trialEndsAt: subscription?.trial_ends_at || null,
    limits: {
      apiCalls: limits.apiCalls === Infinity ? -1 : limits.apiCalls,
      divisions: limits.divisions === Infinity ? -1 : limits.divisions,
      apiKeys: limits.apiKeys === Infinity ? -1 : limits.apiKeys,
    },
    usage: {
      apiCalls: apiCallsUsed,
      apiCallsPercent,
    },
    canUpgrade: plan !== 'enterprise',
    canDowngrade: plan !== 'free',
  };
}
