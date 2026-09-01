/* =========================================================
   Артём и Ксения — 11.09.2027
   Ванильный JS, без зависимостей.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     Дата демонстрации.
     Это витрина, а не приглашение конкретной пары. Фиксированная
     дата через пару месяцев протухает, и счётчик уходит в минус,
     а слишком дальняя показывает бессмысленные «375 дней».
     Поэтому берём ближайшую субботу не раньше чем через 60 дней
     и подставляем её во все места на странице разом.

     Под реальную пару — заменить тело функции на одну строку:
         return new Date('2027-09-11T15:00:00+03:00');
     --------------------------------------------------------- */
  function demoDate() {
    var d = new Date();
    d.setHours(15, 0, 0, 0);
    d.setDate(d.getDate() + 60);
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1);   // 6 — суббота
    return d;
  }

  var WEDDING  = demoDate();
  var DEADLINE = new Date(WEDDING); DEADLINE.setDate(DEADLINE.getDate() - 14);
  var STORE    = 'ak-rsvp-demo';
  var reduce  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------
     Дата в разметке: элемент помечен data-dt="вид", остальное
     проставляется здесь. Заполняем ДО переключателя языка —
     он кэширует русский вариант из innerHTML при первом запуске.
     --------------------------------------------------------- */
  var MON_RU = ['января','февраля','марта','апреля','мая','июня',
                'июля','августа','сентября','октября','ноября','декабря'];
  var MON_EN = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

  function stamp(d, kind, en) {
    var day = d.getDate(), m = d.getMonth(), y = d.getFullYear();
    var ru = day + '&nbsp;' + MON_RU[m], enn = day + ' ' + MON_EN[m];
    switch (kind) {
      case 'full':     return en ? enn + ' ' + y : ru + ' ' + y;
      case 'daymonth': return en ? enn : ru;
      case 'full-dow': return en ? enn + ' ' + y + ' / Saturday'
                                 : ru + ' ' + y + ' / суббота';
      case 'dock':     return pad2(day) + '.' + pad2(m + 1) + '.' + y +
                              (en ? ' / Osinki Estate' : ' / усадьба «Осинки»');
      case 'arrive':   return en ? 'Saturday, guests arrive at 15:00'
                                 : 'Суббота, сбор гостей в&nbsp;15:00';
      case 'seeyou':   return en ? 'See you on<br>' + enn : 'До встречи<br>' + ru;
      case 'credit':   return (en ? 'Artyom &amp; Ksenia / ' : 'Артём и Ксения / ') +
                              (en ? enn : ru) + ' ' + y;
      case 'by':       return en ? 'by ' + enn : 'до&nbsp;' + ru;
      case 'need-by':  return en ? 'We need your answer by ' + enn
                                 : 'Ответ нужен до&nbsp;' + ru;
      case 'change-by':return en ? 'You can change the answer at any time until ' + enn
                                 : 'Ответ можно изменить в&nbsp;любой момент до&nbsp;' + ru;
    }
    return '';
  }

  (function fillDates() {
    $$('[data-dt]').forEach(function (el) {
      var kind = el.dataset.dt;
      var onDeadline = /^(deadline|by|need-by|change-by)$/.test(kind);
      var d = onDeadline ? DEADLINE : WEDDING;
      var k = kind === 'deadline' ? 'full' : kind;
      el.innerHTML     = stamp(d, k, false);
      el.dataset.en    = stamp(d, k, true);
    });
    var plain = stamp(WEDDING, 'full', false).replace(/&nbsp;/g, ' ');
    document.title = 'Артём и Ксения — ' + plain;
  })();

  /* ---------------------------------------------------------
     Словарь для строк, которые рождаются в JS
     --------------------------------------------------------- */
  var T = {
    ru: {
      table: 'Стол', of: 'из', seatedWith: 'Рядом с вами:', atTable: 'За этим столом:', tableIs: 'Стол',
      notFound: 'Такого имени в списке нет. Проверьте написание или напишите Марине — телефон в самом низу страницы.',
      youSit: 'Вы сидите за столом',
      needName: 'Напишите имя и фамилию — так мы подпишем карточку.',
      needGoing: 'Отметьте, придёте вы или нет.',
      needPlus: 'Напишите имя спутника.',
      thanksYes: 'Спасибо, ждём вас',
      thanksNo: 'Жаль, что не получится',
      textYes: 'Ответ записан. Ваше место за столом придержим. Если что-то изменится — вернитесь на эту страницу и заполните форму заново.',
      textNo: 'Ответ записан. Будем скучать — и обязательно пришлём фотографии. Если планы поменяются до 28 августа, просто заполните форму ещё раз.',
      answers: 'Ответов', coming: 'Придут', declined: 'Не смогут', guests: 'Всего гостей',
      empty: 'Пока ни одного ответа. Заполните форму на странице — ответ появится здесь.',
      yes: 'придёт', no: 'не сможет', wipe: 'Удалить все сохранённые ответы?',
      v: { meat: 'мясо', fish: 'рыба', veg: 'вегетарианское',
           red: 'красное вино', white: 'белое вино', strong: 'крепкое', none: 'без алкоголя',
           there: 'автобус туда, 14:00', there2: 'автобус туда, 14:30', back: 'автобус обратно' },
      hdr: ['Имя', 'Контакт', 'Придёт', 'Спутник', 'Горячее', 'Напитки', 'Аллергия', 'Автобус', 'Комментарий', 'Когда']
    },
    en: {
      table: 'Table', of: 'of', seatedWith: 'Sitting with you:', atTable: 'At this table:', tableIs: 'Table',
      notFound: 'That name is not on the list. Check the spelling or write to Marina — her number is at the bottom of the page.',
      youSit: 'You are seated at table',
      needName: 'Please write your name and surname — we use it for the place card.',
      needGoing: 'Please tell us whether you are coming.',
      needPlus: 'Please write your plus one’s name.',
      thanksYes: 'Thank you, see you there',
      thanksNo: 'Sorry you can’t make it',
      textYes: 'Your answer is saved. We will hold your seat. If anything changes, come back to this page and fill the form in again.',
      textNo: 'Your answer is saved. We will miss you — and we will send photographs. If your plans change before 28 August, just fill the form in again.',
      answers: 'Answers', coming: 'Coming', declined: 'Can’t come', guests: 'Guests in total',
      empty: 'No answers yet. Fill in the form on the page and it will show up here.',
      yes: 'coming', no: 'can’t come', wipe: 'Delete every saved answer?',
      v: { meat: 'meat', fish: 'fish', veg: 'vegetarian',
           red: 'red wine', white: 'white wine', strong: 'spirits', none: 'no alcohol',
           there: 'bus there, 14:00', there2: 'bus there, 14:30', back: 'bus back' },
      hdr: ['Name', 'Contact', 'Coming', 'Plus one', 'Main', 'Drinks', 'Allergies', 'Bus', 'Note', 'Sent']
    }
  };
  var lang = 'ru';
  var lastRec = null;
  var t = function (k) { return T[lang][k]; };
  var vv = function (codes) {
    return String(codes || '').split(' ').filter(Boolean)
      .map(function (c) { return T[lang].v[c] || c; }).join(', ');
  };

  /* ---------------------------------------------------------
     Появление блоков — ступенчато, с блюром
     --------------------------------------------------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  $$('section, .hero, .foot').forEach(function (s) { io.observe(s); });
  $$('.hero .rise').forEach(function (el) {
    requestAnimationFrame(function () { el.classList.add('is-in'); });
  });

  /* ---------------------------------------------------------
     Док
     --------------------------------------------------------- */
  var dock = $('#dock');
  var dockOn = false;
  var syncDock = function () {
    var want = window.scrollY > window.innerHeight * 0.9;
    if (want === dockOn) return;
    dockOn = want;
    dock.classList.toggle('is-on', want);
    dock.setAttribute('aria-hidden', want ? 'false' : 'true');
  };
  window.addEventListener('scroll', syncDock, { passive: true });
  syncDock();

  /* ---------------------------------------------------------
     Обратный отсчёт
     --------------------------------------------------------- */
  var clock = $('#clock');
  if (clock) {
    var cells = {
      d: $('[data-unit="d"]', clock), h: $('[data-unit="h"]', clock),
      m: $('[data-unit="m"]', clock), s: $('[data-unit="s"]', clock)
    };
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var tick = function () {
      var left = WEDDING - new Date();
      if (left < 0) left = 0;
      var sec = Math.floor(left / 1000);
      cells.d.textContent = Math.floor(sec / 86400);
      cells.h.textContent = pad(Math.floor(sec % 86400 / 3600));
      cells.m.textContent = pad(Math.floor(sec % 3600 / 60));
      cells.s.textContent = pad(sec % 60);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------
     Файл .ics
     --------------------------------------------------------- */
  var icsBtn = $('#ics');
  if (icsBtn) {
    icsBtn.addEventListener('click', function () {
      // те же сутки, что и в счётчике: 15:00 по Москве = 12:00 UTC
      var ymd = WEDDING.getFullYear() + pad2(WEDDING.getMonth() + 1) + pad2(WEDDING.getDate());
      var now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
      var ics = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//osinki//wedding//RU', 'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        'UID:ak-' + ymd + '@osinki',
        'DTSTAMP:' + now,
        'DTSTART:' + ymd + 'T120000Z',
        'DTEND:' + ymd + 'T220000Z',
        'SUMMARY:Свадьба Артёма и Ксении',
        'LOCATION:Усадьба «Осинки»\\, село Богородицкое\\, Нижегородская область',
        'DESCRIPTION:Сбор гостей в 15:00\\, церемония в 16:00. Автобус от площади Минина в 14:00 и 14:30.',
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');
      var url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      var a = document.createElement('a');
      a.href = url; a.download = 'artyom-ksenia-' + ymd + '.ics';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  }

  /* ---------------------------------------------------------
     Фирменное взаимодействие: скролл двигает плёнку
     --------------------------------------------------------- */
  var reel = $('#reel'), track = $('#reelTrack'), bar = $('#reelBar');
  if (reel && track && !reduce) {
    var queued = false;
    var paint = function () {
      queued = false;
      var box = reel.getBoundingClientRect();
      var span = reel.offsetHeight - window.innerHeight;
      if (span <= 0) return;
      var p = Math.min(1, Math.max(0, -box.top / span));
      var dist = track.scrollWidth - window.innerWidth;
      if (dist < 0) dist = 0;
      track.style.transform = 'translate3d(' + (-dist * p).toFixed(1) + 'px,0,0)';
      if (bar) bar.style.left = (p * 84).toFixed(2) + '%';
    };
    var queue = function () { if (!queued) { queued = true; requestAnimationFrame(paint); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    paint();
  }

  /* ---------------------------------------------------------
     Рассадка: схема зала
     --------------------------------------------------------- */
  var TABLES = [
    { n: '01', ru: 'Рождественская', en: 'Rozhdestvenskaya', g: ['Марина Соколова', 'Игорь Соколов', 'Полина Ветрова', 'Кирилл Ветров', 'Ася Гринёва'] },
    { n: '02', ru: 'Карелия',        en: 'Karelia',          g: ['Никита Дорохов', 'Лера Дорохова', 'Егор Пантелеев', 'Саша Мельник', 'Тимур Хайруллин'] },
    { n: '03', ru: 'Ковалиха',       en: 'Kovalikha',        g: ['Ольга Бирюкова', 'Павел Бирюков', 'Настя Кравец', 'Рома Кравец', 'Женя Лапина'] },
    { n: '04', ru: 'Оранжерея',      en: 'The Orangery',     g: ['Валентина Ильинична', 'Сергей Петрович', 'Тамара Львовна', 'Борис Аркадьевич', 'Нина Фёдоровна'] },
    { n: '05', ru: 'Терраса',        en: 'The Terrace',      g: ['Даша Копылова', 'Никита Воронов', 'Лиза Тарасова', 'Стас Тарасов', 'Юля Осипова'] },
    { n: '06', ru: 'Тихон',          en: 'Tikhon',           g: ['Максим Юдин', 'Катя Юдина', 'Глеб Ремизов', 'Соня Ремизова', 'Роман Тихонов'] }
  ];

  var norm = function (s) { return (s || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim(); };

  var plural = function (n, one, few, many) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return few;
    return many;
  };
  var seatsWord = function (n) {
    return lang === 'ru' ? n + ' ' + plural(n, 'гость', 'гостя', 'гостей')
                         : n + ' ' + (n === 1 ? 'guest' : 'guests');
  };

  /* геометрия плана: широкая раскладка и вертикальная под телефон */
  var PLAN = {
    wide: {
      // Стол 02 стоит выше соседних — это композиция, он ближе к церемонии.
      // Раньше его верхняя точка-место (cy − ring = 108 − 78 = 30) попадала
      // внутрь плашки зоны (y 0–44). Вся раскладка сдвинута вниз на 30,
      // холст вырос на столько же: клиренс стал 16px вместо −14.
      vb: [1160, 656], r: 54, ring: 78, num: 22, name: 16,
      zones: [
        { x: 430, y: 0,   w: 300, h: 44, ru: 'ТЕРРАСА / ЦЕРЕМОНИЯ', en: 'TERRACE / CEREMONY' },
        { x: 452, y: 296, w: 256, h: 92, ru: 'ТАНЦПОЛ',             en: 'DANCE FLOOR' }
      ],
      pos: [[140, 160], [580, 138], [1020, 160], [140, 478], [580, 500], [1020, 478]]
    },
    tall: {
      vb: [560, 940], r: 52, ring: 74, num: 21, name: 15,
      zones: [
        { x: 150, y: 0,   w: 260, h: 48, ru: 'ТЕРРАСА / ЦЕРЕМОНИЯ', en: 'TERRACE / CEREMONY' },
        { x: 175, y: 580, w: 210, h: 96, ru: 'ТАНЦПОЛ',             en: 'DANCE FLOOR' }
      ],
      pos: [[145, 170], [415, 170], [145, 420], [415, 420], [145, 800], [415, 800]]
    }
  };

  var NS = 'http://www.w3.org/2000/svg';
  var el = function (tag, attrs, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  };

  var planBox = $('#plan');
  var hitTable = -1, hitSeat = -1;

  function drawPlan() {
    if (!planBox) return;
    var L = window.matchMedia('(max-width: 860px)').matches ? PLAN.tall : PLAN.wide;
    planBox.innerHTML = '';
    planBox.classList.toggle('is-hunt', hitTable >= 0);

    var svg = el('svg', {
      viewBox: '0 0 ' + L.vb[0] + ' ' + L.vb[1],
      role: 'img',
      'aria-label': lang === 'ru' ? 'Схема зала: шесть столов, терраса и танцпол'
                                  : 'Floor plan: six tables, terrace and dance floor'
    });

    L.zones.forEach(function (z) {
      svg.appendChild(el('rect', { x: z.x, y: z.y, width: z.w, height: z.h, class: 'plan__zone' }));
      svg.appendChild(el('text', { x: z.x + z.w / 2, y: z.y + z.h / 2 + 4, class: 'plan__zt' }, lang === 'ru' ? z.ru : z.en));
    });

    TABLES.forEach(function (tb, i) {
      var cx = L.pos[i][0], cy = L.pos[i][1];
      var g = el('g', {
        class: 'plan__t' + (i === hitTable ? ' is-hit' : ''),
        tabindex: '0', role: 'button',
        'aria-label': (lang === 'ru' ? 'Стол ' : 'Table ') + tb.n + ' ' + (lang === 'ru' ? tb.ru : tb.en)
      });

      tb.g.forEach(function (name, k) {
        var a = (-90 + k * (360 / tb.g.length)) * Math.PI / 180;
        g.appendChild(el('circle', {
          cx: (cx + Math.cos(a) * L.ring).toFixed(1),
          cy: (cy + Math.sin(a) * L.ring).toFixed(1),
          r: 6,
          class: 'plan__seat' + (i === hitTable && k === hitSeat ? ' is-you' : '')
        }));
      });

      g.appendChild(el('circle', { cx: cx, cy: cy, r: L.r, class: 'plan__disc' }));
      g.appendChild(el('text', { x: cx, y: cy + 8, class: 'plan__num', 'font-size': L.num }, tb.n));
      g.appendChild(el('text', { x: cx, y: cy + L.ring + 30, class: 'plan__name', 'font-size': L.name }, '«' + (lang === 'ru' ? tb.ru : tb.en) + '»'));
      g.appendChild(el('text', { x: cx, y: cy + L.ring + 49, class: 'plan__cnt' }, seatsWord(tb.g.length)));

      var pick = function () { showTable(i, -1); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });
      svg.appendChild(g);
    });

    planBox.appendChild(svg);
  }

  var seatOut = $('#seatOut');

  function card(cls, build) {
    seatOut.innerHTML = '';
    var d = document.createElement('div');
    d.className = cls;
    build(d);
    seatOut.appendChild(d);
  }

  function showTable(i, seat) {
    hitTable = i; hitSeat = seat;
    drawPlan();
    var tb = TABLES[i];
    card('card', function (d) {
      var h = document.createElement('p'); h.className = 'card__t';
      h.textContent = (seat >= 0 ? t('youSit') : t('tableIs')) + ' ';
      var b = document.createElement('b'); b.textContent = '«' + (lang === 'ru' ? tb.ru : tb.en) + '»';
      h.appendChild(b);
      d.appendChild(h);
      var list = seat >= 0 ? tb.g.filter(function (_, k) { return k !== seat; }) : tb.g;
      var p = document.createElement('p');
      p.textContent = (seat >= 0 ? t('seatedWith') : t('atTable')) + ' ' + list.join(', ') + '.';
      d.appendChild(p);
    });
  }

  function findGuest(q) {
    var res = { t: -1, s: -1 };
    TABLES.some(function (tb, i) {
      return tb.g.some(function (name, k) {
        var nn = norm(name);
        if (nn === q || nn.indexOf(q) === 0 || nn.split(' ').some(function (w) { return w === q; })
            || (q.length > 3 && nn.indexOf(q) > -1)) { res = { t: i, s: k }; return true; }
        return false;
      });
    });
    return res;
  }

  var seatForm = $('#seatForm'), seatInput = $('#seatInput');

  function runSearch(loose) {
    var q = norm(seatInput.value);
    if (!q) { hitTable = -1; hitSeat = -1; drawPlan(); seatOut.innerHTML = ''; return; }
    var r = findGuest(q);
    if (r.t >= 0) { showTable(r.t, r.s); return; }
    if (loose) return;                       // при наборе не ругаться раньше времени
    hitTable = -1; hitSeat = -1; drawPlan();
    card('card card--miss', function (d) {
      var p = document.createElement('p'); p.textContent = t('notFound'); d.appendChild(p);
    });
  }

  if (seatForm) {
    seatForm.addEventListener('submit', function (e) { e.preventDefault(); runSearch(false); });
    seatInput.addEventListener('input', function () { runSearch(true); });
  }

  drawPlan();
  var planTimer;
  window.addEventListener('resize', function () {
    clearTimeout(planTimer);
    planTimer = setTimeout(drawPlan, 180);
  });

  /* ---------------------------------------------------------
     RSVP — пять шагов
     --------------------------------------------------------- */
  var form = $('#rsvpForm');
  if (form) {
    var steps   = $$('.step', form);
    var prevBtn = $('#prev'), nextBtn = $('#next'), sendBtn = $('#send');
    var barEl   = $('#rsvpBar'), nowEl = $('#stepNow'), allEl = $('#stepAll');
    var errEl   = $('#rsvpErr');
    var doneBox = $('#done'), againBtn = $('#again');
    var plusBox = $('#plusName');
    var at = 0;

    var going = function () {
      var r = form.querySelector('input[name="going"]:checked');
      return r ? r.value : '';
    };
    var live = function () {
      return steps.filter(function (s) {
        return !(s.dataset.only === 'yes' && going() === 'no');
      });
    };

    var show = function (i) {
      var list = live();
      at = Math.max(0, Math.min(i, list.length - 1));
      steps.forEach(function (s) { s.classList.remove('is-on'); });
      list[at].classList.add('is-on');
      prevBtn.hidden = at === 0;
      nextBtn.hidden = at === list.length - 1;
      sendBtn.hidden = at !== list.length - 1;
      barEl.style.width = ((at + 1) / list.length * 100) + '%';
      nowEl.textContent = at + 1;
      allEl.textContent = list.length;
      errEl.hidden = true;
      var f = list[at].querySelector('input[type="text"], textarea');
      if (f && at > 0) f.focus({ preventScroll: true });
    };

    var fail = function (msg) {
      errEl.textContent = msg; errEl.hidden = false;
      return false;
    };
    var check = function () {
      var s = live()[at], n = Number(s.dataset.step);
      if (n === 1 && form.elements['name'].value.trim().length < 2) return fail(t('needName'));
      if (n === 2 && !going()) return fail(t('needGoing'));
      if (n === 3) {
        var pair = form.querySelector('input[name="plus"]:checked');
        if (pair && pair.value === 'pair' && form.elements['plusname'].value.trim().length < 2) return fail(t('needPlus'));
      }
      errEl.hidden = true;
      return true;
    };

    nextBtn.addEventListener('click', function () { if (check()) show(at + 1); });
    prevBtn.addEventListener('click', function () { show(at - 1); });

    form.addEventListener('change', function (e) {
      if (e.target.name === 'plus') plusBox.hidden = e.target.value !== 'pair';
      if (e.target.name === 'going') { barEl.style.width = ((at + 1) / live().length * 100) + '%'; allEl.textContent = live().length; }
    });

    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (sendBtn.hidden) { if (check()) show(at + 1); } else { sendBtn.click(); }
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!check()) return;
      var fd = new FormData(form);
      var rec = {
        name:    (fd.get('name') || '').trim(),
        contact: (fd.get('contact') || '').trim(),
        going:   fd.get('going'),
        plus:    fd.get('plus') === 'pair' ? (fd.get('plusname') || '').trim() : '',
        meal:    fd.get('meal') || '',
        drink:   fd.getAll('drink').join(' '),
        allergy: (fd.get('allergy') || '').trim(),
        bus:     fd.getAll('bus').join(' '),
        note:    (fd.get('note') || '').trim(),
        at:      new Date().toISOString()
      };
      if (rec.going === 'no') { rec.plus = ''; rec.meal = ''; rec.drink = ''; rec.allergy = ''; }

      var all = read();
      var key = norm(rec.name);
      all = all.filter(function (r) { return norm(r.name) !== key; });
      all.push(rec);
      write(all);

      form.hidden = true;
      doneBox.hidden = false;
      lastRec = rec;
      paintDone();
      doneBox.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      renderAdmin();
    });

    window.paintDone = paintDone;
    function paintDone() {
      if (!lastRec) return;
      $('#doneTitle').textContent = lastRec.going === 'yes' ? t('thanksYes') : t('thanksNo');
      $('#doneText').textContent  = lastRec.going === 'yes' ? t('textYes')   : t('textNo');
    }

    againBtn.addEventListener('click', function () {
      doneBox.hidden = true; form.hidden = false; show(0);
      form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });

    show(0);
  }

  function read() {
    try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e) { return []; }
  }
  function write(a) {
    try { localStorage.setItem(STORE, JSON.stringify(a)); } catch (e) {}
  }

  /* ---------------------------------------------------------
     Панель ответов — демо вместо бэкенда
     --------------------------------------------------------- */
  var admin = $('#admin');
  function renderAdmin() {
    if (!admin || admin.hidden) return;
    var all = read();
    var yes = all.filter(function (r) { return r.going === 'yes'; });
    var heads = yes.reduce(function (n, r) { return n + 1 + (r.plus ? 1 : 0); }, 0);

    $('#adminSum').innerHTML = '';
    [[t('answers'), all.length], [t('coming'), yes.length], [t('declined'), all.length - yes.length], [t('guests'), heads]]
      .forEach(function (pair) {
        var d = document.createElement('div');
        var b = document.createElement('b'); b.textContent = pair[1];
        d.appendChild(b); d.appendChild(document.createTextNode(pair[0]));
        $('#adminSum').appendChild(d);
      });

    var list = $('#adminList');
    list.innerHTML = '';
    if (!all.length) {
      var e = document.createElement('p'); e.className = 'admin__empty'; e.textContent = t('empty');
      list.appendChild(e);
      return;
    }
    all.slice().reverse().forEach(function (r) {
      var row = document.createElement('div'); row.className = 'row';
      var b = document.createElement('b'); b.textContent = r.name;
      var em = document.createElement('em'); em.textContent = '  ' + (r.going === 'yes' ? t('yes') : t('no'));
      var s = document.createElement('span');
      s.textContent = [r.plus && ('+1 ' + r.plus), vv(r.meal), vv(r.drink), vv(r.bus), r.allergy, r.note, r.contact]
        .filter(Boolean).join(' / ');
      row.appendChild(b); row.appendChild(em); row.appendChild(s);
      list.appendChild(row);
    });
  }

  function openAdmin() { if (admin) { admin.hidden = false; renderAdmin(); } }
  if (admin) {
    $('#adminClose').addEventListener('click', function () { admin.hidden = true; });
    $('#adminWipe').addEventListener('click', function () {
      if (confirm(t('wipe'))) { write([]); renderAdmin(); }
    });
    $('#adminCsv').addEventListener('click', function () {
      var head = t('hdr');
      var rows = read().map(function (r) {
        return [r.name, r.contact, r.going === 'yes' ? t('yes') : t('no'), r.plus,
                vv(r.meal), vv(r.drink), r.allergy, vv(r.bus), r.note, r.at];
      });
      var csv = '﻿' + [head].concat(rows).map(function (r) {
        return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(';');
      }).join('\r\n');
      var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      var a = document.createElement('a'); a.href = url; a.download = 'rsvp-osinki.csv';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
    if (/[?&]admin/.test(location.search)) openAdmin();
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.shiftKey && (e.key === 'A' || e.key === 'Ф')) openAdmin();
      if (e.key === 'Escape' && !admin.hidden) admin.hidden = true;
    });
  }

  /* ---------------------------------------------------------
     FAQ — открыт только один
     --------------------------------------------------------- */
  $$('#faqList .qa').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      $$('#faqList .qa').forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---------------------------------------------------------
     RU / EN
     --------------------------------------------------------- */
  var langBtn = $('#lang');
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      lang = lang === 'ru' ? 'en' : 'ru';
      document.documentElement.lang = lang;

      $$('[data-en]').forEach(function (el) {
        if (!el.dataset.ru) el.dataset.ru = el.innerHTML;
        el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.ru;
      });
      $$('[data-en-ph]').forEach(function (el) {
        if (!el.dataset.ruPh) el.dataset.ruPh = el.placeholder;
        el.placeholder = lang === 'en' ? el.dataset.enPh : el.dataset.ruPh;
      });

      drawPlan();
      if (hitTable >= 0) showTable(hitTable, hitSeat);
      var er = $('#rsvpErr');            // текст ошибки был на прошлом языке
      if (er) { er.hidden = true; er.textContent = ''; }
      if (window.paintDone) window.paintDone();
      renderAdmin();
    });
  }

  /* ---------------------------------------------------------
     Фоновая музыка
     --------------------------------------------------------- */
  var padAudio = $('#pad'), soundBtn = $('#sound');
  if (padAudio && soundBtn) {
    padAudio.volume = 0;
    var fade = function (to, ms) {
      var from = padAudio.volume, t0 = performance.now();
      var step = function (now) {
        var k = Math.min(1, (now - t0) / ms);
        padAudio.volume = from + (to - from) * k;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    soundBtn.addEventListener('click', function () {
      var on = soundBtn.getAttribute('aria-pressed') === 'true';
      if (on) {
        fade(0, 700);
        setTimeout(function () { padAudio.pause(); }, 720);
        soundBtn.setAttribute('aria-pressed', 'false');
      } else {
        padAudio.play().then(function () { fade(0.32, 1800); }).catch(function () {});
        soundBtn.setAttribute('aria-pressed', 'true');
      }
    });
  }
})();
