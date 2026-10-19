import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  HERO_SIGNAL_LOOP_MS,
  HERO_SIGNAL_SIDES,
  calculateScrollDuration,
  easeInOutCubic,
  getTargetScrollTop,
  heroHubAnchor,
  heroSignalSchedule,
  heroSignalState,
  planHeroSignals,
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

// The hero hub sits right of the copy on wide screens and below it on phones; these are the
// pixel layouts site.js measures, rounded from the real page at each width.
const HERO_LAYOUTS = [
  { name: '1440 desktop', width: 1440, height: 900, hub: { x: 1066, y: 488, size: 115 }, avoid: [{ left: 44, right: 780, top: 230, bottom: 760 }], top: 88 },
  { name: '1920 desktop', width: 1920, height: 900, hub: { x: 1421, y: 488, size: 120 }, avoid: [{ left: 284, right: 1020, top: 220, bottom: 770 }], top: 88 },
  { name: '1024 laptop', width: 1024, height: 768, hub: { x: 809, y: 422, size: 84 }, avoid: [{ left: 13, right: 622, top: 200, bottom: 680 }], top: 88 },
  { name: '390 phone', width: 390, height: 960, hub: { x: 195, y: 824, size: 84 }, avoid: [{ left: -8, right: 398, top: 150, bottom: 690 }], top: 80 },
];

function cubicPoint([p0, c1, c2, p3], t) {
  const m = 1 - t;
  return [0, 1].map((k) => m * m * m * p0[k] + 3 * m * m * t * c1[k] + 3 * m * t * t * c2[k] + t * t * t * p3[k]);
}

