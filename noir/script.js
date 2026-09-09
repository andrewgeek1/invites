/* Анна и Андрей — лента печатных разворотов.
   Прокрутка едет вправо; в горячем цикле только transform. */
(() => {
'use strict';

const html = document.documentElement;
html.classList.add('js');

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ribbon   = $('#ribbon');
const threadEl = $('#thread');
const threadP  = $('#threadPath');

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp  = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;

/* ─────────── геометрия: считается один раз, не в цикле ─────────── */
const G = { spreads: [] };

function measure() {
  G.horiz  = innerWidth > 900;
  G.vw     = innerWidth;
  G.vh     = innerHeight;
  G.view   = G.horiz ? G.vw : G.vh;
  G.size   = G.horiz ? ribbon.scrollWidth : ribbon.scrollHeight;
  G.travel = Math.max(1, G.size - G.view);
  G.speed  = G.horiz ? 0.50 : 1;
  document.body.style.height = (G.travel * G.speed + G.vh) + 'px';

  const rb = ribbon.getBoundingClientRect();

  G.spreads = $$('.spread', ribbon).map(el => {
    const r = el.getBoundingClientRect();
    return {
      el,
      off: G.horiz ? r.left - rb.left : r.top - rb.top,
      len: G.horiz ? r.width : r.height,
      y: parseFloat(el.dataset.y || '.5')
    };
  });


  buildThread();
  pinCards();
}

/* ─────────── подвесить карточки ровно на нить ─────────── */
function pinCards() {
  const hangs = $$('.hang', ribbon);
  if (!G.horiz) { hangs.forEach(h => h.style.removeProperty('--pin')); return; }
  const total = threadP.getTotalLength();
  if (!total) return;
  const rb = ribbon.getBoundingClientRect();

  // нить монотонна по X, поэтому точку ищем делением пополам по длине
  const yAt = x => {
    let lo = 0, hi = total;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (threadP.getPointAtLength(mid).x < x) lo = mid; else hi = mid;
    }
    return threadP.getPointAtLength((lo + hi) / 2).y;
  };

  for (const h of hangs) {
    const r = h.getBoundingClientRect();
    const y = yAt(r.left + r.width / 2 - rb.left);
    h.style.setProperty('--pin', y.toFixed(1) + 'px');

    // подвес укорачиваем ровно настолько, чтобы карточка влезла в экран
    const up = h.classList.contains('hang--up');
    const card = $('.card', h);
    // сколько места есть от нити до края экрана
    const free = (up ? y : G.vh - y) - 22;

    // карточка не прокручивается вместе с лентой, поэтому она обязана влезть.
    // Сначала пробуем как есть, потом плотный режим, и только если и он
    // не спас — отдаём карточке свою прокрутку, чтобы кнопка осталась достижима.
    card.style.maxHeight = '';
    card.classList.remove('is-crowded', 'is-tall');
    if (card.scrollHeight > free) {
      card.classList.add('is-crowded');
      if (card.scrollHeight > free) {
        card.classList.add('is-tall');
        card.style.maxHeight = free.toFixed(0) + 'px';
      }
    }

    const room = free - card.offsetHeight - 16;   // запас на качание
    // длину берём по факту отрисовки: --drop может быть задан через var()
    const want = $('.hang__string', h).offsetHeight;
    h.style.setProperty('--drop', Math.max(6, Math.min(want, room)).toFixed(0) + 'px');
  }
}

/* ─────────── красная нить: одна линия сквозь всю ленту ─────────── */
function buildThread() {
  if (!G.horiz || !G.spreads.length) { threadP.setAttribute('d', ''); return; }
  const W = G.size, H = G.vh;
  threadEl.setAttribute('width', W);
  threadEl.setAttribute('height', H);
  threadEl.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const pts = G.spreads.map(s => [s.off + s.len / 2, s.y * H]);
  pts.unshift([0, pts[0][1]]);
  pts.push([W, pts[pts.length - 1][1]]);

  // кубические сегменты с горизонтальными касательными — нить течёт, а не ломается
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], dx = (x1 - x0) / 2.4;
    d += ` C${(x0 + dx).toFixed(1)},${y0.toFixed(1)} ${(x1 - dx).toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  threadP.setAttribute('d', d);
}

/* ─────────── отсчёт ─────────── */
const TARGET = new Date('2026-11-21T15:00:00+03:00').getTime();
const cells = {};
$$('#count [data-k]').forEach(el => cells[el.dataset.k] = el);
function tick() {
  let left = Math.max(0, TARGET - Date.now()) / 1000 | 0;
  const d = left / 86400 | 0; left -= d * 86400;
  const h = left / 3600 | 0;  left -= h * 3600;
  const m = left / 60 | 0;
  const s = left - m * 60;
  const set = (k, v) => {
    const t = String(v).padStart(2, '0');
    if (cells[k] && cells[k].textContent !== t) cells[k].textContent = t;
  };
  set('d', d); set('h', h); set('m', m); set('s', s);
}

/* ─────────── кадр ─────────── */
let target = 0, cur = 0, dirty = true;

function onScroll() {
  target = clamp(scrollY / (G.travel * G.speed));
  dirty = true;
  if (scrollY > 40) html.classList.add('is-moved');
}

function frame() {
  const delta = target - cur;
  if (Math.abs(delta) * G.travel > 0.4) { cur += delta * (reduce ? 1 : 0.13); dirty = true; }
  else if (dirty) { cur = target; }

  if (dirty) {
    const p = cur, px = p * G.travel;

    ribbon.style.transform = G.horiz
      ? `translate3d(${-px}px,0,0)`
      : `translate3d(0,${-px}px,0)`;


    dirty = Math.abs(target - cur) * G.travel > 0.4;
  }
  requestAnimationFrame(frame);
}

/* ─────────── ответ ─────────── */
const form   = $('#form');
const doneEl = $('#done'), doneH = $('#doneH'), doneP = $('#doneP');
const who    = $('#who'), err = $('#err'), askH = $('#askH'), askRh = $('#askRh');
const stepQ  = $('#stepQ'), stepV = $('#stepV'), guests = $('#guests');
const MAX = 10;
let plus = 0;

const coming = () => form.elements.go.value === 'yes';

/* число людей словом — до пятерых, дальше числом */
function together(total) {
  return ['', '', 'вдвоём', 'втроём', 'вчетвером', 'впятером'][total] || `${total} человек`;
}

function renderStep() {
  stepQ.textContent = coming()
    ? 'Кто-то приедет с вами?'
    : 'Кто-то не сможет приехать вместе с вами?';
  stepV.textContent = plus;
  $$('.step__b').forEach(b => {
    const d = +b.dataset.d;
    b.disabled = (d < 0 && plus === 0) || (d > 0 && plus === MAX);
  });
  /* сколько выбрал — столько полей для имён */
  const have = $$('.field', guests).length;
  for (let i = have; i < plus; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    wrap.innerHTML = `<input type="text" id="g${i}" placeholder=" " autocomplete="off">` +
                     `<label for="g${i}">Кто именно</label>`;
    guests.appendChild(wrap);
  }
  for (let i = have; i > plus; i--) guests.lastElementChild.remove();

  /* карточка висит на нити и не прокручивается: чем больше полей, тем плотнее
     их приходится складывать, иначе кнопка «Отправить» уезжает под нижний край.
     Плотный режим включает pinCards() по факту нехватки места, а не по числу. */
  guests.style.setProperty('--cols', plus > 8 ? 4 : plus > 6 ? 3 : plus > 3 ? 2 : 1);
  pinCards();
}

$$('.step__b').forEach(b => b.addEventListener('click', () => {
  plus = clamp(plus + +b.dataset.d, 0, MAX);
  renderStep();
}));
$$('input[name=go]').forEach(r => r.addEventListener('change', renderStep));
who.addEventListener('input', () => { err.hidden = true; });
renderStep();

form.addEventListener('submit', e => {
  e.preventDefault();
  const name = who.value.trim();
  if (!name) { err.hidden = false; who.focus(); return; }

  const go    = coming();
  const total = 1 + plus;
  const word  = together(total);
  const with_ = $$('input', guests).map(i => i.value.trim()).filter(Boolean);

  try {
    const all = JSON.parse(localStorage.getItem('noir.rsvp') || '[]');
    all.push({ name, go, plus, with: with_, msg: $('#msg').value.trim(), at: new Date().toISOString() });
    localStorage.setItem('noir.rsvp', JSON.stringify(all));
  } catch (_) { /* приватный режим — ответ всё равно показываем */ }

  form.hidden = true;
  askH.hidden = true;          // вопрос и рубрика уходят вместе с формой
  if (askRh) askRh.hidden = true;
  doneEl.hidden = false;
  if (go) {
    doneH.textContent = 'Ждём вас.';
    doneP.textContent = (plus ? `Записали вас ${word}. ` : 'Записали. ') + 'Не забудьте красную деталь.';
  } else {
    doneH.textContent = 'Очень жаль.';
    doneP.textContent = (plus ? `Не приедете ${word}. ` : '') + 'Пришлём вам самые непристойные кадры первыми.';
  }
});

/* ─────────── клавиатура ─────────── */
function pOf(s) { return clamp((s.off + s.len / 2 - G.view / 2) / G.travel); }
$('.skip').addEventListener('click', e => {
  e.preventDefault();
  const s = G.spreads.find(x => x.el.id === 'rsvp');
  if (s) { scrollTo({ top: pOf(s) * G.travel * G.speed, behavior: 'auto' }); who.focus(); }
});
ribbon.addEventListener('focusin', e => {
  const sp = e.target.closest('.spread');
  const s = sp && G.spreads.find(x => x.el === sp);
  if (s) scrollTo({ top: pOf(s) * G.travel * G.speed, behavior: reduce ? 'auto' : 'smooth' });
});

/* ─────────── запуск ─────────── */
function boot() { measure(); onScroll(); cur = target; dirty = true; }

let rt;
/* На телефоне панели браузера прячутся при прокрутке вниз и возвращаются
   при прокрутке вверх. Высота окна из-за этого скачет на сотню пикселей,
   и каждый такой скачок прилетает сюда как resize. Пересчитывать по нему
   раскладку нельзя: measure() переписывает высоту всего документа, лента
   съезжает под пальцем и кажется, что страница прыгает и меняет масштаб.
   Поэтому реагируем только на смену ШИРИНЫ — поворот экрана или ресайз окна. */
let lastW = innerWidth;
addEventListener('resize', () => {
  if (innerWidth === lastW) return;
  lastW = innerWidth;
  clearTimeout(rt);
  rt = setTimeout(boot, 140);
});
/* Поворот экрана меняет и ширину, и высоту — его слушаем отдельно и честно. */
addEventListener('orientationchange', () => {
  clearTimeout(rt);
  rt = setTimeout(() => { lastW = innerWidth; boot(); }, 240);
});
addEventListener('scroll', onScroll, { passive: true });
addEventListener('load', boot);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);

boot();
tick();
setInterval(tick, 1000);
requestAnimationFrame(frame);
})();
