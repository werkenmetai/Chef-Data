# Finance Versie Tracking

> **Beheerder:** Jan (Finance Ops)
> **Laatst bijgewerkt:** 2026-01-28

## Huidige Integraties

| Service | Doel | Status |
|---------|------|--------|
| Stripe | Payments & Subscriptions | Actief |
| Exact Online | Eigen boekhouding | Actief |
| Resend | Invoice emails | Actief |

## API Versies

| API | Versie | Notities |
|-----|--------|----------|
| Stripe API | 2024-12-18 | Laatste stabiele |
| Exact Online | - | Geen versioning |

## Subscription Tiers

| Tier | ID | Prijs | Status |
|------|-----|-------|--------|
| Free | - | 0 | Actief |
| Pro Monthly | `price_xxx` | 49 | Actief |
| Pro Yearly | - | Gepland | - |

## Database Tabellen

Finance data zit in:
- `users.plan` - Subscription tier
- `users.stripe_customer_id` - Stripe koppeling
- `users.api_calls_used` - Usage tracking
- `api_usage` - Detailed usage logs

Zie `docs/knowledge/backend/DATABASE.md` voor schema.

---

## Wijzigingslog

| Datum | Wijziging | Door |
|-------|-----------|------|
| 2026-01-28 | Initieel document | Piet |
