# Feedback & Testimonial Collectie Systeem

> Versie 1.0 | Januari 2026

## Overzicht

Een gestructureerd systeem om feedback te verzamelen en testimonials te genereren voor social proof op de website.

---

## Triggers & Timing

### 1. Welkomstmail (Direct na registratie)
- **Wanneer:** Direct na eerste succesvolle Exact Online koppeling
- **Doel:** Verwachtingen zetten, support aanbieden
- **Geen feedback vraag** - te vroeg

### 2. Check-in Email (Dag 7)
- **Wanneer:** 7 dagen na eerste succesvolle API call
- **Voorwaarde:** Minimaal 5 queries uitgevoerd
- **Doel:** Eerste indruk ophalen, problemen identificeren
- **Feedback type:** NPS + open vraag

### 3. In-App Feedback Widget (Na 25 queries)
- **Wanneer:** Na 25e succesvolle query
- **Voorwaarde:** Nog geen feedback gegeven
- **Doel:** Positieve ervaring vangen op het juiste moment
- **Feedback type:** Thumbs up/down + optionele quote

### 4. Testimonial Request (Dag 30)
- **Wanneer:** 30 dagen na registratie
- **Voorwaarde:** NPS score ≥ 8 OF positieve in-app feedback
- **Doel:** Testimonial voor website
- **Feedback type:** Quote + toestemming

### 5. Churn Prevention (Dag 14 inactief)
- **Wanneer:** 14 dagen geen activiteit na eerder actief gebruik
- **Doel:** Re-engagement, problemen identificeren
- **Feedback type:** Waarom gestopt?

---

## Email Templates

### Template 1: Check-in (Dag 7)

```
Onderwerp: Hoe bevalt [PROJECT_NAAM]?

Hoi {{voornaam}},

Je gebruikt [PROJECT_NAAM] nu een week. We zijn benieuwd hoe het gaat!

**Eén snelle vraag:** Hoe waarschijnlijk is het dat je ons aanraadt aan een collega?

[1] [2] [3] [4] [5] [6] [7] [8] [9] [10]
Zeer onwaarschijnlijk              Zeer waarschijnlijk

{{nps_buttons}}

Heb je tips of loopt je ergens tegenaan? Reply gewoon op deze mail - we lezen alles.

Groet,
Matthijs
[PROJECT_NAAM]

P.S. Je hebt tot nu toe {{query_count}} vragen gesteld. {{top_query_type}} was je meest gestelde vraag.
```

### Template 2: Testimonial Request (Dag 30, voor promoters)

```
Onderwerp: Mogen we je ervaring delen?

Hoi {{voornaam}},

Fijn om te horen dat je positief bent over [PROJECT_NAAM]!

We zijn een jong product en jouw ervaring kan andere ondernemers helpen om de stap te zetten. Mogen we een korte quote van je delen op onze website?

**Hoe het werkt:**
1. Schrijf in 1-2 zinnen wat je het meest waardeert
2. Geef aan hoe we je mogen noemen (naam + functie + bedrijf, of anoniem)
3. Wij sturen een preview voordat het live gaat

{{testimonial_form_button}}

Als dank krijg je volgende maand 50% korting op je Pro abonnement.

Alvast bedankt!

Matthijs
```

### Template 3: Churn Prevention (14 dagen inactief)

```
Onderwerp: We missen je vragen 📊

Hoi {{voornaam}},

Het is even stil geweest. Alles goed?

We zagen dat je {{days_inactive}} dagen geleden voor het laatst een vraag stelde. Misschien:

• **Technisch probleem?** → Reply en we helpen direct
• **Weet je niet wat je kunt vragen?** → Bekijk onze use cases: {{use_cases_link}}
• **Geen tijd gehad?** → Snap ik, we staan klaar als je terugkomt

Of misschien past het gewoon niet bij hoe jij werkt - ook goed om te weten.

Wat houdt je tegen?

{{feedback_buttons}}
[ ] Technische problemen
[ ] Weet niet goed hoe te gebruiken
[ ] Niet nuttig genoeg
[ ] Te duur
[ ] Anders: ___

Groet,
Matthijs
```

### Template 4: Positieve Feedback Follow-up

