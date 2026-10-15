# Diagnostic intake — deployment, security, and the 80-step test

Everything you need to turn on "Send this to Assistall support" in the app and to
harden the endpoint that receives it, in the order you should do it.

**What this is.** The desktop app can run a self-diagnostic (Support → Run
self-check) and, with the person's explicit consent, send the result to support.
The app has no outbound email (its mailbox is read-only by design), so it POSTs a
**redacted, verdicts-only report** to `diagnostic-intake.php` on assistall.ai,
which emails it to `admin@assistall.ai` (cc `kinanh4@gmail.com`).

**What the report contains.** Pass/fail verdicts and counts only — "Mailbox
connected using Microsoft 365 sign-in", "Odoo: 4 of 4 data areas returned
records", "3 recent interface errors". Never an email address, a record, a
count of customers, a credential, or a file path. It is redacted twice in the
app and a **third time on the server** before it is emailed, and the server
refuses to send anything that still looks sensitive.

---

## Part 1 — One-time setup (your steps)

Do these once. Steps 1–5 are on the website/cPanel side; step 6 is on the app
build machine; step 7 proves it end to end.

### Step 1 — Generate the shared secret

On any machine, generate a 32-byte random secret. Both sides must hold the same
value.

```bash
openssl rand -hex 32
```

Copy the output (a 64-character hex string). Treat it like a password. You will
paste it into two places: the website secrets file (step 2) and the app build
(step 6). Do not commit it to git.

### Step 2 — Put the secret and recipients in the website secrets file

The secrets file lives **outside** `public_html` so the web server can never
serve it. On cPanel it sits in your home directory:
`/home/YOUR_CPANEL_USER/.assistall-secrets.php`.

If that file already exists (the demo form uses it), add the diagnostic keys to
the array it returns. If not, copy `config/assistall-secrets.example.php` there
and fill it in. The diagnostic keys:

```php
'diagnostic_hmac_secret'   => 'PASTE-THE-64-CHAR-SECRET-FROM-STEP-1',
'diagnostic_recipient'     => 'admin@assistall.ai',
'diagnostic_recipient_cc'  => 'kinanh4@gmail.com',
'diagnostic_state_dir'     => '/home/YOUR_CPANEL_USER/assistall-diagnostic-state',
```

The endpoint reads recipients only from this file — they can never be set by the
request — so this is where you control who gets the reports.

### Step 3 — Create the state directory

The endpoint stores tiny rate-limit and single-use-nonce files here. Make it
**outside** `public_html`, matching `diagnostic_state_dir` above:

```bash
mkdir -p /home/YOUR_CPANEL_USER/assistall-diagnostic-state
chmod 700 /home/YOUR_CPANEL_USER/assistall-diagnostic-state
```

If you leave `diagnostic_state_dir` blank, the endpoint falls back to the system
temp directory — workable, but a dedicated directory you control is better.

### Step 4 — Deploy `diagnostic-intake.php`

