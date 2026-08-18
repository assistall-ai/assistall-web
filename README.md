# Assistall AI website

The public landing page for **Assistall AI**. It uses semantic HTML, responsive CSS, a small progressive-enhancement JavaScript module, a hardened cPanel form handler and a private Supabase ingestion path.

## Current experience

The page tells one continuous story: work comes in, Assistall makes it clear, people approve the next step, and the business has more time for clients and growth.

- Official Assistall branding and quiet-authority palette
- Flat animated hero built from real work types
- Slow, header-aware in-page navigation
- Six interactive capability stories
- Neutral connector ecosystem with honest capability labels
- Living Work Queue evidence for contract, shipment and reply workflows
- Reduced-motion and no-JavaScript fallbacks
- Private demo-request flow protected by Turnstile, signed server-to-server ingestion and forced RLS

## Project map

| Path | Purpose |
|---|---|
| `index.html` | Landing page and demo form |
| `assets/brand.css` | Official brand variables and shared controls |
| `assets/page.css` | Responsive layout and motion |
| `assets/site.js` | Hero, section glide, capability tabs, Living Work Queue and form enhancement |
| `assets/media/` | Local, sanitised product captures used by page evidence |
| `demo-request.php` | cPanel validation, Turnstile verification and signed ingestion |
| `privacy.html` / `security.html` | Public trust pages |
| `supabase/migrations/` | Private lead tables, forced RLS and retention function |
| `supabase/functions/demo-ingest/` | Signed Edge Function and validation helpers |
| `config/assistall-secrets.example.php` | Example cPanel configuration; never add real values here |
| `ops/emergency/demo-request.php` | Form-off endpoint for an incident |
| `docs/LAUNCH_SECURITY.md` | Exact Cloudflare, Supabase and cPanel launch sequence |
| `tools/verify-site.ps1` | Offline structural and security checks |

## Local preview

Serve this folder instead of opening `index.html` directly:

```powershell
python -m http.server 55264 --bind 127.0.0.1
```

Open `http://127.0.0.1:55264/?motion=on`. Use `?motion=off` to verify the static reduced-motion experience. The local preview deliberately shows a Turnstile placeholder because the real widget is restricted to the production hostname.

## Verification

```powershell
node --test tests\*.test.mjs
powershell -ExecutionPolicy Bypass -File tools\verify-site.ps1
```

The PHP endpoint requires PHP 8.1+ with cURL. PHP, Deno and the Supabase CLI are not currently installed in this Windows workspace, so their production-runtime checks remain launch gates.

## Deployment

cPanel Git deployment copies only the public website files. Real secrets live at `/home/YOUR_CPANEL_USER/.assistall-secrets.php`, outside `public_html` and outside Git. Follow [docs/LAUNCH_SECURITY.md](docs/LAUNCH_SECURITY.md) in order; the form intentionally fails closed until Turnstile, Supabase and the cPanel secret file are configured.

## Non-negotiable rules

- Do not place Supabase keys, Turnstile secrets or HMAC values in HTML, JavaScript or Git.
- Do not publish invented savings figures, testimonials, customer names or capabilities.
- Keep provider logos monochrome in marketing visuals; genuine product theme colour may remain inside real captures.
- Do not enable HSTS until the apex and every required subdomain pass HTTPS checks.
- Do not claim the website is unhackable or impossible to DDoS. Maintain defence in depth, monitoring and recovery.

## Status

- Website redesign: implemented locally
- cPanel form hardening: implemented locally
- Supabase migration and Edge Function: applied to project `utxjkathvjdwcermpbez`; forced-RLS access verified, Edge Function secrets still required
- Cloudflare rules and production secrets: require account configuration
- Figma visuals: paused by request
