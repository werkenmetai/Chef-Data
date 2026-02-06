/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  EXACT_CLIENT_ID: string;
  EXACT_CLIENT_SECRET: string;
  EXACT_REDIRECT_URI: string;
  SESSION_SECRET: string;
  DB: D1Database;
  TOKEN_ENCRYPTION_KEY?: string;
  ADMIN_EMAILS?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRO_PRICE_ID?: string;
  // Exact App Store webhook secret
  EXACT_WEBHOOK_SECRET?: string;
  // Resend email service
  RESEND_API_KEY?: string;
  RESEND_WEBHOOK_SECRET?: string;
  // R2 bucket for error screenshots
  SCREENSHOTS_BUCKET?: R2Bucket;
}

declare namespace App {
  interface Locals extends Runtime {}
}
