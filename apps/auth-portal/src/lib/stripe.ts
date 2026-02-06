/**
 * Stripe Integration Helper
 *
 * This module handles Stripe Checkout and Billing Portal integration.
 * To activate, add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to your environment.
 *
 * Setup in Stripe Dashboard:
 * 1. Create products: Starter (€9/month), Pro (€25/month)
 * 2. Create webhook endpoint for /api/stripe/webhook
 * 3. Set up customer portal at https://dashboard.stripe.com/settings/billing/portal
 */

// Stripe Price IDs - Replace with your actual Stripe Price IDs from Stripe Dashboard
// To set up: Stripe Dashboard → Products → Create product → Add price
export const STRIPE_PRICES = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER || 'price_starter_monthly', // €9/month
  pro_monthly: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly', // €25/month
};

// Map plan names to Stripe Price IDs
export const PLAN_TO_PRICE: Record<string, string> = {
  starter: STRIPE_PRICES.starter_monthly,
  pro: STRIPE_PRICES.pro_monthly,
};

// Stripe Product IDs
export const STRIPE_PRODUCTS = {
  starter: 'prod_starter', // Replace with actual product ID
  pro: 'prod_pro', // Replace with actual product ID
};

/**
 * Create a Stripe Checkout Session
 * User is redirected to Stripe-hosted checkout page
 */
export async function createCheckoutSession(
  stripeSecretKey: string,
  options: {
    userId: string;
    userEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }
): Promise<{ url: string }> {
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: (() => {
      const params = new URLSearchParams();
      params.append('mode', 'subscription');
      params.append('payment_method_types[]', 'card');
      params.append('payment_method_types[]', 'ideal'); // Popular in Netherlands
      params.append('line_items[0][price]', options.priceId);
      params.append('line_items[0][quantity]', '1');
      params.append('success_url', options.successUrl);
      params.append('cancel_url', options.cancelUrl);
      params.append('customer_email', options.userEmail);
      params.append('client_reference_id', options.userId);
      params.append('metadata[user_id]', options.userId);
      params.append('allow_promotion_codes', 'true');
      params.append('billing_address_collection', 'required');
      params.append('tax_id_collection[enabled]', 'true'); // Collect VAT number
      params.append('automatic_tax[enabled]', 'true'); // Auto calculate VAT with Stripe Tax
      return params;
    })(),
  });

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(`Stripe error: ${error.error?.message || 'Unknown error'}`);
  }

  const session = await response.json() as { url: string };
  return { url: session.url };
}

/**
 * Create a Stripe Billing Portal Session
 * User can manage subscription, update payment method, cancel, etc.
 */
export async function createBillingPortalSession(
  stripeSecretKey: string,
  options: {
    customerId: string;
    returnUrl: string;
  }
): Promise<{ url: string }> {
  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: options.customerId,
      return_url: options.returnUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(`Stripe error: ${error.error?.message || 'Unknown error'}`);
  }

  const session = await response.json() as { url: string };
  return { url: session.url };
}

/**
 * Verify Stripe Webhook Signature
 * Ensures webhook requests are actually from Stripe
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): Promise<boolean> {
  // Stripe uses HMAC SHA256 for webhook signatures
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  // Parse the signature header
  const signatureParts = signature.split(',');
  let timestamp = '';
  let signatures: string[] = [];

  for (const part of signatureParts) {
    const [key, value] = part.split('=');
    if (key === 't') {
      timestamp = value;
    } else if (key === 'v1') {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  // Check timestamp is within tolerance (5 minutes)
  const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (timestampAge > 300) {
    return false;
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Compare signatures
  return signatures.some(sig => sig === expectedSignature);
}

/**
 * Cancel a Stripe Subscription
 */
export async function cancelSubscription(
  stripeSecretKey: string,
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<void> {
  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        cancel_at_period_end: cancelAtPeriodEnd.toString(),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json() as { error?: { message?: string } };
    throw new Error(`Stripe error: ${error.error?.message || 'Unknown error'}`);
  }
}

/**
 * Get Customer by Email
 */
export async function getCustomerByEmail(
  stripeSecretKey: string,
  email: string
): Promise<{ id: string } | null> {
  const response = await fetch(
    `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json() as { data?: Array<{ id: string }> };
  return data.data?.[0] || null;
}

/**
 * Webhook Event Types we handle
 */
export type StripeWebhookEvent =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed';

/**
 * Map Stripe subscription status to our plan
 */
export function mapSubscriptionToPlan(
  status: string,
  priceId: string
): 'free' | 'starter' | 'pro' | 'enterprise' {
  if (status !== 'active' && status !== 'trialing') {
    return 'free';
  }

  if (priceId === STRIPE_PRICES.pro_monthly) {
    return 'pro';
  }

  return 'free';
}
