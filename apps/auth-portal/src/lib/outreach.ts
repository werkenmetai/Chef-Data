/**
 * Proactive Outreach Engine
 *
 * Handles automated customer engagement based on usage patterns.
 * Anti-spam is critical: cooldowns are enforced at multiple levels.
 *
 * @author Sophie (Customer Success)
 */

import type { D1Database } from '@cloudflare/workers-types';
import { PLAN_LIMITS, type PlanType } from './constants';
import { sendEmail } from './email';
import type { Env } from './email';
import { escapeHtml } from './security';

// ============================================
// Types
// ============================================

export interface OutreachCampaign {
  id: string;
  name: string;
  description: string | null;
  trigger_type: TriggerType;
  template_id: string | null;
  is_active: number;
  priority: number;
  config: string | null;
  email_subject: string | null;
  email_template: string | null;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  conversions: number;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface OutreachLog {
  id: string;
  campaign_id: string;
  user_id: string;
  trigger_type: string;
  trigger_data: string | null;
  email_sent: number;
  email_sent_at: string | null;
  email_opened: number;
  email_opened_at: string | null;
  email_clicked: number;
  email_clicked_at: string | null;
  converted: number;
  converted_at: string | null;
  conversion_type: string | null;
  created_at: string;
  error_message: string | null;
}

export interface OutreachLogWithUser extends OutreachLog {
  user_email: string;
  user_name: string | null;
  campaign_name: string;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  description: string | null;
  subject_nl: string;
  subject_en: string | null;
  body_nl: string;
  body_en: string | null;
  trigger_type: string;
  is_default: number;
  is_active: number;
  times_used: number;
  avg_open_rate: number;
  avg_click_rate: number;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
}

export interface CampaignConfig {
  cooldown_days: number;
  min_total_queries?: number;
  min_days_active?: number;
  min_nps_score?: number;
  min_errors_24h?: number;
  conditions?: Record<string, unknown>;
}

export type TriggerType =
  | 'limit_80'
  | 'limit_100'
  | 'inactive_14d'
  | 'nps_high'
  | 'milestone'
  | 'error_pattern';

interface UserForOutreach {
  id: string;
  email: string;
  name: string | null;
  plan: PlanType;
  api_calls_used: number;
  last_api_call_at: string | null;
  feedback_opt_out: number;
  limit_warning_80_sent: number;
  limit_warning_100_sent: number;
  inactive_reminder_sent: number;
  testimonial_requested: number;
}

interface TriggerResult {
  triggered: boolean;
  data: Record<string, unknown>;
}

interface OutreachResult {
  campaign_id: string;
  user_id: string;
  success: boolean;
  reason?: string;
}

// ============================================
// Outreach Engine Class
// ============================================

export class OutreachEngine {
  private db: D1Database;
  private env: Env;

  constructor(db: D1Database, env: Env) {
    this.db = db;
    this.env = env;
  }

  /**
   * Main entry point: run all active campaigns
   * Called by cron job
   */
  async runAllCampaigns(): Promise<{
    processed: number;
    sent: number;
    errors: number;
    results: OutreachResult[];
  }> {
    const campaigns = await this.getActiveCampaigns();
    const results: OutreachResult[] = [];
    let processed = 0;
    let sent = 0;
    let errors = 0;

    for (const campaign of campaigns) {
      const campaignResults = await this.runCampaign(campaign);
      for (const result of campaignResults) {
        results.push(result);
        processed++;
        if (result.success) {
          sent++;
        } else {
          errors++;
        }
      }
    }

    return { processed, sent, errors, results };
  }

