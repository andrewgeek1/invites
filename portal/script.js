/* «Золотой портал». Один rAF на весь сайт, геометрия кэшируется вне
   горячего пути, движется только transform и stroke-dashoffset.
   Ни одного filter / backdrop-filter / mix-blend-mode на подвижном слое. */
'use strict';

/* ── легенда: одно место на весь сайт ──────────────────────────────── */

const WEDDING = {
  // Под реального заказчика меняется только это.
  date: new Date(2027, 7, 21, 15, 0, 0),   // 21 августа 2027, сбор в 15:00
  end:  new Date(2027, 7, 22, 1, 0, 0),
  sunset: '19:44',
  title: { ru: 'Свадьба Льва и Агаты', en: 'Lev & Agata’s wedding' },
  place: { ru: 'Усадьба «Красный Яр», село Кадницы, Нижегородская область',
           en: 'Krasny Yar estate, Kadnitsy, Nizhny Novgorod region' }
};

const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

let LANG = 'ru';
const t = o => (o && o[LANG] !== undefined ? o[LANG] : o);

/* ── содержимое блоков: оба языка рядом, чтобы переключатель ничего
      не кэшировал и не зависел от порядка запуска ──────────────────── */

const DATA = {
  day: [
    { time: '15:00', ru: ['Сбор', 'Встречаемся у ворот. Лимонад, тень и время осмотреться.'],
                     en: ['Arrival', 'We meet at the gate. Lemonade, shade and time to look around.'] },
    { time: '16:30', ru: ['Церемония', 'На краю яра, лицом к реке. Двадцать минут, не больше.'],
                     en: ['Ceremony', 'At the edge of the bank, facing the river. Twenty minutes, no more.'] },
    { time: '17:30', ru: ['Фуршет', 'Тень старых лип, холодное вино и общая фотография.'],
                     en: ['Reception', 'Old lime trees, cold wine and one photograph of everyone.'] },
    { time: '19:44', ru: ['Закат', 'Тот самый повод. Просим в этот момент отложить телефоны.'],
                     en: ['Sunset', 'The whole point. Please put your phones down for this one.'], key: true },
    { time: '21:00', ru: ['Первый танец', 'И сразу за ним общий — стоять в стороне не выйдет.'],
                     en: ['First dance', 'And everyone right after — standing aside won’t work.'] },
    { time: '23:00', ru: ['Огни', 'Фонари над водой. Автобус в город — в половине первого.'],
                     en: ['Lights', 'Lanterns over the water. The bus back leaves at half past midnight.'] }
  ],

  palette: [
    { hex: '#D08A22', ru: 'Золото', en: 'Gold' },
    { hex: '#E8B59A', ru: 'Пыльная роза', en: 'Dusty rose' },
    { hex: '#BE1330', ru: 'Алый', en: 'Scarlet' },
    { hex: '#7E4A2E', ru: 'Жжёная охра', en: 'Burnt ochre' },
    { hex: '#5C6B57', ru: 'Полынь', en: 'Wormwood' },
    { hex: '#2A0E15', ru: 'Бордо', en: 'Bordeaux' }
  ],

  asks: [
    { ru: ['Белый цвет', 'Он один на весь вечер и уже занят. Всё остальное — пожалуйста.'],
      en: ['White', 'There is one white outfit tonight and it is taken. Everything else is welcome.'] },
    { ru: ['Каблуки', 'Под ногами трава и песок. Возьмите вторую пару — переобуться будет где.'],
      en: ['Heels', 'Grass and sand underfoot. Bring a second pair — there is somewhere to change.'] },
    { ru: ['Подарки', 'Ничего не нужно везти. Если очень хочется — конверт, и на этом закончим.'],
      en: ['Gifts', 'Please bring nothing. If you insist — an envelope, and let’s leave it there.'] }
  ],

  faq: [
    { q: { ru: 'Можно с детьми?', en: 'Can we bring the children?' },
      a: { ru: 'Да, и мы будем рады. В усадьбе есть няня с 16:00 до 22:00 и тихая комната с играми — скажите в ответе, сколько детей и какого возраста.',
           en: 'Yes, and we’ll be glad. There’s a nanny from 16:00 to 22:00 and a quiet room with games — tell us how many children and their ages in the RSVP.' } },
    { q: { ru: 'Что если пойдёт дождь?', en: 'What if it rains?' },
      a: { ru: 'Ничего не отменяется. Церемония переезжает под стеклянную веранду, вид на реку оттуда тот же. Зонты будут у входа.',
           en: 'Nothing is cancelled. The ceremony moves to the glass veranda — same view of the river. Umbrellas at the entrance.' } },
    { q: { ru: 'Я не знаю почти никого из гостей', en: 'I hardly know anyone else coming' },
      a: { ru: 'Поэтому мы и делаем рассадку заранее. За вашим столом будут те, с кем вам точно найдётся о чём поговорить, — это не случайный порядок.',
           en: 'That’s exactly why we plan the seating. Your table is not random — you’ll have something to talk about.' } },
    { q: { ru: 'До скольки идёт трансфер?', en: 'How late does the shuttle run?' },
      a: { ru: 'Автобус от площади Минина в 13:30, обратно в 00:30. Если остаётесь ночевать — скажите в ответе, комнату придержим.',
           en: 'The bus leaves Minin square at 13:30 and returns at 00:30. If you stay over, say so in the RSVP and we’ll hold a room.' } },
    { q: { ru: 'Можно приехать только на вечер?', en: 'Can we come only for the evening?' },
      a: { ru: 'Можно, но постарайтесь успеть к 19:00. Закат — единственное, что мы не сможем отложить ради опоздавших.',
           en: 'You can, but try to be there by 19:00. The sunset is the one thing we can’t hold for latecomers.' } }
  ],

  tables: [
    { id: 'zarya',   ru: 'Заря',    en: 'Zarya',   guests: ['Воронов Никита', 'Воронова Мария', 'Тихонов Роман', 'Соболева Нина', 'Ерёмин Пётр'] },
    { id: 'yarilo',  ru: 'Ярило',   en: 'Yarilo',  guests: ['Гущина Ольга', 'Гущин Кирилл', 'Ланская Вера', 'Мосин Артур', 'Мосина Даша'] },
    { id: 'strizhi', ru: 'Стрижи',  en: 'Strizhi', guests: ['Белкин Захар', 'Белкина Рита', 'Юдин Тимур', 'Королёва Аня', 'Сотников Глеб'] },
    { id: 'poyma',   ru: 'Пойма',   en: 'Poyma',   guests: ['Астахова Лида', 'Астахов Марк', 'Веденеев Илья', 'Веденеева Соня', 'Лапина Женя'] },
    { id: 'veranda', ru: 'Веранда', en: 'Veranda', guests: ['Зотов Савелий', 'Зотова Инна', 'Панкратова Юля', 'Рыжов Матвей', 'Рыжова Катя'] },
    { id: 'prichal', ru: 'Причал',  en: 'Prichal', guests: ['Дёмина Полина', 'Дёмин Роман', 'Ушаков Тихон', 'Сафина Алина', 'Хрусталёв Егор'] }
  ],

  gallery: [
    { ru: 'Тот самый берег в июле', en: 'That same bank in July' },
    { ru: 'Вечер, когда всё решилось', en: 'The evening it was decided', h: 0 },
    { ru: 'Липы у ворот усадьбы', en: 'Limes at the estate gate', h: 0 },
    { ru: 'Волга в семь вечера', en: 'The Volga at seven', h: 1 },
    { ru: 'Стол, накрытый заранее', en: 'The table, set early', h: 0 },
    { ru: 'Последняя полоса света', en: 'The last band of light', h: 0 }
  ]
};

