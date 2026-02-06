# Backend Infrastructure Test Scenarios

**Beheerder:** Daan (Backend Specialist)
**Laatste update:** 2026-01-28

Dit document beschrijft test scenarios voor backend infrastructuur.

---

## 1. Database (D1) Tests

### 1.1 Connection CRUD
```
GIVEN: Valid user session
WHEN: User creates new Exact Online connection
THEN: Connection record created with:
  - Encrypted access_token
  - Encrypted refresh_token
  - token_expires_at (10 min from now)
  - refresh_token_expires_at (30 days from now)
  - status = 'active'
```

### 1.2 Token Refresh Flow
```
GIVEN: Connection with expired access_token
WHEN: API request is made
THEN:
  - New tokens fetched from Exact
  - Both tokens encrypted and stored
  - token_expires_at updated
  - refresh_token_expires_at updated (30 days)
  - Original request completed
```

### 1.3 Migration Compatibility
```
GIVEN: Database with schema version N
WHEN: Migration N+1 is applied
THEN:
  - Existing data preserved
  - New columns have correct defaults
  - Indexes created
  - No data loss
```

---

## 2. Authentication Tests

### 2.1 OAuth Authorization Flow
```
GIVEN: Unauthenticated user
WHEN: User clicks "Connect with Exact"
THEN:
  - Redirect to Exact consent page
  - State parameter generated and stored
  - Correct scopes requested
```

### 2.2 OAuth Callback Handling
```
GIVEN: Valid OAuth callback with code
WHEN: Callback endpoint receives request
THEN:
  - State validated
  - Code exchanged for tokens
  - User info fetched from Exact
  - Connection created/updated
  - User redirected to dashboard
```

### 2.3 Invalid State Handling
```
GIVEN: OAuth callback with invalid state
WHEN: Callback endpoint receives request
THEN:
  - Error logged
  - User shown friendly error page
  - No tokens stored
```

### 2.4 API Key Authentication
```
GIVEN: Request with valid API key header
WHEN: MCP endpoint receives request
THEN:
  - User looked up by API key
  - Connections loaded
  - Auth context attached to request
```

---

## 3. Token Security Tests

### 3.1 Token Encryption
```
GIVEN: New tokens from Exact
WHEN: Tokens are stored
THEN:
  - Encrypted with AES-256-GCM
  - Unique IV per encryption
  - Plaintext never in logs
```

### 3.2 Token Decryption
```
GIVEN: Encrypted token in database
WHEN: Token is needed for API call
THEN:
  - Decrypted correctly
  - Original value restored
  - Works with tokens from any migration version
```

### 3.3 Backwards Compatibility
```
GIVEN: Old plaintext token in database
WHEN: Token is accessed
THEN:
  - isEncrypted() returns false
  - Token used as-is
  - No crash or error
```

---

## 4. Rate Limiting Tests

### 4.1 Within Limits
```
GIVEN: User with 50/60 requests used
WHEN: User makes 1 request
THEN:
  - Request processed
  - Counter incremented
  - Rate limit headers returned
```

### 4.2 At Limit
```
GIVEN: User with 60/60 requests used
WHEN: User makes 1 request
THEN:
  - Request rejected with 429
  - Retry-After header set
  - No counter increment
```

### 4.3 Counter Reset
```
GIVEN: User at rate limit
WHEN: 1 minute passes
THEN:
  - Counter reset to 0
  - Requests allowed again
```

---

## 5. Workers Runtime Tests

### 5.1 Request Handling
```
GIVEN: Valid MCP request
WHEN: Worker receives request
THEN:
  - Response within 10ms CPU time
  - No memory leaks
  - Proper error handling
```

### 5.2 Background Tasks
```
GIVEN: Request requiring async work
WHEN: ctx.waitUntil() is used
THEN:
  - Response returned immediately
  - Background work completes
  - Errors logged but not thrown
```

### 5.3 Cold Start
```
GIVEN: Worker instance cold
WHEN: First request arrives
THEN:
  - Init completes quickly
  - Response time acceptable
  - No timeout errors
```

---

## 6. Cron Job Tests

### 6.1 Token Expiry Check
```
GIVEN: Connection with refresh_token expiring in 5 days
WHEN: Hourly cron runs
THEN:
  - Warning ticket created
  - User notified
  - expiry_alert_sent = 1
```

### 6.2 Proactive Token Refresh
```
GIVEN: Connection with access_token expiring in 4 minutes
WHEN: Hourly cron runs
THEN:
  - Token refreshed proactively
  - Both tokens updated
  - No user intervention needed
```

### 6.3 Monthly Reset
```
GIVEN: Users with various api_calls_used
WHEN: Monthly cron runs on 1st
THEN:
  - All api_calls_used reset to 0
  - rate_limit_warning_sent reset to 0
```

---

## 7. Error Handling Tests

### 7.1 Database Errors
```
GIVEN: D1 timeout or error
WHEN: Query fails
THEN:
  - Error logged with context
  - User-friendly error returned
  - No sensitive data exposed
```

### 7.2 Exact API Errors
```
GIVEN: Exact API returns error
WHEN: Tool makes API call
THEN:
  - Error logged server-side
  - Generic message to user
  - Retry logic for 429/5xx
```

### 7.3 Unhandled Errors
```
GIVEN: Unexpected exception
WHEN: Error bubbles up
THEN:
  - Caught at top level
  - 500 error returned
  - Stack trace in logs (not response)
```

---

## 8. Deploy/Migration Tests

### 8.1 Zero Downtime Deploy
```
GIVEN: Production running
WHEN: New version deployed
THEN:
  - Old workers continue serving
  - New workers take over gradually
  - No request failures
```

### 8.2 Migration Rollback
```
GIVEN: Migration N applied
WHEN: Rollback needed
THEN:
  - Down migration available
  - Data preserved
  - Schema reverted
```

---

## Regression Test Checklist

Before deploy, verify:

- [ ] OAuth flow works end-to-end
- [ ] Token refresh works
- [ ] API key auth works
- [ ] Rate limiting enforced
- [ ] Dashboard loads
- [ ] Connection management works
- [ ] Cron jobs execute
- [ ] Error pages display correctly
