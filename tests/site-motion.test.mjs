import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  FILE_MARKS,
  HERO_MOTION_ITEMS,
  HERO_SQUEEZED_MAX_WIDTH,
  HERO_WIDE_MIN_WIDTH,
  heroItemsForLayout,
  heroLayoutForWidth,
  calculateHeroRouteTargetY,
  calculateScrollDuration,
  createHeroMotionMarkup,
  easeInOutCubic,
  getTargetScrollTop,
  WORKFLOW_ROTATION_MS,
} from '../assets/site.js';
import * as siteModule from '../assets/site.js';

const pageCss = await readFile(new URL('../assets/page.css', import.meta.url), 'utf8');
const brandCss = await readFile(new URL('../assets/brand.css', import.meta.url), 'utf8');
const siteScript = await readFile(new URL('../assets/site.js', import.meta.url), 'utf8');
const captureScript = await readFile(new URL('../tools/capture_workflow_media.py', import.meta.url), 'utf8');
const pageHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('section glide duration stays deliberate without becoming slow', () => {
  assert.equal(calculateScrollDuration(0), 700);
  assert.equal(calculateScrollDuration(600), 700);
  assert.equal(calculateScrollDuration(1200), 960);
  assert.equal(calculateScrollDuration(4000), 1400);
});

test('section glide target stays below the sticky header', () => {
  assert.equal(getTargetScrollTop(900, 84), 800);
  assert.equal(getTargetScrollTop(40, 84), 0);
});

test('section glide easing begins and ends exactly at its anchors', () => {
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(1), 1);
  assert.ok(easeInOutCubic(0.5) > 0.49 && easeInOutCubic(0.5) < 0.51);
});

test('hero motion uses the approved set of real work inputs and matching marks', () => {
  assert.equal(HERO_MOTION_ITEMS.length, 14);
  assert.deepEqual(
    HERO_MOTION_ITEMS.map(({ label }) => label),
    ['ZOHO', 'odoo', 'WhatsApp', 'Email', 'DOCX', 'XLSX', 'CSV', 'Voice', 'Folder', 'TXT', 'PDF', 'PPTX', 'JPG', 'JSON'],
  );
  assert.deepEqual(
    HERO_MOTION_ITEMS.map(({ icon }) => icon),
    ['zoho', 'odoo', 'whatsapp', 'gmail', 'word', 'excel', 'csv', 'voice', 'folder', 'txt', 'pdf', 'powerpoint', 'image', 'json'],
  );
  assert.deepEqual(HERO_MOTION_ITEMS.filter(({ compact }) => compact).map(({ id }) => id), ['email', 'docx', 'xlsx', 'csv', 'voice', 'folder', 'txt', 'pdf'], 'the squeezed layout must retain eight readable sources');
  assert.equal(HERO_MOTION_ITEMS.filter(({ wordmark }) => wordmark).length, 0);
  const markup = createHeroMotionMarkup();
  assert.match(markup, /--signal-opacity:1;--signal-scale:\.72/, 'source cards should be painted before the first animation frame');
  assert.equal((markup.match(/hero-signal-card--compact/g) ?? []).length, 8, 'the responsive source set must be explicit in the animation markup');
  assert.equal((markup.match(/hero-route--compact-hidden/g) ?? []).length, 18, 'only the six omitted sources may lose their intake, return, and light routes');
});

test('hero source icons form an ordered five-zone upper and side perimeter', () => {
  const xSpread = Math.max(...HERO_MOTION_ITEMS.map(({ x }) => x)) - Math.min(...HERO_MOTION_ITEMS.map(({ x }) => x));
  const ySpread = Math.max(...HERO_MOTION_ITEMS.map(({ y }) => y)) - Math.min(...HERO_MOTION_ITEMS.map(({ y }) => y));
  assert.ok(xSpread >= 600, 'sources must span the full usable perimeter');
  assert.ok(ySpread >= 220, 'sources must use both the top and side space');
  assert.ok(HERO_MOTION_ITEMS.every(({ x, y }) => y <= 40 || x >= 640), 'sources left of the workspace column stay in the strip above the copy');
  assert.ok(HERO_MOTION_ITEMS.every(({ y }) => y <= 270), 'the lower hero space remains reserved for the output document');
  const zoneCounts = [
    HERO_MOTION_ITEMS.filter(({ x }) => x <= 540).length,
    HERO_MOTION_ITEMS.filter(({ x, y }) => x > 540 && x < 700 && y <= 270).length,
    HERO_MOTION_ITEMS.filter(({ x, y }) => x >= 770 && x <= 1050 && y <= 20).length,
    HERO_MOTION_ITEMS.filter(({ x, y }) => x >= 1080 && y <= 160).length,
    HERO_MOTION_ITEMS.filter(({ x, y }) => x >= 1060 && y >= 260).length,
  ];
  assert.deepEqual(zoneCounts, [3, 3, 3, 3, 2], 'source cards must occupy balanced, readable perimeter zones');
  const workspace = { x: 870, y: 276 };
  for (const item of HERO_MOTION_ITEMS.filter(({ id }) => ['jpg', 'json', 'pptx', 'pdf'].includes(id))) {
    assert.ok(Math.hypot(item.x - workspace.x, item.y - workspace.y) >= 180, `${item.id} must stay clear of the workspace`);
  }
  for (const item of HERO_MOTION_ITEMS) {
    for (const other of HERO_MOTION_ITEMS) {
      if (item.id === other.id) continue;
      assert.ok(Math.hypot(item.x - other.x, item.y - other.y) >= 115, `${item.id} and ${other.id} must not bunch together`);
    }
  }
});

