/**
 * Screenshot Capture & Sensitive Data Blur Library
 *
 * Client-side screenshot capture with automatic blurring of sensitive data.
 * Uses html2canvas for capturing and regex patterns for detection.
 *
 * @see docs/strategy/FEEDBACK-LOOP-STRATEGY.md
 */

/**
 * Sensitive data patterns to blur in screenshots
 * These patterns match common Dutch/EU financial identifiers
 */
export const SENSITIVE_PATTERNS = [
  // BSN (Burgerservicenummer) - 9 digits
  /\b\d{9}\b/g,

  // IBAN (Dutch format: NL + 2 digits + 4 letters + 10 digits)
  /\bNL\d{2}[A-Z]{4}\d{10}\b/gi,

  // API keys (our format: exa_ + hex)
  /\bexa_[a-f0-9]+\b/gi,

  // Bearer tokens
  /Bearer [A-Za-z0-9\-._~+\/]+=*/gi,

  // Generic API keys/tokens (common patterns)
  /\b(api[_-]?key|token|secret)[=:\s]["']?[A-Za-z0-9\-._~+\/]{16,}["']?\b/gi,

  // Email addresses (partial protection)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,

  // Credit card numbers (basic pattern)
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,

  // Phone numbers (Dutch format)
  /\b(0|\+31)[1-9]\d{8}\b/g,

  // OAuth tokens (long hex strings)
  /\b[a-f0-9]{32,}\b/gi,
];

/**
 * Error report structure for screenshot uploads
 */
export interface ErrorReport {
  id: string;
  timestamp: string;
  userId?: string;
  errorType: string;
  errorMessage: string;
  errorCode?: string;
  screenshot?: string; // Base64 encoded, blurred
  userAgent: string;
  currentPage: string;
  stackTrace?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Screenshot metadata stored in R2
 */
export interface ScreenshotMetadata {
  id: string;
  userId: string;
  feedbackId?: string;
  errorType?: string;
  errorMessage?: string;
  contentType: string;
  size: number;
  createdAt: string;
  expiresAt: string; // 30 days retention
}

/**
 * Generate a unique ID for screenshots
 */
export function generateScreenshotId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `scr_${timestamp}_${randomPart}`;
}

/**
 * Calculate expiry date (30 days from now)
 */
export function calculateExpiryDate(): string {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  return expiryDate.toISOString();
}

/**
 * Check if a string contains sensitive data
 */
export function containsSensitiveData(text: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0; // Reset regex state
    return pattern.test(text);
  });
}

/**
 * Mask sensitive data in text (for non-visual contexts)
 */
export function maskSensitiveData(text: string): string {
  let masked = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    masked = masked.replace(pattern, (match) => {
      // Keep first and last 2 chars, mask middle
      if (match.length <= 6) {
        return '*'.repeat(match.length);
      }
      return match.slice(0, 2) + '*'.repeat(match.length - 4) + match.slice(-2);
    });
  }
  return masked;
}

/**
 * Client-side blur function for canvas elements
 * This is executed in the browser after html2canvas captures the screen
 */
