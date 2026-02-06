# TASK-W05-007: Compliance Gap Analysis

**Rol**: Eva - Legal & Compliance Specialist
**Datum**: 29 januari 2026
**Status**: Voltooid
**Referentie**: DOC-002 Compliance TODO items

---

## Executive Summary

De compliance status van Praat met je Boekhouding is **goed op weg**, met solide fundamenten voor AVG-compliance en een professionele juridische documentatie. Er zijn echter **kritieke actiepunten** die aandacht vereisen voor een veilige commerciele launch.

### Compliance Score: 72/100

| Categorie | Score | Status |
|-----------|-------|--------|
| Privacy Policy | 95% | Gereed |
| Terms of Service | 85% | Gereed, review nodig |
| Verwerkersovereenkomst | 85% | Gereed, review nodig |
| Consent Flow | 90% | Gereed |
| Exact Online Toestemming | 0% | **BLOCKER** |
| LIA/DPIA Documentatie | 0% | Open |
| Juristenreview | 0% | Open |

---

## 1. Huidige Compliance Status per Document

### 1.1 Privacy Policy (`/privacy`)

**Status**: GEREED
**Versie**: 1.0 (24 januari 2026)
**Locatie**: `/apps/auth-portal/src/pages/privacy.astro`

**Sterke punten:**
- Volledige AVG Art. 13/14 informatie aanwezig
- Verwerkingsverantwoordelijke duidelijk benoemd (Chef Data B.V.)
- Alle categorieeen persoonsgegevens gedocumenteerd
- Bewaartermijnen specifiek benoemd
- Rechten betrokkenen volledig uitgewerkt
- Contact AP vermeld voor klachten
- Sub-verwerkers transparant benoemd (Cloudflare, Stripe, Anthropic, OpenAI)
- Cookie informatie adequaat
- Pass-through model duidelijk uitgelegd

**Aandachtspunten:**
- Sectie 10 "Internationale doorgifte" vermeldt VS-transfers maar zou explicieter EU-US DPF kunnen benoemen
- Geen expliciete vermelding van 30-dagen retentie bij Anthropic API

**Beoordeling**: 95/100 - Zeer goed, kleine verbeteringen mogelijk

---

### 1.2 Algemene Voorwaarden (`/voorwaarden`)

**Status**: GEREED - JURISTENREVIEW NODIG
**Versie**: 1.0 (27 januari 2026)
**Locatie**: `/apps/auth-portal/src/pages/voorwaarden.astro`

**Sterke punten:**
- Volledige 16-artikel structuur conform Nederlandse praktijk
- B2B-only clausule expliciet (Art. 2.4)
- AI-disclaimer zeer uitgebreid (Art. 6)
- Aansprakelijkheidsbeperking gedocumenteerd (Art. 9)
- Vrijwaringsclausules aanwezig
- Nederlands recht en Amsterdam rechter benoemd
- Link naar Verwerkersovereenkomst (Art. 7)
- Pass-through model juridisch verankerd (Art. 4.2)
- Print/PDF functionaliteit aanwezig

**Gaps geidentificeerd:**
- [ ] Versie in template heeft `[INVULDATUM]` placeholder in template bestand
- [ ] Geen specifieke bepaling over AI Act compliance (komt 2026)
- [ ] Maximale aansprakelijkheid verschilt: website zegt EUR 500, template zegt EUR 5.000

**Beoordeling**: 85/100 - Goed, maar juristenreview essentieel

---

### 1.3 Verwerkersovereenkomst (DPA) (`/verwerkersovereenkomst`)

**Status**: GEREED - JURISTENREVIEW NODIG
**Versie**: 1.0 (27 januari 2026)
**Locatie**: `/apps/auth-portal/src/pages/verwerkersovereenkomst.astro`

**Sterke punten:**
- Volledige Art. 28 AVG compliance
- Alle 8 verplichte bepalingen aanwezig (Art. 28(3) a-h)
- Sub-verwerkers lijst volledig (Bijlage 2)
- Technische maatregelen gedocumenteerd (Bijlage 1)
- Datalek melding binnen 24 uur
- PDF download functionaliteit
- Invulformulier voor klantgegevens (client-side opslag)
- Doorgifte buiten EER gedocumenteerd met DPF + SCCs

**Aandachtspunten:**
- [ ] Addendum Accountants (`ADDENDUM-ACCOUNTANTS.md`) bestaat maar is niet gelinkt vanuit DPA pagina
- [ ] Audit rechten (Art. 5.1h) zouden detail kunnen gebruiken over procedure

