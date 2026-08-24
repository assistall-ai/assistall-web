const MIN_SCROLL_DURATION = 700;
const MAX_SCROLL_DURATION = 1400;
const SCROLL_SPEED = 0.8;
const SECTION_GAP = 16;
export const HERO_SEQUENCE_MS = 9600;
const HERO_BATCH_SIZE = 5;
const HERO_TARGET = Object.freeze({ x: 870, y: 334 });

export const WORKFLOW_ROTATION_MS = 8000;
export const WORKFLOW_IDS = Object.freeze(['contract', 'shipment', 'report']);

export const HERO_MOTION_ITEMS = Object.freeze([
  { id: 'zoho', icon: 'zoho', label: 'ZOHO', x: 338, y: 92, cx: 500, cy: 74, delay: 0.00 },
  { id: 'odoo', icon: 'odoo', label: 'odoo', x: 548, y: 62, cx: 650, cy: 82, delay: 0.12 },
  { id: 'whatsapp', icon: 'whatsapp', label: 'WhatsApp', x: 824, y: 76, cx: 792, cy: 94, delay: 0.20 },
  { id: 'email', icon: 'gmail', label: 'Email', x: 1042, y: 118, cx: 914, cy: 132, delay: 0.34 },
  { id: 'docx', icon: 'word', label: 'DOCX', x: 238, y: 222, cx: 438, cy: 194, delay: 0.18 },
  { id: 'xlsx', icon: 'excel', label: 'XLSX', x: 456, y: 214, cx: 576, cy: 192, delay: 0.30 },
  { id: 'csv', icon: 'csv', label: 'CSV', x: 272, y: 370, cx: 462, cy: 326, delay: 0.44, mobileHidden: true },
  { id: 'voice', icon: 'voice', label: 'Voice', x: 414, y: 445, cx: 540, cy: 355, delay: 0.54, mobileHidden: true },
  { id: 'folder', icon: 'folder', label: 'Folder', x: 572, y: 454, cx: 646, cy: 362, delay: 0.62, mobileHidden: true },
  { id: 'txt', icon: 'txt', label: 'TXT', x: 338, y: 572, cx: 550, cy: 438, delay: 0.58, mobileHidden: true },
  { id: 'pdf', icon: 'pdf', label: 'PDF', x: 1095, y: 248, cx: 940, cy: 214, delay: 0.26 },
  { id: 'pptx', icon: 'powerpoint', label: 'PPTX', x: 1090, y: 402, cx: 938, cy: 328, delay: 0.42 },
  { id: 'jpg', icon: 'image', label: 'JPG', x: 998, y: 540, cx: 900, cy: 415, delay: 0.50, mobileHidden: true },
  { id: 'json', icon: 'json', label: 'JSON', x: 1135, y: 570, cx: 946, cy: 438, delay: 0.60, mobileHidden: true },
]);

const HERO_SIGNAL_BATCHES = Object.freeze([
  Object.freeze(['zoho', 'whatsapp', 'voice', 'pptx', 'json']),
  Object.freeze(['odoo', 'email', 'csv', 'folder', 'jpg']),
  Object.freeze(['docx', 'xlsx', 'txt', 'pdf']),
]);

const CAPABILITIES = Object.freeze([
  { id: 'inbox', label: 'Inbox and controlled replies', summary: 'Messages in. Checked replies ready.', input: 'Email or business message', preparation: 'A clear reply draft', result: 'Nothing sends without you' },
  { id: 'files', label: 'Files, OCR and reports', summary: 'Documents read. Reports prepared.', input: 'PDF, image, spreadsheet or folder', preparation: 'Key details and a prepared report', result: 'The source stays linked to the result' },
  { id: 'contracts', label: 'Contracts and renewals', summary: 'Changes, dates and review points surfaced.', input: 'Contract or renewal document', preparation: 'Terms, changes and important dates', result: 'Renewal dates and changes ready to review' },
  { id: 'shipments', label: 'Shipments and delivery', summary: 'Status changes and records organised.', input: 'Shipment or delivery record', preparation: 'Status changes and missing details', result: 'A clear delivery update for your team' },
  { id: 'clients', label: 'Clients and service requests', summary: 'Requests gathered and next steps prepared.', input: 'Client or vendor request', preparation: 'The request, owner and next step', result: 'A person decides what moves forward' },
  { id: 'booking', label: 'Booking and marketing', summary: 'Calendar and outreach work made clearer.', input: 'Booking, calendar or campaign work', preparation: 'A prepared schedule or outreach draft', result: 'Your team checks timing and message' },
]);
const turnstileState = { widgetId: null };

