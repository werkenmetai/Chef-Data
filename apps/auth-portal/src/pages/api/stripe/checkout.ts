/**
 * Stripe Checkout API
 *
 * Creates a Stripe Checkout session and redirects user to payment page.
 *
 * Required environment variables:
 * - STRIPE_SECRET_KEY: Your Stripe secret key
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../lib/database';
import { createCheckoutSession, PLAN_TO_PRICE } from '../../../lib/stripe';

export const POST: APIRoute = async ({ request, cookies, locals, redirect }) => {
  const env = locals.runtime.env;

  // Check if Stripe is configured
  if (!env.STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({
      error: 'Betalingen zijn nog niet geconfigureerd. Neem contact op met support.',
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

  // Check if user already has an active subscription
  if (user.plan !== 'free') {
    return new Response(JSON.stringify({
      error: 'Je hebt al een actief abonnement. Beheer je abonnement via het dashboard.',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse form data for plan selection
    const formData = await request.formData();
    const plan = formData.get('plan')?.toString() || 'pro';

    // Validate plan
    if (!['starter', 'pro'].includes(plan)) {
      return new Response(JSON.stringify({
        error: 'Ongeldig plan geselecteerd.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get price ID based on plan
    const priceId = PLAN_TO_PRICE[plan];

    // Create checkout session
    const baseUrl = new URL(request.url).origin;
    const { url } = await createCheckoutSession(env.STRIPE_SECRET_KEY as string, {
      userId: user.id,
      userEmail: user.email,
      priceId,
      successUrl: `${baseUrl}/dashboard?upgraded=true`,
      cancelUrl: `${baseUrl}/pricing?cancelled=true`,
    });

    // Redirect to Stripe Checkout
    return Response.redirect(url, 303);
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({
      error: 'Er is een fout opgetreden bij het starten van de betaling.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
