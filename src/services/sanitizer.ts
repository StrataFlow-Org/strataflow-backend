/**
 * Input sanitization helpers to mitigate XSS and injection vectors
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escapes unsafe HTML characters in a string
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'/]/g, (match) => HTML_ENTITY_MAP[match] || match);
}

/**
 * Strips script tags, javascript: pseudo-protocols, and malicious control characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;

  return input
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: and vbscript: URIs
    .replace(/(javascript|vbscript):/gi, '')
    // Remove onload, onerror, onclick inline handler attributes
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove null bytes and non-printable control characters (except newline, tab, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Recursively sanitizes all string properties in an object or array
 */
export function sanitizePayload<T>(data: T): T {
  if (typeof data === 'string') {
    return sanitizeString(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizePayload(item)) as unknown as T;
  }

  if (data !== null && typeof data === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitizedObj[key] = sanitizePayload(value);
    }
    return sanitizedObj as unknown as T;
  }

  return data;
}

