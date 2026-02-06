-- Support System Seed Data
-- Initial patterns and knowledge articles

-- ============================================
-- AI Response Patterns
-- ============================================

-- Connection Failed Pattern
INSERT OR IGNORE INTO support_patterns (
  id, name, trigger_keywords, category,
  response_template_nl, response_template_en,
  solution_steps, related_articles, min_confidence
) VALUES (
  'pat_connection_failed',
  'Connection Failed',
  '["connection", "failed", "verbinding", "mislukt", "MCP", "werkt niet", "cannot connect", "kan niet verbinden"]',
  'connection',
  'Ik zie dat je verbindingsproblemen hebt. Laten we dit oplossen:

**Stap 1:** Ga naar je [Dashboard](/dashboard) en controleer of je Exact Online connectie actief is.

**Stap 2:** Als de connectie verlopen is, klik op "Opnieuw verbinden" en doorloop de autorisatie.

**Stap 3:** Genereer een nieuwe API key en update je configuratie.

**Werkt dit?** Klik hieronder om te laten weten of dit je probleem heeft opgelost.',
  'I see you''re having connection issues. Let''s fix this:

**Step 1:** Go to your [Dashboard](/dashboard) and check if your Exact Online connection is active.

**Step 2:** If the connection has expired, click "Reconnect" and complete the authorization.

**Step 3:** Generate a new API key and update your configuration.

**Did this work?** Click below to let me know if this solved your problem.',
  '["Check dashboard", "Reconnect Exact Online", "Regenerate API key", "Update config"]',
  '["connection-troubleshooting", "api-key-setup"]',
  0.7
);

-- Invalid API Key Pattern
INSERT OR IGNORE INTO support_patterns (
  id, name, trigger_keywords, category,
  response_template_nl, response_template_en,
  solution_steps, related_articles, min_confidence
) VALUES (
  'pat_invalid_api_key',
  'Invalid API Key',
  '["API key", "invalid", "unauthorized", "401", "ongeldig", "niet geldig", "authentication", "authenticatie"]',
  'connection',
  'Je API key lijkt niet (meer) geldig te zijn. Dit kun je oplossen:

1. Ga naar je [Dashboard](/dashboard)
2. Onder "API Keys", klik op **Nieuwe Key**
3. Kopieer de nieuwe key (begint met `exa_`)
4. Update je AI applicatie configuratie
5. Herstart de applicatie

**Let op:** Oude API keys blijven niet werken nadat je ze hebt ingetrokken.

Hulp nodig? Zie: [Setup instructies](/setup)',
  'Your API key seems to be invalid. Here''s how to fix it:

1. Go to your [Dashboard](/dashboard)
2. Under "API Keys", click **New Key**
3. Copy the new key (starts with `exa_`)
4. Update your AI application configuration
5. Restart the application

**Note:** Old API keys will not work after you revoke them.

Need help? See: [Setup instructions](/setup)',
  '["Go to dashboard", "Create new API key", "Copy key", "Update config", "Restart app"]',
  '["api-key-setup", "connection-troubleshooting"]',
  0.75
);

-- Token Expired Pattern
INSERT OR IGNORE INTO support_patterns (
  id, name, trigger_keywords, category,
  response_template_nl, response_template_en,
  solution_steps, related_articles, min_confidence
) VALUES (
  'pat_token_expired',
  'Token Expired',
  '["token", "expired", "verlopen", "refresh", "sessie", "session", "uitgelogd", "logged out"]',
  'connection',
  'Je Exact Online token is verlopen. Dit gebeurt automatisch na een bepaalde tijd voor je veiligheid.

**Oplossing:**
1. Ga naar je [Dashboard](/dashboard)
2. Bij je Exact Online connectie zie je waarschijnlijk "Verlopen" staan
3. Klik op "Opnieuw verbinden"
4. Log opnieuw in bij Exact Online
5. Je connectie is nu weer actief!

Je hoeft geen nieuwe API key te genereren - je bestaande key blijft werken.',
  'Your Exact Online token has expired. This happens automatically after a certain time for your security.

**Solution:**
1. Go to your [Dashboard](/dashboard)
2. Your Exact Online connection probably shows "Expired"
3. Click "Reconnect"
4. Log in to Exact Online again
5. Your connection is now active again!

You don''t need to generate a new API key - your existing key will continue to work.',
  '["Go to dashboard", "Check connection status", "Reconnect", "Log in to Exact", "Verify connection"]',
  '["token-refresh", "connection-troubleshooting"]',
  0.7
);

