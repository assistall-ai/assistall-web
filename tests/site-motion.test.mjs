import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  FILE_MARKS,
  HERO_MOTION_ITEMS,
  HERO_SQUEEZED_MAX_WIDTH,
  HERO_ROUTE_REST_OPACITY,
  planHeroSpread,
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

  assert.equal((markup.match(/class="logo-stamp__mark"/g) ?? []).length, 2, 'both workspace faces carry the drawn mark');
  assert.match(siteModule.LOGO_STAMP_MARK, /<rect x="112" y="142" width="189" height="49" rx="14" fill="#F4EFE4"\/><rect x="112" y="232" width="239" height="49" rx="14" fill="#C8A25D"\/><rect x="112" y="322" width="289" height="49" rx="14" fill="#F4EFE4"\/>/, 'the stamp reproduces the official mark geometry');
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
  assert.match(pageCss, /\.hero-motion__field\[data-hero-layout="squeezed"\] \.hero-signal-card:not\(\.hero-signal-card--compact\),\s*\.hero-motion__field\[data-hero-layout="squeezed"\] \.hero-route--compact-hidden \{ display: none; \}/, 'narrower layouts must suppress cards and paths outside the compact source set');
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
// Page geometry in stage pixels, modelled from brand.css and page.css for a viewport.
function modelHero(viewWidth, viewHeight) {
  const gutter = Math.min(48, Math.max(20, viewWidth * .04));
  const wrapLeft = (viewWidth - Math.min(viewWidth - gutter * 2, 1296)) / 2;
  const stageOffset = Math.min(80, Math.max(56, viewWidth * .06));
  const height = Math.max(Math.min(900, viewHeight), 76 + 64 + 470 + 80);
  const copyTop = 140 + Math.max(0, (height - 220 - 520) / 2);
  const boxWidth = Math.min(132, Math.max(82, viewWidth * .11));
  return {
    width: viewWidth,
    height,
    copy: { left: wrapLeft, right: wrapLeft + Math.min(650, viewWidth * .58), top: copyTop - stageOffset, bottom: copyTop + 520 - stageOffset },
    box: { left: viewWidth * .725 - boxWidth / 2, right: viewWidth * .725 + boxWidth / 2, top: height * .394, bottom: height * .394 + boxWidth },
    safeTop: 76 - stageOffset + 10,
  };
}
const VIEWPORTS = [[1920, 1080], [1440, 900], [1366, 768], [1280, 720], [1024, 768], [900, 1000], [821, 900]];

