/* ═══════════════════════════════════════════════════════════════════
   «Синий шёлк» — Матвей и Нина

   Порядок важен: даты подставляются ПЕРВЫМИ, до всего остального —
   переключатель языка кэширует русский вариант из innerHTML при первом
   запуске, и подстановка после него молча теряется.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── дата демо ──────────────────────────────────────────────────
     Живая дата вместо фиксированной: фиксированная протухает, дальняя
     показывает в отсчёте бессмысленные «375 дней». Берём ближайшую
     субботу не раньше чем через 70 дней и обязательно в тёплом сезоне —
     вечер у воды со сбором в 17:00 в январе читается абсурдом.
     Под реальную пару: заменить тело функции одной строкой
     return new Date(2027, 8, 4, 17, 0);                              */

  function demoDate() {
    var d = new Date();
    d.setHours(17, 0, 0, 0);
    d.setDate(d.getDate() + 70);
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1);        // 6 — суббота
    while (d.getMonth() < 5 || d.getMonth() > 8) {              // июнь … сентябрь
      d.setDate(d.getDate() + 7);
    }
    return d;
  }

  var WEDDING  = demoDate();
  var DEADLINE = new Date(WEDDING); DEADLINE.setDate(DEADLINE.getDate() - 30);

  var MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var MONTHS_EN  = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
  var DOW_RU = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  var DOW_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /* Строки, которые рождаются в скрипте, а не в разметке. */
  var T = {
    ru: {
      seat: 'Занять место за&nbsp;столом',
      sorry: 'Передать, что не&nbsp;сможем',
      noName: 'Напишите, как вас зовут',
      noComp: 'Впишите имена — по ним рассаживаем столы',
      failed: 'Не отправилось. Попробуйте ещё раз или позвоните нам',
      guest: function (i, n) { return 'Имя ' + (n === 1 ? 'спутника' : 'спутника ' + i); },
      thanksYes: 'Ждём вас',
      thanksNo: 'Жаль',
      textYes: function (n) {
        return 'Записали: ' + n + ' ' + plural(n, 'место', 'места', 'мест') +
               '. За неделю до вечера пришлём напоминание и схему проезда.';
      },
      textNo: 'Спасибо, что ответили. Будем скучать — и обязательно покажем фотографии.',
      units: { mon: ['месяц', 'месяца', 'месяцев'], day: ['день', 'дня', 'дней'],
               hour: ['час', 'часа', 'часов'], min: ['минута', 'минуты', 'минут'] },
      wipe: 'Удалить все ответы?'
    },
    en: {
      seat: 'Save us a seat',
      sorry: 'Tell them we cannot',
      noName: 'Please tell us your name',
      noComp: 'Add the names — we seat the tables by them',
      failed: 'Did not go through. Try again or give us a call',
      guest: function (i, n) { return 'Name of guest' + (n === 1 ? '' : ' ' + i); },
      thanksYes: 'See you there',
      thanksNo: 'A pity',
      textYes: function (n) {
        return 'Noted: ' + n + (n === 1 ? ' seat' : ' seats') +
               '. A week before the evening we will send a reminder and directions.';
      },
      textNo: 'Thank you for answering. We will miss you — and will show you the photographs.',
      units: { mon: ['month', 'months', 'months'], day: ['day', 'days', 'days'],
               hour: ['hour', 'hours', 'hours'], min: ['minute', 'minutes', 'minutes'] },
      wipe: 'Delete all answers?'
    }
  };

  var LANG = 'ru';
  function t(key) { return T[LANG][key]; }

  /* Русский вариант снимается ДО подстановки дат — иначе в кэш попадёт
     готовая строка вместо <span data-dt>, и обратное переключение
     оставит дату замороженной. */
  $$('[data-en]').forEach(function (el) {
    if (!el.hasAttribute('data-ru')) el.setAttribute('data-ru', el.innerHTML);
  });

  function two(n) { return (n < 10 ? '0' : '') + n; }

  /* Русские окончания: «1 день / 2 дня / 5 дней». */
  function plural(n, one, few, many) {
    var a = n % 100, b = n % 10;
    if (a > 4 && a < 21) return many;
    if (b === 1) return one;
    if (b > 1 && b < 5) return few;
    return many;
  }

  /* Виды подстановки. Элемент помечается data-dt="вид".
     Месяцы и дни недели берутся по текущему языку — после переключения
     fillDates() зовётся заново. */
  function months() { return LANG === 'en' ? MONTHS_EN : MONTHS_GEN; }

  var DT = {
    'dow-day':   function (d) {
      return (LANG === 'en' ? DOW_EN : DOW_RU)[d.getDay()] + ', ' + d.getDate() + ' ' + months()[d.getMonth()];
    },
    'day':       function (d) { return d.getDate() + ' ' + months()[d.getMonth()]; },
    'day-year':  function (d) { return d.getDate() + ' ' + months()[d.getMonth()] + ' ' + d.getFullYear(); },
    'year':      function (d) { return String(d.getFullYear()); },
    'iso':       function (d) { return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()); },
    'deadline':  function ()  { return DEADLINE.getDate() + ' ' + months()[DEADLINE.getMonth()]; }
  };

  function fillDates() {
    $$('[data-dt]').forEach(function (el) {
      var fn = DT[el.getAttribute('data-dt')];
      if (fn) el.textContent = fn(WEDDING);
    });
  }

  fillDates();

  /* ── появление по лесенке ───────────────────────────────────────
     IntersectionObserver, а не прокрутка: дешевле и не держит поток.  */

  var targets = $$('.rise');

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
    $$('.shine').forEach(function (el) { el.classList.add('is-seen'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });

    targets.forEach(function (el) { io.observe(el); });

    /* Сияние крутится только пока его видно: иначе браузер каждый кадр
       перерисовывает текст, которого нет на экране. */
    var ioShine = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle('is-seen', e.isIntersecting);
      });
    }, { threshold: 0 });

    $$('.shine').forEach(function (el) { ioShine.observe(el); });
  }

  /* ── фоновое видео ──────────────────────────────────────────────
     Источник ставится здесь, а не в разметке: 16 МБ незачем тянуть
     на телефон и в режиме reduced-motion. Там остаётся постер.       */

  (function silk() {
    var v = document.getElementById('bgv');
    if (!v) return;

    var small = window.matchMedia('(max-width: 767px)').matches;
    if (small || reduce) return;

    v.src = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4';
    v.load();

    v.addEventListener('loadeddata', function () {
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* автоплей запрещён — остаётся постер */ });
    });

    /* Кадр за экраном декодировать незачем. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) v.pause(); else v.play().catch(function () {});
    });
  }());

  /* Обложка появляется сразу, не дожидаясь прокрутки. */
  requestAnimationFrame(function () {
    var cover = $('.cover');
    if (cover) cover.classList.add('is-in');
  });

  /* ── тише во время прокрутки ────────────────────────────────────
     Пока страница едет, сияние стоит: см. комментарий в styles.css.  */

  (function calmOnScroll() {
    var shines = $$('.shine');
    if (!shines.length) return;

    var timer, calm = false;

    /* Свойство ставится прямо на четыре элемента, а не классом на <html>:
       класс на корне заставляет браузер пересчитывать стили всего
       документа, и первый же такой пересчёт при 4× замедлении стоил
       нескольких кадров подряд. */
    function set(state) {
      for (var i = 0; i < shines.length; i++) shines[i].style.animationPlayState = state;
    }

    window.addEventListener('scroll', function () {
      if (!calm) { calm = true; set('paused'); }
      clearTimeout(timer);
      timer = setTimeout(function () { calm = false; set(''); }, 180);
    }, { passive: true });
  }());

  /* ── язык ───────────────────────────────────────────────────────
     Тексты лежат в разметке (data-ru / data-en), строки скрипта —
     в словаре T. После подмены innerHTML даты подставляются заново:
     внутри переведённых блоков живут свои <span data-dt>.            */

  var onLang = [];

  (function language() {
    var btn = document.getElementById('lang');
    if (!btn) return;

    btn.addEventListener('click', function () {
      LANG = LANG === 'ru' ? 'en' : 'ru';
      document.documentElement.lang = LANG;

      $$('[data-en]').forEach(function (el) {
        el.innerHTML = el.getAttribute(LANG === 'en' ? 'data-en' : 'data-ru');
      });

      fillDates();
      btn.textContent = LANG === 'en' ? 'RU' : 'EN';
      btn.lang = LANG === 'en' ? 'ru' : 'en';
      onLang.forEach(function (fn) { fn(); });
    });
  }());

  /* ── отсчёт ─────────────────────────────────────────────────────
     Раз в полминуты: секунд на экране нет, чаще незачем.            */

  (function countdown() {
    var box = document.getElementById('count');
    if (!box) return;

    var cells = box.querySelectorAll('b');
    var caps  = box.querySelectorAll('span');

    function tick() {
      var left = WEDDING - new Date();
      if (left < 0) left = 0;

      var mins  = Math.floor(left / 60000);
      var days  = Math.floor(mins / 1440);
      var parts;

      /* За полгода до даты «осталось 276 дней, 0 часов, 22 минуты» — это
         шум, а не отсчёт: минуты меняются, а смысла в них нет. Ближе к
         дате единицы становятся мельче сами. */
      var u = t('units');
      var hours = Math.floor(mins % 1440 / 60);

      function cell(n, kind) { return [n, plural(n, u[kind][0], u[kind][1], u[kind][2])]; }

      if (days > 120) {
        var months = Math.floor(days / 30.44);
        parts = [cell(months, 'mon'), cell(days - Math.round(months * 30.44), 'day'), cell(hours, 'hour')];
      } else {
        parts = [cell(days, 'day'), cell(hours, 'hour'), cell(mins % 60, 'min')];
      }

      parts.forEach(function (p, i) {
        cells[i].textContent = p[0];
        caps[i].textContent = p[1];
      });
    }

    tick();
    setInterval(tick, 30000);
    onLang.push(tick);
  }());

  /* ── календарь ──────────────────────────────────────────────────
     Файл собирается на лету: правится дата — правится и приглашение. */

  (function calendar() {
    var btn = document.getElementById('ics');
    if (!btn) return;

    function stamp(d) {
      return d.getUTCFullYear() + two(d.getUTCMonth() + 1) + two(d.getUTCDate()) + 'T' +
             two(d.getUTCHours()) + two(d.getUTCMinutes()) + '00Z';
    }

    btn.addEventListener('click', function () {
      var end = new Date(WEDDING); end.setHours(end.getHours() + 8);
      var body = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//zaton//invite//RU', 'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        'UID:' + Date.now() + '@zaton',
        'DTSTAMP:' + stamp(new Date()),
        'DTSTART:' + stamp(WEDDING),
        'DTEND:' + stamp(end),
        'SUMMARY:Свадьба Матвея и Нины',
        'LOCATION:Нижний Новгород, Гребной канал, 3, павильон «Затон»',
        'DESCRIPTION:Сбор в 17:00. Автобус от площади Минина в 16:15.',
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');

      var url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
      var a = document.createElement('a');
      a.href = url; a.download = 'matvey-nina.ics';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  }());

  /* ── ответ гостя ────────────────────────────────────────────────
     Единственная точка отправки. Сейчас пишет в localStorage; чтобы
     ответы уходили в телеграм-бота или на почту, раскомментируйте
     fetch и подставьте свой адрес — остальное менять не нужно.      */

  var STORE = 'mn-rsvp';

  function sendRsvp(payload) {
    // return fetch('https://ваш-домен/rsvp', {
    //   method: 'POST',
    //   headers: { 'content-type': 'application/json' },
    //   body: JSON.stringify(payload)
    // }).then(function (r) {
    //   if (!r.ok) throw new Error('HTTP ' + r.status);
    // });
    try {
      var all = JSON.parse(localStorage.getItem(STORE) || '[]');
      all.push(payload);
      localStorage.setItem(STORE, JSON.stringify(all));
    } catch (e) {}
    return Promise.resolve();
  }

  (function rsvp() {
    var form = document.getElementById('rsvp');
    if (!form) return;

    var thanks   = document.getElementById('thanks');
    var head     = $('.answer__head');
    var wrapG    = document.getElementById('wrap-guests');
    var wrapF    = document.getElementById('wrap-food');
    var wrapB    = document.getElementById('wrap-bus');
    var comps    = document.getElementById('companions');
    var submitEl = document.getElementById('f-submit');
    var label    = submitEl.querySelector('.btn__label');

    function going() { return form.querySelector('[name="going"]:checked').value === 'yes'; }
    function guestsN() { return +form.querySelector('[name="guests"]:checked').value; }

    function showErr(name, text) {
      var box = form.querySelector('.err[data-for="' + name + '"]');
      if (box) box.textContent = text || '';
    }

    /* Выпадающий список спутников пожилые гости не понимали — поэтому
       кнопки, а под ними обязательные строки на каждое имя. */
    function drawCompanions() {
      var n = guestsN();
      var have = comps.children.length;
      if (n === have) return;

      comps.textContent = '';
      for (var i = 1; i <= n; i++) {
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.name = 'companion' + i;
        inp.placeholder = t('guest')(i, n);
        inp.setAttribute('aria-label', t('guest')(i, n));
        comps.appendChild(inp);
      }
      showErr('companions', '');
    }

    function syncGoing() {
      var yes = going();
      [wrapG, wrapF, wrapB].forEach(function (el) { el.hidden = !yes; });
      label.innerHTML = yes ? t('seat') : t('sorry');
    }

    form.addEventListener('change', function (e) {
      if (e.target.name === 'going') syncGoing();
      if (e.target.name === 'guests') drawCompanions();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.name.value.trim();
      if (name.length < 2) {
        showErr('name', t('noName'));
        form.name.focus();
        return;
      }
      showErr('name', '');

      var companions = [];
      if (going()) {
        var empty = false;
        Array.prototype.forEach.call(comps.querySelectorAll('input'), function (inp) {
          var v = inp.value.trim();
          if (!v) empty = true;
          companions.push(v);
        });
        if (empty) {
          showErr('companions', t('noComp'));
          return;
        }
        showErr('companions', '');
      }

      var payload = {
        name: name,
        going: going(),
        companions: going() ? companions : [],
        food: going() ? form.food.value : null,
        bus: going() ? form.bus.value === 'yes' : null,
        note: form.note.value.trim(),
        at: new Date().toISOString()
      };

      submitEl.disabled = true;

      sendRsvp(payload).then(function () {
        form.hidden = true;
        if (head) head.hidden = true;
        thanks.hidden = false;

        var total = 1 + payload.companions.length;
        document.getElementById('thanks-h').textContent = payload.going ? t('thanksYes') : t('thanksNo');
        document.getElementById('thanks-text').textContent = payload.going ? t('textYes')(total) : t('textNo');

        thanks.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      }).catch(function () {
        submitEl.disabled = false;
        showErr('name', t('failed'));
      });
    });

    document.getElementById('again').addEventListener('click', function () {
      thanks.hidden = true;
      form.hidden = false;
      if (head) head.hidden = false;
      submitEl.disabled = false;
      form.reset();
      syncGoing();
      drawCompanions();
      form.name.focus();
    });

    syncGoing();
    drawCompanions();

    /* При смене языка перерисовываем то, что живёт в скрипте. */
    onLang.push(function () {
      syncGoing();
      comps.textContent = '';
      drawCompanions();
    });
  }());

  /* ── админка ────────────────────────────────────────────────────
     ?admin=1 — список ответов и выгрузка. Гостям не видна.          */

  (function admin() {
    if (!/[?&]admin=1\b/.test(location.search)) return;

    var rows = [];
    try { rows = JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e) {}

    var going = rows.filter(function (r) { return r.going; });
    var seats = going.reduce(function (s, r) { return s + 1 + (r.companions || []).length; }, 0);

    var box = document.createElement('div');
    box.className = 'admin';
    box.innerHTML =
      '<div class="admin__head"><b>Ответы</b>' +
      '<span>' + rows.length + ' ' + plural(rows.length, 'ответ', 'ответа', 'ответов') +
      ' / ' + seats + ' ' + plural(seats, 'место', 'места', 'мест') +
      ' / ' + (rows.length - going.length) + ' ' + plural(rows.length - going.length, 'отказ', 'отказа', 'отказов') + '</span>' +
      '<button type="button" id="admin-csv">Выгрузить CSV</button>' +
      '<button type="button" id="admin-clear">Очистить</button></div>' +
      '<div class="admin__list">' + (rows.length
        ? rows.map(function (r) {
            return '<p>' + (r.going ? '+ ' : '− ') + escapeHtml(r.name) +
                   (r.companions && r.companions.length ? ' (' + r.companions.map(escapeHtml).join(', ') + ')' : '') +
                   (r.going ? ' / ' + ({ meat: 'мясо', fish: 'рыба', veg: 'без мяса' }[r.food] || '—') +
                              ' / ' + (r.bus ? 'автобус' : 'сами') : '') +
                   (r.note ? ' / ' + escapeHtml(r.note) : '') + '</p>';
          }).join('')
        : '<p>пока пусто</p>') +
      '</div>';
    document.body.appendChild(box);

    document.getElementById('admin-csv').addEventListener('click', function () {
      var head = ['Имя', 'Придёт', 'Спутники', 'Еда', 'Автобус', 'Комментарий', 'Когда ответил'];
      var lines = [head].concat(rows.map(function (r) {
        return [r.name, r.going ? 'да' : 'нет', (r.companions || []).join(', '),
                { meat: 'мясо', fish: 'рыба', veg: 'без мяса' }[r.food] || '',
                r.bus === null ? '' : (r.bus ? 'да' : 'нет'), r.note || '', r.at];
      }));
      var csv = lines.map(function (row) {
        return row.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';');
      }).join('\r\n');

      /* BOM — иначе Excel открывает кириллицу кракозябрами. */
      var url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      var a = document.createElement('a');
      a.href = url; a.download = 'otvety.csv';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });

    document.getElementById('admin-clear').addEventListener('click', function () {
      if (!confirm(t('wipe'))) return;
      try { localStorage.removeItem(STORE); } catch (e) {}
      location.reload();
    });

    function escapeHtml(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
  }());
}());
