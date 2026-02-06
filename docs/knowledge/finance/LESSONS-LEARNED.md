# Finance Lessons Learned

> **Beheerder:** Jan (Finance Ops)
> **Domein:** Billing, Subscriptions, Metrics, Compliance
> **Laatst bijgewerkt:** 2026-01-28

## Hoe Lessons Toevoegen

```markdown
## Lesson: [Korte titel]

**Datum:** YYYY-MM-DD
**Melder:** [Naam]
**Categorie:** Billing | Subscription | Metrics | Compliance

### Issue
[Wat ging er mis]

### Impact
[Financiele of operationele impact]

### Oplossing
[Hoe opgelost]

### Preventie
[Hoe voorkomen]

### Bron
[Ticket/incident nummer]
```

---

## Lessons

*Nog geen lessons gedocumenteerd. Eerste lesson wordt toegevoegd na eerste billing cycle.*

---

## Billing Configuratie

### Stripe Setup
| Item | Waarde | Notities |
|------|--------|----------|
| Product ID | `env.STRIPE_PRODUCT_PRO` | Pro plan |
| Price ID | `env.STRIPE_PRICE_PRO_MONTHLY` | Maandelijks |
| Webhook | `/api/webhooks/stripe` | Actief |

### Prijsmodel
| Plan | Prijs | API Calls | Features |
|------|-------|-----------|----------|
| Free | Gratis | 200/maand (~60 vragen) | Basis tools, 2 admins |
| Starter | €9/maand | 750/maand (~250 vragen) | Alle tools, 3 admins |
| Pro | €25/maand | 2.500/maand (~800 vragen) | Alle tools, 10 admins |

## Metrics Definities

| Metric | Berekening | Frequentie |
|--------|------------|------------|
| MRR | Sum(active subscriptions) | Realtime |
| Churn | Cancelled / Total start of month | Monthly |
| LTV | Average revenue / Churn rate | Monthly |
| CAC | Marketing spend / New customers | Monthly |

## Compliance Checklist

- [ ] BTW correct berekend (21% NL)
- [ ] Facturen voldoen aan eisen
- [ ] GDPR data retention policy
- [ ] Stripe PCI compliance