**Beoordeling**: 85/100 - Goed, juristenreview aanbevolen

---

### 1.4 Consent Flow Analyse

**Status**: GEREED
**Componenten**:
- `TosAcceptanceModal.astro` - Blokkeert dashboard tot acceptatie
- `AiDisclaimer.astro` - Banner/inline/compact varianten
- OAuth login page met consent tekst
- `/exact/start.astro` met privacy links

**Sterke punten:**
- Modal vereist expliciete checkbox actie
- Versietracking in database (`tos_acceptances` tabel)
- IP + User Agent + timestamp logging
- Links naar voorwaarden en privacy in modal
- Samenvatting van belangrijkste punten in modal
- AI disclaimer prominent aanwezig in dashboard
- OAuth flow toont duidelijke permissies ("alleen-lezen")

**Consent flow verificatie:**
1. `/exact/start.astro` - Links naar privacy en voorwaarden in footer
2. `/oauth/login.astro` - Consent tekst: "Door toegang te verlenen ga je akkoord met..."
3. Dashboard - TosAcceptanceModal blokkeert toegang tot acceptatie
4. Dashboard - AiDisclaimer banner zichtbaar

**Beoordeling**: 90/100 - Zeer goede implementatie

---

## 2. Gap Analyse

### 2.1 KRITIEKE GAPS (Launch Blockers)

#### GAP-001: Exact Online Schriftelijke Toestemming
| Aspect | Detail |
|--------|--------|
| **Status** | NIET GESTART - BLOCKER |
| **Prioriteit** | KRITIEK |
| **Wettelijke basis** | Exact App Center Terms Sectie 3.2d |
| **Risico** | Partner status verlies, dienst moet stoppen |
| **Actie** | Brief versturen naar partner@exact.com |
| **Template beschikbaar** | Ja, in `JURIDISCH-ACTIEPLAN.md` sectie 6.3 |
| **Deadline** | Voor commerciele launch |
| **Effort** | 4-8 uur (brief + follow-up) |

#### GAP-002: Juristenreview ToS + DPA
| Aspect | Detail |
|--------|--------|
| **Status** | NIET GESTART |
| **Prioriteit** | HOOG (sterk aanbevolen voor launch) |
| **Wettelijke basis** | Aansprakelijkheidsrisico |
| **Risico** | Ongeldige clausules, aansprakelijkheidsclaims |
| **Geschatte kosten** | EUR 3.000 - 8.000 |
| **Deadline** | Voor commerciele launch |
| **Effort** | 2-4 weken doorlooptijd |

---

### 2.2 HOGE PRIORITEIT GAPS

#### GAP-003: Legitimate Interest Assessment (LIA)
| Aspect | Detail |
|--------|--------|
| **Status** | NIET GESTART |
| **Prioriteit** | HOOG |
| **Wettelijke basis** | AVG Art. 6(1)(f), EDPB Opinion 28/2024 |
| **Risico** | AP onderzoek, geen gedocumenteerde rechtsgrondslag |
| **Onderdelen** | Doeltoets, Noodzakelijkheidstoets, Afwegingstoets |
| **Deadline** | Q1 2026 |
| **Effort** | 8-16 uur |

#### GAP-004: DPIA Bepaling
| Aspect | Detail |
|--------|--------|
| **Status** | NIET GESTART |
| **Prioriteit** | HOOG |
| **Wettelijke basis** | AVG Art. 35 |
| **Risico** | Mogelijk verplicht bij hoog-risico AI verwerking |
| **Actie** | Eerst bepalen of DPIA verplicht is |
| **Opmerking** | Pass-through model = waarschijnlijk geen hoog risico |
| **Geschatte kosten** | EUR 5.000 - 15.000 (indien nodig) |
| **Effort** | 4 uur (bepaling) + evt. 40-80 uur (uitvoering) |

---

### 2.3 MEDIUM PRIORITEIT GAPS

#### GAP-005: Verwerkingsregister (ROPA)
| Aspect | Detail |
|--------|--------|
| **Status** | NIET GESTART |
| **Prioriteit** | MEDIUM |
| **Wettelijke basis** | AVG Art. 30 |
| **Risico** | Non-compliance bij AP audit |
| **Deadline** | Q1 2026 |
| **Effort** | 8-16 uur |

#### GAP-006: E-mail Disclaimers
| Aspect | Detail |
|--------|--------|
| **Status** | NIET GESTART |
| **Prioriteit** | MEDIUM |
| **Locatie** | Transactionele e-mails |
| **Template** | Beschikbaar in `JURIDISCH-ACTIEPLAN.md` sectie 5.2 |
| **Effort** | 2-4 uur |