function motionPreviewOverride() {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('motion');
}

function prefersReducedMotion() {
  const override = motionPreviewOverride();
  if (override === 'on') return false;
  if (override === 'off') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function applyMotionPreviewOverride() {
  const override = motionPreviewOverride();
  if (override === 'on' || override === 'off') document.documentElement.setAttribute('data-motion-preview', override);
  else document.documentElement.removeAttribute('data-motion-preview');
}

export function calculateScrollDuration(distance) {
  const measuredDistance = Math.abs(distance);
  return Math.min(MAX_SCROLL_DURATION, Math.max(MIN_SCROLL_DURATION, Math.round(measuredDistance * SCROLL_SPEED)));
}

export function easeInOutCubic(progress) {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  return progress < 0.5 ? 4 * progress ** 3 : 1 - ((-2 * progress + 2) ** 3) / 2;
}

export function getTargetScrollTop(targetTop, headerHeight) {
  return Math.max(0, Math.round(targetTop - headerHeight - SECTION_GAP));
}

export function createCapabilityState(requestedId) {
  const activeId = CAPABILITIES.some(({ id }) => id === requestedId) ? requestedId : 'inbox';
  return { activeId, items: CAPABILITIES.map((item) => ({ ...item, active: item.id === activeId })) };
}

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

export function getConnectorScrollTarget(scrollLeft, key, clientWidth, scrollWidth) {
  const maximum = Math.max(0, scrollWidth - clientWidth);
  if (key === 'Home') return 0;
  if (key === 'End') return maximum;
  if (key === 'ArrowRight') return Math.min(maximum, scrollLeft + clientWidth);
  if (key === 'ArrowLeft') return Math.max(0, scrollLeft - clientWidth);
  return scrollLeft;
}

export function shouldRotateWorkflow({ visible, reducedMotion, interactionPaused }) {
  return Boolean(visible && !reducedMotion && !interactionPaused);
}

export function shouldPlayWorkflowVideo({ visible, active, reducedMotion }) {
  return Boolean(visible && active && !reducedMotion);
}

export function buildDemoPayload(values = {}) {
  const clean = (value) => String(value ?? '').trim();
  return {
    name: clean(values.name),
    email: clean(values.email),
    company: clean(values.company),
    work_need: clean(values.work_need),
    website: clean(values.website),
    started_at: clean(values.started_at),
    'cf-turnstile-response': clean(values['cf-turnstile-response']),
  };
}

export function normaliseTurnstileSiteKey(value) {
  const key = String(value ?? '').trim();
  if (!key || /^REPLACE_/i.test(key)) return '';
  return key;
}

export function resetTurnstileWidget(field, turnstile, widgetId) {
  if (field) field.value = '';
  if (widgetId == null) return;
  try { turnstile?.reset?.(widgetId); } catch { /* Keep the form retryable if the widget API fails. */ }
}

function heroStarsMarkup() {
  let seed = 29;
  return Array.from({ length: 48 }, (_, index) => {
    seed = (seed * 9301 + 49297) % 233280;
    const x = Math.round((seed / 233280) * 1200);
    seed = (seed * 9301 + 49297) % 233280;
    const y = Math.round((seed / 233280) * 700);
    const radius = index % 9 === 0 ? 1.6 : index % 4 === 0 ? 1.05 : 0.7;
    return `<span class="hero-star" style="--star-x:${(x / 12).toFixed(3)}%;--star-y:${(y / 7).toFixed(3)}%;--star-size:${radius * 2}px;--star-delay:${((index % 12) * 0.31).toFixed(2)}s"></span>`;
  }).join('');
}

function connectorMarkMarkup(icon) {
  const text = {
    odoo: 'odoo', zoho: 'ZOHO', word: 'W', excel: 'X', csv: 'CSV', pdf: 'PDF',
    powerpoint: 'PPT', txt: 'TXT', json: '{}',
  }[icon];
  return `<span class="connector-mark" data-connector-mark="${icon}">${text ? `<span class="connector-mark__text">${text}</span>` : '<span class="connector-mark__shape"></span>'}</span>`;
}

function clampUnit(value) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(progress) {
  return 1 - (1 - clampUnit(progress)) ** 3;
}

function heroRoutePath(item) {
  const midpointX = (item.x + HERO_TARGET.x) / 2;
  const bend = item.y < HERO_TARGET.y ? -38 : 38;
  const midpointY = (item.y + HERO_TARGET.y) / 2 + bend;
  return `M ${item.x} ${item.y} Q ${midpointX.toFixed(1)} ${midpointY.toFixed(1)} ${HERO_TARGET.x} ${HERO_TARGET.y}`;
}

function heroRouteMapMarkup(items) {
  return `<svg class="hero-route-map" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">${items.map((item) => `<path data-hero-route="${item.id}" pathLength="1" d="${heroRoutePath(item)}"></path>`).join('')}</svg>`;
}

function heroSignalMarkup(item) {
  const mobile = item.mobileHidden ? ' hero-signal-card--mobile-hidden' : '';
  const style = `--signal-x:${(item.x / 12).toFixed(3)}%;--signal-y:${(item.y / 7).toFixed(3)}%;--signal-opacity:0;--signal-scale:.82`;
  const usesTextMark = ['odoo', 'zoho', 'word', 'excel', 'csv', 'pdf', 'powerpoint', 'txt', 'json'].includes(item.icon);
  return `<div class="hero-signal-card${mobile}" data-hero-signal="${item.id}" style="${style}">${connectorMarkMarkup(item.icon)}${usesTextMark ? '' : `<span class="hero-signal-card__label">${item.label}</span>`}</div>`;
}

export function createHeroMotionMarkup(items = HERO_MOTION_ITEMS) {
  return `<div class="hero-motion__field" aria-hidden="true">
    <div class="hero-stars">${heroStarsMarkup()}</div>
    ${heroRouteMapMarkup(items)}
    <div class="hero-signal-field">${items.map(heroSignalMarkup).join('')}</div>
    <div class="hero-output" data-hero-output>
      <div class="hero-output__paper"><span class="hero-output__preview"></span><span class="hero-output__line hero-output__line--one"></span><span class="hero-output__line hero-output__line--two"></span><span class="hero-output__approved">Ready</span></div>
    </div>
    <div class="hero-workspace" data-hero-workspace>
      <div class="hero-workspace__face hero-workspace__face--front"><div class="hero-workspace__inner"><img src="assets/android-chrome-512x512.png" alt=""></div><span class="hero-workspace__edge"></span></div>
      <div class="hero-workspace__face hero-workspace__face--back"><div class="hero-workspace__inner"><img src="assets/android-chrome-512x512.png" alt=""></div><span class="hero-workspace__edge"></span></div>
    </div>
  </div>`;
}

export function getHeroSequenceState(elapsedMs, items = HERO_MOTION_ITEMS) {
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  const cycle = Math.floor(elapsed / HERO_SEQUENCE_MS);
  const time = elapsed % HERO_SEQUENCE_MS;
  const usesOfficialItems = items === HERO_MOTION_ITEMS;
  const fallbackBatches = Array.from({ length: Math.ceil(items.length / HERO_BATCH_SIZE) }, (_, index) => items.slice(index * HERO_BATCH_SIZE, (index + 1) * HERO_BATCH_SIZE).map(({ id }) => id));
  const batches = usesOfficialItems ? HERO_SIGNAL_BATCHES : fallbackBatches;
  const activeIds = new Set(batches[cycle % batches.length]);
  const phase = time < 3300 ? 'intake' : time < 4800 ? 'spin' : time < 7400 ? 'output' : 'settle';

  const inputs = items.map((item) => {
    if (!activeIds.has(item.id) || time >= 3300) return { id: item.id, x: item.x, y: item.y, opacity: 0, scale: .82, routeProgress: 0, routeOpacity: 0 };
    const slot = [...activeIds].indexOf(item.id);
    const progress = clampUnit((time - 700 - slot * 140) / 2100);
    const travel = easeInOutCubic(progress);
    const fadeIn = clampUnit((time - slot * 120) / 180);
    const fadeOut = 1 - clampUnit((progress - .9) / .1);
    const opacity = fadeIn * fadeOut;
    return {
      id: item.id,
      x: item.x + (HERO_TARGET.x - item.x) * travel,
      y: item.y + (HERO_TARGET.y - item.y) * travel,
      opacity,
      scale: .82 + .18 * opacity,
      routeProgress: clampUnit(travel * 1.08),
      routeOpacity: opacity,
    };
  });

  const spinProgress = clampUnit((time - 3600) / 1200);
  const documentProgress = clampUnit((time - 5200) / 1800);
  const documentFade = time < 7000 ? 1 : 1 - clampUnit((time - 7000) / 400);
  return {
    phase,
    inputs,
    workspace: { rotationY: time < 3600 ? 0 : 360 * easeInOutCubic(spinProgress) },
    document: {
      opacity: documentProgress * documentFade,
      translateY: -55 + 104 * easeOutCubic(documentProgress),
    },
  };
}

function updateHash(hash) {
  if (hash && window.location.hash !== hash) window.history.pushState(null, '', hash);
}

function glideTo(target, hash) {
  const header = document.querySelector('.site-header');
  const targetTop = target.getBoundingClientRect().top + window.scrollY;
  const destination = getTargetScrollTop(targetTop, header?.offsetHeight ?? 0);
  if (prefersReducedMotion()) { window.scrollTo(0, destination); updateHash(hash); return; }
  const start = window.scrollY;
  const distance = destination - start;
  const duration = calculateScrollDuration(distance);
  const startedAt = performance.now();
  function animate(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    window.scrollTo(0, start + distance * easeInOutCubic(progress));
    if (progress < 1) window.requestAnimationFrame(animate);
    else updateHash(hash);
  }
  window.requestAnimationFrame(animate);
}

function enableSectionGlide() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-scroll-link][href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute('href');
    const target = hash ? document.querySelector(hash) : null;
    if (!target) return;
    event.preventDefault();
    glideTo(target, hash);
  });
}