```
Onderwerp: Bedankt! 🙌

Hoi {{voornaam}},

Dankjewel voor je positieve feedback! Dat motiveert enorm.

Mag ik je twee dingen vragen?

1. **Deel je ervaring** - Een review op {{platform}} helpt andere ondernemers ons te vinden
   {{review_link}}

2. **Ken je iemand** die hier ook wat aan heeft? Stuur ze gerust door - ze krijgen de eerste maand gratis met code VRIEND2026.

Nogmaals bedankt!

Matthijs
```

---

## In-App Feedback Widget

### Design

```
┌────────────────────────────────────────────┐
│  Hoe vind je [PROJECT_NAAM]?     │
│                                            │
│     👎          😐          👍              │
│   Niet zo     Neutraal    Geweldig!        │
│                                            │
│  [Later herinneren]     [Sluiten]          │
└────────────────────────────────────────────┘
```

### Na positieve klik (👍):

```
┌────────────────────────────────────────────┐
│  Fijn! Wat vind je het beste?              │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ Bijv: "Eindelijk snel antwoord op    │  │
│  │ mijn boekhoudvragen"                 │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ☐ Mag gedeeld worden op onze website     │
│    (je naam wordt gevraagd)               │
│                                            │
│  [Versturen]                [Overslaan]    │
└────────────────────────────────────────────┘
```

### Na negatieve klik (👎):

```
┌────────────────────────────────────────────┐
│  Vervelend! Wat kunnen we verbeteren?      │
│                                            │
│  ○ Moeilijk in te stellen                 │
│  ○ Antwoorden niet accuraat               │
│  ○ Mist functionaliteit                   │
│  ○ Te langzaam                            │
│  ○ Anders: ______________                 │
│                                            │
│  [Versturen]                              │
└────────────────────────────────────────────┘
```

---

## Database Schema

```sql
-- Feedback responses
CREATE TABLE feedback (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),

    -- Type & trigger
    feedback_type TEXT NOT NULL, -- 'nps', 'widget', 'testimonial', 'churn'
    trigger_event TEXT, -- 'day_7', 'query_25', 'day_30', 'inactive_14'

    -- Scores
    nps_score INTEGER, -- 1-10
    sentiment TEXT, -- 'positive', 'neutral', 'negative'

    -- Content
    feedback_text TEXT,
    improvement_category TEXT, -- voor negatieve feedback

    -- Testimonial specifiek
    testimonial_quote TEXT,
    testimonial_approved BOOLEAN DEFAULT FALSE,
    testimonial_display_name TEXT, -- "Matthijs, CFO bij Chef Data"
    testimonial_company TEXT,
    permission_website BOOLEAN DEFAULT FALSE,
    permission_marketing BOOLEAN DEFAULT FALSE,

    -- Meta
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'email', -- 'email', 'widget', 'manual'
    email_campaign_id TEXT,

    -- Status
    status TEXT DEFAULT 'received', -- 'received', 'reviewed', 'published', 'archived'
    reviewed_at DATETIME,
    reviewed_by TEXT
);

-- Email campaign tracking
CREATE TABLE feedback_campaigns (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),

    campaign_type TEXT NOT NULL, -- 'day_7', 'day_30', 'churn_14'

    -- Scheduling
    scheduled_for DATETIME NOT NULL,
    sent_at DATETIME,

    -- Response tracking
    opened_at DATETIME,
    clicked_at DATETIME,
    responded_at DATETIME,

    -- Status
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'sent', 'opened', 'clicked', 'responded', 'cancelled'

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(feedback_type);
CREATE INDEX idx_feedback_testimonial ON feedback(testimonial_approved, permission_website);
CREATE INDEX idx_campaigns_scheduled ON feedback_campaigns(scheduled_for, status);
CREATE INDEX idx_campaigns_user ON feedback_campaigns(user_id);
```

---

## Automation Logic

### Cron Jobs (Scheduled Tasks)

