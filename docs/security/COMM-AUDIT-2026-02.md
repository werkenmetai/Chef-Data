# Communication System Security Audit

**Audit ID:** COMM-AUDIT-2026-02
**Auditor:** Bas (Security Expert)
**Datum:** 2026-02-02
**Status:** Completed

---

## Executive Summary

Dit rapport bevat de security audit bevindingen voor het interne berichtensysteem. Er zijn **2 HIGH**, **3 MEDIUM**, en **2 LOW** severity issues gevonden. De meest kritieke issues betreffen ontbrekende rate limiting en een XSS kwetsbaarheid in de admin email functie.

### Severity Overzicht

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 2 |
| MEDIUM | 3 |
| LOW | 2 |

---

## Geauditeerde Bestanden

1. `apps/auth-portal/src/pages/api/messages/send.ts`
2. `apps/auth-portal/src/pages/api/admin/reply.ts`
3. `apps/auth-portal/src/pages/api/preferences/email.ts`
4. Database migrations:
   - `0008_support_system.sql`
   - `0018_communication_events.sql`
   - `0006_add_email_preferences.sql`
   - `0025_email_support_notifications.sql`

---

## Bevindingen

### COMM-SEC-001: XSS in Admin Alert Email

**Severity:** HIGH
**File:** `apps/auth-portal/src/pages/api/messages/send.ts`
**Lines:** 112-125

**Beschrijving:**
User input (`session.user.email`, `session.user.name`, `subject`, `content`) wordt direct in HTML ingevoegd zonder escaping bij het versturen van admin alert emails.

```typescript
const alertMessage = `
  <strong>Van:</strong> ${session.user.email}<br>
  <strong>Naam:</strong> ${session.user.name || 'Niet opgegeven'}<br>
  <strong>Categorie:</strong> ${category || 'general'}<br>
  <strong>Onderwerp:</strong> ${subject.trim()}<br>
  <strong>Bericht:</strong><br>
  <div style="background: #f3f4f6; padding: 12px; border-radius: 4px; margin-top: 8px;">
    ${content.trim().replace(/\n/g, '<br>')}
  </div>
`;
```

**Impact:**
Een aanvaller kan via een kwaadaardig bericht XSS injecteren in admin email clients die HTML renderen. Dit kan leiden tot:
- Phishing via vervalste links
- Session hijacking bij sommige email clients
- Credential harvesting

**Aanbeveling:**
Gebruik `escapeHtml()` uit `lib/security.ts` voor alle user-supplied content:

```typescript
import { escapeHtml } from '../../../lib/security';
// ...
const alertMessage = `
  <strong>Van:</strong> ${escapeHtml(session.user.email)}<br>
  <strong>Naam:</strong> ${escapeHtml(session.user.name || 'Niet opgegeven')}<br>
  // etc.
`;
```

---

### COMM-SEC-002: Ontbrekende Rate Limiting

**Severity:** HIGH
**Files:**
- `apps/auth-portal/src/pages/api/messages/send.ts`
- `apps/auth-portal/src/pages/api/admin/reply.ts`
- `apps/auth-portal/src/pages/api/preferences/email.ts`

**Beschrijving:**
Geen van de geauditeerde endpoints implementeert rate limiting. Dit maakt de endpoints kwetsbaar voor:

- **Denial of Service:** Een aanvaller kan de database en email queue overbelasten
- **Email Bombing:** Onbeperkt versturen van support berichten
- **Brute Force:** Geen beperking op het aantal requests per gebruiker

**Impact:**
- Database kan overspoeld worden met berichten
- Email quota's kunnen uitgeput raken
- Serverkosten kunnen oplopen door abuse

**Aanbeveling:**
Implementeer rate limiting voor alle message endpoints:

```typescript
// Voorbeeld: max 5 berichten per uur per gebruiker
const RATE_LIMIT = {
  messages_send: { max: 5, windowMinutes: 60 },
  admin_reply: { max: 50, windowMinutes: 60 },
  preferences: { max: 10, windowMinutes: 60 },
};
```

---

### COMM-SEC-003: Message Content Lengte Validatie

