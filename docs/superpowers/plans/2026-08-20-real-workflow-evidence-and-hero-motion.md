# Real Workflow Evidence and Hero Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static queue evidence with three safe, real Assistall workflow recordings and restore a flat official-logo hero that processes work through a true x-axis rotation.

**Architecture:** The static page remains progressively enhanced. `assets/site.js` owns hero and queue state, but separates SVG signals from an HTML/CSS 3D logo wrapper because SVG rotation is planar. Each workflow has a local MP4, PNG poster and semantic text fallback; JavaScript plays only the selected, visible clip.

**Tech Stack:** Semantic HTML, CSS keyframes, ES modules, Node built-in tests, Python Playwright/FFmpeg for local synthetic capture, responsive browser QA.

**Spec:** `docs/superpowers/specs/2026-08-20-real-workflow-evidence-and-hero-motion-design.md`

## Global Constraints

- Use the official Assistall branding assets. Do not redraw the logo.
- Hero inputs are neutral monochrome supported work only: email, WhatsApp export, folder, PDF, Word, Excel, CSV, PowerPoint, image, calendar file, Odoo and Zoho.
- No black hole, orbit ring, printer silhouette, provider-colour treatment or angled 3D cube.
- The processing action is exactly one complete `rotateX(360deg)` around the logo surface’s own horizontal axis; it is not SVG `rotate()` or a side-to-side tilt.
- The finished document is centred beneath the logo’s bottom edge and has a copper-ivory glow.
- Record only fictional Demo Trading LLC fixture data using a disposable `WADIH_AI_DATA_DIR`. Never record customer data, credentials, system notifications, local paths or live connectors.
- Store every review asset in `assets/media/workflows/`; never restore retired theme-comparison media.
- Videos are silent, muted, loopable, active-panel-only and have replay, poster, reduced-motion and no-JavaScript fallbacks.
- Complete a verification run and focused Git commit after every task.

## File Map

| Path | Responsibility |
| --- | --- |
| `assets/site.js` | Hero signals/3D surface and selected-video lifecycle |
| `assets/page.css` | Hero x-axis keyframes, media layout and fallbacks |
| `index.html` | Tabs, local media, replay controls and text fallback |
| `assets/media/workflows/*.mp4` / `*.png` | Sanitised synthetic recordings and first-frame posters |
| `tools/capture-workflow-media.ps1` | Disposable app startup, frame capture and local encoding |
| `tests/site-motion.test.mjs` | Hero and video lifecycle behaviour |
| `tests/site-contract.test.mjs` | Asset and semantic media contracts |
| `tools/verify-site.ps1` | Required local media and structural release checks |
| `docs/capture-workflow-media.md` | Operator capture/sanitisation procedure |

---

### Task 1: Add reproducible synthetic workflow capture media

**Files:**
- Create: `tools/capture-workflow-media.ps1`
- Create: `docs/capture-workflow-media.md`
- Create: `assets/media/workflows/contract-review.mp4`, `contract-review.png`, `shipment-review.mp4`, `shipment-review.png`, `report-preparation.mp4`, `report-preparation.png`
- Modify: `.gitignore`, `tests/site-contract.test.mjs`

**Interfaces:**
- Consumes: `C:\agency\assistall-app\approval_desk.py`, `multi_business/demo_scenarios/import_export.json`, `WADIH_AI_DATA_DIR`, Python Playwright and FFmpeg.
- Produces: `capture-workflow-media.ps1 -Workflow <contract-review|shipment-review|report-preparation|all> -AppRoot <path> -OutputRoot <path>`.
- Consumes: the app’s `seed-capture-fixtures` command, which refuses non-temporary normal-data targets.

- [ ] **Step 1: Write the failing asset contract test**

```js
test('workflow evidence references approved local recordings and posters', () => {
  for (const id of ['contract-review', 'shipment-review', 'report-preparation']) {
    assert.match(html, new RegExp(`assets/media/workflows/${id}\\.mp4`));
    assert.match(html, new RegExp(`assets/media/workflows/${id}\\.png`));
  }
});
```

- [ ] **Step 2: Run the test red**

Run: `node --test tests/site-contract.test.mjs`

Expected: FAIL because no real workflow assets are referenced.

- [ ] **Step 3: Implement the local-only capture runner and guide**

```powershell
param(
  [ValidateSet('contract-review','shipment-review','report-preparation','all')][string]$Workflow = 'all',
  [Parameter(Mandatory)][string]$AppRoot,
  [Parameter(Mandatory)][string]$OutputRoot
)
$captureData = Join-Path ([System.IO.Path]::GetTempPath()) ('assistall-capture-' + [guid]::NewGuid())
$env:WADIH_AI_DATA_DIR = $captureData
# Run approval_desk.py seed-capture-fixtures first; it refuses a normal app-data target.
# Start the seeded loopback app, capture the named route at 1440x900, encode a silent MP4/poster, then remove $captureData.
```

