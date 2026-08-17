# Connector Ecosystem and Workflow Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generic connector bars and theme-comparison media with monochrome recognizable connector marks and an accessible, responsive Living Work Queue showing three real Assistall workflows.

**Architecture:** Keep the existing framework-free HTML, CSS and ES module structure. Static semantic HTML supplies the no-JavaScript experience; `assets/site.js` progressively enhances workflow selection, keyboard navigation and visibility-aware rotation. A local SVG symbol sprite supplies monochrome connector marks without adding a runtime dependency or external request.

**Tech Stack:** Semantic HTML5, CSS custom properties and media queries, vanilla ES modules, Node.js built-in test runner, local SVG assets, in-app Chromium browser QA, Graphify.

## Global Constraints

- Default connector logo colours are limestone and charcoal; copper is reserved for hover, focus and selected states.
- Provider brand colours do not appear in the connector marketing section.
- Imported sources and setup-dependent ecosystems must remain explicitly labelled.
- Workflow evidence is limited to Contract review, Shipment tracking and Prepared reply.
- Nothing may imply that replies are sent automatically.
- The active workflow advances every seven seconds only while the section is visible and not paused by user interaction.
- Without JavaScript, Contract review must remain fully visible and understandable.
- Reduced-motion mode must remove travelling and translating motion.
- No framework or new package dependency is introduced.
- Existing Cloudflare, cPanel, Supabase and demo-request security behaviour must not change.
- Do not delete the old media files in this iteration; remove only their production-page references so rollback remains recoverable.

---

## File map

- Create `assets/connector-icons.svg`: local monochrome symbol sprite with provider, local-source and file-format marks.
- Modify `index.html`: connector logo markup, honest status labels and the semantic Living Work Queue.
- Modify `assets/page.css`: connector states, workflow frame, responsive layouts, operational-current motion and fallbacks.
- Modify `assets/site.js`: workflow data/state helpers and progressive enhancement; remove workspace-video behaviour.
- Modify `tests/site-contract.test.mjs`: static connector and workflow content contract.
- Modify `tests/site-interactions.test.mjs`: workflow state, rotation and keyboard-navigation unit tests.
- Modify `tests/site-motion.test.mjs`: remove workspace-video expectations and assert workflow motion/reduced-motion hooks.
- Update `graphify-out/*` mechanically with `graphify update .` after verified source changes.

### Task 1: Connector icon contract and local sprite

**Files:**
- Create: `assets/connector-icons.svg`
- Modify: `index.html:123-143`
- Test: `tests/site-contract.test.mjs`

**Interfaces:**
- Consumes: existing `.connector-grid` section and Assistall colour tokens.
- Produces: SVG symbols `connector-microsoft`, `connector-gmail`, `connector-whatsapp`, `connector-odoo`, `connector-zoho`, `connector-folder`, `connector-calendar`, `connector-pdf`, `connector-word`, `connector-excel`, and `connector-csv`; HTML references them through `assets/connector-icons.svg#<id>`.

- [ ] **Step 1: Replace the obsolete media contract with failing connector assertions**

Add this test to `tests/site-contract.test.mjs` and remove the old test named `real workspace evidence includes both responsive videos and static fallbacks`:

