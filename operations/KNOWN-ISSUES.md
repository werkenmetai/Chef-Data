# Known Issues & Bugs

> Gevonden tijdens testen - te onderzoeken/fixen

---

## Status: GEFIXED ✅

Na uitgebreid onderzoek zijn de volgende bugs gevonden en opgelost:

### BUG-001: Verkeerde Account Status Code
- **Datum:** 2026-01-29
- **Bestand:** `relations.ts` (regel 70)
- **Probleem:** Filter gebruikte `Status eq 'C'` maar in Exact Online betekent:
  - `'A'` = Active
  - `'C'` = Customer (is een type, geen status!)
  - `'B'` = Blocked
  - `'I'` = Inactive
- **Oplossing:** Gewijzigd naar `Status eq 'A'`
- **Status:** ✅ GEFIXED

### BUG-002: ReceivablesList/PayablesList Endpoint Prefix
- **Datum:** 2026-01-29
- **Bestanden:** `invoices.ts`, `financial.ts`
- **Probleem:** Endpoints gebruikten `/financial/ReceivablesList` maar deze "List" endpoints zijn bulk-read APIs
- **Oplossing:** Gewijzigd naar `/read/financial/ReceivablesList` en `/read/financial/PayablesList`
- **Status:** ✅ GEFIXED

### BUG-003: DateTime Format in OData Filters
- **Datum:** 2026-01-29
- **Bestanden:** `invoices.ts`, `financial.ts`
- **Probleem:** DateTime formaat `datetime'2026-01-01'` zonder tijdcomponent
- **Oplossing:** Gewijzigd naar `datetime'2026-01-01T00:00:00'` met tijdcomponent
- **Status:** ✅ GEFIXED

---

## API Rechten Verificatie

**Datum:** 2026-01-29

De app "Praat met je Boekhouding" heeft volledige "Bekijken" rechten voor alle modules:

| Module | Rechten |
|--------|---------|
| Account Management | ✅ Bekijken |
| Financial Accounting | ✅ Bekijken |
| Asset Management | ✅ Bekijken |
| Budgeting | ✅ Bekijken |
| Cashflow | ✅ Bekijken |
| GL Accounts and Journals | ✅ Bekijken |
| Payables Management | ✅ Bekijken |
| Receivables Management | ✅ Bekijken |
| Inventory Management | ✅ Bekijken |
| Item management | ✅ Bekijken |
| Project Management | ✅ Bekijken |
| Sales Invoices | ✅ Bekijken |
| Purchase Invoices | ✅ Bekijken |
| Sales Orders | ✅ Bekijken |
| Purchase Orders | ✅ Bekijken |
| Time and Billing Registration | ✅ Bekijken |
| Quotations | ✅ Bekijken |
| Opportunity Management | ✅ Bekijken |
| Sales Contract Management | ✅ Bekijken |
| Document Management | ✅ Bekijken |
| Currency and Exchange Rates | ✅ Bekijken |
| Cost Centers and Cost Units | ✅ Bekijken |
| Sales/Purchase Price Management | ✅ Bekijken |

Toegang tot: **Alle huidige en toekomstige administraties**

---

## Open Issues

Geen open issues.

---

## Recent Gefixed

### ISSUE-001: "Toegang verlenen" knop reageert niet
- **Datum gevonden:** 2026-01-29
- **Datum gefixed:** 2026-02-01
- **Gevonden door:** Matthijs
- **Gefixed door:** Lars (Frontend)
- **Pagina:** OAuth consent scherm (`/oauth/authorize`)
- **Beschrijving:** De "Toegang verlenen" knop deed niets bij klikken
- **Oorzaak:** Form submit werkte niet betrouwbaar in alle browsers
- **Oplossing:** JavaScript event handlers toegevoegd voor expliciete form submit, plus visuele feedback ("Bezig...")
- **Bestand:** `apps/auth-portal/src/pages/oauth/login.astro`
- **Status:** GEFIXED

### ISSUE-002: Filter knoppen op blog pagina werken niet
- **Datum gevonden:** 2026-01-29
- **Datum gefixed:** 2026-02-01
- **Gevonden door:** Matthijs
- **Gefixed door:** Lars (Frontend)
- **Pagina:** `/blog` (niet `/docs/claude-desktop-setup` zoals oorspronkelijk gedacht)
- **Beschrijving:** De categorie filter knoppen (Alles, Product, Tutorial, Gids, Productiviteit, etc.) deden niets bij klikken
- **Oorzaak:** URL query parameter `category` werd niet gelezen en posts werden niet gefilterd
- **Oplossing:** Server-side filtering toegevoegd op basis van URL parameter, actieve filter state wordt nu correct weergegeven
- **Bestand:** `apps/auth-portal/src/pages/blog/index.astro`
- **Status:** GEFIXED

### ISSUE-003: TypeScript errors in conversation page script
- **Datum gevonden:** 2026-02-04
- **Datum gefixed:** 2026-02-04
- **Gevonden door:** CI Pipeline
- **Gefixed door:** Piet (via Claude)
- **Pagina:** Admin support conversations (`/admin/support/conversations/[id]`)
- **Beschrijving:** CI typecheck faalde met errors:
  - `Property 'disabled' does not exist on type 'HTMLElement'`
  - `'data' is of type 'unknown'`
- **Oorzaak:** Inline Astro scripts worden met TypeScript gecheckt. `document.getElementById()` returns `HTMLElement`, niet specifieke subtypes. `response.json()` returns `unknown` in strict mode.
- **Oplossing:** Type assertions toegevoegd:
  - `as HTMLButtonElement | null` voor button element
  - `as { error?: string; suggested_article?: {...} }` voor API response
- **Bestand:** `apps/auth-portal/src/pages/admin/support/conversations/[id].astro`
- **PR:** #231
- **Status:** GEFIXED

### ISSUE-004: Blog artikelen zijn niet leesbaar voor mensen
- **Datum gevonden:** 2026-02-05
- **Datum gefixed:** 2026-02-05
- **Gevonden door:** Matthijs
- **Gefixed door:** Lars (CSS) + Tom & Anna (Content)
- **Pagina's:** Alle blog posts (`/blog/*`)
- **Beschrijving:** Blogs waren technische feature-lijsten, niet menselijk leesbaar:
  - Geen visuele blokken, tekst plakte aan elkaar
  - Te weinig whitespace tussen secties
  - Technisch jargon (`get_wip_overview`, `OAuth 2.1 met PKCE`)
- **Oorzaak:**
  1. CSS: Tailwind `prose` class gaf onvoldoende spacing
  2. Content: Geschreven als feature-lijsten, niet als verhaal
- **Oplossing:**
  1. **CSS fix (Lars):** Custom prose overrides met `margin-top: 3rem` op h2, section dividers, meer paragraph spacing
  2. **Content rewrite (Tom & Anna):** 3 product blogs herschreven met korte paragrafen, concrete voorbeeldvragen, geen jargon
- **Bestanden:** `apps/auth-portal/src/pages/blog/[slug].astro`
- **PRs:** #241 (CSS), #242 (Content)
- **Lessons Learned:** `docs/knowledge/marketing/VERSION.md` - LESSON-001
- **Status:** GEFIXED

---

## Testomgeving

- **Klant:** Beurs van Berlage
- **Administraties:** 5 divisies (NL regio)
- **Datum eerste test:** 2026-01-29
- **Status:** API-rechten volledig, code-bugs gefixed
