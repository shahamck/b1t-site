// Two reaching hands, built from tapered capsules. Hand poses are in "finger units" with the index
// fingertip at the origin; arms (shoulder → elbow) are in stage units of half the viewport width.
const LEFT = {
  // relaxed, fingers drooping, index reaching right
  palm: [[-2.35, -0.6, 0.44], [-1.3, -0.3, 0.4]],
  fingers: [
    [[-1.2, -0.45, 0.17], [-0.62, -0.26, 0.15], [0, 0, 0.12]],
    [[-1.22, -0.2, 0.17], [-0.68, 0.12, 0.15], [-0.48, 0.58, 0.12]],
    [[-1.3, 0.03, 0.16], [-0.9, 0.4, 0.14], [-0.8, 0.82, 0.11]],
    [[-1.45, 0.24, 0.14], [-1.15, 0.56, 0.12], [-1.1, 0.86, 0.1]],
    [[-2.05, -0.72, 0.21], [-1.5, -0.84, 0.17], [-1.02, -0.7, 0.13]], // thumb
  ],
  arm: [[-1.3, 0.14, 0.115], [-0.74, -0.15, 0.088]],
};
const RIGHT = {
  // index pointing left, the rest curled under
  palm: [[2.45, -0.72, 0.45], [1.32, -0.32, 0.4]],
  fingers: [
    [[1.25, -0.45, 0.17], [0.62, -0.2, 0.15], [0, 0, 0.12]],
    [[1.25, -0.18, 0.17], [0.82, 0.28, 0.15], [1.02, 0.66, 0.12]],
    [[1.34, 0.04, 0.16], [1.0, 0.46, 0.14], [1.18, 0.8, 0.11]],
    [[1.48, 0.24, 0.14], [1.22, 0.6, 0.12], [1.36, 0.88, 0.1]],
    [[2.1, -0.82, 0.21], [1.55, -0.8, 0.17], [1.08, -0.58, 0.13]], // thumb
  ],
  arm: [[1.36, -0.27, 0.115], [0.8, -0.19, 0.088]],
};

// Filled tapered capsule from (ax, ay, ra) to (bx, by, rb); `outline` strokes its edge instead
function capsule(ctx, ax, ay, ra, bx, by, rb, outline = false) {
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  if (outline) {
    const a = Math.atan2(ny, nx);
    ctx.beginPath();
    ctx.arc(bx, by, rb, a, a + Math.PI, true);
    ctx.arc(ax, ay, ra, a + Math.PI, a, true);
    ctx.closePath();
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(ax + nx * ra, ay + ny * ra);
  ctx.lineTo(bx + nx * rb, by + ny * rb);
  ctx.lineTo(bx - nx * rb, by - ny * rb);
  ctx.lineTo(ax - nx * ra, ay - ny * ra);
  ctx.closePath();
  ctx.fill();
  // Joints filled on their own, so overlapping windings never punch holes
  ctx.beginPath(); ctx.arc(ax, ay, ra, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(bx, by, rb, 0, Math.PI * 2); ctx.fill();
}

function hand(ctx, h, tx, ty, s, ax, ay, carve) {
  const P = ([x, y, r]) => [tx + x * s, ty + y * s, r * s];
  const chain = (pts, outline) => { for (let i = 0; i < pts.length - 1; i++) capsule(ctx, ...pts[i], ...pts[i + 1], outline); };
  const wrist = P(h.palm[0]);
  const [sh, el] = h.arm.map(([x, y, r]) => [x + ax, y + ay, r]);
  chain([sh, el, [wrist[0], wrist[1], wrist[2] * 0.95]]);
  chain(h.palm.map(P));
  for (const f of h.fingers) chain(f.map(P));
  if (!carve) return;
  // Cut a thin gap around each finger so they stay separate at character resolution
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = carve;
  for (const f of h.fingers) chain(f.map(P), true);
  ctx.restore();
}

// ctx is already in stage units; gap = distance between the two fingertips, s = finger unit size,
// carve = width of the gap cut around each finger (0 for none)
export function drawHands(ctx, { gap, s, spread = 0, liftL = 0, liftR = 0, carve = 0 }) {
  hand(ctx, LEFT, -gap / 2 - spread, liftL, s, -spread, liftL, carve);
  hand(ctx, RIGHT, gap / 2 + spread, -s * 0.12 + liftR, s, spread, liftR, carve);
}