test('hero route endpoint stays within the rendered workspace on squeezed screens', () => {
  const squeezed = calculateHeroRouteTargetY({ stageHeight: 780, workspaceOffsetY: 307, workspaceHeight: 72 });
  const wide = calculateHeroRouteTargetY({ stageHeight: 780, workspaceOffsetY: 307, workspaceHeight: 116 });
  const squeezedTop = 307 / 780 * 700;
  const squeezedBottom = (307 + 72) / 780 * 700;
  assert.ok(squeezed > squeezedTop && squeezed < squeezedBottom, 'squeezed-screen endpoint must remain inside the workspace bounds');
  assert.ok(wide > squeezed, 'a wider workspace can safely carry the endpoint deeper without exposing it below');
});

test('hero motion keeps routes and moving parts inside one stable DOM field', () => {
  const markup = createHeroMotionMarkup();

  assert.match(markup, /assets\/android-chrome-512x512\.png/);
  assert.equal((markup.match(/<div class="hero-signal-card/g) ?? []).length, HERO_MOTION_ITEMS.length);
  assert.match(markup, /<svg class="hero-route-map"[^>]*viewBox="0 0 1200 700"/);
  assert.equal((markup.match(/data-hero-route=/g) ?? []).length, HERO_MOTION_ITEMS.length);
  assert.equal((markup.match(/data-hero-light=/g) ?? []).length, HERO_MOTION_ITEMS.length);
  assert.equal((markup.match(/data-hero-charge=/g) ?? []).length, HERO_MOTION_ITEMS.length);
  assert.equal((markup.match(/data-hero-route=[^>]+d="[^"]+ 340"/g) ?? []).length, HERO_MOTION_ITEMS.length, 'each intake route must terminate well inside the workspace instead of ending above it');
  assert.equal((markup.match(/data-connector-mark=/g) ?? []).length, HERO_MOTION_ITEMS.length);
  assert.equal((markup.match(/connector-mark__svg/g) ?? []).length, HERO_MOTION_ITEMS.length);
  assert.equal((markup.match(/hero-signal-card__label/g) ?? []).length, HERO_MOTION_ITEMS.length, 'every source must pair its monochrome logo with a readable name');
  assert.doesNotMatch(markup, /text-anchor="middle"/, 'hero document marks must not render oversized SVG text when their names already appear beside the icon');
  assert.match(markup, /class="hero-motion__field"/);
  assert.match(markup, /class="hero-output" data-hero-output/);
  assert.match(markup, /class="hero-workspace" data-hero-workspace/);
  assert.doesNotMatch(markup, /<use|<animateMotion|hero-output-shell|hero-workspace-shell/);
  assert.doesNotMatch(siteScript, /hero-route-line|hero-signal-intake|hero-workspace-turn/);
  assert.match(pageCss, /\.hero-route-map path/);
  assert.match(pageCss, /\.hero-route-charge/);
  assert.match(pageCss, /rotateY\(/);
  assert.match(pageCss, /backface-visibility: hidden/);
  assert.match(pageCss, /\.hero-motion \{ z-index: 2; \}/, 'hero signals must remain visible above the dark film while staying behind copy');
  assert.match(pageCss, /\.hero-motion__stage \{[^}]*translateY\(/, 'the animation field must sit lower than the header crop');
  assert.match(pageCss, /\.hero-motion__field:not\(\[data-hero-layout="wide"\]\) \.hero-signal-card:not\(\.hero-signal-card--compact\),\s*\.hero-motion__field:not\(\[data-hero-layout="wide"\]\) \.hero-route--compact-hidden \{ display: none; \}/, 'narrower layouts must suppress cards and paths outside the compact source set');
  assert.doesNotMatch(pageCss, /\.hero-signal-card--compact \{ top:/, 'cards must not be offset away from the routes that start at them');
  assert.doesNotMatch(pageCss + siteScript, /mobile-hidden|mobileHidden/, 'every compact source stays visible on phones');
  assert.match(pageCss, /\.hero__film \{ z-index: 1;/);
  assert.match(brandCss, /html:not\(\[data-motion-preview="on"\]\) \*/);
  assert.match(pageCss, /\.hero-output__paper[^}]*0 0 64px/);
  assert.doesNotMatch(pageCss, /\.fallback-signal--(?:four|five) \{ bottom:/, 'the static fallback must reserve the lower hero area for the output document');
  assert.match(pageHtml, /data-connector-mark="odoo"/);
  assert.ok((pageHtml.match(/connector-mark__svg/g) ?? []).length >= 12, 'connections must use inline monochrome SVG marks rather than approximated text or CSS shapes');
  assert.match(pageHtml, /<script type="module" src="assets\/site\.js\?v=[^"]+"><\/script>/, 'the motion module must remain a complete script element');
  assert.doesNotMatch(pageHtml, /connector-icons\.svg/);
});

test('hero sequence sends every input through the workspace top gate before its Y-axis spin', () => {
  assert.equal(typeof siteModule.getHeroSequenceState, 'function');

  const intake = siteModule.getHeroSequenceState(900);
  assert.equal(intake.phase, 'intake');
  assert.equal(intake.workspace.rotationY, 0);
  assert.equal(intake.inputs.length, HERO_MOTION_ITEMS.length);
  assert.ok(intake.inputs.every(({ y }) => y < 276), 'icons must begin above the workspace top edge');

  const preloaded = siteModule.getHeroSequenceState(0);
  assert.ok(preloaded.inputs.every(({ opacity }) => opacity === 1), 'source icons must be visible from the first frame');
  assert.deepEqual(preloaded.inputs.map(({ x, y }) => ({ x, y })), HERO_MOTION_ITEMS.map(({ x, y }) => ({ x, y })), 'preloaded sources must hold their perimeter positions before intake');

  const restaged = siteModule.getHeroSequenceState(9000);
  assert.ok(restaged.inputs.every(({ opacity }) => opacity === 1), 'sources must reappear during the resting portion of the loop');
  assert.deepEqual(restaged.inputs.map(({ x, y }) => ({ x, y })), HERO_MOTION_ITEMS.map(({ x, y }) => ({ x, y })), 'restaged sources must return to their perimeter positions');

  const glidingInputs = siteModule.getHeroSequenceState(1500).inputs.filter(({ routeProgress, opacity }) => routeProgress > 0 && opacity > 0);
  assert.equal(glidingInputs.length, HERO_MOTION_ITEMS.length, 'all inputs must enter together');
  assert.ok(glidingInputs.every(({ y }) => y < 276), 'icons must remain above the workspace until they enter it');

  const earlyIntake = siteModule.getHeroSequenceState(1150).inputs;
  const horizontalSpread = Math.max(...earlyIntake.map(({ x }) => x)) - Math.min(...earlyIntake.map(({ x }) => x));
  assert.ok(horizontalSpread > 480);
  assert.ok(earlyIntake.filter(({ y }) => y < 125).length >= 3, 'the composition needs a visible top row of inputs');

  const finalIntake = siteModule.getHeroSequenceState(2300);
  assert.ok(finalIntake.inputs.some(({ opacity }) => opacity > 0), 'the inputs must finish before lights can return');
  assert.ok(finalIntake.lights.every(({ direction }) => direction !== 'return'), 'return lights must wait until the full intake is clear');

  const nearGate = siteModule.getHeroSequenceState(2000);
  assert.ok(nearGate.lights.every(({ opacity }) => opacity === 0), 'arrival dots must already be hidden behind the workspace before its top edge');

  const buriedEndpoints = siteModule.getHeroSequenceState(2300).lights;
  assert.ok(buriedEndpoints.every(({ y }) => y === 340), 'arrival lights must finish deep enough inside the workspace to be fully occluded');

  const cleared = siteModule.getHeroSequenceState(2800);
  assert.ok(cleared.inputs.every(({ x, y, opacity }) => x >= 836 && x <= 904 && y === 276 && opacity === 0), 'every input must clear through the workspace top gate');
  assert.ok(cleared.lights.every(({ opacity }) => opacity === 0), 'arrival lights must disappear behind the workspace before the return');
  const activeReturnCharges = cleared.charges.filter(({ opacity }) => opacity > 0);
  assert.equal(activeReturnCharges.length, HERO_MOTION_ITEMS.length, 'every circuit charge must leave the workspace together');
  assert.ok(activeReturnCharges.every(({ progress }) => Math.abs(progress - activeReturnCharges[0].progress) < 0.0001), 'simultaneous return charges must share the same position along their paths');
  const laterReturn = siteModule.getHeroSequenceState(2900);
  const chargeTravel = activeReturnCharges.map(({ id, progress }) => laterReturn.charges.find((charge) => charge.id === id).progress - progress);
  assert.ok(chargeTravel.every((distance) => Math.abs(distance - chargeTravel[0]) < 0.0001), 'active return charges must share one travel speed');
  assert.ok(chargeTravel[0] < .2, 'the return current must travel more deliberately than a burst');

  const spin = siteModule.getHeroSequenceState(4150);
  assert.equal(spin.phase, 'spin');
  assert.ok(spin.workspace.rotationY > 0 && spin.workspace.rotationY < 360);
  assert.equal(spin.document.opacity, 0);

  const output = siteModule.getHeroSequenceState(6200);
  assert.equal(output.phase, 'output');
  assert.equal(output.workspace.rotationY, 360);
  assert.ok(output.document.opacity > 0);
  assert.ok(output.document.translateY > -55);
});

test('workflow evidence gives source viewers time to be understood before advancing', () => {
  const video = { defaultPlaybackRate: 1, playbackRate: 1 };
  assert.equal(typeof siteModule.setWorkflowPlaybackRate, 'function');
  siteModule.setWorkflowPlaybackRate(video);
  assert.equal(video.defaultPlaybackRate, 0.65);
  assert.equal(video.playbackRate, 0.65);
  assert.equal(WORKFLOW_ROTATION_MS, 11000);
  assert.match(captureScript, /WORKFLOW_VIEWER_ACTIONS/);
});

test('workflow labels use the professional fictional capture records', () => {
  assert.match(pageHtml, /Northstar Supplies Framework Agreement/);
  assert.match(pageHtml, /NSC-4427/);
  assert.match(pageHtml, /Daily Sales Report/);
  assert.doesNotMatch(pageHtml, /Demo Trading|SHP-2048|daily_sales\.xlsx/);
});

test('motion preview and reduced motion explicitly control workflow movement', () => {
  assert.match(siteScript, /data-motion-preview/);
  assert.match(pageCss, /@keyframes workflow-current/);
  assert.match(pageCss, /prefers-reduced-motion: reduce[\s\S]*workflow-current/);
  assert.match(pageCss, /data-motion-preview="off"[\s\S]*workflow-current/);
});

test('workflow rotation keeps pointer and focus pauses independent', () => {
  assert.match(siteScript, /let pointerPaused = false;/);
  assert.match(siteScript, /let focusPaused = false;/);
  assert.match(siteScript, /interactionPaused: pointerPaused \|\| focusPaused/);
});

// Card footprint at the .72 opening scale, plus a small breathing gap, in CSS pixels.
const CARD = { width: 70, height: 24, gap: 6 };
function cardRects(items, width, height) {
  return items.map((item) => ({ id: item.id, left: item.x / 1200 * width - CARD.width / 2, top: item.y / 700 * height - CARD.height / 2 }));
}
function overlaps(a, b) {
  return a.left < b.left + CARD.width + CARD.gap && b.left < a.left + CARD.width + CARD.gap
    && a.top < b.top + CARD.height + CARD.gap && b.top < a.top + CARD.height + CARD.gap;
}

test('hero chooses its source layout from the viewport width', () => {
  assert.equal(heroLayoutForWidth(360), 'squeezed');
  assert.equal(heroLayoutForWidth(HERO_SQUEEZED_MAX_WIDTH), 'squeezed');
  assert.equal(heroLayoutForWidth(HERO_SQUEEZED_MAX_WIDTH + 1), 'mid');
  assert.equal(heroLayoutForWidth(HERO_WIDE_MIN_WIDTH - 1), 'mid');
  assert.equal(heroLayoutForWidth(HERO_WIDE_MIN_WIDTH), 'wide');
  assert.equal(heroItemsForLayout('wide').length, 14);
  for (const layout of ['mid', 'squeezed']) {
    assert.deepEqual(heroItemsForLayout(layout).map(({ id }) => id), ['email', 'docx', 'xlsx', 'csv', 'voice', 'folder', 'txt', 'pdf'], `${layout} keeps all eight compact sources`);
  }
  const markup = createHeroMotionMarkup(HERO_MOTION_ITEMS, 'squeezed');
  assert.match(markup, /data-hero-layout="squeezed"/);
  assert.match(markup, /data-hero-signal="docx" style="--signal-x:31\.667%;--signal-y:6\.429%/, 'cards are painted at their layout position before the first frame');
});

test('every hero layout keeps sources apart, above the document and clear of the workspace', () => {
  const cases = [['wide', [1340, 1440, 1920], 900], ['mid', [821, 1024, 1339], 900], ['squeezed', [360, 390, 820], 900]];
  for (const [layout, widths, height] of cases) {
    const items = heroItemsForLayout(layout);
    for (const item of items) {
      assert.ok(Math.hypot(item.x - 870, item.y - 276) >= 180, `${layout}: ${item.id} must stay clear of the workspace`);
      assert.ok(item.y <= 270, `${layout}: ${item.id} keeps the lower hero for the document`);
    }
    for (const width of widths) {
      const rects = cardRects(items, width, height);
      for (const a of rects) for (const b of rects) {
        if (a.id < b.id) assert.ok(!overlaps(a, b), `${layout} at ${width}px: ${a.id} and ${b.id} must not touch`);
      }
    }
  }
});

test('the mid layout stays right of the copy column and the squeezed top row clears the header', () => {
  for (const width of [821, 1024, 1060, 1200, 1339]) {
    const gutter = Math.min(48, Math.max(20, width * .04));
    const wrapLeft = (width - Math.min(width - gutter * 2, 1296)) / 2;
    const copyRight = wrapLeft + Math.min(680, width * .58);
    for (const rect of cardRects(heroItemsForLayout('mid'), width, 900)) {
      assert.ok(rect.left >= copyRight, `mid at ${width}px: ${rect.id} must not enter the copy column`);
    }
  }
  const headerBottom = 68;
  const stageOffset = 40;
  for (const rect of cardRects(heroItemsForLayout('squeezed'), 390, 900)) {
    assert.ok(rect.top + stageOffset >= headerBottom, `squeezed: ${rect.id} must sit below the fixed header`);
  }
});

test('the static fallback mirrors the animated layout positions', () => {
  const chips = [...pageHtml.matchAll(/<span class="fallback-signal" style="([^"]+)">([^<]+)<\/span>/g)];
  assert.equal(chips.length, 5);
  const pct = (value, total) => `${Number((value / total * 100).toFixed(3))}%`;
  for (const [, style, label] of chips) {
    const vars = Object.fromEntries(style.split(';').map((pair) => pair.split(':')));
    const item = HERO_MOTION_ITEMS.find((entry) => entry.label === label);
    assert.ok(item?.compact, `${label} must be a compact source`);
    assert.equal(vars['--wide-x'], pct(item.x, 1200));
    assert.equal(vars['--wide-y'], pct(item.y, 700));
    assert.equal(vars['--mid-x'], pct(item.compact.mid.x, 1200));
    assert.equal(vars['--mid-y'], pct(item.compact.mid.y, 700));
    if (vars['--squeezed-display'] !== 'none') {
      assert.equal(vars['--squeezed-x'], pct(item.compact.squeezed.x, 1200));
      assert.equal(vars['--squeezed-y'], pct(item.compact.squeezed.y, 700));
      assert.ok(item.compact.squeezed.y <= 45, `${label}: the phone still frame only uses the row above the headline`);
    }
  }
  assert.match(pageCss, /\.hero-motion__fallback img \{ position: absolute; left: 72\.5%; top: 39\.428571%;/, 'the still logo sits where the animated workspace sits');
});

test('file formats use distinct drawn marks, not lettered text or one generic page', () => {
  const formats = ['word', 'excel', 'powerpoint', 'pdf', 'csv', 'txt', 'json'];
  const drawn = formats.map((format) => FILE_MARKS[format]);
  assert.equal(new Set(drawn).size, formats.length);
  for (const mark of drawn) {
    assert.doesNotMatch(mark, /<text/);
    assert.match(mark, /stroke="currentColor"/);
    assert.doesNotMatch(mark, /#[0-9a-f]{3,6}/i, 'marks stay monochrome');
  }
  const formatRow = pageHtml.slice(pageHtml.indexOf('connector-card__formats'), pageHtml.indexOf('prepared-outputs'));
  assert.doesNotMatch(formatRow, /<text/, 'the Connections format row uses the same drawn marks');
  for (const format of ['pdf', 'word', 'excel', 'csv']) assert.ok(formatRow.includes(FILE_MARKS[format]), `${format} mark matches the hero`);
});