/* ══ 1. Голуби: своё время, независимое от прокрутки ═══════════════ */

function doves(host, n, opts = {}) {
  const tpl = $('#dove-tpl');
  const lo = opts.lo ?? 4, hi = opts.hi ?? 46;
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'dove';
    d.appendChild(tpl.content.cloneNode(true));
    const up = Math.random() < .5;
    const y = lo + (hi - lo) * ((i + .18 + Math.random() * .64) / n);
    const s = opts.scale ?? (.45 + Math.random() * .85);
    d.style.setProperty('--w', (opts.w ?? 92) + 'px');
    d.style.setProperty('--s', s.toFixed(2));
    d.style.setProperty('--y', y.toFixed(1) + '%');
    d.style.setProperty('--drift', ((up ? -1 : 1) * (30 + Math.random() * 60)).toFixed(0) + 'px');
    d.style.setProperty('--x0', (-18 - Math.random() * 22).toFixed(0) + 'vw');
    d.style.setProperty('--x1', (112 + Math.random() * 18).toFixed(0) + 'vw');
    // Мелкие голуби дальше — летят медленнее и машут реже.
    d.style.setProperty('--dur', (30 - s * 9 + Math.random() * 14).toFixed(1) + 's');
    d.style.setProperty('--delay', (-Math.random() * 34).toFixed(1) + 's');
    d.style.setProperty('--flap', (.72 - s * .22 + Math.random() * .12).toFixed(2) + 's');
    d.style.setProperty('--bob', (4 + Math.random() * 4).toFixed(1) + 's');
    d.style.setProperty('--bob-a', (-8 - Math.random() * 12).toFixed(0) + 'px');
    d.style.setProperty('--bob-b', (8 + Math.random() * 12).toFixed(0) + 'px');
    host.appendChild(d);
  }
}

/* ══ 2. Лента ══════════════════════════════════════════════════════
   x задан как синус от АБСОЛЮТНОГО y документа, а не от начала секции.
   Поэтому на стыке секций сходятся и точка, и наклон — непрерывность
   по построению, а не подгонкой концов. */

