import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const [html, script, php, headers, migration, edgeFunction] = await Promise.all([
  read('index.html'),
  read('assets/site.js'),
  read('demo-request.php'),
  read('.htaccess'),
  read('supabase/migrations/20260816000100_create_website_demo_leads.sql'),
  read('supabase/functions/demo-ingest/index.ts'),
]);

test('demo page mounts managed Turnstile without embedding its private secret', () => {
  assert.match(html, /name=["']assistall-turnstile-sitekey["']/);
  assert.match(html, /data-turnstile-widget/);
  assert.match(script, /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/);
  assert.doesNotMatch(html + script, /turnstile_secret|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/);
});

test('cPanel handler rejects unsafe requests and signs accepted payloads', () => {
  for (const control of ['MAX_REQUEST_BYTES', 'same_origin_request', 'cf-turnstile-response', 'hash_hmac', 'website_hmac_secret']) {
    assert.match(php, new RegExp(control.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(php, /dirname\(__DIR__\).*\.assistall-secrets\.php/s);
  assert.match(php, /\['action'\].*demo/s);
  assert.doesNotMatch(php, /service_role|SUPABASE_SECRET_KEY/);
});

test('database tables are private with forced RLS and no browser grants', () => {
  assert.match(migration, /alter table public\.demo_requests force row level security/i);
  assert.match(migration, /alter table public\.demo_rate_limit_events force row level security/i);
  assert.match(migration, /revoke all on table public\.demo_requests from public, anon, authenticated/i);
  assert.match(migration, /revoke all on table public\.demo_rate_limit_events from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /create policy/i);
  assert.match(edgeFunction, /verifyHmacSignature/);
  assert.match(edgeFunction, /hashIdentifier/);
  assert.match(migration, /purge_demo_request_data/);
});

test('an emergency form-off endpoint is ready without taking down the marketing site', async () => {
  const emergency = await read('ops/emergency/demo-request.php');
  assert.match(emergency, /503/);
  assert.match(emergency, /Retry-After/);
  assert.doesNotMatch(emergency, /Supabase|Turnstile|secret/i);
});

test('server headers constrain framing, capabilities and content sources', () => {
  assert.match(headers, /Content-Security-Policy/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /X-Frame-Options "DENY"/);
  assert.match(headers, /Permissions-Policy/);
  assert.match(headers, /Cross-Origin-Opener-Policy "same-origin"/);
});