-- Rate Limit Pattern
INSERT OR IGNORE INTO support_patterns (
  id, name, trigger_keywords, category,
  response_template_nl, response_template_en,
  solution_steps, related_articles, min_confidence
) VALUES (
  'pat_rate_limit',
  'Rate Limit Exceeded',
  '["rate limit", "limiet", "too many requests", "429", "quota", "te veel", "limit bereikt"]',
  'billing',
  'Je hebt de API limiet voor deze maand bereikt.

**Jouw huidige plan:** Controleer je [Dashboard](/dashboard) voor je huidige verbruik.

**Opties:**
- **Gratis plan:** 200 requests per maand
- **Pro plan:** 25.000 requests per maand (€49/maand)
- **Enterprise:** Onbeperkt (neem contact op)

[Bekijk prijzen](/pricing) | [Upgrade nu](/pricing)

Je limiet wordt automatisch gereset aan het begin van elke maand.',
  'You have reached the API limit for this month.

**Your current plan:** Check your [Dashboard](/dashboard) for your current usage.

**Options:**
- **Free plan:** 200 requests per month
- **Pro plan:** 25,000 requests per month (€49/month)
- **Enterprise:** Unlimited (contact us)

[View pricing](/pricing) | [Upgrade now](/pricing)

Your limit will automatically reset at the beginning of each month.',
  '["Check dashboard usage", "Review plan limits", "Consider upgrade", "Wait for reset"]',
  '["pricing", "plans"]',
  0.8
);

-- Division Not Found Pattern
INSERT OR IGNORE INTO support_patterns (
  id, name, trigger_keywords, category,
  response_template_nl, response_template_en,
  solution_steps, related_articles, min_confidence
) VALUES (
  'pat_division_not_found',
  'Division Not Found',
  '["division", "administratie", "not found", "niet gevonden", "403", "forbidden", "geen toegang"]',
  'connection',
  'De opgevraagde administratie is niet gevonden of je hebt geen toegang.

**Mogelijke oorzaken:**
1. Je hebt geen rechten voor deze administratie in Exact Online
2. De administratie is verwijderd of gedeactiveerd
3. Je connectie moet opnieuw worden geautoriseerd

**Oplossing:**
1. Ga naar je [Dashboard](/dashboard)
2. Controleer welke administraties beschikbaar zijn
3. Selecteer de juiste administratie als standaard
4. Als de administratie ontbreekt: verbind opnieuw met Exact Online

Zie je de administratie wel in Exact Online maar niet hier? Neem dan contact op.',
  'The requested division was not found or you don''t have access.

**Possible causes:**
1. You don''t have permissions for this division in Exact Online
2. The division has been removed or deactivated
3. Your connection needs to be reauthorized

**Solution:**
1. Go to your [Dashboard](/dashboard)
2. Check which divisions are available
3. Select the correct division as default
4. If the division is missing: reconnect to Exact Online

Can you see the division in Exact Online but not here? Please contact us.',
  '["Check dashboard", "Verify permissions", "Select default division", "Reconnect if needed"]',
  '["divisions", "permissions"]',
  0.7
);

