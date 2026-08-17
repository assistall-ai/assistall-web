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

test('workflow evidence keeps one valid active workflow', () => {
  assert.deepEqual(site.WORKFLOW_IDS, ['contract', 'shipment', 'reply']);
  assert.equal(site.WORKFLOW_ROTATION_MS, 7000);
  assert.equal(site.createWorkflowState('shipment').activeId, 'shipment');
  assert.equal(site.createWorkflowState('unknown').activeId, 'contract');
});

test('workflow keyboard navigation wraps and supports Home and End', () => {
  assert.equal(site.getWorkflowTabTarget(0, 'ArrowRight', 3), 1);
  assert.equal(site.getWorkflowTabTarget(2, 'ArrowRight', 3), 0);
  assert.equal(site.getWorkflowTabTarget(0, 'ArrowLeft', 3), 2);
  assert.equal(site.getWorkflowTabTarget(1, 'Home', 3), 0);
  assert.equal(site.getWorkflowTabTarget(1, 'End', 3), 2);
  assert.equal(site.getWorkflowTabTarget(1, 'Enter', 3), 1);
});

test('workflow rotation requires visibility, motion and no interaction pause', () => {
  assert.equal(site.shouldRotateWorkflow({ visible: true, reducedMotion: false, interactionPaused: false }), true);
  assert.equal(site.shouldRotateWorkflow({ visible: false, reducedMotion: false, interactionPaused: false }), false);
  assert.equal(site.shouldRotateWorkflow({ visible: true, reducedMotion: true, interactionPaused: false }), false);
  assert.equal(site.shouldRotateWorkflow({ visible: true, reducedMotion: false, interactionPaused: true }), false);
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