const WAVE = 940;                       // длина волны меандра, px
const RIBBON = ['top', 'invite', 'count', 'story', 'day', 'venue', 'gallery',
                'dress', 'asks', 'faq', 'seating', 'rsvp', 'final'];

const ribbons = [];                     // {sec, svg, path, len, top, h, from}
let knots = [];                         // {el, y, lit}

/* Дорожка ленты считается из ЖИВОЙ левой кромки текстовой колонки, а не
   из долей окна: доли разъезжались с max-width колонки и лента лезла
   на заголовки. Кэшируется на сборку — getBoundingClientRect на каждую
   точку пути стоил бы дороже самой ленты. */
let LANE = { min: 40, max: 140 };

function measureLane() {
  const probe = document.querySelector('#invite .wrap');
  const stroke = innerWidth <= 720 ? 7 : 13;
  let edge = innerWidth * .16;
  if (probe) {
    const r = probe.getBoundingClientRect();
    edge = r.left + parseFloat(getComputedStyle(probe).paddingLeft);
  }
  const max = Math.max(stroke, edge - stroke / 2 - (innerWidth <= 720 ? 10 : 26));
  const min = Math.max(stroke / 2 + 2, max - (innerWidth <= 720 ? 34 : 92));
  LANE = { min, max };
}

function xAt(absY) {
  const mid = (LANE.min + LANE.max) / 2, amp = (LANE.max - LANE.min) / 2;
  return mid + amp * Math.sin(absY * 2 * Math.PI / WAVE);
}

function buildRibbon() {
  ribbons.length = 0;
  knots.length = 0;
  const W = innerWidth;
  const docTop = scrollY;
  const docH = document.documentElement.scrollHeight;
  measureLane();

  RIBBON.forEach(id => {
    const sec = document.getElementById(id);
    if (!sec) return;
    let svg = sec.querySelector(':scope > .ribbon');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'ribbon');
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = '<defs></defs><path class="ribbon__back"></path><path class="ribbon__front"></path>';
      sec.prepend(svg);
    }
    const r = sec.getBoundingClientRect();
    const top = r.top + docTop, h = r.height;
    // Обложка: лента выходит из тёмной воды под горизонтом. Выше, по
    // багровому небу, алый штрих просто не читается — проверено замером.
    const from = id === 'top' ? h * .78 : 0;

    let d = '';
    for (let y = from; y <= h + .1; y += 18) {
      const yy = Math.min(y, h);
      d += (d ? 'L' : 'M') + xAt(top + yy).toFixed(1) + ' ' + yy.toFixed(1);
    }
    svg.setAttribute('viewBox', `0 0 ${W} ${h}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.width = W + 'px';
    svg.style.height = h + 'px';
    const front = svg.querySelector('.ribbon__front');
    const back = svg.querySelector('.ribbon__back');
    front.setAttribute('d', d);
    back.setAttribute('d', d);
    // Градиент задан в координатах ДОКУМЕНТА, а не секции: иначе лента
    // перекрашивалась бы из алого в бордо заново в каждой из тринадцати
    // секций, и «спуск в бордо» — весь смысл приёма — не читался бы.
    const gid = 'rg-' + id;
    svg.querySelector('defs').innerHTML =
      `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="0" x2="0" ` +
      `y1="${(-top).toFixed(0)}" y2="${(docH - top).toFixed(0)}">` +
      '<stop offset="0" stop-color="#F04A46"/>' +
      '<stop offset=".26" stop-color="#E8323F"/>' +
      '<stop offset=".62" stop-color="#BE1330"/>' +
      '<stop offset="1" stop-color="#5E0A18"/></linearGradient>';
    front.style.stroke = `url(#${gid})`;

    const len = front.getTotalLength();
    front.style.strokeDasharray = len;
    front.style.strokeDashoffset = len;
    ribbons.push({ sec, front, len, top, h });
  });

  placeKnots();
}

/* Узлы садятся на ленту напротив своих строк: y берём у самой строки,
   x считаем формулой — искать точку по длине пути не нужно. */
function placeKnots() {
  const host = $('#day');
  const svg = host && host.querySelector(':scope > .ribbon');
  if (!svg) return;
  svg.querySelectorAll('.knot').forEach(n => n.remove());
  const secTop = host.getBoundingClientRect().top + scrollY;

  $$('#day-list > li').forEach((li, i) => {
    const anchor = li.querySelector('.day__time') || li;
    const b = anchor.getBoundingClientRect();
    const yAbs = b.top + scrollY + b.height / 2;
    const y = yAbs - secTop;
    const x = xAt(yAbs);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'knot');
    const big = DATA.day[i] && DATA.day[i].key;
    g.innerHTML =
      `<circle class="knot__dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${big ? 11 : 7}"></circle>`;
    svg.appendChild(g);
    knots.push({ g, yAbs, lit: false });
    li.style.setProperty('--knot-y', y.toFixed(0) + 'px');
  });
}

