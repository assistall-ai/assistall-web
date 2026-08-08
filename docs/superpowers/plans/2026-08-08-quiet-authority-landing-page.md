# Quiet Authority Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Rebuild the static Assistall AI landing page as a premium-minimal, plain-English product story with authentic application captures and a motion-safe Limestone-versus-Cobalt workspace comparison.

**Architecture:** Keep the current deployment model: one semantic index.html, the authoritative assets/brand.css, and one page-level stylesheet. Create local media assets from an isolated Assistall workspace and embed them with native HTML image and video elements so product evidence has a static fallback and the page remains useful without JavaScript.

**Tech Stack:** Semantic HTML5, CSS with progressive animation-timeline support, local PNG raster assets, H.264 MP4 encoded locally with FFmpeg, PowerShell verification, and browser visual QA.

## Global Constraints

- Keep the deployment static: no package manager, framework, bundler, CDN, web font, analytics, tracker, or external image request.
- Use the public-page palette only: deep teal #0E3A3D, pale limestone #F4EFE4, warm ivory #FFFDF8, muted brass #C8A25D, charcoal #172A2C, and white #FFFFFF.
- Use the genuine Assistall three-bar mark from assets/apple-touch-icon.png in the header, hero product surface, final CTA, and footer.
- Use only real Assistall screens captured from the isolated local workspace; never capture a client workspace, email, customer, or temporary profile label.
- Preserve true claims: the product runs on the customer's computer, speech recognition is on-device, and a person reviews actions that write or send.
- Do not publish an hours-saved, revenue, customer, testimonial, or shipment-performance number.
- Keep the page understandable in plain English with short sentences and concrete verbs.
- Respect prefers-reduced-motion; video is optional and static comparison content must remain available.
- Test no horizontal overflow at exactly 1280px, 1024px, 820px, and 390px.

---

## File Structure

| File | Responsibility |
| --- | --- |
| content/landing-copy.md | Final public-page copy and factual-claim source; not deployed. |
| assets/media/workspace-limestone.png | Sanitised static Assistall Limestone workspace capture. |
| assets/media/workspace-cobalt.png | Sanitised static Cobalt Blue workspace capture of the matching view. |
| assets/media/workspace-theme-comparison.png | Static side-by-side poster and reduced-motion fallback. |
| assets/media/workspace-theme-comparison.mp4 | Silent local H.264 scroll comparison clip, approximately 10 seconds. |
| index.html | Semantic page structure, copy, local screenshots, native video, and fallback markup. |
| assets/page.css | Quiet-authority layout, responsive behaviour, local media treatment, and progressive motion. |
| tools/verify-site.ps1 | Dependency-free static checks for the public-page invariants. |
| README.md | Current landing-page status and local verification instructions. |

## Task 1: Establish the final plain-English copy source

**Files:**
- Create: content/landing-copy.md
- Test: content/landing-copy.md against docs/superpowers/specs/2026-08-08-quiet-authority-landing-page-design.md

**Interfaces:**
- Consumes: factual safeguards and capability scope from the approved design specification.
- Produces: one Markdown source with the exact public text later inserted into index.html.

- [ ] **Step 1: Write the copy source with this customer-facing text**

~~~markdown
# Assistall AI — landing page copy

## Hero
Eyebrow: For busy business teams
Headline: Keep your business moving.
Body: Assistall AI handles repeat work. It finds the important items, prepares the next step, and lets your team check it before anything is sent.
Primary action: Book a Demo
Secondary action: See how it works
Trust line: Your files stay on your computer. Your team stays in control.

## Work moves forward
Headline: From incoming work to the next clear step.
1. Work comes in — Email, documents, reports, and requests arrive in different places.
2. Assistall reads it — It pulls out the important details and puts the work in order.
3. Your team checks it — You review the draft, report, or request before it moves.
4. The business keeps moving — Less time chasing updates. More time for customers and decisions.

## Capabilities
Headline: Help with the work that slows your team down.
Reports: Read reports and find what matters.
Documents: Bring important files and details into one place.
Approvals: Prepare replies and approval work for a person to check.
Contracts and shipments: Review contract and shipment information when those connected workflows are enabled.

