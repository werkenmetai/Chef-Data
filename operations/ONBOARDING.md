# Onboarding Guide - [PROJECT_NAAM]

> **Doel: Elke nieuwe agent binnen 1 dag productief.**

---

## Welkom

Welkom bij [PROJECT_NAAM]! Dit document helpt je om snel op gang te komen. We werken volgens Ray Dalio's principes van radicale transparantie en ideeën meritocratie.

---

## Stap 1: Begrijp de Organisatie (30 min)

### Lees deze documenten in volgorde:

| # | Document | Wat je leert |
|---|----------|-------------|
| 1 | `operations/PRINCIPLES.md` | Onze kernprincipes (Ray Dalio) |
| 2 | `operations/ORG-STRUCTURE.md` | Wie doet wat, rapportagelijnen |
| 3 | `docs/knowledge/KENNIS-TOEGANG.md` | Waar vind je welke kennis |
| 4 | `operations/BELIEVABILITY.md` | Wie is expert in welk domein |

### Kernprincipes - Onthoud Dit

| Principe | Wat het betekent voor jou |
|----------|--------------------------|
| **Radicale Waarheid** | Zeg wat je denkt. Geen "ja maar eigenlijk..." |
| **Radicale Transparantie** | Deel alles. Geen verborgen werk. |
| **Pijn + Reflectie** | Fouten zijn OK. Niet leren van fouten is niet OK. |
| **Ideeën Meritocratie** | Je idee kan winnen, ongeacht je senioriteit. Onderbouw het. |

---

## Stap 2: Ken Je Rol (30 min)

### Lees je agent prompt file

```bash
cat operations/agents/[jouw-naam]-[jouw-rol].md
```

### Begrijp je positie

| Vraag | Antwoord |
|-------|----------|
| Wie is mijn manager? | Zie "Rapporteert aan" in je agent file |
| Wie zijn mijn teamgenoten? | Zie ORG-STRUCTURE.md |
| Wat zijn mijn KPIs? | Zie je agent file |
| Waar schrijf ik mijn werk? | Zie je agent file "State Awareness" |

### Ken je playbooks

```bash
cat operations/playbooks/README.md
```

Zoek de playbooks die relevant zijn voor jouw rol. Leer ze.

---

## Stap 3: Ken de Kennisbank (30 min)

### Structuur

```
docs/knowledge/
├── KENNIS-TOEGANG.md       ← START HIER
├── backend/                # Daan, Lars
├── exact/                  # Joost
├── mcp/                    # Ruben
├── finance/                # Jan, Frans
├── marketing/              # Tom, Anna, Bram
├── support/                # Petra, Emma
├── legal/                  # Eva
├── product/                # Sander
├── design/                 # Nienke
├── sales/                  # Victor
├── hr/                     # Marieke
└── data-engineering/       # Wouter
```

### Lees je domein

```bash
cat docs/knowledge/[jouw-domein]/LESSONS-LEARNED.md
cat docs/knowledge/[jouw-domein]/VERSION.md
```

### Wie raadpleeg je?

Gebruik de Believability Matrix (`operations/BELIEVABILITY.md`) om te weten wie de experts zijn per onderwerp.

---

## Stap 4: Eerste Taken (Dag 1)

### Observeer
- Lees recente git commits: `git log --oneline -20`
- Lees de huidige week planning: `operations/weeks/2026-W[XX].md`
- Begrijp wat er nu speelt

### Kleine Bijdrage
- Pak een kleine taak op die past bij je rol
- Vraag je mentor als je ergens niet uitkomt
- Documenteer wat je leert

### Meld Je Aan
- Update de kennisbank met iets dat je geleerd hebt
- Stel jezelf voor in je eerste output

---

## Stap 5: Week 1 - Productief Worden

| Dag | Focus | Deliverable |
|-----|-------|-------------|
| 1 | Oriëntatie (dit document) | Eerste kleine bijdrage |
| 2 | Domeinkennis verdiepen | Lessons learned gelezen |
| 3 | Zelfstandige taak | Taak afgerond zonder hulp |
| 4 | Samenwerken | Cross-team bijdrage |
| 5 | Reflectie | PDP opgesteld met manager |

---

## Stap 6: Believability Opbouwen

Je begint als ★☆☆☆☆ (Beginner). Zo groei je:

```
★☆☆☆☆ Beginner   → Luister, leer, vraag (Week 1-4)
★★☆☆☆ Basis      → Eerste bijdragen, bouw track record (Maand 2-3)
★★★☆☆ Gevorderd  → Zelfstandig bijdragen, eigen expertise (Maand 4-6)
★★★★☆ Expert     → Track record bewezen, raadpleegbaar (Maand 6+)
★★★★★ Master     → Go-to persoon, leidt het domein (Maand 12+)
```

### Tips om sneller te groeien:
1. **Documenteer** wat je leert → voeg toe aan LESSONS-LEARNED
2. **Onderbouw** je standpunten → "ik denk X, omdat Y"
3. **Geef toe** als je iets niet weet → "dat weet ik niet, vraag Joost"
4. **Leer van fouten** → post-mortem, niet blame

---

## Stap 7: Communicatie

### Hoe meld je werk?

Gebruik het Output Protocol uit je agent file. Standaard format:

```json
{
  "taskId": "[id]",
  "status": "complete|partial|failed",
  "summary": "[wat je gedaan hebt]",
  "artifacts": ["[bestanden die je aangemaakt/gewijzigd hebt]"],
  "recommendations": ["[suggesties]"],
  "blockers": ["[wat blokkeert je]"]
}
```

### Hoe meld je een lesson learned?

```
[Specialist], ik heb een lesson learned:
- Categorie: [domein]
- Issue: [wat ging er mis of wat ontdekten we]
- Oplossing: [wat werkte]
- Bron: [waar kwam dit vandaan]
```

### Hoe escaleer je?

Zie `operations/playbooks/README.md` → PB-CROSS-001: Escalatie Protocol

---

## Checklist - Onboarding Compleet

- [ ] PRINCIPLES.md gelezen en begrepen
- [ ] ORG-STRUCTURE.md gelezen
- [ ] KENNIS-TOEGANG.md gelezen
- [ ] BELIEVABILITY.md gelezen
- [ ] Eigen agent prompt file gelezen
- [ ] Relevante playbooks gelezen
- [ ] Domein LESSONS-LEARNED gelezen
- [ ] Eerste taak uitgevoerd
- [ ] Eerste lesson learned gedocumenteerd
- [ ] PDP opgesteld met manager

---

*Eigenaar: Marieke (HR) + Iris (Technical Writer)*
*Laatst bijgewerkt: 2026-02-06*
