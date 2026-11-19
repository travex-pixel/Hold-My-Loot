// Render videos to marketing/video/out/*.mp4.  node marketing/video/build.mjs ep01 ep02 ...  |  all  |  crew
import { EPISODES } from './episodes.mjs';
import { renderEpisode } from './lib/compose.mjs';
import { openBrowser } from './lib/capture.mjs';
const args = process.argv.slice(2);
const keys = [...new Set(args.flatMap(a => a === 'all' ? Object.keys(EPISODES) : a === 'crew' ? Object.keys(EPISODES).filter(k => k.startsWith('crew_')) : [a]))].filter(k => { if (!EPISODES[k]) console.log('unknown video', k); return !!EPISODES[k]; });
const b = await openBrowser();
const q = keys.slice(), par = Math.min(+process.env.PAR || 2, q.length);
await Promise.all(Array.from({ length: par }, async () => { while (q.length) { const k = q.shift(); try { const r = await renderEpisode(JSON.parse(JSON.stringify(EPISODES[k])), { browser: b }); console.log('rendered', k, JSON.stringify(r)); } catch (e) { console.log('FAILED', k, e.stack.split('\n').slice(0, 3).join(' | ')); } } }));
await b.close();
