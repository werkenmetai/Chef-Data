# AI-First Customer Operations Strategy

> **Versie:** 1.0 | Januari 2026
> **Status:** Goedgekeurd door Matthijs (CEO)
> **Kernvraag:** Hoe bouwen we support die voelt als magie - voor klanten én voor ons?

---

## Executive Summary

Met een ruime gratis tier en focus op klanttevredenheid, moet onze support:
1. **Schaalbaar** zijn zonder extra mensen
2. **Snel** reageren (minuten, niet uren)
3. **Consistent** in kwaliteit
4. **Proactief** problemen voorkomen

De oplossing: **AI-First Operations** - AI doet het zware werk, mensen keuren goed.

---

## Het 3-Laags Model

### Laag 1: Volledig Geautomatiseerd (0 menselijke tijd)

| Trigger | Actie | Template |
|---------|-------|----------|
| FAQ vraag herkend | Auto-antwoord uit KB | `auto_faq_response` |
| Bug gefixt (user meldde) | Notificatie sturen | `bug_fixed_notification` |
| Milestone bereikt (10/50/100 vragen) | Felicitatie | `milestone_celebration` |
| 80% limiet bereikt | Soft upgrade nudge | `limit_warning_80` |
| 100% limiet bereikt | Upgrade prompt | `limit_reached_100` |
| Inactief 14 dagen | Check-in email | `inactive_checkin` |
| Actief 30 dagen + NPS 9-10 | Quote request | `quote_request` |

### Laag 2: AI-Assisted (Mens keurt goed)

| Situatie | AI doet | Mens doet |
|----------|---------|-----------|
| Support vraag | Draft response + toon context | [Goedkeuren] of [Aanpassen] |
| Bug report | Categoriseer + prioriteer + draft | Bevestig prioriteit |
| Feature request | Check duplicaten, draft reply | Besluit roadmap plaatsing |
| Negatieve feedback | Alert + concept-reactie | Persoonlijk opvolgen |
| Complexe vraag | Zoek relevante KB artikelen | Kies beste antwoord |

### Laag 3: Volledig Menselijk (Escalatie)

- Enterprise onderhandelingen
- Security incidenten
- Boze klanten (sentiment score < 3)
- Juridische vragen
- Billing disputes

---

## Smart Inbox Design

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📥 Inbox (3 actie nodig)                    [Alles] [Open] [Urgent] │
├─────────────────────────────────────────────────────────────────────┤
│ 🔴 URGENT  jan@mkb.nl                                    5 min      │
│ "API geeft constant 500 errors, klanten kunnen niet inloggen"       │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI: Dit lijkt op incident INC-042 (opgelost 2u geleden).     │ │
│ │    Context: Pro klant, 1,234 calls deze maand, 8 maanden actief │ │
│ │    Suggestie: Stuur fix-bevestiging                             │ │
│ │    [📤 Verstuur Draft] [✏️ Aanpassen] [👤 Zelf Schrijven]       │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ 🟡 NORMAAL  lisa@accountant.nl                           2 uur      │
│ "Kunnen jullie ook Twinfield ondersteunen?"                         │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI: Feature request. 4 anderen vroegen dit ook deze maand.   │ │
│ │    Context: Pro klant, zeer actief (2,100 calls)                │ │
│ │    Suggestie: Standaard "op roadmap" response                   │ │
│ │    [📤 Verstuur Draft] [✏️ Aanpassen]                           │ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ ✅ AUTO    piet@zzp.nl                                   30 min     │
│ "Hoe exporteer ik naar Excel?"                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🤖 AI: FAQ match (98% confidence). Auto-reply verzonden.        │ │
│ │    [👁️ Bekijk Antwoord] [↩️ Ongedaan Maken]                     │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## AI Response Drafting

### Hoe het werkt

```
1. Bericht binnenkomt
       ↓
2. AI analyseert (< 2 sec):
   - Intent classificatie
   - Sentiment detectie
   - Priority scoring
   - Relevante context ophalen
       ↓
3. AI genereert draft:
   - Personalized greeting
   - Relevant antwoord
   - Juiste tone of voice
   - Relevante links
       ↓
4. Admin ziet:
   ┌──────────────────────────────────────┐
   │ AI Draft (confidence: 94%)           │
   │                                      │
   │ "Hi Jan,                             │
   │                                      │
   │ Bedankt voor je melding! We hebben   │
   │ dit probleem 2 uur geleden opgelost. │
   │ Kun je het opnieuw proberen?         │
   │                                      │
   │ Groet, Team PMJB"                    │
   │                                      │
   │ [📤 Versturen] [✏️ Edit] [🗑️ Verwerp]│
   └──────────────────────────────────────┘
       ↓
5. Admin klikt [Versturen] of past aan
       ↓
6. Feedback loop: Was edit nodig? → Train model
```

