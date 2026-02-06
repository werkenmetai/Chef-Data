/**
 * Automation System voor Praat met je Boekhouding
 * Geautomatiseerde taken: onboarding emails, monitoring, alerts, proactive token refresh
 */

import type { D1Database } from '@cloudflare/workers-types';
import {
  sendEmail,
  sendAdminAlert,
  welcomeEmail,
  onboardingDay1Email,
  onboardingDay3Email,
  onboardingDay7Email,
  tokenExpiredEmail,
  rateLimitWarningEmail,
  rateLimitReachedEmail,
  adminNewUserAlert,
  adminErrorAlert,
  adminDailyStatsAlert,
  type Env,
} from './email';
import { encryptToken, decryptToken, isEncrypted } from './crypto';

// ============================================================
// DATABASE QUERIES VOOR AUTOMATION
// ============================================================

interface User {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  api_calls_used: number;
  created_at: string;
  onboarding_email_sent: number; // 0, 1, 3, or 7
}

interface Connection {
  id: string;
  user_id: string;
  token_expires_at: string;
  status: string;
}

interface AutomationEnv extends Env {
  DB: D1Database;
  TOKEN_ENCRYPTION_KEY?: string;
  EXACT_CLIENT_ID?: string;
  EXACT_CLIENT_SECRET?: string;
}

// ============================================================
// EXACT ONLINE TOKEN REFRESH CONFIGURATION
// ============================================================

type ExactRegion = 'NL' | 'BE' | 'DE' | 'UK' | 'US' | 'ES' | 'FR';

const REGION_TOKEN_URLS: Record<ExactRegion, string> = {
  NL: 'https://start.exactonline.nl/api/oauth2/token',
  BE: 'https://start.exactonline.be/api/oauth2/token',
  DE: 'https://start.exactonline.de/api/oauth2/token',
  UK: 'https://start.exactonline.co.uk/api/oauth2/token',
  US: 'https://start.exactonline.com/api/oauth2/token',
  ES: 'https://start.exactonline.es/api/oauth2/token',
  FR: 'https://start.exactonline.fr/api/oauth2/token',
};

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

// ============================================================
// ONBOARDING EMAIL AUTOMATION
// ============================================================

/**
 * Verstuur onboarding emails gebaseerd op signup datum
 * Draait dagelijks via cron
 */
export async function processOnboardingEmails(env: AutomationEnv): Promise<{ sent: number; errors: number }> {
  let sent = 0;
  let errors = 0;

  try {
    // Haal users op die onboarding emails nodig hebben

    // Dag 1 emails (signed up gisteren)
    const day1Users = await env.DB.prepare(`
      SELECT id, email, name, onboarding_email_sent
      FROM users
      WHERE onboarding_email_sent = 0
        AND created_at < datetime('now', '-1 day')
        AND created_at > datetime('now', '-2 day')
    `).all<User>();

    for (const user of day1Users.results || []) {
      const email = onboardingDay1Email(user.name || '');
      email.to = user.email;

      if (await sendEmail(env, email)) {
        await env.DB.prepare('UPDATE users SET onboarding_email_sent = 1 WHERE id = ?').bind(user.id).run();
        sent++;
      } else {
        errors++;
      }
    }

    // Dag 3 emails
    const day3Users = await env.DB.prepare(`
      SELECT id, email, name, onboarding_email_sent
      FROM users
      WHERE onboarding_email_sent = 1
        AND created_at < datetime('now', '-3 day')
        AND created_at > datetime('now', '-4 day')
    `).all<User>();

    for (const user of day3Users.results || []) {
      const email = onboardingDay3Email(user.name || '');
      email.to = user.email;

      if (await sendEmail(env, email)) {
        await env.DB.prepare('UPDATE users SET onboarding_email_sent = 3 WHERE id = ?').bind(user.id).run();
        sent++;
      } else {
        errors++;
      }
    }

    // Dag 7 emails
    const day7Users = await env.DB.prepare(`
      SELECT id, email, name, api_calls_used, onboarding_email_sent
      FROM users
      WHERE onboarding_email_sent = 3
        AND created_at < datetime('now', '-7 day')
        AND created_at > datetime('now', '-8 day')
    `).all<User>();

    for (const user of day7Users.results || []) {
      const email = onboardingDay7Email(user.name || '', user.api_calls_used);
      email.to = user.email;

      if (await sendEmail(env, email)) {
        await env.DB.prepare('UPDATE users SET onboarding_email_sent = 7 WHERE id = ?').bind(user.id).run();
        sent++;
      } else {
        errors++;
      }
    }
  } catch (error) {
    console.error('[ONBOARDING ERROR]', error);
    errors++;
  }

  return { sent, errors };
}

