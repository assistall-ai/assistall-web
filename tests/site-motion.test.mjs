import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  HERO_SIGNAL_LOOP_MS,
  HERO_SIGNAL_SIDES,
  HERO_TRACE_DEPTH,
  HERO_TRACE_GAP,
  calculateScrollDuration,
  easeInOutCubic,
  getTargetScrollTop,
  heroHubAnchor,
  heroSignalSchedule,
  heroSignalState,
  heroTraceDistance,
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

// The hub sits centred right of the copy on wide screens and below it on phones; these are
// the pixel layouts site.js measures, worked out from page.css at each width.
const HERO_LAYOUTS = [
  { name: '1440 desktop', width: 1440, height: 900, hub: { x: 1096, y: 434, size: 144 }, avoid: [{ left: 44, right: 780, top: 200, bottom: 760 }], top: 88 },
  { name: '1920 desktop', width: 1920, height: 900, hub: { x: 1456, y: 434, size: 148 }, avoid: [{ left: 284, right: 1020, top: 200, bottom: 770 }], top: 88 },
  { name: '1024 laptop', width: 1024, height: 768, hub: { x: 829, y: 376, size: 102 }, avoid: [{ left: 13, right: 663, top: 180, bottom: 690 }], top: 88 },
  // Shorter browser windows leave a thin band above the copy.
  { name: '1440 short window', width: 1430, height: 760, hub: { x: 1088, y: 372, size: 144 }, avoid: [{ left: 49, right: 713, top: 110, bottom: 700 }], top: 88 },
  { name: '1280 short window', width: 1270, height: 680, hub: { x: 990, y: 337, size: 128 }, avoid: [{ left: 31, right: 691, top: 100, bottom: 640 }], top: 88 },
  { name: '900 tablet', width: 890, height: 700, hub: { x: 745, y: 346, size: 100 }, avoid: [{ left: 18, right: 560, top: 120, bottom: 650 }], top: 88 },
  { name: '390 phone', width: 390, height: 1060, hub: { x: 195, y: 916, size: 104 }, avoid: [{ left: -8, right: 398, top: 110, bottom: 768 }], top: 80 },
];

function pointsAlong(points, step = 3) {
  const out = [];
  for (let i = 1; i < points.length; i += 1) {
    const [a, b] = [points[i - 1], points[i]];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 0; s <= length; s += step) out.push([a[0] + (b[0] - a[0]) * s / length, a[1] + (b[1] - a[1]) * s / length]);
  }
  return out;
}

test('hero is a single signal hub with no stars, source cards or the old embossed stamp', () => {
  assert.match(pageHtml, /data-hero-signal\b/);
  assert.match(pageHtml, /data-hero-signal-map/);
  assert.equal((pageHtml.match(/data-hero-hub/g) ?? []).length, 1);
  assert.doesNotMatch(pageHtml + pageCss + siteScript, /hero-star|logo-stamp|hero-signal-card|hero-workspace|hero-route-map|fallback-signal|hero-signal__head/);
  assert.match(pageCss, /\.hero \{[^}]*linear-gradient\(180deg, #03060b/, 'the hero is a dark night sky without stars');
  assert.match(pageCss, /\.hero-hub \{[^}]*--charge: 0;/, 'the hub glows a little brighter as lights arrive');
  assert.match(pageCss, /\.hero-signal__line \{[^}]*stroke-width: 1\.6;[^}]*stroke-linecap: butt;/);
  assert.match(pageCss, /\.hero-signal__trail, \.hero-signal__packet \{[^}]*stroke-linecap: butt;/, 'lights have square ends, not round dots');
  assert.match(pageCss, /\.hero-signal__packet \{[^}]*stroke-width: 1\.6;/, 'each light is as thin as its trace');
  assert.match(pageCss, /\.hero-signal__trail \{[^}]*stroke-width: 1;/, 'the trail is thinner still');
  assert.match(brandCss, /html:not\(\[data-motion-preview="on"\]\) \*/);
});

test('traces run in from the screen edges on every side and corner, clear of the copy and header', () => {
  for (const layout of HERO_LAYOUTS) {
    const lines = planHeroSignals(layout);
    const sides = new Set(lines.map(({ side }) => side));
    assert.deepEqual(HERO_SIGNAL_SIDES.filter((side) => !sides.has(side)), [], `${layout.name}: every side and corner has a trace`);
    assert.equal(lines.length, 32, `${layout.name}: all 32 traces fit`);
    for (const line of lines) {
      const [[sx, sy]] = line.points;
      const atEdge = sx <= 3 || sx >= layout.width - 3 || sy <= layout.top + 3 || sy >= layout.height - 3
        || layout.avoid.some((r) => Math.min(Math.abs(sx - r.left), Math.abs(sx - r.right), Math.abs(sy - r.top), Math.abs(sy - r.bottom)) <= 3);
      assert.ok(atEdge, `${layout.name} ${line.id}: starts at the edge of the screen (or the copy), not mid-air`);
      const [ex, ey] = line.points.at(-1);
      const half = layout.hub.size / 2;
      assert.ok(Math.abs(ex - layout.hub.x) <= half + .5 && Math.abs(ey - layout.hub.y) <= half + .5 && Math.max(Math.abs(ex - layout.hub.x), Math.abs(ey - layout.hub.y)) >= half * .7, `${layout.name} ${line.id}: ends on the hub outline`);
      for (const [x, y] of pointsAlong(line.points)) {
        assert.ok(x >= -.5 && x <= layout.width + .5 && y >= layout.top - .5 && y <= layout.height + .5, `${layout.name} ${line.id}: stays below the header`);
        for (const r of layout.avoid) assert.ok(!(x > r.left + .5 && x < r.right - .5 && y > r.top + .5 && y < r.bottom - .5), `${layout.name} ${line.id}: keeps clear of the copy`);
      }
    }
  }
});

test('the pattern is symmetric: five traces a side and three a corner, every one reaching a screen edge', () => {
  for (const layout of HERO_LAYOUTS) {
    const lines = planHeroSignals(layout);
    for (const side of HERO_SIGNAL_SIDES) {
      assert.equal(lines.filter((line) => line.side === side).length, side.includes('-') ? 3 : 5, `${layout.name} ${side}`);
    }
  }
  for (const layout of HERO_LAYOUTS.filter(({ name }) => name !== '390 phone')) {
    const [copy] = layout.avoid;
    for (const line of planHeroSignals(layout).filter(({ side }) => side.includes('left'))) {
      const [[sx, sy]] = line.points;
      assert.ok(sx <= 3 || sy <= layout.top + 3 || sy >= layout.height - 3, `${layout.name} ${line.id}: routed round the copy to the edge of the screen`);
      // Routed traces hug the copy: their turns sit within a few lanes of its edges.
      for (const [x, y] of line.points.slice(1, -1).filter(([x]) => x < copy.right + 60)) {
        assert.ok(x <= copy.right + 60 && (y <= copy.top || y >= copy.bottom || x >= copy.right), `${layout.name} ${line.id}: hugs the copy`);
      }
    }
  }
  assert.ok(HERO_TRACE_DEPTH > 0, 'traces carry on under the hub so their lights vanish inside it');
});

test('traces are straight runs joined by 45 degree bends, never crossing or touching', () => {
  for (const layout of HERO_LAYOUTS) {
    const lines = planHeroSignals(layout);
    for (const line of lines) {
      for (let i = 1; i < line.points.length; i += 1) {
        const [a, b] = [line.points[i - 1], line.points[i]];
        const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) / (Math.PI / 4);
        assert.ok(Math.abs(angle - Math.round(angle)) < 1e-6, `${layout.name} ${line.id}: segment ${i} runs at a multiple of 45 degrees`);
      }
      const [beforeEnd, end] = line.points.slice(-2);
      const anchorNormal = heroHubAnchor(layout.hub, line.side, 0).normal;
      const run = [end[0] - beforeEnd[0], end[1] - beforeEnd[1]];
      assert.ok(Math.abs(run[0] * anchorNormal[1] - run[1] * anchorNormal[0]) < 1e-6 && run[0] * anchorNormal[0] + run[1] * anchorNormal[1] < 0, `${layout.name} ${line.id}: arrives square to the hub`);
    }
    for (let i = 0; i < lines.length; i += 1) {
      for (let j = i + 1; j < lines.length; j += 1) {
        assert.ok(heroTraceDistance(lines[i].points, lines[j].points) >= HERO_TRACE_GAP, `${layout.name}: ${lines[i].id} and ${lines[j].id} keep ${HERO_TRACE_GAP}px apart`);
      }
    }
  }
});

