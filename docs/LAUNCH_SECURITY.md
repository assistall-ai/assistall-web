# Assistall AI website launch and security runbook

Complete the stages in order. Do not open the demo form to the public until every launch gate passes.

## 1. Create the two independent secrets

Generate two different random values of at least 32 bytes:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

- Value 1 is `WEBSITE_HMAC_SECRET`. Put the same value in the Supabase Edge Function and the cPanel secret file.
- Value 2 is `RATE_LIMIT_HASH_SALT`. Put it only in the Supabase Edge Function.

Never paste either value into HTML, JavaScript, tickets, screenshots or Git.

## 2. Prepare Supabase

Use the empty project reserved for website leads and rename it **Assistall Website**.

1. Apply `supabase/migrations/20260816000100_create_website_demo_leads.sql`.
2. Deploy `supabase/functions/demo-ingest`. Repository-root `supabase/config.toml` disables platform JWT verification for this function because it authenticates the cPanel server using its HMAC signature instead.
3. Add Edge Function secrets:
   - `WEBSITE_HMAC_SECRET`
   - `RATE_LIMIT_HASH_SALT`
   - Confirm the platform-provided `SUPABASE_SECRET_KEYS` JSON map contains a non-empty `default` key. The function selects that named key.
   - Keep the platform-provided `SUPABASE_SERVICE_ROLE_KEY` only as a documented migration fallback while the new map is absent. A malformed map or a map without `default` fails closed and does not fall back.
4. Schedule `select public.purge_demo_request_data();` once daily in **Integrations → Cron**. Suggested time: `20 2 * * *` UTC.
5. Open **Database → Security Advisor**, rerun the advisor and resolve every RLS/security finding before launch.

Database verification in the SQL editor:

```sql
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where oid in ('public.demo_requests'::regclass, 'public.demo_rate_limit_events'::regclass);

select
  has_table_privilege('anon', 'public.demo_requests', 'select,insert,update,delete') as anon_demo_access,
  has_table_privilege('authenticated', 'public.demo_requests', 'select,insert,update,delete') as authenticated_demo_access,
  has_table_privilege('anon', 'public.demo_rate_limit_events', 'select,insert,update,delete') as anon_rate_access,
  has_table_privilege('authenticated', 'public.demo_rate_limit_events', 'select,insert,update,delete') as authenticated_rate_access;
```

Both `relrowsecurity` and `relforcerowsecurity` must be `true`; all four privilege results must be `false`. The browser must never receive a Supabase URL or key.

## 3. Create Cloudflare Turnstile

1. Create a Managed Turnstile widget for `assistall.ai` and `www.assistall.ai`.
2. Put the public site key in the `assistall-turnstile-sitekey` meta tag in `index.html`.
3. Put the private secret only in `/home/YOUR_CPANEL_USER/.assistall-secrets.php`.
4. After deployment, confirm the server rejects a token with the wrong hostname, wrong `demo` action, expiry or replay.

The server-side Siteverify call is mandatory. Browser-only validation is not accepted.

## 4. Configure cPanel outside the document root

In cPanel Terminal or File Manager, copy the shape of `config/assistall-secrets.example.php` to:

`/home/YOUR_CPANEL_USER/.assistall-secrets.php`

Fill in:

- Turnstile secret
- allowed Turnstile hostnames
- deployed Supabase `demo-ingest` URL
- the same HMAC secret used by the Edge Function

Set the file permission to owner read/write only where the hosting account permits it. Keep `trust_cloudflare_proxy` false until direct origin access is blocked; otherwise an attacker could forge `CF-Connecting-IP` at the origin.

Confirm cPanel uses PHP 8.1+ and has cURL enabled. Run:

```bash
php -l public_html/demo-request.php
```

## 5. Put the domain behind Cloudflare

1. Add `assistall.ai` to Cloudflare, review all imported DNS records, and replace the Namecheap nameservers with the assigned Cloudflare nameservers.
2. Proxy the web records. Do not proxy mail records.
3. Set SSL/TLS to **Full (strict)**, minimum TLS 1.2, TLS 1.3 on, and Always Use HTTPS on.
4. Enable automatic DDoS protection, Bot Fight Mode and Browser Integrity Check.
5. Enable hybrid post-quantum key agreement for compatible TLS 1.3 clients.
6. Add a rate-limiting rule for path `/demo-request.php`: five requests per IP in ten seconds, then managed challenge or temporary block. On Free, use only fields the plan exposes.
7. Bypass cache for `/demo-request.php`. Cache HTML briefly and fingerprinted/local static assets longer.
8. Audit DNS-only and historical records that may expose the cPanel origin.
9. Ask Namecheap whether ports 80/443 can accept only Cloudflare IP ranges. Leave `trust_cloudflare_proxy` false unless this is enforced.
10. Enable HSTS only after the apex and every required subdomain pass HTTPS testing. The repository leaves it commented out intentionally.

## 6. Production tests

Run these against a staging hostname first:

- Homepage, privacy, security and `security.txt` return successfully.
- Every navigation link, capability tab, Living Work Queue tab and CTA works at 1920, 1440, 1024, 820, 390 and 360 pixels.
- No overlap, clipping, horizontal overflow or console error.
- Reduced motion and no-JavaScript fallbacks remain usable.
- `GET /demo-request.php` returns 405.
- Unsupported content types return 415; bodies over 16 KB return 413.
- Honeypot, too-fast completion, malformed email and CRLF input are rejected.
- Turnstile pass, failure, expiry, replay, hostname mismatch and action mismatch are tested using official test keys.
- Signed ingestion accepts one valid request and rejects a tampered signature, a timestamp older than 60 seconds and a replayed request ID.
- The sixth accepted IP request in one hour and fourth accepted email request in one day return rate-limit failures.
- No raw IP is stored. No secret appears in page source, browser network responses, logs or Git history.
- Cloudflare caches static assets and never caches the form response.
- Security Advisor has no unresolved RLS/security warning.
- A controlled staging load test succeeds. Never load-test the production origin.

## 7. Monitoring and recovery

Monitor:

- `/`
- `/demo-request.php` with a safe method check
- Supabase `demo-ingest` availability and error count
- cPanel PHP error logs using request IDs only
- Cloudflare security events and rate-limit activity

To disable submissions without taking down the marketing site:

1. Preserve the active `public_html/demo-request.php` as a private backup outside `public_html`.
2. Replace it with `ops/emergency/demo-request.php`.
3. Confirm the endpoint returns 503 and `Retry-After` while the rest of the site remains online.
4. Investigate, rotate the HMAC and Turnstile secrets if needed, redeploy the known-good endpoint, and retest before restoring submissions.

Keep a known-good site archive and record who can rotate Cloudflare, cPanel and Supabase credentials.