```js
test('connector ecosystem uses local recognizable marks and honest capability labels', () => {
  const connectorCards = html.match(/class="connector-card\b/g) ?? [];
  assert.equal(connectorCards.length, 8);

  for (const id of ['microsoft', 'gmail', 'whatsapp', 'odoo', 'zoho', 'folder', 'calendar']) {
    assert.match(html, new RegExp(`connector-icons\\.svg#connector-${id}`));
  }

  for (const id of ['pdf', 'word', 'excel', 'csv']) {
    assert.match(html, new RegExp(`connector-icons\\.svg#connector-${id}`));
  }

  assert.equal((html.match(/class="connector-card__fallback"/g) ?? []).length, 8);
  assert.equal((html.match(/Setup-dependent/g) ?? []).length, 4);
  assert.equal((html.match(/Imported source/g) ?? []).length, 4);
});
```

- [ ] **Step 2: Run the connector contract and verify it fails**

Run: `node --test tests/site-contract.test.mjs`

Expected: FAIL because `.connector-card` and `connector-icons.svg` references do not exist yet.

- [ ] **Step 3: Create the local SVG sprite**

Create `assets/connector-icons.svg` as one accessible-hidden sprite. Use `fill="currentColor"` or `stroke="currentColor"` only—no provider colour values. The file must have this stable interface:

```svg
<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="connector-microsoft" viewBox="0 0 32 32">
    <path fill="currentColor" d="M3 3h12v12H3zm14 0h12v12H17zM3 17h12v12H3zm14 0h12v12H17z"/>
  </symbol>
  <symbol id="connector-gmail" viewBox="0 0 32 32">
    <rect x="3" y="7" width="26" height="19" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <path d="m5 9 11 9L27 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
  </symbol>
  <symbol id="connector-whatsapp" viewBox="0 0 32 32">
    <path d="M6 26.5 7.5 22A11 11 0 1 1 11 26Z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>
    <path d="M12 10.5c.8 4.4 3.2 6.8 7.5 7.7l1.4-1.8 3 1.4c-.4 3-2.1 4.2-4.7 3.8-5.8-.9-9.8-4.9-10.7-10.7-.4-2.6.8-4.3 3.8-4.7l1.4 3Z" fill="currentColor"/>
  </symbol>
  <symbol id="connector-odoo" viewBox="0 0 48 32">
    <text x="2" y="22" fill="currentColor" font-family="Arial,sans-serif" font-size="20" font-weight="700">odoo</text>
  </symbol>
  <symbol id="connector-zoho" viewBox="0 0 48 32">
    <g fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="7" width="11" height="18" rx="2"/><rect x="12.5" y="5" width="11" height="18" rx="2"/><rect x="24" y="8" width="11" height="18" rx="2"/><rect x="35.5" y="6" width="11" height="18" rx="2"/></g>
    <text x="3.4" y="20" fill="currentColor" font-family="Arial,sans-serif" font-size="10" font-weight="700">Z</text><text x="14.5" y="18" fill="currentColor" font-family="Arial,sans-serif" font-size="10" font-weight="700">O</text><text x="26.2" y="21" fill="currentColor" font-family="Arial,sans-serif" font-size="10" font-weight="700">H</text><text x="37.5" y="19" fill="currentColor" font-family="Arial,sans-serif" font-size="10" font-weight="700">O</text>
  </symbol>
  <symbol id="connector-folder" viewBox="0 0 32 32">
    <path d="M3 9a3 3 0 0 1 3-3h7l3 3h10a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>
  </symbol>
  <symbol id="connector-calendar" viewBox="0 0 32 32">
    <rect x="4" y="6" width="24" height="22" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 12h24M10 3v6M22 3v6M9 17h3m4 0h3m4 0h1M9 22h3m4 0h3m4 0h1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
  </symbol>
  <symbol id="connector-pdf" viewBox="0 0 32 32">
    <path d="M7 3h12l6 6v20H7Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19 3v7h6" fill="none" stroke="currentColor" stroke-width="2"/><text x="9" y="23" fill="currentColor" font-family="Arial,sans-serif" font-size="8" font-weight="700">PDF</text>
  </symbol>
  <symbol id="connector-word" viewBox="0 0 32 32">
    <path d="M11 4h15v24H11Z" fill="none" stroke="currentColor" stroke-width="2"/><rect x="3" y="8" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><text x="6" y="20" fill="currentColor" font-family="Arial,sans-serif" font-size="11" font-weight="700">W</text>
  </symbol>
  <symbol id="connector-excel" viewBox="0 0 32 32">
    <path d="M11 4h15v24H11Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M17 9h9M17 15h9M17 21h9M20 4v24" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="8" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><text x="6" y="20" fill="currentColor" font-family="Arial,sans-serif" font-size="11" font-weight="700">X</text>
  </symbol>
  <symbol id="connector-csv" viewBox="0 0 32 32">
    <path d="M6 3h14l6 6v20H6Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 3v7h6M10 14h12M10 19h12M10 24h12M14 12v14M19 12v14" stroke="currentColor" stroke-width="1.5"/>
  </symbol>