It deploys the same way as the rest of the site — via cPanel Git (`.cpanel.yml`).
Push `main`, then pull/deploy in cPanel as you normally do. Confirm the file is
live and reachable **only** by POST:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://assistall.ai/diagnostic-intake.php
```

Expect **405** (Method Not Allowed) for that GET — that is correct; the endpoint
is POST-only.

### Step 5 — Verify PHP parses and mail works

On the server (cPanel Terminal or SSH):

```bash
php -l /home/YOUR_CPANEL_USER/public_html/diagnostic-intake.php   # "No syntax errors"
```

Confirm your hosting can send mail from `no-reply@assistall.ai`. The demo form
already uses `mail()`, so if demo requests arrive by email, this will too. If
they don't, fix mail delivery first (SPF/DKIM for assistall.ai in cPanel's Email
Deliverability tool) — the endpoint returns **502** when `mail()` fails, and the
app will tell the user it could not send.

### Step 6 — Bake the secret into the app build

The app reads the secret from the environment variable
`WADIH_AI_DIAGNOSTIC_SECRET` (or the `diagnostic_send_secret` desk-config key).
Set the environment variable in the build so it is embedded in the shipped
binary:

- In the build environment, set `WADIH_AI_DIAGNOSTIC_SECRET` to the step-1 value
  before running the build, **or**
- add it to the app's shipped configuration the same way other build-time
  constants are set.

If the secret is absent, the feature stays **off**: the app shows "This build is
not set up to send reports" and the Send button never appears. That is the safe
default — a build with no secret can send nothing.

> **Honest note on the secret.** The app is installed on client machines, so a
> determined person could extract this secret from the binary. That is why the
> secret is a *first filter and integrity check*, not the real security boundary.
> The real defences live on the endpoint: rate limiting, strict validation,
> fixed recipients, and the server-side redaction re-scan. Rotating the secret
> (Part 4) is cheap; treat it as hygiene, not as your only wall.

### Step 7 — Prove it end to end

1. Install the new build on a test device (or the exec device).
2. Support → **Run self-check**. Confirm the 12 checks appear and the panel says
   the report is safe to share.
3. Click **Send this to Assistall support**, tick the consent box, confirm.
4. Within a minute, a plain-text report should arrive at `admin@assistall.ai`.
   It should contain only `[PASS]`/`[REVIEW]` lines and no addresses or records.

If the email does not arrive, check the cPanel error log for a line tagged
`"endpoint":"diagnostic-intake"` — the `code` field tells you exactly which gate
stopped it (see the reference at the end).

---

## Part 2 — The 80-step vulnerability test

Run these against `https://assistall.ai/diagnostic-intake.php` after deploying.
Each step lists the **test**, the **expected result**, and **if it fails** what
to change. A pass means the endpoint behaved as the expected column says.

Set up two shell variables first (use the real secret for the "valid" cases):

```bash
URL=https://assistall.ai/diagnostic-intake.php
SECRET=your-64-char-secret
# Helper to sign a body: prints the three headers for a given body string.
sign() {
  TS=$(date +%s); NONCE=$(openssl rand -hex 16)
  SIG=$(printf '%s.%s.%s' "$TS" "$NONCE" "$1" | openssl dgst -sha256 -hmac "$SECRET" -r | cut -d' ' -f1)
  echo "-H X-Assistall-Timestamp:$TS -H X-Assistall-Nonce:$NONCE -H X-Assistall-Signature:$SIG"
}
BODY='{"app_version":"2.0.9","summary":"11 of 12 checks passed.","passed":11,"total":12,"all_ok":false,"redaction_clean":true,"checks":[{"name":"Mailbox","ok":true,"detail":"Connected and reachable."}]}'
```

### A. Transport & TLS (1–8)

1. **Plain HTTP GET** to `http://assistall.ai/diagnostic-intake.php` → expect a
   301 redirect to HTTPS. *Fix:* the `.htaccess` HTTPS redirect must be active.
2. **Plain HTTP POST** → expect redirect to HTTPS (never processed over HTTP).
   *Fix:* same `.htaccess` rule; never process on `http`.
3. **TLS version** — confirm the host negotiates TLS 1.2+ only
   (`nmap --script ssl-enum-ciphers -p 443 assistall.ai`). *Fix:* disable TLS
   1.0/1.1 in cPanel/Cloudflare.
4. **Weak ciphers** — the same scan shows no RC4/3DES/export ciphers. *Fix:*
   restrict cipher suites at the CDN/host.
5. **HSTS** — after HTTPS is proven everywhere, enable the HSTS header (currently
   commented in `.htaccess`) and confirm it is present. *Fix:* uncomment the
   `Strict-Transport-Security` line.
6. **Certificate validity** — valid, not expired, matches host. *Fix:* renew via
   AutoSSL/cPanel.
7. **Mixed protocol downgrade** — a request with `X-Forwarded-Proto: http` still
   ends up HTTPS. *Fix:* `.htaccess` already checks this header; confirm.
8. **Direct-to-origin bypass** (if Cloudflare fronts the site) — the origin IP
   should not accept diagnostic POSTs from arbitrary sources. *Fix:* restrict
   origin to Cloudflare IPs; set `trust_cloudflare_proxy` only then.

### B. HTTP method & routing (9–16)

9. **GET** the endpoint → **405**, `Allow: POST`. *Fix:* method guard.
10. **PUT / PATCH / DELETE** → **405**. *Fix:* only `POST` is handled.
11. **HEAD** → 405/no body. *Fix:* method guard.
12. **OPTIONS** → no CORS allowance that lets a browser POST cross-origin (there
    is no `Access-Control-Allow-Origin`). *Fix:* never add permissive CORS here.