```typescript
// Elke dag om 10:00 uitvoeren

// 1. Day 7 Check-ins
SELECT u.id, u.email, u.name,
       COUNT(al.id) as query_count,
       MIN(al.created_at) as first_query
FROM users u
JOIN api_logs al ON al.user_id = u.id AND al.success = true
WHERE u.created_at <= datetime('now', '-7 days')
  AND u.created_at > datetime('now', '-8 days')
  AND NOT EXISTS (
    SELECT 1 FROM feedback_campaigns fc
    WHERE fc.user_id = u.id AND fc.campaign_type = 'day_7'
  )
GROUP BY u.id
HAVING query_count >= 5;

// 2. Day 30 Testimonial Requests (alleen voor promoters)
SELECT u.id, u.email, u.name
FROM users u
JOIN feedback f ON f.user_id = u.id
WHERE u.created_at <= datetime('now', '-30 days')
  AND u.created_at > datetime('now', '-31 days')
  AND (f.nps_score >= 8 OR f.sentiment = 'positive')
  AND NOT EXISTS (
    SELECT 1 FROM feedback_campaigns fc
    WHERE fc.user_id = u.id AND fc.campaign_type = 'day_30'
  );

// 3. Churn Prevention (14 dagen inactief)
SELECT u.id, u.email, u.name,
       MAX(al.created_at) as last_query,
       COUNT(al.id) as total_queries
FROM users u
JOIN api_logs al ON al.user_id = u.id AND al.success = true
WHERE MAX(al.created_at) <= datetime('now', '-14 days')
  AND COUNT(al.id) >= 3 -- Had eerder actief gebruik
  AND NOT EXISTS (
    SELECT 1 FROM feedback_campaigns fc
    WHERE fc.user_id = u.id AND fc.campaign_type = 'churn_14'
      AND fc.created_at > datetime('now', '-30 days') -- Max 1x per 30 dagen
  )
GROUP BY u.id;
```

### Widget Trigger Logic

```typescript
// In dashboard of na API response
async function shouldShowFeedbackWidget(userId: string): Promise<boolean> {
  // Check query count
  const queryCount = await db.prepare(`
    SELECT COUNT(*) as count FROM api_logs
    WHERE user_id = ? AND success = true
  `).bind(userId).first<{count: number}>();

  // Check if already gave feedback recently
  const recentFeedback = await db.prepare(`
    SELECT 1 FROM feedback
    WHERE user_id = ?
      AND source = 'widget'
      AND created_at > datetime('now', '-30 days')
  `).bind(userId).first();

  // Show at query 25, 100, 250, etc. (exponential backoff)
  const triggers = [25, 100, 250, 500, 1000];
  const shouldShow = triggers.includes(queryCount.count) && !recentFeedback;

  return shouldShow;
}
```

---

## Metrics & Dashboard

### Te tracken KPIs

| Metric | Formule | Target |
|--------|---------|--------|
| NPS Score | % Promoters - % Detractors | > 50 |
| Response Rate (Email) | Responses / Emails Sent | > 20% |
| Widget Completion | Submitted / Shown | > 30% |
| Testimonial Conversion | Published / Requested | > 25% |
| Churn Recovery | Re-activated / Contacted | > 10% |

### Promoter/Detractor Classificatie

| NPS Score | Classificatie | Actie |
|-----------|---------------|-------|
| 9-10 | Promoter | Testimonial request |
| 7-8 | Passief | Geen actie |
| 1-6 | Detractor | Persoonlijke follow-up |

---

## Privacy & GDPR

### Vereiste toestemmingen

1. **Email marketing opt-in** - Al verzameld bij registratie
2. **Testimonial publicatie** - Expliciete checkbox
3. **Naam/bedrijf delen** - Expliciete checkbox

### Data retention

- Feedback data: 3 jaar bewaren
- Niet-gepubliceerde testimonials: 1 jaar, daarna anonimiseren
- Email campaign logs: 1 jaar

### Opt-out mechanisme

- Elke email bevat unsubscribe link
- Widget heeft "Nooit meer tonen" optie
- Account settings: "Geen feedback verzoeken"

---

## Implementatie Checklist

- [ ] Database migratie uitvoeren
- [ ] Email templates in systeem laden
- [ ] Cron job configureren
- [ ] Feedback widget bouwen
- [ ] Testimonial admin pagina maken
- [ ] Dashboard metrics toevoegen
- [ ] Test met eigen accounts
- [ ] Privacy policy updaten

---

*Document eigenaar: Product Team | Review: Kwartaal*