-- General Error Pattern
INSERT OR IGNORE INTO support_patterns (
  id, name, trigger_keywords, category,
  response_template_nl, response_template_en,
  solution_steps, related_articles, min_confidence
) VALUES (
  'pat_general_error',
  'General Error',
  '["error", "fout", "werkt niet", "doesn''t work", "probleem", "issue", "kapot", "broken"]',
  'bug',
  'Sorry dat je een probleem ervaart. Laten we dit samen oplossen.

**Probeer eerst:**
1. Ververs de pagina (Ctrl+F5 / Cmd+Shift+R)
2. Log uit en weer in
3. Controleer je [Dashboard](/dashboard) of alles groen is

**Als dat niet helpt:**
Beschrijf alstublieft:
- Wat probeerde je te doen?
- Welke foutmelding zie je precies?
- Wanneer begon dit probleem?

Met deze informatie kan ik je beter helpen!',
  'Sorry you''re experiencing an issue. Let''s solve this together.

**Try first:**
1. Refresh the page (Ctrl+F5 / Cmd+Shift+R)
2. Log out and back in
3. Check your [Dashboard](/dashboard) if everything is green

**If that doesn''t help:**
Please describe:
- What were you trying to do?
- What error message do you see exactly?
- When did this problem start?

With this information I can help you better!',
  '["Refresh page", "Log out and in", "Check dashboard", "Describe problem"]',
  '["troubleshooting"]',
  0.5
);

-- ============================================
-- Knowledge Base Articles
-- ============================================

-- Connection Troubleshooting Article
INSERT OR IGNORE INTO knowledge_articles (
  id, slug, title_nl, title_en, content_nl, content_en,
  category, tags, published, featured, sort_order
) VALUES (
  'art_connection_troubleshooting',
  'connection-troubleshooting',
  'Verbindingsproblemen oplossen',
  'Troubleshooting Connection Issues',
  '# Verbindingsproblemen oplossen

Heb je problemen met de verbinding tussen je AI assistant en Exact Online? Volg deze stappen.

## Stap 1: Controleer je Dashboard

Ga naar je [Dashboard](/dashboard) en controleer:
- Is je Exact Online connectie **Actief** (groen)?
- Is je API key nog geldig?

## Stap 2: Connectie verlopen?

Als je connectie "Verlopen" toont:
1. Klik op **Verbinding toevoegen**
2. Selecteer je regio (bijv. Nederland)
3. Log in bij Exact Online
4. Autoriseer de toegang

## Stap 3: API Key vernieuwen

Als je API key niet meer werkt:
1. Ga naar **API Keys** in je Dashboard
2. Klik op **Nieuwe Key**
3. Kopieer de nieuwe key
4. Update je AI configuratie

## Stap 4: Claude/ChatGPT herconfigureren

### Claude Desktop
1. Open Settings → Connectors
2. Verwijder de oude connector
3. Voeg een nieuwe toe met je nieuwe URL

### Claude Code (CLI)
```bash
claude mcp remove exact-online
claude mcp add --transport http exact-online [je-url]
```

## Nog steeds problemen?

Als deze stappen niet helpen, [start een gesprek](/support/new) en we helpen je verder!',
  '# Troubleshooting Connection Issues

Having trouble connecting your AI assistant to Exact Online? Follow these steps.

## Step 1: Check your Dashboard

Go to your [Dashboard](/dashboard) and check:
- Is your Exact Online connection **Active** (green)?
- Is your API key still valid?

## Step 2: Connection expired?

If your connection shows "Expired":
1. Click **Add connection**
2. Select your region (e.g., Netherlands)
3. Log in to Exact Online
4. Authorize access

## Step 3: Renew API Key

If your API key no longer works:
1. Go to **API Keys** in your Dashboard
2. Click **New Key**
3. Copy the new key
4. Update your AI configuration

## Step 4: Reconfigure Claude/ChatGPT

### Claude Desktop
1. Open Settings → Connectors
2. Remove the old connector
3. Add a new one with your new URL

### Claude Code (CLI)
```bash
claude mcp remove exact-online
claude mcp add --transport http exact-online [your-url]
```

## Still having problems?

If these steps don''t help, [start a conversation](/support/new) and we''ll assist you!',
  'connection',
  '["verbinding", "connection", "troubleshooting", "problemen"]',
  TRUE,
  TRUE,
  1
);

