/* «Лента дня» — прокрутка двигает не страницу, а время суток.
   На кадр меняются только transform и opacity; цвета — по порогам. */
(() => {
'use strict';

const html = document.documentElement;
html.classList.add('js');

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ribbon = $('#ribbon');
const hud    = $('#hud');
const sun    = $('#sun');
const moon   = $('#moon');
const stars  = $('#stars');
const glit   = $('#glitter');
const clockEl= $('#clock');
const phaseEl= $('#phase');
const railDot= $('#railDot');
const rail   = $('#rail');
const skyL   = $$('.sky__l');
const watL   = $$('.water__l');
const moonpath = $('#moonpath');
const bands  = [
  { el: $('#bandHills'),  k: 0.18, kv: 1.0 },
  { el: $('#bandTrees'),  k: 0.34, kv: 1.9 },
  { el: $('#bandMirror'), k: 0.34, kv: 1.9, flip: true },
  { el: $('#bandReeds'),  k: 1.12, kv: 6.0 }
];

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp  = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };

/* ─────────── геометрия: считаем один раз, не в горячем цикле ─────────── */
const G = {};

function measure() {
  G.horiz  = innerWidth > 860;
  G.vw     = innerWidth;
  G.vh     = innerHeight;
  G.view   = G.horiz ? G.vw : G.vh;
  G.size   = G.horiz ? ribbon.scrollWidth : ribbon.scrollHeight;
  G.travel = Math.max(1, G.size - G.view);
  G.speed  = G.horiz ? 0.62 : 1;
  G.hzY    = $('.water').getBoundingClientRect().top;
  G.railW  = rail.offsetWidth;
  G.topY   = G.vh * 0.11;

  document.body.style.height = (G.travel * G.speed + G.vh) + 'px';

  /* якоря времени — из настоящих координат остановок */
  G.anchors = $$('[data-time]', ribbon).map(el => {
    const c = G.horiz ? el.offsetLeft + el.offsetWidth / 2
                      : el.offsetTop  + el.offsetHeight / 2;
    const [h, m] = el.dataset.time.split(':').map(Number);
    let min = h * 60 + m; if (h < 12) min += 1440;      // после полуночи
    return { p: clamp((c - G.view / 2) / G.travel), min: min - 900, el };
  }).sort((a, b) => a.p - b.p);

  const set = G.anchors.find(a => a.el.dataset.name === 'закат');
  G.pSet = set ? set.p : 0.616;
}

/* минуты от 15:00 по положению на ленте */
function minutesAt(p) {
  const a = G.anchors;
  if (p <= a[0].p) return a[0].min;
  for (let i = 1; i < a.length; i++) {
    if (p <= a[i].p) {
      const span = a[i].p - a[i - 1].p;
      const t = span > 0 ? (p - a[i - 1].p) / span : 1;
      return a[i - 1].min + (a[i].min - a[i - 1].min) * t;
    }
  }
  return a[a.length - 1].min;
}

/* ─────────── звёзды ─────────── */
(function seedStars() {
  let s = 606;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 110; i++) {
    const d = document.createElement('i');
    const r = 0.9 + rnd() * 1.9;
    d.style.cssText = `left:${(rnd() * 100).toFixed(2)}%;top:${(rnd() * 82).toFixed(2)}%;` +
                      `width:${r.toFixed(1)}px;height:${r.toFixed(1)}px;` +
                      `animation-delay:${(rnd() * 4).toFixed(2)}s;opacity:${(0.3 + rnd() * 0.7).toFixed(2)}`;
    frag.appendChild(d);
  }
  stars.appendChild(frag);
})();

/* ─────────── рейка дня ─────────── */
function buildRail() {
  $$('button', rail).forEach(b => b.remove());
  G.anchors.filter(a => a.el.classList.contains('stop')).forEach(a => {
    const b = document.createElement('button');
    b.type = 'button';
    b.style.left = (a.p * 100).toFixed(2) + '%';
    b.innerHTML = `<span>${a.el.dataset.name}</span>`;
    b.setAttribute('aria-label', `${a.el.dataset.time} — ${a.el.dataset.name}`);
    b.addEventListener('click', () => {
      scrollTo({ top: a.p * G.travel * G.speed, behavior: reduce ? 'auto' : 'smooth' });
    });
    rail.appendChild(b);
  });
}

/* ─────────── ступенчатые вещи: цвет приборов, часы ─────────── */
let lastClock = '', lastPhase = '', lastInk = '';

const PHASES = [
  [0.44, 'день',         '#0A1220'],
  [0.56, 'золотой час',  '#0A1220'],
  [0.68, 'закат',        '#FFF2E2'],
  [0.80, 'сумерки',      '#F3E9F0'],
  [1.01, 'ночь',         '#E9E7F4']
];

function paintHud(p) {
  const min  = minutesAt(p);
  const tot  = ((900 + Math.round(min)) % 1440 + 1440) % 1440;
  const str  = String((tot / 60) | 0).padStart(2, '0') + ':' + String(tot % 60).padStart(2, '0');
  if (str !== lastClock) {
    lastClock = str;
    clockEl.innerHTML = [...str].map(c => `<b class="${c === ':' ? 'c' : ''}">${c}</b>`).join('');
  }
  const ph = PHASES.find(x => p < x[0]) || PHASES[PHASES.length - 1];
  if (ph[1] !== lastPhase) { lastPhase = ph[1]; phaseEl.textContent = ph[1]; }
  if (ph[2] !== lastInk)   { lastInk   = ph[2]; hud.style.color = ph[2]; }
}