Document the three capture routes, sanitisation checklist, loopback-only requirement, shutdown and temporary-data cleanup. Ignore only the temporary directory pattern, never the reviewed output assets.

- [ ] **Step 4: Capture and validate the three recordings**

Run: `powershell -ExecutionPolicy Bypass -File tools/capture-workflow-media.ps1 -Workflow all -AppRoot C:\agency\assistall-app -OutputRoot assets\media\workflows`

Run: `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 assets/media/workflows/*.mp4`

Expected: three 4–6 second silent H.264 clips and matching posters with fictional Demo Trading LLC data only.

- [ ] **Step 5: Run the test green and commit**

Run: `node --test tests/site-contract.test.mjs`

Expected: PASS.

```powershell
git add .gitignore tools/capture-workflow-media.ps1 docs/capture-workflow-media.md assets/media/workflows tests/site-contract.test.mjs
git commit -m "feat: add synthetic workflow evidence media"
```

---

### Task 2: Restore the hero through a true x-axis process motion

**Files:**
- Modify: `assets/site.js:5-264`, `assets/page.css`, `tests/site-motion.test.mjs`, `tests/site-contract.test.mjs`

**Interfaces:**
- Consumes: `HERO_MOTION_ITEMS`, `createHeroMotionMarkup(items)` and `prefersReducedMotion()`.
- Produces: `hero-workspace-surface`, `hero-workspace-spin`, `hero-workspace-output`, `hero-document-glow`, and `heroWorkspaceProcessXSpin`.

- [ ] **Step 1: Write failing x-axis hero tests**

```js
test('hero processes inputs through one true horizontal-axis logo rotation', () => {
  const markup = createHeroMotionMarkup();
  const css = readFileSync(resolve(root, 'assets/page.css'), 'utf8');
  assert.match(markup, /class="hero-workspace-surface"/);
  assert.match(markup, /class="hero-workspace-spin"/);
  assert.match(css, /@keyframes heroWorkspaceProcessXSpin/);
  assert.match(css, /rotateX\(360deg\)/);
  assert.doesNotMatch(markup, /hero-engine__face|hero-engine__orbit|foreignObject/);
});

test('hero output is centred beneath the bottom edge without an intake hole or ring', () => {
  const markup = createHeroMotionMarkup();
  assert.match(markup, /hero-workspace-output/);
  assert.match(markup, /hero-document-glow/);
  assert.doesNotMatch(markup, /hero-intake-hole|hero-spin-ring/);
});
```

- [ ] **Step 2: Run the tests red**

Run: `node --test tests/site-motion.test.mjs`

Expected: FAIL because the existing SVG uses planar rotation rather than `rotateX(360deg)`.

- [ ] **Step 3: Implement the flat surface and x-axis wrapper**

Retain SVG only for drifting input signals. Layer the official icon in an ordinary HTML surface, so CSS can rotate around the x-axis:

```html
<div class="hero-workspace-spin" aria-hidden="true">
  <div class="hero-workspace-surface"><img src="assets/android-chrome-512x512.png" alt=""></div>
</div>
<div class="hero-workspace-output" aria-hidden="true"><span class="hero-document-glow"></span></div>
```

```css
.hero-workspace-spin { transform-style: preserve-3d; }
.hero-workspace-spin.is-processing { animation: heroWorkspaceProcessXSpin 5s ease-in-out infinite; }
@keyframes heroWorkspaceProcessXSpin {
  0%, 36%, 74%, 100% { transform: rotateX(0deg); }
  48%, 62% { transform: rotateX(360deg); }
}
```

Route signals to the top edge, center the output below the bottom edge, preserve the teal film and make `?motion=off` completely still.

- [ ] **Step 4: Run tests green, visually inspect, then commit**

Run: `node --test tests/site-motion.test.mjs tests/site-contract.test.mjs`

Expected: PASS.

Inspect `http://127.0.0.1:55265/?motion=on` at 1440×900 before/during the spin plus `?motion=off`; no overflow, angle or printer-like silhouette.

```powershell
git add assets/site.js assets/page.css tests/site-motion.test.mjs tests/site-contract.test.mjs
git commit -m "feat: restore x-axis hero workflow motion"
```

---

### Task 3: Integrate real recordings into the Living Work Queue

**Files:**
- Modify: `index.html:183-280`, `assets/site.js:10-379`, `assets/page.css`, `tests/site-motion.test.mjs`, `tests/site-contract.test.mjs`