/* ══ 3. Один цикл кадра на весь сайт ═══════════════════════════════ */

let ticking = false;
function frame() {
  ticking = false;
  const sy = scrollY, vh = innerHeight;
  // Лента открыта чуть впереди чтения. У самого низа страницы открываем
  // до конца: иначе последняя секция не дотягивала — за ней стоит подвал,
  // и упор прокрутки наступал на 95% ленты.
  const atBottom = sy + vh >= document.documentElement.scrollHeight - 2;
  const ahead = atBottom ? Infinity : sy + vh * .74;

  for (let i = 0; i < ribbons.length; i++) {
    const r = ribbons[i];
    if (r.top > sy + vh || r.top + r.h < sy - vh) continue;   // вне экрана — не трогаем
    let p = (ahead - r.top) / r.h;
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    // Округляем до двух пикселей: смена dashoffset перекрашивает штрих,
    // а разницы в один пиксель на ленте всё равно не видно.
    const off = Math.round(r.len * (1 - p) / 2) * 2;
    if (off !== r.last) {
      r.front.style.strokeDashoffset = off;
      // При нулевой длине круглый торец штриха всё равно рисует точку —
      // в ещё не пройденных секциях она висела красной кляксой.
      if ((p <= 0) !== (r.hid === true)) { r.hid = p <= 0; r.front.style.opacity = p <= 0 ? '0' : ''; }
      r.last = off;
    }
  }

  for (let i = 0; i < knots.length; i++) {
    const k = knots[i], lit = ahead > k.yAbs;
    if (lit !== k.lit) { k.lit = lit; k.g.classList.toggle('is-lit', lit); }
  }
}
function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

/* ══ 4. Отсчёт и .ics ══════════════════════════════════════════════ */

const PLUR = (n, a) => a[(n % 10 === 1 && n % 100 !== 11) ? 0 :
  (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 1 : 2];

function countdown() {
  const host = $('#countdown');
  if (!host) return;
  const ms = WEDDING.date - Date.now();
  if (ms <= 0) {
    host.innerHTML = `<b>${LANG === 'ru' ? 'Сегодня' : 'Today'}</b>`;
    return;
  }
  // Крупные числа вроде «353 дня» читаются как ошибка — режем на месяцы.
  const days = Math.floor(ms / 864e5);
  const months = Math.floor(days / 30.44);
  const restD = days - Math.round(months * 30.44);
  const hours = Math.floor(ms / 36e5) % 24;
  const mins = Math.floor(ms / 6e4) % 60;
  const secs = Math.floor(ms / 1e3) % 60;
  const parts = months >= 1
    ? [[months, ['месяц', 'месяца', 'месяцев'], ['month', 'months', 'months']],
       [Math.max(restD, 0), ['день', 'дня', 'дней'], ['day', 'days', 'days']],
       [hours, ['час', 'часа', 'часов'], ['hour', 'hours', 'hours']],
       [mins, ['минута', 'минуты', 'минут'], ['minute', 'minutes', 'minutes']]]
    : [[days, ['день', 'дня', 'дней'], ['day', 'days', 'days']],
       [hours, ['час', 'часа', 'часов'], ['hour', 'hours', 'hours']],
       [mins, ['минута', 'минуты', 'минут'], ['minute', 'minutes', 'minutes']],
       [secs, ['секунда', 'секунды', 'секунд'], ['second', 'seconds', 'seconds']]];
  host.innerHTML = parts.map(([n, ru, en]) =>
    `<div><b>${n}</b><span>${LANG === 'ru' ? PLUR(n, ru) : (n === 1 ? en[0] : en[1])}</span></div>`
  ).join('');
}

function icsHref() {
  const z = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//portal//RU', 'BEGIN:VEVENT',
    'UID:' + Date.now() + '@portal',
    'DTSTAMP:' + z(new Date()),
    'DTSTART:' + z(WEDDING.date),
    'DTEND:' + z(WEDDING.end),
    'SUMMARY:' + t(WEDDING.title),
    'LOCATION:' + t(WEDDING.place),
    'DESCRIPTION:' + (LANG === 'ru' ? 'Закат в ' : 'Sunset at ') + WEDDING.sunset,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(body);
}

/* ══ 5. Отрисовка блоков из данных ═════════════════════════════════ */

function renderDay() {
  $('#day-list').innerHTML = DATA.day.map(d => {
    const [h, p] = t({ ru: d.ru, en: d.en });
    return `<li class="rise${d.key ? ' is-key' : ''}">
      <span class="day__time">${d.time}</span>
      <b class="day__name">${h}</b>
      <p class="day__note">${p}</p></li>`;
  }).join('');
}

function renderPalette() {
  $('#pal').innerHTML = DATA.palette.map(c =>
    `<li><i style="background:${c.hex}"></i><span>${t(c)}</span></li>`).join('');
}

function renderAsks() {
  $('#asks-list').innerHTML = DATA.asks.map(a => {
    const [h, p] = t(a);
    return `<div class="ask rise"><b>${h}</b><p>${p}</p></div>`;
  }).join('');
}

function renderFaq() {
  $('#faq-list').innerHTML = DATA.faq.map((f, i) => `
    <div class="q rise">
      <button type="button" class="q__head" aria-expanded="false" data-i="${i}">
        <span>${t(f.q)}</span><i aria-hidden="true"></i>
      </button>
      <div class="q__body"><p>${t(f.a)}</p></div>
    </div>`).join('');
  $$('#faq-list .q__head').forEach(b => b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') === 'true';
    $$('#faq-list .q__head').forEach(o => {      // открыт всегда один
      o.setAttribute('aria-expanded', 'false');
      o.parentElement.classList.remove('is-open');
    });
    if (!open) { b.setAttribute('aria-expanded', 'true'); b.parentElement.classList.add('is-open'); }
  }));
}

