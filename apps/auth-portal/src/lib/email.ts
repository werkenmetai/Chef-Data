/**
 * Email Service voor Praat met je Boekhouding
 * Gebruikt Resend (100 emails/dag gratis) of fallback naar console logging
 *
 * Security: All user-controlled values are escaped via escapeHtml() to prevent HTML injection.
 */

import type { D1Database } from '@cloudflare/workers-types';
import { Database } from './database';
import { escapeHtml } from './security';

// Generate secure random ID for email log entries
function generateEmailId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Optional user ID for logging purposes */
  userId?: string;
  /** Optional template name for logging purposes */
  templateName?: string;
  /** Optional Reply-To address for email responses */
  replyTo?: string;
}

export interface Env {
  RESEND_API_KEY?: string;
  ADMIN_EMAILS?: string;
  /** D1 Database for email logging */
  DB?: D1Database;
  /** Token encryption key (passed to Database) */
  TOKEN_ENCRYPTION_KEY?: string;
}

/**
 * Log email to database
 */
async function logEmailToDb(
  env: Env,
  options: EmailOptions,
  status: 'sent' | 'failed' | 'dev_mode',
  errorMessage?: string
): Promise<void> {
  if (!env.DB) {
    return; // Skip logging if no database available
  }

  try {
    const db = new Database(env.DB, env.TOKEN_ENCRYPTION_KEY);
    await db.logEmail({
      id: generateEmailId(),
      userId: options.userId,
      toEmail: options.to,
      subject: options.subject,
      templateName: options.templateName,
      status,
      errorMessage,
    });
  } catch (logError) {
    // Don't fail email sending if logging fails
    console.error('[EMAIL LOG ERROR]', logError);
  }
}

/**
 * Verstuur een email via Resend API
 */
export async function sendEmail(env: Env, options: EmailOptions): Promise<boolean> {
  // Als geen API key, log naar console (development)
  if (!env.RESEND_API_KEY) {
    console.log('[EMAIL - DEV MODE]', {
      to: options.to,
      subject: options.subject,
    });

    // Log to database with dev_mode status
    await logEmailToDb(env, options, 'dev_mode');

    return true;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Praat met je Boekhouding <support@praatmetjeboekhouding.nl>',
        to: options.to,
        reply_to: options.replyTo,
        subject: options.subject,
        html: options.html,
        text: options.text || stripHtml(options.html),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EMAIL ERROR]', errorText);

      // Log failed email
      await logEmailToDb(env, options, 'failed', errorText);

      return false;
    }

    // Log successful email
    await logEmailToDb(env, options, 'sent');

    return true;
  } catch (error) {
    console.error('[EMAIL ERROR]', error);

    // Log failed email with error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logEmailToDb(env, options, 'failed', errorMessage);

    return false;
  }
}

/**
 * Stuur email naar admin(s)
 * Uses Promise.allSettled for parallel sending (LOW fix: sequential → parallel)
 */
