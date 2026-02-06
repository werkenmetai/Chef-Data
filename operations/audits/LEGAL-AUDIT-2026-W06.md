# Legal Audit Report - Week 6, 2026
## Privacy & Compliance Review

**Auditor:** Eva (CLO)
**Datum:** 2026-02-04
**Status:** ROOD
**Voor:** Matthijs (CEO)

---

## Executive Summary

De legal documenten zijn significant achtergelopen op de technische implementatie. Er zijn kritieke gaps gevonden: **Resend is niet gedocumenteerd als sub-verwerker**, support message opslag is niet gedekt in de privacy policy, en bewaartermijnen voor communicatiedata ontbreken. Directe actie is vereist voordat de email/support features live gaan naar productie.

---

## Compliance Scores

| Categorie | Score | Status |
|-----------|-------|--------|
| Privacy Policy | 4/10 | **KRITIEK** |
| Terms of Service | 6/10 | **ONVOLDOENDE** |
| GDPR Compliance | 5/10 | **ONVOLDOENDE** |
| Verwerkersovereenkomst | 4/10 | **KRITIEK** |

**Gemiddelde Score: 4.75/10**

---

## Scope van de Audit

### Features geaudit (sinds jan 2026):

| Feature | Database Tabel | Gedekt in Policy? |
|---------|----------------|-------------------|
| Support Messages | `support_messages` | ❌ NEE |
| Inbound Email | `communication_events` | ❌ NEE |
| Email Aliases | `user_email_aliases` | ❌ NEE |
| Admin Signatures | `users.email_signature` | ❌ NEE |
| Archive/Spam | `support_conversations` | ❌ NEE |

### Nieuwe Derde Partij:

| Partij | Dienst | Locatie | Gedocumenteerd? |
|--------|--------|---------|-----------------|
| **Resend, Inc.** | Email provider | **Ierland (EU West)** ✅ | ❌ **KRITIEK** |

> **Update 4 feb:** Matthijs heeft overal EU servers gekozen:
> - **Resend:** Ierland (EU West)
> - **Cloudflare:** EU regio (waar mogelijk)
>
> Dit betekent:
> - Volledige EU data residency
> - Geen SCCs nodig voor Resend
> - Cloudflare valt onder EU adequaatheidsbesluit + DPA
> - Maximale GDPR compliance

---

## Gevonden Gaps

| # | Gap | Ernst | Document | Actie Vereist |
|---|-----|-------|----------|---------------|
| 1 | **Resend niet vermeld als sub-verwerker** | **P1** | Privacy, DPA | Resend toevoegen |
| 2 | **Support messages opslag niet gedocumenteerd** | **P1** | Privacy Policy | Sectie 2 uitbreiden |
| 3 | **Communication events niet vermeld** | **P1** | Privacy Policy | Nieuwe sectie |
| 4 | Bewaartermijn support berichten ontbreekt | P2 | Privacy Policy | Sectie 6 uitbreiden |
| 5 | Inbound email verwerking niet gedekt | P2 | Privacy, ToS | Beschrijven |
| 6 | Email aliases niet gedocumenteerd | P2 | Privacy Policy | Sectie 2.1 |
| 7 | Admin signatures niet vermeld | P3 | Privacy Policy | Minor update |
| 8 | Recht op verwijdering support data niet expliciet | P2 | Privacy Policy | Sectie 7 |
| 9 | Archive/delete functionaliteit niet gedekt | P3 | Privacy Policy | Documenteren |
| 10 | ToS mist support communicatie voorwaarden | P2 | Voorwaarden | Nieuw artikel |

---

## Data Processing Inventory Update

### Nieuwe Data Types