function enableHeroMotion() {
  const figure = document.querySelector('[data-hero-motion]');
  const canvas = figure?.querySelector('[data-hero-motion-canvas]');
  if (!figure || !canvas || prefersReducedMotion()) return;
  canvas.innerHTML = createHeroMotionMarkup();
  figure.classList.add('hero-motion--enhanced');
  const signalElements = new Map([...canvas.querySelectorAll('[data-hero-signal]')].map((element) => [element.dataset.heroSignal, element]));
  const routeElements = new Map([...canvas.querySelectorAll('[data-hero-route]')].map((element) => [element.dataset.heroRoute, element]));
  const workspace = canvas.querySelector('[data-hero-workspace]');
  const output = canvas.querySelector('[data-hero-output]');
  const startedAt = performance.now();
  const render = (now) => {
    const state = getHeroSequenceState(now - startedAt);
    for (const input of state.inputs) {
      const signal = signalElements.get(input.id);
      const route = routeElements.get(input.id);
      if (signal) {
        signal.style.setProperty('--signal-x', `${(input.x / 12).toFixed(3)}%`);
        signal.style.setProperty('--signal-y', `${(input.y / 7).toFixed(3)}%`);
        signal.style.setProperty('--signal-opacity', input.opacity.toFixed(3));
        signal.style.setProperty('--signal-scale', input.scale.toFixed(3));
      }
      if (route) {
        route.style.setProperty('--route-progress', input.routeProgress.toFixed(3));
        route.style.setProperty('--route-opacity', input.routeOpacity.toFixed(3));
      }
    }
    workspace?.style.setProperty('--workspace-turn', `${state.workspace.rotationY.toFixed(2)}deg`);
    output?.style.setProperty('--document-opacity', state.document.opacity.toFixed(3));
    output?.style.setProperty('--document-y', `${state.document.translateY.toFixed(2)}%`);
    window.requestAnimationFrame(render);
  };
  window.requestAnimationFrame(render);
}

