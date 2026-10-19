const MIN_SCROLL_DURATION = 700;
const MAX_SCROLL_DURATION = 1400;
const SCROLL_SPEED = 0.8;
const SECTION_GAP = 16;

export const WORKFLOW_ROTATION_MS = 11000;
export const WORKFLOW_PLAYBACK_RATE = 0.65;
export const WORKFLOW_IDS = Object.freeze(['contract', 'shipment', 'report']);

// Hero: the Assistall mark as a quiet signal hub. Faint lines reach it from every side and
// corner, and points of light travel in along them at an unhurried, irregular pace, a few
// sides at a time. Everything is planned in real pixels from the measured hero, copy and hub,
// so nothing is stretched, and lines never start behind the copy or under the header.
export const HERO_SIGNAL_LOOP_MS = 60000;
export const HERO_SIGNAL_SIDES = Object.freeze(['top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left']);
// Lines per side: three on each edge, two on each corner.
const HERO_SIGNAL_SPREAD = Object.freeze({ top: [-.62, 0, .62], right: [-.62, 0, .62], bottom: [-.62, 0, .62], left: [-.62, 0, .62], 'top-right': [-1, 1], 'bottom-right': [-1, 1], 'bottom-left': [-1, 1], 'top-left': [-1, 1] });
const HERO_SIGNAL_DIRECTIONS = Object.freeze({ right: [1, 0], bottom: [0, 1], left: [-1, 0], top: [0, -1], 'top-right': [Math.SQRT1_2, -Math.SQRT1_2], 'bottom-right': [Math.SQRT1_2, Math.SQRT1_2], 'bottom-left': [-Math.SQRT1_2, Math.SQRT1_2], 'top-left': [-Math.SQRT1_2, -Math.SQRT1_2] });
// Light travels at about 95px a second, never quicker than 1.7s or slower than 3.8s a line.
export const HERO_SIGNAL_SPEED = .095;
export const HERO_SIGNAL_MIN_MS = 1700;
export const HERO_SIGNAL_MAX_MS = 3800;

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function clampUnit(value) {
  return Math.min(1, Math.max(0, value));
}

// Where a line meets the hub: a point on the matching edge or rounded corner, and the
// outward direction there, so every line arrives square to the hub's outline.
export function heroHubAnchor(hub, side, offset = 0) {
  const half = hub.size / 2;
  const radius = hub.size * .24;
  const along = offset * (half - radius) * .9;
  const [dx, dy] = HERO_SIGNAL_DIRECTIONS[side];
  if (side === 'top' || side === 'bottom') return { x: hub.x + along, y: hub.y + dy * half, normal: [0, dy] };
  if (side === 'left' || side === 'right') return { x: hub.x + dx * half, y: hub.y + along, normal: [dx, 0] };
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  const cx = hub.x + sx * (half - radius);
  const cy = hub.y + sy * (half - radius);
  return { x: cx + radius * dx, y: cy + radius * dy, normal: [dx, dy] };
}

function insideRect(x, y, rect) {
  return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
}

function bezierPoint([p0, c1, c2, p3], t) {
  const m = 1 - t;
  return [0, 1].map((k) => m * m * m * p0[k] + 3 * m * m * t * c1[k] + 3 * m * t * t * c2[k] + t * t * t * p3[k]);
}

export function heroCurveLength(curve, steps = 32) {
  let length = 0;
  let previous = curve[0];
  for (let i = 1; i <= steps; i += 1) {
    const point = bezierPoint(curve, i / steps);
    length += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
    previous = point;
  }
  return length;
}