**Interfaces:**
- Consumes: `contract`, `shipment`, `report` workflow IDs and Task 1 local assets.
- Produces: `shouldPlayWorkflowVideo({ active, visible, reducedMotion })` and `data-workflow-video` / `data-workflow-replay` controls.

- [ ] **Step 1: Write failing media-lifecycle tests**

```js
test('workflow queue maps tabs to local videos and posters', () => {
  for (const id of ['contract', 'shipment', 'report']) {
    assert.match(html, new RegExp(`data-workflow-tab=["']${id}["']`));
    assert.match(html, new RegExp(`data-workflow-video=["']${id}["']`));
  }
});

test('workflow media plays only when selected, visible and motion-enabled', () => {
  assert.equal(shouldPlayWorkflowVideo({ active: true, visible: true, reducedMotion: false }), true);
  assert.equal(shouldPlayWorkflowVideo({ active: false, visible: true, reducedMotion: false }), false);
  assert.equal(shouldPlayWorkflowVideo({ active: true, visible: false, reducedMotion: false }), false);
  assert.equal(shouldPlayWorkflowVideo({ active: true, visible: true, reducedMotion: true }), false);
});
```

- [ ] **Step 2: Run the tests red**

Run: `node --test tests/site-contract.test.mjs tests/site-motion.test.mjs`

Expected: FAIL because `reply` has no recording and playback state does not exist.

- [ ] **Step 3: Implement semantic media panels and lifecycle**

Replace `reply` with `report`, retain source → prepare → review text, then add local media:

```html
<video data-workflow-video="contract" muted loop playsinline preload="metadata"
  poster="assets/media/workflows/contract-review.png" aria-label="Assistall contract review using synthetic data">
  <source src="assets/media/workflows/contract-review.mp4" type="video/mp4">
</video>
<button type="button" data-workflow-replay="contract">Replay contract review</button>
```

Pause inactive/hidden videos before playing the selected visible video. Playback rejection leaves poster and text usable. Replay resets `currentTime` to `0` and plays only if the predicate returns true. At 390/360px media/text stack with no clipped control; reduced motion keeps the poster/text but disables automatic playback.

- [ ] **Step 4: Run tests green and commit**

Run: `node --test tests/site-contract.test.mjs tests/site-motion.test.mjs`

Expected: PASS.

```powershell
git add index.html assets/site.js assets/page.css tests/site-contract.test.mjs tests/site-motion.test.mjs
git commit -m "feat: show real workflow evidence in living queue"
```

---

### Task 4: Verify the release surface and commit the evidence

**Files:**
- Modify: `tools/verify-site.ps1`, `README.md`, `docs/capture-workflow-media.md`, `tests/site-contract.test.mjs`

**Interfaces:**
- Consumes: all six Task 1 assets, Task 2 hero marker and Task 3 media markers.
- Produces: verifier rules for final workflow evidence and x-axis motion.

- [ ] **Step 1: Write a failing verifier-contract test**

```js
test('release verifier requires workflow assets and x-axis hero motion', () => {
  const verifier = readFileSync(resolve(root, 'tools/verify-site.ps1'), 'utf8');
  assert.match(verifier, /assets\/media\/workflows\/contract-review\.mp4/);
  assert.match(verifier, /assets\/media\/workflows\/shipment-review\.mp4/);
  assert.match(verifier, /assets\/media\/workflows\/report-preparation\.mp4/);
  assert.match(verifier, /heroWorkspaceProcessXSpin/);
});
```

- [ ] **Step 2: Run the test red**

Run: `node --test tests/site-contract.test.mjs`

Expected: FAIL until the verifier knows the final media and x-axis marker.

- [ ] **Step 3: Update verifier and operator documentation**

Require six workflow assets and the hero/media markers. Update README with capture and QA commands. Do not claim production deployment is complete.

- [ ] **Step 4: Run the full evidence gate**

Run: `node --test tests\*.test.mjs`

Run: `powershell -ExecutionPolicy Bypass -File tools\verify-site.ps1`

Run: `git diff --check`

Run: `graphify update .`

Expected: every test passes, verifier prints `SITE_CHECK_PASSED`, whitespace exits `0`, and the graph update completes.

- [ ] **Step 5: Complete browser QA and commit**

At 1920, 1440, 1024, 820, 390 and 360px verify no overlap, clipping or horizontal overflow; all tabs/replay controls work; inactive clips never play; keyboard selection works; the x-axis spin is clear; and `?motion=off` is static and usable.

```powershell
git add tools/verify-site.ps1 README.md docs/capture-workflow-media.md tests/site-contract.test.mjs graphify-out
git commit -m "test: verify real workflow evidence release"
```