  /**
   * Run a single campaign for all eligible users
   */
  async runCampaign(campaign: OutreachCampaign): Promise<OutreachResult[]> {
    const results: OutreachResult[] = [];
    const config = this.parseConfig(campaign.config);

    // Get eligible users based on trigger type
    const users = await this.getEligibleUsers(campaign.trigger_type, config);

    for (const user of users) {
      // Skip users who opted out of feedback emails
      if (user.feedback_opt_out) {
        continue;
      }

      // Check cooldown
      const canSend = await this.checkCooldown(
        user.id,
        campaign.trigger_type,
        config.cooldown_days
      );

      if (!canSend) {
        results.push({
          campaign_id: campaign.id,
          user_id: user.id,
          success: false,
          reason: 'cooldown_active',
        });
        continue;
      }

      // Evaluate trigger
      const triggerResult = await this.evaluateTrigger(
        user,
        campaign.trigger_type,
        config
      );

      if (!triggerResult.triggered) {
        continue;
      }

      // Send email
      try {
        const emailSent = await this.sendOutreachEmail(
          user,
          campaign,
          triggerResult.data
        );

        if (emailSent) {
          // Log successful send
          await this.logOutreach(campaign.id, user.id, campaign.trigger_type, triggerResult.data, true);

          // Set cooldown
          await this.setCooldown(user.id, campaign.trigger_type, config.cooldown_days);

          // Update campaign stats
          await this.incrementCampaignStats(campaign.id, 'emails_sent');

          // Update user flags
          await this.updateUserOutreachFlags(user.id, campaign.trigger_type);

          results.push({
            campaign_id: campaign.id,
            user_id: user.id,
            success: true,
          });
        } else {
          results.push({
            campaign_id: campaign.id,
            user_id: user.id,
            success: false,
            reason: 'email_send_failed',
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await this.logOutreach(campaign.id, user.id, campaign.trigger_type, triggerResult.data, false, errorMessage);

        results.push({
          campaign_id: campaign.id,
          user_id: user.id,
          success: false,
          reason: errorMessage,
        });
      }
    }

    return results;
  }

  // ============================================
  // Trigger Evaluation
  // ============================================

  private async evaluateTrigger(
    user: UserForOutreach,
    triggerType: TriggerType,
    config: CampaignConfig
  ): Promise<TriggerResult> {
    switch (triggerType) {
      case 'limit_80':
        return this.evaluateLimitTrigger(user, 80);

      case 'limit_100':
        return this.evaluateLimitTrigger(user, 100);

      case 'inactive_14d':
        return this.evaluateInactiveTrigger(user, 14, config);

      case 'nps_high':
        return await this.evaluateNpsTrigger(user, config);

      case 'error_pattern':
        return await this.evaluateErrorTrigger(user, config);

      case 'milestone':
        return await this.evaluateMilestoneTrigger(user);

      default:
        return { triggered: false, data: {} };
    }
  }

  private evaluateLimitTrigger(
    user: UserForOutreach,
    percentThreshold: number
  ): TriggerResult {
    const limit = PLAN_LIMITS[user.plan]?.apiCalls ?? PLAN_LIMITS.free.apiCalls;

    // Skip enterprise users (unlimited)
    if (limit === Infinity) {
      return { triggered: false, data: {} };
    }

    const percent = Math.round((user.api_calls_used / limit) * 100);
    const triggered = percent >= percentThreshold;

    // For 80% trigger, also check they haven't already reached 100%
    if (percentThreshold === 80 && percent >= 100) {
      return { triggered: false, data: {} };
    }

    // Check if warning was already sent this cycle
    if (percentThreshold === 80 && user.limit_warning_80_sent) {
      return { triggered: false, data: {} };
    }
    if (percentThreshold === 100 && user.limit_warning_100_sent) {
      return { triggered: false, data: {} };
    }

    return {
      triggered,
      data: {
        used: user.api_calls_used,
        limit,
        percent,
        plan: user.plan,
      },
    };
  }

  private evaluateInactiveTrigger(
    user: UserForOutreach,
    daysThreshold: number,
    config: CampaignConfig
  ): TriggerResult {
    if (!user.last_api_call_at) {
      return { triggered: false, data: {} };
    }

    // Check minimum queries requirement
    if (config.min_total_queries && user.api_calls_used < config.min_total_queries) {
      return { triggered: false, data: {} };
    }

    // Check if already sent inactive reminder
    if (user.inactive_reminder_sent) {
      return { triggered: false, data: {} };
    }

    const lastCall = new Date(user.last_api_call_at);
    const now = new Date();
    const daysSinceLastCall = Math.floor(
      (now.getTime() - lastCall.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      triggered: daysSinceLastCall >= daysThreshold,
      data: {
        daysAgo: daysSinceLastCall,
        lastCallDate: user.last_api_call_at,
      },
    };
  }

  private async evaluateNpsTrigger(
    user: UserForOutreach,
    config: CampaignConfig
  ): Promise<TriggerResult> {
    // Check if testimonial already requested
    if (user.testimonial_requested) {
      return { triggered: false, data: {} };
    }

    // Get latest NPS score for user
    const feedback = await this.db
      .prepare(`
        SELECT nps_score, created_at
        FROM feedback
        WHERE user_id = ? AND nps_score IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      `)
      .bind(user.id)
      .first<{ nps_score: number; created_at: string }>();

    if (!feedback) {
      return { triggered: false, data: {} };
    }

    const minScore = config.min_nps_score ?? 9;
    const minDays = config.min_days_active ?? 30;

    // Check NPS score
    if (feedback.nps_score < minScore) {
      return { triggered: false, data: {} };
    }

    // Check days active (using last_api_call as proxy)
    if (user.last_api_call_at) {
      const firstActivity = new Date(user.last_api_call_at);
      const now = new Date();
      const daysActive = Math.floor(
        (now.getTime() - firstActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysActive < minDays) {
        return { triggered: false, data: {} };
      }
    }

    return {
      triggered: true,
      data: {
        npsScore: feedback.nps_score,
        npsDate: feedback.created_at,
      },
    };
  }

  private async evaluateErrorTrigger(
    user: UserForOutreach,
    config: CampaignConfig
  ): Promise<TriggerResult> {
    const minErrors = config.min_errors_24h ?? 3;

    // Count errors in last 24 hours from api_usage table
    const errors = await this.db
      .prepare(`
        SELECT COUNT(*) as count
        FROM api_usage
        WHERE user_id = ?
          AND response_status >= 400
          AND timestamp > datetime('now', '-24 hours')
      `)
      .bind(user.id)
      .first<{ count: number }>();

    const errorCount = errors?.count ?? 0;

    return {
      triggered: errorCount >= minErrors,
      data: {
        errorCount,
        timeframe: '24h',
      },
    };
  }

  private async evaluateMilestoneTrigger(
    user: UserForOutreach
  ): Promise<TriggerResult> {
    const milestones = [10, 50, 100, 250, 500, 1000];
    const currentQueries = user.api_calls_used;

    // Find if user just crossed a milestone
    for (const milestone of milestones) {
      if (currentQueries === milestone) {
        // Check if we already sent for this milestone
        const alreadySent = await this.db
          .prepare(`
            SELECT id FROM outreach_log
            WHERE user_id = ?
              AND trigger_type = 'milestone'
              AND trigger_data LIKE ?
            LIMIT 1
          `)
          .bind(user.id, `%"milestone":${milestone}%`)
          .first();

        if (!alreadySent) {
          return {
            triggered: true,
            data: {
              milestone,
              totalQueries: currentQueries,
            },
          };
        }
      }
    }

    return { triggered: false, data: {} };
  }

  // ============================================
  // Email Sending
  // ============================================

  private async sendOutreachEmail(
    user: UserForOutreach,
    campaign: OutreachCampaign,
    triggerData: Record<string, unknown>
  ): Promise<boolean> {
    // Get template (either from campaign or default)
    const template = await this.getTemplate(
      campaign.template_id,
      campaign.trigger_type
    );

    if (!template && !campaign.email_template) {
      console.error(`No template found for campaign ${campaign.id}`);
      return false;
    }

    // Prepare template variables
    const variables = this.prepareTemplateVariables(user, triggerData);

    // Render email content
    const subject = this.renderTemplate(
      template?.subject_nl ?? campaign.email_subject ?? 'Bericht van Praat met je Boekhouding',
      variables
    );

    const body = this.renderTemplate(
      template?.body_nl ?? campaign.email_template ?? '',
      variables
    );

    // Wrap in email template
    const html = this.wrapInEmailTemplate(subject, body);

    // Send email
    const sent = await sendEmail(this.env, {
      to: user.email,
      subject,
      html,
      userId: user.id,
      templateName: `outreach_${campaign.trigger_type}`,
    });

    // Update template usage stats
    if (template) {
      await this.db
        .prepare('UPDATE response_templates SET times_used = times_used + 1 WHERE id = ?')
        .bind(template.id)
        .run();
    }

    return sent;
  }

  private prepareTemplateVariables(
    user: UserForOutreach,
    triggerData: Record<string, unknown>
  ): Record<string, string> {
    const limit = PLAN_LIMITS[user.plan]?.apiCalls ?? PLAN_LIMITS.free.apiCalls;
    const percent = limit === Infinity ? 0 : Math.round((user.api_calls_used / limit) * 100);

    // Calculate reset date (1st of next month)
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const resetDateStr = resetDate.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
    });

    const baseUrl = 'https://praatmetjeboekhouding.nl';

    return {
      userName: escapeHtml(user.name || ''),
      userEmail: escapeHtml(user.email),
      plan: user.plan,
      used: String(user.api_calls_used),
      limit: limit === Infinity ? 'onbeperkt' : String(limit),
      percent: String(percent),
      resetDate: resetDateStr,

      // URLs
      upgradeUrl: `${baseUrl}/pricing`,
      dashboardUrl: `${baseUrl}/dashboard`,
      docsUrl: `${baseUrl}/docs`,
      reconnectUrl: `${baseUrl}/connect`,
      testimonialUrl: `${baseUrl}/feedback/testimonial`,

      // Trigger-specific data (stringify numbers/objects)
      ...Object.fromEntries(
        Object.entries(triggerData).map(([key, value]) => [
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value),
        ])
      ),
    };
  }

  private renderTemplate(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  private wrapInEmailTemplate(title: string, content: string): string {
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

  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
    ${content}
  </div>

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
    <p>
      <a href="https://praatmetjeboekhouding.nl/docs" style="color: #0066FF;">Documentatie</a> ·
      <a href="https://praatmetjeboekhouding.nl/dashboard" style="color: #0066FF;">Dashboard</a> ·
      <a href="mailto:support@praatmetjeboekhouding.nl" style="color: #0066FF;">Support</a>
    </p>
    <p>&copy; ${new Date().getFullYear()} Chef Data B.V.</p>
  </div>

</body>
</html>
    `.trim();
  }

  // ============================================
  // Cooldown Management (Anti-Spam)
  // ============================================

  /**
   * Check if a user is in cooldown period for a campaign type
   * CRITICAL: This prevents spam
   */
  private async checkCooldown(
    userId: string,
    campaignType: string,
    cooldownDays: number
  ): Promise<boolean> {
    const cooldown = await this.db
      .prepare(`
        SELECT next_allowed_at
        FROM outreach_cooldowns
        WHERE user_id = ? AND campaign_type = ?
      `)
      .bind(userId, campaignType)
      .first<{ next_allowed_at: string }>();

    if (!cooldown) {
      return true; // No cooldown set, can send
    }

    const nextAllowed = new Date(cooldown.next_allowed_at);
    return new Date() >= nextAllowed;
  }

  /**
   * Set cooldown after sending an email
   */
  private async setCooldown(
    userId: string,
    campaignType: string,
    cooldownDays: number
  ): Promise<void> {
    const now = new Date();
    const nextAllowed = new Date(
      now.getTime() + cooldownDays * 24 * 60 * 60 * 1000
    );

    await this.db
      .prepare(`
        INSERT INTO outreach_cooldowns (user_id, campaign_type, last_sent_at, next_allowed_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, campaign_type) DO UPDATE SET
          last_sent_at = excluded.last_sent_at,
          next_allowed_at = excluded.next_allowed_at
      `)
      .bind(
        userId,
        campaignType,
        now.toISOString(),
        nextAllowed.toISOString()
      )
      .run();
  }

  // ============================================
  // Database Helpers
  // ============================================

  async getActiveCampaigns(): Promise<OutreachCampaign[]> {
    const result = await this.db
      .prepare(
        'SELECT * FROM outreach_campaigns WHERE is_active = 1 ORDER BY priority DESC'
      )
      .all<OutreachCampaign>();
    return result.results || [];
  }

  async getCampaign(id: string): Promise<OutreachCampaign | null> {
    return await this.db
      .prepare('SELECT * FROM outreach_campaigns WHERE id = ?')
      .bind(id)
      .first<OutreachCampaign>();
  }

  async getAllCampaigns(): Promise<OutreachCampaign[]> {
    const result = await this.db
      .prepare('SELECT * FROM outreach_campaigns ORDER BY priority DESC')
      .all<OutreachCampaign>();
    return result.results || [];
  }

  async updateCampaign(
    id: string,
    updates: Partial<OutreachCampaign>
  ): Promise<void> {
    const allowedFields = [
      'name', 'description', 'is_active', 'priority', 'config',
      'email_subject', 'email_template', 'template_id'
    ];

    const setClauses: string[] = ['updated_at = datetime(\'now\')'];
    const params: unknown[] = [];

    for (const field of allowedFields) {
      if (field in updates) {
        setClauses.push(`${field} = ?`);
        params.push((updates as Record<string, unknown>)[field]);
      }
    }

    params.push(id);

    await this.db
      .prepare(`UPDATE outreach_campaigns SET ${setClauses.join(', ')} WHERE id = ?`)
      .bind(...params)
      .run();
  }

  async toggleCampaign(id: string, isActive: boolean): Promise<void> {
    await this.db
      .prepare('UPDATE outreach_campaigns SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(isActive ? 1 : 0, id)
      .run();
  }

  private async getEligibleUsers(
    triggerType: TriggerType,
    config: CampaignConfig
  ): Promise<UserForOutreach[]> {
    // Base query for users who haven't opted out
    let query = `
      SELECT
        id, email, name, plan, api_calls_used, last_api_call_at,
        COALESCE(feedback_opt_out, 0) as feedback_opt_out,
        COALESCE(limit_warning_80_sent, 0) as limit_warning_80_sent,
        COALESCE(limit_warning_100_sent, 0) as limit_warning_100_sent,
        COALESCE(inactive_reminder_sent, 0) as inactive_reminder_sent,
        COALESCE(testimonial_requested, 0) as testimonial_requested
      FROM users
      WHERE COALESCE(feedback_opt_out, 0) = 0
    `;

    // Add trigger-specific filters
    switch (triggerType) {
      case 'limit_80':
        // Users approaching limit who haven't been warned
        query += ' AND COALESCE(limit_warning_80_sent, 0) = 0';
        break;

      case 'limit_100':
        // Users at limit who haven't been notified
        query += ' AND COALESCE(limit_warning_100_sent, 0) = 0';
        break;

      case 'inactive_14d':
        // Users with some activity but inactive for 14+ days
        query += ` AND last_api_call_at IS NOT NULL
                   AND last_api_call_at < datetime('now', '-14 days')
                   AND COALESCE(inactive_reminder_sent, 0) = 0`;
        if (config.min_total_queries) {
          query += ` AND api_calls_used >= ${config.min_total_queries}`;
        }
        break;

      case 'nps_high':
        // Users who haven't been asked for testimonial
        query += ' AND COALESCE(testimonial_requested, 0) = 0';
        break;

      case 'error_pattern':
        // All users (we'll check errors in trigger evaluation)
        break;
    }

    query += ' ORDER BY api_calls_used DESC LIMIT 100'; // Process in batches

    const result = await this.db
      .prepare(query)
      .all<UserForOutreach>();

    return result.results || [];
  }

  private async getTemplate(
    templateId: string | null,
    triggerType: string
  ): Promise<ResponseTemplate | null> {
    if (templateId) {
      const template = await this.db
        .prepare('SELECT * FROM response_templates WHERE id = ? AND is_active = 1')
        .bind(templateId)
        .first<ResponseTemplate>();
      if (template) return template;
    }

    // Fall back to default template for trigger type
    return await this.db
      .prepare('SELECT * FROM response_templates WHERE trigger_type = ? AND is_default = 1 AND is_active = 1')
      .bind(triggerType)
      .first<ResponseTemplate>();
  }

  private async logOutreach(
    campaignId: string,
    userId: string,
    triggerType: string,
    triggerData: Record<string, unknown>,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const id = this.generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(`
        INSERT INTO outreach_log (
          id, campaign_id, user_id, trigger_type, trigger_data,
          email_sent, email_sent_at, created_at, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        campaignId,
        userId,
        triggerType,
        JSON.stringify(triggerData),
        success ? 1 : 0,
        success ? now : null,
        now,
        errorMessage || null
      )
      .run();
  }

  private async incrementCampaignStats(
    campaignId: string,
    field: 'emails_sent' | 'emails_opened' | 'emails_clicked' | 'conversions'
  ): Promise<void> {
    await this.db
      .prepare(`UPDATE outreach_campaigns SET ${field} = ${field} + 1 WHERE id = ?`)
      .bind(campaignId)
      .run();
  }

  private async updateUserOutreachFlags(
    userId: string,
    triggerType: TriggerType
  ): Promise<void> {
    let field: string | null = null;

    switch (triggerType) {
      case 'limit_80':
        field = 'limit_warning_80_sent';
        break;
      case 'limit_100':
        field = 'limit_warning_100_sent';
        break;
      case 'inactive_14d':
        field = 'inactive_reminder_sent';
        break;
      case 'nps_high':
        field = 'testimonial_requested';
        break;
    }

    if (field) {
      await this.db
        .prepare(`UPDATE users SET ${field} = 1 WHERE id = ?`)
        .bind(userId)
        .run();
    }
  }

  private parseConfig(configJson: string | null): CampaignConfig {
    if (!configJson) {
      return { cooldown_days: 7 }; // Default cooldown
    }
    try {
      return JSON.parse(configJson);
    } catch {
      return { cooldown_days: 7 };
    }
  }

  private generateId(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ============================================
  // Statistics & Reporting
  // ============================================

  async getStats(): Promise<{
    activeCampaigns: number;
    emailsSentToday: number;
    emailsSentWeek: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }> {
    const [
      activeCampaigns,
      sentToday,
      sentWeek,
      totals
    ] = await Promise.all([
      this.db
        .prepare('SELECT COUNT(*) as count FROM outreach_campaigns WHERE is_active = 1')
        .first<{ count: number }>(),
      this.db
        .prepare("SELECT COUNT(*) as count FROM outreach_log WHERE email_sent = 1 AND created_at > datetime('now', '-1 day')")
        .first<{ count: number }>(),
      this.db
        .prepare("SELECT COUNT(*) as count FROM outreach_log WHERE email_sent = 1 AND created_at > datetime('now', '-7 days')")
        .first<{ count: number }>(),
      this.db
        .prepare(`
          SELECT
            SUM(emails_sent) as sent,
            SUM(emails_opened) as opened,
            SUM(emails_clicked) as clicked,
            SUM(conversions) as conversions
          FROM outreach_campaigns
        `)
        .first<{ sent: number; opened: number; clicked: number; conversions: number }>()
    ]);

    const totalSent = totals?.sent || 0;
    const totalOpened = totals?.opened || 0;
    const totalClicked = totals?.clicked || 0;
    const totalConversions = totals?.conversions || 0;

    return {
      activeCampaigns: activeCampaigns?.count || 0,
      emailsSentToday: sentToday?.count || 0,
      emailsSentWeek: sentWeek?.count || 0,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      conversionRate: totalSent > 0 ? (totalConversions / totalSent) * 100 : 0,
    };
  }

  async getRecentLogs(limit: number = 50): Promise<OutreachLogWithUser[]> {
    const result = await this.db
      .prepare(`
        SELECT
          ol.*,
          u.email as user_email,
          u.name as user_name,
          oc.name as campaign_name
        FROM outreach_log ol
        LEFT JOIN users u ON ol.user_id = u.id
        LEFT JOIN outreach_campaigns oc ON ol.campaign_id = oc.id
        ORDER BY ol.created_at DESC
        LIMIT ?
      `)
      .bind(limit)
      .all<OutreachLogWithUser>();

    return result.results || [];
  }

  async getCampaignLogs(
    campaignId: string,
    limit: number = 50
  ): Promise<OutreachLogWithUser[]> {
    const result = await this.db
      .prepare(`
        SELECT
          ol.*,
          u.email as user_email,
          u.name as user_name,
          oc.name as campaign_name
        FROM outreach_log ol
        LEFT JOIN users u ON ol.user_id = u.id
        LEFT JOIN outreach_campaigns oc ON ol.campaign_id = oc.id
        WHERE ol.campaign_id = ?
        ORDER BY ol.created_at DESC
        LIMIT ?
      `)
      .bind(campaignId, limit)
      .all<OutreachLogWithUser>();

    return result.results || [];
  }

  // ============================================
  // Reset Functions (for monthly cycle)
  // ============================================

  /**
   * Reset limit warning flags for all users
   * Should be called at the start of each month
   */
  async resetMonthlyFlags(): Promise<number> {
    const result = await this.db
      .prepare(`
        UPDATE users
        SET limit_warning_80_sent = 0,
            limit_warning_100_sent = 0,
            inactive_reminder_sent = 0
      `)
      .run();

    return result.meta.changes;
  }
}

// ============================================
// Export singleton factory
// ============================================

export function createOutreachEngine(db: D1Database, env: Env): OutreachEngine {
  return new OutreachEngine(db, env);
}
