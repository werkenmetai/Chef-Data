# Feedback Loop Strategie - Praat met je Boekhouding

> **Versie:** 1.0 | Januari 2026
> **Status:** Goedgekeurd door Matthijs (CSO)
> **Kernvraag:** Hoe halen wij zoveel mogelijk uit onze investering in ruime gratis tier?

---

## Strategisch Kader

### Waarom Dit Cruciaal Is

Met een ruime gratis tier (200 calls, 2 admins) investeren we in:
1. **Volume** - Meer gebruikers = meer feedback = beter product
2. **Mond-tot-mond** - Tevreden gratis gebruikers zijn je beste marketing
3. **Conversie data** - Zien wanneer mensen echt willen upgraden

De ROI zit in het **systematisch oogsten** van die waarde.

---

## Het Feedback Flywheel

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FEEDBACK FLYWHEEL                                │
│                                                                     │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│   │ CAPTURE  │ → │ RESPOND  │ → │ FIX/SHIP │ → │ SHARE    │     │
│   │ feedback │    │ snel     │    │ rotvaart │    │ resultaat│     │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘    │
│         ↑                                               │          │
│         └───────────────────────────────────────────────┘          │
│                     "Wij luisteren écht"                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. CAPTURE - Feedback Verzamelen

### Site Touchpoints (FeedbackWidget uitbreiden)

| Touchpoint | Trigger | Vraag |
|------------|---------|-------|
| Na 10 vragen | Milestone | "Hoe bevalt het tot nu toe?" + NPS |
| Na 50 vragen | Heavy user | "Wat missen we?" + open veld |
| Bij error | Foutmelding | "Dit ging mis. Wil je het melden?" + screenshot |
| Bij upgrade prompt | 80% limiet | "Niet upgraden? Vertel waarom" |
| Na 30 dagen | Retentie | "Nog steeds tevreden?" + quote request |

### Error Capture (Technisch)

```yaml
Flow:
1. Error treedt op in MCP server of auth portal
2. Client toont melding met "Meld dit probleem" knop
3. Screenshot wordt client-side gemaakt
4. Gevoelige data wordt automatisch geblurd (regex)
5. Upload naar R2 via signed URL
6. Ticket aangemaakt in support systeem

Storage: Cloudflare R2 (EU region)
Encryption: AES-256 at rest
Retention: 30 dagen (auto-delete)
Access: Alleen team via admin panel
```

### Wat NIET Opslaan
- Volledige API responses met financiële data
- OAuth tokens of credentials
- BSN, IBAN, of andere persoonlijke identificatienummers
- Wachtwoorden of API keys

### LinkedIn/Social Capture
- Reacties op posts → CRM notitie
- DMs → Support queue
- Mentions → Monitoring alert

---

## 2. RESPOND - Snel Reageren

### Response Time Targets

| Type | Target | Kanaal |
|------|--------|--------|
| Bug report | < 4 uur | Email + in-app |
| Feature request | < 24 uur | Email |
| LinkedIn reactie | < 2 uur | LinkedIn |
| Quote verzoek | < 48 uur | Email |

### Response Templates

**Bug Ontvangen:**
```
Bedankt voor je melding! We hebben het gezien en kijken ernaar.
Je hoort van ons zodra het opgelost is.
```

**Fix Live:**
```
Het is gefixt! Probeer het nog eens.
Dit soort meldingen helpen ons enorm - bedankt!
```

**Feature Request:**
```
Goed idee! We nemen het mee in onze planning.
Ik laat je weten als we ermee aan de slag gaan.
```

---

## 3. FIX/SHIP - In Rotvaart Verbeteren

### Prioritering Matrix

| Impact | Urgentie | Prioriteit | Actie |
|--------|----------|------------|-------|
| Hoog | Hoog | P1 | Vandaag fixen |
| Hoog | Laag | P2 | Deze week |
| Laag | Hoog | P3 | Quick win |
| Laag | Laag | Backlog | Later |

### Feedback → Roadmap Pipeline

```
1. Feedback binnenkomt → ROADMAP.md backlog sectie
2. Wekelijks: Piet triageert met team (maandag)
3. Sprint: Top 3 feedback items meenemen
4. Release: Update CHANGELOG + notify user persoonlijk
5. Share: LinkedIn post over de fix
```

### "Closed Loop" Principe

> Elke gebruiker die feedback geeft, krijgt bericht wanneer het opgelost is.

Dit bouwt loyaliteit en genereert quotes.

---

## 4. SHARE - Resultaat Delen

### Quote Verzamel Strategie

| Wanneer | Wat vragen | Waar plaatsen |
|---------|------------|---------------|
| Na succesvolle fix | "Mogen we dit delen?" | LinkedIn post |
| Na 100+ vragen | "Testimonial?" | Website pricing page |
| Na upgrade | "Waarom upgrade?" | Case study |
| Na 3 maanden actief | "Review?" | Exact App Store |

### Quote Request Template

```
Hi [naam],

Je gebruikt Praat met je Boekhouding nu [X] weken.
Ik zag dat je [specifiek iets] hebt gedaan - cool!

Zou je in 1-2 zinnen willen delen wat je ervan vindt?
Bijvoorbeeld voor onze website of een LinkedIn post.

Geen druk - een simpele "Werkt prima!" is ook waardevol.

Groet, Matthijs
```

