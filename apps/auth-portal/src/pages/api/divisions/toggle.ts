/**
 * Division Toggle Endpoint
 * POST /api/divisions/toggle
 *
 * Toggles a division's active status for the logged-in user.
 * Respects plan limits and cooldown (1 hour between switches).
 *
 * Body (single toggle):
 * - divisionId: string - The division ID to toggle
 * - active: boolean - Whether to activate or deactivate
 *
 * Body (activate all):
 * - action: 'activate_all' - Activate all divisions (within plan limit)
 *
 * Returns:
 * - success: boolean
 * - error?: string - Error message if failed
 * - cooldownUntil?: string - ISO timestamp if in cooldown
 * - activeDivisions?: number - Current count of active divisions
 * - planLimit?: number - Plan's division limit
 * - limited?: boolean - True if not all divisions could be activated (plan limit)
 */

import type { APIRoute } from 'astro';
import { Database } from '../../../lib/database';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database niet beschikbaar' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check authentication
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ success: false, error: 'Niet ingelogd' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
  const session = await db.validateSession(sessionId);

  if (!session) {
    return new Response(JSON.stringify({ success: false, error: 'Sessie verlopen' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse request body
  let body: { divisionId?: string; active?: boolean; action?: string };

  try {
    body = await request.json() as { divisionId?: string; active?: boolean; action?: string };
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Ongeldige request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { PLAN_LIMITS } = await import('../../../lib/constants');
  const planLimit = PLAN_LIMITS[session.user.plan as keyof typeof PLAN_LIMITS]?.divisions || 2;

  // Handle 'activate_all' action
  if (body.action === 'activate_all') {
    const result = await db.activateAllDivisions(session.user.id);

    if (!result.success) {
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        activeDivisions: result.activated,
        total: result.total,
        planLimit: planLimit === Infinity ? null : planLimit,
        limited: result.limited,
        message: result.limited
          ? `${result.activated} van ${result.total} administraties geactiveerd (plan limiet)`
          : `Alle ${result.activated} administraties geactiveerd`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Regular single toggle
  const divisionId = body.divisionId || '';
  const active = body.active ?? false;

  if (!divisionId || typeof active !== 'boolean') {
    return new Response(JSON.stringify({ success: false, error: 'Ongeldige parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Toggle the division
  const result = await db.toggleDivisionActive(session.user.id, divisionId, active);

  if (!result.success) {
    return new Response(JSON.stringify(result), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get updated counts for response
  const activeDivisions = await db.getActiveDivisionsCount(session.user.id);

  return new Response(
    JSON.stringify({
      success: true,
      activeDivisions,
      planLimit: planLimit === Infinity ? null : planLimit,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

// GET endpoint to fetch current division status
export const GET: APIRoute = async ({ cookies, locals }) => {
  const env = locals.runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ success: false, error: 'Database niet beschikbaar' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ success: false, error: 'Niet ingelogd' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
  const session = await db.validateSession(sessionId);

  if (!session) {
    return new Response(JSON.stringify({ success: false, error: 'Sessie verlopen' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const divisions = await db.getUserDivisionsWithStatus(session.user.id);
  const activeDivisions = await db.getActiveDivisionsCount(session.user.id);
  const canSwitch = await db.canSwitchDivision(session.user.id);

  const { PLAN_LIMITS } = await import('../../../lib/constants');
  const planLimit = PLAN_LIMITS[session.user.plan as keyof typeof PLAN_LIMITS]?.divisions || 2;

  return new Response(
    JSON.stringify({
      success: true,
      divisions,
      activeDivisions,
      planLimit: planLimit === Infinity ? null : planLimit,
      canSwitch: canSwitch.canSwitch,
      cooldownUntil: canSwitch.cooldownUntil,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
