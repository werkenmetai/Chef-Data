# Support Lessons Learned

> **Beheerder:** Petra (CS Manager)
> **Domein:** Klantenservice, Tickets, FAQ, Onboarding
> **Laatst bijgewerkt:** 2026-02-04

## Hoe Lessons Toevoegen

```markdown
## Lesson: [Korte titel]

**Datum:** YYYY-MM-DD
**Melder:** [Naam]
**Categorie:** Ticket | Onboarding | FAQ | Escalatie

### Klantprobleem
[Wat was het probleem van de klant]

### Root Cause
[Waarom had de klant dit probleem]

### Oplossing
[Hoe hebben we het opgelost]

### Preventie
[Hoe voorkomen we dit voor andere klanten]

### FAQ Update?
[Ja/Nee - welk artikel updaten]
```

---

## Lessons

### Lesson: AI Support Agent met Guard Rails (P36)

**Datum:** 2026-02-04
**Melder:** Piet (Orchestrator)
**Categorie:** Escalatie | AI Support

#### Wat is gebouwd
Complete AI-powered support systeem met:
- Claude-based responses (niet alleen pattern matching)
- Email escalatie naar admin als AI het niet kan oplossen
- Reply op email → systeem pakt het op → AI vervolgt met instructies
- Kennisbank verrijking vanuit admin antwoorden
- Guard rails voor veiligheid

#### Guard Rails (KRITIEK)
| Guard Rail | Trigger | Actie |
|------------|---------|-------|
| **Human Request** | Klant vraagt om mens/persoon/medewerker | Direct escaleren, geen AI antwoord |
| **Response Limit** | 5+ AI responses in gesprek | Auto-escaleren naar admin |
| **Content Filter** | Refunds, wachtwoorden, account verwijderen | Blokkeer AI response |
| **Low Confidence** | AI confidence < 0.5 | Auto-escaleren naar admin |

#### Human Request Patterns (15 totaal)
Nederlands:
- "mens", "persoon", "medewerker", "iemand"
- "wil/kan/mag praten met..."
- "niet/geen robot/ai/bot"
- "telefoon", "bellen"

Engels:
- "human", "person", "agent", "someone"
- "speak/talk to human/person"
- "not/no robot/ai/bot"

#### Email Flow
```
support@praatmetjeboekhouding.nl
         ↓
    Inbound Webhook
         ↓
┌─ support+{id}@ format? ─┐
│                         │
├─ Admin reply:           │
│  → Add admin message    │
│  → Notify klant         │
│  → AI vervolgt          │
│                         │
├─ Customer reply:        │
│  → Add to conversation  │
│  → Trigger AI           │
│                         │
└─ New conversation:      │
   → Create ticket        │
   → Send acknowledgment  │
   → Trigger AI           │
```

#### Tools voor AI Agent
| Tool | Beschrijving |
|------|--------------|
| `escalate_to_admin` | Email naar admin + inform klant |
| `get_customer_history` | Bekijk eerdere gesprekken |
| `get_plan_usage` | Check plan limieten |
| `respond_to_customer` | Nu met guard rails checks |

#### Kennisbank Integratie
Na resolved/closed gesprek kan admin klikken op "Toevoegen aan Kennisbank":
1. API endpoint gebruikt Claude om artikel te genereren
2. Suggestie met titel, content, categorie, tags
3. Admin kan bewerken en opslaan

#### Bestanden
| Bestand | Functie |
|---------|---------|
| `apps/auth-portal/src/lib/email.ts` | Email templates + Reply-To |
| `apps/auth-portal/src/pages/api/email/inbound.ts` | Inbound webhook + routing |
| `apps/auth-portal/src/pages/api/support/agent/trigger.ts` | Guard rails + AI trigger |
| `apps/auth-portal/src/pages/api/admin/support/to-article.ts` | Kennisbank artikel generatie |
| `packages/ai-agents/src/support-agent/tools.ts` | AI tools + guard rails |
| `packages/ai-agents/src/support-agent/prompt.ts` | System prompt |

#### PR
#227

---

## Veelvoorkomende Issues

### Connectie Problemen
| Symptoom | Oorzaak | Oplossing |
|----------|---------|-----------|
| "Token verlopen" | Refresh token > 30 dagen | Opnieuw verbinden |
| "Division niet gevonden" | Geen toegang in Exact | Check Exact rechten |
| "Rate limit" | Te veel requests | Wacht 60 seconden |

### Onboarding Issues
| Stap | Veelvoorkomend probleem | Oplossing |
|------|------------------------|-----------|
| OAuth | Verkeerde redirect URL | Check Exact app config |
| API Key | Key niet gekopieerd | Opnieuw genereren |
| Eerste call | Geen division geselecteerd | Help division kiezen |

## Escalatie Matrix

| Issue Type | Eerste Lijn | Escalatie naar |
|------------|-------------|----------------|
| Standaard vragen | AI Agent | - |
| AI kan niet oplossen | AI Agent | Admin via email |
| Klant vraagt om mens | AI Agent (direct) | Admin via email |
| Technisch bug | Emma/AI | Daan (Backend) |
| Exact API | Emma/AI | Joost (Exact) |
| MCP Protocol | Emma/AI | Ruben (MCP) |
| Billing | Emma | Frans (CFO) |
| Security | Direct | Bas (Security) |

### AI Escalatie Flow
```
Nieuw support ticket
       ↓
   AI Agent analyseert
       ↓
┌──────────────────────┐
│ Kan AI helpen?       │
├── Ja → Antwoord      │
├── Nee → Escaleer     │
│         ↓            │
│   Email naar admin   │
│   (matthijs@...)     │
│         ↓            │
│   Admin antwoordt    │
│   via email reply    │
│         ↓            │
│   AI vervolgt met    │
│   admin instructies  │
└──────────────────────┘
```

### Configuratie
- **Reply-To formaat:** `support+{conversationId}@praatmetjeboekhouding.nl`
- **Admin email:** `matthijs@chefdata.nl`
- **Max AI responses:** 5 per gesprek
- **Confidence threshold:** 0.5
