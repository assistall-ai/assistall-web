// Render tools/social-card/card.html to assets/social-share.png (1200 x 627), the picture shown when
// assistall.ai is shared on LinkedIn and elsewhere. Windows only: it uses headless Microsoft Edge.
//
//   node tools/social-card/build.mjs
//
// Aptos is not a system font on most PCs. When Office has cached it locally, its files are embedded
// for the render (Aptos Display Bold stands in for the bold weight); otherwise the card falls back to Segoe UI.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WIDTH = 1200;
const HEIGHT = 627;
const here = fileURLToPath(new URL('.', import.meta.url));
const output = fileURLToPath(new URL('../../assets/social-share.png', import.meta.url));

const edge = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!edge) throw new Error('Microsoft Edge was not found.');

// Weight and italic flag from a TrueType file's OS/2 table.
function fontStyle(buffer) {
  const tables = buffer.readUInt16BE(4);
  for (let i = 0; i < tables; i += 1) {
    const record = 12 + i * 16;
    if (buffer.toString('latin1', record, record + 4) !== 'OS/2') continue;
    const os2 = buffer.readUInt32BE(record + 8);
    return { weight: buffer.readUInt16BE(os2 + 4), italic: (buffer.readUInt16BE(os2 + 62) & 1) === 1 };
  }
  return null;
}

function aptosFaces() {
  const cache = join(process.env.LOCALAPPDATA || '', 'Microsoft', 'FontCache', '4', 'CloudFonts');
  const chosen = new Map();
  // Plain Aptos first, so it wins any weight both folders have.
  for (const folder of ['Aptos', 'Aptos Display']) {
    const dir = join(cache, folder);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).filter((file) => file.endsWith('.ttf'))) {
      const buffer = readFileSync(join(dir, name));
      const style = fontStyle(buffer);
      if (!style || style.italic || ![400, 700].includes(style.weight) || chosen.has(style.weight)) continue;
      if (folder === 'Aptos Display' && style.weight === 400) continue;
      chosen.set(style.weight, buffer);
    }
  }
  return [...chosen].map(([weight, buffer]) =>
    `@font-face{font-family:"Aptos";font-weight:${weight};src:url(data:font/ttf;base64,${buffer.toString('base64')}) format("truetype")}`);
}

const faces = aptosFaces();
const html = readFileSync(join(here, 'card.html'), 'utf8').replace('<!--FONTS-->', faces.length ? `<style>${faces.join('')}</style>` : '');
const work = mkdtempSync(join(tmpdir(), 'assistall-card-'));
try {
  const page = join(work, 'card.html');
  writeFileSync(page, html);
  rmSync(output, { force: true });
  execFileSync(edge, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${WIDTH},${HEIGHT}`, '--virtual-time-budget=3000', `--user-data-dir=${join(work, 'profile')}`,
    `--screenshot=${output}`, pathToFileURL(page).href,
  ], { stdio: 'ignore' });
  // msedge.exe can hand the work to another process and return early, so wait for the picture.
  const deadline = Date.now() + 30000;
  while (!existsSync(output) && Date.now() < deadline) await sleep(250);
  await sleep(1000);
} finally {
  rmSync(work, { recursive: true, force: true });
}

const png = readFileSync(output);
const size = `${png.readUInt32BE(16)} x ${png.readUInt32BE(20)}`;
if (size !== `${WIDTH} x ${HEIGHT}`) throw new Error(`Rendered ${size}, expected ${WIDTH} x ${HEIGHT}.`);
console.log(`Wrote assets/social-share.png (${size}, ${Math.round(png.length / 1024)} KB, ${faces.length ? 'Aptos' : 'Segoe UI fallback'}).`);
