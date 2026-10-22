const MIN_SCROLL_DURATION = 700;
const MAX_SCROLL_DURATION = 1400;
const SCROLL_SPEED = 0.8;
const SECTION_GAP = 16;

// The clips are recorded at a calm pace and already sped up 1.4x, so they play at normal speed.
export const WORKFLOW_PLAYBACK_RATE = 1;
export const WORKFLOW_IDS = Object.freeze(['build', 'library', 'approve', 'board', 'reply']);

// Hero: the Assistall mark as a quiet signal hub. Thin traces run in from the edges of the
// screen on every side and corner, circuit-style: straight runs joined by 45° bends, each
// arriving square to the hub. Small packets of light travel in along them at an unhurried,
// irregular pace, a few sides at a time. Everything is planned in real pixels from the
// measured hero, copy and hub, traces never cross or touch, and none run behind the copy
// or under the header.
export const HERO_SIGNAL_LOOP_MS = 60000;
export const HERO_SIGNAL_SIDES = Object.freeze(['top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left']);
const HERO_SIGNAL_DIRECTIONS = Object.freeze({ right: [1, 0], bottom: [0, 1], left: [-1, 0], top: [0, -1], 'top-right': [Math.SQRT1_2, -Math.SQRT1_2], 'bottom-right': [Math.SQRT1_2, Math.SQRT1_2], 'bottom-left': [-Math.SQRT1_2, Math.SQRT1_2], 'top-left': [-Math.SQRT1_2, -Math.SQRT1_2] });
// Traces keep at least this many pixels between them everywhere.
export const HERO_TRACE_GAP = 6;
const HERO_TRACE_RADIUS = 7;
// A packet travels at about 195px a second, never quicker than 1.26s or slower than 3.6s a trace.
export const HERO_SIGNAL_SPEED = .195;
export const HERO_SIGNAL_MIN_MS = 1260;
export const HERO_SIGNAL_MAX_MS = 3600;
// Lights following each other on one trace keep at least this share of the run apart.
export const HERO_TRAIN_SPACING = .34;
// Phones run every light a quarter quicker than larger screens.
export const HERO_PHONE_PACE = .75;

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

const unit = ([x, y]) => { const length = Math.hypot(x, y) || 1; return [x / length, y / length]; };
const add = ([x, y], [dx, dy], k = 1) => [x + dx * k, y + dy * k];

// Where a trace meets the hub: a point on the matching edge (offset −1…1 along it) or on the
// rounded corner (offset turns a little either way round it), and the outward direction there.
export function heroHubAnchor(hub, side, offset = 0) {
  const half = hub.size / 2;
  const radius = hub.size * .24;
  const [dx, dy] = HERO_SIGNAL_DIRECTIONS[side];
  if (side === 'top' || side === 'bottom') return { x: hub.x + offset * (half - radius) * .8, y: hub.y + dy * half, normal: [0, dy] };
  if (side === 'left' || side === 'right') return { x: hub.x + dx * half, y: hub.y + offset * (half - radius) * .8, normal: [dx, 0] };
  const angle = Math.atan2(dy, dx) + offset * .3;
  const centre = [hub.x + Math.sign(dx) * (half - radius), hub.y + Math.sign(dy) * (half - radius)];
  return { x: centre[0] + Math.cos(angle) * radius, y: centre[1] + Math.sin(angle) * radius, normal: [dx, dy] };
}

function insideRect(x, y, rect) {
  return x > rect.left && x < rect.right && y > rect.top && y < rect.bottom;
}

function segmentsCross(a, b, c, d) {
  const turn = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0;
}