test('hero is a single signal hub with no stars, source cards or the old embossed stamp', () => {
  assert.match(pageHtml, /data-hero-signal\b/);
  assert.match(pageHtml, /data-hero-signal-map/);
  assert.equal((pageHtml.match(/data-hero-hub/g) ?? []).length, 1);
  assert.doesNotMatch(pageHtml + pageCss + siteScript, /hero-star|logo-stamp|hero-signal-card|hero-workspace|hero-route-map|fallback-signal/);
  assert.match(pageCss, /\.hero \{[^}]*radial-gradient\([^)]*#133c3f/, 'the hero is a lighter night sky than the old #06191b field');
  assert.doesNotMatch(pageCss, /\.hero \{[^}]*background: #06191b/);
  assert.match(pageCss, /\.hero-hub \{[^}]*--charge: 0;/, 'the hub glows a little brighter as lights arrive');
  assert.match(brandCss, /html:not\(\[data-motion-preview="on"\]\) \*/);
});

test('signal lines reach the hub from every side and corner without crossing the copy or header', () => {
  for (const layout of HERO_LAYOUTS) {
    const lines = planHeroSignals(layout);
    const sides = new Set(lines.map(({ side }) => side));
    // On a laptop the copy comes close to the hub, so its left side may have no room for a line.
    const required = HERO_SIGNAL_SIDES.filter((side) => layout.name !== '1024 laptop' || !side.includes('left'));
    assert.deepEqual(required.filter((side) => !sides.has(side)), [], `${layout.name}: every side and corner has a line`);
    assert.ok(lines.length >= (layout.width >= 1280 ? 18 : 12), `${layout.name}: ${lines.length} lines`);
    for (const line of lines) {
      const [start, , , end] = line.curve;
      const half = layout.hub.size / 2;
      assert.ok(Math.abs(end[0] - layout.hub.x) <= half + .5 && Math.abs(end[1] - layout.hub.y) <= half + .5, `${layout.name} ${line.id}: ends on the hub`);
      assert.ok(Math.max(Math.abs(end[0] - layout.hub.x), Math.abs(end[1] - layout.hub.y)) >= half * .7, `${layout.name} ${line.id}: ends at the hub's outline, not its middle`);
      assert.ok(Math.hypot(start[0] - end[0], start[1] - end[1]) >= 44, `${layout.name} ${line.id}: long enough to read`);
      for (let i = 0; i <= 14; i += 1) {
        const [x, y] = cubicPoint(line.curve, i / 16);
        assert.ok(x >= 0 && x <= layout.width && y >= layout.top && y <= layout.height, `${layout.name} ${line.id}: stays in the hero below the header`);
        for (const rect of layout.avoid) assert.ok(!(x > rect.left && x < rect.right && y > rect.top && y < rect.bottom), `${layout.name} ${line.id}: keeps clear of the copy`);
      }
    }
  }
});

test('signal lines arrive square to the hub outline', () => {
  const [layout] = HERO_LAYOUTS;
  for (const side of HERO_SIGNAL_SIDES) {
    const anchor = heroHubAnchor(layout.hub, side, 0);
    assert.ok(Math.abs(Math.hypot(...anchor.normal) - 1) < 1e-9, side);
  }
  for (const line of planHeroSignals(layout)) {
    const [, , c2, end] = line.curve;
    const anchor = heroHubAnchor(layout.hub, line.side, 0);
    const towards = [c2[0] - end[0], c2[1] - end[1]];
    const cross = towards[0] * anchor.normal[1] - towards[1] * anchor.normal[0];
    assert.ok(Math.abs(cross) < 1e-6 && towards[0] * anchor.normal[0] + towards[1] * anchor.normal[1] > 0, `${line.id}: the last stretch runs straight out from the hub`);
  }
});

test('lights arrive unhurried, a few sides at a time, never two on one line', () => {
  const lines = planHeroSignals(HERO_LAYOUTS[0]);
  const pulses = heroSignalSchedule(lines);
  assert.ok(pulses.length > 30, 'a steady flow over the minute-long cycle');
  for (const pulse of pulses) {
    assert.ok(pulse.duration >= 1700 && pulse.duration <= 3800, 'each light takes 1.7 to 3.8 seconds to travel in');
    assert.ok(pulse.start + pulse.duration <= HERO_SIGNAL_LOOP_MS, 'the cycle closes cleanly');
  }
  // Never more than three lights leave within any one second, and never more than six travel at once.
  for (const pulse of pulses) {
    assert.ok(pulses.filter((other) => other.start >= pulse.start && other.start < pulse.start + 1000).length <= 3, `burst at ${pulse.start}`);
    assert.ok(pulses.filter((other) => other.start <= pulse.start && pulse.start < other.start + other.duration).length <= 6, `crowd at ${pulse.start}`);
  }
  for (let i = 0; i < pulses.length; i += 1) {
    for (let j = i + 1; j < pulses.length; j += 1) {
      if (pulses[i].line !== pulses[j].line) continue;
      const [a, b] = [pulses[i], pulses[j]].sort((x, y) => x.start - y.start);
      assert.ok(b.start >= a.start + a.duration, `line ${a.line} carries one light at a time`);
    }
  }
  const sides = new Set(pulses.map((pulse) => lines[pulse.line].side));
  assert.equal(sides.size, HERO_SIGNAL_SIDES.length, 'over a cycle, light arrives from every side and corner');
  const together = pulses.filter((pulse, index) => pulses.some((other, k) => k !== index && Math.abs(other.start - pulse.start) < 400 && lines[other.line].side !== lines[pulse.line].side));
  assert.ok(together.length > 10, 'several sides often light at once');
});

test('the hub glows from recent arrivals and settles back', () => {
  const lines = planHeroSignals(HERO_LAYOUTS[0]);
  const pulses = heroSignalSchedule(lines);
  const first = pulses[0];
  const arrival = first.start + first.duration;
  const before = heroSignalState(first.start + 10, pulses);
  assert.ok(before.active.some(({ line }) => line === first.line), 'the first light is on its way');
  const at = heroSignalState(arrival + 20, pulses);
  assert.ok(at.charge > .3 && at.charge <= 1);
  for (let time = 0; time < HERO_SIGNAL_LOOP_MS; time += 250) {
    const state = heroSignalState(time, pulses);
    assert.ok(state.charge >= 0 && state.charge <= 1);
    for (const light of state.active) assert.ok(light.progress >= 0 && light.progress <= 1 && light.opacity >= 0 && light.opacity <= 1);
  }
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