### Waar Quotes Plaatsen

**Website:**
- Pricing page: Onder elk plan relevante quote
- Homepage: Carousel met 3-5 quotes
- Setup page: "Anderen over de installatie"

**Timing voor quotes op site:**
- Na 10+ verzamelde quotes
- Mix van ZZP, MKB, en accountants
- Minstens 1 quote per plan tier

### LinkedIn Content Cadence

| Dag | Type | Voorbeeld |
|-----|------|-----------|
| Maandag | User win | "ZZP'er bespaart 2 uur per week" |
| Woensdag | Behind the scenes | "Bug gemeld → 3 uur later gefixed" |
| Vrijdag | Product update | "Nieuwe feature: cashflow forecast" |

---

## 5. Technische Implementatie

### Error Screenshot Systeem

```typescript
// Client-side capture
interface ErrorReport {
  timestamp: string;
  userId: string;
  errorType: string;
  errorMessage: string;
  screenshot?: string; // Base64, blurred
  userAgent: string;
  currentPage: string;
}

// Blur patterns (regex)
const SENSITIVE_PATTERNS = [
  /\b\d{9}\b/g,           // BSN
  /\bNL\d{2}[A-Z]{4}\d{10}\b/g, // IBAN
  /\bexa_[a-f0-9]+\b/g,   // API keys
  /Bearer [A-Za-z0-9\-._~+\/]+=*/g, // Tokens
];
```

### R2 Bucket Setup

```yaml
Bucket: feedback-screenshots-eu
Region: EU (weur)
Lifecycle:
  - Delete after 30 days
  - No public access

Access:
  - Admin panel only
  - Signed URLs for upload (5 min expiry)
  - Audit log for downloads
```

### Database Schema (uitbreiding)

```sql
-- Feedback responses
CREATE TABLE feedback_responses (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  trigger_type TEXT NOT NULL, -- 'milestone_10', 'milestone_50', 'error', 'upgrade_prompt', 'retention_30d'
  nps_score INTEGER, -- 0-10
  feedback_text TEXT,
  screenshot_url TEXT,
  quote_approved BOOLEAN DEFAULT FALSE,
  responded_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Quote approvals
CREATE TABLE approved_quotes (
  id TEXT PRIMARY KEY,
  feedback_id TEXT REFERENCES feedback_responses(id),
  user_id TEXT REFERENCES users(id),
  quote_text TEXT NOT NULL,
  user_name TEXT,
  user_title TEXT, -- 'ZZP'er', 'Accountant', etc.
  placement TEXT, -- 'pricing', 'homepage', 'linkedin'
  approved_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Metrics & Targets

| Metric | Target | Meting |
|--------|--------|--------|
| NPS Score | > 40 | Gemiddelde van alle NPS responses |
| Response time (bugs) | < 4 uur | Tijd tot eerste response |
| Bug → Fix time | < 48 uur | Tijd tot deployment |
| Quotes verzameld | 5/maand | Aantal approved quotes |
| LinkedIn engagement | 50/post | Likes + comments + shares |
| Feedback response rate | > 20% | % users die feedback widget invullen |

---

## 7. Implementatie Roadmap

### Week 6 (Huidige Week)
- [ ] Dit document opslaan en delen
- [ ] FeedbackWidget triggers uitbreiden (Lars)
- [ ] R2 bucket opzetten voor screenshots (Daan)

### Week 7
- [ ] Error screenshot capture implementeren
- [ ] Quote request automatisering (Sophie)
- [ ] LinkedIn content kalender starten (Lisa)

### Week 8
- [ ] Admin panel voor feedback triage
- [ ] Eerste quotes verzamelen
- [ ] Response templates in support systeem

### Week 10+ (Na eerste klanten)
- [ ] Quotes op pricing page plaatsen
- [ ] Case studies schrijven
- [ ] Exact App Store reviews vragen

---

## 8. Eigenaarschap

| Onderdeel | Eigenaar | Backup |
|-----------|----------|--------|
| Feedback Widget (tech) | Lars | Daan |
| Error Screenshot (infra) | Daan | Dirk |
| Quote verzameling | Sophie | Petra |
| LinkedIn content | Lisa | Matthijs |
| Feedback triage | Piet | Sophie |
| Metrics dashboard | Tim | Daan |

---

## 9. Templates & Assets

### In-App Feedback Prompts

**Na 10 vragen (NPS):**
```
Je hebt al 10 vragen gesteld!
Hoe waarschijnlijk is het dat je ons aanbeveelt? (0-10)
[0] [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]
```

**Na 50 vragen:**
```
Wauw, je bent een power user!
Wat zouden we kunnen toevoegen of verbeteren?
[Open tekstveld]
```

**Bij error:**
```
Oeps, er ging iets mis.
Wil je dit melden zodat we het kunnen fixen?
[Screenshot meesturen] [Alleen tekst] [Negeren]
```

**Quote request (30 dagen):**
```
Je gebruikt ons nu een maand.
Zou je in 1-2 zinnen willen delen wat je ervan vindt?
We gebruiken dit mogelijk op onze website (met je toestemming).
[Tekstveld]
[ ] Mag op website
[ ] Mag op LinkedIn
[ ] Alleen intern
```

---

*Laatst bijgewerkt: 2026-01-31 door Matthijs (CSO) & Piet (CEO)*