function renderCapability(root, requestedId) {
  const state = createCapabilityState(requestedId);
  root.querySelectorAll('[data-capability-id]').forEach((button) => {
    const active = button.dataset.capabilityId === state.activeId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  root.querySelector('#capability-panel')?.setAttribute('aria-labelledby', `capability-tab-${state.activeId}`);
  const selected = state.items.find(({ active }) => active);
  for (const [key, value] of Object.entries({ title: selected.label, input: selected.input, preparation: selected.preparation, result: selected.result })) {
    const target = root.querySelector(`[data-capability-${key}]`);
    if (target) target.textContent = value;
  }
}

function enableCapabilitySwitcher() {
  const root = document.querySelector('[data-capability-switcher]');
  if (!root) return;
  renderCapability(root, 'inbox');
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-capability-id]');
    if (button) renderCapability(root, button.dataset.capabilityId);
  });
  root.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) return;
    const buttons = [...root.querySelectorAll('[data-capability-id]')];
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    const direction = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1;
    const next = buttons[(current + direction + buttons.length) % buttons.length];
    next.focus(); renderCapability(root, next.dataset.capabilityId);
  });
}

function enableWorkflowEvidence() {
  const root = document.querySelector('[data-workflow-evidence]');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[data-workflow-tab]')];
  const panels = [...root.querySelectorAll('[data-workflow-panel]')];
  if (!tabs.length || !panels.length) return;

  let activeId = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.dataset.workflowTab ?? WORKFLOW_IDS[0];
  let visible = false;
  let pointerPaused = false;
  let focusPaused = false;
  let timerId;

  const syncVideos = () => {
    panels.forEach((panel) => {
      const video = panel.querySelector('[data-workflow-video]');
      if (!video) return;
      const active = panel.dataset.workflowPanel === activeId;
      if (shouldPlayWorkflowVideo({ visible, active, reducedMotion: prefersReducedMotion() })) {
        video.play().catch(() => {});
      } else {
        video.pause();
        if (!active) {
          try { video.currentTime = 0; } catch { /* Metadata may not be ready yet. */ }
        }
      }
    });
  };

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
    syncVideos();
    if (resetTimer) schedule();
  };

  schedule = () => {
    clearTimer();
    if (!shouldRotateWorkflow({ visible, reducedMotion: prefersReducedMotion(), interactionPaused: pointerPaused || focusPaused })) return;
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

  root.addEventListener('click', (event) => {
    const replay = event.target.closest('[data-workflow-replay]');
    if (!replay) return;
    const video = replay.closest('[data-workflow-panel]')?.querySelector('[data-workflow-video]');
    if (!video) return;
    try { video.currentTime = 0; } catch { /* Metadata may not be ready yet. */ }
    video.play().catch(() => {});
  });

  root.addEventListener('mouseenter', () => { pointerPaused = true; schedule(); });
  root.addEventListener('mouseleave', () => { pointerPaused = false; schedule(); });
  root.addEventListener('focusin', () => { focusPaused = true; schedule(); });
  root.addEventListener('focusout', (event) => {
    if (event.relatedTarget && root.contains(event.relatedTarget)) return;
    focusPaused = false;
    schedule();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncVideos();
      schedule();
    }, { threshold: 0.35 }).observe(root);
  } else {
    visible = true;
  }

  root.classList.add('is-enhanced');
  activate(activeId, { resetTimer: false });
}