## Workspace themes
Eyebrow: Your workspace, your view
Headline: Choose a look your team feels at home with.
Body: Assistall keeps the layout and the work the same. Choose a workspace colour theme that suits your team.
Assistall Limestone label: Assistall brand look
Cobalt Blue label: Cobalt Blue

## Human value
Headline: More time for work only people can do.
Body: Spend less time chasing updates and copying information. Spend more time with customers, solving problems, and making good decisions.

## Trust
Headline: Nothing important moves without your check.
Runs locally: Assistall runs on your computer.
On-device speech: Speech recognition happens on the device.
Human review: You review actions before Assistall writes or sends them.

## About
Headline: Why we built Assistall AI
Body: We built Assistall AI to clear repeat work out of the way. Your team should have more room for judgment, growth, and the work people do best.

## Final call to action
Headline: See Assistall at work.
Body: Bring your everyday work into a clearer, safer flow.
Primary action: Book a Demo
Secondary action: Talk to Us
~~~

- [ ] **Step 2: Run the factual-claim review**

Run:

~~~powershell
rg -n -i 'hours|save|revenue|customer|testimonial|cloud|automatic' content/landing-copy.md
~~~

Expected: no measured savings, revenue, testimonial, or automatic-action promise; “computer”, “device”, and “review” appear in the trust section.

- [ ] **Step 3: Verify capability wording against the live application**

Open the isolated local workspace and confirm that Reports, Contracts, Shipments, and theme selection appear in navigation or settings. If a named capability is unavailable in the live application without simulated or connected data, remove it from content/landing-copy.md and the public page rather than presenting it as a ready workflow.

- [ ] **Step 4: Commit the copy source**

~~~powershell
git add content/landing-copy.md
git commit -m "docs: add plain English landing page copy"
~~~

## Task 2: Capture and encode authentic theme-comparison media

**Files:**
- Create: assets/media/workspace-limestone.png
- Create: assets/media/workspace-cobalt.png
- Create: assets/media/workspace-theme-comparison.png
- Create: assets/media/workspace-theme-comparison.mp4
- Test: local asset dimensions, video codec, duration, no audio stream, and visual privacy review.

**Interfaces:**
- Consumes: an isolated local Assistall workspace at 127.0.0.1, and the application’s Assistall Limestone and Cobalt Blue themes.
- Produces: local static media used by the hero and theme section; no external service is used at page runtime.

- [ ] **Step 1: Start an isolated capture-only workspace**

Use C:/agency/assistall-app/.test_runs/website-capture. Set WADIH_AI_DATA_DIR, SENTINEL_DB, DESK_CONFIG, SENTINEL_ATTACH_DIR, and DESK_LOG to files inside that folder. Set DESK_PORT=8766, WADIH_AI_LICENSE_MODE=internal, SENTINEL_LLM=off, and WADIH_AI_SHOW_DEMO_OPERATIONS=0 before starting approval_desk.py serve.

Verify:

~~~powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8766/ui/ | Select-Object -ExpandProperty StatusCode
~~~

Expected: 200.

- [ ] **Step 2: Capture matching sanitized screens**

Create a temporary local user with a non-client name. Open Overview at a 1440px-wide browser viewport. Capture the same overview position in Assistall Limestone, then select Cobalt Blue in Settings → Appearance and capture the identical position. Crop the lower profile area from every public asset; retain navigation, top bar, workspace content, and theme colours.

Expected outputs:

~~~text
assets/media/workspace-limestone.png
assets/media/workspace-cobalt.png
~~~

- [ ] **Step 3: Capture synchronised scrolling frame sequences**

For each theme, capture the same ordered scroll positions through the Overview: top state, setup card, metric cards, suggested path, and trust strip. Use 24 frames per second over 10 seconds. Store numbered PNG frames only under .test_runs; they are never committed.

- [ ] **Step 4: Build the poster and scroll-comparison clip**

Create workspace-theme-comparison.png with Assistall Limestone on the left and Cobalt Blue on the right. Encode the paired scroll frames with this local command:

