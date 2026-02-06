/**
 * Stripe Webhook Handler
 *
 * Handles events from Stripe for subscription lifecycle management.
 * Webhook URL: https://praatmetjeboekhouding.nl/api/stripe/webhook
 *
 * Required environment variables:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret from Stripe Dashboard
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../lib/database';
import { verifyWebhookSignature, mapSubscriptionToPlan, STRIPE_PRICES } from '../../../lib/stripe';

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;

  // Check if Stripe is configured
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    console.log('Stripe not configured, skipping webhook');
    return new Response(JSON.stringify({ received: true, note: 'Stripe not configured' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await request.text();

  // Verify webhook signature
  const isValid = await verifyWebhookSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET as string);
  if (!isValid) {
    console.error('Invalid webhook signature');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const event = JSON.parse(payload);
  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);

  console.log(`Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // User completed checkout - subscription is now active
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.user_id;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (userId && customerId) {
          // Update user with Stripe customer ID and subscription
          await db.run(
            `UPDATE users SET
              stripe_customer_id = ?,
              stripe_subscription_id = ?,
              plan = 'pro',
              updated_at = datetime('now')
            WHERE id = ?`,
            [customerId, subscriptionId, userId]
          );
          console.log(`User ${userId} upgraded to Pro`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        // Subscription was updated (plan change, renewal, etc.)
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status;
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const cancelAtPeriodEnd = subscription.cancel_at_period_end;

        // Find user by Stripe customer ID
        const user = await db.get<{ id: string }>(
          'SELECT id FROM users WHERE stripe_customer_id = ?',
          [customerId]
        );

        if (user) {
          const newPlan = mapSubscriptionToPlan(status, priceId);

          await db.run(
            `UPDATE users SET
              plan = ?,
              stripe_subscription_status = ?,
              stripe_cancel_at_period_end = ?,
              updated_at = datetime('now')
            WHERE id = ?`,
            [newPlan, status, cancelAtPeriodEnd ? 1 : 0, user.id]
          );
          console.log(`User ${user.id} subscription updated: ${newPlan}, status: ${status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Subscription was cancelled and period ended
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const user = await db.get<{ id: string }>(
          'SELECT id FROM users WHERE stripe_customer_id = ?',
          [customerId]
        );

        if (user) {
          await db.run(
            `UPDATE users SET
              plan = 'free',
              stripe_subscription_id = NULL,
              stripe_subscription_status = 'canceled',
              stripe_cancel_at_period_end = 0,
              api_calls_limit = 1000,
              updated_at = datetime('now')
            WHERE id = ?`,
            [user.id]
          );
          console.log(`User ${user.id} downgraded to Free (subscription ended)`);
        }
        break;
      }

      case 'invoice.paid': {
        // Invoice was paid successfully
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;

        // Reset monthly API call counter on successful payment
        const user = await db.get<{ id: string }>(
          'SELECT id FROM users WHERE stripe_customer_id = ?',
          [customerId]
        );

        if (user && subscriptionId) {
          await db.run(
            `UPDATE users SET
              api_calls_used = 0,
              api_calls_reset_at = datetime('now'),
              updated_at = datetime('now')
            WHERE id = ?`,
            [user.id]
          );
          console.log(`User ${user.id} API calls reset (invoice paid)`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Payment failed - Stripe will retry automatically
        const invoice = event.data.object;
        const customerId = invoice.customer;

        console.log(`Payment failed for customer ${customerId}`);
        // Optionally: Send email notification to user
        // Stripe handles retry logic automatically
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