export function blurSensitiveRegions(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Get all text nodes and check for sensitive data
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  const sensitiveRects: DOMRect[] = [];

  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    const text = textNode.textContent || '';

    if (containsSensitiveData(text)) {
      const range = document.createRange();
      range.selectNode(textNode);
      const rects = range.getClientRects();

      for (const rect of Array.from(rects)) {
        sensitiveRects.push(rect);
      }
    }
  }

  // Apply blur to each sensitive region
  for (const rect of sensitiveRects) {
    // Get the scale factor between canvas and viewport
    const scaleX = canvas.width / window.innerWidth;
    const scaleY = canvas.height / window.innerHeight;

    // Add padding around the region
    const padding = 4;
    const x = Math.max(0, (rect.x - padding) * scaleX);
    const y = Math.max(0, (rect.y - padding) * scaleY);
    const width = Math.min(canvas.width - x, (rect.width + padding * 2) * scaleX);
    const height = Math.min(canvas.height - y, (rect.height + padding * 2) * scaleY);

    if (width > 0 && height > 0) {
      // Apply pixelation blur effect
      const pixelSize = 8;
      const imageData = ctx.getImageData(x, y, width, height);
      const data = imageData.data;

      for (let py = 0; py < height; py += pixelSize) {
        for (let px = 0; px < width; px += pixelSize) {
          // Get average color of the block
          let r = 0,
            g = 0,
            b = 0,
            a = 0;
          let count = 0;

          for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
            for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
              const i = ((py + dy) * width + (px + dx)) * 4;
              if (i < data.length - 3) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                a += data[i + 3];
                count++;
              }
            }
          }

          if (count > 0) {
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            a = Math.round(a / count);

            // Set all pixels in block to average
            for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
              for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
                const i = ((py + dy) * width + (px + dx)) * 4;
                if (i < data.length - 3) {
                  data[i] = r;
                  data[i + 1] = g;
                  data[i + 2] = b;
                  data[i + 3] = a;
                }
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, x, y);

      // Draw a subtle border to indicate redacted area
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
    }
  }

  return canvas;
}

/**
 * Additional blur for known input fields that may contain sensitive data
 */
export function getInputFieldsToBlur(): HTMLElement[] {
  const sensitiveSelectors = [
    'input[type="password"]',
    'input[name*="api"]',
    'input[name*="key"]',
    'input[name*="token"]',
    'input[name*="secret"]',
    'input[name*="bsn"]',
    'input[name*="iban"]',
    'input[name*="ssn"]',
    'input[name*="credit"]',
    'input[name*="card"]',
    'input[autocomplete="cc-number"]',
    'input[autocomplete="cc-csc"]',
    '[data-sensitive="true"]',
  ];

  const elements: HTMLElement[] = [];
  for (const selector of sensitiveSelectors) {
    elements.push(...Array.from(document.querySelectorAll<HTMLElement>(selector)));
  }

  return elements;
}

/**
 * Prepare DOM for screenshot capture
 * Returns a cleanup function to restore original state
 */
export function prepareDOMForCapture(): () => void {
  const inputsToBlur = getInputFieldsToBlur();
  const originalValues: Map<HTMLElement, string> = new Map();

  for (const input of inputsToBlur) {
    if (input instanceof HTMLInputElement) {
      originalValues.set(input, input.value);
      input.value = '*'.repeat(Math.min(input.value.length, 20));
    }
  }

  return () => {
    for (const [input, value] of originalValues) {
      if (input instanceof HTMLInputElement) {
        input.value = value;
      }
    }
  };
}

/**
 * Validate screenshot data before upload
 */
export function validateScreenshotData(base64Data: string): {
  valid: boolean;
  error?: string;
  size?: number;
} {
  // Check if it's a valid base64 image
  if (!base64Data.startsWith('data:image/')) {
    return { valid: false, error: 'Invalid image format' };
  }

  // Extract base64 content
  const base64Content = base64Data.split(',')[1];
  if (!base64Content) {
    return { valid: false, error: 'Invalid base64 data' };
  }

  // Calculate size (approximate)
  const size = Math.ceil((base64Content.length * 3) / 4);

  // Max size: 5MB
  const maxSize = 5 * 1024 * 1024;
  if (size > maxSize) {
    return { valid: false, error: 'Image too large (max 5MB)', size };
  }

  return { valid: true, size };
}

/**
 * Convert base64 to Blob for upload
 */
export function base64ToBlob(base64Data: string): Blob {
  const parts = base64Data.split(',');
  const contentType = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const base64Content = parts[1];

  const byteCharacters = atob(base64Content);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

/**
 * Get content type from base64 data
 */
export function getContentTypeFromBase64(base64Data: string): string {
  const match = base64Data.match(/^data:([^;]+);/);
  return match ? match[1] : 'image/png';
}
