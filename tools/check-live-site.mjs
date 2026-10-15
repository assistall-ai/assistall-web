// Check the public website after a deploy.
//
//   node tools/check-live-site.mjs [base-url]     defaults to https://assistall.ai
//
// Required checks fail the run; warnings are reported but do not.
// Expected asset versions are read from this checkout's index.html, so the check
// proves the live page is the commit that was just deployed.

import { readFile, appendFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function expectedAssets(indexHtml) {
  const assets = [];
  for (const match of indexHtml.matchAll(/(?:href|src)="(assets\/(?:brand\.css|page\.css|site\.js)\?v=[^"]+)"/g)) assets.push(match[1]);
  return assets;
}

export function buildChecks(base, assets) {
  const root = base.replace(/\/+$/, '');
  return [
    { name: 'Homepage loads', url: `${root}/`, status: 200, mustInclude: assets, required: true },
    ...assets.map((asset) => ({ name: `Asset ${asset}`, url: `${root}/${asset}`, status: 200, required: true })),
    { name: 'Privacy page', url: `${root}/privacy.html`, status: 200, required: true },
    { name: 'Security page', url: `${root}/security.html`, status: 200, required: true },
    { name: 'security.txt', url: `${root}/.well-known/security.txt`, status: 200, mustInclude: ['Contact:'], required: true },
    { name: 'Demo form endpoint rejects GET', url: `${root}/demo-request.php`, status: 405, required: true },
    { name: 'Diagnostic endpoint rejects GET', url: `${root}/diagnostic-intake.php`, status: 405, required: true },
    { name: 'Security headers (.htaccess active)', url: `${root}/`, status: 200, headers: ['x-content-type-options', 'content-security-policy'], required: false },
    { name: 'HTTP redirects to HTTPS', url: `${root.replace(/^https:/, 'http:')}/`, status: 301, redirect: 'manual', required: false },
  ];
}

export async function runCheck(check, fetchImpl = fetch) {
  const url = new URL(check.url);
  if (!check.redirect) url.searchParams.set('_deploycheck', Date.now().toString(36));
  try {
    const response = await fetchImpl(url, { redirect: check.redirect || 'follow', headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(30000) });
    const problems = [];
    if (response.status !== check.status) problems.push(`HTTP ${response.status}, expected ${check.status}`);
    if (check.mustInclude?.length) {
      const body = await response.text();
      const missing = check.mustInclude.filter((text) => !body.includes(text));
      if (missing.length) problems.push(`missing ${missing.join(', ')}`);
    }
    const missingHeaders = (check.headers || []).filter((name) => !response.headers.get(name));
    if (missingHeaders.length) problems.push(`no ${missingHeaders.join(', ')} header`);
    return { ...check, ok: problems.length === 0, detail: problems.join('; ') || `HTTP ${response.status}` };
  } catch (error) {
    return { ...check, ok: false, detail: `request failed (${error.cause?.code || error.name})` };
  }
}

export async function checkLiveSite(base, indexHtml, fetchImpl = fetch) {
  const assets = expectedAssets(indexHtml);
  if (assets.length !== 3) throw new Error(`Expected 3 versioned assets in index.html, found ${assets.length}.`);
  const results = [];
  for (const check of buildChecks(base, assets)) results.push(await runCheck(check, fetchImpl));
  return results;
}

function report(base, results) {
  const icon = (r) => (r.ok ? 'PASS' : r.required ? 'FAIL' : 'WARN');
  const lines = results.map((r) => `${icon(r)}  ${r.name}: ${r.detail}`);
  console.log(`Live site check for ${base}\n${lines.join('\n')}`);
  const table = ['| Result | Check | Detail |', '|---|---|---|', ...results.map((r) => `| ${icon(r)} | ${r.name} | ${r.detail} |`)];
  return `### Live site check: ${base}\n\n${table.join('\n')}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = process.argv[2] || 'https://assistall.ai';
  const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const results = await checkLiveSite(base, indexHtml);
  const summary = report(base, results);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  const failed = results.filter((r) => r.required && !r.ok);
  if (failed.length) {
    console.error(`::error::${failed.length} required live check(s) failed: ${failed.map((r) => r.name).join(', ')}`);
    process.exitCode = 1;
  }
}