**Severity:** MEDIUM
**Files:**
- `apps/auth-portal/src/pages/api/messages/send.ts`
- `apps/auth-portal/src/pages/api/admin/reply.ts`

**Beschrijving:**
Er is geen maximale lengte validatie voor `content` en `subject` velden.

```typescript
// send.ts - alleen check op niet-leeg
if (!content || typeof content !== 'string' || content.trim().length === 0) {
  // error
}
```

```typescript
// reply.ts - alleen required check
if (!toEmail || !subject || !content) {
  // error
}
```

**Impact:**
- Aanvallers kunnen extreem grote payloads versturen
- Database storage kan misbruikt worden
- Email delivery kan falen bij te grote content

**Aanbeveling:**
Voeg lengte validatie toe:

```typescript
const MAX_SUBJECT_LENGTH = 200;
const MAX_CONTENT_LENGTH = 10000;

if (subject.length > MAX_SUBJECT_LENGTH) {
  return error('Onderwerp is te lang (max 200 tekens)');
}
if (content.length > MAX_CONTENT_LENGTH) {
  return error('Bericht is te lang (max 10.000 tekens)');
}
```

---

### COMM-SEC-004: Category Input Validatie

**Severity:** MEDIUM
**File:** `apps/auth-portal/src/pages/api/messages/send.ts`
**Lines:** 65-70, 81

**Beschrijving:**
De `category` parameter wordt niet gevalideerd tegen een whitelist. De database constraint (`CHECK (category IN ('connection', 'billing', 'bug', 'feature', 'account', 'other'))`) zit alleen op de `support_conversations` tabel, maar de code schrijft de raw category ook naar `communication_events.metadata`.

```typescript
// Geen validatie van category
metadata: JSON.stringify({ category, user_email: session.user.email, user_name: session.user.name }),
```

**Impact:**
- Mogelijke data inconsistentie
- Onverwachte waarden in metadata JSON

**Aanbeveling:**
Valideer category tegen een whitelist:

```typescript
const VALID_CATEGORIES = ['connection', 'billing', 'bug', 'feature', 'account', 'other', 'feedback', 'question', 'general'];
const sanitizedCategory = VALID_CATEGORIES.includes(category) ? category : 'general';
```

---

### COMM-SEC-005: Error Message Information Disclosure

**Severity:** MEDIUM
**Files:** All three API endpoints

**Beschrijving:**
Error responses kunnen interne foutmeldingen lekken naar clients:

```typescript
// send.ts line 141
error: error instanceof Error ? error.message : 'Onbekende fout',
```

**Impact:**
Stack traces of interne foutmeldingen kunnen informatie over het systeem onthullen aan aanvallers.

**Aanbeveling:**
Log details server-side, retourneer generieke foutmeldingen:

```typescript
console.error('Send message error:', error);
return new Response(
  JSON.stringify({
    success: false,
    error: 'Er is een fout opgetreden. Probeer het later opnieuw.',
  }),
  { status: 500 }
);
```

---

### COMM-SEC-006: Email Validatie Regex Te Permissief

**Severity:** LOW
**File:** `apps/auth-portal/src/pages/api/admin/reply.ts`
**Line:** 105

**Beschrijving:**
De email validatie regex is vrij basis:

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

Dit accepteert emails zoals `a@b.c` die technisch ongeldig kunnen zijn.

**Impact:**
Lage impact - alleen admins kunnen dit endpoint gebruiken en de Resend API zal ongeldige emails afwijzen.

**Aanbeveling:**
Overweeg een meer robuuste email validatie of vertrouw op de email provider's validatie.

---

### COMM-SEC-007: Sensitive Data in Console Logs

**Severity:** LOW
**Files:** All three API endpoints

**Beschrijving:**
Error logging kan indirect sensitive data bevatten via het error object:

```typescript
console.error('Send message error:', error);
console.error('Admin reply error:', error);
console.error('Get email preferences error:', error);
console.error('Update email preferences error:', error);
```

**Impact:**
Als errors user data bevatten (bijv. in stack traces), kan dit in server logs terechtkomen.

