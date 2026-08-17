import assert from 'node:assert/strict';
import test from 'node:test';

import * as site from '../assets/site.js';

test('capability state activates the requested workflow and keeps one active item', () => {
  assert.equal(typeof site.createCapabilityState, 'function');

  const state = site.createCapabilityState('contracts');

  assert.equal(state.activeId, 'contracts');
  assert.equal(state.items.filter((item) => item.active).length, 1);
  assert.equal(state.items.find((item) => item.active)?.result, 'Renewal dates and changes ready to review');
});

test('unknown capability selection falls back to inbox work', () => {
  assert.equal(typeof site.createCapabilityState, 'function');

  const state = site.createCapabilityState('not-a-workflow');

  assert.equal(state.activeId, 'inbox');
  assert.equal(state.items.find((item) => item.active)?.input, 'Email or business message');
});

test('workspace media only autoplays while visible when motion is allowed and the user has not paused it', () => {
  assert.equal(typeof site.shouldAutoplayMedia, 'function');

  assert.equal(site.shouldAutoplayMedia({ visible: true, reducedMotion: false, userPaused: false }), true);
  assert.equal(site.shouldAutoplayMedia({ visible: false, reducedMotion: false, userPaused: false }), false);
  assert.equal(site.shouldAutoplayMedia({ visible: true, reducedMotion: true, userPaused: false }), false);
  assert.equal(site.shouldAutoplayMedia({ visible: true, reducedMotion: false, userPaused: true }), false);
});

test('demo payload trims fields and keeps only the public form contract', () => {
  assert.equal(typeof site.buildDemoPayload, 'function');

  const payload = site.buildDemoPayload({
    name: '  Amina Noor  ',
    email: '  amina@example.com ',
    company: '  Clear Route  ',
    work_need: '  Shipment updates  ',
    website: '',
    started_at: '12345',
    ignored: 'do not submit',
  });

  assert.deepEqual(payload, {
    name: 'Amina Noor',
    email: 'amina@example.com',
    company: 'Clear Route',
    work_need: 'Shipment updates',
    website: '',
    started_at: '12345',
    'cf-turnstile-response': '',
  });
});

test('Turnstile only accepts a configured public site key', () => {
  assert.equal(typeof site.normaliseTurnstileSiteKey, 'function');
  assert.equal(site.normaliseTurnstileSiteKey('  0x4AAAA-real-public-key  '), '0x4AAAA-real-public-key');
  assert.equal(site.normaliseTurnstileSiteKey('REPLACE_WITH_TURNSTILE_SITE_KEY'), '');
  assert.equal(site.normaliseTurnstileSiteKey(''), '');
});
