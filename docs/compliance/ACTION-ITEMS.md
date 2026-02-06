# Compliance Actiepunten

> Checklist voor GDPR/privacy compliance van Praat met je Boekhouding MCP
>
> **Update**: Januari 2026 - Juridisch actieplan beschikbaar in `JURIDISCH-ACTIEPLAN.md`

## Kritiek (voor launch) 🔴

- [ ] **Exact Online schriftelijke toestemming** aanvragen
  - Contact: Exact Partner team (partner@exact.com)
  - Benodigde info: Dataflow diagram, Anthropic certificeringen, beveiligingsmaatregelen
  - Deadline: Vóór commerciële launch
  - **STATUS: IN GESPREK** - Contact gelegd 28 jan 2026, App Store aanvraag ingediend
  - Volgende stap: Meeting met Exact, AI-toestemming bespreken
  - Template brief beschikbaar in `JURIDISCH-ACTIEPLAN.md` sectie 6.3

- [x] **Privacy Policy** opstellen ✅
  - Anthropic als sub-verwerker vermelden
  - Data locatie (VS met EU-US DPF)
  - Retentiebeleid (30 dagen)
  - Rechten betrokkenen
  - **GEREED**: Live op /privacy

- [x] **Terms of Service** implementeren ✅
  - Template beschikbaar: `templates/ALGEMENE-VOORWAARDEN.md`
  - **GEREED**: Live op /voorwaarden
  - Aansprakelijkheidsbeperking voor AI-risico's geïmplementeerd
  - **NOG VEREIST**: Juristenreview vóór commerciële launch

- [x] **Verwerkersovereenkomst template** voor B2B klanten ✅
  - Template beschikbaar: `templates/VERWERKERSOVEREENKOMST.md`
  - Addendum voor accountants: `templates/ADDENDUM-ACCOUNTANTS.md`
  - **GEREED**: Live op /verwerkersovereenkomst met PDF download
  - Client-side formulier voor bedrijfsgegevens
  - **NOG VEREIST**: Juristenreview vóór commerciële launch

- [x] **Disclaimer in dashboard** implementeren ✅
  - "Geen financieel advies" prominent getoond via AiDisclaimer component
  - AI-hallucinatie waarschuwing geïmplementeerd
  - Banner variant op dashboard
  - Inline variant beschikbaar voor andere pagina's

- [x] **Acceptance flow** bouwen ✅
  - ToS modal blokkeert dashboard tot acceptatie
  - Versiehistorie in `tos_acceptances` tabel
  - Timestamp + IP + User Agent logging
  - Database migratie: `0007_tos_acceptance.sql`

## Hoog (na launch basics) 🟡

- [ ] **Legitimate Interest Assessment (LIA)** documenteren
  - Doeltoets
  - Noodzakelijkheidstoets
  - Afwegingstoets
  - Template: EDPB guidance volgen

- [ ] **PII-maskeringslaag** implementeren in MCP server
  - IBAN maskering (****1234 format)
  - E-mail pseudonimisering
  - Optionele naamsubstitutie
  - **OPTIONEEL** - Nice-to-have, geen blocker

- [ ] **DPIA** uitvoeren (indien hoog-risico)
  - Bepaal eerst of DPIA verplicht is
  - Pass-through model = waarschijnlijk geen hoog risico
  - Zo ja: risicoanalyse + maatregelen

- [ ] **Juristenreview** laten uitvoeren
  - Terms of Service
  - Verwerkersovereenkomst
  - Geschatte kosten: €3.000 - 8.000

## Medium prioriteit 🟢

- [ ] **Verwerkingsregister (ROPA)** opstellen
  - Alle verwerkingsactiviteiten documenteren
  - Sub-verwerkers lijst bijhouden (zie Bijlage 2 DPA)

- [ ] **Security assessment** voor Exact App Center
  - Exact's security review doorlopen
  - Documentatie voorbereiden

- [x] **Audit trails** implementeren
  - Logging van data access
  - Wie heeft welke data opgevraagd
  - ✅ Provider stats API geïmplementeerd (`GET /api/stats/providers`)

- [ ] **E-mail disclaimers** toevoegen
  - Footer voor transactionele e-mails
  - Tekstvoorstellen in `JURIDISCH-ACTIEPLAN.md`

## Nice to have (na launch)

- [ ] **Engelse vertaling** ToS + DPA
  - Voor internationale klanten
  - Geschatte kosten: €500-1.500

