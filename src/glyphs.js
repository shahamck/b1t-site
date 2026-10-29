// Shared glyph atlas: every character pre-rendered once per colour, then blitted with drawImage.
export const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// System monospace: no font download for the character art
export const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};
const ramp = (a, b, n) => Array.from({ length: n }, (_, i) => mix(a, b, i / (n - 1)));

// Drawn on B1T blue: 0..7 faint blue → white, 8..13 pale → pure white for highlights
export const NEUTRAL = 8;
export const ACCENT = 6;
export const PALETTE = [...ramp('#3866f3', '#ffffff', NEUTRAL), ...ramp('#6f93f7', '#ffffff', ACCENT - 1), '#ffffff'];

export function makeAtlas({ size, cw, ch, weight = 500, dpr }) {
  const cols = CHARS.length;
  const c = document.createElement('canvas');
  c.width = Math.ceil(cols * cw * dpr);
  c.height = Math.ceil(PALETTE.length * ch * dpr);
  const x = c.getContext('2d');
  x.scale(dpr, dpr);
  x.font = `${weight} ${size}px ${MONO}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  PALETTE.forEach((col, r) => {
    x.fillStyle = col;
    for (let i = 0; i < cols; i++) x.fillText(CHARS[i], i * cw + cw / 2, r * ch + ch / 2 + 0.5);
  });
  const sw = cw * dpr, sh = ch * dpr;
  return {
    cols,
    draw(ctx, glyph, color, px, py) {
      ctx.drawImage(c, glyph * sw, color * sh, sw, sh, px, py, cw, ch);
    },
  };
}

// Rasterise an image into a cols × rows coverage mask. The box is in grid cells; cells are taller
// than wide, so callers pass a box whose height is already divided by the cell aspect.
export function maskFromImage(img, cols, rows, box) {
  const m = document.createElement('canvas');
  m.width = cols; m.height = rows;
  const c = m.getContext('2d', { willReadFrequently: true });
  c.drawImage(img, box.x, box.y, box.w, box.h);
  const d = c.getImageData(0, 0, cols, rows).data;
  const out = new Uint8Array(cols * rows);
  for (let i = 0; i < out.length; i++) out[i] = d[i * 4 + 3] > 120 ? 1 : 0;
  return out;
}

export const rand = (n) => (Math.random() * n) | 0;
export const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