// ============================================================
// TOKEN REFRESH FAILURE MONITORING
// ============================================================

/**
 * Check voor ECHTE token failures (niet normale expiry - die worden auto-refreshed)
 *
 * Tokens worden automatisch ververst door de MCP server bij elk request.
 * We sturen alleen alerts als:
 * 1. De refresh daadwerkelijk gefaald is (status = 'refresh_failed')
 * 2. De user 30+ dagen inactief is (refresh token mogelijk verlopen)
 */
export async function checkTokenRefreshFailures(env: AutomationEnv): Promise<{ checked: number; alerts: number }> {
  let checked = 0;
  let alerts = 0;

  try {
    // Vind connecties waar refresh gefaald is
    const failedConnections = await env.DB.prepare(`
      SELECT c.id, c.user_id, c.last_used_at, u.email, u.name
      FROM connections c
      JOIN users u ON c.user_id = u.id
      WHERE c.status = 'refresh_failed'
        AND c.expiry_alert_sent = 0
    `).all<Connection & { email: string; name: string | null; last_used_at: string | null }>();

    checked = failedConnections.results?.length || 0;

    for (const conn of failedConnections.results || []) {
      const email = tokenExpiredEmail(conn.name || '');
      email.to = conn.email;

      if (await sendEmail(env, email)) {
        await env.DB.prepare(`
          UPDATE connections SET expiry_alert_sent = 1 WHERE id = ?
        `).bind(conn.id).run();
        alerts++;
      }
    }

    // Check ook voor lange inactiviteit (30+ dagen) - refresh token kan verlopen zijn
    const inactiveConnections = await env.DB.prepare(`
      SELECT c.id, c.user_id, c.last_used_at, u.email, u.name
      FROM connections c
      JOIN users u ON c.user_id = u.id
      WHERE c.status = 'active'
        AND c.last_used_at < datetime('now', '-30 days')
        AND c.inactivity_alert_sent = 0
    `).all<Connection & { email: string; name: string | null; last_used_at: string | null }>();

    for (const conn of inactiveConnections.results || []) {
      // Stuur een mildere "we missen je" email, niet een "token verlopen" email
      const email = {
        to: conn.email,
        subject: 'Je Praat met je Boekhouding verbinding kan verlopen',
        html: `
          <p>Hoi${conn.name ? ` ${conn.name}` : ''},</p>
          <p>Je hebt Praat met je Boekhouding al 30 dagen niet gebruikt. Je verbinding kan binnenkort verlopen.</p>
          <p>Log even in om je verbinding actief te houden:</p>
          <p><a href="https://praatmetjeboekhouding.nl/dashboard">Ga naar Dashboard</a></p>
        `,
      };

      if (await sendEmail(env, email)) {
        await env.DB.prepare(`
          UPDATE connections SET inactivity_alert_sent = 1 WHERE id = ?
        `).bind(conn.id).run();
      }
    }
  } catch (error) {
    console.error('[TOKEN CHECK ERROR]', error);
  }

  return { checked, alerts };
}

// ============================================================
// PROACTIVE TOKEN REFRESH
// ============================================================

/**
 * Proactief tokens verversen die bijna verlopen
 *
 * Exact Online access tokens verlopen na 10 minuten.
 * Deze functie vernieuwt tokens die binnen 5 minuten verlopen,
 * zodat gebruikers nooit een "token expired" error zien.
 *
 * Draait elk uur via cron job.
 */
