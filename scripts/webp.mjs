// Encode public/work/*.jpg into WebP at two widths using headless Chrome's encoder.
// Usage: node scripts/webp.mjs   → public/work/<name>-1200.webp and <name>-640.webp
import { spawn } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import WS from 'ws';

const dir = resolve('public/work');
const files = readdirSync(dir).filter((f) => f.endsWith('.jpg'));
const port = 9333 + Math.floor(Math.random() * 500);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--allow-file-access-from-files', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/b1t-webp-${port}`, 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 40 && !ws; i++) {
  await sleep(250);
  try { const t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const p = t.find((x) => x.type === 'page'); if (p) ws = new WS(p.webSocketDebuggerUrl); } catch {}
}
await new Promise((r) => ws.on('open', r));
let id = 0; const pending = new Map();
ws.on('message', (d) => { const m = JSON.parse(String(d)); if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
await send('Page.navigate', { url: `file://${dir}/` });
await sleep(800);

for (const f of files) {
  for (const [w, q] of [[1200, 0.8], [640, 0.76]]) {
    const expr = `(async () => {
      const im = new Image(); im.src = 'file://${dir}/${f}'; await im.decode();
      const W = Math.min(${w}, im.naturalWidth), H = Math.round(im.naturalHeight * W / im.naturalWidth);
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, W, H);
      return c.toDataURL('image/webp', ${q}).split(',')[1];
    })()`;
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    const out = `${dir}/${f.replace('.jpg', '')}-${w}.webp`;
    writeFileSync(out, Buffer.from(r.result.value, 'base64'));
    console.log(out.split('/').pop(), Math.round(Buffer.from(r.result.value, 'base64').length / 1024) + ' KB');
  }
}
chrome.kill();
process.exit(0);
