import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  HERO_MOTION_ITEMS,
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
  assert.equal(HERO_MOTION_ITEMS.filter(({ wordmark }) => wordmark).length, 0);
});

test('hero motion keeps routes and moving parts inside one stable DOM field', () => {
  const markup = createHeroMotionMarkup();

  assert.match(markup, /assets\/android-chrome-512x512\.png/);
  assert.equal((markup.match(/<div class="hero-signal-card/g) ?? []).length, HERO_MOTION_ITEMS.length);
  assert.match(markup, /<svg class="hero-route-map"[^>]*viewBox="0 0 1200 700"/);
  assert.equal((markup.match(/data-hero-route=/g) ?? []).length, HERO_MOTION_ITEMS.length);
  assert.equal((markup.match(/data-hero-light=/g) ?? []).length, HERO_MOTION_ITEMS.length);
  assert.equal((markup.match(/data-connector-mark=/g) ?? []).length, HERO_MOTION_ITEMS.length);
  assert.match(markup, /class="hero-motion__field"/);
  assert.match(markup, /class="hero-output" data-hero-output/);
  assert.match(markup, /class="hero-workspace" data-hero-workspace/);
  assert.doesNotMatch(markup, /<use|<animateMotion|hero-output-shell|hero-workspace-shell/);
  assert.doesNotMatch(siteScript, /hero-route-line|hero-signal-intake|hero-workspace-turn/);
  assert.match(pageCss, /\.hero-route-map path/);
  assert.match(pageCss, /rotateY\(/);
  assert.match(pageCss, /backface-visibility: hidden/);
  assert.match(pageCss, /\.hero-motion \{ z-index: 0; \}/);
  assert.match(pageCss, /\.hero__film \{ z-index: 1;/);
  assert.match(brandCss, /html:not\(\[data-motion-preview="on"\]\) \*/);
  assert.match(pageCss, /\.hero-output__paper[^}]*0 0 64px/);
  assert.doesNotMatch(pageCss, /\.fallback-signal--(?:four|five) \{ bottom:/, 'the static fallback must reserve the lower hero area for the output document');
  assert.match(pageHtml, /data-connector-mark="odoo"/);
  assert.doesNotMatch(pageHtml, /connector-icons\.svg/);
});

test('hero sequence sends every input through the workspace top gate before its Y-axis spin', () => {
  assert.equal(typeof siteModule.getHeroSequenceState, 'function');

  const intake = siteModule.getHeroSequenceState(900);
  assert.equal(intake.phase, 'intake');
  assert.equal(intake.workspace.rotationY, 0);
  assert.equal(intake.inputs.length, HERO_MOTION_ITEMS.length);
  assert.ok(intake.inputs.every(({ y }) => y < 276), 'icons must begin above the workspace top edge');

  const glidingInputs = siteModule.getHeroSequenceState(2200).inputs.filter(({ routeProgress, opacity }) => routeProgress > 0 && opacity > 0);
  assert.ok(glidingInputs.length >= 3 && glidingInputs.length <= 7, 'the intake must stay readable rather than collapsing into one crowd');
  assert.ok(glidingInputs.every(({ y }) => y < 276), 'icons must remain above the workspace until they enter it');

  const earlyIntake = siteModule.getHeroSequenceState(1150).inputs;
  const horizontalSpread = Math.max(...earlyIntake.map(({ x }) => x)) - Math.min(...earlyIntake.map(({ x }) => x));
  assert.ok(horizontalSpread > 550);
  assert.ok(earlyIntake.filter(({ y }) => y < 125).length >= 3, 'the composition needs a visible top row of inputs');

  const finalIntake = siteModule.getHeroSequenceState(4300);
  assert.ok(finalIntake.inputs.some(({ opacity }) => opacity > 0), 'the last input must finish before lights can return');
  assert.ok(finalIntake.lights.every(({ direction }) => direction !== 'return'), 'return lights must wait until the full intake is clear');

  const cleared = siteModule.getHeroSequenceState(4500);
  assert.ok(cleared.inputs.every(({ x, y, opacity }) => x === 870 && y === 276 && opacity === 0), 'every input must clear through the single top gate');
  assert.ok(cleared.lights.every(({ direction, opacity }) => direction === 'return' && opacity > 0), 'only the trailing light may travel back out after intake');

  const spin = siteModule.getHeroSequenceState(5800);
  assert.equal(spin.phase, 'spin');
  assert.ok(spin.workspace.rotationY > 0 && spin.workspace.rotationY < 360);
  assert.equal(spin.document.opacity, 0);

  const output = siteModule.getHeroSequenceState(8000);
  assert.equal(output.phase, 'output');
  assert.equal(output.workspace.rotationY, 360);
  assert.ok(output.document.opacity > 0);
  assert.ok(output.document.translateY > -55);
});

test('workflow evidence gives source viewers time to be understood before advancing', () => {
  assert.equal(WORKFLOW_ROTATION_MS, 8000);
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
