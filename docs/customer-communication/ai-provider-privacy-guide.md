# AI Provider Privacy Gids voor Klantcommunicatie

> **Doel**: Praktische handleiding voor het informeren van klanten over hun verantwoordelijkheid bij AI-provider keuze
> **Versie**: 1.1
> **Datum**: Januari 2026

---

## Implementatie Status

> **Laatste update**: 26 januari 2026

De volgende features uit deze gids zijn geïmplementeerd in de applicatie:

| Feature | Status | Locatie |
|---------|--------|---------|
| Provider detectie backend | ✅ Klaar | `apps/mcp-server/src/lib/provider-detection.ts` |
| Provider stats API | ✅ Klaar | `GET /api/stats/providers` |
| Dashboard privacy sectie | ✅ Klaar | `/dashboard` → "Privacy & AI Providers" |
| Publieke privacy gids | ✅ Klaar | `/docs/ai-privacy` |
| PrivacyDisclaimer component | ✅ Klaar | `src/components/PrivacyDisclaimer.astro` |
| Setup flow privacy tip | ✅ Klaar | `/callback`, `/setup` |
| Email preferences DB | ✅ Klaar | Migration `0006_add_email_preferences.sql` |
| Email versturen | ⏳ TODO | Nog niet geïmplementeerd |

---

## Inhoudsopgave