~~~powershell
ffmpeg -y -framerate 24 -i .test_runs/website-capture/limestone/frame-%04d.png -framerate 24 -i .test_runs/website-capture/cobalt/frame-%04d.png -filter_complex "[0:v]scale=768:-2[left];[1:v]scale=768:-2[right];[left][right]hstack=inputs=2[video]" -map "[video]" -t 10 -c:v libx264 -profile:v baseline -pix_fmt yuv420p -movflags +faststart -an assets/media/workspace-theme-comparison.mp4
~~~

- [ ] **Step 5: Verify the media contract before page use**

Run:

~~~powershell
ffprobe -v error -show_entries format=duration -show_entries stream=codec_name,codec_type -of default=noprint_wrappers=1 assets/media/workspace-theme-comparison.mp4
Get-ChildItem assets/media/workspace-*.png,assets/media/workspace-*.mp4 | Select-Object Name,Length
~~~

Expected: H.264 video only, no audio stream, a duration between 9 and 11 seconds, and all four local assets exist. Inspect the poster and a paused video frame visually; reject anything that shows a temporary profile name, customer data, email address, or browser chrome.

- [ ] **Step 6: Stop capture service and commit reviewed media only**

Stop the local capture process before committing. Do not add .test_runs, logs, databases, capture frames, or local configuration files.

~~~powershell
git add assets/media/workspace-limestone.png assets/media/workspace-cobalt.png assets/media/workspace-theme-comparison.png assets/media/workspace-theme-comparison.mp4
git commit -m "assets: add reviewed workspace theme comparison media"
~~~

## Task 3: Rebuild semantic HTML around the clear business story

**Files:**
- Modify: index.html
- Test: one main landmark, one h1, labelled sections, valid local media references, and no external resource requests.

**Interfaces:**
- Consumes: content/landing-copy.md, existing favicon/brand assets, and the media contract from Task 2.
- Produces: semantic HTML that assets/page.css can style without JavaScript.

- [ ] **Step 1: Replace the old list-first order with the new section skeleton**

Keep the skip link, header, main, footer, favicon, and manifest. Use this section order:

~~~html
<section class="hero section" aria-labelledby="hero-title">...</section>
<section class="work-story section section--limestone" aria-labelledby="work-story-title">...</section>
<section class="capabilities section" aria-labelledby="capabilities-title">...</section>
<section class="theme-showcase section section--teal" aria-labelledby="themes-title">...</section>
<section class="human-value section section--limestone" aria-labelledby="human-value-title">...</section>
<section class="trust section" aria-labelledby="trust-title">...</section>
<section class="about section section--limestone" aria-labelledby="about-title">...</section>
<section class="final-cta section section--teal" aria-labelledby="cta-title">...</section>
~~~

- [ ] **Step 2: Build the hero with genuine brand evidence**

Use assets/apple-touch-icon.png in the wordmark and product label. Embed the reviewed Limestone capture:

~~~html
<figure class="hero-product">
  <figcaption>Assistall AI workspace</figcaption>
  <img src="assets/media/workspace-limestone.png" alt="Assistall AI desktop workspace showing work areas, review status, reports and contracts.">
</figure>
~~~

Use the exact hero text from content/landing-copy.md, a brass Book a Demo mailto action, and a quiet “See how it works” anchor action.

- [ ] **Step 3: Build the four-step work story and verified capabilities**

Use an ordered list for the four plain-English steps. Do not create fake messages, names, dates, or performance dashboards. Present capability groups as text-led blocks. Include Contracts and Shipments only if Task 1 live verification supports their precise wording.

- [ ] **Step 4: Build native theme video and static fallback**

Use this structure:

~~~html
<figure class="theme-comparison">
  <img class="theme-comparison__poster" src="assets/media/workspace-theme-comparison.png" alt="The Assistall AI workspace shown side by side in Assistall Limestone and Cobalt Blue themes.">
  <video class="theme-comparison__video" autoplay muted loop playsinline poster="assets/media/workspace-theme-comparison.png" aria-label="Assistall AI workspace scrolling side by side in Assistall Limestone and Cobalt Blue themes.">
    <source src="assets/media/workspace-theme-comparison.mp4" type="video/mp4">
  </video>
  <figcaption>Same workspace. Choose the look that suits your team.</figcaption>