function renderGallery() {
  $('#gal').innerHTML = DATA.gallery.map((g, i) =>
    `<figure class="gal__i${g.h ? ' gal__i--tall' : ''} rise">
       <img src="assets/gal-${i + 1}.webp" alt="${t(g)}" loading="lazy" decoding="async">
       <figcaption>${t(g)}</figcaption></figure>`).join('');
}

function renderHall() {
  $('#hall').innerHTML = DATA.tables.map(tb =>
    `<button type="button" class="table" data-id="${tb.id}">
       <b>${t(tb)}</b>
       <span>${tb.guests.length} ${LANG === 'ru' ? 'мест' : 'seats'}</span>
       <div class="table__fold"><ul>${
         tb.guests.map(g => `<li data-g="${g.toLowerCase()}">${g}</li>`).join('')
       }</ul></div>
     </button>`).join('');
  $$('#hall .table').forEach(b => b.addEventListener('click', () => {
    const on = b.classList.contains('is-open');
    $$('#hall .table').forEach(o => o.classList.remove('is-open'));
    if (!on) b.classList.add('is-open');
  }));
}

function seatSearch() {
  const q = $('#seat-q').value.trim().toLowerCase();
  const out = $('#seat-answer');
  // is-open снимаем тоже: иначе после неудачного поиска на экране
  // оставался раскрытым стол, найденный предыдущим запросом.
  $$('#hall .table').forEach(b => b.classList.remove('is-hit', 'is-dim', 'is-open'));
  $$('#hall li').forEach(li => li.classList.remove('is-me'));
  if (q.length < 2) { out.textContent = ''; return; }

  let found = null, who = '';
  DATA.tables.forEach(tb => {
    tb.guests.forEach(g => {
      if (g.toLowerCase().includes(q)) { found = tb; who = g; }
    });
  });
  if (!found) {
    out.textContent = LANG === 'ru'
      ? 'Не нашли. Проверьте написание или напишите нам — посадим.'
      : 'Not found. Check the spelling or write to us — we’ll seat you.';
    return;
  }
  $$('#hall .table').forEach(b => {
    if (b.dataset.id === found.id) {
      b.classList.add('is-hit', 'is-open');
      const li = Array.from(b.querySelectorAll('li'))
        .find(x => x.dataset.g === who.toLowerCase());
      if (li) li.classList.add('is-me');
      b.scrollIntoView({ block: 'nearest', behavior: RM ? 'auto' : 'smooth' });
    } else b.classList.add('is-dim');
  });
  out.innerHTML = LANG === 'ru'
    ? `${who} — стол <b>«${found.ru}»</b>.`
    : `${who} — table <b>${found.en}</b>.`;
}

/* ══ 6. Ответ гостя: пять шагов ════════════════════════════════════ */

const STEPS = [
  { key: 'name',  ru: ['Как вас зовут?', 'Имя и фамилия — чтобы найти вас в списке.'],
                  en: ['What is your name?', 'First and last name, so we can find you on the list.'] },
  { key: 'going', ru: ['Придёте?', 'Ответ можно поменять до 20 июля.'],
                  en: ['Will you come?', 'You can change your answer until 20 July.'] },
  { key: 'with',  ru: ['Кто с вами?', 'Мы считаем стулья, а не гостей.'],
                  en: ['Who is with you?', 'We are counting chairs, not guests.'] },
  { key: 'food',  ru: ['Что вам нельзя?', 'Аллергия, вегетарианство, что угодно.'],
                  en: ['Any food limits?', 'Allergies, vegetarian, anything at all.'] },
  { key: 'road',  ru: ['Как доберётесь?', 'И пара слов нам, если хочется.'],
                  en: ['How will you get there?', 'And a word for us, if you like.'] }
];

const answers = { name: '', going: '', with: 0, names: [], food: '', road: '', note: '', room: false };
let step = 0;

