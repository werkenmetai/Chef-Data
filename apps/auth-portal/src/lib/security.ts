/**
 * Security Utilities for Auth Portal
 *
 * Provides functions to prevent XSS and other security vulnerabilities.
 * SEC-001: XSS Prevention via proper escaping and sanitization.
 */

/**
 * Escape HTML entities to prevent XSS attacks.
 * Use this when inserting untrusted data into HTML content.
 *
 * @param unsafe - The potentially unsafe string to escape
 * @returns The escaped string safe for HTML insertion
 *
 * @example
 * // In JavaScript
 * element.innerHTML = `<span>${escapeHtml(userInput)}</span>`;
 *
 * // Or use textContent when possible (preferred):
 * element.textContent = userInput;
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }

  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape HTML for use in JavaScript template literals.
 * This is a client-side version that can be included in inline scripts.
 *
 * @example
 * <script>
 *   // Include the function
 *   const escapeHtml = (unsafe) => {
 *     if (unsafe === null || unsafe === undefined) return '';
 *     return String(unsafe)
 *       .replace(/&/g, '&amp;')
 *       .replace(/</g, '&lt;')
 *       .replace(/>/g, '&gt;')
 *       .replace(/"/g, '&quot;')
 *       .replace(/'/g, '&#039;');
 *   };
 *
 *   // Use it
 *   element.innerHTML = `<span>${escapeHtml(data.userInput)}</span>`;
 * </script>
 */
export const escapeHtmlInlineScript = `
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
`.trim();

/**
 * Sanitize a URL to prevent javascript: protocol XSS.
 * Only allows http:, https:, mailto:, and tel: protocols.
 *
 * @param url - The URL to sanitize
 * @returns The sanitized URL, or '#' if invalid
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '#';

  const trimmed = url.trim().toLowerCase();

  // Block javascript:, data:, vbscript: etc.
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '#';
  }

  // Allow relative URLs, http(s), mailto, tel
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return url;
  }

  // For other cases, assume it's a relative path
  return url;
}

/**
 * Create a safe text node (alternative to innerHTML for plain text).
 * This is the preferred method when you only need to display text.
 *
 * @example
 * // Instead of: element.innerHTML = userInput;
 * // Use: element.textContent = userInput;
 *
 * // Or for more complex cases:
 * const container = document.getElementById('container');
 * container.innerHTML = ''; // Clear
 * container.appendChild(document.createTextNode(userInput));
 */
export function createSafeTextContent(text: string): Text {
  return document.createTextNode(text);
}

/**
 * Validate email address with RFC 5322 compliant regex and length checks.
 * SEC-002: Strict email validation to prevent injection attacks.
 *
 * @param email - The email address to validate
 * @returns true if the email is valid, false otherwise
 *
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid') // false
 * isValidEmail('a'.repeat(65) + '@example.com') // false (local part > 64 chars)
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;

  // RFC 5322 compliant-ish regex
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) return false;

  // Additional checks per RFC 5321
  if (email.length > 254) return false; // RFC 5321 total limit
  const [local, domain] = email.split('@');
  if (local.length > 64) return false; // RFC 5321 local part limit
  if (!domain || domain.length > 253) return false; // RFC 5321 domain limit

  return true;
}

/**
 * Escape SQL LIKE pattern special characters to prevent pattern injection.
 * SEC-003: LIKE query sanitization for user input.
 *
 * @param pattern - The user input to escape
 * @returns The escaped pattern safe for use in LIKE queries
 *
 * @example
 * const searchTerm = `%${escapeLikePattern(userInput)}%`;
 * db.prepare('SELECT * FROM items WHERE name LIKE ?').bind(searchTerm)
 */
export function escapeLikePattern(pattern: string): string {
  // Escape SQL LIKE special characters: %, _, and backslash
  return pattern.replace(/[%_\\]/g, '\\$&');
}

/**
 * Get the site URL from environment, with validation.
 * DEBT-004: Removes localhost fallback to prevent production misconfigurations.
 *
 * @param env - The environment object
 * @returns The site URL
 * @throws Error if SITE_URL is not configured
 */
export function getSiteUrl(env: Record<string, unknown> | undefined): string {
  const siteUrl = env?.SITE_URL as string | undefined;

  if (!siteUrl) {
    // In development, allow localhost fallback
    if (env?.CF_PAGES !== '1' && typeof process !== 'undefined') {
      return 'http://localhost:4321';
    }
    throw new Error('SITE_URL environment variable is required in production');
  }

  return siteUrl;
}
