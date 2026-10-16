const MIN_SCROLL_DURATION = 700;
const MAX_SCROLL_DURATION = 1400;
const SCROLL_SPEED = 0.8;
const SECTION_GAP = 16;
export const HERO_SEQUENCE_MS = 11800;

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
  { id: 'email', icon: 'gmail', label: 'Email', x: 660, y: 30, compact: { squeezed: { x: 260, y: 165 } } },
  { id: 'docx', icon: 'word', label: 'DOCX', x: 785, y: 10, compact: { squeezed: { x: 380, y: 45 } } },
  { id: 'xlsx', icon: 'excel', label: 'XLSX', x: 915, y: 10, compact: { squeezed: { x: 640, y: 45 } } },
  { id: 'csv', icon: 'csv', label: 'CSV', x: 1045, y: 10, compact: { squeezed: { x: 900, y: 45 } } },
  { id: 'voice', icon: 'voice', label: 'Voice', x: 1170, y: 20, compact: { squeezed: { x: 560, y: 150 } } },
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
const HERO_CARD = Object.freeze({ width: 74, height: 26 });
// Gaps between cards, widest first. Each screen uses the widest gap that still fits its
// minimum number of sources, so large screens get generous space and tablets keep eight.
const HERO_GAPS = Object.freeze([[110, 48], [90, 42], [72, 36], [56, 30], [42, 24], [30, 20]]);
export function heroSourceTarget(width) {
  if (width >= 1280) return 14;
  return width >= 1024 ? 12 : 10;
}
const HERO_SEEDS = Object.freeze([20261016, 4127, 90210, 2718, 31337, 1618, 8128, 6174, 1729, 4096, 7919, 2026]);
const HERO_PRIORITY = ['email', 'docx', 'xlsx', 'csv', 'voice', 'folder', 'txt', 'pdf', 'whatsapp', 'odoo', 'zoho', 'jpg', 'pptx', 'json'];
const HERO_SPREAD_ORDER = ['zoho', 'email', 'docx', 'whatsapp', 'odoo', 'xlsx', 'pdf', 'voice', 'csv', 'jpg', 'folder', 'pptx', 'txt', 'json'];

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// Tries the widest gap first and a few uneven lattices per gap; keeps only layouts whose
// routes do not cross, and returns the first that meets the screen's target (else the fullest).
export function planHeroSpread(page = {}) {
  const { items = HERO_MOTION_ITEMS, minItems = heroSourceTarget(page.width) } = page;
  const boxUnits = {
    left: page.box.left / page.width * 1200,
    right: page.box.right / page.width * 1200,
    top: page.box.top / page.height * 700,
    bottom: page.box.bottom / page.height * 700,
  };
  const target = Math.min(minItems, items.length);
  const fallbacks = [];
  for (const [gapX, gapY] of HERO_GAPS) {
    for (const seed of HERO_SEEDS) {
      const spread = spreadWithGap({ ...page, items, gapX, gapY, seed });
      // Only spreads big enough to meet the target are worth untangling on the first pass.
      if (spread.length < target) {
        fallbacks.push(spread);
        continue;
      }
      const placed = untangleSpread(spread, boxUnits);
      if (placed.length >= target) return placed;
      fallbacks.push(placed);
    }
  }
  // Nothing met the target: untangle the largest spreads and keep the fullest clean one.
  let best = [];
  for (const spread of fallbacks.sort((a, b) => b.length - a.length)) {
    if (spread.length <= best.length) break;
    const placed = untangleSpread(spread, boxUnits);
    if (placed.length > best.length) best = placed;
  }
  return best;
}

// Drops the source involved in the most crossings until no routes cross.
function untangleSpread(placed, box) {
  let current = placed;
  for (;;) {
    const curves = [...heroRoutes(current, box).values()];
    const tally = new Map();
    for (let a = 0; a < curves.length; a += 1) {
      for (let b = a + 1; b < curves.length; b += 1) {
        if (curvesCross(curves[a], curves[b])) {
          tally.set(a, (tally.get(a) ?? 0) + 1);
          tally.set(b, (tally.get(b) ?? 0) + 1);
        }
      }
    }
    if (!tally.size) return current;
    const [worst] = [...tally.entries()].sort((x, y) => y[1] - x[1])[0];
    const ids = [...heroRoutes(current, box).keys()];
    current = current.filter((item) => item.id !== ids[worst]);
  }
}

