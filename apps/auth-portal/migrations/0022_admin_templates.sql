-- Migration: Admin Response Templates
-- Renamed from 0019_response_templates.sql to avoid conflict
-- Original: AIOPS-001: Response Templates
-- Pre-defined response templates for admin replies to customers
-- Supports variable substitution and categorization
-- NOTE: Table renamed to admin_response_templates to avoid conflict with
--       response_templates in 0019_outreach_system.sql (proactive email templates)

CREATE TABLE IF NOT EXISTS admin_response_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'question', 'proactive', 'general')),
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  variables TEXT, -- JSON array of variable names, e.g. ["customer_name", "issue_details"]
  is_active INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_templates_category ON admin_response_templates(category);
CREATE INDEX IF NOT EXISTS idx_admin_templates_active ON admin_response_templates(is_active);

-- Seed some default templates
INSERT INTO admin_response_templates (id, name, category, subject_template, body_template, variables, is_active)
VALUES
  (
    'tpl_welcome',
    'Welkom bericht',
    'general',
    'Welkom bij Praat met je Boekhouding!',
    'Beste {{customer_name}},

Welkom bij Praat met je Boekhouding! We zijn blij dat je ons hebt gekozen voor je boekhoudintegratie.

Je kunt direct aan de slag via je dashboard. Mocht je vragen hebben, dan staan we altijd voor je klaar.

Met vriendelijke groet,
Het PMJB Team',
    '["customer_name"]',
    1
  ),
  (
    'tpl_bug_acknowledged',
    'Bug Ontvangen',
    'bug',
    'Re: Bug rapport ontvangen - {{issue_title}}',
    'Beste {{customer_name}},

Bedankt voor je melding over {{issue_title}}. We hebben je rapport ontvangen en onderzoeken het probleem.

We houden je op de hoogte van de voortgang.

Met vriendelijke groet,
Het PMJB Team',
    '["customer_name", "issue_title"]',
    1
  ),
  (
    'tpl_bug_resolved',
    'Bug Opgelost',
    'bug',
    'Re: Probleem opgelost - {{issue_title}}',
    'Beste {{customer_name}},

Goed nieuws! Het probleem met {{issue_title}} is opgelost.

{{resolution_details}}

Bedankt voor je geduld. Als je nog vragen hebt, laat het ons weten.

Met vriendelijke groet,
Het PMJB Team',
    '["customer_name", "issue_title", "resolution_details"]',
    1
  ),
  (
    'tpl_feature_request',
    'Feature Request Ontvangen',
    'feature',
    'Re: Feature verzoek ontvangen',
    'Beste {{customer_name}},

Bedankt voor je suggestie! We waarderen je input zeer.

We hebben je verzoek toegevoegd aan onze roadmap en zullen het evalueren voor toekomstige releases.

Met vriendelijke groet,
Het PMJB Team',
    '["customer_name"]',
    1
  ),
  (
    'tpl_question_general',
    'Algemene Vraag Beantwoord',
    'question',
    'Re: Antwoord op je vraag',
    'Beste {{customer_name}},

Bedankt voor je vraag. Hier is het antwoord:

{{answer}}

Mocht je nog vragen hebben, aarzel niet om contact op te nemen.

Met vriendelijke groet,
Het PMJB Team',
    '["customer_name", "answer"]',
    1
  ),
  (
    'tpl_proactive_usage',
    'Proactief: Lage Activiteit',
    'proactive',
    'Kunnen we je helpen met Praat met je Boekhouding?',
    'Beste {{customer_name}},

We merkten op dat je de afgelopen tijd niet veel gebruik hebt gemaakt van de integratie. We willen graag helpen!

Heb je vragen of loop je ergens tegenaan? We staan klaar om je te ondersteunen.

Met vriendelijke groet,
Het PMJB Team',
    '["customer_name"]',
    1
  );
