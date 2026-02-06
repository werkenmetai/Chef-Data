# Step 2. Set up authorization requests

**Bron:** https://support.exactonline.com/community/s/knowledge-base#All-All-DNO-Content-oauth-eol-oauth-devstep2
**Datum:** 2026-01-28
**Gescraped door:** Claude Browser Extension

---

## Authorization Request

```
GET https://start.exactonline.nl/api/oauth2/auth
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| client_id | Your registered client ID |
| redirect_uri | Your registered redirect URI (HTTPS) |
| response_type | `token` (implicit) or `code` (authorization code) |
| force_login | `1` forces user to login, ignoring active sessions |

### Example Request

```
GET https://start.exactonline.nl/api/oauth2/auth?client_id=b81cc4de-d192-400e-bcb4-09254394c52a&redirect_uri=https%3A%2F%2Fwww.mycompany.com%2Fmyapplication&response_type=code&force_login=0
```

## Response

After successful authorization, a response is sent to the redirect URI with an authorization code:

```
https://www.mycompany.com/myapplication?code=XTzM!IAAAACbPTzQJXwFhM...
```

> **Note**: The authorization code is only valid for **3 minutes**.
