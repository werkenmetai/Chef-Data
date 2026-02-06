/**
 * Stripe Customer Portal API
 *
 * Creates a Stripe Billing Portal session for subscription management.
 * Users can update payment methods, view invoices, and cancel subscriptions.
 *
 * Required environment variables:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../lib/database';
import { createBillingPortalSession } from '../../../lib/stripe';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const env = locals.runtime.env;

  // Check if Stripe is configured
  if (!env.STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({
      error: 'Betalingen zijn nog niet geconfigureerd.',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate session
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Niet ingelogd' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY as string | undefined);
  const sessionResult = await db.validateSession(sessionId);

  if (!sessionResult) {
    return new Response(JSON.stringify({ error: 'Sessie verlopen' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = sessionResult.user;

  // Check if user has a Stripe customer ID
  if (!user.stripe_customer_id) {
    return new Response(JSON.stringify({
      error: 'Geen actief abonnement gevonden.',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const baseUrl = new URL(request.url).origin;
    const { url } = await createBillingPortalSession(env.STRIPE_SECRET_KEY as string, {
      customerId: user.stripe_customer_id,
      returnUrl: `${baseUrl}/dashboard`,
    });

    // Redirect to Stripe Customer Portal
    return Response.redirect(url, 303);
  } catch (error) {
    console.error('Portal error:', error);
    return new Response(JSON.stringify({
      error: 'Er is een fout opgetreden.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