</svg>
```

Provider names remain visible as adjacent HTML text, so the marks do not need embedded accessible text.

- [ ] **Step 4: Replace connector bars with semantic logo groups**

Each `index.html` connector card must follow this pattern:

```html
<article class="connector-card">
  <div class="connector-card__mark" aria-hidden="true">
    <span class="connector-card__fallback">MS</span>
    <svg viewBox="0 0 32 32"><use href="assets/connector-icons.svg#connector-microsoft"></use></svg>
  </div>
  <div class="connector-card__copy">
    <h3>Microsoft 365 and Outlook</h3>
    <p>Setup-dependent</p>
  </div>
</article>
```

Use a four-icon `.connector-card__formats` group for PDF, Word, Excel and CSV. Give every card a short fallback (`MS`, `GM`, `WA`, `OD`, `ZB`, `FILES`, `CAL`, `DOCS`) that remains hidden unless the sprite validation in Task 3 adds `.connector-icons-unavailable` to the document element. Add `tabindex="0"` and `aria-label="Tools and file types supported by Assistall"` to `.connector-grid` so keyboard users can scroll the mobile row.

- [ ] **Step 5: Run the connector contract and verify it passes**

Run: `node --test tests/site-contract.test.mjs`

Expected: PASS for the connector test; the workflow test introduced in Task 2 does not exist yet.

- [ ] **Step 6: Commit the connector structure**

```powershell
git add -- assets/connector-icons.svg index.html tests/site-contract.test.mjs
git commit -m "feat: add recognizable connector marks"
```

### Task 2: Semantic Living Work Queue markup

**Files:**
- Modify: `index.html:145-175`
- Test: `tests/site-contract.test.mjs`

**Interfaces:**
- Consumes: symbol ids from Task 1 and the existing `#product` anchor.
- Produces: root `[data-workflow-evidence]`, tabs `[data-workflow-tab="contract|shipment|reply"]`, and panels `[data-workflow-panel="contract|shipment|reply"]` used by Task 3.

- [ ] **Step 1: Write the failing workflow markup contract**

Append to `tests/site-contract.test.mjs`:

```js
test('product evidence is a semantic three-workflow queue without theme media', () => {
  assert.match(html, /data-workflow-evidence/);
  for (const id of ['contract', 'shipment', 'reply']) {
    assert.match(html, new RegExp(`data-workflow-tab=["']${id}["']`));
    assert.match(html, new RegExp(`data-workflow-panel=["']${id}["']`));
  }
  assert.equal((html.match(/role="tab"/g) ?? []).length >= 3, true);
  assert.match(html, /Ready for review/);
  assert.match(html, /Approve reply/);
  assert.doesNotMatch(html, /workspace-theme-comparison|workspace-cobalt|data-workspace-video|data-video-toggle/);
});
```

- [ ] **Step 2: Run the static contract and verify it fails**

Run: `node --test tests/site-contract.test.mjs`

Expected: FAIL because the theme captures and workspace videos are still present.

- [ ] **Step 3: Replace the product section markup**

Keep `id="product"`, the eyebrow and headline. Change the supporting sentence to:

```html
<p>Follow real business work from the source to a clear next step your team can check.</p>
```

Add a tablist with these stable ids and relationships:

```html
<div class="workflow-tabs" role="tablist" aria-label="Assistall workflow examples">
  <button id="workflow-tab-contract" type="button" role="tab" aria-selected="true" aria-controls="workflow-panel-contract" tabindex="0" data-workflow-tab="contract">Contract review</button>
  <button id="workflow-tab-shipment" type="button" role="tab" aria-selected="false" aria-controls="workflow-panel-shipment" tabindex="-1" data-workflow-tab="shipment">Shipment tracking</button>
  <button id="workflow-tab-reply" type="button" role="tab" aria-selected="false" aria-controls="workflow-panel-reply" tabindex="-1" data-workflow-tab="reply">Prepared reply</button>