function pointSegmentDistance(p, a, b) {
  const ab = [b[0] - a[0], b[1] - a[1]];
  const t = clampUnit(((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / ((ab[0] ** 2 + ab[1] ** 2) || 1));
  return Math.hypot(p[0] - (a[0] + ab[0] * t), p[1] - (a[1] + ab[1] * t));
}

// The closest two traces come, as polylines (0 when they cross).
export function heroTraceDistance(first, second) {
  let best = Infinity;
  for (let i = 1; i < first.length; i += 1) {
    for (let j = 1; j < second.length; j += 1) {
      const [a, b, c, d] = [first[i - 1], first[i], second[j - 1], second[j]];
      if (segmentsCross(a, b, c, d)) return 0;
      best = Math.min(best, pointSegmentDistance(a, c, d), pointSegmentDistance(b, c, d), pointSegmentDistance(c, a, b), pointSegmentDistance(d, a, b));
    }
  }
  return best;
}

export function heroTraceLength(points) {
  let length = 0;
  for (let i = 1; i < points.length; i += 1) length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  return length;
}

// The SVG path from the outer end to the hub, with small rounded bends.
export function heroTracePath(points, radius = HERO_TRACE_RADIUS) {
  const f = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  let d = `M${f(points[0])}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [prev, at, next] = [points[i - 1], points[i], points[i + 1]];
    const into = unit([at[0] - prev[0], at[1] - prev[1]]);
    const out = unit([next[0] - at[0], next[1] - at[1]]);
    const r = Math.min(radius, Math.hypot(at[0] - prev[0], at[1] - prev[1]) / 2, Math.hypot(next[0] - at[0], next[1] - at[1]) / 2);
    d += ` L${f(add(at, into, -r))} Q${f(at)} ${f(add(at, out, r))}`;
  }
  return `${d} L${f(points[points.length - 1])}`;
}

// The traces, mirrored on every side so the pattern stays symmetric: five per side (a straight
// one, and two each way that swing 45° outwards, the outer pair further) and three per corner
// (one straight along the diagonal, one turning horizontal and one turning vertical).
const HERO_SIDE_OFFSETS = Object.freeze([-2, -1, 0, 1, 2]);
const HERO_SIDE_STUB = 20;
const HERO_SIDE_SWING = Object.freeze([0, 26, 52]);
const HERO_CORNER_STUB = 20;
const HERO_CORNER_TURN = 64;
// Traces routed round the copy run in lanes this far apart.
const HERO_TRACE_LANE = 10;
// Each trace carries on this far under the hub, so its light vanishes inside it.
export const HERO_TRACE_DEPTH = 18;

function heroTraceTemplates() {
  const templates = [];
  for (const side of ['top', 'right', 'bottom', 'left']) {
    for (const offset of HERO_SIDE_OFFSETS) templates.push({ side, offset, stub: HERO_SIDE_STUB, swing: HERO_SIDE_SWING[Math.abs(offset)] });
  }
  for (const side of ['top-right', 'bottom-right', 'bottom-left', 'top-left']) {
    for (const offset of [0, -1, 1]) templates.push({ side, offset, stub: offset ? HERO_CORNER_TURN : HERO_CORNER_STUB, swing: 0 });
  }
  return templates;
}

// The fixed part of a trace next to the hub: anchor, stub and any 45° swing, plus the
// direction of its final straight run.
function heroTraceStart(hub, template) {
  const corner = template.side.includes('-');
  const anchor = heroHubAnchor(hub, template.side, corner ? template.offset : template.offset / 2);
  const n = anchor.normal;
  const points = [[anchor.x, anchor.y]];
  let at = add(points[0], n, template.stub);
  points.push(at);
  let direction = n;
  if (!corner && template.offset) {
    const tangent = n[0] === 0 ? [Math.sign(template.offset), 0] : [0, Math.sign(template.offset)];
    at = add(at, unit([n[0] + tangent[0], n[1] + tangent[1]]), template.swing);
    points.push(at);
  }
  if (corner && template.offset) {
    // Turning clockwise of the diagonal runs one way, anticlockwise the other.
    const horizontal = (n[0] * n[1] < 0) === (template.offset > 0);
    direction = horizontal ? [Math.sign(n[0]), 0] : [0, Math.sign(n[1])];
  }
  return { template, anchor, points, at, direction };
}

// Plans the traces for one layout. `avoid` holds rectangles (the copy) no trace may enter;
// `top` keeps traces below the header. Every trace runs to the edge of the screen: where the
// copy is in the way of traces heading left, they turn up or down in the gap beside the copy
// and run out above or below it in their own lanes. Traces that would cross or come within
// HERO_TRACE_GAP of another are dropped.
export function planHeroSignals({ width, height, hub, avoid = [], top = 0, margin = 0 }) {
  const onScreen = (x, y) => x >= margin && x <= width - margin && y >= top + margin && y <= height - margin;
  const inCopy = (x, y) => avoid.some((rect) => insideRect(x, y, rect));
  const starts = heroTraceTemplates().map((template) => heroTraceStart(hub, template))
    .filter((start) => start.points.every(([x, y]) => onScreen(x, y) && !inCopy(x, y)));
  const finished = [];
  const leftBound = [];
  for (const start of starts) {
    let reach = 0;
    let blocked = false;
    for (let step = 2; step < 4000; step += 2) {
      const [x, y] = add(start.at, start.direction, step);
      if (!onScreen(x, y)) break;
      if (inCopy(x, y)) { blocked = true; break; }
      reach = step;
    }
    start.blocked = blocked;
    start.reach = reach;
    if (start.direction[0] < 0) leftBound.push(start);
    else if (reach >= 12) finished.push([...start.points, add(start.at, start.direction, reach)]);
  }

  // Heading left: straight out where the way is clear (phones), otherwise round the copy.
  const copy = avoid.find((rect) => leftBound.some((s) => s.blocked && hub.y > rect.top && hub.y < rect.bottom));
  if (!copy) {
    for (const start of leftBound) if (start.reach >= 12) finished.push([...start.points, add(start.at, start.direction, start.reach)]);
  } else {
    // Traces hug the copy: the innermost run just clear of its right edge and just above or
    // below it, each further trace one lane out. The order (by height where they reach the
    // columns) keeps every turn nested, so no two traces cross.
    const firstColumn = Math.min(...leftBound.filter((s) => s.direction[1] === 0).map((s) => s.at[0])) - 14;
    const yAtColumn = (s) => s.at[1] + s.direction[1] * (s.at[0] - firstColumn) / Math.abs(s.direction[0]);
    const upper = leftBound.filter((s) => yAtColumn(s) < hub.y - 1).sort((a, b) => yAtColumn(a) - yAtColumn(b));
    const lower = leftBound.filter((s) => yAtColumn(s) >= hub.y - 1).sort((a, b) => yAtColumn(b) - yAtColumn(a));
    const route = (group, edgeY, outward) => {
      group.forEach((s, i) => {
        const ring = group.length - 1 - i;
        const x = copy.right + HERO_TRACE_GAP + ring * HERO_TRACE_LANE;
        const lane = (outward < 0 ? copy.top - HERO_TRACE_GAP : copy.bottom + HERO_TRACE_GAP) + outward * ring * HERO_TRACE_LANE;
        // No room for the lane between the copy and the screen edge: run straight out to that edge instead.
        const laneFits = outward < 0 ? lane >= top + 4 : lane <= height - 4;
        const toColumn = (s.at[0] - x) / Math.abs(s.direction[0]);
        if (toColumn < 0) return;
        const toLane = s.direction[1] ? (lane - s.at[1]) / s.direction[1] : Infinity;
        const toEdge = s.direction[1] ? (edgeY - s.at[1]) / s.direction[1] : Infinity;
        if (toEdge >= 0 && toEdge < toColumn && !(laneFits && toLane < toEdge)) {
          // A diagonal trace reaches the top or bottom of the screen before its column: end it there.
          finished.push([...s.points, add(s.at, s.direction, toEdge)]);
          return;
        }
        if (laneFits && toLane >= 0 && toLane < toColumn) {
          // A diagonal trace meets its lane before its column: turn straight along the lane.
          const meet = add(s.at, s.direction, toLane);
          finished.push([...s.points, meet, [margin, lane]]);
          return;
        }
        const meet = add(s.at, s.direction, toColumn);
        finished.push(laneFits ? [...s.points, meet, [x, lane], [margin, lane]] : [...s.points, meet, [x, edgeY]]);
      });
    };
    route(upper, top, -1);
    route(lower, height, 1);
  }

  const lines = [];
  const byStart = new Map(starts.map((start) => [start.points[0].join(), start]));
  for (const outward of finished) {
    const start = byStart.get(outward[0].join());
    const points = outward.slice().reverse();
    if (lines.some((line) => heroTraceDistance(line.points, points) < HERO_TRACE_GAP)) continue;
    const inside = add(outward[0], start.anchor.normal, -HERO_TRACE_DEPTH);
    const drawn = [...points, inside];
    lines.push({
      id: `${start.template.side}${start.template.offset}`,
      side: start.template.side,
      points,
      // Vias mark the real bends (where the direction changes), not straight joins.
      bends: points.slice(1, -1).filter((at, i) => {
        const [a, b] = [points[i], points[i + 2]];
        return Math.abs((at[0] - a[0]) * (b[1] - at[1]) - (at[1] - a[1]) * (b[0] - at[0])) > 1e-6;
      }),
      length: heroTraceLength(drawn),
      d: heroTracePath(drawn),
    });
  }
  return lines;
}

export function heroSignalDuration(length, pace = 1) {
  return Math.round(Math.min(HERO_SIGNAL_MAX_MS, Math.max(HERO_SIGNAL_MIN_MS, length / HERO_SIGNAL_SPEED)) * pace);
}

// A fixed, seeded timetable of lights, so the hub looks spontaneous but any moment can be
// held for review with ?frame=. Bursts of five to seven lights leave from around the hub
// (at most two from any one side) a fraction of a second apart. A trace can carry a train of
// lights, like electrons, but each keeps at least a third of the run behind the one ahead.
export function heroSignalSchedule(lines, { seed = 7, loopMs = HERO_SIGNAL_LOOP_MS, pace = 1 } = {}) {
  const random = seededRandom(seed);
  const pulses = [];
  if (!lines.length) return pulses;
  let time = 300;
  while (time < loopMs - HERO_SIGNAL_MAX_MS - 400) {
    const roll = random();
    const count = roll < .3 ? 7 : roll < .6 ? 6 : 5;
    const sides = new Map();
    let last = time;
    for (let k = 0; k < count; k += 1) {
      const start = Math.round(time + k * (10 + random() * 30));
      last = start;
      let pick = -1;
      for (let tries = 0; tries < 16 && pick < 0; tries += 1) {
        const index = Math.floor(random() * lines.length);
        if ((sides.get(lines[index].side) ?? 0) >= 2) continue;
        if (pulses.some((pulse) => pulse.line === index && start < pulse.start + pulse.duration * HERO_TRAIN_SPACING)) continue;
        pick = index;
      }
      if (pick < 0) continue;
      sides.set(lines[pick].side, (sides.get(lines[pick].side) ?? 0) + 1);
      pulses.push({ line: pick, start, duration: heroSignalDuration(lines[pick].length, pace) });
    }
    // The next burst follows 0.18 to 0.36 seconds after this one's last light.
    time = last + 180 + random() * 180;
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
  pulses.forEach((pulse, id) => {
    const raw = (time - pulse.start) / pulse.duration;
    if (raw >= 0 && raw < 1) {
      active.push({ id, line: pulse.line, progress: easeInOutSine(raw), opacity: clampUnit(raw / .12) * (1 - clampUnit((raw - .94) / .06)) });
    }
    const since = time - (pulse.start + pulse.duration);
    if (since >= 0 && since < 2400) charge += .42 * Math.exp(-since / 700);
  });
  return { active, charge: clampUnit(charge) };
}

const CAPABILITIES = Object.freeze([
  { id: 'inbox', label: 'Email replies', input: 'A customer or supplier email', preparation: 'Writes a reply in your company’s words', result: 'A reply you check. Nothing sends without you.', image: 'cap-inbox', alt: 'Prepared email replies waiting for approval, one card per customer email' },
  { id: 'files', label: 'Documents and reports', input: 'A PDF, photo, spreadsheet or report', preparation: 'Reads it and pulls out the key numbers', result: 'A short summary, with the original one click away', image: 'cap-files', alt: 'Three reports read by Assistall, each with a short summary and its total' },
  { id: 'contracts', label: 'Contracts and renewals', input: 'A contract, or a new version of one', preparation: 'Finds the dates and what changed', result: 'A reminder before the notice date', image: 'cap-contracts', alt: 'A supply agreement due for review, with its notice date, renewal date and both versions of the contract' },
  { id: 'shipments', label: 'Shipments', input: 'Shipping documents and status updates', preparation: 'Tracks where each shipment is and what is missing', result: 'Your team acts before the customer asks', image: 'cap-shipments', alt: 'A shipment held at customs, with its route, ETA, container and the documents linked to it' },
  { id: 'clients', label: 'Client requests', input: 'A request by email or WhatsApp', preparation: 'Records it with an owner and a due date', result: 'Nothing gets forgotten', image: 'cap-clients', alt: 'Open client requests, each with a priority, an owner and a due date' },
  { id: 'booking', label: 'Bookings and calendar', input: 'A request for a visit or a call', preparation: 'Finds a time that suits your team', result: 'Confirmed and on the calendar', image: 'cap-booking', alt: 'Upcoming showroom visits, supplier calls and delivery planning, each confirmed with an owner' },
  { id: 'workflows', label: 'Workflows', input: 'Something happens: an email, a due date, a delay', preparation: 'Runs the steps you set, in order', result: 'A person approves before anything is done', image: 'cap-workflows', alt: 'Workflows running on this PC, each showing how many runs are waiting for approval' },
  { id: 'records', label: 'Records and reminders', input: 'Licences, permits, certificates and insurance', preparation: 'Keeps a list of what expires and when', result: 'A reminder in time to renew', image: 'cap-records', alt: 'The expiry register: a vehicle registration, a fire safety permit and a trade licence, with days left before each expires' },
]);
const FLOW_STEPS = Object.freeze([
  { id: 'connect', caption: 'Connections', image: 'flow-connect', alt: 'The Assistall Integrations screen: the mailbox, shipment files, QuickBooks Online and lead research are connected' },
  { id: 'find', caption: 'Home', image: 'flow-find', alt: 'The Assistall Home screen: 24 items need attention, with shipments, requests, renewals and approvals counted and a timeline of what is due' },
  { id: 'prepare', caption: 'A prepared reply', image: 'flow-prepare', alt: 'A customer’s order email on the left and the reply Assistall prepared on the right, waiting for approval' },
  { id: 'decide', caption: 'An approval', image: 'flow-decide', alt: 'A large order waiting for two people to approve, listing what Assistall will do and what it will never do' },
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

export function createFlowState(requestedId) {
  const activeId = FLOW_STEPS.some(({ id }) => id === requestedId) ? requestedId : FLOW_STEPS[0].id;
  return { activeId, step: FLOW_STEPS.find(({ id }) => id === activeId) };
}

export function showcaseImage(name) {
  return `assets/media/showcase/${name}.webp`;
}

// Which step of a clip is on screen: the last one whose start time has passed.
export function workflowStepIndex(times, currentTime) {
  let index = 0;
  times.forEach((time, position) => { if (currentTime + .05 >= time) index = position; });
  return index;
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
// Enough drawing slots that lights started within any few seconds never share one.
const HERO_PULSE_POOL = 96;
// The hero redraws at most 60 times a second: smooth on every screen, without extra work on
// 120Hz and faster displays.
const HERO_FRAME_MS = 1000 / 60;
const HERO_PAUSE_KEY = 'assistall-hero-paused';
// A light is an electron: one short, solid, square-ended streak the width of its trace (tiny
// dash fragments shimmered as they moved), with a thin, barely visible trail a little way behind.
const HERO_PACKET_LENGTH = 7;
const HERO_TRAIL_LENGTH = 14;
const HERO_TRAIL_GAP = 3;

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
  // Owner decision (22 October 2026): the full animation plays for everyone, including people who
  // turned animations off; the pause button lets anyone stop it. Only ?motion=off holds it still.
  const stillOnly = motionPreviewOverride() === 'off';
  const phoneLayout = window.matchMedia('(max-width: 820px)');
  const params = new URLSearchParams(window.location.search);
  const frameParam = params.get('frame');
  const heldFrame = frameParam !== null && Number.isFinite(Number(frameParam)) ? Number(frameParam) : null;
  const heroCopy = document.querySelector('.hero-copy');
  const header = document.querySelector('.site-header');
  let lines = [];
  let pulses = [];
  let lineElements = [];
  const pulseElements = [];
  // Which light each drawing slot is showing, and the hub glow last painted.
  let slotOwner = [];
  let lastCharge = -1;

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
    // Traces keep this far from the copy's text.
    const pad = 18;
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
      // On phones the network runs behind the copy (a film keeps the text readable), so only
      // wider screens route the traces around it.
      avoid: phoneLayout.matches ? [] : measureCopy(bounds),
      // The hero starts at the top of the page under the fixed header, so use its height,
      // not where it sits on screen (that moves if the page loads part-scrolled).
      top: (header?.offsetHeight ?? 0) + 12,
    });
    pulses = heroSignalSchedule(lines, { pace: phoneLayout.matches ? HERO_PHONE_PACE : 1 });
    map.setAttribute('viewBox', `0 0 ${bounds.width.toFixed(0)} ${bounds.height.toFixed(0)}`);
    // Pin the drawing to the top-left so a brief size mismatch can never shift it.
    map.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    map.replaceChildren();
    const lineGroup = svgElement('g', { class: 'hero-signal__lines' }, map);
    lineElements = lines.map((line) => svgElement('path', { d: line.d, class: 'hero-signal__line' }, lineGroup));
    // A small square via marks each bend, like a circuit trace.
    for (const line of lines) {
      for (const [x, y] of line.bends) svgElement('rect', { x: (x - 1.75).toFixed(1), y: (y - 1.75).toFixed(1), width: '3.5', height: '3.5', class: 'hero-signal__via' }, lineGroup);
    }
    lines.forEach((line, index) => { line.measured = lineElements[index].getTotalLength?.() || line.length; });
    const pulseGroup = svgElement('g', { class: 'hero-signal__pulses' }, map);
    pulseElements.length = 0;
    slotOwner = [];
    lastCharge = -1;
    for (let i = 0; i < HERO_PULSE_POOL; i += 1) {
      const trail = svgElement('path', { class: 'hero-signal__trail' }, pulseGroup);
      const packet = svgElement('path', { class: 'hero-signal__packet' }, pulseGroup);
      pulseElements.push({ trail, packet });
    }
  };

  // Each light keeps one drawing slot for its whole journey (slot = its id in the timetable, so
  // lights never swap elements as others finish) and its path is set once, when it starts.
  const render = (elapsed) => {
    const state = heroSignalState(elapsed, pulses);
    const used = new Set();
    for (const pulse of state.active) {
      const slot = pulse.id % HERO_PULSE_POOL;
      if (used.has(slot)) continue;
      used.add(slot);
      const { trail, packet } = pulseElements[slot];
      const line = lines[pulse.line];
      const total = line.measured;
      if (slotOwner[slot] !== pulse.id) {
        slotOwner[slot] = pulse.id;
        trail.setAttribute('d', line.d);
        packet.setAttribute('d', line.d);
        // Each dash pattern is longer than the trace, so it can never wrap back onto it.
        trail.style.strokeDasharray = `${HERO_TRAIL_LENGTH} ${total + HERO_TRAIL_LENGTH * 2}`;
        packet.style.strokeDasharray = `${HERO_PACKET_LENGTH} ${total + HERO_PACKET_LENGTH * 2}`;
      }
      const position = pulse.progress * total;
      const trailEnd = position - HERO_PACKET_LENGTH - HERO_TRAIL_GAP;
      trail.style.strokeDashoffset = (HERO_TRAIL_LENGTH - trailEnd).toFixed(2);
      packet.style.strokeDashoffset = (HERO_PACKET_LENGTH - position).toFixed(2);
      trail.style.opacity = (pulse.opacity * .22).toFixed(3);
      packet.style.opacity = pulse.opacity.toFixed(3);
    }
    pulseElements.forEach(({ trail, packet }, slot) => {
      if (used.has(slot) || slotOwner[slot] === undefined) return;
      slotOwner[slot] = undefined;
      trail.style.opacity = '0';
      packet.style.opacity = '0';
    });
    // The hub's glow is a large soft shadow; only repaint it when it visibly changes.
    if (Math.abs(state.charge - lastCharge) >= .01) {
      lastCharge = state.charge;
      hub.style.setProperty('--charge', state.charge.toFixed(3));
    }
  };

  const relayout = () => { layout(); if (stillOnly || heldFrame !== null) render(heldFrame ?? 0); };
  layout();
  scene.classList.add('hero-signal--ready');
  // The copy can reflow once the web font arrives, so plan again then.
  document.fonts?.ready?.then(relayout);
  // Plan again once the hero's size settles after any change (window resize, the hero
  // growing as the page finishes loading), so the traces always match the space they fill.
  let resizeTimer = 0;
  let planned = scene.getBoundingClientRect();
  const replanIfResized = () => {
    const now = scene.getBoundingClientRect();
    if (Math.abs(now.width - planned.width) < 1 && Math.abs(now.height - planned.height) < 1) return;
    planned = now;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(relayout, 120);
  };
  if ('ResizeObserver' in window) new ResizeObserver(replanIfResized).observe(scene);
  else window.addEventListener('resize', replanIfResized, { passive: true });
  // ?frame= holds one moment for review; ?motion=off keeps the still network and hub.
  if (heldFrame !== null) { render(heldFrame); return; }
  if (stillOnly) return;
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(scene);
  }
  // The pause button stops the clock where it is; the choice is remembered on this device.
  const pauseButton = document.querySelector('[data-hero-pause]');
  let paused = false;
  try { paused = window.localStorage.getItem(HERO_PAUSE_KEY) === '1'; } catch { paused = false; }
  let elapsed = 0;
  let lastTick = null;
  let lastDraw = -Infinity;
  const showPaused = () => {
    scene.classList.toggle('hero-signal--paused', paused);
    if (!pauseButton) return;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? 'Play the background animation' : 'Pause the background animation');
  };
  if (pauseButton) {
    pauseButton.hidden = false;
    pauseButton.addEventListener('click', () => {
      paused = !paused;
      try { window.localStorage.setItem(HERO_PAUSE_KEY, paused ? '1' : '0'); } catch { /* the choice just isn't remembered */ }
      showPaused();
    });
  }
  showPaused();
  render(0);
  const tick = (now) => {
    if (lastTick !== null && visible && !document.hidden && !paused) elapsed += Math.min(now - lastTick, 100);
    lastTick = now;
    if (!paused && visible && !document.hidden && now - lastDraw >= HERO_FRAME_MS - 1) {
      lastDraw = now;
      render(elapsed);
    }
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
  showShot(root.querySelector('[data-capability-image]'), root.querySelector('[data-capability-open]'), selected.image, selected.alt);
}

function enableCapabilitySwitcher() {
  const root = document.querySelector('[data-capability-switcher]');
  if (!root) return;
  renderCapability(root, 'inbox');
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-capability-id]');
    if (button) renderCapability(root, button.dataset.capabilityId);
  });
  enableTabKeys(root, '[data-capability-id]', (button) => renderCapability(root, button.dataset.capabilityId));
  preloadShots(CAPABILITIES.map(({ image }) => image));
}

// Changes a screenshot with a short fade, so the picture never jumps.
function showShot(image, link, name, alt) {
  if (!image) return;
  const src = showcaseImage(name);
  if (link) link.href = src;
  if (image.getAttribute('src') === src) return;
  image.classList.add('is-swapping');
  const reveal = () => image.classList.remove('is-swapping');
  window.setTimeout(() => {
    image.addEventListener('load', reveal, { once: true });
    image.addEventListener('error', reveal, { once: true });
    image.src = src;
    image.alt = alt;
  }, prefersReducedMotion() ? 0 : 140);
}

function preloadShots(names) {
  const load = () => names.forEach((name) => { const image = new Image(); image.src = showcaseImage(name); });
  if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 2500 });
  else window.setTimeout(load, 1200);
}

function enableTabKeys(root, selector, activate) {
  root.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...root.querySelectorAll(selector)];
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    let next = current + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1);
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    const target = buttons[(next + buttons.length) % buttons.length];
    target.focus();
    activate(target);
  });
}

function renderFlow(root, requestedId) {
  const { activeId, step } = createFlowState(requestedId);
  root.querySelectorAll('[data-flow-step]').forEach((button) => {
    const active = button.dataset.flowStep === activeId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  root.querySelector('#flow-panel')?.setAttribute('aria-labelledby', `flow-tab-${activeId}`);
  const caption = root.querySelector('[data-flow-caption]');
  if (caption) caption.textContent = step.caption;
  showShot(root.querySelector('[data-flow-image]'), root.querySelector('[data-flow-open]'), step.image, step.alt);
}

function enableFlowSwitcher() {
  const root = document.querySelector('[data-flow-switcher]');
  if (!root) return;
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-flow-step]');
    if (button) renderFlow(root, button.dataset.flowStep);
  });
  enableTabKeys(root, '[data-flow-step]', (button) => renderFlow(root, button.dataset.flowStep));
  preloadShots(FLOW_STEPS.map(({ image }) => image));
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

  const activate = (requestedId, { focus = false } = {}) => {
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
  };

  panels.forEach((panel) => {
    const video = panel.querySelector('[data-workflow-video]');
    const steps = [...panel.querySelectorAll('[data-workflow-seek]')];
    if (!video) return;
    const times = steps.map((step) => Number(step.dataset.workflowSeek) || 0);
    const markStep = () => {
      const current = workflowStepIndex(times, video.currentTime);
      steps.forEach((step, index) => {
        step.classList.toggle('is-current', index === current);
        if (index === current) step.setAttribute('aria-current', 'step');
        else step.removeAttribute('aria-current');
      });
    };
    video.addEventListener('timeupdate', markStep);
    video.addEventListener('seeked', markStep);
    markStep();
    // When a clip finishes, the next one starts, unless someone is reading or using this one.
    video.addEventListener('ended', () => {
      if (panel.dataset.workflowPanel !== activeId) return;
      if (shouldRotateWorkflow({ visible, reducedMotion: prefersReducedMotion(), interactionPaused: pointerPaused || focusPaused })) {
        activate(WORKFLOW_IDS[(WORKFLOW_IDS.indexOf(activeId) + 1) % WORKFLOW_IDS.length]);
      } else {
        window.setTimeout(() => {
          if (panel.dataset.workflowPanel !== activeId || !visible) return;
          try { video.currentTime = 0; } catch { /* Metadata may not be ready yet. */ }
          syncVideos();
        }, 1600);
      }
    });
    panel.addEventListener('click', (event) => {
      const step = event.target.closest('[data-workflow-seek]');
      if (!step) return;
      try { video.currentTime = Number(step.dataset.workflowSeek) || 0; } catch { /* Metadata may not be ready yet. */ }
      video.play().catch(() => {});
    });
  });

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

  root.addEventListener('mouseenter', () => { pointerPaused = true; });
  root.addEventListener('mouseleave', () => { pointerPaused = false; });
  root.addEventListener('focusin', () => { focusPaused = true; });
  root.addEventListener('focusout', (event) => {
    if (event.relatedTarget && root.contains(event.relatedTarget)) return;
    focusPaused = false;
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncVideos();
    }, { threshold: 0.35 }).observe(root);
  } else {
    visible = true;
  }

  root.classList.add('is-enhanced');
  activate(activeId);
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
  // The widget only accepts assistall.ai, so the local preview skips it rather than show an error.
  const localPreview = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  if (!sitekey || localPreview) return;

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
  enableFlowSwitcher();
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