#### GAP-007: Accountants Addendum Integratie
| Aspect | Detail |
|--------|--------|
| **Status** | TEMPLATE GEREED, NIET GEINTEGREERD |
| **Prioriteit** | MEDIUM |
| **Locatie** | `/docs/compliance/templates/ADDENDUM-ACCOUNTANTS.md` |
| **Actie** | Link toevoegen in DPA pagina |
| **Effort** | 1-2 uur |

---

### 2.4 NICE-TO-HAVE GAPS

#### GAP-008: Engelse Vertaling ToS + DPA
| Aspect | Detail |
|--------|--------|
| **Status** | NIET GESTART |
| **Prioriteit** | LAAG |
| **Reden** | Internationale klanten |
| **Geschatte kosten** | EUR 500 - 1.500 |
| **Deadline** | Bij eerste internationale klant |

#### GAP-009: ISO 27001 Voorbereiding
| Aspect | Detail |
|--------|--------|
| **Status** | NIET GESTART |
| **Prioriteit** | LAAG |
| **Geschatte kosten** | EUR 30.000 - 100.000 |
| **Reden** | Enterprise klanten, niet wettelijk verplicht |

#### GAP-010: PII Maskeringslaag
| Aspect | Detail |
|--------|--------|
| **Status** | NIET GESTART |
| **Prioriteit** | LAAG (OPTIONEEL) |
| **Beschrijving** | IBAN maskering, e-mail pseudonimisering |
| **Effort** | 20-40 uur development |

---

## 3. Gedetailleerde Document Review

### 3.1 Missende Links/Referenties

