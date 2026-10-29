const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>';

// Resolve `text` left to right through random characters
export function scramble(el, text, { duration = 0.6 } = {}) {
  if (text == null) text = el.dataset.text ??= el.textContent;
  cancelAnimationFrame(el._scr);
  const start = performance.now(), len = text.length;
  const tick = (now) => {
    const p = Math.min(1, (now - start) / (duration * 1000));
    let out = '';
    for (let i = 0; i < len; i++) {
      const ch = text[i];
      if (ch === ' ' || p >= (i + 1) / len) out += ch;
      else out += POOL[(Math.random() * POOL.length) | 0];
    }
    el.textContent = out;
    if (p < 1) el._scr = requestAnimationFrame(tick);
  };
  el._scr = requestAnimationFrame(tick);
}

export function bindHoverScramble(root = document) {
  root.querySelectorAll('[data-scramble]').forEach((el) => {
    const target = el.closest('a, button') || el;
    target.addEventListener('mouseenter', () => scramble(el, null, { duration: 0.45 }));
  });
}
