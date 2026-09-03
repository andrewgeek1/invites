/* ═══════════════════════════════════════════════════════════════════════
   «Сквозь арку» — Марк и Ева

   Один цикл rAF на весь сайт. Геометрия считается только при изменении
   размера окна и лежит вне горячего пути; в кадре остаётся арифметика
   и запись строки transform, и та — только если она изменилась.
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
     протухает, а мох, папоротник и трава в кадре требуют лета.
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
        // так не получится: последний интервал висел бы справа.
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
    let left = DAY - new Date();
    if (left < 0) left = 0;
    const totalDays = Math.floor(left / 864e5);
    let units;
    if (totalDays >= 21) {
      const w = Math.floor(totalDays / 7);
      units = [
        [w, plural(w, 'неделя', 'недели', 'недель')],
        [totalDays - w * 7, plural(totalDays - w * 7, 'день', 'дня', 'дней')],
        [Math.floor(left / 36e5) % 24, plural(Math.floor(left / 36e5) % 24, 'час', 'часа', 'часов')]
      ];
    } else {
      units = [
        [totalDays, plural(totalDays, 'день', 'дня', 'дней')],
        [Math.floor(left / 36e5) % 24, plural(Math.floor(left / 36e5) % 24, 'час', 'часа', 'часов')],
        [Math.floor(left / 6e4) % 60, plural(Math.floor(left / 6e4) % 60, 'минута', 'минуты', 'минут')]
      ];
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
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//arka//RU',
      'BEGIN:VEVENT',
      `UID:arka-${DAY.getTime()}@invites`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      'SUMMARY:Свадьба Марка и Евы',
      'LOCATION:Усадьба «Заовражье»\\, село Каменки\\, Нижегородская область',
      'DESCRIPTION:Сбор у ворот в 15:30. Церемония у арки в 16:00.',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  }

  /* ─── проходы сквозь арку ────────────────────────────────────────────
     Точка схода одна на все слои сцены. Она обязана попасть в проём:
     если она придётся на кладку, гость пройдёт сквозь камень. Поэтому
     скрипт не берёт её «на глаз», а вычисляет из положения проёма
     в самом файле (числа снизу — центр дыры в долях кадра, измерены
     по альфа-каналу в assets/build.py).                                 */

  const AIM = {
    '1': { ar: 1500 / 2000, x: 0.512, y: 0.660 },   // выше центра дыры: иначе перемычка уходит за кадр
    '2': { ar: 1500 / 2100, x: 0.484, y: 0.489 },
    '3': { ar: 1500 / 2100, x: 0.544, y: 0.437 }
  };

  const passes = $$('.pass').map(el => ({
    el,
    stage: $('.stage', el),
    arch: $('.lyr--arch img', el),
    aim: AIM[el.dataset.pass],
    eyeWant: (+el.dataset.eye || 50) / 100,
    layers: $$('.lyr[data-k]', el).map(l => ({
      el: l,
      k: +l.dataset.k,
      fade: l.classList.contains('lyr--title') || l.classList.contains('lyr--word')
        ? [0.24, 0.58]
        : l.classList.contains('lyr--arch') ? [0.74, 0.93]
        : l.classList.contains('lyr--fern') ? [0.30, 0.66]
        : l.classList.contains('lyr--fog') ? [0.62, 0.90]
        : l.classList.contains('lyr--blend') ? [0.04, 0.26]
        : [0.64, 0.92],
      last: '', lastO: '', gone: false
    })),
    hint: $('.hint', el),
    top: 0, span: 1, h: 1, full: 1, near: null, lastHint: ''
  }));

  /* Куда именно смотреть — считается из того, как object-fit: cover
     обрежет кадр на текущем экране. На узком экране вертикального
     запаса нет вовсе, и тогда не картинка едет к точке схода,
     а точка схода едет к картинке. */
  function placeArch(p) {
    const W = p.stage.clientWidth, H = p.stage.clientHeight;
    if (!W || !H || !p.arch) return;
    const boxAr = W / H, imgAr = p.aim.ar;
    let posX = 0.5, posY = 0.5, eyeX = 0.5, eyeY = p.eyeWant;

    if (boxAr > imgAr) {                       // масштаб по ширине: запас по высоте
      const rh = W / imgAr, over = rh - H;
      const off = clamp(p.aim.y * rh - p.eyeWant * H, 0, Math.max(over, 0));
      posY = over > 0 ? off / over : 0;
      eyeY = (p.aim.y * rh - off) / H;
      posX = 0.5; eyeX = p.aim.x;
    } else {                                   // масштаб по высоте: запас по ширине
      const rw = H * imgAr, over = rw - W;
      const off = clamp(p.aim.x * rw - 0.5 * W, 0, Math.max(over, 0));
      posX = over > 0 ? off / over : 0;
      eyeX = (p.aim.x * rw - off) / W;
      posY = 0.5; eyeY = p.aim.y;
    }
    p.arch.style.objectPosition = `${(posX * 100).toFixed(1)}% ${(posY * 100).toFixed(1)}%`;
    p.stage.style.setProperty('--eye', `${(clamp(eyeY, 0.16, 0.86) * 100).toFixed(1)}%`);
    p.stage.style.setProperty('--eyeX', `${(clamp(eyeX, 0.2, 0.8) * 100).toFixed(1)}%`);
  }

  function measure() {
    passes.forEach(p => {
      const r = p.el.getBoundingClientRect();
      p.top = r.top + window.scrollY;
      p.h = p.stage.offsetHeight;
      p.full = p.el.offsetHeight;
      p.span = Math.max(1, p.full - p.h);
      placeArch(p);
    });
  }

  /* второй источник движения: у девяти соседних сайтов всё двигает
     прокрутка, здесь слои ещё и дышат от курсора и наклона телефона */
  let driftX = 0, driftY = 0, aimX = 0, aimY = 0;

  function frame() {
    driftX += (aimX - driftX) * 0.06;
    driftY += (aimY - driftY) * 0.06;
    const y = window.scrollY, vh = window.innerHeight;

    for (const p of passes) {
      // offsetHeight здесь читать нельзя: любое обращение к геометрии
      // из кадра форсирует пересчёт вёрстки всего документа.
      const near = y + vh >= p.top - vh && y <= p.top + p.full + vh;
      // Проходов три, а на экране всегда один. Спрятанную сцену браузер
      // не рисует и может выбросить её растр: двенадцать больших слоёв
      // в памяти разом — как раз то, за что платили кадрами.
      if (near !== p.near) {
        p.stage.style.visibility = near ? '' : 'hidden';
        p.stage.classList.toggle('is-live', near);
        p.near = near;
      }
      if (y + vh < p.top || y > p.top + p.full) continue;
      const raw = clamp((y - p.top) / p.span, 0, 1);
      const e = Math.pow(raw, 1.28);
      if (p.hint) {                       // «Прокрутите» уходит с первым же жестом
        const ho = (0.75 * (1 - smooth(raw, 0.02, 0.14))).toFixed(2);
        if (ho !== p.lastHint) { p.hint.style.opacity = ho; p.lastHint = ho; }
      }
      for (const L of p.layers) {
        const op = 1 - smooth(raw, L.fade[0], L.fade[1]);
        // Прозрачное не считаем и не держим слоем. Замер, впрочем, прироста
        // кадров на этом не показал: платит не раздувание невидимых слоёв,
        // а отрисовка растра картинок. Оставлено как разумное, а не как
        // подтверждённая оптимизация.
        const gone = op <= 0.004;
        if (gone !== L.gone) {
          L.el.style.visibility = gone ? 'hidden' : '';
          L.gone = gone;
        }
        if (gone) continue;
        const s = 1 + L.k * e;
        const d = 0.35 + L.k * 0.55;
        const tx = Math.round(driftX * d * 10) / 10;
        const ty = Math.round(driftY * d * 5) / 10;
        const t = `translate3d(${tx}px,${ty}px,0) scale(${s.toFixed(4)})`;
        if (t !== L.last) { L.el.style.transform = t; L.last = t; }
        const o = op.toFixed(3);
        if (o !== L.lastO) { L.el.style.opacity = o; L.lastO = o; }
      }
    }
    requestAnimationFrame(frame);
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
    // ради дрейфа слоёв — грубо, поэтому там источник просто выключен.
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

    function count() { return clamp(parseInt(withInput.value, 10) || 0, 0, MAX_GUESTS); }

    function drawGuests() {
      const n = count();
      const have = guests.children.length;
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

    withInput.addEventListener('input', () => { drawGuests(); });
    withInput.addEventListener('blur', () => { withInput.value = count(); drawGuests(); });

    $$('.step').forEach(b => b.addEventListener('click', () => {
      withInput.value = clamp(count() + (+b.dataset.step), 0, MAX_GUESTS);
      drawGuests();
    }));

    // Отказ не спрашивает про спутников.
    $$('input[name="go"]').forEach(r => r.addEventListener('change', () => {
      const box = $('#withBox');
      const no = r.value === 'no' && r.checked;
      box.hidden = no;
      if (no) { withInput.value = 0; drawGuests(); }
      errGo.hidden = true;
    }));

    nameInput.addEventListener('input', () => { errName.hidden = true; });

    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const name = nameInput.value.trim();
      const go = $('input[name="go"]:checked');
      let bad = null;
      errName.hidden = !!name;
      errGo.hidden = !!go;
      if (!name) bad = nameInput;
      else if (!go) bad = $('input[name="go"]');
      if (bad) { bad.focus({ preventScroll: true }); bad.scrollIntoView({ block: 'center' }); return; }

      const companions = $$('.guest').map(i => i.value.trim()).filter(Boolean);
      sendRsvp({
        name,
        going: go.value === 'yes',
        companions,
        withCount: go.value === 'yes' ? count() : 0,
        note: $('#fNote').value.trim(),
        at: new Date().toISOString()
      });

      form.hidden = true;
      $('#rsvpTitle').hidden = true;
      $('.sec--rsvp .lead').hidden = true;
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
    // Кадр остаётся тем, что видно в начале прохода: без масштаба и сдвига.
    passes.forEach(p => p.layers.forEach(L => { L.el.style.opacity = '1'; }));
  } else {
    bindDrift();
    requestAnimationFrame(frame);
  }

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(measure, 120); }, { passive: true });
  addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
})();
