# Exact Online OAuth2 Implementation Overview

**Bron:** https://support.exactonline.com/community/s/knowledge-base#All-All-DNO-Content-oauth-eol-oauth-dev-impleovervw
**Datum:** 2026-01-28
**Gescraped door:** Claude Browser Extension

---

## OAuth2 Actors

1. **Client**: the third-party application that wants to access the protected resource
2. **Resource owner**: the user who grants access to the protected resource
3. **Authorization server**: the service provider that issues tokens for valid authorization grants
4. **Resource server**: the API server used to access the protected resource

## Process Flow

When you use OAuth2, a client issues an access token from Exact Online which is presented to a resource owner by showing a login screen followed by a consent screen. In the consent screen users will also define which divisions can be retrieved by API.

Once the resource owner has been authenticated, the authorization flow starts. When approved, the authorization server passes an authorization code to the resource owner, which can exchange this code for an access token.

## Important Notes

- Starting July 2021, refresh tokens will only be valid for **30 days**
- If your refresh token has expired, you must obtain a new refresh token through the authorization code grant type flow
- If the app is not used in 30 days, you must make a new authorization request to the user

## Data Persistency

Store the client secret and refresh token in a secure and encrypted way. The refresh token actually reflects the credentials of the user who authorized access.

## Division Level Scoping

Users may define which divisions can be retrieved by API in the consent screen. API calls are limited to divisions within the user's scope.