function renderSteps() {
  $('#steps').innerHTML = STEPS.map((s, i) => {
    const [h, sub] = t(s);
    return `<fieldset class="step" data-i="${i}"${i === step ? '' : ' hidden'}>
      <legend class="step__h">${h}</legend>
      <p class="step__sub dim">${sub}</p>
      ${stepBody(s.key)}
      <p class="step__err" id="err-${i}" role="alert"></p>
    </fieldset>`;
  }).join('');
  bindStep();
  syncNav();
}

function stepBody(key) {
  const L = LANG === 'ru';
  if (key === 'name')
    return `<input class="in" id="f-name" type="text" autocomplete="name"
      placeholder="${L ? 'Например, Анна Белкина' : 'e.g. Anna Belkina'}" value="${answers.name}">`;
  if (key === 'going')
    return `<div class="pick" id="f-going">
      <button type="button" data-v="yes"${answers.going === 'yes' ? ' class="on"' : ''}>${L ? 'Буду' : 'I’ll be there'}</button>
      <button type="button" data-v="no"${answers.going === 'no' ? ' class="on"' : ''}>${L ? 'Не смогу' : 'I can’t'}</button></div>`;
  if (key === 'with')
    return `<div class="pick" id="f-with">
        ${[0, 1, 2, 3].map(n => `<button type="button" data-v="${n}"${answers.with === n ? ' class="on"' : ''}>${
          n === 0 ? (L ? 'Один(а)' : 'Just me') : '+' + n}</button>`).join('')}
      </div><div class="names-fields" id="f-names"></div>`;
  if (key === 'food')
    return `<input class="in" id="f-food" type="text"
      placeholder="${L ? 'Пусто — значит, ем всё' : 'Empty means anything goes'}" value="${answers.food}">`;
  return `<div class="pick" id="f-road">
      ${[['bus', L ? 'Автобусом' : 'By bus'], ['car', L ? 'На машине' : 'By car'], ['own', L ? 'Сам(а) доберусь' : 'I’ll manage']]
        .map(([v, l]) => `<button type="button" data-v="${v}"${answers.road === v ? ' class="on"' : ''}>${l}</button>`).join('')}
    </div>
    <label class="check"><input type="checkbox" id="f-room"${answers.room ? ' checked' : ''}>
      <span>${L ? 'Останемся ночевать — придержите комнату' : 'We’ll stay the night — hold a room'}</span></label>
    <textarea class="in in--area" id="f-note" rows="3"
      placeholder="${L ? 'Пара слов нам' : 'A word for us'}">${answers.note}</textarea>`;
}

function companionFields() {
  const host = $('#f-names');
  if (!host) return;
  const L = LANG === 'ru';
  host.innerHTML = Array.from({ length: answers.with }, (_, i) =>
    `<input class="in" data-c="${i}" type="text" value="${answers.names[i] || ''}"
      placeholder="${L ? 'Имя спутника ' + (i + 1) : 'Companion ' + (i + 1)}">`).join('');
  $$('[data-c]', host).forEach(inp => inp.addEventListener('input', () => {
    answers.names[+inp.dataset.c] = inp.value.trim();
  }));
}

function bindStep() {
  const n = $('#f-name'); if (n) n.addEventListener('input', () => answers.name = n.value.trim());
  const f = $('#f-food'); if (f) f.addEventListener('input', () => answers.food = f.value.trim());
  const nt = $('#f-note'); if (nt) nt.addEventListener('input', () => answers.note = nt.value.trim());
  const rm = $('#f-room'); if (rm) rm.addEventListener('change', () => answers.room = rm.checked);
  const pick = (sel, key, cast = v => v) => {
    const host = $(sel); if (!host) return;
    $$('button', host).forEach(b => b.addEventListener('click', () => {
      $$('button', host).forEach(o => o.classList.remove('on'));
      b.classList.add('on');
      answers[key] = cast(b.dataset.v);
      if (key === 'with') { answers.names.length = answers.with; companionFields(); }
      if (key === 'going') syncNav();
    }));
  };
  pick('#f-going', 'going');
  pick('#f-with', 'with', Number);
  pick('#f-road', 'road');
  companionFields();
}

function validate() {
  const err = $('#err-' + step);
  const L = LANG === 'ru';
  if (step === 0 && answers.name.length < 2) {
    err.textContent = L ? 'Без имени мы вас не найдём.' : 'We can’t find you without a name.';
    return false;
  }
  if (step === 1 && !answers.going) {
    err.textContent = L ? 'Выберите один из двух ответов.' : 'Pick one of the two.';
    return false;
  }
  if (step === 2 && answers.with > 0 && answers.names.filter(Boolean).length < answers.with) {
    err.textContent = L ? 'Впишите имена спутников — по ним мы делаем рассадку.'
                        : 'Please name your companions — the seating depends on it.';
    return false;
  }
  if (step === 4 && !answers.road) {
    err.textContent = L ? 'Отметьте, как доберётесь.' : 'Tell us how you’ll get there.';
    return false;
  }
  err.textContent = '';
  return true;
}

