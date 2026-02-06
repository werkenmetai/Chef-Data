# AI Agents Documentation

How the AI agents work and how to configure them.

## Overview

This project uses AI agents for automated operations:

1. **Support Agent** - Handles L1/L2 customer support
2. **DevOps Agent** - Fixes bugs and creates PRs

## Support Agent

### Triggers
- New support ticket in Linear
- Customer email via Intercom
- Self-service chat widget

### Capabilities
- Search documentation
- Check customer connection status
- View customer error logs (last 24h)
- Trigger re-authentication flow
- Apply known issue workarounds
- Respond to customers
- Escalate to DevOps agent

### Limitations
- Cannot modify code
- Cannot access other customers' data
- Cannot process refunds/billing

### Configuration

Set the following secrets in GitHub:
- `ANTHROPIC_API_KEY` - For Claude API access
- `LINEAR_API_KEY` - For ticket management
- `INTERCOM_TOKEN` - For customer messaging

## DevOps Agent

### Triggers
- Sentry error alerts
- Escalations from Support Agent
- Manual workflow dispatch

### Capabilities
- Read source code
- Analyze Sentry errors
- Search GitHub issues/PRs
- Modify tool files
- Run tests
- Create pull requests
- Deploy to staging
- Update known_issues

### Limitations
- Cannot modify auth/security code
- Cannot change database schema
- Cannot access customer tokens
- Cannot deploy to production without approval

### Configuration

Set the following secrets in GitHub:
- `ANTHROPIC_API_KEY` - For Claude API access
- `SENTRY_AUTH_TOKEN` - For error details
- `GITHUB_TOKEN` - For code operations

## Workflow

```
Customer Issue
      │
      ▼
[Support Agent]
      │
      ├── Resolved? ──Yes──> Close ticket
      │
      ▼ No
[Escalate to DevOps]
      │
      ▼
[DevOps Agent]
      │
      ├── Can fix? ──Yes──> Create PR
      │                          │
      │                          ▼
      │                    [Human Review]
      │                          │
      │                          ▼
      │                    [Deploy to Staging]
      │                          │
      │                          ▼
      │                    [Notify Support Agent]
      │
      ▼ No
[Escalate to Human]
```

## Human Intervention

Humans are needed for:
- PR review and approval (15 min/day)
- Production deployments
- Billing/refunds
- Strategic decisions
- Security-related changes
- New feature development

## Monitoring

Track agent performance via:
- GitHub Actions logs
- Sentry for errors
- Grafana metrics
- Linear ticket statistics
