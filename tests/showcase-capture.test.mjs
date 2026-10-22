import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tool = (name) => readFile(new URL(`../tools/showcase/${name}`, import.meta.url), 'utf8');

test('the showcase seeder only ever fills a temporary capture folder', async () => {
  const seeder = await tool('seed_showcase_company.py');
  assert.match(seeder, /DATA\.parent != Path\(tempfile\.gettempdir\(\)\)\.resolve\(\) or not DATA\.name\.startswith\("assistall-capture-"\)/);
  assert.match(seeder, /COMPANY = "Cedarvale Trading LLC"/);
  const app = await tool('run_showcase_app.py');
  for (const setting of ['WADIH_AI_DATA_DIR', 'WADIH_AI_LICENSE_FILE', 'SENTINEL_DB', 'DESK_CONFIG', 'WORKFLOWS_DB', 'AUTOMATIONS_DB']) {
    assert.match(app, new RegExp(`"${setting}": str\\(DATA`), `${setting} points into the throwaway folder`);
  }
});

test('clips are sharp, paced, sped up 1.4x and checked for blinks', async () => {
  const screencast = await tool('screencast.py');
  assert.match(screencast, /Page\.startScreencast/);
  assert.match(screencast, /speed: float = 1\.4/);
  const videos = await tool('capture_videos.py');
  assert.match(videos, /CURSOR|cursor=True/);
  assert.match(videos, /scrollIntoView\(\{behavior: 'smooth'/);
  for (const clip of ['build', 'library', 'approve', 'board', 'reply']) assert.match(videos, new RegExp(`"${clip}": clip_${clip}`));
  const check = await tool('flicker_check.py');
  assert.match(check, /blinks at/);
});