function spreadWithGap({ width, height, copy, box, safeTop = 12, items, maxItems = 14, gapX, gapY, seed = HERO_SEEDS[0] }) {
  const { width: cardW, height: cardH } = HERO_CARD;
  const halfW = cardW / 2;
  const halfH = cardH / 2;
  const right = width - 28 - halfW;
  const top = safeTop + halfH;
  const stripBottom = copy.top - 20 - halfH;
  const boxCentre = (box.left + box.right) / 2;
  const boxMiddle = (box.top + box.bottom) / 2;
  // Sources sit above and beside the workspace, down to the middle of its sides and no lower.
  const zones = [{ left: copy.right + 40 + halfW, right, top, bottom: boxMiddle }];
  if (stripBottom >= top) zones.unshift({ left: copy.left + halfW, right, top, bottom: stripBottom });

  const clear = (x, y) => {
    const hitsCopy = x + halfW > copy.left - 16 && x - halfW < copy.right + 32 && y + halfH > copy.top - 16 && y - halfH < copy.bottom + 16;
    const gapX = Math.max(box.left - (x + halfW), (x - halfW) - box.right, 0);
    const gapY = Math.max(box.top - (y + halfH), (y - halfH) - box.bottom, 0);
    const nearWorkspace = Math.hypot(gapX, gapY) < 48;
    return !hitsCopy && !nearWorkspace;
  };

  const random = seededRandom(seed);
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
    && distanceToPath(a, b) >= cardW * .45 && distanceToPath(b, a) >= cardW * .45;
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

// The Assistall mark drawn as vectors (geometry measured from android-chrome-512x512.png),
// so the workspace can carry it as a raised, embossed stamp. index.html's still frame repeats it.
export const LOGO_STAMP_MARK = '<svg class="logo-stamp__mark" viewBox="0 0 512 512" aria-hidden="true" focusable="false"><rect x="112" y="142" width="189" height="49" rx="14" fill="#F4EFE4"/><rect x="112" y="232" width="239" height="49" rx="14" fill="#C8A25D"/><rect x="112" y="322" width="289" height="49" rx="14" fill="#F4EFE4"/><path d="M128 148h157M128 238h207M128 328h257" stroke="#FFFDF8" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/></svg>';

// Source marks, all monochrome in currentColor. Gmail, WhatsApp, Odoo, Zoho and JSON use their
// official logos (Simple Icons, CC0). Microsoft Word, Excel, PowerPoint and Adobe PDF logos are
// not used (their owners withdrew them from icon libraries), so those formats, CSV and TXT get
// precise page marks with a cut-out glyph. The same marks appear in index.html's Connections cards.
export const FILE_MARKS = Object.freeze({
  "word": "<path fill-rule=\"evenodd\" d=\"M6.5 2h7.4v4.1a1.5 1.5 0 0 0 1.5 1.5h4.1v12.9A1.5 1.5 0 0 1 18 22H6.5A1.5 1.5 0 0 1 5 20.5v-17A1.5 1.5 0 0 1 6.5 2zM7.6 11H9.1L10.05 15.1L11.3 11H12.7L13.95 15.1L14.9 11H16.4L14.65 17.5H13.25L12 13.5L10.75 17.5H9.35Z\"/><path d=\"M15.2 2.4 19.1 6.3h-3.2a.7.7 0 0 1-.7-.7z\" opacity=\".6\"/>",
  "excel": "<path fill-rule=\"evenodd\" d=\"M6.5 2h7.4v4.1a1.5 1.5 0 0 0 1.5 1.5h4.1v12.9A1.5 1.5 0 0 1 18 22H6.5A1.5 1.5 0 0 1 5 20.5v-17A1.5 1.5 0 0 1 6.5 2zM8 11H9.8L12 13.55L14.2 11H16L12.9 14.25L16 17.5H14.2L12 14.95L9.8 17.5H8L11.1 14.25Z\"/><path d=\"M15.2 2.4 19.1 6.3h-3.2a.7.7 0 0 1-.7-.7z\" opacity=\".6\"/>",
  "powerpoint": "<path fill-rule=\"evenodd\" d=\"M6.5 2h7.4v4.1a1.5 1.5 0 0 0 1.5 1.5h4.1v12.9A1.5 1.5 0 0 1 18 22H6.5A1.5 1.5 0 0 1 5 20.5v-17A1.5 1.5 0 0 1 6.5 2zM8.9 11H12.4A2.45 2.45 0 0 1 12.4 15.9H10.5V17.5H8.9ZM10.5 12.45V14.45H12.3A1 1 0 0 0 12.3 12.45Z\"/><path d=\"M15.2 2.4 19.1 6.3h-3.2a.7.7 0 0 1-.7-.7z\" opacity=\".6\"/>",
  "pdf": "<path fill-rule=\"evenodd\" d=\"M6.5 2h7.4v4.1a1.5 1.5 0 0 0 1.5 1.5h4.1v12.9A1.5 1.5 0 0 1 18 22H6.5A1.5 1.5 0 0 1 5 20.5v-17A1.5 1.5 0 0 1 6.5 2zM7.5 9.6H14.5V10.8H7.5ZM7.2 12.6H17.3A.9.9 0 0 1 18.2 13.5V17.1A.9.9 0 0 1 17.3 18H7.2A.9.9 0 0 1 6.3 17.1V13.5A.9.9 0 0 1 7.2 12.6Z\"/><path d=\"M15.2 2.4 19.1 6.3h-3.2a.7.7 0 0 1-.7-.7z\" opacity=\".6\"/>",
  "csv": "<path fill-rule=\"evenodd\" d=\"M6.5 2h7.4v4.1a1.5 1.5 0 0 0 1.5 1.5h4.1v12.9A1.5 1.5 0 0 1 18 22H6.5A1.5 1.5 0 0 1 5 20.5v-17A1.5 1.5 0 0 1 6.5 2zM7.5 11H9.9V12.8H7.5ZM10.9 11H13.3V12.8H10.9ZM14.3 11H16.7V12.8H14.3ZM7.5 13.8H9.9V15.6H7.5ZM10.9 13.8H13.3V15.6H10.9ZM14.3 13.8H16.7V15.6H14.3ZM7.5 16.6H9.9V18.4H7.5ZM10.9 16.6H13.3V18.4H10.9ZM14.3 16.6H16.7V18.4H14.3Z\"/><path d=\"M15.2 2.4 19.1 6.3h-3.2a.7.7 0 0 1-.7-.7z\" opacity=\".6\"/>",
  "txt": "<path fill-rule=\"evenodd\" d=\"M6.5 2h7.4v4.1a1.5 1.5 0 0 0 1.5 1.5h4.1v12.9A1.5 1.5 0 0 1 18 22H6.5A1.5 1.5 0 0 1 5 20.5v-17A1.5 1.5 0 0 1 6.5 2zM7.5 11H16.8V12.4H7.5ZM7.5 14H16.8V15.4H7.5ZM7.5 17H13.5V18.4H7.5Z\"/><path d=\"M15.2 2.4 19.1 6.3h-3.2a.7.7 0 0 1-.7-.7z\" opacity=\".6\"/>",
  "json": "<path d=\"M12.043 23.968c.479-.004.953-.029 1.426-.094a11.805 11.805 0 003.146-.863 12.404 12.404 0 003.793-2.542 11.977 11.977 0 002.44-3.427 11.794 11.794 0 001.02-3.476c.149-1.16.135-2.346-.045-3.499a11.96 11.96 0 00-.793-2.788 11.197 11.197 0 00-.854-1.617c-1.168-1.837-2.861-3.314-4.81-4.3a12.835 12.835 0 00-2.172-.87h-.005c.119.063.24.132.345.201.12.074.239.146.351.225a8.93 8.93 0 011.559 1.33c1.063 1.145 1.797 2.548 2.218 4.041.284.982.434 1.998.495 3.017.044.743.044 1.491-.047 2.229-.149 1.27-.554 2.51-1.228 3.596a7.475 7.475 0 01-1.903 2.084c-1.244.928-2.877 1.482-4.436 1.114a3.916 3.916 0 01-.748-.258 4.692 4.692 0 01-.779-.45 6.08 6.08 0 01-1.244-1.105 6.507 6.507 0 01-1.049-1.747 7.366 7.366 0 01-.494-2.54c-.03-1.273.225-2.553.854-3.67a6.43 6.43 0 011.663-1.918c.225-.178.464-.333.704-.479l.016-.007a5.121 5.121 0 00-1.441-.12 4.963 4.963 0 00-1.228.24c-.359.12-.704.27-1.019.45a6.146 6.146 0 00-.733.494c-.211.18-.42.36-.615.555-1.123 1.153-1.768 2.682-2.022 4.256-.15.973-.15 1.96-.091 2.95.105 1.395.391 2.787.945 4.062a8.518 8.518 0 001.348 2.173 8.14 8.14 0 003.132 2.23 7.934 7.934 0 002.113.54c.074.015.149.015.209.015zm-2.934-.398a4.102 4.102 0 01-.45-.228 8.5 8.5 0 01-2.038-1.534c-1.094-1.137-1.827-2.566-2.247-4.08a15.184 15.184 0 01-.495-3.172 12.14 12.14 0 01.046-2.082c.135-1.257.495-2.501 1.124-3.58a6.889 6.889 0 011.783-2.053 6.23 6.23 0 011.633-.9 5.363 5.363 0 013.522-.045c.029 0 .029 0 .045.03.015.015.045.015.06.03.045.016.104.045.165.074.239.12.479.271.704.42a6.294 6.294 0 012.097 2.502c.42.914.615 1.934.631 2.938.014 1.079-.18 2.157-.645 3.146a6.42 6.42 0 01-2.638 2.832c.09.03.18.045.271.075.225.044.449.074.688.074 1.468.045 2.892-.66 3.94-1.647.195-.18.375-.375.54-.585.225-.27.435-.54.614-.823.239-.375.435-.75.614-1.154a8.112 8.112 0 00.509-1.664c.196-1.004.211-2.022.149-3.026-.135-2.022-.673-4.045-1.842-5.724a9.054 9.054 0 00-.555-.719 9.868 9.868 0 00-1.063-1.034 8.477 8.477 0 00-1.363-.915 9.927 9.927 0 00-1.692-.598l-.3-.06c-.209-.03-.42-.044-.634-.06a8.453 8.453 0 00-1.015.016c-.704.045-1.412.16-2.112.337C5.799 1.227 2.863 3.566 1.3 6.67A11.834 11.834 0 00.238 9.801a11.81 11.81 0 00-.104 3.775c.12 1.02.374 2.023.778 2.977.227.57.511 1.124.825 1.648 1.094 1.783 2.683 3.236 4.51 4.24.688.39 1.408.69 2.157.944.226.074.45.15.689.21z\"/>",
});

export const SOURCE_MARKS = Object.freeze({
  "microsoft": "<path d=\"M2 2h9v9H2zm11 0h9v9h-9zM2 13h9v9H2zm11 0h9v9h-9z\"/>",
  "gmail": "<path d=\"M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z\"/>",
  "whatsapp": "<path d=\"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z\"/>",
  "odoo": "<path d=\"M21.1002 15.7957c-1.6015 0-2.8997-1.2983-2.8997-2.8998s1.2983-2.8997 2.8997-2.8997c1.6015 0 2.8998 1.2982 2.8998 2.8997 0 1.5999-1.2979 2.8998-2.8998 2.8998zm0-1.2c.9388.0006 1.7003-.7601 1.7008-1.6989.0004-.9388-.7602-1.7003-1.699-1.7007h-.0018c-.9388.0004-1.6994.7619-1.699 1.7007.0005.9381.761 1.6985 1.699 1.699zm-6.0655 1.2c-1.6014 0-2.8997-1.2983-2.8997-2.8998s1.2983-2.8997 2.8997-2.8997c1.6015 0 2.8998 1.2982 2.8998 2.8997 0 1.5999-1.2999 2.8998-2.8998 2.8998zm0-1.2c.9389.0006 1.7003-.7601 1.7008-1.6989.0005-.9388-.7602-1.7003-1.699-1.7007h-.0018c-.9388.0004-1.6994.7619-1.699 1.7007.0005.9381.761 1.6985 1.699 1.699zM11.865 12.858c0 1.6199-1.2979 2.9378-2.8977 2.9378s-2.8998-1.314-2.8998-2.9358 1.1799-2.8597 2.8998-2.8597c.6359 0 1.2239.134 1.6998.484v-1.68a.6.6 0 0 1 1.2 0v4.0537h-.002zm-2.8977 1.7399c.9388.0005 1.7002-.7602 1.7007-1.699.0005-.9388-.7602-1.7003-1.699-1.7007h-.0017c-.9389.0004-1.6995.7619-1.699 1.7007.0004.9381.7608 1.6985 1.699 1.699zm-6.0675 1.1979C1.2983 15.7957 0 14.4974 0 12.8959s1.2983-2.8997 2.8998-2.8997 2.8997 1.2982 2.8997 2.8997c0 1.5999-1.2999 2.8998-2.8997 2.8998zm0-1.2c.9388.0006 1.7002-.7601 1.7007-1.699.0005-.9387-.7602-1.7002-1.699-1.7006h-.0017c-.9388.0004-1.6995.7619-1.699 1.7007.0004.9381.7608 1.6985 1.699 1.699z\"/>",
  "zoho": "<path d=\"M8.66 6.897a1.299 1.299 0 0 0-1.205.765l-.642 1.44-.062-.385A1.291 1.291 0 0 0 5.27 7.648l-4.185.678A1.291 1.291 0 0 0 .016 9.807l.678 4.18a1.293 1.293 0 0 0 1.27 1.087c.074 0 .143-.01.216-.017l4.18-.678c.436-.07.784-.351.96-.723l2.933 1.307a1.304 1.304 0 0 0 .988.026c.321-.12.575-.365.716-.678l.28-.629.038.276a1.297 1.297 0 0 0 1.455 1.103l3.712-.501a1.29 1.29 0 0 0 1.03.514h4.236c.713 0 1.29-.58 1.291-1.291V9.545c0-.712-.58-1.291-1.291-1.291h-4.236c-.079 0-.155.008-.23.022a1.309 1.309 0 0 0-.275-.288c-.275-.21-.614-.3-.958-.253l-4.197.571c-.155.021-.3.07-.432.14L9.159 7.01a1.27 1.27 0 0 0-.499-.113zm-.025.705c.077 0 .159.013.24.052l2.971 1.324c-.128.238-.18.508-.142.782l.357 2.596h.002l-.745 1.672a.59.59 0 0 1-.777.296l-3.107-1.385-.004-.041-.41-2.526L8.1 7.95a.589.589 0 0 1 .536-.348zm-3.159.733c.125 0 .245.039.343.112.13.09.21.227.237.382l.234 1.446-.56 1.259a1.27 1.27 0 0 0-.026.987c.12.322.364.575.678.717l.295.131a.585.585 0 0 1-.428.314l-4.185.678a.59.59 0 0 1-.674-.485l-.678-4.18a.588.588 0 0 1 .485-.674l4.185-.678c.03-.004.064-.01.094-.01zm11.705.09a.59.59 0 0 1 .415.173 1.287 1.287 0 0 0-.416.947v4.237c0 .033.003.065.005.097l-3.55.482a.586.586 0 0 1-.66-.502l-.191-1.403.899-2.017a1.29 1.29 0 0 0-.333-1.5l3.754-.51c.026-.004.051-.004.077-.004zm1.3.532h4.227c.326 0 .588.266.588.588v4.237a.589.589 0 0 1-.588.588h-4.237a.564.564 0 0 1-.12-.013c.47-.246.758-.765.684-1.318zm-5.988.309.254.113c.296.133.43.48.296.777l-.432.97-.207-1.465a.58.58 0 0 1 .09-.395zm5.39.538.453 3.325a.583.583 0 0 1-.453.65zM6.496 11.545l.17 1.052a.588.588 0 0 1-.293-.776zm3.985 4.344a.588.588 0 0 0-.612.603c0 .358.244.61.601.61a.582.582 0 0 0 .607-.608c0-.35-.242-.605-.596-.605zm5.545 0a.588.588 0 0 0-.612.603c0 .358.245.61.602.61a.582.582 0 0 0 .606-.608c0-.35-.24-.605-.596-.605zm-8.537.018a.047.047 0 0 0-.048.047v.085c0 .026.021.047.048.047h.52l-.623.9a.052.052 0 0 0-.009.027v.027c0 .026.021.047.048.047h.815a.047.047 0 0 0 .047-.047v-.085a.047.047 0 0 0-.047-.047h-.55l.606-.9a.05.05 0 0 0 .008-.026v-.028a.047.047 0 0 0-.047-.047zm5.303 0a.047.047 0 0 0-.047.047v1.086c0 .026.02.047.047.047h.135a.047.047 0 0 0 .047-.047v-.454h.545v.454c0 .026.02.047.047.047h.134a.047.047 0 0 0 .047-.047v-1.086a.047.047 0 0 0-.047-.047h-.134a.047.047 0 0 0-.047.047v.453h-.545v-.453a.047.047 0 0 0-.047-.047zm-2.324.164c.25 0 .372.194.372.425 0 .219-.109.425-.358.426-.242 0-.375-.197-.375-.419 0-.235.108-.432.36-.432zm5.545 0c.25 0 .372.194.372.425 0 .219-.108.425-.358.426-.242 0-.374-.197-.374-.419 0-.235.108-.432.36-.432z\"/>",
  "folder": "<path fill-rule=\"evenodd\" d=\"M3.5 4.5H9.2L11.2 6.5H20.5A1.5 1.5 0 0 1 22 8V18.5A1.5 1.5 0 0 1 20.5 20H3.5A1.5 1.5 0 0 1 2 18.5V6A1.5 1.5 0 0 1 3.5 4.5ZM2 8.9H22V10.1H2Z\"/>",
  "calendar": "<path fill-rule=\"evenodd\" d=\"M7 2H8.6V4H15.4V2H17V4H19.5A1.5 1.5 0 0 1 21 5.5V20.5A1.5 1.5 0 0 1 19.5 22H4.5A1.5 1.5 0 0 1 3 20.5V5.5A1.5 1.5 0 0 1 4.5 4H7ZM4.6 9V20.4H19.4V9ZM6.5 11H9V13.5H6.5ZM10.75 11H13.25V13.5H10.75ZM15 11H17.5V13.5H15ZM6.5 15.5H9V18H6.5ZM10.75 15.5H13.25V18H10.75Z\"/>",
  "voice": "<path d=\"M12 2.5A3.5 3.5 0 0 1 15.5 6V11.5A3.5 3.5 0 0 1 8.5 11.5V6A3.5 3.5 0 0 1 12 2.5Z\"/><path d=\"M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v4M8.5 21.5h7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\"/>",
  "image": "<path fill-rule=\"evenodd\" d=\"M4 3.5H20A1.5 1.5 0 0 1 21.5 5V19A1.5 1.5 0 0 1 20 20.5H4A1.5 1.5 0 0 1 2.5 19V5A1.5 1.5 0 0 1 4 3.5ZM4.5 5.5V16.6L9 12.1L12.2 15.3L15 12.5L19.5 17V5.5ZM8 7.2A1.6 1.6 0 1 0 8 10.4A1.6 1.6 0 1 0 8 7.2Z\"/>",
});

export function sourceMarkSvg(icon) {
  return FILE_MARKS[icon] ?? SOURCE_MARKS[icon] ?? '';
}

function connectorMarkMarkup(icon) {
  const path = SOURCE_MARKS[icon];
  const mark = FILE_MARKS[icon] ?? path ?? '';
  return `<span class="connector-mark" data-connector-mark="${icon}"><svg class="connector-mark__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${mark}</svg></span>`;
}

function clampUnit(value) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(progress) {
  return 1 - (1 - clampUnit(progress)) ** 3;
}

// Every route enters through the workspace's top edge. Sources beside the workspace rise a
// little, arc over and drop in; sources above glide across and drop in. Entry points are
// handed out in the order the sources sit around the workspace, and any crossing pair is
// untangled, so lines fan in side by side without crossing or cutting over the box.
// Values are stage units; the box is the workspace's resting rectangle.
const HERO_DEFAULT_BOX = Object.freeze({ left: 815, right: 925, top: 276, bottom: 378.7 });
let heroBox = HERO_DEFAULT_BOX;

const HERO_APPROACH = 42;

function heroTopEdge(box) {
  const corner = (box.right - box.left) * .2;
  return { left: box.left + corner, width: Math.max(0, box.right - box.left - corner * 2), y: box.top };
}

function entryPoint(edge, rank, count) {
  return { x: edge.left + edge.width * (rank + .5) / Math.max(1, count), y: edge.y, normal: { x: 0, y: -1 } };
}

// A rise-then-drop curve: it leaves the source heading up (or across, for sources already
// above the approach height), crosses over, and arrives straight down into its entry point.
function curveTo(source, entry) {
  const apex = entry.y - HERO_APPROACH;
  const lift = source.y > apex ? apex - 10 : source.y;
  return {
    from: { x: source.x, y: source.y },
    c1: { x: source.x + (entry.x - source.x) * .28, y: lift },
    c2: { x: entry.x, y: apex },
    to: { x: entry.x, y: entry.y },
    normal: entry.normal,
  };
}

export function heroCurvePoint(curve, progress) {
  const t = clampUnit(progress);
  const u = 1 - t;
  return {
    x: u ** 3 * curve.from.x + 3 * u * u * t * curve.c1.x + 3 * u * t * t * curve.c2.x + t ** 3 * curve.to.x,
    y: u ** 3 * curve.from.y + 3 * u * u * t * curve.c1.y + 3 * u * t * t * curve.c2.y + t ** 3 * curve.to.y,
  };
}
const curvePoint = heroCurvePoint;

function curveSegments(curve) {
  const points = Array.from({ length: 21 }, (_, step) => curvePoint(curve, step / 20));
  return points.slice(1).map((point, index) => [points[index], point]);
}

function segmentsCross([a, b], [c, d]) {
  const side = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}

function curveBounds(curve) {
  const xs = [curve.from.x, curve.c1.x, curve.c2.x, curve.to.x];
  const ys = [curve.from.y, curve.c1.y, curve.c2.y, curve.to.y];
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

function curvesCross(first, second) {
  const p = curveBounds(first);
  const q = curveBounds(second);
  if (p.right < q.left || q.right < p.left || p.bottom < q.top || q.bottom < p.top) return false;
  const a = curveSegments(first);
  const b = curveSegments(second);
  return a.some((segment) => b.some((other) => segmentsCross(segment, other)));
}

const routeCache = new WeakMap();
function heroRoutes(items, box = heroBox) {
  const cached = routeCache.get(items);
  if (cached?.box === box) return cached.routes;
  const edge = heroTopEdge(box);
  const count = items.length;
  const entry = (rank) => entryPoint(edge, rank, count);
  const centre = { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
  const angle = ({ x, y }) => Math.atan2(y - centre.y, x - centre.x);
  const order = [...items].sort((first, second) => angle(first) - angle(second) || first.x - second.x);
  // Pairwise first: which of two neighbouring entry points each source needs to stay clear of the other.
  const middle = Math.max(0, Math.floor(count / 2) - 1);
  const left = entryPoint(edge, middle, count);
  const right = entryPoint(edge, middle + 1, count);
  order.sort((first, second) => {
    const firstLeft = curvesCross(curveTo(first, left), curveTo(second, right));
    const secondLeft = curvesCross(curveTo(second, left), curveTo(first, right));
    if (firstLeft !== secondLeft) return firstLeft ? 1 : -1;
    return angle(first) - angle(second) || first.x - second.x;
  });
  // Then untangle anything left at the real entry points by moving routes past each other.
  for (let pass = 0; pass < count * count; pass += 1) {
    let moved = false;
    for (let a = 0; a < count - 1 && !moved; a += 1) {
      for (let b = a + 1; b < count && !moved; b += 1) {
        if (curvesCross(curveTo(order[a], entry(a)), curveTo(order[b], entry(b)))) {
          order.splice(a, 0, order.splice(b, 1)[0]);
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  const routes = new Map(order.map((item, rank) => [item.id, curveTo(item, entry(rank))]));
  routeCache.set(items, { box, routes });
  return routes;
}

// Each route's curve, for checks: source, two control points, entry point and the edge's outward normal.
export function heroRouteCurves(items = HERO_MOTION_ITEMS, box = heroBox) {
  const routes = heroRoutes(items, box);
  return items.map((item) => ({ id: item.id, ...routes.get(item.id) }));
}

export function heroDefaultBox() {
  return HERO_DEFAULT_BOX;
}

// Lines end a few units under the workspace's edge so the join hides beneath its border.
function tucked(curve) {
  return { x: curve.to.x - curve.normal.x * 3, y: curve.to.y - curve.normal.y * 3 };
}

const fixed = (point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;

function heroRoutePath(item, items) {
  const curve = heroRoutes(items).get(item.id);
  return `M ${fixed(curve.from)} C ${fixed(curve.c1)} ${fixed(curve.c2)} ${fixed(tucked(curve))}`;
}

function heroReturnPath(item, items) {
  const curve = heroRoutes(items).get(item.id);
  return `M ${fixed(tucked(curve))} C ${fixed(curve.c2)} ${fixed(curve.c1)} ${fixed(curve.from)}`;
}

function heroRouteMapMarkup(items) {
  return `<svg class="hero-route-map" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">${items.map((item) => {
    const compactHidden = item.compact ? '' : ' hero-route--compact-hidden';
    return `<path class="hero-route${compactHidden}" data-hero-route="${item.id}" pathLength="1" d="${heroRoutePath(item, items)}"></path><path class="hero-route-charge${compactHidden}" data-hero-charge="${item.id}" pathLength="1" d="${heroReturnPath(item, items)}"></path><circle class="hero-route-light${compactHidden}" data-hero-light="${item.id}" r="3" cx="${item.x}" cy="${item.y}"></circle>`;
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

export const HERO_ROUTE_REST_OPACITY = .06;

function bump(time, start, end) {
  if (time <= start || time >= end) return 0;
  return Math.sin(Math.PI * (time - start) / (end - start));
}

export function getHeroSequenceState(elapsedMs, items = HERO_MOTION_ITEMS, box = heroBox) {
  const routes = heroRoutes(items, box);
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  const time = elapsed % HERO_SEQUENCE_MS;
  const phase = time < 3600 ? 'intake' : time < 4700 ? 'spin' : time < 8000 ? 'output' : 'settle';
  const returning = time >= 2600 && time < 3600;
  const restaged = time >= 8300;
  const drawn = elapsed >= 2400;

  const inputs = items.map((item) => {
    const progress = restaged ? 0 : clampUnit((time - 600) / 1800);
    const travel = easeInOutCubic(progress);
    const point = curvePoint(routes.get(item.id), travel);
    const fadeOut = 1 - clampUnit((progress - .86) / .14);
    const opacity = restaged ? 1 : fadeOut;
    return {
      id: item.id,
      x: point.x,
      y: point.y,
      opacity,
      // Cards compact as they converge on the workspace, keeping their separate
      // source positions legible without turning the intake into a stack.
      scale: (.72 - .48 * travel) * opacity,
      // Routes draw once, then stay as faint lines; each intake and return lifts them briefly.
      routeProgress: drawn ? 1 : clampUnit(travel * 1.08),
      routeOpacity: HERO_ROUTE_REST_OPACITY + .08 * bump(time, 600, 2600) + .05 * bump(time, 2600, 3500),
    };
  });

  const lights = items.map((item) => {
    const inputProgress = clampUnit((time - 600) / 1800);
    const inputTravel = easeInOutCubic(inputProgress);
    const lightTravel = Math.min(1, inputTravel + .08);
    const point = curvePoint(routes.get(item.id), lightTravel);
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
  // Review aid: with ?frame= the hero is a held still, so it appears without its fade-in.
  if (new URLSearchParams(window.location.search).has('frame')) canvas.style.transition = 'none';
  canvas.innerHTML = createHeroMotionMarkup(HERO_MOTION_ITEMS, heroLayoutForWidth(window.innerWidth));
  figure.classList.add('hero-motion--enhanced');
  const signalElements = new Map([...canvas.querySelectorAll('[data-hero-signal]')].map((element) => [element.dataset.heroSignal, element]));
  const routeElements = new Map([...canvas.querySelectorAll('[data-hero-route]')].map((element) => [element.dataset.heroRoute, element]));
  const lightElements = new Map([...canvas.querySelectorAll('[data-hero-light]')].map((element) => [element.dataset.heroLight, element]));
  const chargeElements = new Map([...canvas.querySelectorAll('[data-hero-charge]')].map((element) => [element.dataset.heroCharge, element]));
  const field = canvas.querySelector('.hero-motion__field');
  const workspace = canvas.querySelector('[data-hero-workspace]');
  const output = canvas.querySelector('[data-hero-output]');
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
    // The workspace's layout box, unaffected by its spin (it is centred by translateX(-50%)).
    const boxPx = workspace ? {
      left: workspace.offsetLeft - workspace.offsetWidth / 2,
      right: workspace.offsetLeft + workspace.offsetWidth / 2,
      top: workspace.offsetTop,
      bottom: workspace.offsetTop + workspace.offsetHeight,
    } : null;
    if (boxPx && stageBounds.width > 0 && stageBounds.height > 0) {
      const toX = (value) => value / stageBounds.width * 1200;
      const toY = (value) => value / stageBounds.height * 700;
      heroBox = { left: toX(boxPx.left), right: toX(boxPx.right), top: toY(boxPx.top), bottom: toY(boxPx.bottom) };
    }
    const copy = layout === 'squeezed' ? null : measureCopy(stageBounds);
    layoutItems = copy && boxPx
      ? planHeroSpread({
        width: stageBounds.width,
        height: stageBounds.height,
        copy,
        box: boxPx,
        // Leave a clear band below the header, and never place cards above the field's own top edge.
        safeTop: Math.max(10, (header?.getBoundingClientRect().bottom ?? 0) - stageBounds.top + 24),
      })
      : heroItemsForLayout('squeezed');
    const placed = new Set(layoutItems.map(({ id }) => id));
    for (const [id, element] of signalElements) element.style.display = placed.has(id) ? '' : 'none';
    for (const [id, element] of routeElements) element.style.display = placed.has(id) ? '' : 'none';
    for (const [id, element] of chargeElements) element.style.display = placed.has(id) ? '' : 'none';
    for (const [id, element] of lightElements) element.style.display = placed.has(id) ? '' : 'none';
    for (const item of layoutItems) {
      routeElements.get(item.id)?.setAttribute('d', heroRoutePath(item, layoutItems));
      chargeElements.get(item.id)?.setAttribute('d', heroReturnPath(item, layoutItems));
    }
  };
  updateRouteGeometry();
  // Re-plan once resizing settles, not on every resize event.
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(updateRouteGeometry, 160);
  }, { passive: true });
  const startedAt = performance.now();
  // Review aid, like ?motion=: ?frame=2700 holds the loop at 2.7 seconds for screenshots.
  const frameParam = new URLSearchParams(window.location.search).get('frame');
  const heldFrame = frameParam !== null && Number.isFinite(Number(frameParam)) ? Number(frameParam) : null;
  const render = (now) => {
    const state = getHeroSequenceState(heldFrame ?? now - startedAt, layoutItems);
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
