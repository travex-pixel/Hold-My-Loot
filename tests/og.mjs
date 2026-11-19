// Link previews (X, Discord, iMessage, WhatsApp, Facebook): checks the tags and the preview image in the repo
// against what those apps need. The live check is in LAUNCH.md (paste the URL into each app once after deploy).
import fs from 'fs'; import path from 'path';
const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const meta = (attr, key) => (new RegExp('<meta ' + attr + '="' + key.replace(/[:.]/g, '\\$&') + '" content="([^"]*)"').exec(html) || [])[1];
const results = []; const check = (name, ok, extra) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra ? '  (' + extra + ')' : '')); };
const img = meta('property', 'og:image'), title = meta('property', 'og:title'), desc = meta('property', 'og:description');
check('og:title is set and fits a preview (<= 70 chars)', !!title && title.length <= 70, title);
check('og:description is set and short (<= 200 chars)', !!desc && desc.length <= 200, desc && desc.length + ' chars');
check('og:url and canonical point at https://holdmyloot.com/', meta('property', 'og:url') === 'https://holdmyloot.com/' && /<link rel="canonical" href="https:\/\/holdmyloot\.com\/">/.test(html));
check('og:image is an absolute https URL (WhatsApp and iMessage ignore relative ones)', /^https:\/\//.test(img || ''), img);
check('twitter:card is summary_large_image with its own image', meta('name', 'twitter:card') === 'summary_large_image' && !!meta('name', 'twitter:image'));
const file = path.join(root, new URL(img).pathname);
const buf = fs.existsSync(file) ? fs.readFileSync(file) : null;
check('the preview image is in the repo, so it deploys with the page', !!buf, file);
if (buf) {
  // JPEG size from the SOF marker
  let w = 0, h = 0; for (let i = 2; i < buf.length - 9;) { if (buf[i] !== 0xFF) { i++; continue; } const m = buf[i + 1], len = buf.readUInt16BE(i + 2); if (m >= 0xC0 && m <= 0xC3) { h = buf.readUInt16BE(i + 5); w = buf.readUInt16BE(i + 7); break; } i += 2 + len; }
  check('the image is 1200x630, as declared', w === 1200 && h === 630 && meta('property', 'og:image:width') === '1200' && meta('property', 'og:image:height') === '630', w + 'x' + h);
  check('the image is under 300 KB (WhatsApp drops bigger previews)', buf.length < 300 * 1024, Math.round(buf.length / 1024) + ' KB');
}
check('og:image:alt describes the image', (meta('property', 'og:image:alt') || '').length > 20);
console.log(results.every(Boolean) ? 'ALL PASS' : 'SOME FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