| Document | Missende referentie | Impact |
|----------|---------------------|--------|
| `/verwerkersovereenkomst` | Link naar Addendum Accountants | Medium |
| `/privacy` | Expliciete EU-US DPF vermelding | Laag |
| `/terms.astro` | Redirect naar `/voorwaarden` (duplicate pagina's) | Laag |

### 3.2 Verouderde Content

| Item | Issue | Actie |
|------|-------|-------|
| Template ToS | `[INVULDATUM]` placeholder | Vervangen |
| Template DPA | `[INVULDATUM]` placeholder | Vervangen |
| `ACTION-ITEMS.md` | Laatste update 26 jan | Update naar actueel |

### 3.3 Inconsistenties Gevonden

| Item | Locatie 1 | Locatie 2 | Verschil |
|------|-----------|-----------|----------|
| Max aansprakelijkheid | `/terms.astro` Art. 7.2 | `/voorwaarden.astro` Art. 9.1 | EUR 500 vs EUR 5.000 |
| Privacy update datum | `/privacy.astro` | `constants.ts` | Beide 24 jan - OK |

---

## 4. Prioriteiten Matrix

### Wettelijk Verplicht vs Nice-to-Have

| Item | Wettelijk Verplicht | Launch Blocker | Prioriteit |
|------|---------------------|----------------|------------|
| Exact Online toestemming | Contractueel ja | **JA** | P0 |
| Privacy Policy | Ja (AVG) | Nee (gereed) | P0 |
| ToS | Ja (B2B) | Nee (gereed) | P1 |
| DPA | Ja (AVG Art. 28) | Nee (gereed) | P1 |
| Juristenreview | Aanbevolen | Aanbevolen | P1 |
| LIA documentatie | Ja (AVG Art. 6) | Nee | P2 |
| DPIA | Mogelijk (Art. 35) | Nee | P2 |
| ROPA | Ja (AVG Art. 30) | Nee | P2 |
| E-mail disclaimers | Nee | Nee | P3 |
| Engelse vertaling | Nee | Nee | P4 |
| ISO 27001 | Nee | Nee | P5 |

---

## 5. Concrete Actielijst met Deadlines

### Fase 1: Pre-Launch (Week 5-6)

| # | Actie | Verantwoordelijke | Deadline | Effort | Status |
|---|-------|-------------------|----------|--------|--------|
| 1 | Exact Online toestemmingsbrief versturen | Directie | 31 jan 2026 | 4u | TODO |
| 2 | Jurist selecteren en briefen | Legal | 3 feb 2026 | 4u | TODO |
| 3 | ToS + DPA inconsistentie fixen (EUR 500 vs 5000) | Dev | 30 jan 2026 | 1u | TODO |
| 4 | Template placeholders vervangen | Dev | 30 jan 2026 | 1u | TODO |

### Fase 2: Launch Ready (Week 7-8)

| # | Actie | Verantwoordelijke | Deadline | Effort | Status |
|---|-------|-------------------|----------|--------|--------|
| 5 | Juristenreview afronden | Extern | 14 feb 2026 | - | TODO |
| 6 | LIA documenteren | Legal | 14 feb 2026 | 12u | TODO |
| 7 | Addendum Accountants linken in DPA | Dev | 7 feb 2026 | 2u | TODO |

### Fase 3: Post-Launch (Q1 2026)

| # | Actie | Verantwoordelijke | Deadline | Effort | Status |
|---|-------|-------------------|----------|--------|--------|
| 8 | DPIA noodzaak bepalen | Legal | 28 feb 2026 | 4u | TODO |
| 9 | ROPA opstellen | Legal | 28 feb 2026 | 12u | TODO |
| 10 | E-mail disclaimers implementeren | Dev | 28 feb 2026 | 4u | TODO |

### Fase 4: Optimalisatie (Q2 2026)

| # | Actie | Verantwoordelijke | Deadline | Effort | Status |
|---|-------|-------------------|----------|--------|--------|
| 11 | Engelse vertaling (indien nodig) | Extern | Bij vraag | - | GEPARKEERD |
| 12 | ISO 27001 roadmap (indien enterprise deals) | Directie | Q2 2026 | TBD | GEPARKEERD |

---

## 6. Effort Schatting Totaal

### Directe Kosten

| Item | Geschat | Timing |
|------|---------|--------|
| Juristenreview ToS + DPA | EUR 3.000 - 8.000 | Pre-launch |
| DPIA (indien nodig) | EUR 5.000 - 15.000 | Q1 2026 |
| Engelse vertaling (optioneel) | EUR 500 - 1.500 | On demand |
| ISO 27001 (optioneel) | EUR 30.000 - 100.000 | Q2+ 2026 |

### Interne Uren

| Activiteit | Uren | Wie |
|------------|------|-----|
| Exact toestemming proces | 8-16u | Directie |
| LIA documentatie | 12-16u | Legal/Compliance |
| DPIA bepaling + evt. uitvoering | 4-80u | Legal/Compliance |
| ROPA opstellen | 12-16u | Legal/Compliance |
| Template fixes + links | 4-6u | Development |
| E-mail disclaimers | 4-6u | Development |
| **Totaal minimum** | **44-56u** | - |
| **Totaal maximum** | **132-140u** | - |

---

## 7. Conclusies en Aanbevelingen

### Sterke Punten
1. Privacy Policy is zeer compleet en professioneel
2. ToS dekt AI-risico's uitgebreid af
3. Consent flow technisch goed geimplementeerd
4. Pass-through model biedt juridische voordelen
5. Sub-verwerkers lijst transparant en actueel
6. Database tracking van ToS acceptaties

### Kritieke Aanbevelingen
1. **DIRECT STARTEN**: Exact Online toestemmingsaanvraag - dit is de grootste blocker
2. **PRIORITEIT**: Juristenreview inplannen - aansprakelijkheidsclausules moeten waterdicht zijn
3. **DOCUMENTEREN**: LIA vastleggen - nodig voor Art. 6(1)(f) grondslag

### Risico Assessment

| Risico | Kans | Impact | Mitigatie |
|--------|------|--------|-----------|
| Exact weigert toestemming | Medium | Kritiek | Alternatieve structuur voorbereiden |
| Ongeldige ToS clausules | Laag | Hoog | Juristenreview |
| AP audit zonder LIA | Laag | Medium | LIA documenteren |
| DPIA vereist maar niet gedaan | Laag | Medium | Bepaling uitvoeren |

---

## 8. Bijlagen

### Gerelateerde Documenten
- `/docs/compliance/ACTION-ITEMS.md` - Compliance checklist
- `/docs/compliance/JURIDISCH-ACTIEPLAN.md` - Juridisch masterplan
- `/docs/compliance/eu-privacy-analysis.md` - GDPR deep-dive
- `/docs/compliance/templates/` - Alle juridische templates

### Geimplementeerde Componenten
- `TosAcceptanceModal.astro` - ToS acceptatie
- `AiDisclaimer.astro` - AI disclaimer
- `/api/legal/accept-tos.ts` - Acceptatie API
- Database migratie `0007_tos_acceptance.sql`

---

*Rapport opgesteld door: Eva - Legal & Compliance Specialist*
*Review deadline: 5 februari 2026*
*Volgende audit: Q2 2026*
