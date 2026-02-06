# Legal & Compliance Lessons Learned

> **Beheerder:** Eva (CLO)
> **Domein:** Privacy, GDPR, Terms, Contracts
> **Laatst bijgewerkt:** 2026-01-28

## Hoe Lessons Toevoegen

```markdown
## Lesson: [Korte titel]

**Datum:** YYYY-MM-DD
**Melder:** [Naam]
**Categorie:** Privacy | GDPR | Terms | Contract | Security

### Issue
[Wat was het juridische/compliance issue]

### Risk Level
[Hoog/Medium/Laag]

### Oplossing
[Hoe opgelost]

### Policy Update?
[Welk document moet worden bijgewerkt]

### Bron
[Incident/review/audit]
```

---

## Lessons

### Lesson: Policy updates achtergebleven bij feature development

**Datum:** 2026-02-04
**Melder:** Eva (CLO)
**Categorie:** GDPR | Privacy

#### Issue
Privacy Policy en Verwerkersovereenkomst waren niet bijgewerkt na implementatie van email/support features (jan-feb 2026). Nieuwe data types (support messages, email aliases, communication events) en nieuwe sub-verwerker (Resend) waren niet gedocumenteerd.

#### Risk Level
**Hoog** - Potentiële AVG-overtreding door onvolledige transparantie naar betrokkenen.

#### Oorzaak
- Snelle feature development zonder legal review
- Geen process voor policy updates bij nieuwe features
- Legal audit schedule was Q2, terwijl features in Q1 werden gebouwd

#### Oplossing
1. Privacy Policy update (sectie 2, 5, 6)
2. Verwerkersovereenkomst update (Bijlage 2 - Resend toevoegen)
3. ToS update (nieuw artikel 4A - Support Communicatie)

#### Policy Update
- Privacy Policy → v1.1
- Verwerkersovereenkomst → v1.1
- Terms of Service → v1.1

#### Preventie
**Nieuw process:** Bij elke feature die nieuwe data verwerkt of nieuwe third party gebruikt:
1. Legal checklist in PR template
2. Eva reviewt voor merge naar production
3. Policy updates parallel aan feature development

#### Bron
Legal Audit W06 - `operations/audits/LEGAL-AUDIT-2026-W06.md`

---

### Lesson: Resend als sub-verwerker niet gedocumenteerd

**Datum:** 2026-02-04
**Melder:** Eva (CLO)
**Categorie:** GDPR | Contract

#### Issue
Resend (email provider) was toegevoegd als technische integratie zonder juridische documentatie als sub-verwerker.

#### Risk Level
**Hoog** - AVG vereist documentatie van alle sub-verwerkers.

#### Oplossing
1. Resend toevoegen aan Verwerkersovereenkomst Bijlage 2
2. Resend DPA verkrijgen en archiveren
3. Resend toevoegen aan Privacy Policy sectie 5

#### Policy Update
- Verwerkersovereenkomst Bijlage 2

#### Bron
Legal Audit W06

---

## Huidige Policies

| Document | Versie | Laatste Review | Update Nodig |
|----------|--------|----------------|--------------|
| Privacy Policy | 1.0 | 2026-01-24 | **JA - v1.1 (48 uur)** |
| Terms of Service | 1.1 | 2026-02-04 | Nee |
| Cookie Policy | 1.0 | 2026-01-01 | Nee |
| DPA (Verwerkersovereenkomst) | 1.1 | 2026-02-04 | Nee |

## GDPR Compliance

### Data we verzamelen
| Data Type | Doel | Bewaartermijn | Rechtsgrond | Status |
|-----------|------|---------------|-------------|--------|
| Email | Account | Tot verwijdering | Contract | ✅ Gedekt |
| Exact Tokens | API Access | Tot disconnect | Contract | ✅ Gedekt |
| Usage Logs | Billing | 7 jaar | Wettelijk | ✅ Gedekt |
| Support Tickets | Service | 2 jaar | Legitiem belang | ✅ Gedekt |
| **Support Messages** | Klantenservice | 2 jaar | Contract | ❌ **UPDATE NODIG** |
| **Communication Events** | Audit trail | 2 jaar | Legitiem belang | ❌ **UPDATE NODIG** |
| **Email Aliases** | Alternatieve emails | Tot verwijdering | Contract | ❌ **UPDATE NODIG** |
| **Admin Signatures** | Gepersonaliseerde replies | Tot verwijdering | Contract | ❌ **UPDATE NODIG** |

### Data Subject Rights
| Recht | Implementatie | Status |
|-------|---------------|--------|
| Inzage | Dashboard export | Actief |
| Verwijdering | Account delete | Actief |
| Portabiliteit | JSON export | Actief |
| Bezwaar | Email naar support | Actief |

## Security & Privacy Contacts

| Type | Contact | Response |
|------|---------|----------|
| Privacy vragen | privacy@praatmetjeboekhouding.nl | 72 uur |
| Security issues | Bas (Security Expert) | Direct |
| Data requests | Eva (CLO) | 30 dagen |

## Audit Schedule

| Audit Type | Frequentie | Laatste | Volgende |
|------------|------------|---------|----------|
| Security Audit | Maandelijks | W06 ✅ | W10 |
| Legal Audit | Maandelijks | W06 ✅ | W10 |
| Privacy Review | Quarterly | Q1 W06 | Q2 W14 |
| Terms Review | Yearly | 2026-02 | 2027-02 |

### W06 Audit Status
- Security Audit: ✅ Voltooid (ORANJE - 7.8/10)
- Legal Audit: ✅ Voltooid (ROOD - 4.75/10)
- Rapporten: `operations/audits/SECURITY-AUDIT-2026-W06.md`, `operations/audits/LEGAL-AUDIT-2026-W06.md`