/* ─────────── кадр ─────────── */
let target = 0, cur = 0, dirty = true;

function onScroll() {
  target = clamp(scrollY / (G.travel * G.speed));
  dirty = true;
  if (scrollY > 40) html.classList.add('is-moved');
}

function frame() {
  const d = target - cur;
  if (Math.abs(d) > 0.0004) { cur += d * (reduce ? 1 : 0.13); dirty = true; }
  else if (dirty) { cur = target; }

  if (dirty) {
    const p = cur, px = p * G.travel;

    ribbon.style.transform = G.horiz
      ? `translate3d(${-px}px,0,0)`
      : `translate3d(0,${-px}px,0)`;

    /* небо и вода — перекрёстное затухание слоёв */
    for (let i = 1; i < SKY_P.length; i++) {
      const o = smooth((p - SKY_P[i - 1]) / (SKY_P[i] - SKY_P[i - 1]));
      skyL[i].style.opacity = o;
      watL[i].style.opacity = o;
    }

    /* берег: сдвиг + тон */
    const setT = smooth((p - 0.40) / 0.24), nightT = smooth((p - G.pSet) / 0.26);
    for (const b of bands) {
      const shift = G.horiz ? px * b.k : p * G.vw * b.kv;
      b.el.style.transform = `translate3d(${-shift}px,0,0)` + (b.flip ? ' scaleY(-1)' : '');
      b.el.children[1].style.opacity = setT;
      b.el.children[2].style.opacity = nightT;
    }

    /* солнце */
    const k = p / G.pSet;
    const sx = (0.70 + 0.18 * Math.min(k, 1.3)) * G.vw;
    const sy = G.topY + (G.hzY - G.topY) * Math.min(k, 1.34) ** 2;
    sun.style.transform = `translate3d(${sx}px,${sy}px,0)`;
    const warm = smooth((p - 0.40) / 0.22);
    sun.children[1].style.opacity = warm * (1 - smooth((p - G.pSet) / 0.22));
    sun.children[0].style.opacity = (1 - warm);
    sun.children[3].style.opacity = warm;

    /* дорожка на воде */
    glit.style.transform = `translate3d(${sx}px,0,0) translateX(-50%)`;
    glit.style.opacity = smooth((p - 0.30) / 0.26) * (1 - smooth((p - G.pSet) / 0.13));

    /* луна и звёзды */
    const u = clamp((p - (G.pSet + 0.10)) / (1 - G.pSet - 0.10));
    // на узком экране текст занимает всю ширину — луну уводим в правый верхний угол
    const mx = (G.horiz ? 0.70 + 0.16 * u : 0.74 + 0.14 * u) * G.vw;
    const my = (G.horiz ? 0.62 - 0.47 * u : 0.44 - 0.30 * u) * G.vh;
    const mOp = smooth(u * 1.7);
    moon.style.transform = `translate3d(${mx}px,${my}px,0)`;
    moon.style.opacity = mOp;
    moonpath.style.transform = `translate3d(${mx}px,0,0) translateX(-50%)`;
    moonpath.style.opacity = mOp * 0.75;
    stars.style.opacity = smooth((p - (G.pSet - 0.03)) / 0.26);

    railDot.style.transform = `translate3d(${p * G.railW}px,0,0)`;

    paintHud(p);
    dirty = Math.abs(target - cur) > 0.0004;
  }
  requestAnimationFrame(frame);
}

const SKY_P = [0, 0.334, 0.484, 0.616, 0.72, 0.85, 1];

/* ─────────── ответ ─────────── */
const form = $('#form'), done = $('#done');
form.addEventListener('submit', e => {
  e.preventDefault();
  const who = $('#who');
  const name = who.value.trim();
  if (!name) { who.focus(); who.style.borderBottomColor = '#E58A6A'; return; }
  const go = form.elements.go.value === 'yes';
  try {
    const all = JSON.parse(localStorage.getItem('lenta.rsvp') || '[]');
    all.push({ name, go, at: new Date().toISOString() });
    localStorage.setItem('lenta.rsvp', JSON.stringify(all));
  } catch (_) { /* приватный режим — ответ всё равно показываем */ }
  form.hidden = true;
  done.hidden = false;
  done.textContent = go
    ? `${name}, записали. Займём вам место у воды — и разбудим к закату.`
    : `${name}, жаль. Пришлём вам закат в 21:07 — прямо оттуда.`;
});

$('.skip').addEventListener('click', e => {
  e.preventDefault();
  const a = G.anchors.find(x => x.el.id === 'rsvp');
  if (a) { scrollTo({ top: a.p * G.travel * G.speed, behavior: 'auto' }); $('#who').focus(); }
});

/* ─────────── клавиатура: фокус не должен уезжать за кадр ─────────── */
ribbon.addEventListener('focusin', e => {
  const stop = e.target.closest('.stop, .mark');
  if (!stop) return;
  const a = G.anchors.find(x => x.el === stop);
  if (a) scrollTo({ top: a.p * G.travel * G.speed, behavior: reduce ? 'auto' : 'smooth' });
});

/* ─────────── запуск ─────────── */
function boot() { measure(); buildRail(); G.railW = rail.offsetWidth; onScroll(); cur = target; dirty = true; }

let rt;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(boot, 140); });
addEventListener('scroll', onScroll, { passive: true });
addEventListener('load', boot);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);

boot();
requestAnimationFrame(frame);
})();