</div>
```

Create three `.workflow-panel` elements. The contract panel is visible; shipment and reply use `hidden`. Each panel contains exactly three `.workflow-stage` articles labelled `Source received`, `Assistall prepares`, and `Ready for review`, connected by decorative `.workflow-current` elements with `aria-hidden="true"`. Use fictional content:

- Contract: `Service_Agreement.pdf`, Northstar Supplies, renewal 30 September, changed payment term, source page references, `Review contract`.
- Shipment: `Delivery 1842`, arrival 18 August, status changed to customs review, carrier record evidence, `Review delivery update`.
- Reply: email from `Maya · Clear Route`, request for revised delivery timing, prepared two-paragraph reply with cited shipment record, `Approve reply`, `Edit`, and `Reject`.

Do not add controls that pretend to change real data. Workflow result buttons are visual evidence only and must use `<span>` elements styled as controls, not active `<button>` elements.

- [ ] **Step 4: Run the static contract and verify it passes**

Run: `node --test tests/site-contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the semantic workflow frame**

```powershell
git add -- index.html tests/site-contract.test.mjs
git commit -m "feat: add living work queue evidence"
```

### Task 3: Workflow state, rotation and keyboard interaction

**Files:**
- Modify: `assets/site.js:1-280, initialiseSite()`
- Modify: `tests/site-interactions.test.mjs`
- Modify: `tests/site-motion.test.mjs`

**Interfaces:**
- Consumes: Task 2 data attributes and ARIA relationships.
- Produces: `WORKFLOW_ROTATION_MS`, `WORKFLOW_IDS`, `createWorkflowState(requestedId)`, `getWorkflowTabTarget(currentIndex, key, total)`, `shouldRotateWorkflow({ visible, reducedMotion, interactionPaused })`, and internal `enableWorkflowEvidence()`.

- [ ] **Step 1: Write failing pure-state and keyboard tests**

Add to `tests/site-interactions.test.mjs`:

```js
test('workflow evidence keeps one valid active workflow', () => {
  assert.deepEqual(site.WORKFLOW_IDS, ['contract', 'shipment', 'reply']);
  assert.equal(site.WORKFLOW_ROTATION_MS, 7000);
  assert.equal(site.createWorkflowState('shipment').activeId, 'shipment');
  assert.equal(site.createWorkflowState('unknown').activeId, 'contract');
});

test('workflow keyboard navigation wraps and supports Home and End', () => {
  assert.equal(site.getWorkflowTabTarget(0, 'ArrowRight', 3), 1);
  assert.equal(site.getWorkflowTabTarget(2, 'ArrowRight', 3), 0);
  assert.equal(site.getWorkflowTabTarget(0, 'ArrowLeft', 3), 2);
  assert.equal(site.getWorkflowTabTarget(1, 'Home', 3), 0);
  assert.equal(site.getWorkflowTabTarget(1, 'End', 3), 2);
  assert.equal(site.getWorkflowTabTarget(1, 'Enter', 3), 1);
});

test('workflow rotation requires visibility, motion and no interaction pause', () => {
  assert.equal(site.shouldRotateWorkflow({ visible: true, reducedMotion: false, interactionPaused: false }), true);
  assert.equal(site.shouldRotateWorkflow({ visible: false, reducedMotion: false, interactionPaused: false }), false);
  assert.equal(site.shouldRotateWorkflow({ visible: true, reducedMotion: true, interactionPaused: false }), false);
  assert.equal(site.shouldRotateWorkflow({ visible: true, reducedMotion: false, interactionPaused: true }), false);
});
```

Remove the obsolete `workspace media only autoplays...` test. In `tests/site-motion.test.mjs`, remove `selectVisibleVideo` from imports and delete its video-selection test.

- [ ] **Step 2: Run interaction and motion tests and verify they fail**

