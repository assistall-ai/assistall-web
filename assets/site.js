const MIN_SCROLL_DURATION = 700;
const MAX_SCROLL_DURATION = 1400;
const SCROLL_SPEED = 0.8;
const SECTION_GAP = 16;
const HERO_MOTION_DURATION = 5;
const HERO_INTAKE_X = 760;
const HERO_INTAKE_DESKTOP_Y = 286;
const HERO_INTAKE_MOBILE_Y = 282;

export const WORKFLOW_ROTATION_MS = 7000;
export const WORKFLOW_IDS = Object.freeze(['contract', 'shipment', 'reply']);

export const HERO_MOTION_ITEMS = Object.freeze([
  { id: 'zoho', label: 'ZOHO', x: 338, y: 92, cx: 500, cy: 74, delay: 0.00 },
  { id: 'odoo', label: 'odoo', x: 548, y: 62, cx: 650, cy: 82, delay: 0.12 },
  { id: 'whatsapp', label: 'WhatsApp', x: 824, y: 76, cx: 792, cy: 94, delay: 0.20 },
  { id: 'email', label: 'Email', x: 1042, y: 118, cx: 914, cy: 132, delay: 0.34 },
  { id: 'docx', label: 'DOCX', x: 238, y: 222, cx: 438, cy: 194, delay: 0.18 },
  { id: 'xlsx', label: 'XLSX', x: 456, y: 214, cx: 576, cy: 192, delay: 0.30 },
  { id: 'csv', label: 'CSV', x: 272, y: 370, cx: 462, cy: 326, delay: 0.44, mobileHidden: true },
  { id: 'voice', label: 'Voice', x: 414, y: 445, cx: 540, cy: 355, delay: 0.54, mobileHidden: true },
  { id: 'folder', label: 'Folder', x: 572, y: 454, cx: 646, cy: 362, delay: 0.62, mobileHidden: true },
  { id: 'txt', label: 'TXT', x: 338, y: 572, cx: 550, cy: 438, delay: 0.58, mobileHidden: true },
  { id: 'pdf', label: 'PDF', x: 1095, y: 248, cx: 940, cy: 214, delay: 0.26 },
  { id: 'pptx', label: 'PPTX', x: 1090, y: 402, cx: 938, cy: 328, delay: 0.42 },
  { id: 'jpg', label: 'JPG', x: 998, y: 540, cx: 900, cy: 415, delay: 0.50, mobileHidden: true },
  { id: 'json', label: 'JSON', x: 1135, y: 570, cx: 946, cy: 438, delay: 0.60, mobileHidden: true },
]);

const CAPABILITIES = Object.freeze([
  { id: 'inbox', label: 'Inbox and controlled replies', summary: 'Messages in. Checked replies ready.', input: 'Email or business message', preparation: 'A clear reply draft', result: 'Nothing sends without you' },
  { id: 'files', label: 'Files, OCR and reports', summary: 'Documents read. Reports prepared.', input: 'PDF, image, spreadsheet or folder', preparation: 'Key details and a prepared report', result: 'The source stays linked to the result' },
  { id: 'contracts', label: 'Contracts and renewals', summary: 'Changes, dates and review points surfaced.', input: 'Contract or renewal document', preparation: 'Terms, changes and important dates', result: 'Renewal dates and changes ready to review' },
  { id: 'shipments', label: 'Shipments and delivery', summary: 'Status changes and records organised.', input: 'Shipment or delivery record', preparation: 'Status changes and missing details', result: 'A clear delivery update for your team' },
  { id: 'clients', label: 'Clients and service requests', summary: 'Requests gathered and next steps prepared.', input: 'Client or vendor request', preparation: 'The request, owner and next step', result: 'A person decides what moves forward' },
  { id: 'booking', label: 'Booking and marketing', summary: 'Calendar and outreach work made clearer.', input: 'Booking, calendar or campaign work', preparation: 'A prepared schedule or outreach draft', result: 'Your team checks timing and message' },
]);

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