export async function proactiveTokenRefresh(env: AutomationEnv): Promise<{
  refreshed: number;
  failed: number;
  skipped: number;
}> {
  let refreshed = 0;
  let failed = 0;
  let skipped = 0;

  // Check of we de benodigde credentials hebben
  if (!env.EXACT_CLIENT_ID || !env.EXACT_CLIENT_SECRET) {
    console.log('[PROACTIVE REFRESH] Missing Exact Online credentials, skipping');
    return { refreshed: 0, failed: 0, skipped: 0 };
  }

  try {
    // Vind connecties die:
    // 1. Token verloopt binnen 5 minuten, OF
    // 2. Token is al verlopen maar minder dan 30 dagen geleden (refresh token nog geldig)
    // En: status is actief of recent gefaald (probeer opnieuw)
    const expiringConnections = await env.DB.prepare(`
      SELECT
        c.id,
        c.user_id,
        c.region,
        c.access_token,
        c.refresh_token,
        c.token_expires_at,
        u.email,
        u.name
      FROM connections c
      JOIN users u ON c.user_id = u.id
      WHERE (
        -- Token verloopt binnen 5 minuten
        (c.token_expires_at > datetime('now') AND c.token_expires_at < datetime('now', '+5 minutes'))
        OR
        -- Token is verlopen maar minder dan 30 dagen (refresh token nog geldig)
        (c.token_expires_at < datetime('now') AND c.token_expires_at > datetime('now', '-30 days'))
      )
      AND (c.status IS NULL OR c.status = 'active' OR c.status = 'refresh_failed')
      ORDER BY c.token_expires_at ASC
      LIMIT 50
    `).all<{
      id: string;
      user_id: string;
      region: string;
      access_token: string;
      refresh_token: string;
      token_expires_at: string;
      email: string;
      name: string | null;
    }>();

    console.log(`[PROACTIVE REFRESH] Found ${expiringConnections.results?.length || 0} connections to refresh`);

    for (const conn of expiringConnections.results || []) {
      try {
        // Decrypt refresh token als het encrypted is
        let refreshToken = conn.refresh_token;
        if (env.TOKEN_ENCRYPTION_KEY && isEncrypted(conn.refresh_token)) {
          refreshToken = await decryptToken(conn.refresh_token, env.TOKEN_ENCRYPTION_KEY);
        }

        // Bepaal de token URL voor deze regio
        const region = (conn.region as ExactRegion) || 'NL';
        const tokenUrl = REGION_TOKEN_URLS[region] || REGION_TOKEN_URLS.NL;

        // Roep de Exact Online token endpoint aan
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: env.EXACT_CLIENT_ID,
            client_secret: env.EXACT_CLIENT_SECRET,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[PROACTIVE REFRESH] Failed for connection ${conn.id}: ${response.status} - ${errorText}`);

          // Check voor invalid_grant (refresh token verlopen)
          if (response.status === 400 && errorText.includes('invalid_grant')) {
            // Markeer als gefaald - user moet opnieuw authenticeren
            await env.DB.prepare(`
              UPDATE connections
              SET status = 'refresh_failed', expiry_alert_sent = 0
              WHERE id = ?
            `).bind(conn.id).run();

            // Stuur email naar gebruiker
            const email = tokenExpiredEmail(conn.name || '');
            email.to = conn.email;
            await sendEmail(env, email);
          }

          failed++;
          continue;
        }

        const data = await response.json() as TokenResponse;

        // Bereken nieuwe expiry tijd
        const expiresAt = new Date(Date.now() + data.expires_in * 1000);

        // Encrypt nieuwe tokens als encryption key beschikbaar is
        let newAccessToken = data.access_token;
        let newRefreshToken = data.refresh_token;

        if (env.TOKEN_ENCRYPTION_KEY) {
          newAccessToken = await encryptToken(data.access_token, env.TOKEN_ENCRYPTION_KEY);
          newRefreshToken = await encryptToken(data.refresh_token, env.TOKEN_ENCRYPTION_KEY);
        }

        // Calculate refresh token expiry (30 days from now)
        // @see EXACT-003 in operations/ROADMAP.md
        const REFRESH_TOKEN_VALIDITY_DAYS = 30;
        const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

        // Update de database met nieuwe tokens
        await env.DB.prepare(`
          UPDATE connections
          SET
            access_token = ?,
            refresh_token = ?,
            token_expires_at = ?,
            refresh_token_expires_at = ?,
            status = 'active',
            expiry_alert_sent = 0,
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          newAccessToken,
          newRefreshToken,
          expiresAt.toISOString(),
          refreshTokenExpiresAt.toISOString(),
          conn.id
        ).run();

        console.log(`[PROACTIVE REFRESH] Successfully refreshed token for connection ${conn.id} (user: ${conn.email})`);
        refreshed++;

      } catch (error) {
        console.error(`[PROACTIVE REFRESH] Error refreshing connection ${conn.id}:`, error);
        failed++;
      }
    }
  } catch (error) {
    console.error('[PROACTIVE REFRESH] Error querying connections:', error);
  }

  console.log(`[PROACTIVE REFRESH] Complete: ${refreshed} refreshed, ${failed} failed, ${skipped} skipped`);
  return { refreshed, failed, skipped };
}

