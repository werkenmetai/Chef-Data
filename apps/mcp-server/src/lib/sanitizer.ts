/**
 * Data Sanitizer for LLM Output
 *
 * Protects sensitive data when returning financial information to the LLM.
 * Masks bank accounts, personal IDs, and other sensitive fields.
 *
 * Security considerations:
 * - IBANs are masked to show only last 4 digits
 * - BSN (Dutch social security) numbers are fully masked
 * - Email addresses are partially masked
 * - Full details can be logged for audit but not shown to LLM
 */

export interface SanitizeOptions {
  /** Mask IBAN/bank account numbers (default: true) */
  maskIban?: boolean;
  /** Mask BSN/personal ID numbers (default: true) */
  maskBsn?: boolean;
  /** Mask email addresses partially (default: false) */
  maskEmail?: boolean;
  /** Mask phone numbers (default: false) */
  maskPhone?: boolean;
  /** Fields to completely exclude from output */
  excludeFields?: string[];
  /** Custom patterns to mask */
  customPatterns?: Array<{
    pattern: RegExp;
    replacement: string | ((match: string) => string);
  }>;
}

const DEFAULT_OPTIONS: SanitizeOptions = {
  maskIban: true,
  maskBsn: true,
  maskEmail: false,
  maskPhone: false,
  excludeFields: [],
};

// Patterns for sensitive data
const PATTERNS = {
  // IBAN: 2 letter country code + 2 check digits + up to 30 alphanumeric characters
  iban: /\b([A-Z]{2}\d{2})([A-Z0-9]{4,26})([A-Z0-9]{4})\b/gi,
  // Dutch BSN: 9 digits (social security number)
  bsn: /\b\d{9}\b/g,
  // Email addresses
  email: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
  // Phone numbers (Dutch and international formats)
  phone: /(\+\d{1,3}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)(\d{3,4}[\s.-]?)(\d{3,4})/g,
  // KvK number (Dutch Chamber of Commerce): 8 digits
  kvk: /\b\d{8}\b/g,
  // BTW number (Dutch VAT): NL + 9 digits + B + 2 digits
  btw: /\bNL\d{9}B\d{2}\b/gi,
};

/**
 * Mask an IBAN, showing only the country code and last 4 digits
 * Example: NL91ABNA0417164300 -> NL91****4300
 */
function maskIban(iban: string): string {
  if (iban.length < 8) return '****' + iban.slice(-4);
  const countryAndCheck = iban.slice(0, 4);
  const lastFour = iban.slice(-4);
  return `${countryAndCheck}****${lastFour}`;
}

/**
 * Mask a BSN completely
 */
function maskBsn(bsn: string): string {
  return '*'.repeat(bsn.length);
}

/**
 * Mask an email address, showing only first char and domain
 * Example: john.doe@example.com -> j****@example.com
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.charAt(0) + '****';
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask a phone number, showing only last 4 digits
 */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return '****' + digits.slice(-4);
}

/**
 * Sanitize a string value
 */
function sanitizeString(value: string, options: SanitizeOptions): string {
  let result = value;

  if (options.maskIban) {
    result = result.replace(PATTERNS.iban, (match) => {
      return maskIban(match);
    });
  }

  if (options.maskBsn) {
    // Be careful with BSN - only mask if it looks like it's in a BSN context
    // (9 consecutive digits could be many things)
    result = result.replace(/\b(\d{9})\b/g, (match, _capture, offset, string) => {
      // Check if this is likely a BSN by looking at surrounding context
      const before = string.slice(Math.max(0, offset - 20), offset).toLowerCase();
      const isBsnContext = before.includes('bsn') || before.includes('sofi') ||
                          before.includes('burger') || before.includes('persoons');
      return isBsnContext ? maskBsn(match) : match;
    });
  }

  if (options.maskEmail) {
    result = result.replace(PATTERNS.email, (match) => maskEmail(match));
  }

  if (options.maskPhone) {
    result = result.replace(PATTERNS.phone, (match) => maskPhone(match));
  }

  // Apply custom patterns
  if (options.customPatterns) {
    for (const { pattern, replacement } of options.customPatterns) {
      if (typeof replacement === 'function') {
        result = result.replace(pattern, replacement);
      } else {
        result = result.replace(pattern, replacement);
      }
    }
  }

  return result;
}

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: unknown, options: SanitizeOptions, path: string = ''): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj, options);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => sanitizeObject(item, options, `${path}[${index}]`));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    const excludeFields = options.excludeFields || [];

    for (const [key, value] of Object.entries(obj)) {
      // Skip excluded fields
      if (excludeFields.includes(key) || excludeFields.includes(`${path}.${key}`)) {
        continue;
      }

      // Special handling for known sensitive field names
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'iban' || lowerKey === 'bankaccount' || lowerKey === 'bankrekeningnummer') {
        if (typeof value === 'string' && options.maskIban !== false) {
          result[key] = maskIban(value);
          continue;
        }
      }

      if (lowerKey === 'bsn' || lowerKey === 'sofinummer' || lowerKey === 'burgerservicenummer') {
        if (typeof value === 'string' && options.maskBsn !== false) {
          result[key] = maskBsn(value);
          continue;
        }
      }

      if ((lowerKey === 'email' || lowerKey === 'emailaddress') && options.maskEmail) {
        if (typeof value === 'string') {
          result[key] = maskEmail(value);
          continue;
        }
      }

      if ((lowerKey === 'phone' || lowerKey === 'telephone' || lowerKey === 'telefoon') && options.maskPhone) {
        if (typeof value === 'string') {
          result[key] = maskPhone(value);
          continue;
        }
      }

      result[key] = sanitizeObject(value, options, `${path}.${key}`);
    }

    return result;
  }

  return obj;
}

/**
 * Sanitize data before sending to LLM
 *
 * @param data - The data to sanitize (can be any type)
 * @param options - Sanitization options
 * @returns Sanitized copy of the data
 */
export function sanitize<T>(data: T, options: Partial<SanitizeOptions> = {}): T {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  return sanitizeObject(data, mergedOptions, '') as T;
}

/**
 * Create a sanitizer with preset options
 */
export function createSanitizer(defaultOptions: Partial<SanitizeOptions> = {}) {
  const mergedDefaults = { ...DEFAULT_OPTIONS, ...defaultOptions };

  return {
    sanitize: <T>(data: T, options: Partial<SanitizeOptions> = {}): T => {
      return sanitize(data, { ...mergedDefaults, ...options });
    },
    withOptions: (options: Partial<SanitizeOptions>) => createSanitizer({ ...mergedDefaults, ...options }),
  };
}

/**
 * Pre-configured sanitizer for financial data
 * - Masks IBANs
 * - Masks BSNs
 * - Preserves emails (needed for business context)
 */
export const financialSanitizer = createSanitizer({
  maskIban: true,
  maskBsn: true,
  maskEmail: false,
  maskPhone: false,
});

/**
 * Strict sanitizer that masks all sensitive fields
 */
export const strictSanitizer = createSanitizer({
  maskIban: true,
  maskBsn: true,
  maskEmail: true,
  maskPhone: true,
});