**Aanbeveling:**
Structureer logging om PII te vermijden:

```typescript
console.error('Send message error:', {
  errorType: error instanceof Error ? error.name : 'unknown',
  errorMessage: error instanceof Error ? error.message : 'unknown',
  userId: session.user.id, // geen email/naam
});
```

---

## Positieve Bevindingen

De volgende security practices zijn correct geimplementeerd:

### SQL Injection Preventie
Alle database queries gebruiken parameterized queries via D1's `.bind()` methode:

```typescript
// send.ts - Correct
await env.DB.prepare(`
  INSERT INTO support_conversations (id, user_id, subject, status, priority, category, created_at, updated_at)
  VALUES (?, ?, ?, 'open', 'normal', ?, datetime('now'), datetime('now'))
`).bind(conversationId, session.user.id, subject.trim(), category || 'general').run();
```

### Authentication Checks
Alle endpoints valideren sessie voordat acties worden uitgevoerd:

```typescript
// Correct pattern in alle files
const sessionId = cookies.get('session_id')?.value;
if (!sessionId) {
  return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
}
const session = await db.validateSession(sessionId);
if (!session) {
  return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
}
```

### Admin Authorization
Het admin/reply endpoint controleert expliciet admin rechten:

```typescript
// reply.ts - Correct
const adminEmails = (env.ADMIN_EMAILS || '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter((e: string) => e.length > 0);
const isAdmin = adminEmails.includes(session.user.email.toLowerCase());
if (!isAdmin) {
  return new Response(JSON.stringify({ error: 'Forbidden - admin access required' }), { status: 403 });
}
```

### XSS Sanitization in Admin Reply
Het reply endpoint gebruikt correct `escapeHtml()` voor email content:

```typescript
// reply.ts - Correct
import { escapeHtml } from '../../../lib/security';
// ...
const paragraphs = options.content
  .split('\n\n')
  .map(p => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
  .join('');
```

### Database Schema Constraints
De database migrations bevatten goede constraints:

```sql
-- support_conversations
status TEXT DEFAULT 'open' CHECK (status IN ('open', 'waiting_user', 'waiting_support', 'resolved', 'closed'))
priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
category TEXT CHECK (category IN ('connection', 'billing', 'bug', 'feature', 'account', 'other'))

-- communication_events
type TEXT NOT NULL CHECK (type IN ('email', 'support', 'feedback'))
direction TEXT NOT NULL CHECK (direction IN ('in', 'out'))
```

---

## Aanbevolen Acties (Prioriteit)

1. **[HIGH] COMM-SEC-001:** Implementeer `escapeHtml()` in send.ts admin alert
2. **[HIGH] COMM-SEC-002:** Implementeer rate limiting voor alle endpoints
3. **[MEDIUM] COMM-SEC-003:** Voeg content lengte validatie toe
4. **[MEDIUM] COMM-SEC-004:** Valideer category tegen whitelist
5. **[MEDIUM] COMM-SEC-005:** Generaliseer error responses
6. **[LOW] COMM-SEC-007:** Structureer logging om PII te vermijden

---

## Audit Checklist Status

| Check | Status | Notes |
|-------|--------|-------|
| Input validation op message content | PARTIAL | Mist lengte validatie |
| XSS sanitization bij opslag en weergave | PARTIAL | send.ts admin alert mist escaping |
| Rate limiting op endpoints | FAIL | Geen rate limiting geimplementeerd |
| Auth checks op alle routes | PASS | Correct geimplementeerd |
| SQL injection preventie | PASS | Parameterized queries |
| Sensitive data in logs | WARN | Console.error met raw errors |

---

## Conclusie

Het communicatiesysteem heeft een solide basis met correcte authenticatie, autorisatie, en SQL injection preventie. De hoogste prioriteit issues zijn de ontbrekende rate limiting en de XSS kwetsbaarheid in de admin alert emails. Deze moeten opgelost worden voordat het systeem in productie gaat of uitgebreid wordt.

**Volgende audit:** Na implementatie van fixes, aanbevolen binnen 2 weken.

---

*Generated by Security Audit Agent - Bas*
