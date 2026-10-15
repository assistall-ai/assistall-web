import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readSettings, commitMatches, deploymentOutcome } from '../tools/cpanel-deploy.mjs';
import { expectedAssets, buildChecks, checkLiveSite } from '../tools/check-live-site.mjs';

const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/deploy-website.yml', import.meta.url), 'utf8');

test('deploy settings are required and normalised', () => {
  assert.throws(() => readSettings({}), /CPANEL_HOST, CPANEL_USER, CPANEL_API_TOKEN, CPANEL_REPO_ROOT/);
  const settings = readSettings({ CPANEL_HOST: 'https://server.example.com:2083/', CPANEL_USER: 'u', CPANEL_API_TOKEN: 't', CPANEL_REPO_ROOT: '/home/u/repositories/site/' });
  assert.equal(settings.host, 'server.example.com');
  assert.equal(settings.port, '2083');
  assert.equal(settings.repositoryRoot, '/home/u/repositories/site');
  assert.equal(settings.branch, 'main');
});

test('a deploy only proceeds when cPanel has the exact commit', () => {
  assert.ok(commitMatches('e126468f80e3e88b763bd08de90401c511199612', 'e126468f80e3e88b763bd08de90401c511199612'));
  assert.ok(commitMatches('e126468', 'e126468f80e3e88b763bd08de90401c511199612'));
  assert.ok(!commitMatches('7567d4a678b875c0cb1bad47ee8d54b3bf60d347', 'e126468f80e3e88b763bd08de90401c511199612'));
  assert.ok(!commitMatches('', 'e126468'));
  assert.ok(!commitMatches('e12', 'e126468'));
});

test('deployment outcome is read from cPanel timestamps', () => {
  assert.equal(deploymentOutcome({ timestamps: { queued: '1' } }), 'running');
  assert.equal(deploymentOutcome({ timestamps: { succeeded: '2' } }), 'succeeded');
  assert.equal(deploymentOutcome({ timestamps: { failed: '2' } }), 'failed');
  assert.equal(deploymentOutcome(undefined), 'running');
});

test('live check expects the asset versions in this commit', () => {
  const assets = expectedAssets(indexHtml);
  assert.equal(assets.length, 3);
  assert.ok(assets.every((asset) => /^assets\/(brand\.css|page\.css|site\.js)\?v=/.test(asset)));
  const checks = buildChecks('https://assistall.ai/', assets);
  assert.ok(checks.some((c) => c.url === 'https://assistall.ai/diagnostic-intake.php' && c.status === 405 && c.required));
  assert.ok(checks.filter((c) => !c.required).every((c) => /headers|HTTPS/.test(c.name)));
});

test('live check fails an old homepage and passes a matching one', async () => {
  const assets = expectedAssets(indexHtml);
  const fakeFetch = (homepage) => async (url, options) => {
    const path = new URL(url).pathname;
    const status = options.redirect === 'manual' ? 301 : path.endsWith('.php') ? 405 : 200;
    const body = path === '/' ? homepage : path.endsWith('security.txt') ? 'Contact: mailto:security@assistall.ai' : '';
    return new Response(body, { status, headers: { 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'self'" } });
  };
  const current = await checkLiveSite('https://assistall.ai', indexHtml, fakeFetch(indexHtml));
  assert.ok(current.every((r) => r.ok), current.filter((r) => !r.ok).map((r) => r.name).join(', '));
  const old = await checkLiveSite('https://assistall.ai', indexHtml, fakeFetch('<link href="assets/brand.css?v=old">'));
  assert.ok(old.some((r) => r.required && !r.ok && r.name === 'Homepage loads'));
});

test('deploy workflow is manual-only, main-only and confirmed', () => {
  assert.match(workflow, /on:\s*\n\s*workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s*(push|pull_request|schedule):/m);
  assert.match(workflow, /refs\/heads\/main/);
  assert.match(workflow, /"\$CONFIRM" != "DEPLOY"/);
  assert.match(workflow, /environment:\s*\n\s*name: production/);
  assert.match(workflow, /EXPECTED_SHA: \$\{\{ github\.sha \}\}/);
  assert.doesNotMatch(workflow, /CPANEL_API_TOKEN: [^$]/);
});
