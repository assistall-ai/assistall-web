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

const pageCss = await readFile(new URL('../assets/page.css', import.meta.url), 'utf8');
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

test('hero motion keeps every moving part inside one stable DOM field', () => {
  const markup = createHeroMotionMarkup();
  const heroOutputKeyframes = pageCss.slice(pageCss.indexOf('@keyframes hero-output-emerge'), pageCss.indexOf('.story-section'));

  assert.match(markup, /assets\/android-chrome-512x512\.png/);
  assert.equal((markup.match(/<div class="hero-signal-card/g) ?? []).length, HERO_MOTION_ITEMS.length);
  assert.equal((markup.match(/data-connector-mark=/g) ?? []).length, HERO_MOTION_ITEMS.length);
  assert.match(markup, /class="hero-motion__field"/);
  assert.match(markup, /class="hero-output" data-hero-output/);
  assert.match(markup, /class="hero-workspace" data-hero-workspace/);
  assert.doesNotMatch(markup, /<svg|<use|<animateMotion|hero-output-shell|hero-workspace-shell/);
  assert.doesNotMatch(siteScript, /syncHeroLayers|getScreenCTM|ResizeObserver\(\(\) => syncHeroLayers/);
  assert.match(pageCss, /@keyframes hero-workspace-turn/);
  assert.match(pageCss, /\.hero-workspace[^}]*animation: hero-workspace-turn/);
  assert.match(pageCss, /0%, 48% \{ transform: rotateX\(0deg\); \}/);
  assert.match(pageCss, /61%, 100% \{ transform: rotateX\(360deg\); \}/);
  assert.match(pageCss, /perspective: 720px/);
  assert.match(pageCss, /backface-visibility: hidden/);
  assert.match(heroOutputKeyframes, /66%/);
  assert.match(heroOutputKeyframes, /translateY\(-100%\)/);
  assert.doesNotMatch(heroOutputKeyframes, /clip-path/);
  assert.match(pageCss, /\.hero-motion \{ z-index: -3; \}/);
  assert.match(pageCss, /\.hero__film \{ z-index: -1;/);
  assert.match(pageCss, /\.hero-signal-card[^}]*animation: hero-signal-intake/);
  assert.match(pageCss, /\.hero-output__paper[^}]*0 0 52px/);
  assert.match(pageHtml, /data-connector-mark="odoo"/);
  assert.doesNotMatch(pageHtml, /connector-icons\.svg/);
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