export function shouldRotateWorkflow({ visible, reducedMotion, interactionPaused }) {
  return Boolean(visible && !reducedMotion && !interactionPaused);
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

function heroStarsMarkup() {
  let seed = 29;
  return Array.from({ length: 48 }, (_, index) => {
    seed = (seed * 9301 + 49297) % 233280;
    const x = Math.round((seed / 233280) * 1200);
    seed = (seed * 9301 + 49297) % 233280;
    const y = Math.round((seed / 233280) * 700);
    const radius = index % 9 === 0 ? 1.6 : index % 4 === 0 ? 1.05 : 0.7;
    return `<circle class="hero-star" cx="${x}" cy="${y}" r="${radius}" style="--star-delay:${((index % 12) * 0.31).toFixed(2)}s"></circle>`;
  }).join('');
}

function heroSignalMarkup(item) {
  const path = `M ${item.x} ${item.y} Q ${item.cx} ${item.cy} ${HERO_INTAKE_X} ${HERO_INTAKE_DESKTOP_Y}`;
  const hold = 0.08 + item.delay / HERO_MOTION_DURATION;
  const launch = hold + 0.06;
  const arrive = launch + 0.14;
  const keyTimes = [0, hold, launch, arrive, arrive + 0.03, 0.72, 0.77, 1].map((value) => value.toFixed(3)).join(';');
  const splines = Array(7).fill('0.20 0.80 0.20 1').join(';');
  const mobile = item.mobileHidden ? ' hero-signal--mobile-hidden' : '';
  return `<g class="hero-signal-route${mobile}" data-hero-route="${item.id}">
    <path class="hero-route" d="${path}"></path>
    <path class="hero-route hero-route--pulse" d="${path}" pathLength="1" stroke-dasharray="0.16 0.84">
      <animate attributeName="stroke-dashoffset" values="1;1;0;-1;-1;1;1;1" keyTimes="${keyTimes}" dur="${HERO_MOTION_DURATION}s" repeatCount="indefinite"></animate>
    </path>
  </g>
  <g class="hero-signal${mobile}" data-hero-input="${item.id}">
    <animateMotion path="${path}" keyPoints="0;0;0;1;1;1;0;0" keyTimes="${keyTimes}" keySplines="${splines}" calcMode="spline" dur="${HERO_MOTION_DURATION}s" repeatCount="indefinite"></animateMotion>
    <animate attributeName="opacity" values=".76;.9;1;.08;0;0;.76;.76" keyTimes="${keyTimes}" dur="${HERO_MOTION_DURATION}s" repeatCount="indefinite"></animate>
    <g class="hero-signal__shiver"><animateTransform attributeName="transform" type="translate" values="0 0;0 0;-3 1;0 0;0 0;0 0;0 0;0 0" keyTimes="${keyTimes}" dur="${HERO_MOTION_DURATION}s" repeatCount="indefinite"></animateTransform>
      <rect x="-39" y="-19" width="78" height="38" rx="10"></rect><text x="0" y="5" text-anchor="middle">${item.label}</text>
    </g>
  </g>`;
}

export function createHeroMotionMarkup(items = HERO_MOTION_ITEMS) {
  return `<svg class="hero-motion__svg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="surface-face" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#24585A"></stop><stop offset="1" stop-color="#071D1E"></stop></linearGradient>
      <linearGradient id="document-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFDF8"></stop><stop offset="1" stop-color="#EBDDBF"></stop></linearGradient>
      <filter id="hero-document-glow" x="-90%" y="-70%" width="280%" height="280%"><feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#C8A25D" flood-opacity=".72"></feDropShadow></filter>
      <filter id="surface-shadow" x="-60%" y="-60%" width="220%" height="240%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity=".55"></feDropShadow></filter>
    </defs>
    <rect class="hero-motion__space" width="1200" height="700"></rect>
    <g class="hero-stars">${heroStarsMarkup()}</g>
    <g class="hero-routes">${items.map(heroSignalMarkup).join('')}</g>
    <g class="hero-workspace-surface" filter="url(#surface-shadow)">
      <animateTransform attributeName="transform" type="rotate" values="0 760 334;0 760 334;360 760 334;360 760 334" keyTimes="0;.36;.48;1" dur="${HERO_MOTION_DURATION}s" repeatCount="indefinite"></animateTransform>
      <rect x="664" y="250" width="192" height="168" rx="34" fill="url(#surface-face)"></rect>
      <rect x="679" y="266" width="162" height="136" rx="26" class="hero-workspace-surface__inner"></rect>
      <image href="assets/android-chrome-512x512.png" x="706" y="280" width="108" height="108"></image>
      <path class="hero-workspace-surface__edge" d="M712 418h96"></path>
    </g>
    <g class="hero-output" filter="url(#hero-document-glow)" transform="translate(700 430)">
      <animateTransform attributeName="transform" type="translate" additive="sum" values="0 -12;0 -12;0 8;0 118;0 194;0 -12" keyTimes="0;.43;.48;.62;.74;1" dur="${HERO_MOTION_DURATION}s" repeatCount="indefinite"></animateTransform>
      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.43;.48;.68;.76;1" dur="${HERO_MOTION_DURATION}s" repeatCount="indefinite"></animate>
      <rect class="hero-output__paper" width="120" height="150" rx="10" fill="url(#document-face)"></rect>
      <rect class="hero-output__image" x="15" y="18" width="42" height="34" rx="5"></rect>
      <path class="hero-output__mountain" d="M18 48l12-12 8 8 8-9 9 13z"></path>
      <path class="hero-output__lines" d="M68 22h35M68 35h26M15 68h88M15 82h72"></path>
      <circle class="hero-output__check" cx="28" cy="116" r="12"></circle><path class="hero-output__tick" d="M22 116l4 4 8-9"></path>
    </g>
  </svg>`;
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
  const svg = canvas.querySelector('svg');
  if (!svg) return;
  figure.classList.add('hero-motion--enhanced');
  const mobileView = window.matchMedia('(max-width: 680px)');
  const syncViewBox = () => {
    const intakeY = mobileView.matches ? HERO_INTAKE_MOBILE_Y : HERO_INTAKE_DESKTOP_Y;
    svg.setAttribute('viewBox', mobileView.matches ? '390 0 760 700' : '0 0 1200 700');
    HERO_MOTION_ITEMS.forEach((item) => {
      const path = `M ${item.x} ${item.y} Q ${item.cx} ${item.cy} ${HERO_INTAKE_X} ${intakeY}`;
      svg.querySelectorAll(`[data-hero-route="${item.id}"] path`).forEach((route) => route.setAttribute('d', path));
      svg.querySelector(`[data-hero-input="${item.id}"] animateMotion`)?.setAttribute('path', path);
    });
  };
  syncViewBox();
  mobileView.addEventListener?.('change', syncViewBox);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => entry.isIntersecting ? svg.unpauseAnimations?.() : svg.pauseAnimations?.(), { threshold: .1 }).observe(figure);
  }
}

