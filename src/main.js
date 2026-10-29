import '@fontsource-variable/inter-tight';
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { createStage } from './stage.js';
import { createFootWord } from './footword.js';
import { scramble, bindHoverScramble } from './scramble.js';
import { projects } from './covers.js';
import { logoSVG } from './logo.js';
import { MONO } from './glyphs.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
history.scrollRestoration = 'manual';

$$('[data-logo]').forEach((el) => { el.innerHTML = logoSVG(); });
if (!fine) $$('[data-touch]').forEach((el) => { el.textContent = el.dataset.touch; });

// ---------- Smooth scroll ----------
const lenis = new Lenis({ lerp: reduced ? 1 : 0.1, smoothWheel: !reduced });
window.lenis = lenis;
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const el = $(id);
  if (!el) return;
  e.preventDefault();
  closeMenu();
  lenis.scrollTo(id === '#top' ? 0 : el, { duration: 1.6 });
}));

// ---------- Work list ----------
const list = $('#workList');
const ext = 'target="_blank" rel="noopener"';
list.innerHTML = projects.map((p, i) => `
  <article class="proj proj--${p.span}" data-id="${p.id}">
    <a class="proj__media" href="${p.url}" ${ext} tabindex="-1" aria-hidden="true">
      <picture class="proj__img"><source media="(max-width: 760px)" srcset="${p.small}" /><img src="${p.img}" alt="" loading="lazy" decoding="async" /></picture>
      <canvas class="proj__ascii"></canvas>
    </a>
    <div class="proj__meta">
      <span class="proj__i mono">${String(i + 1).padStart(2, '0')}</span>
      <ul class="proj__tags mono">${p.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
      <h3 class="proj__title"><a href="${p.url}" ${ext}>${p.title}</a></h3>
      <p class="proj__desc">${p.desc}</p>
      <p class="proj__links mono"><a href="${p.url}" ${ext} data-scramble>Visit site ↗</a><a href="${p.repo}" ${ext} data-scramble>GitHub ↗</a></p>
    </div>
  </article>`).join('');

// ---------- Stage ----------
// Created after the fonts load, so the page doesn't reflow under it
let stage;
ScrollTrigger.create({ trigger: '#stage', start: 'top top', end: 'bottom bottom', onUpdate: (s) => { if (stage) stage.progress = s.progress; } });

// ---------- Loader ----------
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function loader() {
  const text = $('#loaderText'), acc = $('#loaderAcc'), count = $('#loaderCount');
  const line = 'Web design & development — ';
  const c = { v: 0 };
  gsap.to(c, { v: 100, duration: reduced ? 0.2 : 2, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(c.v)).padStart(3, '0'); } });
  if (!reduced) {
    for (let i = 1; i <= line.length; i++) { text.textContent = line.slice(0, i); await wait(28); }
    scramble(acc, 'one bit at a time', { duration: 0.8 });
    await wait(1200);
  } else {
    text.textContent = line; acc.textContent = 'one bit at a time';
  }
  gsap.timeline()
    .to('.loader__line, .loader__count', { opacity: 0, duration: 0.35 })
    .to('#loader', { clipPath: 'inset(0 0 100% 0)', duration: reduced ? 0.2 : 1.1, ease: 'expo.inOut' }, '<0.1')
    .add(() => { $('#loader').remove(); lenis.start(); });
}

// ---------- Reveals ----------
function lines() {
  $$('[data-lines]').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'ln' });
    gsap.set(split.lines, { yPercent: 110 });
    const play = () => {
      gsap.to(split.lines, { yPercent: 0, duration: reduced ? 0 : 1.15, ease: 'expo.out', stagger: 0.09 });
      $$('.hl', el).forEach((h) => setTimeout(() => h.classList.add('is-on'), reduced ? 0 : 520));
    };
    if (el.closest('.hero')) el._play = play;
    else ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: play });
  });
  $$('[data-fade]').forEach((el) => {
    gsap.set(el, { opacity: 0, y: 24 });
    const play = () => gsap.to(el, { opacity: 1, y: 0, duration: reduced ? 0 : 1, ease: 'power3.out', delay: 0.15 });
    if (el.closest('.hero')) el._play = play;
    else ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: play });
  });
}