function showStep(i) {
  step = i;
  $$('#steps .step').forEach(f => f.hidden = +f.dataset.i !== step);
  syncNav();
  if (step === 2) companionFields();
}

function syncNav() {
  const total = answers.going === 'no' ? 2 : STEPS.length;
  $('#prev').hidden = step === 0;
  $('#step-num').textContent = `${step + 1} / ${total}`;
  $('#step-fill').style.width = ((step + 1) / total * 100).toFixed(1) + '%';
  const last = step === total - 1;
  const nx = $('#next');
  nx.textContent = last ? (LANG === 'ru' ? 'Отправить' : 'Send')
                        : (LANG === 'ru' ? 'Дальше' : 'Next');
}

/* Единственная точка отправки. Сейчас пишет в localStorage;
   чтобы ответы уходили в телеграм-бота — раскомментируйте fetch. */
function sendRsvp(payload) {
  const key = 'portal.rsvp';
  const all = JSON.parse(localStorage.getItem(key) || '[]');
  all.push(payload);
  localStorage.setItem(key, JSON.stringify(all));

  // return fetch('https://ВАШ-ВЕБХУК', {
  //   method: 'POST', headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload)
  // });
  return Promise.resolve();
}

function submit() {
  const payload = {
    at: new Date().toISOString(),
    name: answers.name, going: answers.going,
    companions: answers.names.filter(Boolean),
    food: answers.food, road: answers.road, room: answers.room, note: answers.note
  };
  sendRsvp(payload);
  $('#form').hidden = true;
  $('#rsvp-title').hidden = true;
  $('#thanks').hidden = false;
  const L = LANG === 'ru';
  $('#thanks-line').textContent = answers.going === 'no'
    ? (L ? 'Жаль, что не выйдет. Мы всё равно пришлём вам фотографии.'
         : 'Sorry you can’t make it. We’ll send you the photographs anyway.')
    : (L ? `${1 + answers.names.filter(Boolean).length} ${PLUR(1 + answers.names.filter(Boolean).length, ['место', 'места', 'мест'])} за столом ваши. Увидимся на закате.`
         : `${1 + answers.names.filter(Boolean).length} seat(s) are yours. See you at sunset.`);
  requestAnimationFrame(buildRibbon);
}

/* ══ 7. Панель ответов: пять щелчков по монограмме ═════════════════ */

function admin() {
  const box = $('#admin');
  const rows = () => JSON.parse(localStorage.getItem('portal.rsvp') || '[]');
  const draw = () => {
    const r = rows();
    $('#admin-count').textContent = r.length + ' ' + PLUR(r.length, ['ответ', 'ответа', 'ответов']);
    $('#admin-body').innerHTML = r.length
      ? r.map(x => `<div class="admin__row"><b>${x.name}</b>
          <span class="${x.going === 'yes' ? 'yes' : 'no'}">${x.going === 'yes' ? 'будет' : 'не сможет'}</span>
          <span>${x.companions.length ? '+' + x.companions.join(', ') : '—'}</span>
          <span>${x.road || '—'}${x.room ? ', ночует' : ''}</span>
          <span class="dim">${x.food || ''} ${x.note || ''}</span></div>`).join('')
      : '<p class="dim">Пока пусто. Ответы копятся в localStorage этого браузера.</p>';
  };
  let clicks = 0, timer;
  $('#mono').addEventListener('click', () => {
    clearTimeout(timer); timer = setTimeout(() => clicks = 0, 1200);
    if (++clicks >= 5) { clicks = 0; box.hidden = false; draw(); }
  });
  $('#admin-close').addEventListener('click', () => box.hidden = true);
  $('#admin-clear').addEventListener('click', () => {
    if (confirm('Удалить все ответы из этого браузера?')) { localStorage.removeItem('portal.rsvp'); draw(); }
  });
  $('#admin-csv').addEventListener('click', () => {
    const r = rows();
    const head = ['дата', 'имя', 'придёт', 'спутники', 'еда', 'дорога', 'ночлег', 'пожелание'];
    const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const csv = '﻿' + [head, ...r.map(x => [x.at, x.name, x.going === 'yes' ? 'да' : 'нет',
      x.companions.join('; '), x.food, x.road, x.room ? 'да' : 'нет', x.note])]
      .map(row => row.map(esc).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'otvety-gostey.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}

/* ══ 8. Музыка: генерируется на месте, файла нет ═══════════════════
   Дрон плюс редкие колокольчики по пентатонике. Ноль килобайт и ноль
   вопросов с правами. Свой трек ставится вместо тела startMusic(). */

let audio = null, bellTimer = null;
function startMusic() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  const ctx = new AC();
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, ctx.currentTime);
  out.gain.linearRampToValueAtTime(.5, ctx.currentTime + 2.5);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 620; lp.Q.value = .4;
  lp.connect(out); out.connect(ctx.destination);

  [110, 110.4, 164.8].forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = i === 2 ? 'triangle' : 'sine';
    o.frequency.value = f;
    g.gain.value = i === 2 ? .022 : .05;
    o.connect(g); g.connect(lp); o.start();
  });

  const scale = [440, 493.9, 587.3, 659.3, 880];
  const bell = () => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = scale[(Math.random() * scale.length) | 0];
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(.06, now + .01);
    g.gain.exponentialRampToValueAtTime(.0001, now + 4.5);
    o.connect(g); g.connect(out); o.start(now); o.stop(now + 5);
    bellTimer = setTimeout(bell, 3500 + Math.random() * 6500);
  };
  bellTimer = setTimeout(bell, 1800);
  audio = { ctx, out };
  return true;
}