</figure>
~~~

Place real HTML labels for “Assistall brand look” and “Cobalt Blue” outside the video so they remain visible when motion is reduced.

- [ ] **Step 5: Build the human, trust, about, and final-CTA sections**

Use only the final plain-English copy. Trust contains three real safeguards: runs locally, on-device speech recognition, and human review. The final action is direct contact, not sign-up.

- [ ] **Step 6: Check markup contract and commit**

Run:

~~~powershell
(Select-String -Path index.html -Pattern '<h1\b' -AllMatches).Matches.Count
rg -n 'workspace-theme-comparison|workspace-limestone|workspace-cobalt' index.html
git add index.html
git commit -m "feat: rebuild landing page structure"
~~~

Expected: exactly one h1 and only local media paths.

## Task 4: Implement the premium-minimal visual system

**Files:**
- Modify: assets/page.css
- Test: reduced-motion behaviour, colour-token-only source, and four responsive viewport inspections.

**Interfaces:**
- Consumes: semantic classes and local assets from Task 3 plus tokens from assets/brand.css.
- Produces: a responsive quiet-authority layout at the four required widths.

- [ ] **Step 1: Replace generic card-grid treatment with controlled editorial layout**

Build a two-column desktop hero with minmax(0, ...) grid tracks, a deep-teal field, warm limestone product surface, brass primary action, and restrained rules. Use only existing token variables.

- [ ] **Step 2: Style the work story and capability groups for scanning**

Make the work story one numbered progression with a brass connector line and large readable type. Use simple borders and spacing for capability groups. Do not add shadows, gradients, glass effects, sparkles, or glowing blobs.

- [ ] **Step 3: Style comparison media and no-motion fallback**

Use a fixed-ratio overflow-hidden comparison frame. Keep the poster beneath the video:

~~~css
.theme-comparison__poster { display: block; inline-size: 100%; }
.theme-comparison__video { position: absolute; inset: 0; inline-size: 100%; block-size: 100%; object-fit: cover; }

@media (prefers-reduced-motion: reduce) {
  .theme-comparison__video { display: none; }
}
~~~

- [ ] **Step 4: Add progressive non-essential motion**

Use opacity and at most 2px translateY. Guard scroll reveal so unsupported browsers stay fully visible:

~~~css
@supports (animation-timeline: view()) {
  .work-story__step {
    animation: quiet-reveal 520ms both ease-out;
    animation-timeline: view();
    animation-range: entry 12% cover 30%;
  }
}
~~~

- [ ] **Step 5: Implement responsive rules before final polish**

