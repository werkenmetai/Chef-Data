# Incident Response Plan - [PROJECT_NAAM]

> **Bij een incident: dit document is je startpunt. Lees, volg, documenteer.**

---

## Severity Levels

| Level | Naam | Definitie | Response Tijd | Voorbeeld |
|-------|------|-----------|---------------|-----------|
| **P1** | Critical | Service volledig down, data breach, of financieel verlies | < 15 min | API onbereikbaar, data lekt |
| **P2** | High | Grote feature kapot, veel klanten geraakt | < 1 uur | Auth flow werkt niet, data onjuist |
| **P3** | Medium | Enkele klanten geraakt, workaround beschikbaar | < 4 uur | Specifiek endpoint traag, UI bug |
| **P4** | Low | Cosmetisch, geen business impact | Volgende werkdag | Typo, styling issue |

---

## Incident Response Workflow

```
┌─────────────────────────────────────────────────────┐
│  1. DETECTIE                                        │
│  Monitoring alert / Klantmelding / Interne melding  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  2. TRIAGE                                          │
│  Severity bepalen (P1-P4)                           │
│  Incident Commander aanwijzen                       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  3. COMMUNICATIE                                    │
│  Team informeren, klanten updaten                   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  4. MITIGATIE                                       │
│  Stop de bloeding: rollback, hotfix, disable        │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  5. RESOLUTIE                                       │
│  Permanente fix, tests, deploy                      │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  6. POST-MORTEM                                     │
│  Blameless review, lessons learned, acties          │
└─────────────────────────────────────────────────────┘
```

---

## Rollen Tijdens Incident

| Rol | Wie | Verantwoordelijkheid |
|-----|-----|---------------------|
| **Incident Commander** | Dirk (DevOps) of Piet (CEO bij P1) | Coördineert alles, beslist |
| **Tech Lead** | Daan of Lars | Diagnose en fix |
| **Communicatie** | Petra + Emma | Klantcommunicatie |
| **Security** | Bas | Indien security-gerelateerd |
| **Legal** | Eva | Indien data breach (GDPR) |

---

## Per Severity: Draaiboek

### P1 - Critical

```
MINUUT 0-5: DETECTIE
├── Alert ontvangen (monitoring/klant/intern)
├── Dirk beoordeelt als P1
└── Melding aan Piet (CEO)

MINUUT 5-15: MOBILISATIE
├── Incident Commander: Dirk (of Piet)
├── Tech team: Daan + Lars + relevante specialist
├── Support: Petra bereidt klantcommunicatie voor
└── War room: alle communicatie in één kanaal

MINUUT 15-30: DIAGNOSE
├── Wat is kapot? (logs, monitoring, reproduce)
├── Sinds wanneer? (deploy? config change? extern?)
├── Hoeveel klanten geraakt?
└── Rollback mogelijk? Ja → DOE HET NU

MINUUT 30-60: MITIGATIE
├── Rollback OF hotfix OF disable feature
├── Verificatie dat service hersteld is
├── Klantcommunicatie: "We zijn op de hoogte, werken aan fix"
└── Monitoring: stabiliteit bevestigen

UUR 1-4: PERMANENTE FIX
├── Root cause analyse
├── Permanente fix ontwikkelen + testen
├── Deploy fix naar productie
└── Verificatie door Roos (QA)

UUR 4-24: AFRONDING
├── Klantcommunicatie: "Opgelost, dit was de oorzaak"
├── Post-mortem schrijven (blameless)
├── Lessons learned documenteren
└── Preventieve maatregelen in backlog
```

### P2 - High

```
UUR 0-1: DETECTIE + TRIAGE
├── Dirk beoordeelt als P2
├── Wijst toe aan Daan of Lars
└── Petra informeert getroffen klanten

UUR 1-4: DIAGNOSE + FIX
├── Reproduce probleem
├── Fix ontwikkelen
├── Test en deploy
└── Verificatie

UUR 4-24: AFRONDING
├── Klant update
├── Korte post-mortem
└── Lessons learned
```

### P3/P4 - Medium/Low

```
Via regulier process:
├── Bug report (PB-ENG-001)
├── Prioriteit in backlog
├── Fix in volgende sprint (P3) of als tijd is (P4)
└── Geen post-mortem nodig tenzij herhaald probleem
```

---

## Communicatie Templates

### Interne Melding
```
🚨 INCIDENT: [P1/P2] - [Korte beschrijving]
Sinds: [tijdstip]
Impact: [hoeveel klanten, welke functionaliteit]
Status: [Investigating / Mitigating / Resolved]
Commander: [naam]
Volgende update: [tijdstip]
```

### Klant Communicatie - Probleem Gemeld
```
Hoi [naam],

We zijn op de hoogte van een probleem met [functionaliteit].
Ons team werkt hier actief aan.

We verwachten binnen [X uur] meer duidelijkheid te hebben
en houden je op de hoogte.

Excuses voor het ongemak.
```

### Klant Communicatie - Opgelost
```
Hoi [naam],

Het probleem met [functionaliteit] is opgelost.

Oorzaak: [korte uitleg, geen technisch jargon]
Wat we doen om herhaling te voorkomen: [actie]

Excuses voor het ongemak. Mocht je nog iets merken,
laat het ons weten.
```

---

## Data Breach Protocol (GDPR)

**Als er een vermoeden is van ongeautoriseerde toegang tot persoonsgegevens:**

```
DIRECT (< 1 uur):
├── Bas (Security) beoordeelt de situatie
├── Eva (CLO) wordt geïnformeerd
├── Toegang tot getroffen systemen bevriezen
└── Forensisch bewijs veiligstellen (logs!)

BINNEN 24 UUR:
├── Impact assessment: welke data, hoeveel personen
├── Eva bepaalt of AP-melding nodig is (72-uur deadline!)
├── Juridisch advies inwinnen indien nodig
└── Communicatiestrategie bepalen

BINNEN 72 UUR (GDPR deadline):
├── Melding bij Autoriteit Persoonsgegevens (indien vereist)
├── Getroffen personen informeren (indien vereist)
├── Documentatie van alles wat gedaan is
└── Plan van aanpak voor preventie
```

---

## Post-Mortem Template

Gebruik `operations/templates/POST-MORTEM.md` als template. Kernpunten:

### Blameless Cultuur
- **WEL:** "Het systeem had geen validatie op X"
- **NIET:** "Persoon Y heeft een fout gemaakt"

### Verplichte Secties
1. **Samenvatting** - Wat gebeurde er, in 2-3 zinnen
2. **Tijdlijn** - Minuut-voor-minuut wat er gedaan is
3. **Root Cause** - Waarom gebeurde dit? (5x Waarom methode)
4. **Impact** - Hoeveel klanten, hoe lang, financieel
5. **Wat Ging Goed** - Wat werkte in onze response
6. **Wat Kan Beter** - Waar faalden we
7. **Acties** - Concrete, toegewezen, met deadline

---

## Jaarlijkse Review

### Elk Kwartaal:
- [ ] Zijn alle post-mortems geschreven?
- [ ] Zijn alle acties uit post-mortems afgehandeld?
- [ ] Is het incident response plan nog actueel?
- [ ] Zijn contactgegevens up-to-date?
- [ ] Oefening/simulatie van P1 incident

---

*Eigenaar: Dirk (DevOps) + Bas (Security)*
*Laatst bijgewerkt: 2026-02-06*
*Review cyclus: Per kwartaal*