13. **TRACE** → disabled by host. *Fix:* `TraceEnable Off` at the server.
14. **Case/whitespace method** (`post`, ` POST `) → still rejected unless exactly
    `POST`. *Fix:* the strict `=== 'POST'` compare already enforces this.
15. **Path traversal to the secrets file**
    (`https://assistall.ai/../.assistall-secrets.php`, encoded variants) → 403/404,
    never the file. *Fix:* secrets live outside `public_html`; confirm.
16. **Directory listing** of `/` and `/config` → disabled. *Fix:* `Options
    -Indexes` (already set).

### C. Size & content-type (17–22)

17. **Empty body** POST (valid headers) → **413** (length ≤ 0). *Fix:* size gate.
18. **Oversized body** (> 32 KB) → **413**. Test: `head -c 40000 /dev/zero | tr
    '\0' 'a'`. *Fix:* `MAX_REQUEST_BYTES` gate.
19. **Content-Length lie** — declare small, send large; and declare large, send
    small → rejected/truncated, never over-read. *Fix:* the endpoint reads at
    most `MAX_REQUEST_BYTES + 1` and re-checks length.
20. **Wrong content-type** (`text/plain`, `multipart/form-data`) → **415**.
    *Fix:* content-type gate.
21. **Missing content-type** → **415**. *Fix:* same gate.
22. **Content-type with charset** (`application/json; charset=utf-8`) → accepted
    (the endpoint splits on `;`). *Confirm* this is allowed, not rejected.

### D. HMAC signature & auth (23–34)

23. **No signature headers** → **400** (`bad_auth_headers`). *Fix:* header
    presence check.
24. **Malformed signature** (not 64 hex) → **400**. *Fix:* the regex gate.
25. **Wrong signature** (valid shape, wrong value) → **403** (`bad_signature`).
    *Fix:* `hash_equals` verification.
26. **Signature over a different body** — sign body A, send body B → **403**. The
    signature covers the exact bytes. *Fix:* confirm the body is signed, not just
    the headers.
27. **Signature with wrong secret** → **403**. *Fix:* the shared secret must
    match on both sides; if this fails for a *legitimate* app, your app secret
    and server secret differ.
28. **Timing attack on the compare** — many wrong signatures show no timing
    signal (constant-time). *Fix:* `hash_equals` (already used); never `==`.
29. **Empty secret on server** (temporarily blank it in a staging copy) → **503**
    (`missing_configuration`), never "accept anything". *Fix:* the empty-secret
    guard.
30. **Signature reuse across bodies** — a captured valid signature does not
    validate a new body → **403**. *Fix:* body is part of the signed string.
31. **Header injection via signature headers** (CR/LF in nonce/timestamp) →
    rejected by the strict `ctype_digit` / hex regexes → **400**. *Fix:* those
    regexes.
32. **Uppercase/space in hex headers** → **400** (regex is lowercase hex only).
    *Fix:* regex.
33. **Very long signature header** (DoS attempt) → **400** quickly; capped by the
    64-char regex and the overall size limits. *Fix:* regex + size gate.
34. **Algorithm confusion** — there is no algorithm field to downgrade; sha256 is
    hardcoded. *Confirm* no `alg` is read from the request.

### E. Replay & nonce (35–42)

35. **Exact replay** — send a valid signed request twice → first **201**, second
    **409** (`replayed_nonce`). *Fix:* the single-use nonce store.
36. **Concurrent replay** — fire the same request twice in parallel → at most one
    **201**. *Fix:* atomic `fopen(...,'x')` (already used) prevents the race.
37. **New nonce, same body, same timestamp** — requires a new valid signature
    (needs the secret); without it → **403**. *Confirm* replay needs the secret.
38. **Nonce reuse after window** — replay after 10 minutes → still **409** if the
    file survives, or blocked by the timestamp window anyway → **403**. Either is
    a pass.
39. **Nonce store exhaustion** (spam unique nonces) → old nonce files are pruned
    on each request; disk does not grow unbounded. *Fix:* the cleanup loop.
40. **Nonce path traversal** (`../../etc` in the nonce header) → rejected by the
    hex regex before it touches the filesystem. *Fix:* regex + `preg_replace`
    sanitisation on the filename.
