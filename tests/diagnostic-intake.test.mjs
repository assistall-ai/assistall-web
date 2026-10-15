import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const php = await read('diagnostic-intake.php');
const example = await read('config/assistall-secrets.example.php');

test('endpoint only accepts a signed, size-capped, JSON POST', () => {
  assert.match(php, /REQUEST_METHOD.*!==\s*'POST'/s, 'POST only');
  assert.match(php, /MAX_REQUEST_BYTES/, 'size cap constant');
  assert.match(php, /CONTENT_LENGTH.*MAX_REQUEST_BYTES/s, 'content-length checked');
  assert.match(php, /contentType\s*!==\s*'application\/json'/, 'JSON content-type only');
});

test('requests are HMAC-verified with a timestamp window and single-use nonce', () => {
  assert.match(php, /hash_hmac\('sha256'/, 'HMAC sha256');
  assert.match(php, /hash_equals\(/, 'constant-time signature compare');
  assert.match(php, /TIMESTAMP_WINDOW_SECONDS/, 'replay window');
  assert.match(php, /abs\(time\(\)\s*-\s*\(int\)\$timestamp\)/, 'timestamp freshness');
  assert.match(php, /replayed_nonce/, 'nonce replay rejected');
  assert.match(php, /HTTP_X_ASSISTALL_SIGNATURE/, 'reads signature header');
});

test('the report is redacted server-side and refused on any leak', () => {
  assert.match(php, /function redact\(/, 'server-side redactor present');
  assert.match(php, /function has_leak\(/, 'leak scanner present');
  assert.match(php, /redaction_clean'\]\s*\?\?\s*null\)\s*!==\s*true/, 'refuses when not clean');
  assert.match(php, /leak_detected_refused/, 'refuses when a detail leaks');
});

test('recipients are fixed and email injection is prevented', () => {
  assert.match(php, /admin@assistall\.ai/, 'hardcoded default recipient');
  assert.match(php, /function safe_line\(/, 'CR/LF stripped from every value');
  assert.match(php, /str_replace\(\["\\r", "\\n", "\\0"\]/, 'newline stripping');
  // Recipients must never come from the posted body.
  assert.doesNotMatch(php, /\$payload\[['"](to|cc|recipient)['"]\]/, 'no recipient from request');
});

test('endpoint is rate limited per IP and globally, with secrets off the web root', () => {
  assert.match(php, /RATE_LIMIT_PER_IP_PER_HOUR/, 'per-IP limit');
  assert.match(php, /RATE_LIMIT_GLOBAL_PER_DAY/, 'global limit');
  assert.match(php, /respond\(429/, '429 on limit');
  assert.match(php, /dirname\(__DIR__\).*\.assistall-secrets\.php/s, 'secrets outside web root');
  assert.match(php, /missing_configuration/, 'refuses without a configured secret');
});

test('no report content is persisted and security headers are set', () => {
  assert.match(php, /function security_headers\(/, 'security headers');
  assert.match(php, /Content-Security-Policy/, 'CSP set');
  // Only a request id, a code and an ip HASH are logged — never the report body.
  assert.doesNotMatch(php, /error_log\([^)]*\$body/, 'report body is never logged');
});

test('the secrets example documents the diagnostic settings', () => {
  assert.match(example, /diagnostic_hmac_secret/, 'hmac secret documented');
});
