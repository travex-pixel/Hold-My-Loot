// Every inline script in index.html parses, the file ends with </html>, and the build number is in both places.
import vm from 'vm';
import { readIndex, scriptBlocks, buildNumber } from './load-sim.mjs';
const html = readIndex(); let ok = true;
scriptBlocks(html).forEach((b, i) => { try { new vm.Script(b, { filename: 'index.html#script' + i }); } catch (e) { ok = false; console.log('script', i, 'does not parse:', e.message); } });
if (!/<\/html>\s*$/.test(html)) { ok = false; console.log('file does not end with </html>'); }
const meta = buildNumber(html), js = +(/window\.HML_BUILD = (\d+);/.exec(html) || [])[1];
if (meta !== js) { ok = false; console.log('build mismatch: meta', meta, 'HML_BUILD', js); }
console.log(ok ? 'PASS syntax (build ' + meta + ', ' + scriptBlocks(html).length + ' scripts)' : 'FAIL'); process.exit(ok ? 0 : 1);
