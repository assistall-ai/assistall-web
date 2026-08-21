import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');

test('capture runner uses a disposable loopback app and local media tooling', () => {
  const runnerPath = resolve(root, 'tools', 'capture-workflow-media.ps1');
  const helperPath = resolve(root, 'tools', 'capture_workflow_media.py');
  assert.ok(existsSync(runnerPath), 'expected the PowerShell capture runner');
  assert.ok(existsSync(helperPath), 'expected the Playwright capture helper');

  const runner = readFileSync(runnerPath, 'utf8');
  const helper = readFileSync(helperPath, 'utf8');
  assert.match(runner, /WADIH_AI_DATA_DIR/);
  assert.match(runner, /SENTINEL_DB/);
  assert.match(runner, /DESK_CONFIG/);
  assert.match(runner, /seed-capture-fixtures/);
  assert.match(runner, /127\.0\.0\.1/);
  assert.match(runner, /ffmpeg/);
  assert.match(runner, /ffmpeg\.exe -v error/);
  assert.match(runner, /assistall-capture-/);
  assert.match(helper, /sync_playwright/);
  assert.match(helper, /assistall-session/);
  assert.match(helper, /playwright\.request\.new_context/);
  assert.match(helper, /\/api\/login/);
  assert.match(helper, /\/api\/preferences/);
  assert.match(helper, /add_init_script/);
  assert.match(helper, /WORKFLOW_ACTIONS/);
  assert.match(helper, /WORKFLOW_VIEWER_ACTIONS/);
  assert.match(helper, /Northstar Renewal Terms Review\.png/);
  assert.match(helper, /Container Seal Inspection\.png/);
  assert.match(helper, /Daily Sales Report\.png/);
  assert.match(helper, /get_by_role\("button", name=action_label\)\.click\(\)/);
  assert.match(helper, /locator\(WORKFLOW_VIEWER_ACTIONS\[workflow\]\)\.click\(\)/);
  assert.match(helper, /#evidence-viewer/);
  assert.match(helper, /name="Close"/);
  assert.match(helper, /#main-content h1/);
  assert.match(runner, /-t 7\.5/);
  assert.match(runner, /-ss 3\.2/);
});