function heroIn() {
  $('.hero__title')._play();
  $$('.hero [data-fade]').forEach((el, i) => setTimeout(el._play, 350 + i * 140));
  gsap.from('.hdr > *', { y: -30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, delay: 0.1 });
}

// ---------- Hero / spark scroll ----------
function stageScroll() {
  gsap.to('.hero .wrap', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: true } });
  gsap.fromTo('.spark__copy', { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: '.spark__copy', start: 'top 100%', end: 'top 72%', scrub: true } });
  // As the definition arrives, the logo and every stray character fade out, leaving plain blue behind it
  gsap.fromTo('#ascii', { opacity: 1 }, { opacity: 0, ease: 'none', onUpdate() { if (stage) stage.visible = this.progress() < 0.99; }, scrollTrigger: { trigger: '.spark__copy', start: 'top 100%', end: 'top 84%', scrub: true } });
}

// ---------- Header ----------
function header() {
  const label = $('#hdrLabel');
  $$('[data-label]').forEach((s) => ScrollTrigger.create({
    trigger: s, start: 'top 50%', end: 'bottom 50%',
    onToggle: (self) => { if (self.isActive && label.dataset.now !== s.dataset.label) { label.dataset.now = s.dataset.label; scramble(label, s.dataset.label, { duration: 0.5 }); } },
  }));
  const clock = $('#clock');
  const tick = () => { clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  tick(); setInterval(tick, 15000);
}

// ---------- Menu ----------
const menu = $('#menu'), burger = $('#burger');
function openMenu() {
  menu.classList.add('is-open'); document.body.classList.add('menu-open');
  burger.setAttribute('aria-expanded', 'true'); menu.setAttribute('aria-hidden', 'false');
  lenis.stop();
  gsap.fromTo('.menu__links a', { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.05, delay: 0.25 });
  gsap.fromTo('.menu__side > *', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05, delay: 0.45 });
}
function closeMenu() {
  if (!menu.classList.contains('is-open')) return;
  menu.classList.remove('is-open'); document.body.classList.remove('menu-open');
  burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true');
  lenis.start();
}
burger.addEventListener('click', () => (menu.classList.contains('is-open') ? closeMenu() : openMenu()));
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

// ---------- Manifesto ----------
function manifesto() {
  const el = $('#manifestoText');
  const words = SplitText.create(el, { type: 'words', wordsClass: 'w' }).words;
  const marks = $$('mark', el).map((m) => ({ m, at: words.indexOf($('.w', m)) }));
  let last = -1;
  ScrollTrigger.create({
    trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: true,
    onUpdate: (s) => {
      const k = Math.round(s.progress * words.length);
      if (k === last) return;
      last = k;
      words.forEach((w, i) => w.classList.toggle('on', i < k));
      marks.forEach(({ m, at }) => m.classList.toggle('is-on', at < k));
    },
  });
  $$('[data-count]').forEach((b) => {
    const to = +b.dataset.count, from = to === 0 ? 99 : 0;
    b.textContent = from + (b.dataset.suffix || '');
    ScrollTrigger.create({ trigger: b, start: 'top 90%', once: true, onEnter: () => {
      const o = { v: from };
      gsap.to(o, { v: to, duration: reduced ? 0 : 1.8, ease: 'power3.out', onUpdate: () => { b.textContent = Math.round(o.v) + (b.dataset.suffix || ''); } });
    } });
  });
}

