import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const verifier = await readFile(new URL('../tools/verify-site.ps1', import.meta.url), 'utf8');

test('static verifier requires the approved recorded workflow queue', () => {
  assert.match(verifier, /@\('contract', 'shipment', 'report'\)/);
  assert.doesNotMatch(verifier, /@\('contract', 'shipment', 'reply'\)/);
  assert.match(verifier, /data-workflow-video/);
});