test('hero chooses its source layout from the viewport width', () => {
  assert.equal(heroLayoutForWidth(360), 'squeezed');
  assert.equal(heroLayoutForWidth(HERO_SQUEEZED_MAX_WIDTH), 'squeezed');
  assert.equal(heroLayoutForWidth(HERO_SQUEEZED_MAX_WIDTH + 1), 'spread');
  assert.equal(heroLayoutForWidth(1920), 'spread');
  assert.deepEqual(heroItemsForLayout('squeezed').map(({ id }) => id), ['email', 'docx', 'xlsx', 'csv', 'voice', 'folder', 'txt', 'pdf'], 'phones keep all eight compact sources');
  const markup = createHeroMotionMarkup(HERO_MOTION_ITEMS, 'squeezed');
  assert.match(markup, /data-hero-layout="squeezed"/);
  assert.match(markup, /data-hero-signal="docx" style="--signal-x:31\.667%;--signal-y:6\.429%/, 'cards are painted at their layout position before the first frame');
});

test('the squeezed rows keep sources apart, below the header and clear of the workspace', () => {
  const items = heroItemsForLayout('squeezed');
  for (const item of items) {
    assert.ok(Math.hypot(item.x - 870, item.y - 276) >= 180, `${item.id} must stay clear of the workspace`);
    assert.ok(item.y <= 270, `${item.id} keeps the lower hero for the document`);
  }
  for (const width of [360, 390, 820]) {
    const rects = cardRects(items, width, 900);
    for (const a of rects) for (const b of rects) if (a.id < b.id) assert.ok(!overlaps(a, b), `${width}px: ${a.id} and ${b.id} must not touch`);
    for (const rect of rects) assert.ok(rect.top + 40 >= 68, `${width}px: ${rect.id} must sit below the fixed header`);
  }
});

test('measured spread fills the free space evenly without touching the copy, workspace or document path', () => {
  for (const [viewWidth, viewHeight] of VIEWPORTS) {
    const page = modelHero(viewWidth, viewHeight);
    const items = planHeroSpread(page);
    const label = `${viewWidth}x${viewHeight}`;
    assert.ok(items.length >= siteModule.heroSourceTarget(viewWidth), `${label}: at least ${siteModule.heroSourceTarget(viewWidth)} sources`);
    assert.ok(items.length >= 8, `${label}: never fewer than eight sources`);
    assert.equal(new Set(items.map(({ id }) => id)).size, items.length, `${label}: each source once`);
    const px = items.map((item) => ({ id: item.id, x: item.x / 1200 * page.width, y: item.y / 700 * page.height }));
    const boxCentre = (page.box.left + page.box.right) / 2;
    for (const card of px) {
      const left = card.x - 37;
      const right = card.x + 37;
      const top = card.y - 13;
      const bottom = card.y + 13;
      assert.ok(!(right > page.copy.left && left < page.copy.right && bottom > page.copy.top && top < page.copy.bottom), `${label}: ${card.id} must not touch the copy`);
      assert.ok(bottom <= page.box.bottom + 1, `${label}: ${card.id} keeps the lower hero for the document`);
      assert.ok(!(Math.abs(card.x - boxCentre) < (page.box.right - page.box.left) / 2 + 37 && bottom > page.box.top - 40), `${label}: ${card.id} must not sit in the document column`);
      assert.ok(top >= page.safeTop - 1 && right <= page.width - 20, `${label}: ${card.id} stays on screen below the header`);
    }
    for (const a of px) for (const b of px) {
      if (a.id < b.id) assert.ok(Math.abs(a.x - b.x) >= 100 || Math.abs(a.y - b.y) >= 42, `${label}: ${a.id} and ${b.id} must not touch`);
      // Large screens get generous room: at least a card's width, or two card heights, between neighbours.
      if (a.id < b.id && viewWidth >= 1440) assert.ok(Math.abs(a.x - b.x) >= 130 || Math.abs(a.y - b.y) >= 56, `${label}: ${a.id} and ${b.id} need more space`);
    }
    const xs = px.map(({ x }) => x);
    assert.ok(Math.max(...xs) - Math.min(...xs) >= page.width * .5, `${label}: sources spread across the screen, not one side`);
    if (page.copy.top - page.safeTop > 60) assert.ok(px.some(({ x }) => x < page.copy.right), `${label}: the strip above the copy is used`);
  }
});

test('hero routes stay as faint lines after the light passes', () => {
  assert.equal(siteModule.getHeroSequenceState(0).inputs[0].routeProgress, 0, 'routes are not drawn before the first intake');
  for (const time of [3800, 6000, 9000, 11800 + 200, 11800 * 3 + 5000]) {
    const state = siteModule.getHeroSequenceState(time);
    assert.ok(state.inputs.every(({ routeProgress }) => routeProgress === 1), `routes remain drawn at ${time}ms`);
    assert.ok(state.inputs.every(({ routeOpacity }) => routeOpacity >= HERO_ROUTE_REST_OPACITY - 1e-9), `routes remain visible at ${time}ms`);
  }
  const levels = Array.from({ length: 118 }, (_, step) => siteModule.getHeroSequenceState(step * 100).inputs[0].routeOpacity);
  assert.ok(Math.max(...levels) <= .3, 'route lines stay translucent even at their brightest');
  assert.ok(siteModule.getHeroSequenceState(9000).inputs[0].routeOpacity <= HERO_ROUTE_REST_OPACITY + 1e-9, 'lines settle to the faint resting level');
  assert.match(pageCss, /\.hero-route-map path \{[^}]*stroke-width: 1;/, 'routes are hairlines, not cables');
});

test('the static fallback spreads its chips in the strip above the copy and keeps the phone frame calm', () => {
  const chips = [...pageHtml.matchAll(/<span class="fallback-signal" style="([^"]+)">([^<]+)<\/span>/g)];
  assert.equal(chips.length, 5);
  for (const [, style, label] of chips) {
    const vars = Object.fromEntries(style.split(';').map((pair) => pair.split(':')));
    const x = parseFloat(vars['--x']);
    const y = parseFloat(vars['--y']);
    assert.ok(y <= 5 || x >= 85, `${label}: desktop chips sit above the copy or at the far right`);
    if (vars['--squeezed-display'] !== 'none') assert.ok(parseFloat(vars['--squeezed-y']) <= 6.5, `${label}: the phone still frame only uses the row above the headline`);
  }
  assert.match(pageCss, /\.hero-motion__fallback-stamp \{ position: absolute; left: 72\.5%; top: 39\.428571%;/, 'the still logo sits where the animated workspace sits');
  assert.match(pageHtml, /<span class="logo-stamp hero-motion__fallback-stamp"><svg class="logo-stamp__mark"/, 'the still frame uses the same embossed stamp');
});

test('the workspace is a quiet tile rather than a framed badge', () => {
  const markup = createHeroMotionMarkup();
  assert.doesNotMatch(markup, /hero-workspace__edge/);
  assert.doesNotMatch(pageCss, /hero-workspace__edge|linear-gradient\(135deg, #24585a/);
  assert.match(pageCss, /\.hero-workspace \{[^}]*aspect-ratio: 1;/, 'the tile matches the square logo');
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

function visibleSegments(curve, width, height) {
  const points = [];
  for (let step = 0; step <= 80; step += 1) {
    const t = step / 80;
    const x = (1 - t) ** 2 * curve.from.x + 2 * t * (1 - t) * curve.control.x + t * t * curve.to.x;
    const y = (1 - t) ** 2 * curve.from.y + 2 * t * (1 - t) * curve.control.y + t * t * curve.to.y;
    if (y < 275.5) points.push({ x: x / 1200 * width, y: y / 700 * height });
  }
  return points.slice(1).map((point, index) => [points[index], point]);
}
function segmentsIntersect([a, b], [c, d]) {
  const side = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}
function routeCrossings(items, width, height) {
  const routes = siteModule.heroRouteCurves(items).map((curve) => ({ id: curve.id, segments: visibleSegments(curve, width, height) }));
  const found = [];
  for (let i = 0; i < routes.length; i += 1) {
    for (let j = i + 1; j < routes.length; j += 1) {
      if (routes[i].segments.some((s) => routes[j].segments.some((t) => segmentsIntersect(s, t)))) found.push(`${routes[i].id}/${routes[j].id}`);
    }
  }
  return found;
}

test('visible hero routes never cross one another', () => {
  for (const [viewWidth, viewHeight] of VIEWPORTS) {
    const page = modelHero(viewWidth, viewHeight);
    assert.deepEqual(routeCrossings(planHeroSpread(page), page.width, page.height), [], `${viewWidth}x${viewHeight}: routes must not cross`);
  }
  for (const width of [360, 390, 820]) {
    assert.deepEqual(routeCrossings(heroItemsForLayout('squeezed'), width, 900), [], `phone ${width}px: routes must not cross`);
  }
  for (const curve of siteModule.heroRouteCurves(planHeroSpread(modelHero(1440, 900)))) {
    assert.equal(curve.control.x, curve.to.x, `${curve.id}: arrives straight down into its own entry point`);
    assert.ok(curve.from.y < curve.to.y, `${curve.id}: starts above the workspace top`);
  }
});
