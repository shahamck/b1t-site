// The hero canvas: two arms reach in from the edges until their fingertips almost touch around a spark.
// Scrolling pulls the hands apart, the spark swells into a ball of characters, and the ball resolves into B1T.
import { makeAtlas, CHARS, NEUTRAL, rand, smooth, maskFromImage } from './glyphs.js';
import { drawHands } from './hands.js';
import { logoImage, LOGO_ASPECT } from './logo.js';

const A0 = NEUTRAL; // first highlight row

// Light with a Gaussian falloff: no visible edge or ring where it meets the blue
function softGlow(ctx, x, y, R, rgb, peak) {
  if (R < 1 || peak <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, R);
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    g.addColorStop(t, `rgba(${rgb},${(peak * Math.exp(-7 * t * t)).toFixed(4)})`);
  }
  ctx.fillStyle = g;
  ctx.fillRect(x - R, y - R, R * 2, R * 2);
}

export async function createStage(canvas, { reduced = false } = {}) {
  const ctx = canvas.getContext('2d');
  const img = await logoImage();
  const state = { p: 0, mx: -1e4, my: -1e4, active: true, visible: true, dirty: true, heroBottom: 0 };
  // Phones and tablets draw at 30 fps; the characters only change a few times a second anyway
  const frameGap = matchMedia('(pointer: coarse)').matches || innerWidth < 700 ? 1000 / 30 : 0;
  let W, H, dpr, CW, CH, cols, rows, ox, oy, atlas, small;
  let glyph, seed, seed2, next, logo;
  const sharp = document.createElement('canvas'), soft = document.createElement('canvas');
  const sx = sharp.getContext('2d', { willReadFrequently: true }), fx = soft.getContext('2d', { willReadFrequently: true });

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    small = W < 700;
    CW = small ? 7 : 8; CH = small ? 11 : 12;
    atlas = makeAtlas({ size: small ? 9 : 10, cw: CW, ch: CH, dpr });
    cols = Math.ceil(W / CW); rows = Math.ceil(H / CH);
    ox = (W - cols * CW) / 2; oy = (H - rows * CH) / 2;
    sharp.width = soft.width = cols; sharp.height = soft.height = rows;
    const n = cols * rows;
    glyph = new Uint8Array(n); seed = new Float32Array(n); seed2 = new Float32Array(n); next = new Float32Array(n);
    for (let i = 0; i < n; i++) { glyph[i] = rand(CHARS.length); seed[i] = Math.random(); seed2[i] = Math.random(); next[i] = Math.random() * 4; }

    // The wordmark, centred a little above the middle; its height in rows is shrunk by the cell aspect
    const w = Math.min(W * (small ? 0.74 : 0.42), 600) / CW;
    const h = (w * CW) / LOGO_ASPECT / CH;
    logo = maskFromImage(img, cols, rows, { x: (cols - w) / 2, y: (H * 0.44 - oy) / CH - h / 2, w, h });
    state.dirty = true;
  }

  function frame(t) {
    const p = state.p;
    // Choreography
    const apart = smooth(0.03, 0.42, p);
    const fade = smooth(0.14, 0.44, p);
    const orb = smooth(0.1, 0.42, p) * (1 - smooth(0.5, 0.72, p));
    const mark = smooth(0.44, 0.7, p);
    const U = small ? Math.max(W * 0.5, H * 0.3) : W * 0.5;
    const cx = W * 0.5;
    // Meet below the intro text, even on short landscape screens where 80% of the height would overlap it
    const cy0 = Math.max(H * (small ? 0.87 : 0.8), state.heroBottom + U * 0.36);
    const cy = cy0 + (H * 0.44 - cy0) * smooth(0.02, 0.4, p);
    const breathe = reduced ? 0 : Math.sin(t * 0.9) * 0.005;

    // Rasterise both hands into a sharp mask (inside test) and a soft one (shading); skipped once they've faded
    const handsOn = fade < 1;
    if (handsOn) for (const [c2, blur] of [[sx, 0], [fx, small ? 1.6 : 2.2]]) {
      c2.setTransform(1, 0, 0, 1, 0, 0);
      c2.clearRect(0, 0, cols, rows);
      c2.filter = blur ? `blur(${blur}px)` : 'none';
      c2.fillStyle = '#fff';
      c2.setTransform(U / CW, 0, 0, U / CH, (cx - ox) / CW, (cy - oy) / CH);
      drawHands(c2, { gap: small ? 0.09 : 0.075, s: small ? 0.2 : 0.18, spread: apart * 0.75 + breathe, liftL: breathe * 0.6 + apart * 0.05, liftR: -breathe * 0.6 - apart * 0.08, carve: blur ? 0 : (CH * 0.5) / U });
    }
    const hs = handsOn ? sx.getImageData(0, 0, cols, rows).data : null, hf = handsOn ? fx.getImageData(0, 0, cols, rows).data : null;

    const rect = canvas.getBoundingClientRect();
    const px = state.mx - rect.left, py = state.my - rect.top;
    const reach = small ? 90 : 150;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Spark between the fingertips, then the swelling orb
    const pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(t * 2.4);
    const spx = cx, spy = cy - 0.01 * U;
    const glowR = (small ? 70 : 120) * pulse * (1 - fade * 0.4) + orb * U * 0.32;
    if (mark < 1) {
      const k = 1 - mark;
      softGlow(ctx, spx, spy, glowR * 2.2, '190,208,255', 0.2 * k); // wide haze
      softGlow(ctx, spx, spy, glowR * 0.45, '255,255,255', 0.5 * k); // the spark itself
    }
    if (px > -reach * 2 && px < W + reach * 2 && py > -reach * 2 && py < H + reach * 2) softGlow(ctx, px, py, reach * 1.8, '255,255,255', 0.12);

    const orbR = orb * U * (small ? 0.3 : 0.17);
    const n = cols * rows;
    for (let i = 0; i < n; i++) {
      const c = i % cols, r = (i / cols) | 0;
      const x = ox + c * CW + CW / 2, y = oy + r * CH + CH / 2;
      const qx = x - px, qy = y - py;
      const near = Math.max(0, 1 - Math.sqrt(qx * qx + qy * qy) / reach);
      const boost = near * near;
      const dsx = x - spx, dsy = y - spy, ds = Math.sqrt(dsx * dsx + dsy * dsy);

      let color = -1, rate = 4;
      if (logo[i] && seed2[i] < mark) {
        color = A0 + 5 - (seed[i] < 0.2 ? 1 : 0);
        rate = 5;
      } else if (handsOn && hs[i * 4 + 3] > 80 && seed[i] > fade) {
        // Hand: soft mask height + its slope for light from the upper left
        const h = hf[i * 4 + 3] / 255;
        const gx = (c > 0 && c < cols - 1) ? (hf[(i + 1) * 4 + 3] - hf[(i - 1) * 4 + 3]) / 255 : 0;
        const gy = (r > 0 && r < rows - 1) ? (hf[(i + cols) * 4 + 3] - hf[(i - cols) * 4 + 3]) / 255 : 0;
        const shade = 0.5 + (gx * 0.9 + gy * 1.1) * 0.9;
        const grain = 0.5 + 0.5 * Math.sin(c * 0.37 + r * 0.91 + t * 0.4) * Math.sin(c * 0.13 - r * 0.29);
        let I = Math.pow(h, 0.7) * (0.35 + shade * 0.55) + grain * 0.18 + (seed[i] - 0.5) * 0.16;
        I += Math.max(0, 1 - ds / (U * 0.22)) * 0.5; // the spark lights the fingertips
        I += boost * 0.5;
        if (I > 0.05) color = Math.max(0, Math.min(NEUTRAL - 1, (I * NEUTRAL) | 0));
        if (boost > 0.4) color = A0 + 4;
        rate = 3;
      } else if (orbR > 2 && ds < orbR * 1.5 && seed2[i] >= mark) {
        // Orb: dense core, ragged rim
        const k = ds / orbR;
        if (k < 1 ? seed[i] < 1.05 - k * 0.5 : seed[i] < (1.5 - k) * 0.6) color = A0 + Math.max(0, Math.min(5, ((1.2 - k) * 5) | 0));
        rate = 0.3;
      } else if (mark < 1 && ds < glowR * 0.55 && seed[i] < 0.22 * (1 - ds / (glowR * 0.55)) * (1 - mark)) {
        color = A0 + 2 + (seed2[i] * 3 | 0); // sparks hanging around the gap
        rate = 0.4;
      } else if (seed[i] < 0.01 && Math.sin(t * 1.4 + seed2[i] * 90) > 0.2) {
        color = 1 + (seed2[i] * 2 | 0); // faint background bits
      } else if (seed2[i] < boost * 0.4) {
        color = A0 + 1 + (boost * 3 | 0); // the cursor turns up hidden characters
        rate = 2;
      }

      if (color < 0) continue;
      if (t > next[i]) {
        glyph[i] = rand(CHARS.length);
        next[i] = t + (boost > 0.15 ? 0.04 + Math.random() * 0.12 : rate * (0.4 + Math.random()));
      }
      atlas.draw(ctx, glyph[i], color, ox + c * CW, oy + r * CH);
    }
  }

  resize();
  const t0 = performance.now();
  let last = 0;
  (function loop(now) {
    requestAnimationFrame(loop);
    if (!state.active || !state.visible) return;
    if (reduced && !state.dirty) return;
    if (now - last < frameGap - 2) return;
    last = now;
    state.dirty = false;
    frame(reduced ? 0 : (now - t0) / 1000);
  })(t0);

  addEventListener('pointermove', (e) => { state.mx = e.clientX; state.my = e.clientY; state.dirty = true; }, { passive: true });
  document.addEventListener('pointerleave', () => { state.mx = state.my = -1e4; });
  // Mobile browser bars change the height while scrolling; only rebuild for real size changes
  let lastW = 0, lastH = 0;
  new ResizeObserver(() => {
    const r = canvas.getBoundingClientRect();
    if (r.width === lastW && Math.abs(r.height - lastH) < 140) return;
    lastW = r.width; lastH = r.height;
    resize();
  }).observe(canvas);
  new IntersectionObserver(([en]) => { state.active = en.isIntersecting; }).observe(canvas.parentElement);

  return {
    set progress(v) { state.p = v; state.dirty = true; },
    set visible(v) { state.visible = v; state.dirty = true; },
    set heroBottom(v) { state.heroBottom = v; state.dirty = true; },
  };
}
