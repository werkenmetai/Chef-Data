# Exact Online OAuth 2.0 Authentication

Exact Online uses OAuth 2.0 for API authentication.

## Prerequisites

1. Create an account at [Exact Online App Center](https://apps.exactonline.com)
2. Register a new application
3. Obtain your Client ID and Client Secret
4. Configure your Redirect URI

## OAuth Endpoints

| Endpoint | URL |
|----------|-----|
| Authorization | `https://start.exactonline.nl/api/oauth2/auth` |
| Token | `https://start.exactonline.nl/api/oauth2/token` |

Replace `start.exactonline.nl` with your region's domain.

## Authorization Flow

### Step 1: Request Authorization Code

Redirect user to the authorization URL:

```
GET https://start.exactonline.nl/api/oauth2/auth
  ?client_id={CLIENT_ID}
  &redirect_uri={REDIRECT_URI}
  &response_type=code
  &state={RANDOM_STATE}
```

**Parameters:**
| Parameter | Description |
|-----------|-------------|
| `client_id` | Your application's Client ID |
| `redirect_uri` | URL to redirect after authorization (must match App Center config) |
| `response_type` | Always `code` |
| `state` | Random string to prevent CSRF attacks |

### Step 2: User Authorizes

The user logs in to Exact Online and grants permission to your app.

### Step 3: Receive Authorization Code

Exact Online redirects to your `redirect_uri` with:

```
{redirect_uri}?code={AUTHORIZATION_CODE}&state={STATE}
```

**Important:** The authorization code is valid for only **3 minutes** and can only be used **once**.

### Step 4: Exchange Code for Tokens

```http
POST https://start.exactonline.nl/api/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={AUTHORIZATION_CODE}
&client_id={CLIENT_ID}
&client_secret={CLIENT_SECRET}
&redirect_uri={REDIRECT_URI}
```

**Response:**
```json
{
  "access_token": "dAjg2...",
  "token_type": "bearer",
  "expires_in": 600,
  "refresh_token": "Xk9dK..."
}
```

## Token Lifetimes

| Token | Lifetime |
|-------|----------|
| Access Token | **10 minutes** (600 seconds) |
| Refresh Token | **30 days** |
| Authorization Code | **3 minutes** |

**Note:** The 10-minute access token lifetime is unusually short. Implement automatic refresh logic.

## Refreshing Access Tokens

When the access token expires, use the refresh token to get a new one:

```http
POST https://start.exactonline.nl/api/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token={REFRESH_TOKEN}
&client_id={CLIENT_ID}
&client_secret={CLIENT_SECRET}
```

**Response:**
```json
{
  "access_token": "new_access_token...",
  "token_type": "bearer",
  "expires_in": 600,
  "refresh_token": "new_refresh_token..."
}
```

**Important:** Each refresh returns a new refresh token. Store it immediately!

## Using the Access Token

Include the access token in the `Authorization` header:

```http
GET https://start.exactonline.nl/api/v1/{division}/crm/Accounts
Authorization: Bearer {ACCESS_TOKEN}
Accept: application/json
```

## Getting the Current Division

After authentication, get the current user's division:

```http
GET https://start.exactonline.nl/api/v1/current/Me
Authorization: Bearer {ACCESS_TOKEN}
```

**Response:**
```json
{
  "d": {
    "results": [{
      "CurrentDivision": 123456,
      "UserID": "guid-here",
      "UserName": "user@example.com"
    }]
  }
}
```

## Example: Complete OAuth Flow

### TypeScript Implementation

```typescript
const EXACT_AUTH_URL = 'https://start.exactonline.nl/api/oauth2/auth';
const EXACT_TOKEN_URL = 'https://start.exactonline.nl/api/oauth2/token';

// Step 1: Build authorization URL
function buildAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state: state,
  });
  return `${EXACT_AUTH_URL}?${params}`;
}

// Step 4: Exchange code for tokens
async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<TokenResponse> {
  const response = await fetch(EXACT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}

// Refresh tokens
async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<TokenResponse> {
  const response = await fetch(EXACT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return response.json();
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}
```

## Best Practices

1. **Refresh Proactively**: Refresh the access token ~2 minutes before expiry
2. **Store Securely**: Keep tokens encrypted in your database
3. **Handle Failures**: If refresh fails, prompt user to re-authenticate
4. **Use State**: Always verify the `state` parameter to prevent CSRF
5. **Single Use**: Never reuse authorization codes

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_grant` | Code expired or already used | Request new authorization code |
| `invalid_client` | Wrong client ID/secret | Check App Center credentials |
| `redirect_uri_mismatch` | URI doesn't match | Ensure exact match including protocol |
| `401 Unauthorized` | Token expired | Refresh the access token |

## Scopes

Exact Online does not use OAuth scopes. Access is controlled through:
- User permissions in Exact Online
- App permissions set in the App Center
- Division-level access