1. [Kernprincipes](#1-kernprincipes)
2. [Onboarding Communicatie](#2-onboarding-communicatie)
3. [Provider-Specifieke Privacy Settings](#3-provider-specifieke-privacy-settings)
4. [Email Personalisatie Strategie](#4-email-personalisatie-strategie)
5. [Dashboard Informatievoorziening](#5-dashboard-informatievoorziening)
6. [Disclaimer Formuleringen](#6-disclaimer-formuleringen)
7. [Proactieve Communicatie](#7-proactieve-communicatie)
8. [Best Practice Gids Structuur](#8-best-practice-gids-voor-klanten)
9. [Implementatie Roadmap](#9-implementatie-roadmap)

---

## 1. Kernprincipes

### Verantwoordelijkheidsverdeling

| Wij (Chef Data) | Klant |
|-----------------|-------|
| Beveiligde API-verbinding | Keuze AI-provider |
| Data correct doorsturen | Privacy-instellingen AI-provider |
| GDPR-compliant als verwerker | Verwerkersovereenkomst eigen klanten |
| Transparante documentatie | Verificatie AI-output |
| Proactieve informatievoorziening | Naleving eigen compliance |

### Communicatie-uitgangspunten

1. **Empowerment boven angst**: Informeer, schrik niet af
2. **Praktisch boven juridisch**: Concrete acties, niet abstracte risico's
3. **Progressieve disclosure**: Basis eerst, details op aanvraag
4. **Tone of voice**: Vriendelijk, informeel ("je/jij"), behulpzaam

---

## 1b. Waarom Zakelijke Abonnementen Essentieel Zijn

### Het Verschil: Consumer vs Business

| Aspect | Gratis/Consumer | Business/Enterprise |
|--------|-----------------|---------------------|
| **Training opt-out** | Handmatig (of niet mogelijk) | Standaard UIT |
| **Data retentie** | Lang of onbeperkt | Kort of Zero Data Retention |
| **Compliance certificaten** | Niet beschikbaar | SOC 2, ISO 27001 opvraagbaar |
| **Verwerkersovereenkomst** | Niet mogelijk | DPA beschikbaar |
| **Support** | Community | Dedicated + SLA |
| **Admin controls** | Geen | Centraal beheer |

### Privacy Voordelen van Business Abonnementen

**Voor jou als klant:**
- Je data wordt NIET gebruikt voor AI-training
- Kortere of geen data opslag
- Officiële certificaten voor je eigen compliance
- Verwerkersovereenkomst (DPA) voor je administratie

**Voor je klanten (als je een accountant/boekhouder bent):**
- Je kunt aantonen dat je zakelijke tooling gebruikt
- Certificaten beschikbaar voor audits
- Past binnen verwerkersovereenkomsten met je klanten

### Minimale Gebruikers? Deel met Collega's!

De meeste business abonnementen hebben een minimum aantal gebruikers:

| Provider | Business Abonnement | Minimum | Prijs indicatie |
|----------|---------------------|---------|-----------------|
| **Claude** | Team | 1 gebruiker | $30/gebruiker/maand |
| **Claude** | Enterprise | 5+ gebruikers | Op aanvraag |
| **ChatGPT** | Team | 2 gebruikers | $30/gebruiker/maand |
| **ChatGPT** | Enterprise | 5+ gebruikers | Op aanvraag |
| **Copilot** | Business | 1 gebruiker | $19/gebruiker/maand |
| **Copilot** | Enterprise | Contact sales | Op aanvraag |

**Tip: Deel de kosten, deel de voordelen**

Als je niet genoeg gebruikers hebt voor een Enterprise abonnement, overweeg:

1. **Collega's in je netwerk** - Andere accountants/boekhouders die ook AI willen gebruiken
2. **Bevriende experts** - IT-consultants, financieel adviseurs in je netwerk
3. **Samenwerkingsverbanden** - Kantoorgenoten, maatschapsleden

> **Privacy voordeel:** Door samen één zakelijk abonnement te delen onder één organisatie, profiteert iedereen van dezelfde enterprise-grade privacy bescherming. Beter dan ieder voor zich een consumer account.

### Certificaten Opvragen voor je Compliance Dossier

**Belangrijk voor accountants en boekhouders:** Je kunt officiële beveiligingscertificaten opvragen om aan te tonen dat je AI-provider voldoet aan strenge security-eisen. Dit is waardevol voor:
- Je eigen ISO-certificering
- Audits door klanten
- Verwerkersovereenkomsten met klanten
- Compliance dossier

#### Anthropic (Claude) - Certificaten

| Certificaat | Status | Hoe opvragen |
|-------------|--------|--------------|
| **SOC 2 Type II** | ✓ Beschikbaar | Via [trust.anthropic.com](https://trust.anthropic.com) onder NDA |
| **ISO 27001:2022** | ✓ Behaald | Via Trust Portal |
| **ISO/IEC 42001:2023** | ✓ Behaald | Eerste internationale AI-governance standaard |
| **CSA STAR Level 2** | ✓ Behaald | Cloud Security Alliance certificering |

**Hoe SOC 2 rapport opvragen:**
1. Ga naar [trust.anthropic.com](https://trust.anthropic.com)
2. Klik op "Request Access" voor het SOC 2 Type II rapport
3. Teken de NDA (digitaal)
4. Ontvang het rapport binnen 1-2 werkdagen

#### OpenAI (ChatGPT) - Certificaten

| Certificaat | Status | Hoe opvragen |
|-------------|--------|--------------|
| **SOC 2 Type II** | ✓ Beschikbaar | Via [trust.openai.com](https://trust.openai.com) |
| **ISO 27001** | ✓ Behaald | Enterprise customers |
| **GDPR DPA** | ✓ Beschikbaar | Automatisch bij Enterprise/API |

#### GitHub Copilot (Microsoft) - Certificaten

| Certificaat | Status | Hoe opvragen |
|-------------|--------|--------------|
| **SOC 2 Type II** | ✓ Via Microsoft | [Microsoft Trust Center](https://www.microsoft.com/trust-center) |
| **ISO 27001** | ✓ Behaald | Microsoft Azure certificering |
| **FedRAMP** | ✓ Behaald | Voor overheidsklanten |

### Voorbeeld Email: Stimuleer Business Abonnement

Verstuur aan klanten die consumer-achtige User-Agents gebruiken:

```html
<div style="background: #FEF3C7; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #F59E0B;">
  <h4 style="margin: 0 0 8px 0; color: #92400E;">
    💼 Tip: Overweeg een zakelijk AI-abonnement
  </h4>
  <p style="margin: 0 0 12px 0; color: #92400E; font-size: 14px;">
    We zien dat je boekhouddata verwerkt via AI. Met een zakelijk abonnement
    (Claude Team, ChatGPT Team, of Copilot Business) krijg je:
  </p>
  <ul style="margin: 0 0 12px 0; padding-left: 20px; color: #92400E; font-size: 14px;">
    <li>Garantie dat je data NIET voor training wordt gebruikt</li>
    <li>Officiële certificaten (SOC 2) voor je compliance dossier</li>
    <li>Verwerkersovereenkomst voor je administratie</li>
  </ul>
  <p style="margin: 0; color: #92400E; font-size: 14px;">
    <strong>Tip:</strong> Niet genoeg gebruikers? Deel een abonnement met
    collega-accountants of -boekhouders in je netwerk.
    <a href="https://praatmetjeboekhouding.nl/docs/ai-privacy#zakelijk" style="color: #92400E; font-weight: 600;">
      Lees meer →
    </a>
  </p>
</div>
```

---

## 2. Onboarding Communicatie

### 2.1 Setup Flow - Privacy Stap

Voeg een optionele maar zichtbare stap toe aan de setup flow:

```
[Stap 1: Connect Exact] → [Stap 2: Kies AI-tool] → [Stap 3: Configureer] → [Stap 4: Test]
                                    ↓
                          [Privacy tips voor jouw AI]
```

**UI Component: AI Provider Privacy Card**

```html
<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
  <div class="flex items-start">
    <div class="text-blue-600 mr-3">
      <svg class="w-5 h-5"><!-- info icon --></svg>
    </div>
    <div>
      <h4 class="font-medium text-blue-900">
        Je kiest zelf welke AI je gebruikt
      </h4>
      <p class="text-blue-800 text-sm mt-1">
        Wij sturen je boekhouddata naar de AI die jij configureert.
        Check de privacy-instellingen van jouw AI-provider om te bepalen
        hoe zij met je data omgaan.
      </p>
      <a href="/docs/ai-privacy" class="text-blue-600 text-sm font-medium hover:underline mt-2 inline-block">
        Bekijk privacy tips per AI →
      </a>
    </div>
  </div>
</div>
```

### 2.2 Welkomstmail Aanvulling

**Huidige mail** bevat setup instructies. **Toevoeging** (onder "Tips voor betere resultaten"):

```html
<h3 style="margin-top: 24px;">Privacy tip</h3>
<p>
  Je boekhouddata wordt verwerkt door de AI-assistent die jij configureert
  (Claude, ChatGPT, Copilot, etc.). Elk van deze providers heeft eigen
  privacy-instellingen.
</p>
<p style="background: #EFF6FF; padding: 12px; border-radius: 4px; font-size: 14px;">
  <strong>Onze tip:</strong> Check bij je AI-provider of "model training"
  uitstaat voor zakelijke data.
  <a href="https://praatmetjeboekhouding.nl/docs/ai-privacy" style="color: #0066FF;">
    Bekijk instellingen per provider →
  </a>
</p>
```

### 2.3 Onboarding Day 1 - Aanvulling

Voeg toe aan de troubleshooting email:

```html
<div style="background: #F0FDF4; padding: 16px; border-radius: 8px; margin-top: 24px;">
  <h4 style="margin: 0 0 8px 0; color: #166534;">Privacy check gedaan?</h4>
  <p style="margin: 0; color: #166534; font-size: 14px;">
    Als je zakelijke data via AI verwerkt, check dan even de privacy-instellingen
    van je AI-provider. We hebben een
    <a href="https://praatmetjeboekhouding.nl/docs/ai-privacy" style="color: #166534; font-weight: 600;">
      handige gids per provider
    </a>
    gemaakt.
  </p>
</div>
```

---

## 3. Provider-Specifieke Privacy Settings

### 3.1 Claude (Anthropic)

| Setting | Locatie | Aanbeveling | Uitleg |
|---------|---------|-------------|--------|
| Model Training | Standaard UIT voor API | ✅ Geen actie nodig | API/Team/Enterprise data wordt niet gebruikt voor training |
| Data Retention | 30 dagen (API standaard) | ⚠️ Enterprise: vraag ZDR | Zero Data Retention beschikbaar voor enterprise |
| Conversation History | Claude.ai: aan | ⚠️ Gebruik API, niet claude.ai | Via MCP gaat data via API, niet consumer interface |
| Sub-processors | [trust.anthropic.com](https://trust.anthropic.com) | ℹ️ Informatief | AWS (primair), GCP (backup) |

**Concrete instructies voor klanten:**

```markdown
## Claude Privacy Settings

**Je gebruikt Claude correct als:**
1. Je via onze MCP-server verbindt (niet via claude.ai copy-paste)
2. Je een zakelijk Claude account hebt (Team of Enterprise)

**Actie vereist:**
- [ ] Verificeer dat je NIET handmatig data kopieert naar claude.ai
- [ ] Bij veel gevoelige data: vraag Anthropic naar Zero Data Retention

**Geen actie nodig:**
- Training opt-out: standaard uit voor API-gebruik
- EU-US transfers: gedekt door Data Privacy Framework

**Links:**
- [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)
- [Anthropic Trust Portal](https://trust.anthropic.com)
```

#### Claude Abonnementen Vergelijking

| Feature | Free (claude.ai) | Pro ($20/m) | Team ($30/m) | Enterprise |
|---------|------------------|-------------|--------------|------------|
| **Training op data** | ⚠️ Opt-out nodig | ⚠️ Opt-out nodig | ✅ Nee | ✅ Nee |
| **Data retentie** | 30+ dagen | 30+ dagen | 30 dagen | 0 dagen (ZDR) |
| **SOC 2 rapport** | ❌ | ❌ | ✅ Opvraagbaar | ✅ Opvraagbaar |
| **DPA/Verwerkersovereenkomst** | ❌ | ❌ | ✅ Automatisch | ✅ Aangepast |
| **Admin controls** | ❌ | ❌ | ✅ Team beheer | ✅ SSO, SCIM |
| **API toegang** | Beperkt | Beperkt | ✅ Onbeperkt | ✅ Onbeperkt |

**Aanbeveling voor zakelijk gebruik:**
- **Minimaal**: Claude Team ($30/gebruiker/maand)
- **Optimaal voor accountants**: Claude Enterprise (vraag offerte)

> **Tip:** Claude Team start vanaf 1 gebruiker. Geen minimum!
> Perfect voor ZZP-boekhouders.

### 3.2 ChatGPT (OpenAI)

| Setting | Locatie | Aanbeveling | Uitleg |
|---------|---------|-------------|--------|
| Model Training | Settings → Data Controls | ⚠️ **Zet UIT** | "Improve the model for everyone" uitschakelen |
| Chat History | Settings → Data Controls | 🔶 Optioneel | Uitzetten voorkomt opslag, maar verliest history |
| API vs Chat | - | ✅ Gebruik API | ChatGPT Plus ≠ API; API heeft betere privacy defaults |
| Data Processing | [openai.com/enterprise-privacy](https://openai.com/enterprise-privacy) | ℹ️ Informatief | Enterprise/API: geen training op data |

**Concrete instructies voor klanten:**

```markdown
## ChatGPT Privacy Settings

**BELANGRIJK: ChatGPT Plus ≠ OpenAI API**

Als je ChatGPT (de chat interface) gebruikt:

**Actie vereist:**
1. Open ChatGPT → Settings → Data Controls
2. Zet "Improve the model for everyone" **UIT**
3. Overweeg: "Chat history & training" **UIT** voor maximale privacy

**Bij OpenAI API gebruik (via MCP plugin):**
- [ ] Geen actie nodig - API data wordt niet voor training gebruikt
- [ ] Enterprise: vraag naar Zero Data Retention optie

**Let op:**
- Gratis/Plus accounts: data KAN voor training gebruikt worden tenzij je opt-out
- Business/Enterprise: standaard geen training op jouw data

**Links:**
- [OpenAI Data Controls](https://help.openai.com/en/articles/7730893)
- [OpenAI Enterprise Privacy](https://openai.com/enterprise-privacy)
```

#### ChatGPT Abonnementen Vergelijking

| Feature | Free | Plus ($20/m) | Team ($30/m) | Enterprise |
|---------|------|--------------|--------------|------------|
| **Training op data** | ⚠️ Ja (opt-out) | ⚠️ Ja (opt-out) | ✅ Nee | ✅ Nee |
| **Data retentie** | Onbeperkt | Onbeperkt | 30 dagen | Configureerbaar |
| **SOC 2 rapport** | ❌ | ❌ | ✅ Via Trust Center | ✅ Opvraagbaar |
| **DPA/Verwerkersovereenkomst** | ❌ | ❌ | ✅ Beschikbaar | ✅ Aangepast |
| **Admin controls** | ❌ | ❌ | ✅ Workspace beheer | ✅ SSO, SCIM |
| **HIPAA-compliance** | ❌ | ❌ | ❌ | ✅ BAA beschikbaar |

**Aanbeveling voor zakelijk gebruik:**
- **Minimaal**: ChatGPT Team ($30/gebruiker/maand, min. 2 gebruikers)
- **Optimaal**: ChatGPT Enterprise (vraag offerte)

> **Tip:** ChatGPT Team vereist minimaal 2 gebruikers.
> Deel met een collega-boekhouder om de kosten te splitsen én
> beiden te profiteren van zakelijke privacy-bescherming.

### 3.3 GitHub Copilot (Microsoft)

| Setting | Locatie | Aanbeveling | Uitleg |
|---------|---------|-------------|--------|
| Code Suggestions | Copilot Settings | ℹ️ Context | Suggestions gebaseerd op je code context |
| Telemetry | VS Code Settings | 🔶 Optioneel | "telemetry.telemetryLevel" naar "off" |
| Training Opt-out | github.com/settings/copilot | ⚠️ **Check** | "Allow GitHub to use my code snippets" UIT |
| Organization Policy | Org Admin | ✅ Aanbevolen | Org-wide opt-out via admin settings |

**Concrete instructies voor klanten:**

```markdown
## GitHub Copilot Privacy Settings

**Copilot werkt anders:**
Copilot suggereert code op basis van context. Als je boekhouddata
in je code/prompts hebt, kan dit in suggestions terechtkomen.

**Actie vereist:**
1. Ga naar github.com/settings/copilot
2. Zet "Allow GitHub to use my code snippets for product improvements" **UIT**
3. Overweeg: Copilot Business/Enterprise voor betere data controls

**Voor organisaties:**
- [ ] Stel org-wide policy in via admin settings
- [ ] Gebruik Copilot Business voor extra privacy controls

**Links:**
- [Copilot Privacy Settings](https://github.com/settings/copilot)
- [Copilot for Business Privacy](https://docs.github.com/en/copilot/overview-of-github-copilot/about-github-copilot-for-business)
```

#### GitHub Copilot Abonnementen Vergelijking

| Feature | Individual ($10/m) | Business ($19/m) | Enterprise ($39/m) |
|---------|-------------------|------------------|-------------------|
| **Training op data** | ⚠️ Opt-out nodig | ✅ Standaard uit | ✅ Standaard uit |
| **Data retentie** | Beperkt | Geen code opslag | Geen code opslag |
| **SOC 2 rapport** | Via Microsoft | ✅ Via Microsoft Trust | ✅ Opvraagbaar |
| **Admin controls** | ❌ | ✅ Org policies | ✅ Fine-grained |
| **Audit logs** | ❌ | ✅ Beschikbaar | ✅ Uitgebreid |
| **IP indemnity** | ❌ | ❌ | ✅ IP bescherming |

**Aanbeveling voor zakelijk gebruik:**
- **Minimaal**: Copilot Business ($19/gebruiker/maand)
- **Optimaal**: Copilot Enterprise als je veel custom code hebt

> **Voordeel Copilot:** Geen minimum aantal gebruikers voor Business!
> Perfect voor individuele accountants die VS Code of JetBrains gebruiken.

### 3.4 Lokale Modellen (Ollama, LM Studio, etc.)

```markdown
## Lokale Modellen Privacy

**Maximale privacy: data verlaat je machine niet**

Bij lokale modellen (Ollama, LM Studio, etc.) wordt je boekhouddata
lokaal verwerkt. Dit biedt de hoogste privacy-garantie.

**Voordelen:**
- ✅ Geen data naar externe servers
- ✅ Volledige controle over verwerking
- ✅ Geen afhankelijkheid van third-party privacy policies

**Nadelen:**
- ⚠️ Minder krachtige modellen beschikbaar
- ⚠️ Vereist technische setup
- ⚠️ Hardware requirements (GPU aanbevolen)

**Geen actie nodig** - je data blijft lokaal.
```

---

## 4. Email Personalisatie Strategie

### 4.1 User-Agent Detectie

We loggen al User-Agent per request. Hieruit kunnen we AI-provider afleiden:

| User-Agent Pattern | Provider | Detecteerbaar |
|-------------------|----------|---------------|
| `claude-ai/`, `anthropic-` | Claude | ✅ Ja |
| `openai-`, `ChatGPT-` | ChatGPT/OpenAI | ✅ Ja |
| `github-copilot`, `copilot-` | GitHub Copilot | ✅ Ja |
| `curl/`, `python-requests/` | Onbekend/Custom | ⚠️ Niet specifiek |

### 4.2 Personalisatie Strategie

**Aanbeveling: Subtiele personalisatie, niet intrusief**

| Scenario | Actie | Reden |
|----------|-------|-------|
| Welkomstmail | Generiek (niet personaliseren) | Klant heeft mogelijk nog niet verbonden |
| Day 3 email | Personaliseer indien >5 requests | Genoeg data om provider te kennen |
| Provider-wissel | GEEN alert sturen | Te intrusief, privacy-gevoelig |
| Privacy nieuws | Alleen getroffen klanten | Relevantie boven bereik |

### 4.3 Voorbeeld: Gepersonaliseerde Day 3 Email

**Detectie logica:**

```typescript
async function getPreferredProvider(userId: string): Promise<string | null> {
  const recentRequests = await db.query(`
    SELECT user_agent, COUNT(*) as count
    FROM api_usage
    WHERE user_id = ? AND timestamp > datetime('now', '-7 days')
    GROUP BY user_agent
    ORDER BY count DESC
    LIMIT 1
  `, [userId]);

  if (!recentRequests.length) return null;

  const ua = recentRequests[0].user_agent?.toLowerCase() || '';
  if (ua.includes('claude') || ua.includes('anthropic')) return 'claude';
  if (ua.includes('openai') || ua.includes('chatgpt')) return 'chatgpt';
  if (ua.includes('copilot') || ua.includes('github')) return 'copilot';
  return null;
}
```

**Gepersonaliseerde email content:**

```typescript
export function onboardingDay3EmailPersonalized(
  userName: string,
  provider: string | null
): EmailOptions {

  const providerTips: Record<string, string> = {
    claude: `
      <div style="background: #F5F3FF; padding: 12px; border-radius: 6px; margin-top: 16px;">
        <strong>💡 Claude tip:</strong> Je boekhouddata via onze API wordt niet
        gebruikt voor model training. Dit is standaard zo bij Anthropic's API.
        <a href="https://praatmetjeboekhouding.nl/docs/ai-privacy#claude" style="color: #7C3AED;">
          Meer Claude privacy info →
        </a>
      </div>
    `,
    chatgpt: `
      <div style="background: #ECFDF5; padding: 12px; border-radius: 6px; margin-top: 16px;">
        <strong>💡 ChatGPT tip:</strong> Check of "Improve model for everyone"
        uitstaat in je ChatGPT settings voor maximale privacy.
        <a href="https://praatmetjeboekhouding.nl/docs/ai-privacy#chatgpt" style="color: #059669;">
          Bekijk ChatGPT privacy instellingen →
        </a>
      </div>
    `,
    copilot: `
      <div style="background: #EFF6FF; padding: 12px; border-radius: 6px; margin-top: 16px;">
        <strong>💡 Copilot tip:</strong> Zet "code snippets for product improvements"
        uit in je GitHub Copilot settings.
        <a href="https://praatmetjeboekhouding.nl/docs/ai-privacy#copilot" style="color: #2563EB;">
          Bekijk Copilot privacy instellingen →
        </a>
      </div>
    `
  };

  const providerSection = provider ? providerTips[provider] || '' : '';

  return {
    to: '',
    subject: '5 vragen om aan je boekhouding te stellen',
    html: emailTemplate({
      title: 'Probeer deze vragen',
      content: `
        <p>Hoi${userName ? ` ${userName}` : ''},</p>
        <!-- Bestaande voorbeeldvragen content -->
        ${providerSection}
      `
    })
  };
}
```

### 4.4 Privacy News Alerts

**Wanneer versturen:**
- Significante beleidswijziging bij AI-provider
- Security incident bij AI-provider
- Nieuwe privacy features beschikbaar

**Alleen naar getroffen klanten:**

```typescript
async function sendProviderPrivacyAlert(
  provider: 'claude' | 'chatgpt' | 'copilot',
  subject: string,
  content: string
): Promise<void> {
  // Vind klanten die deze provider recent gebruikten
  const affectedUsers = await db.query(`
    SELECT DISTINCT u.email, u.name
    FROM users u
    JOIN api_usage a ON u.id = a.user_id
    WHERE a.user_agent LIKE ?
    AND a.timestamp > datetime('now', '-30 days')
  `, [`%${provider}%`]);

  for (const user of affectedUsers) {
    await sendEmail(env, {
      to: user.email,
      subject: `Privacy update: ${subject}`,
      html: emailTemplate({
        title: subject,
        content: `
          <p>Hoi${user.name ? ` ${user.name}` : ''},</p>
          <p>We zien dat je recent ${getProviderName(provider)} hebt gebruikt
          met Praat met je Boekhouding. Daarom informeren we je over het volgende:</p>
          ${content}
          <p style="font-size: 14px; color: #6B7280; margin-top: 16px;">
            Je ontvangt deze email omdat je ${getProviderName(provider)} hebt
            gebruikt in de afgelopen 30 dagen.
          </p>
        `
      })
    });
  }
}
```

---

## 5. Dashboard Informatievoorziening

### 5.1 Privacy Sectie in Dashboard

Voeg een nieuwe sectie toe aan het dashboard:

```html
<!-- Na de API Keys sectie -->
<section class="mt-8">
  <h2 class="text-lg font-semibold text-gray-900 mb-4">Privacy & AI Providers</h2>

  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <!-- Laatste provider info -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="font-medium text-gray-900">Laatst gebruikte AI</h3>
        <p class="text-sm text-gray-500">Gebaseerd op je meest recente API calls</p>
      </div>
      <div class="flex items-center">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
          <!-- Dynamisch: Claude/ChatGPT/Copilot/Onbekend -->
          Claude
        </span>
      </div>
    </div>

    <!-- Privacy status -->
    <div class="border-t border-gray-100 pt-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-green-500"><!-- check icon --></svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-gray-700">
            <strong>Data passthrough:</strong> Wij slaan geen boekhouddata op.
            Je data gaat direct naar je AI-provider.
          </p>
        </div>
      </div>

      <div class="flex items-start mt-3">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-blue-500"><!-- info icon --></svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-gray-700">
            <strong>Jouw verantwoordelijkheid:</strong> Check de privacy-instellingen
            van je AI-provider.
            <a href="/docs/ai-privacy" class="text-blue-600 hover:underline">
              Bekijk tips →
            </a>
          </p>
        </div>
      </div>
    </div>

    <!-- Quick links per provider -->
    <div class="border-t border-gray-100 pt-4 mt-4">
      <p class="text-sm font-medium text-gray-700 mb-2">Privacy settings per provider:</p>
      <div class="flex flex-wrap gap-2">
        <a href="/docs/ai-privacy#claude"
           class="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700">
          Claude
        </a>
        <a href="/docs/ai-privacy#chatgpt"
           class="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700">
          ChatGPT
        </a>
        <a href="/docs/ai-privacy#copilot"
           class="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700">
          Copilot
        </a>
        <a href="/docs/ai-privacy#local"
           class="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700">
          Lokaal
        </a>
      </div>
    </div>
  </div>
</section>
```

### 5.2 Optionele: Usage per Provider

Voor Pro/Enterprise klanten, toon breakdown per provider:

```html
<div class="mt-6">
  <h4 class="text-sm font-medium text-gray-700 mb-3">API calls per provider (deze maand)</h4>
  <div class="space-y-2">
    <div class="flex items-center">
      <span class="w-24 text-sm text-gray-600">Claude</span>
      <div class="flex-1 bg-gray-200 rounded-full h-2 mx-3">
        <div class="bg-purple-500 h-2 rounded-full" style="width: 65%"></div>
      </div>
      <span class="text-sm text-gray-600">650 calls</span>
    </div>
    <div class="flex items-center">
      <span class="w-24 text-sm text-gray-600">ChatGPT</span>
      <div class="flex-1 bg-gray-200 rounded-full h-2 mx-3">
        <div class="bg-green-500 h-2 rounded-full" style="width: 25%"></div>
      </div>
      <span class="text-sm text-gray-600">250 calls</span>
    </div>
    <div class="flex items-center">
      <span class="w-24 text-sm text-gray-600">Anders</span>
      <div class="flex-1 bg-gray-200 rounded-full h-2 mx-3">
        <div class="bg-gray-400 h-2 rounded-full" style="width: 10%"></div>
      </div>
      <span class="text-sm text-gray-600">100 calls</span>
    </div>
  </div>
</div>
```

### 5.3 Privacy Reminder Toast

Bij eerste login na lange inactiviteit (>30 dagen):

```typescript
// In dashboard page load
const lastActivity = await getLastActivityDate(user.id);
const daysSinceActive = differenceInDays(new Date(), lastActivity);

if (daysSinceActive > 30) {
  showToast({
    type: 'info',
    title: 'Welkom terug!',
    message: 'Check even of je AI-provider privacy settings nog up-to-date zijn.',
    action: {
      label: 'Bekijk tips',
      url: '/docs/ai-privacy'
    },
    duration: 10000
  });
}
```

---

## 6. Disclaimer Formuleringen

### 6.1 Kernprincipes voor Disclaimers

1. **Duidelijk maar niet juridisch jargon**
2. **Actiegericht** - wat moet de klant doen
3. **Eerlijk** - geen overdrijving of onderdrijving
4. **Passend bij context** - korter in UI, langer in docs

### 6.2 Disclaimer Varianten

**Variant A: Ultra-kort (UI tooltips, 1 zin)**

```
Je AI-provider bepaalt hoe zij met je data omgaan. Check hun privacy settings.
```

**Variant B: Kort (Email footers, 2-3 zinnen)**

```
Jouw boekhouddata wordt verwerkt door de AI-assistent die jij configureert.
Wij zorgen voor veilige doorgifte, maar de privacy-instellingen van je
AI-provider (Claude, ChatGPT, etc.) zijn jouw verantwoordelijkheid.
```

**Variant C: Medium (Setup pagina, paragraaf)**

```html
<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
  <h4 class="font-medium text-amber-900 mb-2">Over privacy en AI-providers</h4>
  <p class="text-amber-800 text-sm">
    Praat met je Boekhouding stuurt je Exact Online data door naar de
    AI-assistent die jij configureert (Claude, ChatGPT, Copilot, etc.).
    Wij slaan geen boekhouddata op en hebben geen invloed op hoe de
    AI-provider je data verwerkt.
  </p>
  <p class="text-amber-800 text-sm mt-2">
    <strong>Jouw verantwoordelijkheid:</strong> Check de privacy-instellingen
    van je gekozen AI-provider, met name instellingen voor model training
    en data retentie.
  </p>
  <a href="/docs/ai-privacy" class="text-amber-900 text-sm font-medium hover:underline mt-2 inline-block">
    Bekijk onze privacy gids per provider →
  </a>
</div>
```

**Variant D: Volledig (Documentatie/FAQ)**

```markdown
## Hoe werkt de privacy bij Praat met je Boekhouding?

### Onze rol
Wij fungeren als een "doorgeefluik" voor je Exact Online data:

1. Je vraagt iets via je AI-assistent
2. De AI roept onze API aan
3. Wij halen de relevante data op bij Exact Online
4. Wij sturen deze data terug naar je AI-assistent
5. De AI formuleert een antwoord

**Wij slaan geen boekhouddata op.** Data wordt in real-time doorgestuurd
en niet bewaard op onze servers.

### Jouw rol
Je bent zelf verantwoordelijk voor:

- **Keuze AI-provider**: Of je Claude, ChatGPT, Copilot of iets anders
  gebruikt is jouw keuze
- **Privacy-instellingen**: Elke AI-provider heeft eigen instellingen
  voor zaken als model training, data retentie en logging
- **Compliance**: Als je verwerkersovereenkomsten hebt met je eigen
  klanten, moet je zelf beoordelen of je gekozen AI-provider daaraan voldoet

### Wat wij adviseren

1. **Gebruik zakelijke accounts**: Claude Team/Enterprise, OpenAI API/Business,
   of GitHub Copilot Business bieden betere privacy defaults dan consumer accounts
2. **Check training opt-out**: Zorg dat je data niet gebruikt wordt voor
   model training (bij Claude API is dit standaard uit, bij ChatGPT moet je
   dit handmatig uitzetten)
3. **Lees de privacy policy**: We weten dat niemand dit doet, maar voor
   zakelijke boekhouddata is het wel verstandig

### Concrete stappen per provider

→ [Claude privacy settings](#claude)
→ [ChatGPT privacy settings](#chatgpt)
→ [Copilot privacy settings](#copilot)
→ [Lokale modellen](#local)
```

### 6.3 Juridische Review Checklist

Voordat disclaimers live gaan, check:

- [ ] Geen absolute garanties ("100% veilig", "volledig privé")
- [ ] Geen aansprakelijkheid voor AI-providers geaccepteerd
- [ ] Klantverantwoordelijkheid duidelijk benoemd
- [ ] Links naar volledige voorwaarden en privacy policy
- [ ] Consistent met bestaande Terms of Service (sectie 2)

---

## 7. Proactieve Communicatie

### 7.1 Wanneer Communiceren

| Trigger | Actie | Doelgroep | Kanaal |
|---------|-------|-----------|--------|
| **AI-provider beleidswijziging** | Privacy update email | Klanten die provider gebruiken | Email |
| **Security incident bij provider** | Urgente waarschuwing | Klanten die provider gebruiken | Email + Dashboard banner |
| **Nieuwe privacy features bij ons** | Feature announcement | Alle actieve klanten | Email + Blog |
| **GDPR/regelgeving wijziging** | Compliance update | Alle klanten | Email |
| **Provider voegt opt-out toe** | Positief nieuws | Klanten die provider gebruiken | Email (optioneel) |

### 7.2 Voorbeeld: Provider Beleidswijziging Email

```typescript
export function providerPolicyChangeEmail(
  userName: string,
  provider: string,
  changeTitle: string,
  changeDescription: string,
  actionRequired: boolean,
  actionSteps: string[]
): EmailOptions {
  const actionSection = actionRequired ? `
    <div style="background: #FEF3C7; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <h4 style="margin: 0 0 8px 0; color: #92400E;">Actie vereist</h4>
      <ol style="margin: 0; padding-left: 20px; color: #92400E;">
        ${actionSteps.map(step => `<li style="margin-bottom: 4px;">${step}</li>`).join('')}
      </ol>
    </div>
  ` : `
    <div style="background: #ECFDF5; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0; color: #065F46;">
        <strong>Geen actie nodig</strong> - dit is ter informatie.
      </p>
    </div>
  `;

  return {
    to: '',
    subject: `${actionRequired ? '⚠️ ' : ''}Privacy update: ${changeTitle}`,
    html: emailTemplate({
      title: `${provider} privacy wijziging`,
      content: `
        <p>Hoi${userName ? ` ${userName}` : ''},</p>

        <p>We zien dat je ${provider} gebruikt met Praat met je Boekhouding.
        ${provider} heeft recent een wijziging aangekondigd die relevant kan zijn
        voor je privacy:</p>

        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h4 style="margin: 0 0 8px 0;">${changeTitle}</h4>
          <p style="margin: 0; color: #4B5563;">${changeDescription}</p>
        </div>

        ${actionSection}

        <p style="font-size: 14px; color: #6B7280;">
          Je ontvangt deze email omdat je ${provider} hebt gebruikt met je
          boekhouddata in de afgelopen 30 dagen.
        </p>
      `,
      ctaText: 'Meer informatie',
      ctaUrl: 'https://praatmetjeboekhouding.nl/docs/ai-privacy'
    })
  };
}
```

### 7.3 Communicatie Frequentie Richtlijnen

| Type communicatie | Max frequentie | Opt-out mogelijk |
|-------------------|----------------|------------------|
| Security alerts | Geen limiet | Nee |
| Provider beleidswijzigingen | Max 2x/maand | Ja |
| Privacy tips/educatie | Max 1x/maand | Ja |
| Product updates | Max 2x/maand | Ja |

### 7.4 Email Preferences in Dashboard

```html
<section class="mt-8">
  <h2 class="text-lg font-semibold text-gray-900 mb-4">Email voorkeuren</h2>

  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div class="space-y-4">
      <label class="flex items-center">
        <input type="checkbox" checked disabled class="rounded text-blue-600">
        <span class="ml-3 text-gray-700">
          Security alerts <span class="text-gray-400 text-sm">(verplicht)</span>
        </span>
      </label>

      <label class="flex items-center">
        <input type="checkbox" checked class="rounded text-blue-600" name="email_provider_updates">
        <span class="ml-3 text-gray-700">AI-provider privacy updates</span>
      </label>

      <label class="flex items-center">
        <input type="checkbox" checked class="rounded text-blue-600" name="email_tips">
        <span class="ml-3 text-gray-700">Tips en best practices</span>
      </label>

      <label class="flex items-center">
        <input type="checkbox" checked class="rounded text-blue-600" name="email_product">
        <span class="ml-3 text-gray-700">Product updates en nieuwe features</span>
      </label>
    </div>
  </div>
</section>
```

---

## 8. Best Practice Gids voor Klanten

### 8.1 Gids Structuur

Maak een publieke pagina `/docs/ai-privacy` met de volgende structuur:

```
/docs/ai-privacy
├── Inleiding: Hoe werkt privacy bij AI-boekhouden?
├── Per provider
│   ├── Claude (Anthropic)
│   ├── ChatGPT (OpenAI)
│   ├── GitHub Copilot
│   └── Lokale modellen
├── Checklijst voor zakelijk gebruik
├── Veelgestelde vragen
└── Updates en wijzigingen
```

### 8.2 Complete Gids Content

```markdown
---
title: "Veilig AI Gebruik met Boekhouddata"
description: "Privacy best practices per AI-provider"
---

# Veilig AI Gebruik met je Boekhouddata

## Hoe het werkt

Wanneer je een vraag stelt over je boekhouding:

```
Jij → AI-assistent → Onze API → Exact Online
                  ↓
        Je boekhouddata
                  ↓
Jij ← AI-assistent ← Onze API ←
```

**Belangrijk:** Je data gaat naar de AI-provider die jij kiest.
Wij hebben daar geen controle over zodra de data onze API verlaat.

---

## Quick Start Checklist

Voordat je begint met je boekhouddata en AI:

### Basis (iedereen)
- [ ] Begrijp welke data je deelt (klantnamen, bedragen, IBAN's)
- [ ] Kies een AI-provider die past bij je privacy eisen
- [ ] Check of "model training" uitstaat

### Zakelijk gebruik (AANBEVOLEN)
- [ ] **Neem een zakelijk abonnement** (Claude Team, ChatGPT Team, Copilot Business)
- [ ] Gebruik GEEN persoonlijke gratis accounts voor boekhouddata
- [ ] Controleer of dit past binnen je verwerkersovereenkomsten
- [ ] Informeer je accountant/FG indien relevant
- [ ] Vraag het SOC 2 Type II rapport op voor je compliance dossier

### Gevoelige data
- [ ] Overweeg lokale modellen voor maximale privacy
- [ ] Vraag bij enterprise providers naar Zero Data Retention
- [ ] Masker gevoelige velden voordat je ze deelt

---

## 💼 Waarom een Zakelijk Abonnement?

**Consumer accounts (gratis/Plus) zijn NIET geschikt voor boekhouddata.**

| Risico bij consumer account | Oplossing met zakelijk abonnement |
|----------------------------|-----------------------------------|
| Data kan voor training worden gebruikt | Standaard geen training |
| Geen verwerkersovereenkomst | DPA automatisch inbegrepen |
| Geen certificaten voor audits | SOC 2 rapport opvraagbaar |
| Lange/onduidelijke data opslag | Korte retentie, ZDR beschikbaar |

### Minimum Gebruikers? Deel met Collega's!

Sommige Enterprise plannen vereisen een minimum aantal gebruikers.
**Slimme oplossing:** Deel met collega's in je netwerk!

**Wie kun je uitnodigen?**
- Collega-accountants of -boekhouders
- Kantoorgenoten of maatschapsleden
- Bevriende financieel adviseurs
- IT-consultants in je netwerk

**Voordelen van samen een abonnement:**
1. **Kosten delen** - Enterprise features voor een fractie van de prijs
2. **Betere privacy voor iedereen** - Iedereen profiteert van zakelijke bescherming
3. **Kennisdeling** - Leer van elkaars AI-gebruik
4. **Compliance** - Één SOC 2 rapport geldt voor het hele team

> **Voorbeeld:** Met 5 accountants deel je een Claude Enterprise account.
> Kosten per persoon: ~€50/maand. Voordelen: Zero Data Retention,
> aangepaste DPA, dedicated support.

### Certificaten Opvragen

**Voor je compliance dossier kun je officiële certificaten opvragen:**

#### Anthropic (Claude)
1. Ga naar [trust.anthropic.com](https://trust.anthropic.com)
2. Klik "Request Access"
3. Teken de NDA (digitaal, 2 minuten)
4. Ontvang SOC 2 Type II rapport

**Beschikbare certificaten:**
- SOC 2 Type II (jaarlijkse audit)
- ISO 27001:2022
- ISO/IEC 42001:2023 (AI-governance)
- CSA STAR Level 2

#### OpenAI (ChatGPT)
- [trust.openai.com](https://trust.openai.com) - SOC 2 rapport
- Enterprise: aangepaste compliance docs

#### Microsoft (Copilot)
- [Microsoft Trust Center](https://www.microsoft.com/trust-center)
- SOC 2, ISO 27001, FedRAMP

---

## Claude (Anthropic)

### Privacy score: ⭐⭐⭐⭐⭐

Claude via onze API biedt uitstekende privacy defaults voor zakelijk gebruik.

### Wat Anthropic NIET doet met je data:
- ❌ Geen training op API/Team/Enterprise data
- ❌ Geen delen met derden (behalve sub-processors)
- ❌ Geen opslag langer dan 30 dagen (standaard)

### Aanbevolen instellingen:

**Geen actie nodig** voor standaard API-gebruik. Data wordt niet voor
training gebruikt.

**Optioneel (enterprise):**
1. Vraag naar Zero Data Retention voor 0-dagen retentie
2. Gebruik EU-based endpoints via AWS Bedrock (Frankfurt)

### Links
- [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)
- [Trust Portal](https://trust.anthropic.com)
- [API Terms](https://www.anthropic.com/legal/commercial-terms)

---

## ChatGPT (OpenAI)

### Privacy score: ⭐⭐⭐⭐ (met juiste settings)

ChatGPT vereist handmatige opt-out voor sommige features.

### Wat je MOET checken:

#### Bij ChatGPT (chat interface):
1. Open **Settings** → **Data controls**
2. Zet **"Improve the model for everyone"** → **UIT**
3. Optioneel: **"Chat history & training"** → **UIT**

#### Bij OpenAI API:
- API data wordt NIET gebruikt voor training (geen actie nodig)

### Let op verschil:
| Account type | Training opt-out | Data retentie |
|--------------|------------------|---------------|
| Free/Plus | Handmatig uitzetten | 30 dagen |
| Team | Standaard uit | 30 dagen |
| Enterprise | Standaard uit | Configureerbaar |
| API | Standaard uit | 30 dagen |

### Links
- [OpenAI Data Controls Help](https://help.openai.com/en/articles/7730893)
- [Enterprise Privacy](https://openai.com/enterprise-privacy)

---

## GitHub Copilot

### Privacy score: ⭐⭐⭐⭐ (voor Business/Enterprise)

Copilot is primair voor code, maar kan ook boekhouddata verwerken
als je dit in prompts/context meestuurt.

### Aanbevolen instellingen:

1. Ga naar [github.com/settings/copilot](https://github.com/settings/copilot)
2. Zet **"Allow GitHub to use my code snippets for product improvements"** → **UIT**
3. Voor organisaties: stel org-wide policy in

### Copilot Business vs Individual:
| Feature | Individual | Business |
|---------|-----------|----------|
| Code suggestions training | Opt-out mogelijk | Standaard uit |
| Organization policies | Nee | Ja |
| Audit logs | Nee | Ja |

### Links
- [Copilot Privacy Settings](https://github.com/settings/copilot)
- [Copilot for Business](https://docs.github.com/en/copilot/overview-of-github-copilot/about-github-copilot-for-business)

---

## Lokale Modellen

### Privacy score: ⭐⭐⭐⭐⭐

Lokale modellen (Ollama, LM Studio, llama.cpp) bieden maximale privacy.

### Voordelen:
- ✅ Data verlaat je machine niet
- ✅ Geen afhankelijkheid van externe privacy policies
- ✅ Volledige controle

### Nadelen:
- ⚠️ Minder krachtige modellen
- ⚠️ Technische setup vereist
- ⚠️ Hardware requirements (8GB+ RAM, GPU aanbevolen)

### Aanbevolen modellen voor boekhouden:
- **Llama 3.1 8B** - Goede balans kwaliteit/snelheid
- **Mistral 7B** - Snel en efficiënt
- **Qwen2 7B** - Goed met cijfers

### Setup met Ollama:
```bash
# Installeer Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download model
ollama pull llama3.1:8b

# Configureer MCP om lokaal te verbinden
```

---

## Veelgestelde Vragen

### "Slaan jullie mijn boekhouddata op?"
Nee. Wij functioneren als doorgeefluik. Data gaat van Exact Online naar
je AI-provider zonder dat wij het opslaan.

### "Wordt mijn data gebruikt om AI te trainen?"
Dat hangt af van je AI-provider en instellingen:
- **Claude API**: Nee (standaard)
- **ChatGPT**: Alleen als je opt-out niet hebt aangezet
- **Lokaal**: Nee

### "Wat als ik een verwerkersovereenkomst heb met mijn klanten?"
Dat is jouw verantwoordelijkheid om te beoordelen. Wij bieden een
pass-through dienst. Check of je gekozen AI-provider past binnen
je verwerkersovereenkomsten.

### "Welke provider raden jullie aan voor maximale privacy?"
1. **Lokale modellen** - geen data naar externe servers
2. **Claude API** - goede defaults, EU adequaatheidsbesluit
3. **OpenAI API** - goed, maar check settings

### "Is een gratis account goed genoeg?"
**Nee, niet voor zakelijke boekhouddata.** Gratis accounts:
- Kunnen je data gebruiken voor AI-training
- Bieden geen verwerkersovereenkomst
- Hebben geen certificaten voor audits
- Geven je geen controle over data retentie

**Investeer in een zakelijk abonnement** - het verschil is €20-30/maand
en dat is het waard voor de privacy van je klanten.

### "Kan ik een zakelijk abonnement delen met collega's?"
Ja! Dit is zelfs slim:
- Enterprise plannen vereisen soms minimaal 5 gebruikers
- Door te delen krijgt iedereen enterprise-niveau privacy
- De kosten per persoon worden veel lager
- Eén SOC 2 rapport geldt voor het hele team

Zoek collega-accountants, kantoorgenoten, of bevriende experts
die ook AI willen gebruiken met boekhouddata.

### "Hoe vraag ik een SOC 2 certificaat op?"
**Voor Anthropic (Claude):**
1. Ga naar [trust.anthropic.com](https://trust.anthropic.com)
2. Klik op "Request Access"
3. Teken de NDA digitaal
4. Ontvang het rapport binnen 1-2 werkdagen

Dit rapport kun je gebruiken voor:
- Je eigen ISO-certificering
- Audits door klanten
- Compliance dossier
- Verwerkersovereenkomsten

---

## Updates

We houden deze gids up-to-date bij wijzigingen in provider policies.

| Datum | Provider | Wijziging |
|-------|----------|-----------|
| Jan 2026 | - | Initiële versie |

*Laatste update: januari 2026*
```

---

## 9. Implementatie Roadmap

### Fase 1: Documentatie (Week 1-2)

| Task | Prioriteit | Effort |
|------|------------|--------|
| `/docs/ai-privacy` pagina maken | Hoog | 4 uur |
| FAQ sectie updaten | Medium | 2 uur |
| Privacy policy link naar gids | Hoog | 0.5 uur |

### Fase 2: Email Updates (Week 2-3)

| Task | Prioriteit | Effort |
|------|------------|--------|
| Welkomstmail privacy sectie | Hoog | 1 uur |
| Day 3 email personalisatie | Medium | 3 uur |
| Provider-detection functie | Medium | 2 uur |

### Fase 3: Dashboard (Week 3-4)

| Task | Prioriteit | Effort |
|------|------------|--------|
| Privacy sectie in dashboard | Medium | 4 uur |
| Provider usage breakdown | Laag | 3 uur |
| Email preferences | Medium | 2 uur |

### Fase 4: Proactieve Communicatie (Ongoing)

| Task | Prioriteit | Effort |
|------|------------|--------|
| Provider news monitoring | Medium | 1 uur/week |
| Alert email templates | Hoog | 2 uur |
| Alert trigger systeem | Medium | 4 uur |

---

## Bijlagen

### A. Juridische Bronnen

- [EDPB Opinion 28/2024](https://edpb.europa.eu/our-work-tools/our-documents/opinion-board-art-64/opinion-282024)
- [Anthropic DPA](https://www.anthropic.com/legal/commercial-terms)
- [EU-US Data Privacy Framework](https://www.dataprivacyframework.gov)

### B. Provider Trust Portals

- [Anthropic Trust](https://trust.anthropic.com)
- [OpenAI Security](https://openai.com/security)
- [GitHub Security](https://github.com/security)

### C. Interne Referenties

- [Compliance Analyse](/docs/compliance/eu-privacy-analysis.md)
- [Privacy Policy](/privacy)
- [Terms of Service](/terms)

---

*Document versie 1.0 - Januari 2026*
*Auteur: Chef Data B.V.*