function enableConnectorKeyboardScroll() {
  const row = document.querySelector('.connector-grid');
  if (!row) return;
  row.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    if (row.scrollWidth <= row.clientWidth) return;
    event.preventDefault();
    row.scrollTo({
      left: getConnectorScrollTarget(row.scrollLeft, event.key, row.clientWidth, row.scrollWidth),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  });
}

function enableRevealMotion() {
  const nodes = [...document.querySelectorAll('[data-reveal]')];
  if (!nodes.length) return;
  const revealRoot = document.documentElement;
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    revealRoot.classList.remove('reveal-enhanced');
    nodes.forEach((node) => node.classList.add('is-visible'));
    return;
  }
  try {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .14 });
    revealRoot.classList.add('reveal-enhanced');
    nodes.forEach((node) => observer.observe(node));
  } catch {
    revealRoot.classList.remove('reveal-enhanced');
    nodes.forEach((node) => node.classList.add('is-visible'));
  }
}

function enableDemoForm() {
  const form = document.querySelector('[data-demo-form]');
  if (!form) return;
  const started = form.elements.namedItem('started_at');
  const turnstileField = form.elements.namedItem('cf-turnstile-response');
  if (started) started.value = String(Date.now());
  form.addEventListener('submit', async (event) => {
    if (!window.fetch || !form.reportValidity()) return;
    event.preventDefault();
    const status = form.querySelector('[data-form-status]');
    const submit = form.querySelector('[type="submit"]');
    const payload = buildDemoPayload(Object.fromEntries(new FormData(form).entries()));
    submit.disabled = true;
    if (status) status.textContent = 'Sending your request…';
    try {
      const response = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error('request_failed');
      form.reset(); if (started) started.value = String(Date.now());
      resetTurnstileWidget(turnstileField, window.turnstile, turnstileState.widgetId);
      if (status) status.textContent = 'Your request is saved. We will reply soon.';
    } catch {
      resetTurnstileWidget(turnstileField, window.turnstile, turnstileState.widgetId);
      if (status) status.textContent = 'Your request could not be sent. Please try again or email hello@assistall.ai.';
    } finally { submit.disabled = false; }
  });
}