41. **Missing nonce** → **400**. *Fix:* header check.
42. **Nonce collision with another endpoint's files** — the prefix `nonce_` and a
    dedicated state dir keep them separate. *Confirm* the state dir is not shared
    with unrelated writable files.

### F. Timestamp window (43–46)

43. **Stale timestamp** (older than 5 min) → **403** (`stale_timestamp`). *Fix:*
    window check.
44. **Future timestamp** (5 min ahead) → **403**. *Fix:* `abs()` window covers
    both directions.
45. **Non-numeric timestamp** → **400**. *Fix:* `ctype_digit`.
46. **Server clock skew** — if legitimate sends fail with 403 stale, the server
    clock is wrong. *Fix:* enable NTP on the host.

### G. Schema validation & injection (47–58)

47. **Non-JSON body** with valid signature → **400**. *Fix:* `json_decode`
    result checked.
48. **JSON array instead of object** → **400**. *Fix:* `is_array` + key checks.
49. **Unknown top-level field** (`"evil":1`) → **422**. *Fix:* the allow-list of
    top-level keys.
50. **`redaction_clean:false`** → **422**, never emailed. *Fix:* the
    clean-flag gate.
51. **`redaction_clean` missing** → **422**. *Fix:* strict `!== true`.
52. **`checks` empty** → **422**. *Fix:* count check.
53. **`checks` over 40 entries** → **422**. *Fix:* count cap.
54. **`checks` not an array** (string/number) → **422**. *Fix:* `is_array`.
55. **`passed`/`total` non-integer** (`"11"`, `null`) → **422**. *Fix:* `is_int`.
56. **A check that is not an object** (`"checks":["x"]`) → **422**. *Fix:*
    per-check `is_array`.
57. **SQL/NoSQL injection strings** in `name`/`detail` → treated as inert text;
    nothing runs a query. *Confirm* there is no database call anywhere.
58. **Script/HTML in `detail`** (`<script>`) → arrives as plain text in a
    plain-text email; the endpoint emits no HTML. *Confirm* the response is JSON
    only and the mail is `text/plain`.

### H. Redaction / data leakage (59–66)

59. **Email address in a `detail`** → the whole report is **422**
    (`leak_detected_refused`), never emailed. *Fix:* the `has_leak` gate.
60. **Windows path in a `detail`** (`C:\Users\...`) → **422**. *Fix:* `has_leak`.
61. **UNC path** (`\\server\share`) → **422**. *Fix:* `has_leak` UNC pattern.
62. **Credential assignment** (`token=abc123`) → redacted to `token=[redacted]`
    in the mail; if a raw one slips the pattern, it is still just text, never
    executed. *Confirm* the redactor runs on every detail.
63. **Email split across fields** to dodge the regex → each field is scanned
    independently; a real address in any one triggers **422**. *Confirm.*
64. **Leak in the `name`** (not just `detail`) → **422** (`has_leak($name)`).
    *Fix:* the name is scanned too.
65. **Leak in `summary`** → redacted before it is placed in the mail. *Confirm*
    `redact()` runs on the summary.
66. **Unicode / homoglyph address** → best-effort; the ASCII pattern catches
    normal addresses. *Note:* the app-side redaction and the verdicts-only design
    mean a homoglyph address would have had to originate in a check string, which
    the app controls — low risk, but worth a manual read of any REVIEW detail.

### I. Email header injection (67–72)

67. **CR/LF in `summary`** (`a\r\nBcc: evil@x.com`) → stripped by `safe_line`;
    no extra header appears. *Fix:* `safe_line` newline stripping.
68. **CR/LF in a check `name`/`detail`** → stripped. *Fix:* same.
69. **Attempt to set a recipient via the body** (`"to":"evil@x.com"`) → rejected
    as an unknown field (**422**); recipients are hardcoded regardless. *Fix:*
    schema allow-list + fixed recipients.
70. **Null byte in a field** → stripped by `safe_line`. *Fix:* `\0` removal.
71. **Very long single line** → truncated to 400 chars per detail / 200 for
    summary. *Fix:* `safe_line` length cap.
72. **`From`/`Reply-To` spoof attempt** — no request field influences the mail
    headers; `From` is a constant. *Confirm* headers are a fixed array.

### J. Rate limiting & DoS (73–80)