function music() {
  const btn = $('#music');
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') === 'true';
    if (!on) {
      if (!audio && !startMusic()) return;
      audio.ctx.resume();
      audio.out.gain.linearRampToValueAtTime(.5, audio.ctx.currentTime + 1.6);
      btn.setAttribute('aria-pressed', 'true');
    } else {
      if (audio) audio.out.gain.linearRampToValueAtTime(0, audio.ctx.currentTime + .9);
      clearTimeout(bellTimer);
      btn.setAttribute('aria-pressed', 'false');
    }
  });
}

/* ══ 9. Языки ══════════════════════════════════════════════════════ */

function applyLang() {
  document.documentElement.lang = LANG;
  $$('[data-ru]').forEach(el => { el.innerHTML = el.dataset[LANG]; });
  $$('[data-ph-ru]').forEach(el => { el.placeholder = el.dataset['ph' + (LANG === 'ru' ? 'Ru' : 'En')]; });
  $('#lang').innerHTML = LANG === 'ru' ? '<b>RU</b> <span>EN</span>' : '<span>RU</span> <b>EN</b>';
  renderDay(); renderPalette(); renderAsks(); renderFaq(); renderGallery(); renderHall();
  renderSteps();
  countdown();
  $('#ics').href = icsHref();
  $('#seat-answer').textContent = '';
  observe();
  requestAnimationFrame(buildRibbon);
}

/* ══ 10. Появление по прокрутке ════════════════════════════════════ */

let io = null;
function observe() {
  if (io) io.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  $$('.rise, .final').forEach(el => io.observe(el));
}

/* ══ старт ═════════════════════════════════════════════════════════ */

function init() {
  // Имена в обложке — побуквенно, чтобы у слова был вход, а не появление.
  // Идём по узлам, а не по innerHTML: рукописное «и» в .amp резать нельзя,
  // да и крайние слова регулярка «между тегами» просто не видит.
  $$('.names, .final__names').forEach(h => {
    let n = 0;
    Array.from(h.childNodes).forEach(node => {
      if (node.nodeType !== 3) { node.style.setProperty('--i', n++); return; }
      const frag = document.createDocumentFragment();
      node.textContent.split('').forEach(ch => {
        const i = document.createElement('i');
        i.textContent = ch;
        i.style.setProperty('--i', n++);
        frag.appendChild(i);
      });
      h.replaceChild(frag, node);
    });
  });

  doves($('#doves'), 6, { lo: 5, hi: 42 });
  // Два пояса: выше строки с закатом и ниже подписи. Между ними текст.
  doves($('#doves2'), 3, { lo: 4, hi: 19, w: 76 });
  doves($('#doves2'), 2, { lo: 76, hi: 92, w: 64 });

  applyLang();
  admin();
  music();

  $('#lang').addEventListener('click', () => { LANG = LANG === 'ru' ? 'en' : 'ru'; applyLang(); });
  $('#seat-q').addEventListener('input', seatSearch);
  $('#next').addEventListener('click', () => {
    if (!validate()) return;
    const total = answers.going === 'no' ? 2 : STEPS.length;
    if (step === total - 1) submit(); else showStep(step + 1);
  });
  $('#prev').addEventListener('click', () => showStep(Math.max(0, step - 1)));
  $('#again').addEventListener('click', () => {
    Object.assign(answers, { name: '', going: '', with: 0, names: [], food: '', road: '', note: '', room: false });
    step = 0;
    $('#thanks').hidden = true; $('#form').hidden = false; $('#rsvp-title').hidden = false;
    renderSteps();
  });

  addEventListener('scroll', onScroll, { passive: true });
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { buildRibbon(); onScroll(); }, 160); });

  setInterval(countdown, 1000);
  addEventListener('load', () => { buildRibbon(); onScroll(); });
  requestAnimationFrame(() => { buildRibbon(); onScroll(); });
}

document.addEventListener('DOMContentLoaded', init);
