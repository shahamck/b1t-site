// Footer wordmark drawn in characters: a slow light sweeps across it, the cursor sets letters alight.
import { makeAtlas, CHARS, NEUTRAL, rand, maskFromImage } from './glyphs.js';
import { logoImage, LOGO_ASPECT } from './logo.js';

export async function createFootWord(canvas, { reduced = false } = {}) {
  const ctx = canvas.getContext('2d');
  const img = await logoImage();
  let W, H, dpr, CW, CH, cols, rows, atlas, cells = [];
  let mx = -1e4, my = -1e4, active = false, start = 0;

  function resize() {
    W = canvas.clientWidth;
    const small = W < 700;
    CW = small ? 6 : 9; CH = small ? 9 : 13;
    dpr = Math.min(devicePixelRatio || 1, 2);
    atlas = makeAtlas({ size: small ? 7.5 : 10.5, cw: CW, ch: CH, weight: 600, dpr });
    cols = Math.floor(W / CW);
    // The logo spans the width; its height in rows is shrunk by the cell aspect
    const w = cols * 0.96, h = (w * CW) / LOGO_ASPECT / CH;
    rows = Math.ceil(h) + 2;
    H = rows * CH;
    canvas.style.height = `${H}px`;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const mask = maskFromImage(img, cols, rows, { x: (cols - w) / 2, y: 1, w, h });
    cells = [];
    for (let i = 0; i < mask.length; i++) if (mask[i]) cells.push({ c: i % cols, r: (i / cols) | 0, g: rand(CHARS.length), next: Math.random() * 3, s: Math.random() });
  }

  function frame(t, reveal) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const rect = canvas.getBoundingClientRect();
    const px = mx - rect.left, py = my - rect.top;
    const sweep = ((t * 0.12) % 1.6 - 0.3) * cols;
    const ox = (W - cols * CW) / 2;
    for (const k of cells) {
      if (k.s > reveal) continue;
      const x = ox + k.c * CW, y = k.r * CH;
      const hot = Math.max(0, 1 - Math.hypot(x - px, y - py) / 130);
      const band = Math.max(0, 1 - Math.abs(k.c - sweep - k.r * 0.6) / 14);
      let color = 3 + Math.round(band * 4);
      if (hot > 0.15) color = NEUTRAL + 2 + Math.min(3, (hot * 4.5) | 0);
      if (t > k.next) { k.g = rand(CHARS.length); k.next = t + (hot > 0.1 ? 0.05 + Math.random() * 0.1 : 1.5 + Math.random() * 4); }
      atlas.draw(ctx, k.g, color, x, y);
    }
  }

  const t0 = performance.now();
  const frameGap = matchMedia('(pointer: coarse)').matches || innerWidth < 700 ? 1000 / 30 : 0;
  let last = 0;
  (function loop(now) {
    requestAnimationFrame(loop);
    if (!active || now - last < frameGap - 2) return;
    last = now;
    if (!start) start = now;
    frame(reduced ? 0 : (now - t0) / 1000, Math.min(1, (now - start) / 1400));
  })(t0);

  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  new IntersectionObserver(([en]) => { active = en.isIntersecting; }).observe(canvas);
  let lastW = 0;
  new ResizeObserver(() => { if (canvas.clientWidth !== lastW) { lastW = canvas.clientWidth; resize(); } }).observe(canvas);
}