- [ ] **ISO 27001** voorbereiding
  - Kosten: €30.000-100.000
  - Niet verplicht, wel waardevol voor enterprise klanten

- [ ] **Zero Data Retention** onderzoeken bij Anthropic
  - Enterprise feature
  - Mogelijk via AWS Bedrock/Vertex AI

- [ ] **EU-hosted alternatief** evalueren
  - Mistral AI (Frankrijk)
  - Aleph Alpha (Duitsland)
  - Azure OpenAI EU (Frankfurt)

## UI/UX Privacy Features

> Geïmplementeerd januari 2026

- [x] **Dashboard privacy sectie**
  - Laatste gebruikte AI provider badge
  - Data passthrough bevestiging
  - Quick links naar provider privacy settings

- [x] **Publieke privacy documentatie**
  - `/docs/ai-privacy` pagina
  - Per-provider instellingen
  - Quick start checklist

- [x] **Privacy disclaimer component**
  - Short/medium/full varianten
  - Herbruikbaar in hele app

- [x] **Setup flow privacy tips**
  - Privacy tip card na callback
  - Privacy awareness sectie in setup

- [x] **Email preferences database**
  - email_privacy_tips
  - email_provider_news
  - email_product_updates

---

## Launch Checklist

### MOET voor launch ✅

| Item | Status | Blocker? |
|------|--------|----------|
| Exact Online toestemming | 🟡 IN GESPREK | **JA** |
| Terms of Service | ✅ GEREED | - |
| Verwerkersovereenkomst | ✅ GEREED | - |
| Disclaimer in dashboard | ✅ GEREED | - |
| Acceptance flow | ✅ GEREED | - |
| Privacy Policy | ✅ GEREED | - |
| **Juristenreview ToS + DPA** | ⬜ TODO | Aanbevolen |

### KAN later

| Item | Status | Reden |
|------|--------|-------|
| Juristenreview | ⬜ TODO | Sterk aanbevolen maar niet blocker |
| LIA documentatie | ⬜ TODO | Kan kort na launch |
| DPIA | ⬜ TODO | Mogelijk niet verplicht |
| ISO 27001 | ⬜ TODO | Enterprise nice-to-have |

---

## Contactpersonen

| Partij | Contact | Doel |
|--------|---------|------|
| Exact Online | partner@exact.com | Schriftelijke toestemming |
| Anthropic | sales@anthropic.com | Enterprise features, DPA vragen |
| Privacy jurist | TBD | Juridische review |
| AP | avg@autoriteitpersoonsgegevens.nl | Vragen voorafgaand aan verwerking |
| GBA (België) | contact@gegevensbeschermingsautoriteit.be | Belgische vragen |

---

## Kostenraming

| Item | Geschat | Status |
|------|---------|--------|
| Juridisch advies ToS + DPA | €3.000-8.000 | Niet gestart |
| DPIA uitvoering (indien nodig) | €5.000-15.000 | Niet gestart |
| Privacy policy opstellen | ~~€1.000-3.000~~ | ✅ Gereed (intern) |
| Technische implementatie | Intern | In progress |
| **Totaal minimum voor launch** | **€3.000-8.000** | |

---

## Beschikbare templates

| Document | Locatie | Status |
|----------|---------|--------|
| Terms of Service | `templates/ALGEMENE-VOORWAARDEN.md` | ✅ Geïmplementeerd op /voorwaarden |
| Verwerkersovereenkomst | `templates/VERWERKERSOVEREENKOMST.md` | ✅ Geïmplementeerd op /verwerkersovereenkomst |
| Addendum Accountants | `templates/ADDENDUM-ACCOUNTANTS.md` | Concept |
| Juridisch Actieplan | `JURIDISCH-ACTIEPLAN.md` | Compleet |

## Geïmplementeerde componenten

| Component | Locatie | Beschrijving |
|-----------|---------|--------------|
| ToS Modal | `src/components/TosAcceptanceModal.astro` | Blokkerende modal voor ToS acceptatie |
| AI Disclaimer | `src/components/AiDisclaimer.astro` | Herbruikbare disclaimer (banner/inline) |
| ToS API | `src/pages/api/legal/accept-tos.ts` | POST endpoint voor acceptatie |
| Constants | `src/lib/constants.ts` | TOS_VERSION, DPA_VERSION, etc. |
| DB Migration | `migrations/0007_tos_acceptance.sql` | ToS tracking tabel + user velden |

---

*Laatste update: 29 januari 2026*