### Confidence Thresholds

| Confidence | Actie |
|------------|-------|
| > 95% | Auto-verzenden (FAQ) |
| 80-95% | Draft tonen, 1-click approve |
| 60-80% | Draft tonen, review aanbevolen |
| < 60% | Geen draft, handmatig schrijven |

---

## Response Templates (Dynamisch)

### Template Structuur

```typescript
interface ResponseTemplate {
  id: string;
  name: string;
  category: 'bug' | 'feature' | 'question' | 'feedback' | 'proactive';
  subject: string;  // Supports {{variables}}
  body: string;     // Supports {{variables}} and {{#if}} blocks
  variables: {
    user: { name, email, plan, daysActive, totalCalls };
    context: { issueType, relatedIncident, kbArticle };
  };
}
```

### Voorbeeld: Bug Bevestiging

```handlebars
Subject: Re: {{original_subject}}

Hi {{user.name || 'daar'}},

Bedankt voor je melding over {{context.issueType || 'dit probleem'}}.

{{#if context.knownIssue}}
Goed nieuws: we hebben dit {{context.timeSinceFix}} opgelost!
Kun je het opnieuw proberen? Het zou nu moeten werken.
{{else}}
We zijn ermee bezig en houden je op de hoogte.
{{#if user.plan === 'pro'}}
Als Pro klant krijg je binnen 4 uur een update.
{{/if}}
{{/if}}

{{#if context.kbArticle}}
Mogelijk handig: {{context.kbArticle.title}}
{{context.kbArticle.url}}
{{/if}}

Groet,
{{sender.name}}
Praat met je Boekhouding
```

### Standaard Templates

| ID | Naam | Categorie | Auto-trigger |
|----|------|-----------|--------------|
| `bug_received` | Bug Ontvangen | bug | Op bug report |
| `bug_investigating` | Bug In Onderzoek | bug | Na 2u geen fix |
| `bug_fixed` | Bug Opgelost | bug | Na deployment |
| `feature_noted` | Feature Genoteerd | feature | Op feature request |
| `feature_shipped` | Feature Live | feature | Na deployment |
| `question_answered` | Vraag Beantwoord | question | Na KB match |
| `welcome_new` | Welkom | proactive | Na eerste login |
| `milestone_10` | 10 Vragen | proactive | Bij 10 vragen |
| `milestone_50` | 50 Vragen | proactive | Bij 50 vragen |
| `limit_warning` | Limiet Waarschuwing | proactive | Bij 80% |
| `quote_request` | Quote Verzoek | proactive | Na 30d actief + NPS 9-10 |
| `inactive_checkin` | Inactief Check-in | proactive | Na 14d inactief |

---

## Proactive Outreach Engine

### Trigger Configuratie

```yaml
triggers:
  limit_warning_80:
    condition: "api_usage >= plan_limit * 0.8"
    cooldown: "7 days"
    template: "limit_warning"
    channel: "email"

  error_pattern_alert:
    condition: "error_count >= 3 AND timeframe <= 24h"
    cooldown: "48 hours"
    template: "error_assistance"
    channel: "email + in_app"

  inactive_checkin:
    condition: "last_api_call > 14 days"
    cooldown: "30 days"
    template: "inactive_checkin"
    channel: "email"

  happy_customer_quote:
    condition: "nps_score >= 9 AND days_active >= 30"
    cooldown: "90 days"
    template: "quote_request"
    channel: "email"

  milestone_celebration:
    condition: "total_questions IN [10, 50, 100, 500]"
    cooldown: "none"
    template: "milestone_{{count}}"
    channel: "in_app"
```