// ============================================================
// RATE LIMIT MONITORING
// ============================================================

/**
 * Check rate limits en stuur warnings
 * Draait dagelijks via cron
 */
export async function checkRateLimits(env: AutomationEnv): Promise<{ warnings: number; reached: number }> {
  let warnings = 0;
  let reached = 0;

  const limits: Record<string, number> = {
    free: 200,
    starter: 750,
    pro: 2500,
    enterprise: 999999999,
  };

  try {
    // Alle users met hun usage
    const users = await env.DB.prepare(`
      SELECT id, email, name, plan, api_calls_used, rate_limit_warning_sent
      FROM users
      WHERE plan != 'enterprise'
    `).all<User & { rate_limit_warning_sent: number }>();

    for (const user of users.results || []) {
      const limit = limits[user.plan] || 1000;
      const usagePercent = (user.api_calls_used / limit) * 100;

      // 80% warning
      if (usagePercent >= 80 && usagePercent < 100 && !user.rate_limit_warning_sent) {
        const email = rateLimitWarningEmail(user.name || '', user.api_calls_used, limit);
        email.to = user.email;

        if (await sendEmail(env, email)) {
          await env.DB.prepare('UPDATE users SET rate_limit_warning_sent = 1 WHERE id = ?').bind(user.id).run();
          warnings++;
        }
      }

      // 100% reached
      if (usagePercent >= 100 && user.rate_limit_warning_sent === 1) {
        const email = rateLimitReachedEmail(user.name || '', user.plan);
        email.to = user.email;

        if (await sendEmail(env, email)) {
          await env.DB.prepare('UPDATE users SET rate_limit_warning_sent = 2 WHERE id = ?').bind(user.id).run();
          reached++;
        }
      }
    }
  } catch (error) {
    console.error('[RATE LIMIT CHECK ERROR]', error);
  }

  return { warnings, reached };
}

// ============================================================
// DAILY STATS VOOR ADMIN
// ============================================================

/**
 * Stuur dagelijkse stats naar admin
 */
export async function sendDailyStats(env: AutomationEnv): Promise<void> {
  try {
    // Nieuwe users gisteren
    const newUsersResult = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM users
      WHERE created_at > datetime('now', '-1 day')
    `).first<{ count: number }>();

    // Totaal users
    const totalUsersResult = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM users
    `).first<{ count: number }>();

    // API calls gisteren
    const apiCallsResult = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM api_usage
      WHERE timestamp > datetime('now', '-1 day')
    `).first<{ count: number }>();

    // Errors gisteren
    const errorsResult = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM api_usage
      WHERE timestamp > datetime('now', '-1 day')
        AND response_status >= 400
    `).first<{ count: number }>();

    // Top users
    const topUsersResult = await env.DB.prepare(`
      SELECT u.email, COUNT(*) as calls
      FROM api_usage a
      JOIN users u ON a.user_id = u.id
      WHERE a.timestamp > datetime('now', '-1 day')
      GROUP BY a.user_id
      ORDER BY calls DESC
      LIMIT 5
    `).all<{ email: string; calls: number }>();

    const alert = adminDailyStatsAlert({
      newUsers: newUsersResult?.count || 0,
      totalUsers: totalUsersResult?.count || 0,
      apiCalls: apiCallsResult?.count || 0,
      errors: errorsResult?.count || 0,
      topUsers: topUsersResult.results || [],
    });

    await sendAdminAlert(env, alert.subject, alert.message);
  } catch (error) {
    console.error('[DAILY STATS ERROR]', error);
  }
}