-- API Key Setup Article
INSERT OR IGNORE INTO knowledge_articles (
  id, slug, title_nl, title_en, content_nl, content_en,
  category, tags, published, featured, sort_order
) VALUES (
  'art_api_key_setup',
  'api-key-setup',
  'API Key instellen',
  'API Key Setup',
  '# API Key instellen

Je API key is de sleutel waarmee je AI assistant toegang krijgt tot je Exact Online data.

## Een nieuwe API key maken

1. Ga naar je [Dashboard](/dashboard)
2. Scroll naar **API Keys**
3. Klik op **Nieuwe Key**
4. Geef de key een herkenbare naam (bijv. "Claude Desktop")
5. **Kopieer de key direct** - je ziet hem maar één keer!

## Waar gebruik je de API key?

### Claude Code (aanbevolen)
```bash
claude mcp add --transport http exact-online https://api.praatmetjeboekhouding.nl/mcp --header "Authorization: Bearer [JOUW_API_KEY]"
```

### Claude Desktop
1. Ga naar Settings → Connectors
2. Klik op "Add custom connector"
3. Plak deze URL:
```
https://api.praatmetjeboekhouding.nl/mcp/[JOUW_API_KEY]
```

## Veiligheid tips

- Deel je API key **nooit** met anderen
- Elke key is uniek voor jouw account
- Trek een key in als je denkt dat hij gecompromitteerd is
- Gebruik verschillende keys voor verschillende applicaties

## Key ingetrokken of kwijt?

Geen probleem! Maak gewoon een nieuwe key aan in je Dashboard. Oude keys werken niet meer nadat ze zijn ingetrokken.',
  '# API Key Setup

Your API key is how your AI assistant gains access to your Exact Online data.

## Creating a new API key

1. Go to your [Dashboard](/dashboard)
2. Scroll to **API Keys**
3. Click **New Key**
4. Give the key a recognizable name (e.g., "Claude Desktop")
5. **Copy the key immediately** - you only see it once!

## Where to use the API key?

### Claude Code (recommended)
```bash
claude mcp add --transport http exact-online https://api.praatmetjeboekhouding.nl/mcp --header "Authorization: Bearer [YOUR_API_KEY]"
```

### Claude Desktop
1. Go to Settings → Connectors
2. Click "Add custom connector"
3. Paste this URL:
```
https://api.praatmetjeboekhouding.nl/mcp/[YOUR_API_KEY]
```

## Security tips

- **Never** share your API key with others
- Each key is unique to your account
- Revoke a key if you think it has been compromised
- Use different keys for different applications

## Key revoked or lost?

No problem! Just create a new key in your Dashboard. Old keys will no longer work after being revoked.',
  'connection',
  '["api key", "setup", "configuratie", "sleutel"]',
  TRUE,
  TRUE,
  2
);

-- Pricing & Plans Article
INSERT OR IGNORE INTO knowledge_articles (
  id, slug, title_nl, title_en, content_nl, content_en,
  category, tags, published, featured, sort_order
) VALUES (
  'art_pricing',
  'pricing-plans',
  'Prijzen en plannen',
  'Pricing and Plans',
  '# Prijzen en plannen

## Gratis plan
- **200** API requests per maand
- 1 administratie
- 3 API keys
- Community support

Perfect om te starten en de dienst uit te proberen.

## Pro plan - €49/maand
- **25.000** API requests per maand
- 5 administraties
- 10 API keys
- Prioriteit support

Ideaal voor dagelijks gebruik en kleine teams.

## Enterprise - Op aanvraag
- **Onbeperkt** requests
- Onbeperkt administraties
- Onbeperkt API keys
- Dedicated support
- Custom integraties

Voor grotere organisaties met specifieke behoeften.

## Veelgestelde vragen

### Wanneer wordt mijn limiet gereset?
Je limiet wordt automatisch gereset op de eerste dag van elke maand.

### Kan ik upgraden midden in de maand?
Ja! Bij een upgrade krijg je direct toegang tot de hogere limieten. Je betaalt pro-rata voor de resterende dagen.

### Wat gebeurt er als ik mijn limiet bereik?
Je krijgt een foutmelding en kunt geen nieuwe requests doen tot de volgende maand of tot je upgradet.

[Bekijk prijzen](/pricing)',
  '# Pricing and Plans

## Free plan
- **200** API requests per month
- 1 division
- 3 API keys
- Community support

Perfect to get started and try the service.

## Pro plan - €49/month
- **25,000** API requests per month
- 5 divisions
- 10 API keys
- Priority support

Ideal for daily use and small teams.

## Enterprise - On request
- **Unlimited** requests
- Unlimited divisions
- Unlimited API keys
- Dedicated support
- Custom integrations

For larger organizations with specific needs.

## FAQ

### When is my limit reset?
Your limit is automatically reset on the first day of each month.

### Can I upgrade mid-month?
Yes! With an upgrade you get immediate access to higher limits. You pay pro-rata for the remaining days.

### What happens when I reach my limit?
You get an error message and cannot make new requests until next month or until you upgrade.

[View pricing](/pricing)',
  'billing',
  '["prijzen", "pricing", "plans", "plannen", "limiet"]',
  TRUE,
  TRUE,
  3
);