### Proactive Campaign Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Automated Campaigns (Actief)                                │
├─────────────────────────────────────────────────────────────┤
│ ✅ Limiet Warning (80%)                     Actief sinds W2 │
│    Sent: 47 | Opened: 32 (68%) | Upgraded: 8 (17%)         │
├─────────────────────────────────────────────────────────────┤
│ ✅ Error Pattern Alert                      Actief sinds W4 │
│    Sent: 12 | Opened: 9 (75%) | Replied: 5 (42%)           │
├─────────────────────────────────────────────────────────────┤
│ ✅ Inactief Check-in (14d)                  Actief sinds W3 │
│    Sent: 23 | Opened: 14 (61%) | Returned: 6 (26%)         │
├─────────────────────────────────────────────────────────────┤
│ ✅ Quote Request (NPS 9-10)                 Actief sinds W5 │
│    Sent: 8 | Opened: 6 (75%) | Quote received: 3 (38%)     │
└─────────────────────────────────────────────────────────────┘
```

---

## Conversation Threading

### Chat-Style View

```
┌─────────────────────────────────────────────────────────────┐
│ 💬 jan@mkb.nl - "API key problemen"           [Opgelost ✅] │
│ Started: 2 dagen geleden | 4 berichten | SLA: ✅ binnen 1h  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📨 Jan (2 dagen geleden, 14:32)                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Mijn API key geeft een 401 error. Ik heb hem net       │ │
│ │ aangemaakt dus hij zou moeten werken?                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                              📤 Matthijs (2 dagen, 14:58)   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Hi Jan, kun je checken of je key begint met 'exa_'?    │ │
│ │ En welke regio gebruik je (NL/BE)?                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📨 Jan (1 dag geleden, 09:15)                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Ah! Ik gebruikte de verkeerde regio. Nu werkt het.     │ │
│ │ Bedankt voor de snelle help!                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                              📤 Matthijs (1 dag, 09:22)     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Top! Fijn dat het werkt. Succes met je implementatie.  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [💬 Reageren] [🏷️ Tags: resolved, api-key]                  │
└─────────────────────────────────────────────────────────────┘
```

### Thread Grouping Logic

```sql
-- Group messages into conversations
-- Same user + related subject + within 7 days = same thread
SELECT
  c.*,
  COUNT(m.id) as message_count,
  MAX(m.created_at) as last_activity
FROM conversations c
JOIN messages m ON m.conversation_id = c.id
WHERE c.user_id = ?
GROUP BY c.id
ORDER BY last_activity DESC
```

---

## SLA Tracking & Metrics

### Response Time Targets

| Priority | First Response | Resolution | Escalation |
|----------|---------------|------------|------------|
| 🔴 P1 Critical | < 1 uur | < 4 uur | Na 2 uur |
| 🟡 P2 Normal | < 4 uur | < 24 uur | Na 8 uur |
| 🟢 P3 Low | < 24 uur | < 72 uur | Na 48 uur |

### Priority Auto-Assignment

```typescript
function calculatePriority(message: Message, user: User): Priority {
  let score = 0;

  // Plan-based priority
  if (user.plan === 'enterprise') score += 30;
  if (user.plan === 'pro') score += 20;

  // Sentiment
  if (message.sentiment < 0.3) score += 25;  // Angry

  // Keywords
  if (containsUrgentKeywords(message)) score += 20;
  if (containsSecurityKeywords(message)) score += 40;

  // User history
  if (user.isHighValue) score += 15;
  if (user.hadRecentIssues) score += 10;

  // Return priority
  if (score >= 50) return 'P1';
  if (score >= 25) return 'P2';
  return 'P3';
}
```

### Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Support Metrics (Week 6)                   [↓ Export]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Response Times                          Target    Actual    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ 🔴 P1 (Critical)                        < 1h      42m ✅    │
│ 🟡 P2 (Normal)                          < 4h      2.8h ✅   │
│ 🟢 P3 (Low)                             < 24h     8h ✅     │
│                                                             │
│ Efficiency                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ AI Auto-Resolved                        40%       47% ✅    │
│ AI Draft Approved (no edit)             60%       72% ✅    │
│ Avg Handle Time                         < 5m      3.2m ✅   │
│ First Contact Resolution                70%       78% ✅    │
│                                                             │
│ Satisfaction                                                │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ CSAT Score                              > 90%     94% ✅    │
│ NPS Score                               > 40      52 ✅     │
│ Quote Conversion                        > 30%     38% ✅    │
│                                                             │
│ Volume                                                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ Total Conversations                     -         47        │
│ Avg per Day                             -         6.7       │
│ Busiest Day                             -         Maandag   │
│ Busiest Hour                            -         10:00     │
└─────────────────────────────────────────────────────────────┘
```