// Plans the lines for one layout. `avoid` holds rectangles (the copy) that no part of a line
// may enter; `top` keeps lines below the header. Returns lines with their curve and length.
export function planHeroSignals({ width, height, hub, avoid = [], top = 0, margin = 10, seed = 20261019 }) {
  const random = seededRandom(seed);
  const allowed = (x, y) => x >= margin && x <= width - margin && y >= top + margin && y <= height - margin
    && !avoid.some((rect) => insideRect(x, y, rect));
  const lines = [];
  for (const side of HERO_SIGNAL_SIDES) {
    HERO_SIGNAL_SPREAD[side].forEach((offset, index) => {
      const corner = side.includes('-');
      const anchor = heroHubAnchor(hub, side, corner ? 0 : offset + (random() - .5) * .16);
      const baseAngle = Math.atan2(anchor.normal[1], anchor.normal[0]);
      const angle = baseAngle + (corner ? offset * .2 : offset * .38) + (random() - .5) * .12;
      const dir = [Math.cos(angle), Math.sin(angle)];
      let reach = 0;
      for (let step = 6; step < 2400; step += 4) {
        if (!allowed(anchor.x + dir[0] * step, anchor.y + dir[1] * step)) break;
        reach = step;
      }
      if (reach < 44) return;
      const length = Math.max(44, reach * (.62 + random() * .36));
      const start = [anchor.x + dir[0] * length, anchor.y + dir[1] * length];
      const end = [anchor.x, anchor.y];
      const bend = (index % 2 ? 1 : -1) * (.12 + random() * .1) * length;
      const perp = [-dir[1], dir[0]];
      const curve = [
        start,
        [start[0] - dir[0] * length * .32 + perp[0] * bend, start[1] - dir[1] * length * .32 + perp[1] * bend],
        [end[0] + anchor.normal[0] * length * .34, end[1] + anchor.normal[1] * length * .34],
        end,
      ];
      // Keep the whole curve inside the allowed area; drop a line that would bow into the copy.
      const samples = Array.from({ length: 17 }, (_, i) => bezierPoint(curve, i / 16));
      if (samples.slice(0, 15).some(([x, y]) => !allowed(x, y))) return;
      lines.push({
        id: `${side}-${index}`,
        side,
        curve,
        length: heroCurveLength(curve),
        d: heroCurvePath(curve),
      });
    });
  }
  return lines;
}

export function heroCurvePath([p0, c1, c2, p3]) {
  const f = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  return `M${f(p0)} C${f(c1)} ${f(c2)} ${f(p3)}`;
}

export function heroSignalDuration(length) {
  return Math.round(Math.min(HERO_SIGNAL_MAX_MS, Math.max(HERO_SIGNAL_MIN_MS, length / HERO_SIGNAL_SPEED)));
}

// A fixed, seeded timetable of lights, so the hub looks spontaneous but any moment can be
// held for review with ?frame=. Bursts of one to three lights leave from different sides,
// about a second apart, and a line never carries two lights at once.
export function heroSignalSchedule(lines, { seed = 7, loopMs = HERO_SIGNAL_LOOP_MS } = {}) {
  const random = seededRandom(seed);
  const pulses = [];
  if (!lines.length) return pulses;
  let time = 300;
  while (time < loopMs - HERO_SIGNAL_MAX_MS - 400) {
    const roll = random();
    const count = roll < .12 ? 3 : roll < .45 ? 2 : 1;
    const sides = new Set();
    let last = time;
    for (let k = 0; k < count; k += 1) {
      const start = Math.round(time + k * (80 + random() * 260));
      last = start;
      let pick = -1;
      for (let tries = 0; tries < 16 && pick < 0; tries += 1) {
        const index = Math.floor(random() * lines.length);
        if (sides.has(lines[index].side)) continue;
        if (pulses.some((pulse) => pulse.line === index && start < pulse.start + pulse.duration + 400)) continue;
        pick = index;
      }
      if (pick < 0) continue;
      sides.add(lines[pick].side);
      pulses.push({ line: pick, start, duration: heroSignalDuration(lines[pick].length) });
    }
    // The next burst waits 0.7 to 1.7 seconds after this one's last light.
    time = last + 700 + random() * 1000;
  }
  return pulses;
}

