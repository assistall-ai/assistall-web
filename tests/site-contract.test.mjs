import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('landing page exposes one continuous journey with working anchor destinations', () => {
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /Clear the work that slows your business down\./);

  for (const id of ['how-it-works', 'capabilities', 'connections', 'product', 'human-value', 'trust', 'demo']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test('capability controls cover the six approved business workflows', () => {
  const capabilityControls = html.match(/data-capability-id=/g) ?? [];
  assert.equal(capabilityControls.length, 6);

  for (const id of ['inbox', 'files', 'contracts', 'shipments', 'clients', 'booking']) {
    assert.match(html, new RegExp(`data-capability-id=["']${id}["']`));
  }
});

test('demo form posts the approved fields to the hardened same-origin endpoint', () => {
  assert.match(html, /<form[^>]+action=["']demo-request\.php["'][^>]+method=["']post["']/s);

  for (const name of ['name', 'email', 'company', 'work_need', 'website', 'started_at', 'cf-turnstile-response']) {
    assert.match(html, new RegExp(`name=["']${name}["']`));
  }
});

test('official Assistall mark is used across navigation, product story, and final call to action', () => {
  assert.ok((html.match(/assets\/apple-touch-icon\.png/g) ?? []).length >= 3);
});

test('real workspace evidence includes both responsive videos and static fallbacks', () => {
  assert.match(html, /workspace-theme-comparison\.mp4/);
  assert.match(html, /workspace-theme-comparison-mobile\.mp4/);
  assert.match(html, /workspace-limestone\.png/);
  assert.match(html, /workspace-cobalt\.png/);
});
