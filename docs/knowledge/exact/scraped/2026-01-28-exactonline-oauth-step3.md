# Step 3. Get and use access tokens

**Bron:** https://support.exactonline.com/community/s/knowledge-base#All-All-DNO-Content-oauth-eol-oauth-devstep3
**Datum:** 2026-01-28
**Gescraped door:** Claude Browser Extension

---

The access token is used to authenticate your API requests. This step is only necessary when using the authorization code grant type.

## Token Request

```
POST https://start.exactonline.nl/api/oauth2/token
```

### Post Data (x-www-form-urlencoded)

```json
{
  "code": "XTzM!IAAAACbPTzQJXwFhM",
  "redirect_uri": "https://www.mycompany.com/myapplication",
  "grant_type": "authorization_code",
  "client_id": "b81cc4de-d192-400e-bcb4-09254394c52a",
  "client_secret": "n3G7KAhcv8OH"
}
```

> **Note**: When retrieving the access token, the authorization HTML code must be decoded (e.g., `%21` → `!`)

## Response

```json
{
  "access_token": "AAEAAGxWulSxg7ZT-MPQMWOqQmssMzGa…",
  "token_type": "Bearer",
  "expires_in": "600",
  "refresh_token": "Gcp7!IAAAABh4eI8DgkxRyGGyHPLLOz3y9Ss…"
}
```

## Using the Access Token

Add to authorization header:

```
Authorization: Bearer AAEAAGxWulSxg7ZT-MPQMWOqQmssMzGa…
```

## Token Management

- Access token expires after **10 minutes** (600 seconds)
- Do not request a new access token before **9 minutes 30 seconds** have passed
- Request a new token **30 seconds before** it expires
- Refresh tokens are valid for **30 days**
