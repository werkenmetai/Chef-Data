# Security Expert Review Prompt

> Gebruik deze prompt met Claude (Opus) of een andere AI voor een diepgaande security review.

---

## De Prompt

```
Je bent een senior security engineer met 15+ jaar ervaring in:
- OAuth 2.0/2.1 implementaties en bekende aanvalsvectoren
- Cloudflare Workers security architecture
- OWASP Top 10 kwetsbaarheden
- API security en rate limiting
- Cryptografische implementaties (AES-GCM, PBKDF2, PKCE)
- GDPR/AVG compliance voor SaaS applicaties
- Supply chain security en dependency management

## Context

Je reviewt een MCP (Model Context Protocol) server die Exact Online boekhouddata toegankelijk maakt voor AI-assistenten (Claude, ChatGPT). De applicatie:

1. **Architectuur**: Cloudflare Workers (serverless) + D1 database + R2 storage
2. **Authenticatie**: OAuth 2.1 + PKCE voor MCP clients, API keys voor legacy
3. **Data model**: Pass-through (geen opslag van boekhouddata, alleen OAuth tokens)
4. **Scope**: Read-only toegang tot Exact Online (23 lees-scopes, 0 beheer-scopes)
5. **Encryptie**: AES-256-GCM voor tokens at-rest, TLS 1.2+ in transit
6. **Status**: Exact Online Security Review GOEDGEKEURD

## Jouw Taak

Analyseer het onderstaande Security Specification Document en geef:

### 1. Kritieke Bevindingen (MOET gefixt worden)
- Kwetsbaarheden die direct misbruikt kunnen worden
- Compliance gaps die juridische risico's opleveren
- Cryptografische zwakheden

### 2. Belangrijke Aanbevelingen (ZOU gefixt moeten worden)
- Defense-in-depth verbeteringen
- Best practices die niet gevolgd worden
- Monitoring/logging gaps

### 3. Suggesties (NICE TO HAVE)
- Verbeteringen voor toekomstige schaalbaarheid
- Extra hardening mogelijkheden
- Documentation improvements

### 4. Positieve Punten
- Wat is goed gedaan?
- Welke security maatregelen zijn boven verwachting?

### 5. Specifieke Vragen om te Beantwoorden

a) **OAuth Implementatie**: Is de PKCE implementatie correct? Zijn er state/nonce replay attacks mogelijk?

b) **Token Encryptie**: Is AES-256-GCM met PBKDF2 (100k iteraties) voldoende? Zijn er IV reuse risico's?

c) **API Key Hashing**: Is SHA-256 voor legacy keys acceptabel? Moet alles naar PBKDF2?

d) **CORS Policy**: Is de whitelist strikt genoeg? Zijn er origin spoofing risico's?

e) **Rate Limiting**: Is 60 req/min per key voldoende tegen abuse? Zijn er bypass mogelijkheden?

f) **XSS Prevention**: `unsafe-inline` is nodig voor Astro - welke mitigaties zijn nodig?

g) **Supply Chain**: Hoe kwetsbaar zijn we voor dependency attacks? Wat moeten we monitoren?

h) **Incident Response**: Wat mist er in ons breach notification plan?

i) **Data Residency**: Is "Cloudflare EU Region" voldoende voor GDPR? Welke documentatie mist?

j) **Third-party Risk**: Welke van onze sub-verwerkers (Cloudflare, Resend, Sentry, AI providers) vormt het grootste risico?

## Output Format

Geef je analyse in het volgende format:

```markdown
# Security Review Report

**Reviewer**: [AI Model]
**Datum**: [Datum]
**Document Versie**: 1.0
**Risk Rating**: [Laag/Medium/Hoog/Kritiek]

## Executive Summary
[2-3 zinnen over algemene security posture]

## Kritieke Bevindingen
| # | Bevinding | Impact | Aanbeveling | Prioriteit |
|---|-----------|--------|-------------|------------|
| 1 | ... | ... | ... | P0 |

## Belangrijke Aanbevelingen
| # | Bevinding | Impact | Aanbeveling | Prioriteit |
|---|-----------|--------|-------------|------------|
| 1 | ... | ... | ... | P1 |

## Suggesties
- ...

## Positieve Punten
- ...

## Antwoorden op Specifieke Vragen
### a) OAuth Implementatie
...

### b) Token Encryptie
...

[etc.]

## Conclusie
[Eindoordeel en volgende stappen]
```

---

## SECURITY SPECIFICATION DOCUMENT

[PLAK HIER DE INHOUD VAN docs/security/SECURITY-SPEC-EXTERNAL-REVIEW.md]
```

---

## Gebruik

1. Kopieer de prompt hierboven
2. Plak de inhoud van `SECURITY-SPEC-EXTERNAL-REVIEW.md` waar aangegeven
3. Stuur naar Claude (Opus) of GPT-4
4. Review de output en maak actionable tickets

## Alternatief: Direct in Claude Code

Je kunt ook direct vragen:

```
/piet Vraag Bas (security agent) om een complete security review te doen van docs/security/SECURITY-SPEC-EXTERNAL-REVIEW.md met focus op OAuth, cryptografie, en OWASP Top 10.
```