export async function sendAdminAlert(env: Env, subject: string, message: string): Promise<void> {
  const adminEmails = env.ADMIN_EMAILS?.split(',') || [];

  // Send to all admins in parallel (LOW fix: was sequential)
  await Promise.allSettled(
    adminEmails.map((email) =>
      sendEmail(env, {
        to: email.trim(),
        subject: `[ADMIN] ${escapeHtml(subject)}`,
        html: emailTemplate({
          title: escapeHtml(subject),
          content: `<p>${escapeHtml(message)}</p>`,
          isAdmin: true,
        }),
      })
    )
  );
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

interface TemplateOptions {
  title: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  isAdmin?: boolean;
}

function emailTemplate(options: TemplateOptions): string {
  const ctaButton = options.ctaUrl ? `
    <table role="presentation" style="margin: 24px 0;">
      <tr>
        <td style="background-color: #0066FF; border-radius: 6px; padding: 12px 24px;">
          <a href="${escapeHtml(options.ctaUrl)}" style="color: #ffffff; text-decoration: none; font-weight: 600;">
            ${escapeHtml(options.ctaText) || 'Bekijk'}
          </a>
        </td>
      </tr>
    </table>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #0066FF; font-size: 24px; margin: 0;">Praat met je Boekhouding</h1>
  </div>

  ${options.isAdmin ? '<div style="background: #FEF3C7; padding: 8px 16px; border-radius: 4px; margin-bottom: 16px; font-size: 12px;">⚠️ Admin Alert</div>' : ''}

  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
    <h2 style="margin-top: 0; color: #111;">${options.title}</h2>
    ${options.content}
    ${ctaButton}
  </div>

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
    <p>
      <a href="https://praatmetjeboekhouding.nl/docs" style="color: #0066FF;">Documentatie</a> ·
      <a href="https://praatmetjeboekhouding.nl/dashboard" style="color: #0066FF;">Dashboard</a> ·
      <a href="mailto:support@praatmetjeboekhouding.nl" style="color: #0066FF;">Support</a>
    </p>
    <p>© ${new Date().getFullYear()} Chef Data B.V.</p>
  </div>

</body>
</html>
  `.trim();
}

// ============================================================
// SPECIFIEKE EMAIL FUNCTIES
// ============================================================

/**
 * Welkomst email na eerste signup
 */
export function welcomeEmail(userName: string, apiKey: string): EmailOptions {
  return {
    to: '', // Wordt ingevuld door caller
    subject: 'Welkom bij Praat met je Boekhouding',
    html: emailTemplate({
      title: `Welkom${userName ? `, ${escapeHtml(userName)}` : ''}`,
      content: `
        <p>Je Exact Online account is gekoppeld. Je kunt nu vragen stellen aan je boekhouding via Claude, ChatGPT of een andere AI-assistent.</p>

        <h3 style="margin-top: 24px;">Je sleutel</h3>
        <div style="background: #f3f4f6; padding: 12px; border-radius: 4px; font-family: monospace; word-break: break-all;">
          ${apiKey}
        </div>
        <p style="font-size: 14px; color: #6b7280;">Bewaar deze veilig. Om veiligheidsredenen tonen we hem maar één keer.</p>

        <h3 style="margin-top: 24px;">Zo ga je verder</h3>
        <ol>
          <li>Ga naar <a href="https://praatmetjeboekhouding.nl/setup" style="color: #0066FF;">Setup</a> voor de handleiding</li>
          <li>Kopieer de configuratie naar je AI-assistent</li>
          <li>Stel je eerste vraag: <em>"Welke facturen staan er open?"</em></li>
        </ol>

        <h3 style="margin-top: 24px;">Tips voor betere resultaten</h3>
        <ul>
          <li>Wees specifiek: <em>"facturen van januari 2024"</em> in plaats van <em>"facturen"</em></li>
          <li>Vraag om details: <em>"inclusief factuurnummer en bedrag"</em></li>
          <li>Controleer belangrijke antwoorden altijd in Exact Online</li>
        </ul>
      `,
      ctaText: 'Bekijk handleiding',
      ctaUrl: 'https://praatmetjeboekhouding.nl/setup',
    }),
  };
}

/**
 * Onboarding dag 1 - Check of setup gelukt is
 */
export function onboardingDay1Email(userName: string): EmailOptions {
  return {
    to: '',
    subject: 'Lukt het instellen?',
    html: emailTemplate({
      title: 'Alles werkend?',
      content: `
        <p>Hoi${userName ? ` ${escapeHtml(userName)}` : ''},</p>

        <p>Je hebt gisteren je Exact Online account gekoppeld. Heb je de configuratie al in je AI-assistent gezet?</p>

        <h3>Veelvoorkomende problemen</h3>
        <ul>
          <li><strong>Claude geeft een foutmelding:</strong> Controleer of de sleutel correct is gekopieerd (inclusief <code>exa_</code> vooraan)</li>
          <li><strong>"No connection found":</strong> Log opnieuw in via <a href="https://praatmetjeboekhouding.nl/connect" style="color: #0066FF;">Verbinden</a></li>
          <li><strong>Configuratie werkt niet:</strong> Herstart Claude Desktop na het aanpassen van het configuratiebestand</li>
        </ul>

        <p>Kom je er niet uit? Reply op deze e-mail of bekijk de <a href="https://praatmetjeboekhouding.nl/docs" style="color: #0066FF;">documentatie</a>.</p>
      `,
      ctaText: 'Bekijk hulppagina',
      ctaUrl: 'https://praatmetjeboekhouding.nl/docs#troubleshooting',
    }),
  };
}

/**
 * Onboarding dag 3 - Voorbeeldvragen
 */
export function onboardingDay3Email(userName: string): EmailOptions {
  return {
    to: '',
    subject: '5 vragen om aan je boekhouding te stellen',
    html: emailTemplate({
      title: 'Probeer deze vragen',
      content: `
        <p>Hoi${userName ? ` ${escapeHtml(userName)}` : ''},</p>

        <p>Hier zijn 5 vragen die je kunt stellen aan Claude of ChatGPT met je Exact Online data:</p>

        <ol>
          <li style="margin-bottom: 12px;">
            <strong>"Welke verkoopfacturen staan nog open? Toon factuurnummer, klant en bedrag."</strong>
            <br><span style="color: #6b7280; font-size: 14px;">→ Direct overzicht van openstaande posten</span>
          </li>
          <li style="margin-bottom: 12px;">
            <strong>"Wat is de totale omzet van afgelopen maand, uitgesplitst per week?"</strong>
            <br><span style="color: #6b7280; font-size: 14px;">→ Snelle omzetanalyse</span>
          </li>
          <li style="margin-bottom: 12px;">
            <strong>"Welke klanten hebben facturen die meer dan 30 dagen over de vervaldatum zijn?"</strong>
            <br><span style="color: #6b7280; font-size: 14px;">→ Debiteurenbeheer</span>
          </li>
          <li style="margin-bottom: 12px;">
            <strong>"Toon de laatste 10 banktransacties van mijn hoofdrekening."</strong>
            <br><span style="color: #6b7280; font-size: 14px;">→ Bank reconciliatie</span>
          </li>
          <li style="margin-bottom: 12px;">
            <strong>"Vergelijk de inkoopfacturen van deze maand met vorige maand."</strong>
            <br><span style="color: #6b7280; font-size: 14px;">→ Kostenanalyse</span>
          </li>
        </ol>

        <p style="background: #FEF3C7; padding: 12px; border-radius: 4px; font-size: 14px;">
          💡 <strong>Tip:</strong> Vraag altijd om factuurnummers of referenties zodat je de output kunt controleren in Exact Online.
        </p>
      `,
      ctaText: 'Meer voorbeelden in Docs',
      ctaUrl: 'https://praatmetjeboekhouding.nl/docs#voorbeeldvragen',
    }),
  };
}

/**
 * Onboarding dag 7 - Upgrade prompt
 */
export function onboardingDay7Email(userName: string, apiCallsUsed: number): EmailOptions {
  const usagePercent = Math.round((apiCallsUsed / 1000) * 100);

  return {
    to: '',
    subject: 'Je eerste week met Praat met je Boekhouding',
    html: emailTemplate({
      title: 'Hoe bevalt het?',
      content: `
        <p>Hoi${userName ? ` ${escapeHtml(userName)}` : ''},</p>

        <p>Je gebruikt Praat met je Boekhouding nu een week. Hier is je gebruik:</p>

        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <div style="font-size: 32px; font-weight: bold; color: #0066FF;">${apiCallsUsed.toLocaleString()}</div>
          <div style="color: #6b7280;">opdrachten deze maand (${usagePercent}% van 1.000)</div>
        </div>

        ${apiCallsUsed > 500 ? `
          <p>Je bent een actieve gebruiker! Overweeg <strong>Starter</strong> (€9) of <strong>Pro</strong> (€25) voor meer calls:</p>
          <ul>
            <li>Starter: 750 opdrachten, 3 administraties</li>
            <li>Pro: 2.500 opdrachten, 10 administraties, priority support</li>
          </ul>
        ` : `
          <p>We horen graag hoe het gaat. Heb je suggesties of loop je ergens tegenaan?</p>
        `}

        <p>Reply op deze email - we lezen alles!</p>
      `,
      ctaText: apiCallsUsed > 500 ? 'Bekijk Pro Plan' : 'Geef Feedback',
      ctaUrl: apiCallsUsed > 500 ? 'https://praatmetjeboekhouding.nl/pricing' : 'mailto:support@praatmetjeboekhouding.nl?subject=Feedback',
    }),
  };
}

/**
 * Token expired - actie vereist
 */
export function tokenExpiredEmail(userName: string): EmailOptions {
  return {
    to: '',
    subject: 'Je Exact Online verbinding is verlopen',
    html: emailTemplate({
      title: 'Verbinding verlopen',
      content: `
        <p>Hoi${userName ? ` ${escapeHtml(userName)}` : ''},</p>

        <p>Je Exact Online verbinding is verlopen. Dit kan gebeuren als:</p>
        <ul>
          <li>Je wachtwoord is gewijzigd bij Exact Online</li>
          <li>De toegang is ingetrokken in Exact Online</li>
          <li>Er een technisch probleem was bij het vernieuwen</li>
        </ul>

        <p><strong>Je AI-assistent kan geen data meer ophalen tot je opnieuw verbindt.</strong></p>

        <p>Klik hieronder om opnieuw te verbinden (duurt 30 seconden):</p>
      `,
      ctaText: 'Opnieuw Verbinden',
      ctaUrl: 'https://praatmetjeboekhouding.nl/connect',
    }),
  };
}

/**
 * Rate limit warning (80% bereikt)
 */
export function rateLimitWarningEmail(userName: string, used: number, limit: number): EmailOptions {
  const percent = Math.round((used / limit) * 100);

  return {
    to: '',
    subject: `Je hebt ${percent}% van je limiet gebruikt`,
    html: emailTemplate({
      title: 'Opdrachten limiet bijna bereikt',
      content: `
        <p>Hoi${userName ? ` ${escapeHtml(userName)}` : ''},</p>

        <p>Je hebt <strong>${used.toLocaleString()}</strong> van je <strong>${limit.toLocaleString()}</strong> opdrachten gebruikt deze maand (${percent}%).</p>

        <div style="background: #f3f4f6; border-radius: 8px; padding: 4px; margin: 16px 0;">
          <div style="background: ${percent > 90 ? '#EF4444' : '#F59E0B'}; height: 24px; border-radius: 6px; width: ${percent}%;"></div>
        </div>

        <p>Als je limiet bereikt is, werkt je AI-integratie niet meer tot volgende maand.</p>

        <h3>Opties</h3>
        <ul>
          <li><strong>Upgrade naar Starter:</strong> 750 calls/maand voor €9, of <strong>Pro:</strong> 2.500 calls/maand voor €25</li>
          <li><strong>Wacht:</strong> Je limiet reset op de 1e van de maand</li>
        </ul>
      `,
      ctaText: 'Upgrade naar Pro',
      ctaUrl: 'https://praatmetjeboekhouding.nl/pricing',
    }),
  };
}

/**
 * Rate limit bereikt
 */
export function rateLimitReachedEmail(userName: string, plan: string): EmailOptions {
  return {
    to: '',
    subject: 'Je limiet is bereikt',
    html: emailTemplate({
      title: 'Opdrachten limiet bereikt',
      content: `
        <p>Hoi${userName ? ` ${escapeHtml(userName)}` : ''},</p>

        <p>Je hebt je maandelijkse opdrachten limiet bereikt. Je AI-assistent kan geen data meer ophalen tot:</p>

        <ul>
          <li><strong>Optie 1:</strong> Je upgrade naar een hoger plan</li>
          <li><strong>Optie 2:</strong> Je limiet reset op de 1e van volgende maand</li>
        </ul>

        ${plan === 'free' ? `
          <p>Met <strong>Starter</strong> krijg je 750 calls/maand voor €9, of <strong>Pro</strong> met 2.500 calls/maand voor €25.</p>
        ` : `
          <p>Neem contact op voor een Enterprise plan met ongelimiteerde calls.</p>
        `}
      `,
      ctaText: plan === 'free' ? 'Upgrade naar Pro' : 'Contact Enterprise',
      ctaUrl: plan === 'free' ? 'https://praatmetjeboekhouding.nl/pricing' : 'mailto:support@praatmetjeboekhouding.nl?subject=Enterprise',
    }),
  };
}

/**
 * Subscription confirmed
 */
export function subscriptionConfirmedEmail(userName: string, plan: string): EmailOptions {
  return {
    to: '',
    subject: `Je hebt nu ${plan}`,
    html: emailTemplate({
      title: `Je bent nu ${plan} gebruiker`,
      content: `
        <p>Hoi${userName ? ` ${escapeHtml(userName)}` : ''},</p>

        <p>Bedankt voor je upgrade! Je nieuwe limiet is direct actief:</p>

        <div style="background: #ECFDF5; border: 1px solid #10B981; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong style="color: #065F46;">✓ Je nieuwe limiet is actief</strong><br>
          <strong style="color: #065F46;">✓ Bekijk je dashboard voor details</strong>
        </div>

        <p>Je kunt je abonnement beheren via het dashboard.</p>
      `,
      ctaText: 'Ga naar Dashboard',
      ctaUrl: 'https://praatmetjeboekhouding.nl/dashboard',
    }),
  };
}

/**
 * Subscription cancelled
 */
export function subscriptionCancelledEmail(userName: string, endDate: string): EmailOptions {
  return {
    to: '',
    subject: 'Je abonnement is opgezegd',
    html: emailTemplate({
      title: 'Abonnement opgezegd',
      content: `
        <p>Hoi${userName ? ` ${escapeHtml(userName)}` : ''},</p>

        <p>Je Pro abonnement is opgezegd. Je houdt toegang tot Pro features tot <strong>${endDate}</strong>.</p>

        <p>Daarna gaat je account terug naar het Free plan (1.000 calls/maand).</p>

        <p>We vinden het jammer je te zien gaan. Mogen we vragen waarom je opzegt? Reply op deze email - je feedback helpt ons verbeteren.</p>

        <p style="color: #6b7280; font-size: 14px;">Je kunt je abonnement op elk moment opnieuw activeren via het dashboard.</p>
      `,
      ctaText: 'Abonnement Herstellen',
      ctaUrl: 'https://praatmetjeboekhouding.nl/dashboard',
    }),
  };
}

// ============================================================
// ADMIN ALERTS
// ============================================================

/**
 * Nieuwe signup alert voor admin
 * Security: User input is escaped to prevent HTML injection
 */
export function adminNewUserAlert(user: { email: string; name?: string }): { subject: string; message: string } {
  return {
    subject: 'Nieuwe gebruiker aangemeld',
    message: `
      <strong>Email:</strong> ${escapeHtml(user.email)}<br>
      <strong>Naam:</strong> ${escapeHtml(user.name) || 'Niet opgegeven'}<br>
      <strong>Tijd:</strong> ${new Date().toLocaleString('nl-NL')}
    `,
  };
}

/**
 * Error alert voor admin
 * Security: Error details are escaped to prevent HTML injection
 */
export function adminErrorAlert(error: { type: string; message: string; userId?: string; details?: string }): { subject: string; message: string } {
  return {
    subject: `Error: ${escapeHtml(error.type)}`,
    message: `
      <strong>Type:</strong> ${escapeHtml(error.type)}<br>
      <strong>Message:</strong> ${escapeHtml(error.message)}<br>
      ${error.userId ? `<strong>User ID:</strong> ${escapeHtml(error.userId)}<br>` : ''}
      ${error.details ? `<strong>Details:</strong><pre style="background:#f3f4f6;padding:8px;border-radius:4px;overflow:auto;">${escapeHtml(error.details)}</pre>` : ''}
      <strong>Tijd:</strong> ${new Date().toLocaleString('nl-NL')}
    `,
  };
}

/**
 * Dagelijkse stats voor admin
 */
export function adminDailyStatsAlert(stats: {
  newUsers: number;
  totalUsers: number;
  apiCalls: number;
  errors: number;
  topUsers: Array<{ email: string; calls: number }>;
}): { subject: string; message: string } {
  const topUsersHtml = stats.topUsers
    .map((u, i) => `${i + 1}. ${escapeHtml(u.email)} - ${u.calls} calls`)
    .join('<br>');

  return {
    subject: `Dagelijkse stats: ${stats.newUsers} nieuwe users, ${stats.apiCalls} calls`,
    message: `
      <h3>Gisteren</h3>
      <table style="border-collapse: collapse;">
        <tr><td style="padding: 4px 12px 4px 0;">Nieuwe users:</td><td><strong>${stats.newUsers}</strong></td></tr>
        <tr><td style="padding: 4px 12px 4px 0;">Totaal users:</td><td><strong>${stats.totalUsers}</strong></td></tr>
        <tr><td style="padding: 4px 12px 4px 0;">vragen:</td><td><strong>${stats.apiCalls}</strong></td></tr>
        <tr><td style="padding: 4px 12px 4px 0;">Errors:</td><td><strong>${stats.errors}</strong></td></tr>
      </table>

      <h3>Top gebruikers (gisteren)</h3>
      ${topUsersHtml || '<em>Geen activiteit</em>'}
    `,
  };
}

// ============================================================
// FEEDBACK & TESTIMONIAL EMAILS
// ============================================================

interface FeedbackEmailOptions {
  userName: string;
  queryCount: number;
  trackingToken: string;
  responseToken: string;
}

/**
 * Day 7 Check-in - NPS Survey
 */
export function feedbackDay7Email(options: FeedbackEmailOptions): EmailOptions {
  const baseUrl = 'https://praatmetjeboekhouding.nl';
  const trackingPixel = `${baseUrl}/api/feedback/track/${options.trackingToken}`;

  // NPS buttons 1-10
  const npsButtons = Array.from({ length: 10 }, (_, i) => {
    const score = i + 1;
    const url = `${baseUrl}/api/feedback/nps/${options.responseToken}/${score}`;
    const bgColor = score <= 6 ? '#FEE2E2' : score <= 8 ? '#FEF3C7' : '#D1FAE5';
    const textColor = score <= 6 ? '#991B1B' : score <= 8 ? '#92400E' : '#065F46';
    return `<td style="padding:2px;"><a href="${url}" style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;background:${bgColor};color:${textColor};text-decoration:none;border-radius:4px;font-weight:bold;">${score}</a></td>`;
  }).join('');

  return {
    to: '',
    subject: 'Hoe bevalt Praat met je Boekhouding?',
    html: emailTemplate({
      title: 'Hoe gaat het?',
      content: `
        <p>Hoi${options.userName ? ` ${escapeHtml(options.userName)}` : ''},</p>

        <p>Je gebruikt Praat met je Boekhouding nu een week. We zijn benieuwd hoe het gaat!</p>

        <p><strong>Eén snelle vraag:</strong> Hoe waarschijnlijk is het dat je ons aanraadt aan een collega?</p>

        <table role="presentation" style="margin: 16px 0;">
          <tr>
            <td style="font-size: 11px; color: #6b7280; padding-right: 8px;">Onwaarschijnlijk</td>
            ${npsButtons}
            <td style="font-size: 11px; color: #6b7280; padding-left: 8px;">Zeer waarschijnlijk</td>
          </tr>
        </table>

        <p style="font-size: 14px; color: #6b7280;">Klik op een cijfer om je score te geven - het duurt 2 seconden.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

        <p style="font-size: 14px;">
          <strong>Je stats deze week:</strong><br>
          📊 ${options.queryCount} vragen gesteld
        </p>

        <p style="font-size: 14px; color: #6b7280;">
          Heb je tips of loop je ergens tegenaan? Reply gewoon op deze mail - we lezen alles.
        </p>

        <p style="font-size: 12px; color: #9CA3AF; margin-top: 24px;">
          <a href="${baseUrl}/api/feedback/opt-out?token=${options.trackingToken}" style="color: #9CA3AF;">
            Geen feedback emails meer ontvangen
          </a>
        </p>

        <img src="${trackingPixel}" width="1" height="1" style="display:none;" alt="">
      `,
    }),
  };
}

/**
 * Testimonial Request - For promoters (NPS 9-10)
 */
export function testimonialRequestEmail(options: FeedbackEmailOptions & { npsScore?: number }): EmailOptions {
  const baseUrl = 'https://praatmetjeboekhouding.nl';
  const trackingPixel = `${baseUrl}/api/feedback/track/${options.trackingToken}`;
  const testimonialUrl = `${baseUrl}/feedback/testimonial?token=${options.responseToken}`;

  return {
    to: '',
    subject: 'Mogen we je ervaring delen?',
    html: emailTemplate({
      title: 'Bedankt voor je positieve feedback!',
      content: `
        <p>Hoi${options.userName ? ` ${escapeHtml(options.userName)}` : ''},</p>

        ${options.npsScore ? `<p>Je gaf ons een ${options.npsScore}/10 - dat doet ons goed!</p>` : ''}

        <p>We zijn een jong product en jouw ervaring kan andere ondernemers helpen om de stap te zetten.</p>

        <p><strong>Mogen we een korte quote van je delen op onze website?</strong></p>

        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 12px 0; font-weight: 600;">Hoe het werkt:</p>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Schrijf in 1-2 zinnen wat je het meest waardeert</li>
            <li>Geef aan hoe we je mogen noemen</li>
            <li>Wij sturen een preview voordat het live gaat</li>
          </ol>
        </div>

        <p style="background: #FEF3C7; padding: 12px; border-radius: 4px; font-size: 14px;">
          🎁 <strong>Als dank:</strong> Je krijgt volgende maand 50% korting op je Pro abonnement
        </p>

        <p style="font-size: 12px; color: #9CA3AF; margin-top: 24px;">
          <a href="${baseUrl}/api/feedback/opt-out?token=${options.trackingToken}" style="color: #9CA3AF;">
            Geen emails meer ontvangen
          </a>
        </p>

        <img src="${trackingPixel}" width="1" height="1" style="display:none;" alt="">
      `,
      ctaText: 'Deel je ervaring',
      ctaUrl: testimonialUrl,
    }),
  };
}

/**
 * Churn Prevention - Inactive user check-in
 */
export function churnPreventionEmail(options: FeedbackEmailOptions & { daysInactive: number; lastQueryDate: string }): EmailOptions {
  const baseUrl = 'https://praatmetjeboekhouding.nl';
  const trackingPixel = `${baseUrl}/api/feedback/track/${options.trackingToken}`;
  const feedbackUrl = `${baseUrl}/feedback/churn?token=${options.responseToken}`;

  return {
    to: '',
    subject: 'We missen je vragen',
    html: emailTemplate({
      title: 'Alles goed?',
      content: `
        <p>Hoi${options.userName ? ` ${escapeHtml(options.userName)}` : ''},</p>

        <p>Het is even stil geweest. Je stelde ${options.daysInactive} dagen geleden je laatste vraag.</p>

        <p>Misschien:</p>
        <ul>
          <li><strong>Technisch probleem?</strong> → Reply en we helpen direct</li>
          <li><strong>Weet je niet wat je kunt vragen?</strong> → <a href="${baseUrl}/docs/use-cases" style="color: #0066FF;">Bekijk onze use cases</a></li>
          <li><strong>Geen tijd gehad?</strong> → Snap ik, we staan klaar als je terugkomt</li>
        </ul>

        <p>Of misschien past het gewoon niet bij hoe jij werkt - ook goed om te weten.</p>

        <p><strong>Wat houdt je tegen?</strong></p>

        <div style="margin: 16px 0;">
          <a href="${feedbackUrl}&reason=technical" style="display: inline-block; padding: 8px 16px; margin: 4px; background: #F3F4F6; color: #374151; text-decoration: none; border-radius: 4px; font-size: 14px;">Technische problemen</a>
          <a href="${feedbackUrl}&reason=unclear" style="display: inline-block; padding: 8px 16px; margin: 4px; background: #F3F4F6; color: #374151; text-decoration: none; border-radius: 4px; font-size: 14px;">Weet niet hoe te gebruiken</a>
          <a href="${feedbackUrl}&reason=not_useful" style="display: inline-block; padding: 8px 16px; margin: 4px; background: #F3F4F6; color: #374151; text-decoration: none; border-radius: 4px; font-size: 14px;">Niet nuttig genoeg</a>
          <a href="${feedbackUrl}&reason=price" style="display: inline-block; padding: 8px 16px; margin: 4px; background: #F3F4F6; color: #374151; text-decoration: none; border-radius: 4px; font-size: 14px;">Te duur</a>
          <a href="${feedbackUrl}&reason=other" style="display: inline-block; padding: 8px 16px; margin: 4px; background: #F3F4F6; color: #374151; text-decoration: none; border-radius: 4px; font-size: 14px;">Anders</a>
        </div>

        <p style="font-size: 14px; color: #6b7280;">Je feedback helpt ons verbeteren - ook als het negatief is.</p>

        <p style="font-size: 12px; color: #9CA3AF; margin-top: 24px;">
          <a href="${baseUrl}/api/feedback/opt-out?token=${options.trackingToken}" style="color: #9CA3AF;">
            Geen emails meer ontvangen
          </a>
        </p>

        <img src="${trackingPixel}" width="1" height="1" style="display:none;" alt="">
      `,
    }),
  };
}

/**
 * Positive feedback follow-up - Request review/referral
 */
export function positiveFeedbackFollowupEmail(options: FeedbackEmailOptions & { feedbackQuote?: string }): EmailOptions {
  const baseUrl = 'https://praatmetjeboekhouding.nl';
  const trackingPixel = `${baseUrl}/api/feedback/track/${options.trackingToken}`;

  return {
    to: '',
    subject: 'Bedankt voor je feedback',
    html: emailTemplate({
      title: 'Bedankt voor je feedback!',
      content: `
        <p>Hoi${options.userName ? ` ${escapeHtml(options.userName)}` : ''},</p>

        <p>Dankjewel voor je positieve feedback! Dat motiveert enorm.</p>

        ${options.feedbackQuote ? `
          <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 12px 16px; margin: 16px 0; font-style: italic;">
            "${escapeHtml(options.feedbackQuote)}"
          </div>
        ` : ''}

        <p>Mag ik je twee dingen vragen?</p>

        <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">1. Deel je ervaring</p>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            Een review helpt andere ondernemers ons te vinden.
            <br><a href="https://www.google.com/search?q=praat+met+je+boekhouding" style="color: #0066FF;">Laat een Google review achter →</a>
          </p>
        </div>

        <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">2. Ken je iemand die hier ook wat aan heeft?</p>
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            Stuur ze gerust door - ze krijgen de eerste maand gratis met code <strong>VRIEND2026</strong>
          </p>
        </div>

        <p>Nogmaals bedankt!</p>

        <img src="${trackingPixel}" width="1" height="1" style="display:none;" alt="">
      `,
    }),
  };
}

// ============================================================
// SUPPORT ESCALATION
// ============================================================

export interface SupportEscalationOptions {
  conversationId: string;
  customerEmail: string;
  customerName: string | null;
  customerPlan: string;
  subject: string;
  messages: Array<{ sender_type: string; content: string; created_at: string }>;
  aiAnalysis: {
    category: string;
    confidence: number;
    attemptedSolutions: string[];
  };
}

/**
 * Escalation email to admin when AI cannot resolve a support ticket
 * Uses Reply-To with conversation ID for threaded replies
 */
export function supportEscalationEmail(options: SupportEscalationOptions): EmailOptions {
  const conversationIdShort = options.conversationId.slice(0, 8);
  const replyToAddress = `support+${options.conversationId}@praatmetjeboekhouding.nl`;

  // Format messages as conversation thread
  const messagesHtml = options.messages
    .map((msg) => {
      const senderLabel = msg.sender_type === 'user' ? '👤 Klant' :
                          msg.sender_type === 'ai' ? '🤖 AI' :
                          msg.sender_type === 'admin' ? '👨‍💼 Admin' : '⚙️ Systeem';
      const timestamp = new Date(msg.created_at).toLocaleString('nl-NL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      const bgColor = msg.sender_type === 'user' ? '#F3F4F6' :
                      msg.sender_type === 'ai' ? '#EFF6FF' : '#F0FDF4';

      return `
        <div style="background: ${bgColor}; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
            ${senderLabel} · ${timestamp}
          </div>
          <div style="white-space: pre-wrap;">${escapeHtml(msg.content)}</div>
        </div>
      `;
    })
    .join('');

  // Format attempted solutions
  const solutionsHtml = options.aiAnalysis.attemptedSolutions.length > 0
    ? `<ul>${options.aiAnalysis.attemptedSolutions.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
    : '<em>Geen oplossingen geprobeerd</em>';

  return {
    to: 'matthijs@chefdata.nl',
    subject: `[Support #${conversationIdShort}] ${escapeHtml(options.subject)}`,
    replyTo: replyToAddress,
    html: emailTemplate({
      title: `Support Escalatie`,
      content: `
        <div style="background: #FEF2F2; border: 1px solid #FCA5A5; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          <strong>⚠️ AI kon dit niet oplossen - actie vereist</strong>
        </div>

        <h3 style="margin-top: 0;">Klantgegevens</h3>
        <table style="border-collapse: collapse; margin-bottom: 16px;">
          <tr>
            <td style="padding: 4px 16px 4px 0; color: #6b7280;">Email:</td>
            <td><a href="mailto:${escapeHtml(options.customerEmail)}" style="color: #0066FF;">${escapeHtml(options.customerEmail)}</a></td>
          </tr>
          <tr>
            <td style="padding: 4px 16px 4px 0; color: #6b7280;">Naam:</td>
            <td>${escapeHtml(options.customerName) || '<em>Niet bekend</em>'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 16px 4px 0; color: #6b7280;">Plan:</td>
            <td><strong>${escapeHtml(options.customerPlan)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 4px 16px 4px 0; color: #6b7280;">Categorie:</td>
            <td>${escapeHtml(options.aiAnalysis.category)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 16px 4px 0; color: #6b7280;">AI Confidence:</td>
            <td>${Math.round(options.aiAnalysis.confidence * 100)}%</td>
          </tr>
        </table>

        <h3>Geprobeerde oplossingen</h3>
        ${solutionsHtml}

        <h3>Gesprek</h3>
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; max-height: 400px; overflow-y: auto;">
          ${messagesHtml}
        </div>

        <div style="background: #ECFDF5; border: 1px solid #10B981; padding: 16px; border-radius: 8px; margin-top: 24px;">
          <h4 style="margin: 0 0 8px 0; color: #065F46;">💡 Antwoorden</h4>
          <p style="margin: 0; color: #065F46;">
            Reply direct op deze email. Je antwoord wordt automatisch doorgestuurd naar de klant en het AI-systeem neemt over met jouw instructies.
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #047857;">
            Reply-To: ${replyToAddress}
          </p>
        </div>

        <p style="margin-top: 16px; font-size: 14px;">
          <a href="https://praatmetjeboekhouding.nl/admin/support/conversations/${options.conversationId}" style="color: #0066FF;">
            Bekijk in admin panel →
          </a>
        </p>
      `,
      isAdmin: true,
    }),
    templateName: 'support_escalation',
  };
}

/**
 * Acknowledgment email to customer when conversation is created via email
 */
export function supportAcknowledgmentEmail(options: {
  conversationId: string;
  customerName: string | null;
  subject: string;
}): EmailOptions {
  const replyToAddress = `support+${options.conversationId}@praatmetjeboekhouding.nl`;

  return {
    to: '', // Caller sets this
    subject: `Re: ${escapeHtml(options.subject)}`,
    replyTo: replyToAddress,
    html: emailTemplate({
      title: 'We hebben je bericht ontvangen',
      content: `
        <p>Hoi${options.customerName ? ` ${escapeHtml(options.customerName)}` : ''},</p>

        <p>Bedankt voor je bericht. We hebben je vraag ontvangen en gaan ermee aan de slag.</p>

        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; font-weight: 600;">Onderwerp: ${escapeHtml(options.subject)}</p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
            Ticket #${options.conversationId.slice(0, 8)}
          </p>
        </div>

        <p><strong>Wat kun je verwachten?</strong></p>
        <ul>
          <li>Ons AI-systeem analyseert je vraag en probeert direct te helpen</li>
          <li>Als menselijke hulp nodig is, krijg je binnen 24 uur antwoord</li>
          <li>Reply op deze email om meer informatie toe te voegen</li>
        </ul>

        <p style="font-size: 14px; color: #6b7280;">
          Je kunt ook inloggen in je <a href="https://praatmetjeboekhouding.nl/dashboard" style="color: #0066FF;">dashboard</a> om de voortgang te volgen.
        </p>
      `,
    }),
    templateName: 'support_acknowledgment',
  };
}

/**
 * Customer notification when admin has replied
 */
export function supportReplyNotificationEmail(options: {
  conversationId: string;
  customerName: string | null;
  subject: string;
  replyContent: string;
}): EmailOptions {
  const replyToAddress = `support+${options.conversationId}@praatmetjeboekhouding.nl`;

  return {
    to: '', // Caller sets this
    subject: `Re: ${escapeHtml(options.subject)}`,
    replyTo: replyToAddress,
    html: emailTemplate({
      title: 'Nieuw antwoord op je vraag',
      content: `
        <p>Hoi${options.customerName ? ` ${escapeHtml(options.customerName)}` : ''},</p>

        <p>We hebben gereageerd op je support vraag:</p>

        <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 16px; margin: 16px 0; white-space: pre-wrap;">
${escapeHtml(options.replyContent)}
        </div>

        <p style="font-size: 14px; color: #6b7280;">
          Heb je nog vragen? Reply direct op deze email of bekijk het volledige gesprek in je
          <a href="https://praatmetjeboekhouding.nl/dashboard" style="color: #0066FF;">dashboard</a>.
        </p>

        <p style="font-size: 12px; color: #9CA3AF; margin-top: 24px;">
          Ticket #${options.conversationId.slice(0, 8)}
        </p>
      `,
    }),
    templateName: 'support_reply_notification',
  };
}

// ============================================================
// HELPERS
// ============================================================

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