function easeInOutSine(progress) {
  return -(Math.cos(Math.PI * clampUnit(progress)) - 1) / 2;
}

// Lights on their way at this moment, and how brightly the hub glows from recent arrivals.
export function heroSignalState(elapsedMs, pulses, loopMs = HERO_SIGNAL_LOOP_MS) {
  const time = Math.max(0, Number(elapsedMs) || 0) % loopMs;
  const active = [];
  let charge = 0;
  for (const pulse of pulses) {
    const raw = (time - pulse.start) / pulse.duration;
    if (raw >= 0 && raw < 1) {
      active.push({ line: pulse.line, progress: easeInOutSine(raw), opacity: clampUnit(raw / .12) * (1 - clampUnit((raw - .94) / .06)) });
    }
    const since = time - (pulse.start + pulse.duration);
    if (since >= 0 && since < 2400) charge += .42 * Math.exp(-since / 700);
  }
  return { active, charge: clampUnit(charge) };
}

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

export function setWorkflowPlaybackRate(video) {
  if (!video) return;
  video.defaultPlaybackRate = WORKFLOW_PLAYBACK_RATE;
  video.playbackRate = WORKFLOW_PLAYBACK_RATE;
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

const SVG_NS = 'http://www.w3.org/2000/svg';
const HERO_PULSE_POOL = 8;
const HERO_PULSE_TAIL = 30;

function svgElement(tag, attributes, parent) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  parent.append(element);
  return element;
}

