# Organisatiestructuur - Praat met je Boekhouding

## Dual Leadership Model

```
┌─────────────────────────────────────────────────────────────────┐
│              MATTHIJS (CSO) - Strategisch                       │
│  Board aansturing, Quarterly planning, BHAG, Vision             │
│  "Waar gaan we naartoe?"                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                         C-SUITE
                              │
┌─────────────────────────────────────────────────────────────────┐
│                PIET (CEO) - Operationeel                        │
│  Management & Teams, Daily/Weekly execution, Orchestratie       │
│  "Hoe komen we daar?"                                           │
└─────────────────────────────────────────────────────────────────┘
```

| Rol | Focus | Frequentie | Aansturing |
|-----|-------|------------|------------|
| **Matthijs** | Board (C-Suite) | Quarterly/Monthly | Strategische richting |
| **Piet** | Management + Operationeel | Weekly/Daily | Uitvoering |

---

## Drielaags Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    STRATEGISCH (Board)                          │
│  Visie, richting, grote beslissingen                           │
│  Quarterly focus                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    TACTISCH (Management)                        │
│  Planning, coördinatie, resource allocatie                     │
│  Weekly/Monthly focus                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    OPERATIONEEL (Uitvoering)                    │
│  Dagelijkse taken, implementatie, support                      │
│  Daily focus                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Volledige Organisatie

### Laag 1: Board (C-Suite)

| Rol | Agent | Verantwoordelijkheid | Scaling Up |
|-----|-------|---------------------|------------|
| **CEO** | Piet | Visie, orchestratie, final call | People |
| **CSO** | Matthijs | Strategy, OKRs, OPSP | Strategy |
| **COO** | Henk | Operations, execution, processes | Execution |
| **CFO** | Frans | Finance, cash, pricing | Cash |
| **CTO** | Kees | Technology, product, roadmap | Execution |
| **CMO** | Lisa | Marketing, brand, growth | Strategy |
| **CCO** | Sophie | Customer experience, NPS | People |
| **CLO** | Eva | Legal, compliance, risk | Strategy |

### Laag 2: Midden Management

| Rol | Agent | Rapporteert aan | Team |
|-----|-------|-----------------|------|
| **Engineering Manager** | Wim | CTO Kees | Development |
| **Security Lead** | Bas | CTO Kees | Security |
| **DevOps Lead** | Dirk | COO Henk | Infrastructure |
| **Growth Lead** | Tom | CMO Lisa | Marketing |
| **Community Lead** | Marie | CMO Lisa | Engagement |
| **CS Manager** | Petra | CCO Sophie | Support |
| **Finance Ops** | Jan | CFO Frans | Finance |

### Laag 3: Operationeel

| Rol | Agent | Rapporteert aan | Focus |
|-----|-------|-----------------|-------|
| **QA Engineer** | Roos | Wim | Testing |
| **Frontend Dev** | Daan | Wim | UI/UX |
| **Backend Dev** | Lars | Wim | API/Server |
| **Content Creator** | Anna | Tom | Blog/Social |
| **SEO Specialist** | Bram | Tom | Organic |
| **Support Agent** | Emma | Petra | Tickets |
| **Data Analyst** | Tim | Jan | Metrics |

---

## Org Chart

```
                                 PIET (CEO)
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
               MATTHIJS          Board Level      ADVISORS
                (CSO)           Reporting           │
                    │                │          ┌───┴───┐
                    │      ┌────────┴────────┐  EVA    External
                    │      │        │        │ (CLO)
                    │      │        │        │
               ┌────┴──────┴───┬────┴────┬───┴────┐
               │               │         │        │
            HENK           KEES       LISA    SOPHIE     FRANS
           (COO)          (CTO)      (CMO)    (CCO)      (CFO)
               │               │         │        │         │
         ┌─────┤          ┌────┤    ┌────┤        │    ┌────┤
         │     │          │    │    │    │        │    │    │
       Dirk   ...       Wim   Bas  Tom  Marie   Petra  Jan  ...
     (DevOps)           │          │              │
         │          ┌───┼───┐  ┌───┤          ┌───┤
         │          │   │   │  │   │          │   │
        ...       Roos Daan Lars Anna Bram  Emma ...
                               │
                              Tim
```

---

## Meeting Structuur per Laag

### Board Level (C-Suite)
| Meeting | Frequentie | Duur | Deelnemers |
|---------|------------|------|------------|
| Board Strategy | Quarterly | 4 uur | All C-level |
| Executive L10 | Weekly | 90 min | CEO + C-level |
| 1-on-1 met CEO | Weekly | 30 min | Per C-level |

### Management Level
| Meeting | Frequentie | Duur | Deelnemers |
|---------|------------|------|------------|
| Department L10 | Weekly | 60 min | Manager + team leads |
| Cross-functional | Weekly | 30 min | All managers |
| 1-on-1 met C-level | Weekly | 30 min | Per manager |

### Operational Level
| Meeting | Frequentie | Duur | Deelnemers |
|---------|------------|------|------------|
| Daily Standup | Daily | 15 min | Team |
| Sprint Planning | Bi-weekly | 60 min | Team + manager |
| Retro | Bi-weekly | 30 min | Team |

---

## KPIs per Laag

### Board KPIs (Quarterly)
- MRR / ARR
- Customer count
- Churn rate
- NPS score
- Cash runway

### Management KPIs (Monthly)
- Team velocity
- Feature delivery
- Customer satisfaction
- Budget adherence
- Quality metrics

### Operational KPIs (Weekly/Daily)
- Tasks completed
- Bugs fixed
- Response time
- Uptime
- Test coverage

---

## Implementatie Prioriteit

### Fase 1: Core (Nu - Week 5-6)
Must-have voor operatie:

| Agent | Rol | Laag |
|-------|-----|------|
| Frans | CFO | Board |
| Tom | Growth Lead | Management |
| Jan | Finance Ops | Management |

### Fase 2: Scale (Week 7-8)
Voor groei:

| Agent | Rol | Laag |
|-------|-----|------|
| Dirk | DevOps Lead | Management |
| Petra | CS Manager | Management |
| Roos | QA Engineer | Operationeel |

### Fase 3: Optimalisatie (Week 9+)
Voor efficiency:

| Agent | Rol | Laag |
|-------|-----|------|
| Marie | Community Lead | Management |
| Anna | Content Creator | Operationeel |
| Tim | Data Analyst | Operationeel |

---

*Document gegenereerd: 2026-01-27*
*Versie: 1.0*
