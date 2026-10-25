// Loads the simulation block of index.html as-is into a Node VM and returns its exports.
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
export const INDEX = path.join(here, '..', 'index.html');
export function readIndex() { return fs.readFileSync(INDEX, 'utf8'); }
export function scriptBlocks(html) { const out = []; const re = /<script>([\s\S]*?)<\/script>/g; let m; while ((m = re.exec(html))) out.push(m[1]); return out; }
export function loadSim(html) {
  html = html || readIndex();
  const blocks = scriptBlocks(html);
  const sim = blocks.find(b => b.includes('Hold My Loot v2: simulation'));
  if (!sim) throw new Error('simulation block not found');
  const module = { exports: {} };
  const ctx = vm.createContext({ module, exports: module.exports, console, Math, Date, process: { env: {} }, typeof: undefined });
  vm.runInContext(sim, ctx, { filename: 'index.html#sim' });
  return module.exports;
}
export function buildNumber(html) { const m = /name="hml-build" content="(\d+)"/.exec(html || readIndex()); return m ? +m[1] : 0; }