function enableHeroMotion() {
  const scene = document.querySelector('[data-hero-signal]');
  const map = scene?.querySelector('[data-hero-signal-map]');
  const hub = scene?.querySelector('[data-hero-hub]');
  if (!scene || !map || !hub) return;
  const reduced = prefersReducedMotion();
  const params = new URLSearchParams(window.location.search);
  const frameParam = params.get('frame');
  const heldFrame = frameParam !== null && Number.isFinite(Number(frameParam)) ? Number(frameParam) : null;
  const heroCopy = document.querySelector('.hero-copy');
  const header = document.querySelector('.site-header');
  let lines = [];
  let pulses = [];
  let lineElements = [];
  const pulseElements = [];

  // The copy's text extent, ignoring its reveal slide-in, padded so lines keep clear of it.
  const measureCopy = (bounds) => {
    const transform = heroCopy ? getComputedStyle(heroCopy).transform : 'none';
    const slide = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
    const rects = [...(heroCopy?.children ?? [])].map((child) => {
      const range = document.createRange();
      range.selectNodeContents(child);
      return range.getBoundingClientRect();
    }).filter((rect) => rect.width > 0);
    if (!rects.length) return [];
    const pad = 28;
    return [{
      left: Math.min(...rects.map((r) => r.left)) - bounds.left - pad,
      right: Math.max(...rects.map((r) => r.right)) - bounds.left + pad,
      top: Math.min(...rects.map((r) => r.top)) - slide - bounds.top - pad,
      bottom: Math.max(...rects.map((r) => r.bottom)) - slide - bounds.top + pad,
    }];
  };

  const layout = () => {
    const bounds = scene.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const hubBounds = hub.getBoundingClientRect();
    const hubPlace = { x: hubBounds.left + hubBounds.width / 2 - bounds.left, y: hubBounds.top + hubBounds.height / 2 - bounds.top, size: hubBounds.width };
    lines = planHeroSignals({
      width: bounds.width,
      height: bounds.height,
      hub: hubPlace,
      avoid: measureCopy(bounds),
      top: Math.max(0, (header?.getBoundingClientRect().bottom ?? 0) - bounds.top + 12),
    });
    pulses = heroSignalSchedule(lines);
    map.setAttribute('viewBox', `0 0 ${bounds.width.toFixed(0)} ${bounds.height.toFixed(0)}`);
    map.replaceChildren();
    const lineGroup = svgElement('g', { class: 'hero-signal__lines' }, map);
    lineElements = lines.map((line) => svgElement('path', { d: line.d, class: 'hero-signal__line' }, lineGroup));
    lines.forEach((line, index) => { line.measured = lineElements[index].getTotalLength?.() || line.length; });
    const pulseGroup = svgElement('g', { class: 'hero-signal__pulses' }, map);
    pulseElements.length = 0;
    for (let i = 0; i < HERO_PULSE_POOL; i += 1) {
      const tail = svgElement('path', { class: 'hero-signal__tail' }, pulseGroup);
      const head = svgElement('circle', { r: '2.4', class: 'hero-signal__head' }, pulseGroup);
      pulseElements.push({ tail, head });
    }
  };

  const render = (elapsed) => {
    const state = heroSignalState(elapsed, pulses);
    pulseElements.forEach(({ tail, head }, slot) => {
      const pulse = state.active[slot];
      if (!pulse) { tail.style.opacity = '0'; head.style.opacity = '0'; return; }
      const line = lines[pulse.line];
      const path = lineElements[pulse.line];
      const total = line.measured;
      const position = pulse.progress * total;
      tail.setAttribute('d', line.d);
      tail.style.strokeDasharray = `${HERO_PULSE_TAIL} ${total + HERO_PULSE_TAIL}`;
      tail.style.strokeDashoffset = `${HERO_PULSE_TAIL - position}`;
      const point = path.getPointAtLength(position);
      head.setAttribute('cx', point.x.toFixed(1));
      head.setAttribute('cy', point.y.toFixed(1));
      tail.style.opacity = (pulse.opacity * .7).toFixed(3);
      head.style.opacity = pulse.opacity.toFixed(3);
    });
    hub.style.setProperty('--charge', state.charge.toFixed(3));
  };

  const relayout = () => { layout(); if (reduced || heldFrame !== null) render(heldFrame ?? 0); };
  layout();
  scene.classList.add('hero-signal--ready');
  // The copy can reflow once the web font arrives, so plan again then.
  document.fonts?.ready?.then(relayout);
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(relayout, 160);
  }, { passive: true });
  // ?frame= holds one moment for review; reduced motion keeps the still network and hub.
  if (heldFrame !== null) { render(heldFrame); return; }
  if (reduced) return;
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(scene);
  }
  const startedAt = performance.now();
  const tick = (now) => {
    if (visible && !document.hidden) render(now - startedAt);
    window.requestAnimationFrame(tick);
  };
  window.requestAnimationFrame(tick);
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
      setWorkflowPlaybackRate(video);
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
  // Without a site key there is no check to show, so the slot stays out of the form entirely.
  if (!sitekey) return;

  const render = () => {
    if (!window.turnstile || slot.dataset.rendered === 'true') return;
    const widgetId = window.turnstile.render(slot, {
      sitekey,
      action: 'demo',
      theme: 'dark',
      // Invisible unless Cloudflare needs a visitor to tick the box; the slot takes no room until then.
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

function enableMobileNavigation() {
  const header = document.querySelector('.site-header');
  const toggle = header?.querySelector('[data-nav-toggle]');
  const navigation = header?.querySelector('#primary-navigation');
  if (!header || !toggle || !navigation) return;
  const mobile = window.matchMedia('(max-width: 1060px)');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  };
  header.classList.add('navigation-enhanced');
  toggle.hidden = false;
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  header.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  header.addEventListener('focusout', (event) => {
    if (!header.contains(event.relatedTarget)) setOpen(false);
  });
  mobile.addEventListener('change', () => setOpen(false));
}

function initialiseSite() {
  applyMotionPreviewOverride();
  enableMobileNavigation();
  enableSectionGlide();
  // The hero plans its layout from measurements; start it after the first paint so the copy shows at once.
  window.requestAnimationFrame(() => window.setTimeout(enableHeroMotion, 0));
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
