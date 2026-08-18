import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const readOptional = (path) => read(path).catch((error) => error.code === 'ENOENT' ? '' : Promise.reject(error));
const [html, script, css, php, headers, migration, edgeFunction, supabaseConfig, functionConfig, denoConfig, readme, launchSecurity] = await Promise.all([
  read('index.html'),
  read('assets/site.js'),
  read('assets/page.css'),
  read('demo-request.php'),
  read('.htaccess'),
  read('supabase/migrations/20260816000100_create_website_demo_leads.sql'),
  read('supabase/functions/demo-ingest/index.ts'),
  readOptional('supabase/config.toml'),
  readOptional('supabase/functions/demo-ingest/config.toml'),
  readOptional('supabase/functions/demo-ingest/deno.json'),
  read('README.md'),
  read('docs/LAUNCH_SECURITY.md'),
]);

test('demo page mounts managed Turnstile without embedding its private secret', () => {
  assert.match(html, /name=["']assistall-turnstile-sitekey["']/);
  assert.match(html, /data-turnstile-widget/);
  assert.match(script, /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/);
  assert.doesNotMatch(html + script, /turnstile_secret|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/);
});

test('Turnstile captures and resets the explicit widget after every completed attempt', () => {
  assert.match(script, /const\s+widgetId\s*=\s*window\.turnstile\.render\(/);
  assert.match(script, /resetTurnstileWidget\([^)]*widgetId[^)]*\)/);
  assert.match(script, /catch\s*\{[\s\S]*resetTurnstileWidget[\s\S]*\}\s*finally/);
  assert.match(script, /form\.reset\(\)[\s\S]*resetTurnstileWidget/);
});

test('Edge Function uses repository JWT config and an exact mapped Supabase dependency', () => {
  assert.match(supabaseConfig, /\[functions\.demo-ingest\][\s\S]*verify_jwt\s*=\s*false/);
  assert.doesNotMatch(functionConfig, /verify_jwt/);
  assert.ok(denoConfig, 'function-local deno.json is required');
  const deno = JSON.parse(denoConfig);
  assert.equal(deno.imports?.['@supabase/supabase-js'], 'npm:@supabase/supabase-js@2.112.3');
  assert.match(edgeFunction, /from\s+['"]@supabase\/supabase-js['"]/);
  assert.match(edgeFunction, /validateContentLength/);
  assert.match(edgeFunction, /resolveSupabaseSecretKey/);
  assert.doesNotMatch(edgeFunction, /SUPABASE_SECRET_KEY(?!S)/);
});

test('canonical redirect never trusts proxy protocol or request host values', () => {
  assert.match(headers, /RewriteCond\s+%\{HTTPS\}\s+!=on\s+\[OR\]/);
  assert.match(headers, /RewriteCond\s+%\{HTTP_HOST\}\s+!\^assistall\\\.ai\$/i);
  assert.match(headers, /RewriteRule\s+\^\s+https:\/\/assistall\.ai%\{REQUEST_URI\}/);
  assert.doesNotMatch(headers, /X-Forwarded-Proto/i);
  assert.doesNotMatch(headers, /https:\/\/%\{HTTP_HOST\}/i);
});

test('reveal content is visible by default and hidden only after enhancement', () => {
  const defaultReveal = css.match(/(?:^|\n)\[data-reveal\]\s*\{([^}]*)\}/);
  assert.ok(defaultReveal);
  assert.match(defaultReveal[1], /opacity:\s*1/);
  assert.doesNotMatch(defaultReveal[1], /opacity:\s*0/);
  assert.match(css, /html\.reveal-enhanced\s+\[data-reveal\]\s*\{[^}]*opacity:\s*0/s);
  assert.match(script, /classList\.add\(['"]reveal-enhanced['"]\)/);
});

test('capability panel label follows the selected stable tab ID', () => {
  assert.match(script, /capability-panel/);
  assert.match(script, /aria-labelledby/);
  assert.match(script, /capability-tab-\$\{state\.activeId\}/);
});

test('launch documentation describes the Living Work Queue and secret-key map migration', () => {
  assert.match(readme, /Living Work Queue/);
  assert.doesNotMatch(readme, /workspace captures and responsive videos/i);
  assert.match(launchSecurity, /SUPABASE_SECRET_KEYS/);
  assert.match(launchSecurity, /default/);
  assert.match(launchSecurity, /SUPABASE_SERVICE_ROLE_KEY[\s\S]*migration fallback/i);
  assert.doesNotMatch(launchSecurity, /SUPABASE_SECRET_KEY(?!S)/);
  assert.match(launchSecurity, /Living Work Queue/);
  assert.doesNotMatch(launchSecurity, /video control/i);
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