// ---------- Marquee ----------
function marquee() {
  const track = $('#marquee');
  track.append(track.firstElementChild.cloneNode(true));
  track.lastElementChild.setAttribute('aria-hidden', 'true');
  const tw = gsap.to(track, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
  if (reduced) tw.pause();
  const btn = $('#marqueePause');
  const sync = () => { btn.setAttribute('aria-pressed', String(tw.paused())); btn.textContent = tw.paused() ? 'Play logos' : 'Pause logos'; };
  btn.addEventListener('click', () => { tw.paused(!tw.paused()); sync(); });
  sync();
  track.addEventListener('mouseenter', () => gsap.to(tw, { timeScale: 0.2, duration: 0.6 }));
  track.addEventListener('mouseleave', () => gsap.to(tw, { timeScale: 1, duration: 0.6 }));
}

// ---------- Service icons (8×8 pixel marks) ----------
const ICONS = {
  cart: ['#.......', '########', '.#....#.', '.######.', '.#....#.', '..####..', '........', '..#..#..'],
  gauge: ['..####..', '.#....#.', '#......#', '#...#..#', '#..#...#', '#.#....#', '........', '########'],
  grid: ['###.###.', '#.#.#.#.', '###.###.', '........', '###.###.', '#.#.#.#.', '###.###.', '........'],
  code: ['########', '#......#', '#.#....#', '#..#...#', '#.#....#', '#...##.#', '#......#', '########'],
  spark: ['...#....', '...#....', '..###...', '#######.', '..###...', '...#....', '...#....', '........'],
};
function icons() {
  $$('.svc__icon').forEach((cv) => {
    const x = cv.getContext('2d'), pat = ICONS[cv.dataset.icon];
    const dpr = Math.min(devicePixelRatio, 2);
    cv.width = cv.height = 40 * dpr; x.scale(dpr, dpr);
    let glitch = 0;
    const draw = () => {
      x.clearRect(0, 0, 40, 40);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        let on = pat[r][c] === '#';
        if (glitch > 0 && Math.random() < 0.18 * glitch) on = !on;
        if (!on) continue;
        x.fillStyle = Math.random() < 0.04 ? '#b9cbfb' : '#ffffff';
        x.fillRect(c * 5, r * 5, 4.2, 4.2);
      }
    };
    draw();
    cv.closest('.svc').addEventListener('mouseenter', () => {
      const o = { g: 1 };
      gsap.to(o, { g: 0, duration: 0.7, ease: 'power2.out', onUpdate: () => { glitch = o.g; draw(); }, onComplete: draw });
    });
  });
  gsap.from('.svc', { opacity: 0, y: 40, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.services__grid', start: 'top 85%' } });
}

// ---------- Work: ASCII lens on hover, parallax, list view ----------
const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function work() {
  $$('.proj').forEach((card) => {
    const media = $('.proj__media', card), cv = $('.proj__ascii', card), img = $('.proj__img', card);
    // Gentle drift inside the frame; the zoom keeps the edges covered without cropping one side more than another
    gsap.fromTo(img, { yPercent: -3, scale: 1.07 }, { yPercent: 3, scale: 1.07, ease: 'none', scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from(card, { opacity: 0, y: 60, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 90%' } });
    if (!fine || reduced) return;

    let lum = null, glyphs = null, cols = 0, rows = 0, W = 0, H = 0, mx = 0, my = 0, rad = 0, target = 0, raf = 0;
    const CW = 9, CH = 13, ctx = cv.getContext('2d');
    async function prepare() {
      const r = media.getBoundingClientRect();
      W = r.width; H = r.height;
      const dpr = Math.min(devicePixelRatio, 2);
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CW); rows = Math.ceil(H / CH);
      const im = $('img', img);
      await im.decode();
      const off = document.createElement('canvas'); off.width = cols; off.height = rows;
      const o = off.getContext('2d', { willReadFrequently: true });
      // Match object-fit: cover on the screenshot, sampled at one pixel per character cell
      const iw = im.naturalWidth, ih = im.naturalHeight, s = Math.max(W / iw, H / ih);
      const dw = (iw * s) / CW, dh = (ih * s) / CH;
      o.drawImage(im, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
      lum = o.getImageData(0, 0, cols, rows).data;
      glyphs = Array.from({ length: cols * rows }, () => ALNUM[(Math.random() * ALNUM.length) | 0]);
    }
    const draw = () => {
      rad += (target - rad) * 0.14;
      ctx.clearRect(0, 0, W, H);
      if (rad < 2 && target === 0) { raf = 0; return; }
      const c0 = Math.max(0, ((mx - rad) / CW) | 0), c1 = Math.min(cols - 1, ((mx + rad) / CW) | 0);
      const r0 = Math.max(0, ((my - rad) / CH) | 0), r1 = Math.min(rows - 1, ((my + rad) / CH) | 0);
      ctx.font = `500 11px ${MONO}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const x = c * CW + CW / 2, y = r * CH + CH / 2;
        const d = Math.hypot(x - mx, y - my);
        if (d > rad) continue;
        const k = (r * cols + c) * 4, R = lum[k], G = lum[k + 1], B = lum[k + 2];
        const l = (0.3 * R + 0.59 * G + 0.11 * B) / 255;
        ctx.fillStyle = '#2458f2';
        ctx.fillRect(c * CW, r * CH, CW, CH);
        if (l < 0.08) continue;
        ctx.fillStyle = d > rad - 14 ? '#ffffff' : `rgb(${Math.min(255, R * 1.25 + 30)},${Math.min(255, G * 1.25 + 30)},${Math.min(255, B * 1.25 + 30)})`;
        if (Math.random() < 0.05) glyphs[r * cols + c] = ALNUM[(Math.random() * ALNUM.length) | 0];
        ctx.fillText(glyphs[r * cols + c], x, y);
      }
      raf = requestAnimationFrame(draw);
    };
    const pos = (e) => { const r = media.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    media.addEventListener('pointerenter', async (e) => {
      pos(e);
      if (!lum) { try { await prepare(); } catch { return; } }
      target = Math.min(W, H) * 0.32;
      if (!raf) raf = requestAnimationFrame(draw);
    });
    media.addEventListener('pointermove', pos);
    media.addEventListener('pointerleave', () => { target = 0; });
    addEventListener('resize', () => { lum = null; });
  });

  // List view toggle
  const toggle = $('#viewToggle');
  ScrollTrigger.create({ trigger: '#work', start: 'top 60%', end: 'bottom 70%', toggleClass: { targets: toggle, className: 'is-shown' } });
  $$('button', toggle).forEach((b) => b.addEventListener('click', () => {
    if (list.dataset.view === b.dataset.view) return;
    $$('button', toggle).forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    gsap.to(list, { opacity: 0, duration: 0.25, onComplete: () => {
      list.dataset.view = b.dataset.view;
      ScrollTrigger.refresh();
      gsap.to(list, { opacity: 1, duration: 0.45 });
    } });
  }));

  // Floating preview in list view
  const peek = $('#peek');
  const qx = gsap.quickTo(peek, 'x', { duration: 0.5, ease: 'power3' }), qy = gsap.quickTo(peek, 'y', { duration: 0.5, ease: 'power3' });
  $$('.proj').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      if (list.dataset.view !== 'list') return;
      peek.innerHTML = `<img src="${projects.find((p) => p.id === card.dataset.id).small}" alt="" />`;
      peek.classList.add('is-on');
    });
    card.addEventListener('mouseleave', () => peek.classList.remove('is-on'));
  });
  addEventListener('pointermove', (e) => { qx(e.clientX + 24); qy(e.clientY - 110); }, { passive: true });
}

// ---------- Process ----------
function process() {
  $$('.step').forEach((s) => ScrollTrigger.create({
    trigger: s, start: 'top 62%', end: 'bottom 62%',
    onToggle: (self) => {
      s.classList.toggle('is-on', self.isActive || self.progress === 1);
      if (self.isActive) { const n = $('.step__n', s); scramble(n, n.dataset.num, { duration: 0.5 }); }
    },
  }));
  gsap.fromTo('#processMeter', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.process__steps', start: 'top 62%', end: 'bottom 62%', scrub: true } });
}

// ---------- Voices ----------
const VOICES = {
  clients: [
    { q: 'They asked better questions in the first week than our last agency did in a year. The site paid for itself before summer.', n: 'Mara Lindqvist', r: 'Co-founder, ceramics studio' },
    { q: 'Bookings doubled, and for the first time the website actually sounds like us. Our regulars noticed before we told them.', n: 'Tomás Reyes', r: 'Owner, seafood restaurant' },
    { q: 'Fast, calm and allergic to fluff. Our launch page did numbers we still don’t quite believe.', n: 'Ines Achterberg', r: 'CMO, robotics start-up' },
  ],
  partners: [
    { q: 'Our first call when a project needs real craft in the build. B1T makes the whole agency look good.', n: 'Jonah Feld', r: 'Creative Director, Northpaw' },
    { q: 'Clean hand-offs, tidy code, and every date hit. Rare on all three counts.', n: 'Priya Nair', r: 'Producer, Lantern & Co.' },
  ],
};
function voices() {
  let tab = 'clients', i = 0, split;
  const quote = $('#vQuote'), who = $('#vWho');
  const show = (anim = true) => {
    const v = VOICES[tab][i];
    split?.revert();
    quote.textContent = `“${v.q}”`;
    who.innerHTML = `<span class="voices__av mono">${v.n.split(' ').map((w) => w[0]).join('')}</span><span><b>${v.n}</b><i>${v.r}</i></span><span class="voices__n mono">${String(i + 1).padStart(2, '0')} / ${String(VOICES[tab].length).padStart(2, '0')}</span>`;
    if (!anim || reduced) return;
    split = SplitText.create(quote, { type: 'lines', mask: 'lines' });
    gsap.from(split.lines, { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.06 });
    gsap.from(who, { opacity: 0, y: 12, duration: 0.6, delay: 0.2 });
  };
  $$('.voices__tabs button').forEach((b) => b.addEventListener('click', () => {
    tab = b.dataset.tab; i = 0;
    $$('.voices__tabs button').forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', String(x === b)); });
    show();
  }));
  $('#vPrev').addEventListener('click', () => { i = (i - 1 + VOICES[tab].length) % VOICES[tab].length; show(); });
  $('#vNext').addEventListener('click', () => { i = (i + 1) % VOICES[tab].length; show(); });
  show(false);
  ScrollTrigger.create({ trigger: quote, start: 'top 85%', once: true, onEnter: () => show() });
}

// ---------- Contact ----------
function contact() {
  const btn = $('#copyMail'), tip = $('#copied');
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(btn.dataset.email); tip.textContent = 'Copied ✓'; }
    catch { location.href = `mailto:${btn.dataset.email}`; }
    setTimeout(() => { tip.textContent = 'Copy'; }, 1800);
  });
  $$('#chips .chip').forEach((c) => c.addEventListener('click', () => c.classList.toggle('is-on')));
  $$('#budget .chip').forEach((c) => c.addEventListener('click', () => $$('#budget .chip').forEach((x) => x.classList.toggle('is-on', x === c && !x.classList.contains('is-on')))));
  $('#brief').addEventListener('submit', (e) => {
    e.preventDefault();
    const pick = (s) => $$(`${s} .chip.is-on`).map((c) => c.textContent).join(', ') || '—';
    const body = `Interested in: ${pick('#chips')}\nBudget: ${pick('#budget')}\n\n${$('#briefMsg').value}`;
    location.href = `mailto:hello@b1t.studio?subject=${encodeURIComponent('New project brief')}&body=${encodeURIComponent(body)}`;
  });
  gsap.from('.chip', { opacity: 0, y: 14, duration: 0.6, ease: 'power3.out', stagger: 0.03, scrollTrigger: { trigger: '.brief', start: 'top 85%' } });
  createFootWord($('#footWord'), { reduced });
}

// ---------- Cursor ----------
function cursor() {
  const cur = $('#cursor');
  if (!fine) { cur.remove(); return; }
  document.body.classList.add('has-cursor');
  const dx = gsap.quickTo('.cursor__dot', 'x', { duration: 0.08 }), dy = gsap.quickTo('.cursor__dot', 'y', { duration: 0.08 });
  const rx = gsap.quickTo('.cursor__ring', 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo('.cursor__ring', 'y', { duration: 0.45, ease: 'power3' });
  addEventListener('pointermove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); cur.classList.add('is-in'); }, { passive: true });
  document.addEventListener('pointerleave', () => cur.classList.remove('is-in'));
  document.addEventListener('pointerover', (e) => {
    cur.classList.toggle('is-link', !!e.target.closest('a, button, .chip, textarea'));
    cur.classList.toggle('is-lens', !!e.target.closest('.proj__media'));
    cur.classList.toggle('on-white', !!e.target.closest('.t-white'));
  });
}

// ---------- Boot ----------
(async () => {
  await Promise.all([
    document.fonts.load('400 16px "Inter Tight Variable"'),
    document.fonts.load('800 100px "Inter Tight Variable"'),
  ]).catch(() => {});
  stage = await createStage($('#ascii'), { reduced });
  const measureHero = () => { stage.heroBottom = $('.hero__row').getBoundingClientRect().bottom + scrollY; };
  measureHero();
  addEventListener('resize', measureHero);
  lines(); stageScroll(); header(); manifesto(); marquee(); icons(); work(); process(); voices(); contact(); cursor();
  bindHoverScramble();
  ScrollTrigger.refresh();
  await loader();
  setTimeout(heroIn, reduced ? 0 : 700);
})();
