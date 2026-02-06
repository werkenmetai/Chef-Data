/**
 * Admin Authentication Utilities
 *
 * Shared helpers for admin authentication and authorization.
 *
 * SEC-001: OAuth is required for ALL users (including admins).
 * The system only supports Exact Online OAuth authentication - there is no
 * password-based login. Admin status is determined by email matching
 * the ADMIN_EMAILS environment variable.
 *
 * Security note: Since all authentication goes through Exact Online OAuth,
 * admin access inherently requires a valid Exact Online account with
 * proper OAuth flow completion.
 */

import type { D1Database } from '@cloudflare/workers-types';
import { Database } from './database';

export interface AdminCheckResult {
  isAdmin: boolean;
  userId?: string;
  email?: string;
}

export interface Env {
  DB?: D1Database;
  ADMIN_EMAILS?: string;
  TOKEN_ENCRYPTION_KEY?: string;
}

export interface Cookies {
  get: (name: string) => { value?: string } | undefined;
}

/**
 * Check if the current user is an admin.
 *
 * Usage in API routes:
 * ```typescript
 * import { isAdmin } from '../../../lib/admin';
 *
 * const admin = await isAdmin(db, env, cookies);
 * if (!admin.isAdmin) {
 *   return new Response('Forbidden', { status: 403 });
 * }
 * ```
 *
 * Usage in Astro pages:
 * ```typescript
 * import { isAdminFromLocals } from '../../../lib/admin';
 *
 * const { isAdmin, userId } = await isAdminFromLocals(Astro.locals, Astro.cookies);
 * if (!isAdmin) {
 *   return Astro.redirect('/dashboard');
 * }
 * ```
 */
export async function isAdmin(
  db: Database,
  env: Env | Record<string, unknown>,
  cookies: Cookies
): Promise<AdminCheckResult> {
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return { isAdmin: false };
  }

  const session = await db.validateSession(sessionId);
  if (!session) {
    return { isAdmin: false };
  }

  const adminEmailsRaw = (env.ADMIN_EMAILS as string) || '';
  const adminEmails = adminEmailsRaw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  const userEmail = session.user.email.toLowerCase();
  const userIsAdmin = adminEmails.length > 0 && adminEmails.includes(userEmail);

  return {
    isAdmin: userIsAdmin,
    userId: session.user.id,
    email: session.user.email,
  };
}

/**
 * Convenience function for Astro pages.
 * Creates Database instance from Astro.locals and performs admin check.
 */
export async function isAdminFromLocals(
  locals: { runtime?: { env?: Record<string, unknown> } },
  cookies: Cookies
): Promise<AdminCheckResult & { db: Database | null }> {
  const env = locals.runtime?.env;
  if (!env?.DB) {
    return { isAdmin: false, db: null };
  }

  const db = new Database(
    env.DB as D1Database,
    env.TOKEN_ENCRYPTION_KEY as string | undefined
  );

  const result = await isAdmin(db, env, cookies);
  return { ...result, db };
}

/**
 * Get admin email list from environment.
 */
export function getAdminEmails(env: Env | Record<string, unknown>): string[] {
  const adminEmailsRaw = (env.ADMIN_EMAILS as string) || '';
  return adminEmailsRaw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

/**
 * Simple check if an email is in the admin list.
 *
 * Usage:
 * ```typescript
 * import { isAdminEmail } from '../../../lib/admin';
 *
 * if (!isAdminEmail(session.user.email, env)) {
 *   return new Response('Forbidden', { status: 403 });
 * }
 * ```
 */
export function isAdminEmail(email: string, env: Env | Record<string, unknown>): boolean {
  const adminEmails = getAdminEmails(env);
  return adminEmails.length > 0 && adminEmails.includes(email.toLowerCase());
}

/**
 * Session type for requireAdmin function.
 */
export interface Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
}

/**
 * Require admin access - returns an error Response if not authorized, null if OK.
 *
 * Usage:
 * ```typescript
 * import { requireAdmin } from '../../../lib/admin';
 *
 * const errorResponse = requireAdmin(session, env);
 * if (errorResponse) {
 *   return errorResponse;
 * }
 * // User is admin, continue with operation...
 * ```
 */
export function requireAdmin(
  session: Session | null | undefined,
  env: Env | Record<string, unknown>
): Response | null {
  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!isAdminEmail(session.user.email, env)) {
    return new Response(
      JSON.stringify({ error: 'Admin access required' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}
