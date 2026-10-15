// Pull the website's cPanel repository from GitHub and deploy it, through cPanel UAPI.
//
//   node tools/cpanel-deploy.mjs --check-only   reads the repository status; changes nothing
//   node tools/cpanel-deploy.mjs                pulls, verifies the commit, then deploys
//
// Settings come from the environment, never from arguments, so they stay out of logs:
//   CPANEL_HOST       server address from the cPanel login URL (no https://, no port)
//   CPANEL_USER       cPanel username
//   CPANEL_API_TOKEN  cPanel API token (Security > Manage API Tokens)
//   CPANEL_REPO_ROOT  "Repository Path" from Git Version Control, e.g. /home/user/repositories/assistall-web
//   CPANEL_PORT       optional, defaults to 2083
//   EXPECTED_SHA      commit the deploy must match (GitHub sets it to the run's commit)
//   DEPLOY_BRANCH     optional, defaults to main

import { pathToFileURL } from 'node:url';

const DEPLOY_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 5000;

export function readSettings(env = process.env) {
  const required = ['CPANEL_HOST', 'CPANEL_USER', 'CPANEL_API_TOKEN', 'CPANEL_REPO_ROOT'];
  const missing = required.filter((name) => !env[name]?.trim());
  if (missing.length) throw new Error(`Missing settings: ${missing.join(', ')}`);
  const host = env.CPANEL_HOST.trim().replace(/^https?:\/\//, '').replace(/[:/].*$/, '');
  return {
    host,
    port: env.CPANEL_PORT?.trim() || '2083',
    user: env.CPANEL_USER.trim(),
    token: env.CPANEL_API_TOKEN.trim(),
    repositoryRoot: env.CPANEL_REPO_ROOT.trim().replace(/\/+$/, ''),
    branch: env.DEPLOY_BRANCH?.trim() || 'main',
    expectedSha: env.EXPECTED_SHA?.trim() || '',
  };
}

export function commitMatches(actual, expected) {
  if (!actual || !expected) return false;
  const a = actual.toLowerCase();
  const e = expected.toLowerCase();
  return a.length >= 7 && e.length >= 7 && (a.startsWith(e) || e.startsWith(a));
}

export function deploymentOutcome(entry) {
  const stamps = entry?.timestamps ?? {};
  if (stamps.succeeded) return 'succeeded';
  if (stamps.failed) return 'failed';
  if (stamps.canceled) return 'canceled';
  return 'running';
}

async function uapi(settings, module, fn, params = {}) {
  const url = new URL(`https://${settings.host}:${settings.port}/execute/${module}/${fn}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `cpanel ${settings.user}:${settings.token}` },
      signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    throw new Error(`Could not reach cPanel at ${settings.host}:${settings.port} (${error.cause?.code || error.message}). Check CPANEL_HOST and that the host allows API access on this port.`);
  }
  const text = await response.text();
  if (response.status === 401 || response.status === 403) throw new Error(`cPanel refused the login (HTTP ${response.status}). Check CPANEL_USER and CPANEL_API_TOKEN.`);
  let body;
  try { body = JSON.parse(text); } catch { throw new Error(`${module}/${fn} returned HTTP ${response.status} and no JSON.`); }
  if (body.status !== 1) throw new Error(`${module}/${fn} failed: ${(body.errors || ['unknown error']).join('; ')}`);
  return body.data;
}

async function findRepository(settings) {
  const repositories = await uapi(settings, 'VersionControl', 'retrieve');
  const repository = (repositories || []).find((item) => item.repository_root?.replace(/\/+$/, '') === settings.repositoryRoot);
  if (!repository) throw new Error(`No cPanel repository at ${settings.repositoryRoot}. Copy "Repository Path" from Git Version Control > Manage.`);
  return repository;
}

function describe(state) {
  if (!state?.identifier) return 'none recorded';
  const seconds = Number(state.date);
  const when = Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : String(state.date || 'unknown date');
  return `${state.identifier.slice(0, 7)} (${when})${state.message ? ` "${String(state.message).split('\n')[0]}"` : ''}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function run({ checkOnly = false, env = process.env, log = console.log } = {}) {
  const settings = readSettings(env);
  const before = await findRepository(settings);
  log(`Connected to cPanel as ${settings.user}.`);
  log(`Repository branch: ${before.branch}; deployable: ${before.deployable ? 'yes' : 'no'}`);
  log(`Last fetched from GitHub: ${describe(before.last_update)}`);
  log(`Last deployed: ${describe(before.last_deployment?.repository_state)}`);
  if (checkOnly) {
    log('Check only: nothing was pulled or deployed.');
    return { deployed: false };
  }
  if (!settings.expectedSha) throw new Error('EXPECTED_SHA is required for a deploy.');

  log(`Pulling ${settings.branch} from GitHub...`);
  await uapi(settings, 'VersionControl', 'update', { repository_root: settings.repositoryRoot, branch: settings.branch });
  const pulled = await findRepository(settings);
  const pulledSha = pulled.last_update?.identifier;
  if (!commitMatches(pulledSha, settings.expectedSha)) {
    throw new Error(`cPanel has ${pulledSha?.slice(0, 7) || 'no commit'} but this run is for ${settings.expectedSha.slice(0, 7)}. Nothing was deployed. If main moved on, start a new run.`);
  }
  if (!pulled.deployable) throw new Error('cPanel says the repository is not deployable (needs a clean checkout and .cpanel.yml). Nothing was deployed.');
  log(`cPanel now has ${pulledSha.slice(0, 7)}, matching this run.`);

  const created = await uapi(settings, 'VersionControlDeployment', 'create', { repository_root: settings.repositoryRoot });
  const deployId = String(created.deploy_id);
  log(`Deployment ${deployId} queued.`);
  const deadline = Date.now() + DEPLOY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    const deployments = await uapi(settings, 'VersionControlDeployment', 'retrieve');
    const entry = (deployments || []).find((item) => String(item.deploy_id) === deployId);
    const outcome = deploymentOutcome(entry);
    if (outcome === 'succeeded') { log(`Deployment ${deployId} succeeded.`); return { deployed: true, sha: pulledSha }; }
    if (outcome !== 'running') throw new Error(`Deployment ${deployId} ${outcome}. cPanel log: ${entry.log_path || 'see Git Version Control > Pull or Deploy'}.`);
  }
  throw new Error(`Deployment ${deployId} did not finish within ${DEPLOY_TIMEOUT_MS / 60000} minutes. Check Git Version Control > Pull or Deploy in cPanel.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run({ checkOnly: process.argv.includes('--check-only') }).catch((error) => {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  });
}
