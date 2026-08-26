const MIN_SCROLL_DURATION = 700;
const MAX_SCROLL_DURATION = 1400;
const SCROLL_SPEED = 0.8;
const SECTION_GAP = 16;
export const HERO_SEQUENCE_MS = 11800;
// This coordinate is the centre of the workspace's top edge in the 1200 × 700 stage.
const HERO_TARGET = Object.freeze({ x: 870, y: 276 });
// Arrival lights terminate deep within the workspace so their end point stays fully occluded.
const HERO_ROUTE_TARGET_Y = 340;
const HERO_VIEWBOX_HEIGHT = 700;
const HERO_WORKSPACE_ENDPOINT_DEPTH = .58;

export const WORKFLOW_ROTATION_MS = 8000;
export const WORKFLOW_IDS = Object.freeze(['contract', 'shipment', 'report']);

export const HERO_MOTION_ITEMS = Object.freeze([
  { id: 'zoho', icon: 'zoho', label: 'ZOHO', x: 540, y: 70 },
  { id: 'odoo', icon: 'odoo', label: 'odoo', x: 540, y: 170 },
  { id: 'whatsapp', icon: 'whatsapp', label: 'WhatsApp', x: 670, y: 150 },
  { id: 'email', icon: 'gmail', label: 'Email', x: 670, y: 30, compact: true },
  { id: 'docx', icon: 'word', label: 'DOCX', x: 770, y: 20, compact: true },
  { id: 'xlsx', icon: 'excel', label: 'XLSX', x: 910, y: 20, compact: true },
  { id: 'csv', icon: 'csv', label: 'CSV', x: 1050, y: 20, compact: true },
  { id: 'voice', icon: 'voice', label: 'Voice', x: 1180, y: 60, mobileHidden: true },
  { id: 'folder', icon: 'folder', label: 'Folder', x: 1180, y: 160, mobileHidden: true },
  { id: 'txt', icon: 'txt', label: 'TXT', x: 1180, y: 260 },
  { id: 'pdf', icon: 'pdf', label: 'PDF', x: 1060, y: 270 },
  { id: 'pptx', icon: 'powerpoint', label: 'PPTX', x: 670, y: 270 },
  { id: 'jpg', icon: 'image', label: 'JPG', x: 1080, y: 140, mobileHidden: true },
  { id: 'json', icon: 'json', label: 'JSON', x: 540, y: 270, mobileHidden: true },
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
  const path = {
    microsoft: '<path d="M2 2h9v9H2zm11 0h9v9h-9zM2 13h9v9H2zm11 0h9v9h-9z"/>',
    gmail: '<path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.548l8.073-6.055C21.69 2.28 24 3.434 24 5.457z"/>',
    whatsapp: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>',
    odoo: '<path d="M21.1 15.796a2.9 2.9 0 1 1 0-5.8 2.9 2.9 0 0 1 0 5.8m-6.066 0a2.9 2.9 0 1 1 0-5.8 2.9 2.9 0 0 1 0 5.8m-3.169-2.938a2.9 2.9 0 1 1-1.2-2.374V8.804a.6.6 0 0 1 1.2 0v4.054m-8.966 2.938a2.9 2.9 0 1 1 0-5.8 2.9 2.9 0 0 1 0 5.8" fill="none" stroke="currentColor" stroke-width="1.2"/>',
    zoho: '<path d="M2 5h7l-5 14H-3zM9 5h7l-5 14H4zm7 0h6l-5 14h-6z" transform="translate(2 0)"/><text x="3" y="19" fill="currentColor" font-size="5.3" font-weight="800" font-family="Arial, sans-serif">ZOHO</text>',
    folder: '<path d="M2.5 6.5h7l2 2h10v10.5H2.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    calendar: '<path d="M3 5h18v16H3zM3 10h18M7 2v6m10-6v6M7 14h3m4 0h3m-10 4h3m4 0h3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    voice: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-6 8a6 6 0 0 0 12 0M12 17v4m-4 0h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    image: '<path d="M3 4h18v16H3zM6 16l4-4 3 3 2-2 3 3M8 8h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  }[icon];
  const documentMark = ['word', 'excel', 'csv', 'pdf', 'powerpoint', 'txt', 'json'].includes(icon)
    ? '<path d="M5 2h10l4 4v16H5zM15 2v5h4M8 12h8m-8 4h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
    : path;
  return `<span class="connector-mark" data-connector-mark="${icon}"><svg class="connector-mark__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${documentMark}</svg></span>`;
}

function clampUnit(value) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(progress) {
  return 1 - (1 - clampUnit(progress)) ** 3;
}

function heroGateTarget(item, items, y) {
  const ordered = [...items].sort((first, second) => first.x - second.x || first.y - second.y);
  const rank = Math.max(0, ordered.findIndex(({ id }) => id === item.id));
  const laneProgress = ordered.length > 1 ? rank / (ordered.length - 1) : .5;
  return { x: 836 + laneProgress * 68, y };
}

export function calculateHeroRouteTargetY({ stageHeight, workspaceOffsetY, workspaceHeight } = {}) {
  const stage = Number(stageHeight);
  const workspaceTop = Number(workspaceOffsetY);
  const workspace = Number(workspaceHeight);
  if (!(stage > 0 && workspace > 0 && Number.isFinite(workspaceTop))) return HERO_ROUTE_TARGET_Y;
  const top = workspaceTop / stage * HERO_VIEWBOX_HEIGHT;
  const bottom = (workspaceTop + workspace - 4) / stage * HERO_VIEWBOX_HEIGHT;
  const target = (workspaceTop + workspace * HERO_WORKSPACE_ENDPOINT_DEPTH) / stage * HERO_VIEWBOX_HEIGHT;
  return Math.min(bottom, Math.max(top + 12, target));
}

function heroInputTarget(item, items) {
  return heroGateTarget(item, items, HERO_TARGET.y);
}

function heroRouteTarget(item, items, routeTargetY = HERO_ROUTE_TARGET_Y) {
  return heroGateTarget(item, items, routeTargetY);
}

function heroRouteControl(item, target = HERO_TARGET) {
  return {
    x: (item.x + target.x) / 2,
    y: Math.min(target.y - 26, Math.min(item.y, target.y) - 34),
  };
}

function heroRoutePoint(item, progress, target = HERO_TARGET) {
  const t = clampUnit(progress);
  const inverse = 1 - t;
  const control = heroRouteControl(item, target);
  return {
    x: inverse ** 2 * item.x + 2 * inverse * t * control.x + t ** 2 * target.x,
    y: inverse ** 2 * item.y + 2 * inverse * t * control.y + t ** 2 * target.y,
  };
}

function heroRoutePath(item, items, routeTargetY = HERO_ROUTE_TARGET_Y) {
  const target = heroRouteTarget(item, items, routeTargetY);
  const control = heroRouteControl(item, target);
  return `M ${item.x} ${item.y} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${target.x.toFixed(1)} ${target.y}`;
}

function heroReturnPath(item, items, routeTargetY = HERO_ROUTE_TARGET_Y) {
  const target = heroRouteTarget(item, items, routeTargetY);
  const control = heroRouteControl(item, target);
  return `M ${target.x.toFixed(1)} ${target.y} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${item.x} ${item.y}`;
}

function heroRouteMapMarkup(items, routeTargetY = HERO_ROUTE_TARGET_Y) {
  return `<svg class="hero-route-map" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">${items.map((item) => {
    const compactHidden = item.compact ? '' : ' hero-route--compact-hidden';
    return `<path class="hero-route${compactHidden}" data-hero-route="${item.id}" pathLength="1" d="${heroRoutePath(item, items, routeTargetY)}"></path><path class="hero-route-charge${compactHidden}" data-hero-charge="${item.id}" pathLength="1" d="${heroReturnPath(item, items, routeTargetY)}"></path><circle class="hero-route-light${compactHidden}" data-hero-light="${item.id}" r="3" cx="${item.x}" cy="${item.y}"></circle>`;
  }).join('')}</svg>`;
}

function heroSignalMarkup(item) {
  const mobile = item.mobileHidden ? ' hero-signal-card--mobile-hidden' : '';
  const compact = item.compact ? ' hero-signal-card--compact' : '';
  const style = `--signal-x:${(item.x / 12).toFixed(3)}%;--signal-y:${(item.y / 7).toFixed(3)}%;--signal-opacity:1;--signal-scale:.72`;
  return `<div class="hero-signal-card${mobile}${compact}" data-hero-signal="${item.id}" style="${style}">${connectorMarkMarkup(item.icon)}<span class="hero-signal-card__label">${item.label}</span></div>`;
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

export function getHeroSequenceState(elapsedMs, items = HERO_MOTION_ITEMS, routeTargetY = HERO_ROUTE_TARGET_Y) {
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  const time = elapsed % HERO_SEQUENCE_MS;
  const phase = time < 3600 ? 'intake' : time < 4700 ? 'spin' : time < 8000 ? 'output' : 'settle';
  const returning = time >= 2600 && time < 3600;
  const restaged = time >= 8300;

  const inputs = items.map((item) => {
    const progress = restaged ? 0 : clampUnit((time - 600) / 1800);
    const travel = easeInOutCubic(progress);
    const point = heroRoutePoint(item, travel, heroInputTarget(item, items));
    const fadeOut = 1 - clampUnit((progress - .86) / .14);
    const opacity = restaged ? 1 : fadeOut;
    return {
      id: item.id,
      x: point.x,
      y: point.y,
      opacity,
      // Cards compact as they converge on the single top gate, keeping their
      // separate source positions legible without turning the intake into a stack.
      scale: (.72 - .48 * travel) * opacity,
      routeProgress: restaged ? 0 : clampUnit(travel * 1.08),
      routeOpacity: restaged ? 0 : (returning ? .22 : opacity * .62),
    };
  });

  const lights = items.map((item) => {
    const inputProgress = clampUnit((time - 600) / 1800);
    const inputTravel = easeInOutCubic(inputProgress);
    const lightTravel = Math.min(1, inputTravel + .08);
    const point = heroRoutePoint(item, lightTravel, heroRouteTarget(item, items, routeTargetY));
    const intakeFade = inputTravel > .045 ? 1 - clampUnit((inputProgress - .48) / .18) : 0;
    return {
      id: item.id,
      x: point.x,
      y: point.y,
      direction: intakeFade > 0 ? 'intake' : 'hidden',
      opacity: intakeFade,
      scale: .72 + inputTravel * .28,
    };
  });

  const chargeDuration = 520;
  const chargeStagger = 35;
  const charges = items.map((item, index) => {
    const launchedAt = 2600 + index * chargeStagger;
    const progress = clampUnit((time - launchedAt) / chargeDuration);
    const active = time >= launchedAt && time < launchedAt + chargeDuration;
    return { id: item.id, progress, opacity: active ? Math.sin(Math.PI * progress) : 0 };
  });

  const spinProgress = clampUnit((time - 3600) / 1100);
  const documentProgress = clampUnit((time - 5200) / 1800);
  const documentFade = time < 7800 ? 1 : 1 - clampUnit((time - 7800) / 500);
  return {
    phase,
    inputs,
    lights,
    charges,
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
  const lightElements = new Map([...canvas.querySelectorAll('[data-hero-light]')].map((element) => [element.dataset.heroLight, element]));
  const chargeElements = new Map([...canvas.querySelectorAll('[data-hero-charge]')].map((element) => [element.dataset.heroCharge, element]));
  const workspace = canvas.querySelector('[data-hero-workspace]');
  const output = canvas.querySelector('[data-hero-output]');
  let routeTargetY = HERO_ROUTE_TARGET_Y;
  const updateRouteGeometry = () => {
    const stageBounds = canvas.getBoundingClientRect();
    const workspaceBounds = workspace?.getBoundingClientRect();
    routeTargetY = calculateHeroRouteTargetY({
      stageHeight: stageBounds.height,
      workspaceOffsetY: workspaceBounds ? workspaceBounds.top - stageBounds.top : undefined,
      workspaceHeight: workspaceBounds?.height,
    });
    for (const item of HERO_MOTION_ITEMS) {
      routeElements.get(item.id)?.setAttribute('d', heroRoutePath(item, HERO_MOTION_ITEMS, routeTargetY));
      chargeElements.get(item.id)?.setAttribute('d', heroReturnPath(item, HERO_MOTION_ITEMS, routeTargetY));
    }
  };
  updateRouteGeometry();
  window.addEventListener('resize', updateRouteGeometry, { passive: true });
  const startedAt = performance.now();
  const render = (now) => {
    const state = getHeroSequenceState(now - startedAt, HERO_MOTION_ITEMS, routeTargetY);
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
    for (const lightState of state.lights) {
      const light = lightElements.get(lightState.id);
      if (light) {
        light.setAttribute('cx', lightState.x.toFixed(2));
        light.setAttribute('cy', lightState.y.toFixed(2));
        light.style.setProperty('--light-opacity', lightState.opacity.toFixed(3));
        light.style.setProperty('--light-scale', lightState.scale.toFixed(3));
      }
    }
    for (const chargeState of state.charges) {
      const charge = chargeElements.get(chargeState.id);
      if (charge) {
        charge.style.setProperty('--charge-offset', (-chargeState.progress).toFixed(3));
        charge.style.setProperty('--charge-opacity', chargeState.opacity.toFixed(3));
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