Run: `node --test tests/site-interactions.test.mjs tests/site-motion.test.mjs`

Expected: FAIL because the workflow exports do not exist.

- [ ] **Step 3: Implement the pure workflow helpers**

Add the exact constants and functions:

```js
export const WORKFLOW_ROTATION_MS = 7000;
export const WORKFLOW_IDS = Object.freeze(['contract', 'shipment', 'reply']);

export function createWorkflowState(requestedId) {
  const activeId = WORKFLOW_IDS.includes(requestedId) ? requestedId : WORKFLOW_IDS[0];
  return { activeId, items: WORKFLOW_IDS.map((id) => ({ id, active: id === activeId })) };
}

export function getWorkflowTabTarget(currentIndex, key, total) {
  if (key === 'Home') return 0;
  if (key === 'End') return total - 1;
  if (key === 'ArrowRight') return (currentIndex + 1) % total;
  if (key === 'ArrowLeft') return (currentIndex - 1 + total) % total;
  return currentIndex;
}

export function shouldRotateWorkflow({ visible, reducedMotion, interactionPaused }) {
  return Boolean(visible && !reducedMotion && !interactionPaused);
}
```

Remove `selectVisibleVideo`, `shouldAutoplayMedia` and `enableWorkspaceTour` because the page no longer has responsive videos.

- [ ] **Step 4: Add progressive enhancement**

Implement `enableWorkflowEvidence()` with this structure, then call it from `initialiseSite()` in place of `enableWorkspaceTour()`:

```js
function enableWorkflowEvidence() {
  const root = document.querySelector('[data-workflow-evidence]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[data-workflow-tab]')];
  const panels = [...root.querySelectorAll('[data-workflow-panel]')];
  if (!tabs.length || !panels.length) return;

  let activeId = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.dataset.workflowTab ?? WORKFLOW_IDS[0];
  let visible = false;
  let interactionPaused = false;
  let timerId;

  const clearTimer = () => {
    if (timerId) window.clearTimeout(timerId);
    timerId = undefined;
  };

  let schedule = () => {};
  const activate = (requestedId, { focus = false, resetTimer = true } = {}) => {
    activeId = createWorkflowState(requestedId).activeId;
    tabs.forEach((tab) => {
      const active = tab.dataset.workflowTab === activeId;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (focus && active) tab.focus();
    });
    panels.forEach((panel) => {
      const active = panel.dataset.workflowPanel === activeId;
      panel.hidden = !active;
      if (active) panel.dataset.active = 'true';
      else delete panel.dataset.active;
    });
    root.dataset.activeWorkflow = activeId;
    if (resetTimer) schedule();
  };

  schedule = () => {
    clearTimer();
    if (!shouldRotateWorkflow({ visible, reducedMotion: prefersReducedMotion(), interactionPaused })) return;
    timerId = window.setTimeout(() => {
      const nextIndex = (WORKFLOW_IDS.indexOf(activeId) + 1) % WORKFLOW_IDS.length;
      activate(WORKFLOW_IDS[nextIndex], { resetTimer: false });
      schedule();
    }, WORKFLOW_ROTATION_MS);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab.dataset.workflowTab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const target = getWorkflowTabTarget(index, event.key, tabs.length);
      activate(tabs[target].dataset.workflowTab, { focus: true });
    });
  });

  root.addEventListener('mouseenter', () => { interactionPaused = true; schedule(); });
  root.addEventListener('mouseleave', () => { interactionPaused = false; schedule(); });
  root.addEventListener('focusin', () => { interactionPaused = true; schedule(); });
  root.addEventListener('focusout', (event) => {
    if (event.relatedTarget && root.contains(event.relatedTarget)) return;
    interactionPaused = false;
    schedule();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    }, { threshold: 0.35 }).observe(root);
  }

  root.classList.add('is-enhanced');
  activate(activeId, { resetTimer: false });
}
```

Do not use `setInterval`; a self-scheduling timeout makes pause and timer-reset behaviour deterministic.

Add and initialize this asset fallback alongside `enableWorkflowEvidence()`:

