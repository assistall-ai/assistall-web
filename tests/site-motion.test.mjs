import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  HERO_MOTION_ITEMS,
  calculateScrollDuration,
  createHeroMotionMarkup,
  easeInOutCubic,
  getTargetScrollTop,
  selectVisibleVideo,
} from '../assets/site.js';

const pageCss = await readFile(new URL('../assets/page.css', import.meta.url), 'utf8');
const siteScript = await readFile(new URL('../assets/site.js', import.meta.url), 'utf8');

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

test('workspace tour selects the video in the visible responsive stage', () => {
  const desktop = { stage: 'desktop' };
  const mobile = { stage: 'mobile' };
  assert.equal(selectVisibleVideo([desktop, mobile], (video) => video.stage === 'mobile'), mobile);
  assert.equal(selectVisibleVideo([desktop, mobile], () => false), desktop);
});

test('hero motion uses the approved set of real work inputs', () => {
  assert.equal(HERO_MOTION_ITEMS.length, 14);
  assert.deepEqual(
    HERO_MOTION_ITEMS.map(({ label }) => label),
    ['ZOHO', 'odoo', 'WhatsApp', 'Email', 'DOCX', 'XLSX', 'CSV', 'Voice', 'Folder', 'TXT', 'PDF', 'PPTX', 'JPG', 'JSON'],
  );
});

test('hero motion uses one flat branded workspace, one bottom-centred output, and a route for every input', () => {
  const markup = createHeroMotionMarkup();

  assert.match(markup, /assets\/android-chrome-512x512\.png/);
  assert.equal((markup.match(/<animateMotion\b/g) ?? []).length, HERO_MOTION_ITEMS.length);
  assert.equal((markup.match(/class="hero-output"/g) ?? []).length, 1);
  assert.equal((markup.match(/class="hero-workspace-surface"/g) ?? []).length, 1);
  assert.doesNotMatch(markup, /hero-engine__face|<foreignObject|hero-engine__cube/);
  assert.doesNotMatch(markup, /hero-engine__(?:orbit|intake)|black-hole/);
  assert.match(markup, /Q [^\"]+ 760 286/);
  assert.match(markup, /filter="url\(#hero-document-glow\)"/);
  assert.match(markup, /translate\(700 430\)/);
  assert.ok(markup.indexOf('class="hero-workspace-surface"') < markup.indexOf('class="hero-output"'));
  assert.match(markup, /dur="5s"/);
});

test('motion=on visibly overrides an operating-system reduced-motion setting for QA', () => {
  assert.match(siteScript, /data-motion-preview/);
  assert.match(pageCss, /data-motion-preview=["']on["'].*hero-motion__stage/s);
  assert.match(pageCss, /data-motion-preview=["']on["'].*workspace-video-stage video/s);
});