function enableTurnstile() {
  const slot = document.querySelector('[data-turnstile-widget]');
  const field = document.querySelector('input[name="cf-turnstile-response"]');
  const meta = document.querySelector('meta[name="assistall-turnstile-sitekey"]');
  const sitekey = normaliseTurnstileSiteKey(meta?.content);
  if (!slot || !field) return;
  if (!sitekey) {
    slot.classList.add('is-unconfigured');
    slot.textContent = location.hostname === '127.0.0.1' || location.hostname === 'localhost'
      ? 'Secure bot check will appear here on the live website.'
      : 'Bot protection is temporarily unavailable.';
    return;
  }

  const render = () => {
    if (!window.turnstile || slot.dataset.rendered === 'true') return;
    const widgetId = window.turnstile.render(slot, {
      sitekey,
      action: 'demo',
      theme: 'light',
      appearance: 'interaction-only',
      callback: (token) => { field.value = token; },
      'expired-callback': () => { field.value = ''; },
      'error-callback': () => { field.value = ''; },
    });
    turnstileState.widgetId = widgetId;
    slot.dataset.rendered = 'true';
  };

  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.defer = true;
  script.addEventListener('load', render, { once: true });
  script.addEventListener('error', () => {
    slot.textContent = 'Bot protection could not load. Please refresh the page.';
  }, { once: true });
  document.head.append(script);
}

function initialiseSite() {
  applyMotionPreviewOverride();
  enableSectionGlide();
  enableHeroMotion();
  enableCapabilitySwitcher();
  enableConnectorKeyboardScroll();
  enableWorkflowEvidence();
  enableRevealMotion();
  enableTurnstile();
  enableDemoForm();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialiseSite, { once: true });
  else initialiseSite();
}