function renderCapability(root, requestedId) {
  const state = createCapabilityState(requestedId);
  root.querySelectorAll('[data-capability-id]').forEach((button) => {
    const active = button.dataset.capabilityId === state.activeId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
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

function enableRevealMotion() {
  const nodes = [...document.querySelectorAll('[data-reveal]')];
  if (!nodes.length || prefersReducedMotion() || !('IntersectionObserver' in window)) { nodes.forEach((node) => node.classList.add('is-visible')); return; }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), { threshold: .14 });
  nodes.forEach((node) => observer.observe(node));
}

function enableDemoForm() {
  const form = document.querySelector('[data-demo-form]');
  if (!form) return;
  const started = form.elements.namedItem('started_at');
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
      window.turnstile?.reset?.();
      if (status) status.textContent = 'Your request is saved. We will reply soon.';
    } catch {
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
    window.turnstile.render(slot, {
      sitekey,
      action: 'demo',
      theme: 'light',
      appearance: 'interaction-only',
      callback: (token) => { field.value = token; },
      'expired-callback': () => { field.value = ''; },
      'error-callback': () => { field.value = ''; },
    });
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
  enableConnectorIconFallback();
  enableWorkflowEvidence();
  enableRevealMotion();
  enableTurnstile();
  enableDemoForm();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialiseSite, { once: true });
  else initialiseSite();
}