// ============================================================
// ERROR TRACKING
// ============================================================

/**
 * Log een error en stuur alert als het kritiek is
 */
export async function trackError(
  env: AutomationEnv,
  error: {
    type: 'auth_failure' | 'token_refresh_failure' | 'api_error' | 'db_error' | 'rate_limit' | 'unknown';
    message: string;
    userId?: string;
    details?: string;
    critical?: boolean;
  }
): Promise<void> {
  try {
    // Log naar database
    await env.DB.prepare(`
      INSERT INTO error_log (type, message, user_id, details, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(error.type, error.message, error.userId || null, error.details || null).run();

    // Stuur alert voor kritieke errors
    if (error.critical) {
      const alert = adminErrorAlert(error);
      await sendAdminAlert(env, alert.subject, alert.message);
    }
  } catch (e) {
    console.error('[ERROR TRACKING FAILED]', e);
  }
}

// ============================================================
// API KEY CLEANUP
// ============================================================

/**
 * Cleanup revoked API keys older than 30 days
 * AUTH-004: Soft delete is good for audit trail, but cleanup after 30 days
 * Runs daily via cron
 */
export async function cleanupRevokedApiKeys(env: AutomationEnv): Promise<{ deleted: number }> {
  try {
    const result = await env.DB.prepare(`
      DELETE FROM api_keys
      WHERE revoked_at IS NOT NULL
        AND revoked_at < datetime('now', '-30 days')
    `).run();

    const deleted = result.meta.changes || 0;
    if (deleted > 0) {
      console.log(`[API KEY CLEANUP] Deleted ${deleted} revoked API keys older than 30 days`);
    }

    return { deleted };
  } catch (error) {
    console.error('[API KEY CLEANUP ERROR]', error);
    return { deleted: 0 };
  }
}

// ============================================================
// MONTHLY RESET
// ============================================================

/**
 * Reset maandelijkse counters (draait op 1e van de maand)
 */
export async function monthlyReset(env: AutomationEnv): Promise<{ reset: number }> {
  try {
    const result = await env.DB.prepare(`
      UPDATE users SET api_calls_used = 0, rate_limit_warning_sent = 0
    `).run();

    return { reset: result.meta.changes || 0 };
  } catch (error) {
    console.error('[MONTHLY RESET ERROR]', error);
    return { reset: 0 };
  }
}

// ============================================================
// SUPPORT AUTOMATION
// ============================================================

/**
 * Learn patterns from resolved conversations with high satisfaction
 * Runs daily to identify new patterns from successful resolutions
 */
export async function learnFromResolvedConversations(
  env: AutomationEnv
): Promise<{ analyzed: number; suggestions: number }> {
  let analyzed = 0;
  let suggestions = 0;

  try {
    // Get recently resolved conversations with good ratings
    const resolvedConversations = await env.DB.prepare(`
      SELECT sc.id, sc.subject, sc.category, sc.satisfaction_rating
      FROM support_conversations sc
      WHERE sc.status IN ('resolved', 'closed')
        AND sc.satisfaction_rating >= 4
        AND sc.resolved_at > datetime('now', '-1 day')
        AND sc.handled_by IN ('ai', 'hybrid')
    `).all<{
      id: string;
      subject: string;
      category: string;
      satisfaction_rating: number;
    }>();

    for (const conv of resolvedConversations.results || []) {
      analyzed++;

      // Get messages from this conversation
      const messages = await env.DB.prepare(`
        SELECT content, sender_type FROM support_messages
        WHERE conversation_id = ?
        ORDER BY created_at
      `).bind(conv.id).all<{ content: string; sender_type: string }>();

      // Extract user messages
      const userMessages = (messages.results || [])
        .filter((m) => m.sender_type === 'user')
        .map((m) => m.content)
        .join(' ');

      // Extract keywords
      const keywords = extractKeywords(userMessages);

      if (keywords.length < 3) continue;

      // Check if similar pattern exists
      const existingPatterns = await env.DB.prepare(`
        SELECT id, trigger_keywords FROM support_patterns
        WHERE category = ? AND active = 1
      `).bind(conv.category).all<{ id: string; trigger_keywords: string }>();

      let hasSimilarPattern = false;
      for (const pattern of existingPatterns.results || []) {
        const patternKeywords = pattern.trigger_keywords.split(',').map((k) => k.trim().toLowerCase());
        const overlap = keywords.filter((k) => patternKeywords.includes(k));
        if (overlap.length >= 3) {
          hasSimilarPattern = true;
          break;
        }
      }

      if (!hasSimilarPattern) {
        // Create pattern suggestion
        const suggestionId = crypto.randomUUID();
        await env.DB.prepare(`
          INSERT INTO support_lessons
          (id, conversation_id, title, description, category, tags, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          suggestionId,
          conv.id,
          `Pattern Suggestie: ${conv.subject}`,
          `Automatisch gedetecteerd patroon uit succesvol opgelost ticket. Keywords: ${keywords.join(', ')}`,
          conv.category,
          keywords.join(',')
        ).run();

        suggestions++;
      }
    }
  } catch (error) {
    console.error('[PATTERN LEARNING ERROR]', error);
  }

  return { analyzed, suggestions };
}