```js
async function enableConnectorIconFallback() {
  try {
    const response = await fetch('assets/connector-icons.svg', { cache: 'force-cache' });
    if (!response.ok) throw new Error('Connector sprite unavailable');
    const source = await response.text();
    const complete = ['microsoft', 'gmail', 'whatsapp', 'odoo', 'zoho', 'folder', 'calendar', 'pdf', 'word', 'excel', 'csv']
      .every((id) => source.includes(`id="connector-${id}"`));
    if (!complete) throw new Error('Connector sprite incomplete');
  } catch {
    document.documentElement.classList.add('connector-icons-unavailable');
  }
}
```

Call `enableConnectorIconFallback()` from `initialiseSite()`. It does not block the rest of initialization.

- [ ] **Step 5: Run the interaction and motion tests**

Run: `node --test tests/site-interactions.test.mjs tests/site-motion.test.mjs`

Expected: PASS except for the CSS motion-hook assertion updated in Task 4.

- [ ] **Step 6: Commit workflow behaviour**

```powershell
git add -- assets/site.js tests/site-interactions.test.mjs tests/site-motion.test.mjs
git commit -m "feat: animate accessible workflow evidence"
```

### Task 4: Premium responsive styling and reduced-motion treatment

**Files:**
- Modify: `assets/page.css:113-137, 186-239`
- Test: `tests/site-motion.test.mjs`

**Interfaces:**
- Consumes: connector and workflow class names from Tasks 1 and 2 plus `data-active` from Task 3.
- Produces: desktop, tablet, mobile and reduced-motion layouts without page overflow.

- [ ] **Step 1: Replace the video motion assertion with failing workflow CSS assertions**

Change the final test in `tests/site-motion.test.mjs` to:

```js
test('motion preview and reduced motion explicitly control workflow movement', () => {
  assert.match(siteScript, /data-motion-preview/);
  assert.match(pageCss, /@keyframes workflow-current/);
  assert.match(pageCss, /prefers-reduced-motion: reduce[\s\S]*workflow-current/);
  assert.match(pageCss, /data-motion-preview="off"[\s\S]*workflow-current/);
});
```

- [ ] **Step 2: Run the motion test and verify it fails**

Run: `node --test tests/site-motion.test.mjs`

Expected: FAIL because `workflow-current` styling and keyframes do not exist.

- [ ] **Step 3: Restyle the connector grid**

Replace the generic `<i>` rules with:

- `.connector-card` as a quiet limestone surface with a one-pixel translucent rule and 20–24px padding.
- `.connector-card__mark` as a 52px square charcoal/teal mark well.
- `.connector-card__mark svg` and `.connector-card__formats svg` using `color: var(--charcoal)`.
- `.connector-card__fallback` hidden by default; `.connector-icons-unavailable .connector-card__fallback` shown and the corresponding SVG hidden.
- Hover and `:focus-within` translate no more than 4px, strengthen the copper border and set icon colour to `var(--brass)`.
- The grid focus ring uses `outline: 2px solid var(--brass); outline-offset: 6px`.
- At `max-width: 560px`, use `display: grid; grid-auto-flow: column; grid-auto-columns: minmax(250px, 82vw); overflow-x: auto; scroll-snap-type: x proximity; overscroll-behavior-inline: contain` and `scroll-snap-align: start` on cards.

- [ ] **Step 4: Build the shared workflow surface**

Create focused rules for:

- `.workflow-evidence`: teal/charcoal workspace shell with one border and shadow.
- `.workflow-tabs`: compact horizontal tab row with copper active underline and visible keyboard focus.
- `.workflow-panel`: three-column grid using `minmax(0, 1fr)` tracks.
- `.workflow-stage`: readable limestone surfaces with structural eyebrow, title, evidence rows and status chips.
- `.workflow-current`: narrow connector lane whose pseudo-element carries the copper current.
- `[data-workflow-panel][hidden] { display: none; }` to prevent overlap.
- `[data-workflow-panel][data-active="true"]`: one 280–360ms opacity/translate entrance.

