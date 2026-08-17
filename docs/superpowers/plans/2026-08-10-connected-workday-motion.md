# Connected Workday Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deliberate internal navigation, a real Connected Workday motion scene, and reliable workspace-video playback to the static landing page.

**Architecture:** Keep the static HTML/CSS site. `assets/site.js` is a progressive-enhancement ES module: exported pure functions provide testable scrolling calculations while browser-only initialisers handle hash links, scene entry, and optional video playback.

**Tech Stack:** semantic HTML, CSS, browser-native `IntersectionObserver`, `requestAnimationFrame`, native video, Node's built-in test runner, and browser QA.

## Global Constraints

- No external requests, dependencies, tracker, framework, or build step.
- Use the established Assistall palette and only real Assistall workspace imagery.
- Honour `prefers-reduced-motion`; the visitor may manually play the workspace tour.
- Validate at 1280px, 1024px, 820px, and 390px.

### Task 1: Define and test the navigation motion contract

**Files:**
- Create: `tests/site-motion.test.mjs`
- Create: `assets/site.js`

**Interfaces:**
- `calculateScrollDuration(distance: number): number` returns a clamped 700–1400 millisecond duration.
- `easeInOutCubic(progress: number): number` returns a bounded curve between 0 and 1.
- `getTargetScrollTop(targetTop: number, headerHeight: number): number` returns a non-negative scroll location.

- [ ] Write `tests/site-motion.test.mjs` with assertions for duration clamping, monotonic duration, target offset clamping, and curve endpoints.
- [ ] Run `node --test tests/site-motion.test.mjs` and confirm it fails because `assets/site.js` does not yet exist.
- [ ] Implement the three exported pure functions and browser-only `enableSectionGlide()` behaviour in `assets/site.js`.
- [ ] Run `node --test tests/site-motion.test.mjs` and confirm it passes.

### Task 2: Replace static process presentation with the Connected Workday scene

**Files:**
- Modify: `index.html`
- Modify: `assets/page.css`

**Interfaces:**
- `data-workday-scene` identifies the one scroll-triggered narrative scene.
- `.workday-scene--active` is added only by `assets/site.js` after the scene enters the viewport.

- [ ] Add `data-scroll-link` to internal navigation links and use `#demo` for the public demo path.
- [ ] Add the scene's incoming-work cards, authentic workspace figure, and human review block without making any new product or connector claim.
- [ ] Style the scene as a three-part process at desktop and a readable stack at tablet/mobile. Motion must only run after `.workday-scene--active` is present.
- [ ] Add the local ES module at the end of `index.html`.

### Task 3: Make workspace motion visible and controllable

**Files:**
- Modify: `index.html`
- Modify: `assets/page.css`
- Modify: `assets/site.js`

**Interfaces:**
- `[data-workspace-tour]` owns one native `<video>` and one `[data-video-toggle]` control.
- `enableWorkspaceTour()` auto-plays only when motion is allowed and plays after an explicit request in all cases.

- [ ] Add a clearly named tour control and a small status label to the real workspace video figure.
- [ ] Preserve the poster image as a video-failure and reduced-motion fallback; do not hide the video control on mobile.
- [ ] Test sampled MP4 frames and run the offline checks.

### Task 4: Browser validation

**Files:**
- Test: `tools/verify-site.ps1`
- Test: live local landing page

- [ ] Run the offline verification script and the Node tests.
- [ ] Inspect normal-motion and reduced-motion behaviour, verify the manual video control, and check all required viewports for overflow and overlapping content.
- [ ] Exercise one representative link for each destination and verify the destination aligns below the sticky header.
