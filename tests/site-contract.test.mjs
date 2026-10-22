import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('landing page exposes one continuous journey with working anchor destinations', () => {
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  // The business tagline (owner, 23 October 2026).
  assert.match(html, /<h1 id="hero-title">Automate Operations\. Unlock time\.<\/h1>/);
  assert.match(html, /<title>Assistall AI — Automate Operations\. Unlock time\.<\/title>/);
  assert.doesNotMatch(html, /Clear the work/i, 'the old tagline is gone');

  for (const id of ['how-it-works', 'capabilities', 'connections', 'product', 'human-value', 'trust', 'demo']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
});

test('capability controls cover the six approved business workflows', () => {
  const capabilityControls = html.match(/data-capability-id=/g) ?? [];
  assert.equal(capabilityControls.length, 6);

  for (const id of ['inbox', 'files', 'contracts', 'shipments', 'clients', 'booking']) {
    assert.match(html, new RegExp(`data-capability-id=["']${id}["']`));
    const tab = html.match(new RegExp(`<button[^>]*data-capability-id=["']${id}["'][^>]*>`));
    assert.ok(tab, id);
    assert.match(tab[0], new RegExp(`id=["']capability-tab-${id}["']`));
    assert.match(tab[0], /aria-controls=["']capability-panel["']/);
  }

  const panel = html.match(/<div[^>]*class=["'][^"']*capability-evidence[^"']*["'][^>]*>/);
  assert.ok(panel);
  assert.match(panel[0], /id=["']capability-panel["']/);
  assert.match(panel[0], /aria-labelledby=["']capability-tab-inbox["']/);
});

test('changed page assets use a new shared cache revision', () => {
  const pageCss = html.match(/assets\/page\.css\?v=([a-z0-9]+)/i);
  const siteJs = html.match(/assets\/site\.js\?v=([a-z0-9]+)/i);
  assert.ok(pageCss);
  assert.ok(siteJs);
  assert.equal(pageCss[1], siteJs[1]);
  assert.notEqual(pageCss[1], '20260816a');
  assert.notEqual(pageCss[1], '20260818a');
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

test('connector ecosystem uses stable native marks and honest capability labels', () => {
  const connectorCards = html.match(/class="connector-card\b/g) ?? [];
  assert.equal(connectorCards.length, 8);

  for (const id of ['microsoft', 'gmail', 'whatsapp', 'odoo', 'zoho', 'folder', 'calendar']) {
    assert.match(html, new RegExp(`data-connector-mark="${id}"`));
  }

  for (const id of ['pdf', 'word', 'excel', 'csv']) {
    assert.match(html, new RegExp(`data-connector-mark="${id}"`));
  }

  assert.doesNotMatch(html, /connector-icons\.svg|<use\b|textLength=/);
  assert.equal((html.match(/Setup-dependent/g) ?? []).length, 4);
  assert.equal((html.match(/Imported source/g) ?? []).length, 4);
});

test('product evidence is a semantic three-workflow queue without theme media', () => {
  assert.match(html, /data-workflow-evidence/);
  const workflowEvidence = html.match(/<div[^>]*data-workflow-evidence[^>]*>/);
  assert.ok(workflowEvidence);
  assert.doesNotMatch(workflowEvidence[0], /data-reveal/);

  for (const id of ['contract', 'shipment', 'report']) {
    assert.match(html, new RegExp(`data-workflow-tab=["']${id}["']`));
    assert.match(html, new RegExp(`data-workflow-panel=["']${id}["']`));

    const workflowPanel = html.match(new RegExp(`<div[^>]*id=["']workflow-panel-${id}["'][^>]*>`));
    assert.ok(workflowPanel);
    assert.match(workflowPanel[0], /tabindex=["']0["']/);
  }
  assert.equal((html.match(/role="tab"/g) ?? []).length >= 3, true);
  for (const file of ['contract-review', 'shipment-review', 'report-preparation']) {
    assert.match(html, new RegExp(`assets/media/workflows/${file}\\.mp4`));
    assert.match(html, new RegExp(`assets/media/workflows/${file}\\.png`));
  }
  assert.equal((html.match(/data-workflow-video/g) ?? []).length, 3);
  assert.equal((html.match(/data-workflow-replay/g) ?? []).length, 3);
  assert.doesNotMatch(html, /workspace-theme-comparison|workspace-cobalt|data-workspace-video|data-video-toggle/);
});

test('workspace screenshots crop to a readable slice on phones with a link to the full image', async () => {
  const css = await readFile(new URL('../assets/page.css', import.meta.url), 'utf8');
  assert.equal((html.match(/<div class="shot-frame"><img src="assets\/media\/workspace-limestone\.png"/g) ?? []).length, 2);
  assert.equal((html.match(/<a class="shot-open" href="assets\/media\/workspace-limestone\.png"[^>]*>Open the full workspace view/g) ?? []).length, 2);
  assert.match(css, /\.shot-open \{ display: none; \}/, 'desktop keeps the whole screenshot and no link');
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*\.shot-frame img \{ position: absolute;[^}]*width: 174\.3%;/, 'phones show the overview at about twice the size');
});
