/* ═══════════════════════════════════════════════════════════════════════
   «Цветочная арка» — Марк и Ева

   Один цикл rAF на весь сайт. Геометрия считается только при изменении
   размера окна и лежит вне горячего пути: любое обращение к offsetHeight
   из кадра форсирует пересчёт вёрстки всего документа.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const smooth = (p, a, b) => { const t = clamp((p - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── дата ───────────────────────────────────────────────────────────
     Первая суббота июля не раньше чем через 90 дней. Фиксированная дата
     протухает, а цветущая арка и трава в кадре требуют лета.
     Под настоящую пару — заменить тело функции одной строкой.          */

  function demoDate() {
    const now = new Date();
    const soonest = new Date(now.getTime() + 90 * 864e5);
    for (let year = soonest.getFullYear(); year < soonest.getFullYear() + 4; year++) {
      const d = new Date(year, 6, 1, 16, 0, 0);
      d.setDate(d.getDate() + ((6 - d.getDay()) + 7) % 7);   // ближайшая суббота
      if (d > soonest) return d;
    }
    return new Date(soonest.getFullYear() + 1, 6, 4, 16, 0, 0);
  }

  const DAY = new Date(demoDate());
  const DEADLINE = new Date(DAY.getTime() - 32 * 864e5);

  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const DOW = ['воскресенье', 'понедельник', 'вторник', 'среда',
               'четверг', 'пятница', 'суббота'];

  function plural(n, one, few, many) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }

  function fillDates() {
    const map = {
      d:        `${DAY.getDate()} ${MONTHS[DAY.getMonth()]} ${DAY.getFullYear()}`,
      dnum:     String(DAY.getDate()),
      month:    MONTHS[DAY.getMonth()],
      year:     String(DAY.getFullYear()),
      dow:      DOW[DAY.getDay()],
      deadline: `${DEADLINE.getDate()} ${MONTHS[DEADLINE.getMonth()]}`,
      short:    `${DAY.getDate()} ${MONTHS[DAY.getMonth()]}`
    };
    $$('[data-dt]').forEach(el => {
      const key = el.dataset.dt;
      if (key === 'dowspread') {
        // «суббота» разгоняется ровно по ширине даты: каждая буква — свой
        // элемент, между ними space-between. Разрядкой через letter-spacing
        // так не выйдет: последний интервал висел бы справа.
        el.textContent = '';
        [...DOW[DAY.getDay()]].forEach(ch => {
          const s = document.createElement('span');
          s.textContent = ch;
          el.appendChild(s);
        });
      } else if (map[key] !== undefined) {
        el.textContent = map[key];
      }
    });
  }

  /* ─── отсчёт ─────────────────────────────────────────────────────────
     Далеко — недели, дни, часы. Близко — дни, часы, минуты.
     «312 дней, 0 часов, 22 минуты» читается как шум, а не как срок.     */

  function tick() {
    const box = $('#count');
    if (!box) return;
    const left = Math.max(0, DAY - new Date());
    const totalDays = Math.floor(left / 864e5);
    const hours = Math.floor(left / 36e5) % 24;
    let units;
    if (totalDays >= 21) {
      const w = Math.floor(totalDays / 7);
      const d = totalDays - w * 7;
      units = [[w, plural(w, 'неделя', 'недели', 'недель')],
               [d, plural(d, 'день', 'дня', 'дней')],
               [hours, plural(hours, 'час', 'часа', 'часов')]];
    } else {
      const m = Math.floor(left / 6e4) % 60;
      units = [[totalDays, plural(totalDays, 'день', 'дня', 'дней')],
               [hours, plural(hours, 'час', 'часа', 'часов')],
               [m, plural(m, 'минута', 'минуты', 'минут')]];
    }
    ['a', 'b', 'c'].forEach((k, i) => {
      const n = $(`[data-c="${k}"]`, box), l = $(`[data-cl="${k}"]`, box);
      if (n && n.textContent !== String(units[i][0])) n.textContent = units[i][0];
      if (l && l.textContent !== units[i][1]) l.textContent = units[i][1];
    });
  }

  /* ─── .ics ──────────────────────────────────────────────────────────── */

  function buildIcs() {
    const a = $('#ics');
    if (!a) return;
    const pad = n => String(n).padStart(2, '0');
    const stamp = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
                       `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const start = new Date(DAY.getTime() - 30 * 6e4);        // сбор в 15:30
    const end = new Date(DAY.getTime() + 7.5 * 36e5);
    a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent([
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//arka//RU',
      'BEGIN:VEVENT',
      `UID:arka-${DAY.getTime()}@invites`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      'SUMMARY:Свадьба Марка и Евы',
      'LOCATION:Усадьба «Заовражье»\\, село Каменки\\, Нижегородская область',
      'DESCRIPTION:Сбор у ворот в 15:30. Церемония под аркой в 16:00.',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n'));
  }

  /* ─── пролёт под аркой ───────────────────────────────────────────────
     Все слои сцены расходятся из одной точки — той, куда идёт камера.
     Точка лежит в проёме арки: арка симметрична и собрана так, что её
     проём приходится ровно на центр файла, поэтому здесь хватает
     середины экрана без вычислений по альфа-каналу.                     */

  const FADE = {
    'lyr--title':  [0.26, 0.60],
    'lyr--couple': [0.30, 0.64],
    'lyr--far':    [0.70, 0.95],
    'lyr--arch':   [0.72, 0.94],
    'lyr--near':   [0.90, 1.00],
    'lyr--hint':   [0.04, 0.22]
  };

  const pass = (() => {
    const el = $('.pass');
    if (!el) return null;
    return {
      el,
      stage: $('.stage', el),
      layers: $$('.lyr[data-k]', el).map(l => {
        const key = [...l.classList].find(c => FADE[c]);
        return { el: l, k: +l.dataset.k, fade: FADE[key] || [0.7, 1], last: '', lastO: '' };
      }),
      top: 0, span: 1, full: 1
    };
  })();

  const frame = $('#frame');
  const veil = $('#veil');
  let lastFrame = '', lastVeil = '';

  function measure() {
    if (!pass) return;
    const r = pass.el.getBoundingClientRect();
    pass.top = r.top + window.scrollY;
    pass.full = pass.el.offsetHeight;
    pass.span = Math.max(1, pass.full - pass.stage.offsetHeight);
  }

  /* второй источник движения: у всех соседних сайтов движение идёт только
     от прокрутки, здесь слои ещё и дышат от курсора и наклона телефона */
  let driftX = 0, driftY = 0, aimX = 0, aimY = 0;

  function render() {
    driftX += (aimX - driftX) * 0.06;
    driftY += (aimY - driftY) * 0.06;
    const y = window.scrollY;
    const raw = pass ? clamp((y - pass.top) / pass.span, 0, 1) : 1;

    if (pass && y + window.innerHeight >= pass.top && y <= pass.top + pass.full) {
      const e = Math.pow(raw, 1.28);
      for (const L of pass.layers) {
        const s = 1 + L.k * e;
        const d = 0.35 + L.k * 0.55;
        const t = `translate3d(${Math.round(driftX * d * 10) / 10}px,` +
                  `${Math.round(driftY * d * 5) / 10}px,0) scale(${s.toFixed(4)})`;
        if (t !== L.last) { L.el.style.transform = t; L.last = t; }
        const o = (1 - smooth(raw, L.fade[0], L.fade[1])).toFixed(3);
        if (o !== L.lastO) { L.el.style.opacity = o; L.lastO = o; }
      }
    }

    // Рамка появляется ровно тогда, когда арка прошла мимо: гость вышел
    // из-под неё и остался внутри.
    if (frame) {
      const o = smooth(raw, 0.78, 0.97).toFixed(3);
      if (o !== lastFrame) {
        frame.style.setProperty('--frame-op', o);
        lastFrame = o;
      }
    }
    if (veil) {
      const v = smooth(raw, 0.55, 0.95).toFixed(3);
      if (v !== lastVeil) {
        veil.style.setProperty('--veil-op', v);
        lastVeil = v;
      }
    }
    requestAnimationFrame(render);
  }

  function bindDrift() {
    if (reduced) return;
    if (matchMedia('(hover: hover)').matches) {
      addEventListener('pointermove', ev => {
        aimX = (ev.clientX / innerWidth - 0.5) * 2 * 16;
        aimY = (ev.clientY / innerHeight - 0.5) * 2 * 16;
      }, { passive: true });
    }
    // На iOS доступ к гироскопу требует разрешения по жесту. Просить его
    // ради дрейфа слоёв грубо, поэтому там источник просто выключен.
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission !== 'function') {
      addEventListener('deviceorientation', ev => {
        if (ev.gamma == null) return;
        aimX = clamp(ev.gamma / 22, -1, 1) * 16;
        aimY = clamp((ev.beta - 45) / 30, -1, 1) * 10;
      }, { passive: true });
    }
  }

  /* ─── появление блоков ──────────────────────────────────────────────── */

  function reveal() {
    const items = $$('.rise');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const sibs = [...en.target.parentElement.children].filter(c => c.classList.contains('rise'));
        en.target.style.setProperty('--d', `${Math.min(sibs.indexOf(en.target), 5) * 0.07}s`);
        en.target.classList.add('is-in');
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(el => io.observe(el));
  }

  /* ─── ответ гостя ───────────────────────────────────────────────────── */

  // Единственная точка, через которую уходит ответ. Сейчас — localStorage;
  // под бота или почту меняется тело этой функции, остальное не трогается.
  function sendRsvp(payload) {
    try {
      const all = JSON.parse(localStorage.getItem('arka-rsvp') || '[]');
      all.push(payload);
      localStorage.setItem('arka-rsvp', JSON.stringify(all));
    } catch (e) { /* приватный режим — молча */ }

    // fetch('https://example.com/hook', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
  }

  const MAX_GUESTS = 20;

  function rsvp() {
    const form = $('#form');
    if (!form) return;
    const withInput = $('#fWith'), guests = $('#guests');
    const nameInput = $('#fName'), errName = $('#errName'), errGo = $('#errGo');

    const count = () => clamp(parseInt(withInput.value, 10) || 0, 0, MAX_GUESTS);

    function drawGuests() {
      const n = count(), have = guests.children.length;
      for (let i = have; i < n; i++) {
        const row = document.createElement('div');
        row.className = 'field';
        const id = `guest-${i + 1}`;
        row.innerHTML = `<label for="${id}">Кто приедет с вами · ${i + 1}</label>` +
                        `<input id="${id}" class="guest" type="text" placeholder="Имя и фамилия">`;
        guests.appendChild(row);
      }
      for (let i = have; i > n; i--) guests.lastElementChild.remove();
    }

    withInput.addEventListener('input', drawGuests);
    withInput.addEventListener('blur', () => { withInput.value = count(); drawGuests(); });

    $$('.step').forEach(b => b.addEventListener('click', () => {
      withInput.value = clamp(count() + (+b.dataset.step), 0, MAX_GUESTS);
      drawGuests();
    }));

    // Отказ не спрашивает про спутников.
    $$('input[name="go"]').forEach(r => r.addEventListener('change', () => {
      const no = r.value === 'no' && r.checked;
      $('#withBox').hidden = no;
      if (no) { withInput.value = 0; drawGuests(); }
      errGo.hidden = true;
    }));

    nameInput.addEventListener('input', () => { errName.hidden = true; });

    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const name = nameInput.value.trim();
      const go = $('input[name="go"]:checked');
      errName.hidden = !!name;
      errGo.hidden = !!go;
      const bad = !name ? nameInput : (!go ? $('input[name="go"]') : null);
      if (bad) { bad.focus({ preventScroll: true }); bad.scrollIntoView({ block: 'center' }); return; }

      sendRsvp({
        name,
        going: go.value === 'yes',
        companions: $$('.guest').map(i => i.value.trim()).filter(Boolean),
        withCount: go.value === 'yes' ? count() : 0,
        note: $('#fNote').value.trim(),
        at: new Date().toISOString()
      });

      form.hidden = true;
      $('#rsvpTitle').hidden = true;
      $('#rsvpLead').hidden = true;
      // Отказ и согласие говорят разное: «ждём вас» человеку, который
      // написал «не смогу», — грубо.
      $(go.value === 'yes' ? '#thanksYes' : '#thanksNo').hidden = false;
      $('#rsvp').scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* ─── запуск ────────────────────────────────────────────────────────── */

  fillDates();
  buildIcs();
  tick();
  setInterval(tick, 30000);
  reveal();
  rsvp();
  measure();

  if (reduced) {
    // Кадр остаётся тем, что видно в начале пролёта, рамка стоит сразу.
    if (pass) pass.layers.forEach(L => { L.el.style.opacity = '1'; });
    if (frame) frame.style.setProperty('--frame-op', '1');
    if (veil) veil.style.setProperty('--veil-op', '1');
  } else {
    bindDrift();
    requestAnimationFrame(render);
  }

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(measure, 120); }, { passive: true });
  addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
})();