Use this animation contract:

```css
@keyframes workflow-current {
  from { transform: translateX(-115%); opacity: 0; }
  20%, 75% { opacity: 1; }
  to { transform: translateX(115%); opacity: 0; }
}
```

At `max-width: 820px`, keep the tab row scrollable and reduce workspace padding. At `max-width: 560px`, stack stages vertically and rotate the current into a vertical connector. Do not absolutely position workflow content.

- [ ] **Step 5: Add explicit reduced-motion and QA overrides**

Inside `@media (prefers-reduced-motion: reduce)` and `html[data-motion-preview="off"]`, stop `.workflow-current::after` animation and remove panel translation. Under `html[data-motion-preview="on"]`, allow the workflow-current animation so `?motion=on` remains a reliable QA control.

- [ ] **Step 6: Run the motion and static tests**

Run: `node --test tests/site-motion.test.mjs tests/site-contract.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit the visual system**

```powershell
git add -- assets/page.css tests/site-motion.test.mjs
git commit -m "style: unify connectors and workflow evidence"
```

### Task 5: Full regression and browser QA

**Files:**
- Modify only if a test or browser finding requires a scoped correction: `index.html`, `assets/page.css`, `assets/site.js`, or the three site tests.
- Update mechanically: `graphify-out/*`

**Interfaces:**
- Consumes: complete feature from Tasks 1–4.
- Produces: verified responsive behaviour and an updated project graph.

- [ ] **Step 1: Run every automated test**

Run:

```powershell
node --test tests/*.test.mjs
```

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Run repository verification**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File tools/verify-site.ps1
```

Expected: site, form and security checks pass; no missing local assets or prohibited public secrets are reported.

- [ ] **Step 3: Start or reuse the local preview**

If port 55264 is not already serving `C:\agency\assistall-web`, run:

```powershell
python -m http.server 55264 --bind 127.0.0.1
```

Open `http://127.0.0.1:55264/?motion=on#connections` in the in-app browser.

- [ ] **Step 4: Capture and inspect responsive screenshots**

Use the in-app browser at widths 1920, 1440, 1024, 820, 390 and 360. At each size verify:

- no page-level horizontal overflow, clipping or overlap;
- connector marks render and remain monochrome;
- the mobile connector row scrolls without moving the page sideways;
- all workflow tabs remain reachable;
- contract, shipment and reply panels show the correct content;
- the desktop stage is horizontal and the mobile stage stacks vertically.

- [ ] **Step 5: Verify real interaction and motion**

At desktop and mobile sizes:

1. Capture the product section twice at least eight seconds apart and confirm the active workflow changes.
2. Hover the workspace for at least eight seconds and confirm it does not change.
3. Click each workflow tab and verify its `aria-selected` state and panel.
4. Use ArrowLeft, ArrowRight, Home and End from the keyboard.
5. Open `?motion=off#product` and confirm the current is static and panels do not translate.
6. Disable JavaScript and confirm Contract review remains visible without overlapping hidden panels.

- [ ] **Step 6: Correct only evidence-backed defects and rerun checks**

For each visual or interaction defect, first add or tighten the nearest automated assertion when feasible, then make the smallest HTML/CSS/JS correction. Repeat Steps 1, 2, 4 and 5 until all gates pass.

- [ ] **Step 7: Update Graphify and inspect the final diff**

Run:

```powershell
graphify update .
git diff --check
git status --short
git diff --stat
```

Expected: Graphify completes, `git diff --check` reports no whitespace errors, and the diff contains only the approved feature, its tests, plan/spec and generated graph updates.

- [ ] **Step 8: Commit verified corrections and graph output**

```powershell
git add -- index.html assets/connector-icons.svg assets/page.css assets/site.js tests/site-contract.test.mjs tests/site-interactions.test.mjs tests/site-motion.test.mjs graphify-out
git commit -m "test: verify responsive workflow evidence"
```

If there are no corrections or graph changes, skip this commit rather than creating an empty commit.