| Data Type | Doel | Bewaartermijn | Rechtsgrond | Status |
|-----------|------|---------------|-------------|--------|
| Support Conversations | Klantenservice | **NIET GEDEFINIEERD** | Uitvoering overeenkomst | ❌ |
| Support Messages | Email inhoud | **NIET GEDEFINIEERD** | Uitvoering overeenkomst | ❌ |
| Communication Events | Audit trail | **NIET GEDEFINIEERD** | Gerechtvaardigd belang | ❌ |
| Email Aliases | Alternatieve emails | Account levensduur | Uitvoering overeenkomst | ❌ |
| Admin Signatures | Gepersonaliseerde replies | Account levensduur | Uitvoering overeenkomst | ❌ |

### Voorgestelde Bewaartermijnen

| Data Type | Voorstel |
|-----------|----------|
| Support berichten | 2 jaar na laatste activiteit |
| Communication events | 2 jaar, anonimiseren na account delete |
| Email aliases | Tot ontkoppeling/account delete |

---

## Aanbevolen Policy Updates

### 1. Privacy Policy (KRITIEK - 48 uur)

**Sectie 2.1 - Toevoegen:**
```
Support Communicatie
Wanneer je contact met ons opneemt via email of het support systeem, verzamelen wij:
- Email inhoud en onderwerp
- Verzend- en ontvangstdatum
- Eventuele bijlagen (alleen metadata)
- Alternatieve email adressen (email aliases)
```

**Sectie 5 - Toevoegen:**
```
Resend, Inc.
Email verzending en ontvangst voor support communicatie.
Locatie: Ierland (EU). Basis: Uitvoering overeenkomst.
```

**Sectie 6 - Bewaartermijnen uitbreiden:**
```
| Support berichten    | 2 jaar na laatste activiteit |
| Communication events | 2 jaar (anonimiseren na account verwijdering) |
| Email aliases        | Tot ontkoppeling of account verwijdering |
```

### 2. Terms of Service (HOOG - 1 week)

**Nieuw Artikel 4A - Support Communicatie:**
```
4A.1 Klant kan contact opnemen via support@praatmetjeboekhouding.nl.

4A.2 Support berichten worden opgeslagen voor:
- Adequate afhandeling van verzoeken
- Kwaliteitsverbetering
- Audit en compliance doeleinden

4A.3 Chef Data streeft naar beantwoording binnen 2 werkdagen.

4A.4 Support communicatie valt onder het Privacybeleid.
```

### 3. Verwerkersovereenkomst (KRITIEK - 48 uur)

**Bijlage 2 - Toevoegen:**
```
| Resend, Inc. | Ierland (EU) | Email verzending/ontvangst | DPA |
```

---

## Risico Assessment

| Risico | Impact | Waarschijnlijkheid |
|--------|--------|-------------------|
| AP onderzoek wegens onvolledige privacy policy | **Hoog** (boete tot 4% omzet) | Medium |
| Klantklacht bij AP | Medium | Laag |
| Reputatieschade | Hoog | Laag |
| Aansprakelijkheid bij datalek via Resend | **Hoog** | Laag |

---

## Volgende Stappen

| # | Actie | Verantwoordelijke | Deadline |
|---|-------|-------------------|----------|
| 1 | Privacy Policy update deployen | Eva + Lars | **48 uur** |
| 2 | Resend toevoegen aan Verwerkersovereenkomst | Eva | **48 uur** |
| 3 | ToS Artikel 4A toevoegen | Eva | 1 week |
| 4 | Bewaartermijnenbeleid definiëren | Eva | 1 week |
| 5 | Resend DPA verkrijgen en archiveren | Eva | 1 week |
| 6 | Data retention implementeren | Daan | 2 weken |

---

## Conclusie

**Status: ROOD** - De legal documenten zijn niet up-to-date met de technische implementatie. Dit is een compliance risico dat direct moet worden aangepakt.

**Kritieke actie:** Privacy Policy en Verwerkersovereenkomst moeten binnen 48 uur worden geüpdatet om Resend als sub-verwerker op te nemen en support data verwerking te documenteren.

**Geen blokker voor launch**, maar policy updates zijn verplicht voordat we actief marketing doen voor de email support features.

---

*Eva - Chief Legal Officer*
*"Compliance is geen optie, het is een vereiste."*

*Gegenereerd: 2026-02-04*
