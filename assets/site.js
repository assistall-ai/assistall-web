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

export const WORKFLOW_ROTATION_MS = 11000;
export const WORKFLOW_PLAYBACK_RATE = 0.65;
export const WORKFLOW_IDS = Object.freeze(['contract', 'shipment', 'report']);

// x/y are each source's default place in the 1200 × 700 stage (used before measuring).
// Above 820px the page measures the copy and workspace and spreads the sources over the
// free space (planHeroSpread). At 820px and below the copy fills the width, so the eight
// `compact` sources use fixed `squeezed` rows across the full width instead.
export const HERO_SQUEEZED_MAX_WIDTH = 820;
export const HERO_MOTION_ITEMS = Object.freeze([
  { id: 'zoho', icon: 'zoho', label: 'ZOHO', x: 540, y: 20 },
  { id: 'odoo', icon: 'odoo', label: 'odoo', x: 420, y: 30 },
  { id: 'whatsapp', icon: 'whatsapp', label: 'WhatsApp', x: 660, y: 150 },
  { id: 'email', icon: 'gmail', label: 'Email', x: 660, y: 30, compact: { squeezed: { x: 280, y: 150 } } },
  { id: 'docx', icon: 'word', label: 'DOCX', x: 785, y: 10, compact: { squeezed: { x: 380, y: 45 } } },
  { id: 'xlsx', icon: 'excel', label: 'XLSX', x: 915, y: 10, compact: { squeezed: { x: 640, y: 45 } } },
  { id: 'csv', icon: 'csv', label: 'CSV', x: 1045, y: 10, compact: { squeezed: { x: 900, y: 45 } } },
  { id: 'voice', icon: 'voice', label: 'Voice', x: 1170, y: 20, compact: { squeezed: { x: 540, y: 150 } } },
  { id: 'folder', icon: 'folder', label: 'Folder', x: 1195, y: 150, compact: { squeezed: { x: 500, y: 230 } } },
  { id: 'txt', icon: 'txt', label: 'TXT', x: 1190, y: 270, compact: { squeezed: { x: 1040, y: 150 } } },
  { id: 'pdf', icon: 'pdf', label: 'PDF', x: 1070, y: 270, compact: { squeezed: { x: 1160, y: 45 } } },
  { id: 'pptx', icon: 'powerpoint', label: 'PPTX', x: 660, y: 270 },
  { id: 'jpg', icon: 'image', label: 'JPG', x: 1080, y: 155 },
  { id: 'json', icon: 'json', label: 'JSON', x: 300, y: 22 },
]);

export function heroLayoutForWidth(width) {
  return width <= HERO_SQUEEZED_MAX_WIDTH ? 'squeezed' : 'spread';
}