---

## Keyboard Shortcuts (Admin UX)

| Shortcut | Actie |
|----------|-------|
| `j` / `k` | Volgende / vorige bericht |
| `e` | Open reply editor |
| `a` | Approve AI draft (versturen) |
| `d` | Discard / verwerp |
| `s` | Star / markeer belangrijk |
| `m` | Mute / snooze |
| `t` | Add tag |
| `?` | Toon shortcuts |
| `g i` | Ga naar inbox |
| `g c` | Ga naar customer view |

---

## Implementatie Roadmap

### Week 5: Foundation ✅ COMPLETE (31 jan 2026)
- [x] Response templates database schema (`response_templates` table)
- [x] Template CRUD API endpoints
- [x] Template selector in reply modal (customer timeline)
- [x] Conversation grouping logic (`related_id` threading)
- [x] Unified communications table (`communication_events`)
- [x] Customer Timeline view (`/admin/customer/[id]`)
- [x] Admin Communications Widget (dashboard)
- [x] Customer "Mijn Berichten" section
- [x] Customer reply functionality
- [x] Full message history page (`/berichten`)
- [x] Proactive Outreach Engine (campaigns, triggers, cooldowns)
- [x] Feature flags system
- [x] Google-style app launcher in admin header

### Week 7: Templates & Threading
- [x] ~~Response templates database schema~~ ✅
- [x] ~~Template CRUD API endpoints~~ ✅
- [x] ~~Template selector in reply modal~~ ✅
- [x] ~~Conversation grouping logic~~ ✅
- [ ] Chat-style thread view (visual enhancement)

### Week 8: AI Integration
- [ ] Claude API integration voor drafting
- [ ] Intent classification model
- [ ] Sentiment analysis
- [ ] [Approve] / [Edit] workflow
- [ ] Confidence scoring

### Week 9: Proactive Automation
- [x] ~~Trigger engine voor campaigns~~ ✅
- [x] ~~Campaign dashboard~~ ✅
- [ ] Email queue met scheduling
- [ ] A/B testing framework
- [x] ~~Cooldown logic~~ ✅

### Week 10: Smart Inbox & Polish
- [ ] Priority auto-assignment
- [ ] Smart inbox sorting
- [ ] Keyboard shortcuts
- [ ] SLA tracking dashboard
- [ ] Mobile-responsive design

---

## Technische Architectuur

```
┌─────────────────────────────────────────────────────────────┐
│                    INCOMING MESSAGE                         │
│              (email / support / feedback)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 AI PROCESSING PIPELINE                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Intent   │→│ Sentiment│→│ Priority │→│ Draft    │    │
│  │ Classify │  │ Analyze  │  │ Score    │  │ Generate │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │  AUTO   │   │ DRAFT   │   │ ESCALATE│
        │ RESPOND │   │ + QUEUE │   │ TO HUMAN│
        │ (>95%)  │   │ (60-95%)│   │ (<60%)  │
        └─────────┘   └─────────┘   └─────────┘
              │             │             │
              └─────────────┼─────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 COMMUNICATION_EVENTS                        │
│  - Full audit trail                                         │
│  - Customer timeline                                        │
│  - Analytics & reporting                                    │
│  - Training data for AI                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

| Metric | Current | Target W10 | Target Q2 |
|--------|---------|------------|-----------|
| Avg Response Time | Manual | < 4h | < 1h |
| AI Auto-Resolution | 0% | 30% | 50% |
| AI Draft Approval Rate | N/A | 60% | 80% |
| CSAT Score | Unknown | > 85% | > 90% |
| NPS Score | Unknown | > 30 | > 50 |
| Conversations/Day/Person | ~5 | ~15 | ~30 |

---

## Eigenaarschap

| Component | Owner | Backup |
|-----------|-------|--------|
| Templates & Threading | Lars | Daan |
| AI Integration | Daan | Lars |
| Proactive Campaigns | Sophie | Emma |
| SLA Dashboard | Tim | Daan |
| UX & Shortcuts | Lars | - |
| Content & Tone | Lisa | Sophie |

---

*Laatst bijgewerkt: 31 januari 2026 door Piet (CEO) & Matthijs (CSO)*