73. **Per-IP flood** — send 11 valid, differently-signed requests in an hour from
    one IP → the 11th returns **429**. *Fix:* `RATE_LIMIT_PER_IP_PER_HOUR`.
74. **Global flood** — beyond 500/day across all IPs → **429**. *Fix:*
    `RATE_LIMIT_GLOBAL_PER_DAY`.
75. **Rate-limit window reset** — after the hour, the per-IP counter resets.
    *Confirm* legitimate use is not permanently blocked.
76. **IP spoof via `X-Forwarded-For`** — the endpoint uses `REMOTE_ADDR` (or
    `CF-Connecting-IP` only when `trust_cloudflare_proxy` is on), so a forged
    `X-Forwarded-For` does not reset the counter. *Fix:* keep
    `trust_cloudflare_proxy` off unless the origin is Cloudflare-only.
77. **Slowloris / slow POST** — the host/CDN should time out slow requests.
    *Fix:* server/Cloudflare request timeouts.
78. **Regex DoS (ReDoS)** — long crafted strings in `detail` do not hang the
    redactor (patterns are linear, input capped at 32 KB / 400 chars). *Confirm*
    response stays fast under a 32 KB worst-case body.
79. **Disk-fill via nonce/rate files** — pruning + tiny files keep growth
    bounded; monitor the state dir size. *Fix:* the cleanup loop; alert on dir
    size.
80. **Log flooding** — every rejection logs one short JSON line; confirm the
    error log rotates. *Fix:* cPanel log rotation.

**Scoring.** Every step should land on the "expected" result. Any deviation is a
finding — apply the "if it fails" fix, redeploy, and re-run that step. Steps 3,
4, 5, 6, 8, 13, 46, 77, 80 depend on host/CDN configuration rather than the PHP;
the rest are enforced by `diagnostic-intake.php` itself and are covered by
`tests/diagnostic-intake.test.mjs`.

---

## Part 3 — Strengthening beyond the endpoint

- **Turn on HSTS** once every subdomain is HTTPS-clean (step 5 above).
- **Front with Cloudflare** and enable a WAF rule + rate limiting on
  `/diagnostic-intake.php` as a second layer above the PHP limiter. Then set
  `trust_cloudflare_proxy => true` and lock the origin to Cloudflare IPs so the
  PHP sees real client IPs and nobody can hit the origin directly.
- **Deliverability:** set SPF, DKIM and DMARC for assistall.ai (cPanel → Email
  Deliverability) so the reports are not spam-filtered and `no-reply@` is not
  spoofable.
- **Alerting:** watch the error log for a spike in `rate_limited` or
  `bad_signature` (attempted abuse) and for `email_failed` (delivery broken).
- **Kill switch:** if you ever need to stop intake without touching the app,
  rename `diagnostic-intake.php` or return 503 from it (mirror the
  `ops/emergency/demo-request.php` pattern). The app degrades gracefully — the
  user is told it could not send.

---

## Part 4 — Rotating the secret

Because the secret ships in the client, rotate it on each release, or if you ever
suspect a build was reverse-engineered:

1. Generate a new secret (step 1).
2. Update `diagnostic_hmac_secret` in `.assistall-secrets.php` (step 2).
3. Set `WADIH_AI_DIAGNOSTIC_SECRET` for the next app build (step 6) and ship it.

Old builds will get **403** from the endpoint after rotation and simply report
they could not send — no data is at risk, because a rejected report is never
emailed. Rotation is cheap and safe to do often.

---

## Reference — server log codes

Every rejection writes one JSON line to the PHP error log, tagged
`"endpoint":"diagnostic-intake"`, with a `code`:

| code | meaning | usual cause |
|---|---|---|
| `missing_configuration` | no secret configured | step 2 not done on the server |
| `bad_auth_headers` | headers missing/malformed | not a genuine app request |
| `stale_timestamp` | outside the ±5 min window | client/server clock skew (step 46) |
| `bad_signature` | HMAC mismatch | secret mismatch or forgery |
| `replayed_nonce` | nonce already seen | replay attempt (expected on retries) |
| `rate_limited` | per-IP or global cap hit | flooding, or a stuck client retrying |
| `leak_detected_refused` | a detail still looked sensitive | report withheld — investigate the build |
| `email_failed` | `mail()` failed | server mail/deliverability broken (step 5) |
| `accepted` | report emailed | success |
