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

test('connector ecosystem uses local recognizable marks and honest capability labels', () => {
  const connectorCards = html.match(/class="connector-card\b/g) ?? [];
  assert.equal(connectorCards.length, 8);

  for (const id of ['microsoft', 'gmail', 'whatsapp', 'odoo', 'zoho', 'folder', 'calendar']) {
    assert.match(html, new RegExp(`connector-icons\\.svg#connector-${id}`));
  }

  for (const id of ['pdf', 'word', 'excel', 'csv']) {
    assert.match(html, new RegExp(`connector-icons\\.svg#connector-${id}`));
  }

  assert.equal((html.match(/class="connector-card__fallback"/g) ?? []).length, 8);
  assert.equal((html.match(/Setup-dependent/g) ?? []).length, 4);
  assert.equal((html.match(/Imported source/g) ?? []).length, 4);
});

test('product evidence is a semantic three-workflow queue without theme media', () => {
  assert.match(html, /data-workflow-evidence/);
  const workflowEvidence = html.match(/<div[^>]*data-workflow-evidence[^>]*>/);
  assert.ok(workflowEvidence);
  assert.doesNotMatch(workflowEvidence[0], /data-reveal/);

  for (const id of ['contract', 'shipment', 'reply']) {
    assert.match(html, new RegExp(`data-workflow-tab=["']${id}["']`));
    assert.match(html, new RegExp(`data-workflow-panel=["']${id}["']`));

    const workflowPanel = html.match(new RegExp(`<div[^>]*id=["']workflow-panel-${id}["'][^>]*>`));
    assert.ok(workflowPanel);
    assert.match(workflowPanel[0], /tabindex=["']0["']/);
  }
  assert.equal((html.match(/role="tab"/g) ?? []).length >= 3, true);
  assert.match(html, /Ready for review/);
  assert.match(html, /Approve reply/);
  assert.doesNotMatch(html, /workspace-theme-comparison|workspace-cobalt|data-workspace-video|data-video-toggle/);
});