test('lights arrive unhurried, a few sides at a time, never two on one trace', () => {
  const lines = planHeroSignals(HERO_LAYOUTS[0]);
  const pulses = heroSignalSchedule(lines);
  assert.ok(pulses.length > 30, 'a steady flow over the minute-long cycle');
  for (const pulse of pulses) {
    assert.ok(pulse.duration >= 1800 && pulse.duration <= 5200, 'each light takes 1.8 to 5.2 seconds to travel in');
    assert.ok(pulse.start + pulse.duration <= HERO_SIGNAL_LOOP_MS, 'the cycle closes cleanly');
  }
  for (const pulse of pulses) {
    assert.ok(pulses.filter((other) => other.start >= pulse.start && other.start < pulse.start + 1000).length <= 3, `burst at ${pulse.start}`);
    assert.ok(pulses.filter((other) => other.start <= pulse.start && pulse.start < other.start + other.duration).length <= 8, `crowd at ${pulse.start}`);
  }
  for (let i = 0; i < pulses.length; i += 1) {
    for (let j = i + 1; j < pulses.length; j += 1) {
      if (pulses[i].line !== pulses[j].line) continue;
      const [a, b] = [pulses[i], pulses[j]].sort((x, y) => x.start - y.start);
      assert.ok(b.start >= a.start + a.duration, `trace ${a.line} carries one light at a time`);
    }
  }
  const sides = new Set(pulses.map((pulse) => lines[pulse.line].side));
  assert.equal(sides.size, HERO_SIGNAL_SIDES.length, 'over a cycle, light arrives from every side and corner');
  const together = pulses.filter((pulse, index) => pulses.some((other, k) => k !== index && Math.abs(other.start - pulse.start) < 400 && lines[other.line].side !== lines[pulse.line].side));
  assert.ok(together.length > 10, 'several sides often light at once');
  assert.match(siteScript, /HERO_PACKET = Object\.freeze\(\[1\.5, 2, 6\]\)/, 'each light is a tiny packet of dashes, not a dot');
  assert.match(siteScript, /HERO_TRAIL_LENGTH = 14;/, 'its trail is short');
});

test('the hub glows from recent arrivals and settles back', () => {
  const lines = planHeroSignals(HERO_LAYOUTS[0]);
  const pulses = heroSignalSchedule(lines);
  const first = pulses[0];
  const arrival = first.start + first.duration;
  assert.ok(heroSignalState(first.start + 10, pulses).active.some(({ line }) => line === first.line), 'the first light is on its way');
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
