import { test } from 'node:test';
import assert from 'node:assert';
import { sanitizeString, escapeHtml, sanitizePayload } from '../src/services/sanitizer.js';

test('Sanitizer Unit Tests', async (t) => {
  await t.test('escapeHtml escapes dangerous entities', () => {
    const raw = '<script>alert("xss")</script>&foo';
    const escaped = escapeHtml(raw);
    assert.strictEqual(escaped, '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;&amp;foo');
  });

  await t.test('sanitizeString strips malicious script tags and inline event handlers', () => {
    const malicious = '<script>eval("steal")</script>Hello <img src=x onerror="alert(1)"> World';
    const cleaned = sanitizeString(malicious);
    assert.ok(!cleaned.includes('<script>'));
    assert.ok(!cleaned.includes('onerror'));
    assert.ok(cleaned.includes('Hello'));
    assert.ok(cleaned.includes('World'));
  });

  await t.test('sanitizePayload cleans deep nested objects and arrays', () => {
    const input = {
      title: 'Valid Title <script>bad()</script>',
      metadata: {
        description: 'Clean desc <img src=x onerror="bad">',
        tags: ['tag1', '<script>tag2()</script>tag2'],
      },
    };

    const sanitized = sanitizePayload(input);
    assert.strictEqual(sanitized.title, 'Valid Title');
    assert.ok(!sanitized.metadata.description.includes('onerror'));
    assert.strictEqual(sanitized.metadata.tags[1], 'tag2');
  });
});

