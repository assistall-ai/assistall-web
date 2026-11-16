import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const verifier = await readFile(new URL('../tools/verify-site.ps1', import.meta.url), 'utf8');

test('static verifier requires the approved recorded workflow queue', () => {
  assert.match(verifier, /@\('build', 'library', 'approve', 'board', 'reply'\)/);
  assert.doesNotMatch(verifier, /'contract', 'shipment'/);
  assert.match(verifier, /data-workflow-video/);
});

test('static verifier allows only our social profile links as outbound links', () => {
  const allowed = verifier.match(/\$approvedOutboundLinks = '(.+)'/);
  assert.ok(allowed, 'verifier names the approved outbound links');
  const pattern = new RegExp(allowed[1].replace('(?is)', '').replaceAll("''", "'"), 'is');
  for (const url of ['https://www.instagram.com/assistall.ai/', 'https://www.tiktok.com/@assistall.ai', 'https://www.linkedin.com/company/assistall-ai']) {
    assert.match(`<a class="x" href="${url}" target="_blank">`, pattern);
  }
  for (const tag of ['<script src="https://evil.example/x.js">', '<link href="https://www.instagram.com/assistall.ai/">', '<a href="https://www.instagram.com/someone-else/">']) {
    assert.doesNotMatch(tag, pattern);
  }
});