-- Getting Started Article
INSERT OR IGNORE INTO knowledge_articles (
  id, slug, title_nl, title_en, content_nl, content_en,
  category, tags, published, featured, sort_order
) VALUES (
  'art_getting_started',
  'getting-started',
  'Aan de slag',
  'Getting Started',
  '# Aan de slag met Praat met je Boekhouding

Welkom! In een paar minuten kun je met je AI assistant vragen stellen over je Exact Online administratie.

## Stap 1: Account aanmaken

1. Ga naar [Verbinden](/connect)
2. Selecteer je regio (bijv. Nederland)
3. Klik op **Verbinden met Exact Online**
4. Log in met je Exact Online account
5. Autoriseer de toegang (alleen lezen!)

## Stap 2: API key verkrijgen

Na het verbinden kom je in je Dashboard:
1. Je ziet je verbonden administratie(s)
2. Klik op **Genereer Claude URL**
3. Kopieer het commando of de URL die verschijnt

## Stap 3: Configureer je AI assistant

### Voor Claude Code (aanbevolen)
Open een terminal en plak het commando:
```bash
claude mcp add --transport http exact-online https://api.praatmetjeboekhouding.nl/mcp --header "Authorization: Bearer [JOUW_KEY]"
```

Start Claude Code:
```bash
claude
```

### Voor Claude Desktop
1. Open Settings → Connectors
2. Klik "Add custom connector"
3. Plak je URL
4. Herstart Claude Desktop

## Stap 4: Stel je eerste vraag!

Probeer bijvoorbeeld:
- "Hoeveel omzet heb ik deze maand?"
- "Welke facturen staan nog open?"
- "Wie zijn mijn top 5 klanten?"

## Hulp nodig?

- Bekijk onze [FAQ](/faq)
- Lees de [Setup instructies](/setup)
- [Start een gesprek](/support/new) met support',
  '# Getting Started with Chat with your Books

Welcome! In a few minutes you can ask your AI assistant questions about your Exact Online administration.

## Step 1: Create account

1. Go to [Connect](/connect)
2. Select your region (e.g., Netherlands)
3. Click **Connect to Exact Online**
4. Log in with your Exact Online account
5. Authorize access (read-only!)

## Step 2: Get API key

After connecting you arrive at your Dashboard:
1. You see your connected division(s)
2. Click **Generate Claude URL**
3. Copy the command or URL that appears

## Step 3: Configure your AI assistant

### For Claude Code (recommended)
Open a terminal and paste the command:
```bash
claude mcp add --transport http exact-online https://api.praatmetjeboekhouding.nl/mcp --header "Authorization: Bearer [YOUR_KEY]"
```

Start Claude Code:
```bash
claude
```

### For Claude Desktop
1. Open Settings → Connectors
2. Click "Add custom connector"
3. Paste your URL
4. Restart Claude Desktop

## Step 4: Ask your first question!

Try for example:
- "How much revenue did I have this month?"
- "Which invoices are still open?"
- "Who are my top 5 customers?"

## Need help?

- Check our [FAQ](/faq)
- Read the [Setup instructions](/setup)
- [Start a conversation](/support/new) with support',
  'account',
  '["start", "begin", "setup", "installatie"]',
  TRUE,
  TRUE,
  0
);