// On wide and mid screens the sources are placed from the measured page: an uneven
// lattice over the free space (the strip above the copy and the area right of it),
// sampled so the cards spread evenly without touching the copy, the workspace or the
// document's path below it. All values are stage pixels; results are stage units.
const HERO_CARD = Object.freeze({ width: 74, height: 26, gapX: 30, gapY: 20 });
const HERO_PRIORITY = ['email', 'docx', 'xlsx', 'csv', 'voice', 'folder', 'txt', 'pdf', 'whatsapp', 'odoo', 'zoho', 'jpg', 'pptx', 'json'];
const HERO_SPREAD_ORDER = ['zoho', 'email', 'docx', 'whatsapp', 'odoo', 'xlsx', 'pdf', 'voice', 'csv', 'jpg', 'folder', 'pptx', 'txt', 'json'];

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function planHeroSpread({ width, height, copy, box, safeTop = 12, items = HERO_MOTION_ITEMS, maxItems = 14 } = {}) {
  const { width: cardW, height: cardH, gapX, gapY } = HERO_CARD;
  const halfW = cardW / 2;
  const halfH = cardH / 2;
  const right = width - 28 - halfW;
  const top = safeTop + halfH;
  const stripBottom = copy.top - 20 - halfH;
  const boxCentre = (box.left + box.right) / 2;
  const boxWidth = box.right - box.left;
  // Sources stay above the workspace top so every route can enter from above without crossing.
  const zones = [{ left: copy.right + 40 + halfW, right, top, bottom: box.top - 30 - halfH }];
  if (stripBottom >= top) zones.unshift({ left: copy.left + halfW, right, top, bottom: stripBottom });

  const clear = (x, y) => {
    const hitsCopy = x + halfW > copy.left - 16 && x - halfW < copy.right + 32 && y + halfH > copy.top - 16 && y - halfH < copy.bottom + 16;
    const inDocumentColumn = Math.abs(x - boxCentre) < boxWidth / 2 + halfW + 48 && y + halfH > box.top - 56;
    const nearWorkspace = Math.hypot(x - boxCentre, y - box.top) < boxWidth * .9 + 72;
    return !hitsCopy && !inDocumentColumn && !nearWorkspace;
  };

  const random = seededRandom(20261016);
  const stepX = (cardW + gapX) / 2;
  const stepY = (cardH + gapY) / 1.4;
  const candidates = [];
  for (const zone of zones) {
    for (let y = zone.top; y <= zone.bottom; y += stepY) {
      for (let x = zone.left; x <= zone.right; x += stepX) {
        const cx = Math.min(zone.right, Math.max(zone.left, x + (random() - .5) * stepX));
        const cy = Math.min(zone.bottom, Math.max(zone.top, y + (random() - .5) * stepY));
        if (clear(cx, cy)) candidates.push({ x: cx, y: cy });
      }
    }
  }

  const gate = { x: boxCentre, y: box.top };
  const distanceToPath = (point, from) => {
    const dx = gate.x - from.x;
    const dy = gate.y - from.y;
    const t = Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(point.x - (from.x + dx * t), point.y - (from.y + dy * t));
  };
  // Cards keep apart and out of each other's way to the workspace, so routes need not cross.
  const apart = (a, b) => (Math.abs(a.x - b.x) >= cardW + gapX || Math.abs(a.y - b.y) >= cardH + gapY)
    && distanceToPath(a, b) >= cardW * .6 && distanceToPath(b, a) >= cardW * .6;
  const spread = (a, b) => Math.hypot((a.x - b.x) / (cardW + gapX), (a.y - b.y) / (cardH + gapY));
  const chosen = [];
  const remaining = [...candidates].sort((a, b) => a.y - b.y || a.x - b.x);
  if (remaining.length) chosen.push(remaining.shift());
  while (chosen.length < Math.min(maxItems, items.length) && remaining.length) {
    let best = -1;
    let bestScore = -Infinity;
    remaining.forEach((candidate, index) => {
      if (!chosen.every((point) => apart(point, candidate))) return;
      const score = Math.min(...chosen.map((point) => spread(point, candidate)));
      if (score > bestScore) { bestScore = score; best = index; }
    });
    if (best < 0) break;
    chosen.push(remaining.splice(best, 1)[0]);
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const selected = HERO_PRIORITY.slice(0, chosen.length);
  const ordered = HERO_SPREAD_ORDER.filter((id) => selected.includes(id));
  return chosen
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .map((point, index) => ({ ...byId.get(ordered[index]), x: point.x / width * 1200, y: point.y / height * 700 }));
}

export function heroItemsForLayout(layout, items = HERO_MOTION_ITEMS) {
  if (layout !== 'squeezed') return items;
  return items.filter((item) => item.compact?.[layout]).map((item) => ({ ...item, ...item.compact[layout] }));
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

// File-format marks, drawn in one monochrome stroke. Office formats use a lettered tile
// over the page, PDF a lettered badge, and CSV, TXT and JSON their own content glyphs.
// The same drawings appear in index.html's Connections cards.
const FILE_STROKE = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
const OFFICE_PAGE = 'M8.5 9V3h7.5l4.5 4.5V21H8.5v-2M16 3v4.5h4.5';
const OFFICE_TILE = 'M4 9h7a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 11 19H4a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 4 9z';
const FULL_PAGE = 'M6 3h9l4.5 4.5V21H6zM15 3v4.5h4.5';
// The Assistall mark drawn as vectors (geometry measured from android-chrome-512x512.png),
// so the workspace can carry it as a raised, embossed stamp. index.html's still frame repeats it.
export const LOGO_STAMP_MARK = '<svg class="logo-stamp__mark" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><rect x="112" y="142" width="189" height="49" rx="14" fill="#F4EFE4"/><rect x="112" y="232" width="239" height="49" rx="14" fill="#C8A25D"/><rect x="112" y="322" width="289" height="49" rx="14" fill="#F4EFE4"/><path d="M128 148h157M128 238h207M128 328h257" stroke="#FFFDF8" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/></svg>';

export const FILE_MARKS = Object.freeze({
  word: `<g ${FILE_STROKE}><path d="${OFFICE_PAGE}M14.5 12h3.5M14.5 15h3.5M14.5 18h2"/><path d="${OFFICE_TILE}"/><path d="M4.6 11.6l1.3 5 1.6-3.6 1.6 3.6 1.3-5" stroke-width="1.4"/></g>`,
  excel: `<g ${FILE_STROKE}><path d="${OFFICE_PAGE}M14.5 11.5h3.5v7h-3.5zM14.5 15h3.5"/><path d="${OFFICE_TILE}"/><path d="M5.2 11.7l4.6 5.6M9.8 11.7l-4.6 5.6" stroke-width="1.4"/></g>`,
  powerpoint: `<g ${FILE_STROKE}><path d="${OFFICE_PAGE}M14.5 11.5h3.5v3.5h-3.5zM14.5 18h3.5"/><path d="${OFFICE_TILE}"/><path d="M6.2 17.2v-5.4h1.9a1.6 1.6 0 0 1 0 3.2H6.2" stroke-width="1.4"/></g>`,
  pdf: `<g ${FILE_STROKE}><path d="M6 11V3h9l4.5 4.5V21H6v-4M15 3v4.5h4.5"/><path d="M4.7 11h10.6a1.2 1.2 0 0 1 1.2 1.2v3.6a1.2 1.2 0 0 1-1.2 1.2H4.7a1.2 1.2 0 0 1-1.2-1.2v-3.6a1.2 1.2 0 0 1 1.2-1.2z"/><path d="M5.6 15.6v-3.2h1a.95.95 0 0 1 0 1.9h-1M8.8 12.4v3.2h.6a1.6 1.6 0 0 0 0-3.2zM12.3 15.6v-3.2h2M12.3 14h1.5" stroke-width="1.15"/></g>`,
  csv: `<g ${FILE_STROKE}><path d="${FULL_PAGE}"/><path d="M8.5 11h8.5v7H8.5zM8.5 14.5h8.5M11.3 11v7M14.2 11v7" stroke-width="1.4"/></g>`,
  txt: `<g ${FILE_STROKE}><path d="${FULL_PAGE}M9 11.5h7M9 14.5h7M9 17.5h4.5"/></g>`,
  json: `<g ${FILE_STROKE}><path d="M9 4.5c-1.6 0-2.2.8-2.2 2.2v2.6c0 1.2-.7 2.2-2.1 2.7 1.4.5 2.1 1.5 2.1 2.7v2.6c0 1.4.6 2.2 2.2 2.2M15 4.5c1.6 0 2.2.8 2.2 2.2v2.6c0 1.2.7 2.2 2.1 2.7-1.4.5-2.1 1.5-2.1 2.7v2.6c0 1.4-.6 2.2-2.2 2.2M10.5 12h.01M13.5 12h.01"/></g>`,
});

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
  const mark = FILE_MARKS[icon] ?? path;
  return `<span class="connector-mark" data-connector-mark="${icon}"><svg class="connector-mark__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${mark}</svg></span>`;
}

function clampUnit(value) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(progress) {
  return 1 - (1 - clampUnit(progress)) ** 3;
}

// Entry points along the workspace's top edge are handed out in the order the sources sit
// around the workspace (by angle, left through top to right). With every route arriving
// straight down into its own entry point, routes fan in side by side and never cross.
const HERO_GATE = Object.freeze({ left: 836, width: 68, approach: 80, pivot: { x: 870, y: 340 } });

function gateX(rank, count) {
  return HERO_GATE.left + (count > 1 ? rank / (count - 1) : .5) * HERO_GATE.width;
}

// Visible part of a route (above the workspace's top edge) as line segments.
function visibleRouteSegments(source, x) {
  const control = heroRouteControl(source, { x, y: HERO_TARGET.y });
  const points = [];
  for (let step = 0; step <= 24; step += 1) {
    const t = step / 24;
    const point = {
      x: (1 - t) ** 2 * source.x + 2 * t * (1 - t) * control.x + t * t * x,
      y: (1 - t) ** 2 * source.y + 2 * t * (1 - t) * control.y + t * t * HERO_TARGET.y,
    };
    if (point.y < HERO_TARGET.y - .5) points.push(point);
  }
  return points.slice(1).map((point, index) => [points[index], point]);
}

function segmentsCross([a, b], [c, d]) {
  const side = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}

const gateRankCache = new WeakMap();
function heroGateRanks(items) {
  const cached = gateRankCache.get(items);
  if (cached) return cached;
  const angle = ({ x, y }) => Math.atan2(y - HERO_GATE.pivot.y, x - HERO_GATE.pivot.x);
  const order = [...items].sort((first, second) => angle(first) - angle(second) || first.x - second.x);
  const count = order.length;
  const crossesAt = (first, firstX, second, secondX) => {
    const a = visibleRouteSegments(first, firstX);
    const b = visibleRouteSegments(second, secondX);
    return a.some((segment) => b.some((other) => segmentsCross(segment, other)));
  };
  // Pairwise: which of two neighbouring entry points each source needs to stay clear of the other.
  const centre = HERO_GATE.left + HERO_GATE.width / 2;
  const spacing = count > 1 ? HERO_GATE.width / (count - 1) : 0;
  order.sort((first, second) => {
    const firstLeft = crossesAt(first, centre - spacing / 2, second, centre + spacing / 2);
    const secondLeft = crossesAt(second, centre - spacing / 2, first, centre + spacing / 2);
    if (firstLeft !== secondLeft) return firstLeft ? 1 : -1;
    return angle(first) - angle(second) || first.x - second.x;
  });
  // Then untangle anything left at the real entry points by moving routes past each other.
  for (let pass = 0; pass < count * count; pass += 1) {
    let moved = false;
    for (let a = 0; a < count - 1 && !moved; a += 1) {
      for (let b = a + 1; b < count && !moved; b += 1) {
        if (crossesAt(order[a], gateX(a, count), order[b], gateX(b, count))) {
          order.splice(a, 0, order.splice(b, 1)[0]);
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  const ranks = new Map(order.map((item, rank) => [item.id, rank]));
  gateRankCache.set(items, ranks);
  return ranks;
}

function heroGateTarget(item, items, y) {
  return { x: gateX(heroGateRanks(items).get(item.id) ?? 0, items.length), y };
}

// The visible curve of each route, for checks: source, control point and top-edge entry.
export function heroRouteCurves(items = HERO_MOTION_ITEMS) {
  return items.map((item) => {
    const to = heroInputTarget(item, items);
    return { id: item.id, from: { x: item.x, y: item.y }, control: heroRouteControl(item, to), to };
  });
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
  // Pull every curve toward a point straight above its entry point, so it arrives vertically.
  // Sources below the approach height bend from their own height, so no route rises then falls.
  return { x: target.x, y: Math.max(item.y, HERO_TARGET.y - HERO_GATE.approach) };
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

// Each route is one curve to its entry point on the workspace's top edge, then a straight
// drop to the buried endpoint behind the workspace. The visible curve never changes with
// the endpoint depth, so the untangled entry order holds at every size.
function heroRoutePath(item, items, routeTargetY = HERO_ROUTE_TARGET_Y) {
  const gate = heroInputTarget(item, items);
  const control = heroRouteControl(item, gate);
  return `M ${item.x} ${item.y} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${gate.x.toFixed(1)} ${gate.y} L ${gate.x.toFixed(1)} ${routeTargetY}`;
}

function heroReturnPath(item, items, routeTargetY = HERO_ROUTE_TARGET_Y) {
  const gate = heroInputTarget(item, items);
  const control = heroRouteControl(item, gate);
  return `M ${gate.x.toFixed(1)} ${routeTargetY} L ${gate.x.toFixed(1)} ${gate.y} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${item.x} ${item.y}`;
}

function heroRouteMapMarkup(items, routeTargetY = HERO_ROUTE_TARGET_Y) {
  return `<svg class="hero-route-map" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">${items.map((item) => {
    const compactHidden = item.compact ? '' : ' hero-route--compact-hidden';
    return `<path class="hero-route${compactHidden}" data-hero-route="${item.id}" pathLength="1" d="${heroRoutePath(item, items, routeTargetY)}"></path><path class="hero-route-charge${compactHidden}" data-hero-charge="${item.id}" pathLength="1" d="${heroReturnPath(item, items, routeTargetY)}"></path><circle class="hero-route-light${compactHidden}" data-hero-light="${item.id}" r="3" cx="${item.x}" cy="${item.y}"></circle>`;
  }).join('')}</svg>`;
}

function heroSignalMarkup(item) {
  const compact = item.compact ? ' hero-signal-card--compact' : '';
  const style = `--signal-x:${(item.x / 12).toFixed(3)}%;--signal-y:${(item.y / 7).toFixed(3)}%;--signal-opacity:1;--signal-scale:.72`;
  return `<div class="hero-signal-card${compact}" data-hero-signal="${item.id}" style="${style}">${connectorMarkMarkup(item.icon)}<span class="hero-signal-card__label">${item.label}</span></div>`;
}

export function createHeroMotionMarkup(items = HERO_MOTION_ITEMS, layout = 'spread') {
  const placed = new Map(heroItemsForLayout(layout, items).map((item) => [item.id, item]));
  const positioned = items.map((item) => placed.get(item.id) ?? item);
  return `<div class="hero-motion__field" data-hero-layout="${layout}" aria-hidden="true">
    <div class="hero-stars">${heroStarsMarkup()}</div>
    ${heroRouteMapMarkup(positioned)}
    <div class="hero-signal-field">${positioned.map(heroSignalMarkup).join('')}</div>
    <div class="hero-output" data-hero-output>
      <div class="hero-output__paper"><span class="hero-output__preview"></span><span class="hero-output__line hero-output__line--one"></span><span class="hero-output__line hero-output__line--two"></span><span class="hero-output__approved">Ready</span></div>
    </div>
    <div class="hero-workspace" data-hero-workspace>
      <div class="hero-workspace__face hero-workspace__face--front logo-stamp">${LOGO_STAMP_MARK}</div>
      <div class="hero-workspace__face hero-workspace__face--back logo-stamp">${LOGO_STAMP_MARK}</div>
    </div>
  </div>`;
}

export const HERO_ROUTE_REST_OPACITY = .1;

function bump(time, start, end) {
  if (time <= start || time >= end) return 0;
  return Math.sin(Math.PI * (time - start) / (end - start));
}

export function getHeroSequenceState(elapsedMs, items = HERO_MOTION_ITEMS, routeTargetY = HERO_ROUTE_TARGET_Y) {
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  const time = elapsed % HERO_SEQUENCE_MS;
  const phase = time < 3600 ? 'intake' : time < 4700 ? 'spin' : time < 8000 ? 'output' : 'settle';
  const returning = time >= 2600 && time < 3600;
  const restaged = time >= 8300;
  const drawn = elapsed >= 2400;

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
      // Routes draw once, then stay as faint lines; each intake and return lifts them briefly.
      routeProgress: drawn ? 1 : clampUnit(travel * 1.08),
      routeOpacity: HERO_ROUTE_REST_OPACITY + .14 * bump(time, 600, 2600) + .08 * bump(time, 2600, 3500),
    };
  });

  const lights = items.map((item) => {
    const inputProgress = clampUnit((time - 600) / 1800);
    const inputTravel = easeInOutCubic(inputProgress);
    const lightTravel = Math.min(1, inputTravel + .08);
    // Lights run the visible curve, then the hidden drop to the buried endpoint.
    const gate = heroInputTarget(item, items);
    const point = lightTravel < .9
      ? heroRoutePoint(item, lightTravel / .9, gate)
      : { x: gate.x, y: gate.y + (routeTargetY - gate.y) * (lightTravel - .9) / .1 };
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
  const charges = items.map((item) => {
    const launchedAt = 2600;
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
  canvas.innerHTML = createHeroMotionMarkup(HERO_MOTION_ITEMS, heroLayoutForWidth(window.innerWidth));
  figure.classList.add('hero-motion--enhanced');
  const signalElements = new Map([...canvas.querySelectorAll('[data-hero-signal]')].map((element) => [element.dataset.heroSignal, element]));
  const routeElements = new Map([...canvas.querySelectorAll('[data-hero-route]')].map((element) => [element.dataset.heroRoute, element]));
  const lightElements = new Map([...canvas.querySelectorAll('[data-hero-light]')].map((element) => [element.dataset.heroLight, element]));
  const chargeElements = new Map([...canvas.querySelectorAll('[data-hero-charge]')].map((element) => [element.dataset.heroCharge, element]));
  const field = canvas.querySelector('.hero-motion__field');
  const workspace = canvas.querySelector('[data-hero-workspace]');
  const output = canvas.querySelector('[data-hero-output]');
  let routeTargetY = HERO_ROUTE_TARGET_Y;
  let layoutItems = HERO_MOTION_ITEMS;
  // Cards, routes, lights and charges all read the same layout coordinates, so every
  // visible route starts at its own card at every width.
  const heroCopy = document.querySelector('.hero-copy');
  const header = document.querySelector('.site-header');
  // The copy's text extent in stage pixels, ignoring its reveal slide-in.
  const measureCopy = (stageBounds) => {
    const slide = heroCopy ? new DOMMatrixReadOnly(getComputedStyle(heroCopy).transform === 'none' ? undefined : getComputedStyle(heroCopy).transform).m42 : 0;
    const rects = [...(heroCopy?.children ?? [])].map((child) => {
      const range = document.createRange();
      range.selectNodeContents(child);
      return range.getBoundingClientRect();
    }).filter((rect) => rect.width > 0);
    if (!rects.length) return null;
    return {
      left: Math.min(...rects.map((r) => r.left)) - stageBounds.left,
      right: Math.max(...rects.map((r) => r.right)) - stageBounds.left,
      top: Math.min(...rects.map((r) => r.top)) - slide - stageBounds.top,
      bottom: Math.max(...rects.map((r) => r.bottom)) - slide - stageBounds.top,
    };
  };
  const updateRouteGeometry = () => {
    const layout = heroLayoutForWidth(window.innerWidth);
    if (field) field.dataset.heroLayout = layout;
    const stageBounds = canvas.getBoundingClientRect();
    const workspaceBounds = workspace?.getBoundingClientRect();
    const copy = layout === 'squeezed' ? null : measureCopy(stageBounds);
    layoutItems = copy && workspaceBounds
      ? planHeroSpread({
        width: stageBounds.width,
        height: stageBounds.height,
        copy,
        box: { left: workspaceBounds.left - stageBounds.left, right: workspaceBounds.right - stageBounds.left, top: workspaceBounds.top - stageBounds.top, bottom: workspaceBounds.bottom - stageBounds.top },
        safeTop: (header?.getBoundingClientRect().bottom ?? 0) - stageBounds.top + 10,
      })
      : heroItemsForLayout('squeezed');
    const placed = new Set(layoutItems.map(({ id }) => id));
    for (const [id, element] of signalElements) element.style.display = placed.has(id) ? '' : 'none';
    for (const [id, element] of routeElements) element.style.display = placed.has(id) ? '' : 'none';
    for (const [id, element] of chargeElements) element.style.display = placed.has(id) ? '' : 'none';
    for (const [id, element] of lightElements) element.style.display = placed.has(id) ? '' : 'none';
    routeTargetY = calculateHeroRouteTargetY({
      stageHeight: stageBounds.height,
      workspaceOffsetY: workspaceBounds ? workspaceBounds.top - stageBounds.top : undefined,
      workspaceHeight: workspaceBounds?.height,
    });
    for (const item of layoutItems) {
      routeElements.get(item.id)?.setAttribute('d', heroRoutePath(item, layoutItems, routeTargetY));
      chargeElements.get(item.id)?.setAttribute('d', heroReturnPath(item, layoutItems, routeTargetY));
    }
  };
  updateRouteGeometry();
  window.addEventListener('resize', updateRouteGeometry, { passive: true });
  const startedAt = performance.now();
  // Review aid, like ?motion=: ?frame=2700 holds the loop at 2.7 seconds for screenshots.
  const frameParam = new URLSearchParams(window.location.search).get('frame');
  const heldFrame = frameParam !== null && Number.isFinite(Number(frameParam)) ? Number(frameParam) : null;
  const render = (now) => {
    const state = getHeroSequenceState(heldFrame ?? now - startedAt, layoutItems, routeTargetY);
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
