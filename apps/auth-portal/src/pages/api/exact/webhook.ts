/**
 * Exact Online App Store Webhook Handler
 *
 * Handles subscription lifecycle events from the Exact Online App Store.
 *
 * Webhook URL: https://praatmetjeboekhouding.nl/api/exact/webhook
 *
 * Required environment variables:
 * - EXACT_WEBHOOK_SECRET: Webhook signing secret from Exact App Store
 *
 * Key behaviors:
 * - UPGRADES: Take effect immediately
 * - DOWNGRADES: Take effect at end of billing period
 */

import type { APIRoute } from 'astro';
import {
  verifyWebhookSignature,
  mapExactEventType,
  mapExactPlanToInternal,
  mapExactStatus,
  isEventProcessed,
  logBillingEvent,
  processUpgrade,
  processDowngrade,
  applyPendingDowngrade,
  updateUserPlan,
  findUserByExactSubscriptionId,
  findUserByEmail,
  getPlanChangeType,
  type ExactWebhookPayload,
} from '../../../lib/exact-billing';

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env;

  if (!env?.DB) {
    console.error('Database not configured');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get webhook signature
  const signature = request.headers.get('x-exact-signature') ||
                    request.headers.get('x-webhook-signature') ||
                    request.headers.get('x-hub-signature-256');

  const payload = await request.text();

  // Verify webhook signature (if secret is configured)
  if (env.EXACT_WEBHOOK_SECRET) {
    if (!signature) {
      console.warn('Missing webhook signature');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isValid = await verifyWebhookSignature(payload, signature, env.EXACT_WEBHOOK_SECRET);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    console.warn('EXACT_WEBHOOK_SECRET not configured - skipping signature verification');
  }

  // Parse webhook payload
  let webhookData: ExactWebhookPayload;
  try {
    webhookData = JSON.parse(payload);
  } catch (e) {
    console.error('Invalid JSON payload:', e);
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { event_id, event_type, data } = webhookData;

  console.log(`[Exact Webhook] Received: ${event_type} (${event_id})`);

  // Check for duplicate event
  if (await isEventProcessed(env.DB, event_id)) {
    console.log(`[Exact Webhook] Event ${event_id} already processed, skipping`);
    return new Response(JSON.stringify({ received: true, note: 'Already processed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Find the user
    let user = data.subscription_id
      ? await findUserByExactSubscriptionId(env.DB, data.subscription_id)
      : null;

    if (!user && data.customer_email) {
      user = await findUserByEmail(env.DB, data.customer_email);
    }

    if (!user) {
      console.warn(`[Exact Webhook] User not found for event ${event_id}`);
      // Still log the event for debugging
      await logBillingEvent(env.DB, {
        id: event_id,
        userId: null,
        eventType: mapExactEventType(event_type),
        plan: mapExactPlanToInternal(data.plan_id, data.plan_name),
        exactSubscriptionId: data.subscription_id,
        exactContractId: data.contract_id,
        exactInvoiceId: data.invoice_id,
        amountCents: data.amount ? Math.round(data.amount * 100) : null,
        currency: data.currency || 'EUR',
        metadata: { error: 'User not found', customer_email: data.customer_email },
        webhookPayload: payload,
      });

      return new Response(JSON.stringify({ received: true, warning: 'User not found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newPlan = mapExactPlanToInternal(data.plan_id, data.plan_name);
    const eventType = mapExactEventType(event_type);
    const exactData = {
      subscriptionId: data.subscription_id,
      contractId: data.contract_id,
      periodEnd: data.period_end,
    };

    // Process the event based on type
    switch (eventType) {
      case 'subscription_created':
      case 'subscription_upgraded': {
        // Upgrades take effect immediately
        const changeType = getPlanChangeType(user.plan, newPlan);
        if (changeType === 'upgrade' || eventType === 'subscription_created') {
          await processUpgrade(env.DB, user.id, newPlan, exactData);
          console.log(`[Exact Webhook] User ${user.email} upgraded to ${newPlan}`);
        } else if (changeType === 'downgrade') {
          // This shouldn't happen for upgrade events, but handle it
          await processDowngrade(env.DB, user.id, newPlan, exactData);
          console.log(`[Exact Webhook] User ${user.email} downgrade scheduled to ${newPlan}`);
        }
        break;
      }

      case 'subscription_downgraded': {
        // Downgrades take effect at end of billing period
        await processDowngrade(env.DB, user.id, newPlan, exactData);
        console.log(`[Exact Webhook] User ${user.email} downgrade scheduled to ${newPlan} at period end`);
        break;
      }

      case 'subscription_renewed': {
        // Apply any pending downgrades
        const applied = await applyPendingDowngrade(env.DB, user.id);
        if (applied) {
          console.log(`[Exact Webhook] Applied pending downgrade for ${user.email}`);
        }
        break;
      }

      case 'subscription_cancelled': {
        await updateUserPlan(env.DB, user.id, 'free', {
          status: 'cancelled',
          cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
        });
        console.log(`[Exact Webhook] User ${user.email} subscription cancelled`);
        break;
      }

      case 'trial_started':
      case 'trial_ended': {
        const status = eventType === 'trial_started' ? 'trialing' : 'active';
        await updateUserPlan(env.DB, user.id, newPlan, { status });
        console.log(`[Exact Webhook] User ${user.email} trial ${eventType === 'trial_started' ? 'started' : 'ended'}`);
        break;
      }

      case 'payment_failed': {
        await updateUserPlan(env.DB, user.id, user.plan, { status: 'past_due' });
        console.log(`[Exact Webhook] Payment failed for ${user.email}`);
        break;
      }

      case 'payment_succeeded': {
        await updateUserPlan(env.DB, user.id, user.plan, { status: 'active' });
        console.log(`[Exact Webhook] Payment succeeded for ${user.email}`);
        break;
      }

      default: {
        console.log(`[Exact Webhook] Unhandled event type: ${eventType}`);
      }
    }

    // Log the event
    await logBillingEvent(env.DB, {
      id: event_id,
      userId: user.id,
      eventType,
      plan: newPlan,
      exactSubscriptionId: data.subscription_id,
      exactContractId: data.contract_id,
      exactInvoiceId: data.invoice_id,
      amountCents: data.amount ? Math.round(data.amount * 100) : null,
      currency: data.currency || 'EUR',
      metadata: {
        previous_plan: user.plan,
        new_plan: newPlan,
        is_upgrade: data.is_upgrade,
        is_downgrade: data.is_downgrade,
      },
      webhookPayload: payload,
    });

    return new Response(JSON.stringify({ received: true, processed: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Exact Webhook] Processing error:', error);
    return new Response(JSON.stringify({
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