/**
 * Extract keywords from text for pattern matching
 */
function extractKeywords(text: string): string[] {
  // Common Dutch/English stop words
  const stopWords = new Set([
    'de', 'het', 'een', 'en', 'van', 'in', 'is', 'op', 'te', 'dat', 'die', 'voor',
    'met', 'zijn', 'niet', 'aan', 'om', 'ook', 'als', 'kan', 'maar', 'bij', 'nog',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
    'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'this',
    'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
    'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'ik', 'je', 'jij',
    'u', 'we', 'ze', 'zij', 'er', 'hier', 'daar', 'waar', 'wat', 'wie', 'hoe',
    'waarom', 'wanneer', 'graag', 'even', 'wel', 'geen', 'meer', 'ja', 'nee',
  ]);

  // Extract words, filter stop words, keep meaningful terms
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  // Count frequency
  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  // Return top keywords
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Check for stale conversations and escalate
 * Runs hourly
 */
export async function checkSupportEscalations(
  env: AutomationEnv
): Promise<{ escalated: number; reminders: number }> {
  let escalated = 0;
  let reminders = 0;

  try {
    // Escalate conversations waiting > 4 hours without response
    const staleConversations = await env.DB.prepare(`
      SELECT sc.id, sc.user_id, sc.subject, sc.priority, u.email, u.name
      FROM support_conversations sc
      JOIN users u ON sc.user_id = u.id
      WHERE sc.status = 'waiting_support'
        AND sc.updated_at < datetime('now', '-4 hours')
        AND sc.priority != 'urgent'
    `).all<{
      id: string;
      user_id: string;
      subject: string;
      priority: string;
      email: string;
      name: string | null;
    }>();

    for (const conv of staleConversations.results || []) {
      // Upgrade priority
      const newPriority = conv.priority === 'low' ? 'normal' : conv.priority === 'normal' ? 'high' : 'urgent';

      await env.DB.prepare(`
        UPDATE support_conversations
        SET priority = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(newPriority, conv.id).run();

      // Add system message
      await env.DB.prepare(`
        INSERT INTO support_messages
        (id, conversation_id, sender_type, content, created_at)
        VALUES (?, ?, 'system', ?, datetime('now'))
      `).bind(
        crypto.randomUUID(),
        conv.id,
        `Prioriteit verhoogd naar ${newPriority} vanwege wachttijd.`
      ).run();

      escalated++;
    }

    // Send reminder for urgent conversations waiting > 1 hour
    const urgentWaiting = await env.DB.prepare(`
      SELECT sc.id, sc.subject FROM support_conversations sc
      WHERE sc.status = 'waiting_support'
        AND sc.priority = 'urgent'
        AND sc.updated_at < datetime('now', '-1 hour')
        AND sc.updated_at > datetime('now', '-2 hours')
    `).all<{ id: string; subject: string }>();

    for (const conv of urgentWaiting.results || []) {
      await sendAdminAlert(
        env,
        'URGENT: Support ticket wacht 1+ uur',
        `Ticket "${conv.subject}" (${conv.id}) is urgent en wacht al meer dan 1 uur op reactie.`
      );
      reminders++;
    }
  } catch (error) {
    console.error('[ESCALATION CHECK ERROR]', error);
  }

  return { escalated, reminders };
}

/**
 * Check for proactive support opportunities
 * Runs hourly
 */
export async function checkProactiveSupport(
  env: AutomationEnv
): Promise<{ tokenWarnings: number; errorSpikes: number }> {
  let tokenWarnings = 0;
  let errorSpikes = 0;

  try {
    // Check refresh tokens expiring in 7 days
    // @see EXACT-003 in operations/ROADMAP.md
    // Uses refresh_token_expires_at (30 day validity) not token_expires_at (10 min access token)
    const expiringTokens = await env.DB.prepare(`
      SELECT c.id, c.user_id, c.refresh_token_expires_at, u.email, u.name
      FROM connections c
      JOIN users u ON c.user_id = u.id
      WHERE c.refresh_token_expires_at IS NOT NULL
        AND c.refresh_token_expires_at < datetime('now', '+7 days')
        AND c.refresh_token_expires_at > datetime('now')
        AND c.status = 'active'
        AND c.expiry_alert_sent = 0
    `).all<{
      id: string;
      user_id: string;
      refresh_token_expires_at: string;
      email: string;
      name: string | null;
    }>();

    for (const conn of expiringTokens.results || []) {
      // Calculate days until expiry
      const expiryDate = new Date(conn.refresh_token_expires_at);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // Create proactive support ticket
      const convId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO support_conversations
        (id, user_id, subject, status, priority, category, handled_by, created_at, updated_at)
        VALUES (?, ?, 'Je Exact Online verbinding verloopt over ${daysUntilExpiry} dagen', 'open', 'normal', 'connection', 'system', datetime('now'), datetime('now'))
      `).bind(convId, conn.user_id).run();

      await env.DB.prepare(`
        INSERT INTO support_messages
        (id, conversation_id, sender_type, content, created_at)
        VALUES (?, ?, 'system', ?, datetime('now'))
      `).bind(
        crypto.randomUUID(),
        convId,
        `Je Exact Online verbinding verloopt over ${daysUntilExpiry} dagen (op ${expiryDate.toLocaleDateString('nl-NL')}). Log in om je verbinding te vernieuwen: https://praatmetjeboekhouding.nl/dashboard`
      ).run();

      await env.DB.prepare(`
        UPDATE connections SET expiry_alert_sent = 1 WHERE id = ?
      `).bind(conn.id).run();

      tokenWarnings++;
    }

    // Detect error spikes (3x normal rate)
    const errorSpikesResult = await env.DB.prepare(`
      WITH hourly AS (
        SELECT error_type, COUNT(*) as count_1h
        FROM support_error_log
        WHERE created_at > datetime('now', '-1 hour')
        GROUP BY error_type
      ),
      daily AS (
        SELECT error_type, COUNT(*) / 24.0 as avg_hourly
        FROM support_error_log
        WHERE created_at > datetime('now', '-24 hours')
        GROUP BY error_type
      )
      SELECT h.error_type, h.count_1h, d.avg_hourly
      FROM hourly h
      JOIN daily d ON h.error_type = d.error_type
      WHERE h.count_1h > 5
        AND h.count_1h / NULLIF(d.avg_hourly, 0) > 3
    `).all<{ error_type: string; count_1h: number; avg_hourly: number }>();

    for (const spike of errorSpikesResult.results || []) {
      await sendAdminAlert(
        env,
        `Error Spike: ${spike.error_type}`,
        `Error type "${spike.error_type}" heeft een spike: ${spike.count_1h} in laatste uur (normaal: ${spike.avg_hourly.toFixed(1)}/uur)`
      );
      errorSpikes++;
    }
  } catch (error) {
    console.error('[PROACTIVE SUPPORT ERROR]', error);
  }

  return { tokenWarnings, errorSpikes };
}

// ============================================================
// CRON HANDLER
// ============================================================

/**
 * Hoofd cron handler - draait via Cloudflare Workers Cron Triggers
 */
export async function handleCron(
  env: AutomationEnv,
  trigger: string // 'hourly', 'daily', 'monthly'
): Promise<{ success: boolean; results: Record<string, unknown> }> {
  const results: Record<string, unknown> = {};

  try {
    if (trigger === 'hourly') {
      // Proactive token refresh - vernieuw tokens die bijna verlopen
      results.proactiveRefresh = await proactiveTokenRefresh(env);
      // Check token refresh failures elk uur
      results.tokenCheck = await checkTokenRefreshFailures(env);
      // Support escalation checks
      results.supportEscalations = await checkSupportEscalations(env);
      // Proactive support checks
      results.proactiveSupport = await checkProactiveSupport(env);
    }

    if (trigger === 'daily') {
      // Dagelijkse taken
      results.onboarding = await processOnboardingEmails(env);
      results.rateLimits = await checkRateLimits(env);
      results.dailyStats = 'sent';
      await sendDailyStats(env);
      // Pattern learning
      results.patternLearning = await learnFromResolvedConversations(env);
      // AUTH-004: Cleanup revoked API keys older than 30 days
      results.apiKeyCleanup = await cleanupRevokedApiKeys(env);
    }

    if (trigger === 'monthly') {
      // Maandelijkse reset
      results.reset = await monthlyReset(env);
    }

    return { success: true, results };
  } catch (error) {
    console.error('[CRON ERROR]', error);
    return { success: false, results: { error: String(error) } };
  }
}

// ============================================================
// TRIGGER FUNCTIES (aan te roepen vanuit andere code)
// ============================================================

/**
 * Trigger wanneer nieuwe user aanmaakt
 */
export async function onNewUser(
  env: AutomationEnv,
  user: { id: string; email: string; name?: string },
  apiKey: string
): Promise<void> {
  // Stuur welkomst email
  const email = welcomeEmail(user.name || '', apiKey);
  email.to = user.email;
  await sendEmail(env, email);

  // Alert admin
  const alert = adminNewUserAlert(user);
  await sendAdminAlert(env, alert.subject, alert.message);
}

/**
 * Trigger wanneer user Pro koopt
 */
export async function onSubscriptionCreated(
  env: AutomationEnv,
  user: { email: string; name?: string }
): Promise<void> {
  const { subscriptionConfirmedEmail } = await import('./email');
  const email = subscriptionConfirmedEmail(user.name || '', 'Pro');
  email.to = user.email;
  await sendEmail(env, email);

  await sendAdminAlert(env, 'Nieuwe Pro subscriber', `${user.email} is geüpgraded naar Pro!`);
}

/**
 * Trigger wanneer user opzegt
 */
export async function onSubscriptionCancelled(
  env: AutomationEnv,
  user: { email: string; name?: string },
  endDate: string
): Promise<void> {
  const { subscriptionCancelledEmail } = await import('./email');
  const email = subscriptionCancelledEmail(user.name || '', endDate);
  email.to = user.email;
  await sendEmail(env, email);

  await sendAdminAlert(env, 'Subscription cancelled', `${user.email} heeft opgezegd (eindigt ${endDate})`);
}
