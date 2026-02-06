/**
 * Exact Online OAuth utilities
 *
 * Security features:
 * - PKCE (Proof Key for Code Exchange) for enhanced OAuth security
 * - Cryptographically secure state parameter with nonce
 * - HMAC-signed state to prevent tampering (returnUrl manipulation)
 */

export type ExactRegion = 'NL' | 'BE' | 'DE' | 'UK' | 'US' | 'ES' | 'FR';

// ============================================================================
// PKCE (Proof Key for Code Exchange) Implementation
// ============================================================================

/**
 * Generate a cryptographically secure code verifier for PKCE
 * Must be between 43-128 characters, using unreserved URI characters
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // Base64url encode without padding
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate code challenge from code verifier using SHA-256
 * This is sent to the authorization server during the auth request
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  // Base64url encode the hash
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const REGION_DOMAINS: Record<ExactRegion, string> = {
  NL: 'start.exactonline.nl',
  BE: 'start.exactonline.be',
  DE: 'start.exactonline.de',
  UK: 'start.exactonline.co.uk',
  US: 'start.exactonline.com',
  ES: 'start.exactonline.es',
  FR: 'start.exactonline.fr',
};

export function getAuthUrl(region: ExactRegion = 'NL'): string {
  return `https://${REGION_DOMAINS[region]}/api/oauth2/auth`;
}

export function getTokenUrl(region: ExactRegion = 'NL'): string {
  return `https://${REGION_DOMAINS[region]}/api/oauth2/token`;
}

export function getApiBaseUrl(region: ExactRegion = 'NL'): string {
  return `https://${REGION_DOMAINS[region]}/api/v1`;
}

export interface AuthState {
  customerId?: string;
  region: ExactRegion;
  returnUrl?: string;
  nonce: string;
  /** PKCE code verifier - stored server-side, never sent to auth server */
  codeVerifier?: string;
}

/**
 * Build OAuth authorization URL with PKCE support
 */
export async function buildAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  region: ExactRegion = 'NL',
  codeChallenge?: string
): Promise<string> {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  });

  // Add PKCE parameters if code challenge provided
  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }

  return `${getAuthUrl(region)}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 * Supports PKCE by including code_verifier if provided
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  region: ExactRegion = 'NL',
  codeVerifier?: string
): Promise<TokenResponse> {
  const body: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  };

  // Add PKCE code verifier if provided
  if (codeVerifier) {
    body.code_verifier = codeVerifier;
  }

  const response = await fetch(getTokenUrl(region), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function getCurrentUser(
  accessToken: string,
  region: ExactRegion = 'NL'
): Promise<ExactUser> {
  const response = await fetch(`${getApiBaseUrl(region)}/current/Me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get current user: ${response.status}`);
  }

  const data = await response.json() as { d: { results: ExactUser[] } };
  return data.d.results[0];
}

export async function getDivisions(
  accessToken: string,
  region: ExactRegion = 'NL',
  currentDivision?: number
): Promise<Division[]> {
  // Try multiple endpoints - Exact Online API can vary
  const baseUrl = getApiBaseUrl(region);

  // First try: /hrm/Divisions with current division (most reliable)
  if (currentDivision) {
    try {
      const response = await fetch(
        `${baseUrl}/${currentDivision}/hrm/Divisions?$select=Code,Description,HID,Customer&$orderby=Description`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json() as { d: { results: Division[] } };
        return data.d.results;
      }
    } catch (e) {
      console.log('hrm/Divisions failed, trying alternative...');
    }
  }

  // Second try: /system/Divisions (older API)
  try {
    const divPath = currentDivision ? `/${currentDivision}` : '';
    const response = await fetch(
      `${baseUrl}${divPath}/system/Divisions?$select=Code,Description,HID,Customer&$orderby=Description`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json() as { d: { results: Division[] } };
      return data.d.results;
    }
  } catch (e) {
    console.log('system/Divisions failed...');
  }

  // If all else fails, return just the current division
  if (currentDivision) {
    console.log('Using fallback: returning current division only');
    return [{
      Code: currentDivision,
      Description: `Division ${currentDivision}`,
      HID: 0,
      Customer: '',
    }];
  }

  throw new Error('Failed to get divisions from Exact Online API');
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface ExactUser {
  CurrentDivision: number;
  UserID: string;
  UserName: string;
  FullName: string;
  Email: string;
}

export interface Division {
  Code: number;
  Description: string;
  HID: number;
  Customer: string;
}

/**
 * Generate a secure random state string
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate HMAC-SHA256 signature for state
 */
async function signState(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify HMAC-SHA256 signature for state
 */
async function verifyStateSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await signState(payload, secret);
  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Encode state object to URL-safe string with HMAC signature
 * Format: <base64_state>.<hmac_signature>
 */
export async function encodeState(state: AuthState, secret?: string): Promise<string> {
  const payload = btoa(JSON.stringify(state));
  if (secret) {
    const signature = await signState(payload, secret);
    return `${payload}.${signature}`;
  }
  // Backward compatibility: return unsigned state if no secret
  return payload;
}

/**
 * Decode state string back to object, verifying HMAC signature if present
 * Throws error if signature is invalid when secret is provided
 */
export async function decodeState(encoded: string, secret?: string): Promise<AuthState> {
  // Check if state has a signature (format: payload.signature)
  const parts = encoded.split('.');
  if (parts.length === 2) {
    const [payload, signature] = parts;
    if (secret) {
      const isValid = await verifyStateSignature(payload, signature, secret);
      if (!isValid) {
        throw new Error('Invalid state signature - possible tampering detected');
      }
    }
    return JSON.parse(atob(payload));
  }

  // Unsigned state - reject if secret is configured (security enforcement)
  if (secret) {
    // Security: If we have a secret configured, we MUST have a signed state
    // Unsigned states could indicate tampering or replay attacks
    throw new Error('Invalid state format - signature required but not found');
  }

  // Only accept unsigned state if no secret is configured (development/testing only)
  return JSON.parse(atob(encoded));
}