~~~css
@media (max-width: 1024px) {
  .hero-grid, .capabilities-grid, .human-value-grid, .final-cta-grid { grid-template-columns: 1fr; }
}
@media (max-width: 820px) {
  .site-nav { flex-basis: 100%; }
  .theme-labels, .trust-grid { grid-template-columns: 1fr; }
}
@media (max-width: 680px) {
  .header-inner { flex-direction: column; align-items: stretch; }
  .site-nav { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .button-row .button { flex: 1 1 100%; text-align: center; }
}
~~~

Do not use a phone device frame or say that the Windows desktop product is a native mobile app.

- [ ] **Step 6: Run CSS guard checks and commit**

Run:

~~~powershell
rg -n '#[0-9A-Fa-f]{3,8}' assets/page.css
rg -n -i 'gradient|box-shadow|blur\(|filter:|animation.*infinite' assets/page.css
git add assets/page.css
git commit -m "feat: add quiet authority visual system"
~~~

Expected: no literal colour outside the token file; no gradient, decorative shadow, blur, filter, or perpetual animation.

## Task 5: Add static verification and project documentation

**Files:**
- Create: tools/verify-site.ps1
- Modify: README.md
- Test: script exits successfully only when page contract holds.

**Interfaces:**
- Consumes: final index.html, assets/brand.css, assets/page.css, and all required local media paths.
- Produces: repeatable no-dependency pre-deployment validation.

- [ ] **Step 1: Create the static verification script**

~~~powershell
param([string]$Root = (Split-Path -Parent $PSScriptRoot))

$indexPath = Join-Path $Root 'index.html'
$html = Get-Content -Raw $indexPath
if ([regex]::Matches($html, '<h1\b').Count -ne 1) { throw 'index.html must contain exactly one h1.' }

$requiredAssets = @(
  'assets/apple-touch-icon.png',
  'assets/media/workspace-limestone.png',
  'assets/media/workspace-cobalt.png',
  'assets/media/workspace-theme-comparison.png',
  'assets/media/workspace-theme-comparison.mp4'
)
foreach ($asset in $requiredAssets) {
  if (-not (Test-Path (Join-Path $Root $asset))) { throw "Missing required asset: $asset" }
}

$externalSources = [regex]::Matches($html, '(?:src|href)="https?://[^"]+"') |
  ForEach-Object Value |
  Where-Object { $_ -notmatch 'assistall.ai/' }
if ($externalSources) { throw ('Unexpected external source: ' + ($externalSources -join ', ')) }

Write-Output 'Static site contract passed.'
~~~

- [ ] **Step 2: Run the script before page completion**

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/verify-site.ps1
~~~

Expected: fail with a named missing asset. This proves the asset gate is active.

- [ ] **Step 3: Run the script after Tasks 2–4 and update README**

Run the same command; expected output is Static site contract passed. Add a dated README entry describing the quiet-authority rebuild, local product media, and theme comparison clip. Document the command under Local preview.

- [ ] **Step 4: Commit documentation and verification**

~~~powershell
git add tools/verify-site.ps1 README.md
git commit -m "docs: add landing page verification"
~~~

## Task 6: Perform responsive, media, and accessibility QA

**Files:**
- Modify only if a verified defect is found: index.html, assets/page.css, tools/verify-site.ps1, README.md, or a reviewed asset.
- Test: local preview at exact required widths.

**Interfaces:**
- Consumes: completed static page and verification script.
- Produces: browser evidence that the page is legible, non-clipping, and self-contained.

- [ ] **Step 1: Start local static preview**

~~~powershell
python -m http.server 55264 --bind 127.0.0.1
~~~

Open http://127.0.0.1:55264/ in the browser.

- [ ] **Step 2: Inspect 1280px and 1024px**

Confirm readable header, brass actions, uncropped hero evidence, visible video poster before playback, and understandable theme comparison. Check document.documentElement.scrollWidth equals document.documentElement.clientWidth.

- [ ] **Step 3: Inspect 820px and 390px**

Confirm primary grids stack predictably. At 390px check header navigation, actions, poster, labels, and trust content fit without clipping or side scrolling. Confirm themes stack rather than compressing two screens into unreadable columns.

- [ ] **Step 4: Inspect reduced-motion and video fallback**

Enable reduced-motion emulation. Confirm MP4 is hidden and the poster plus text labels remain visible. Disable motion reduction; confirm the video is muted, loops, and displays no browser controls or blank state.

- [ ] **Step 5: Run final static checks and commit only QA fixes**

~~~powershell
powershell -ExecutionPolicy Bypass -File tools/verify-site.ps1
git diff --check
git status --short
~~~

Expected: static contract passes, no whitespace errors, and only intentional changes remain.

If QA required a fix:

~~~powershell
git add index.html assets/page.css tools/verify-site.ps1 README.md assets/media
git commit -m "fix: refine landing page responsive QA"
~~~

Skip this final commit if the working tree is already clean.

## Plan Self-Review

- **Spec coverage:** Tasks 1–4 cover plain-English copy, genuine branding, real media, Limestone/Cobalt comparison, motion, responsive behaviour, trust claims, and static deployment. Tasks 5–6 cover the source, asset, and browser checks.
- **Completeness scan:** The plan contains exact file names, copy, commands, media settings, CSS, and expected results. It intentionally contains no deferred implementation marker.
- **Consistency:** Every asset named in Task 2 is referenced by Task 3 and required by Task 5. The video fallback described in the specification is implemented and tested in Tasks 3, 4, and 6.
