/* ═══════════════════════════════════════════════════════════════════
   «Ротонда» — один слушатель прокрутки и один кадр rAF на весь сайт.
   В кадре только запись стилей: геометрия считается на загрузке и
   ресайзе. Читать getBoundingClientRect в горячем пути нельзя —
   на этом уже лагали «Стеклянный сад» и сложный тариф.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var saveData = conn.saveData === true;

  /* ─────────────────────────────────────────────────────────────────
     ДАТА. Фиксированная протухает, дальняя показывает бессмысленные
     «375 дней». Берём ближайшую субботу не раньше чем через 75 дней
     и обязательно в июне–сентябре: ужин на террасе у моря в феврале
     выглядит абсурдом. Под реальную пару — заменить тело одной строкой.
     ───────────────────────────────────────────────────────────────── */

  function demoDate() {
    var d = new Date();
    d.setHours(18, 0, 0, 0);
    d.setDate(d.getDate() + 75);
    for (var i = 0; i < 800; i++) {
      var m = d.getMonth();
      if (d.getDay() === 6 && m >= 5 && m <= 8) return d;
      d.setDate(d.getDate() + 1);
    }
    return d;
  }

  var WEDDING = demoDate();
  var RSVP_BY = new Date(WEDDING.getTime());
  RSVP_BY.setDate(RSVP_BY.getDate() - 42);

  var MONTH_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                   'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var DOW = ['воскресенье', 'понедельник', 'вторник', 'среда',
             'четверг', 'пятница', 'суббота'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function fmt(kind) {
    var d = WEDDING;
    switch (kind) {
      case 'long':  return d.getDate() + ' ' + MONTH_GEN[d.getMonth()] + ' ' + d.getFullYear();
      case 'day':   return String(d.getDate());
      case 'month': return MONTH_GEN[d.getMonth()];
      case 'year':  return String(d.getFullYear());
      case 'dow':   return DOW[d.getDay()];
      case 'num':   return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
      case 'rsvp':  return RSVP_BY.getDate() + ' ' + MONTH_GEN[RSVP_BY.getMonth()];
      case 'rsvpfull': return RSVP_BY.getDate() + ' ' + MONTH_GEN[RSVP_BY.getMonth()] + ' ' + RSVP_BY.getFullYear();
      default:      return '';
    }
  }

  /* Подстановка идёт до всего остального: любой код, который кеширует
     innerHTML, должен увидеть уже подставленную дату. */
  function fillDates() {
    var nodes = document.querySelectorAll('[data-dt]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = fmt(nodes[i].getAttribute('data-dt'));
    }
  }
  fillDates();
  window.ROTONDA = { wedding: WEDDING, rsvpBy: RSVP_BY, fmt: fmt };

  /* ─────────────────────────────────────────────────────────────────
     ВИДЕО ОБЛОЖКИ
     Постер отдаётся первым, файл подключается после load. При saveData
     и prefers-reduced-motion видео не грузится вовсе — остаётся кадр.
     ───────────────────────────────────────────────────────────────── */

  var video = document.getElementById('heroVideo');
  var videoOn = false;

  function attachVideo() {
    if (!video || videoOn || reduce || saveData) return;
    videoOn = true;
    video.src = 'assets/hero.mp4';
    video.load();
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* автозапуск отклонён — остаётся постер */ });
    video.playbackRate = 0.7;
  }

  if (document.readyState === 'complete') attachVideo();
  else window.addEventListener('load', attachVideo, { once: true });

  /* ─────────────────────────────────────────────────────────────────
     ГЕОМЕТРИЯ — считается здесь, а не в кадре прокрутки
     ───────────────────────────────────────────────────────────────── */

  var hero = document.querySelector('.hero');
  var veil = document.getElementById('heroVeil');
  var cover = document.getElementById('cover');
  var inviteBox = document.getElementById('inviteBox');
  var bar = document.getElementById('bar');

  var G = { heroTop: 0, heroRange: 1, vh: 0, darks: [] };

  /* Наблюдатель здесь не годится: на стыке двух секций нижняя кромка
     верхней лежит ровно на границе полосы, события с нулевой высотой
     не приходят, и шапка залипает тёмной над светлым блоком. Состояние
     считается в общем кадре из геометрии, снятой на загрузке. */
  var darkEls = document.querySelectorAll('.hero, .sec--ink');

  function measureDarks() {
    G.darks = [];
    for (var i = 0; i < darkEls.length; i++) {
      G.darks.push([darkEls[i].offsetTop, darkEls[i].offsetTop + darkEls[i].offsetHeight]);
    }
  }

  function overDark(y) {
    var probe = y + 34;               /* середина шапки */
    for (var i = 0; i < G.darks.length; i++) {
      if (probe > G.darks[i][0] && probe < G.darks[i][1]) return true;
    }
    return false;
  }


  function measure() {
    G.vh = window.innerHeight;
    if (hero) {
      G.heroTop = hero.offsetTop;
      G.heroRange = Math.max(1, hero.offsetHeight - G.vh);
    }
    measureDarks();
  }

  /* ─────────────────────────────────────────────────────────────────
     ОДИН КАДР НА ВСЮ СТРАНИЦУ
     ───────────────────────────────────────────────────────────────── */

  var ticking = false;
  var last = { rate: -1, veil: -1, cover: -1, invite: -1, bar: null, dark: null };

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function span(v, a, b) { return clamp01((v - a) / (b - a)); }
  function ease(t) { return t * t * (3 - 2 * t); }

  function frame() {
    ticking = false;
    var y = window.pageYOffset;
    var p = clamp01((y - G.heroTop) / G.heroRange);

    /* Фирменный приём: облёт садится.
       playbackRate квантуется шагом 0.05 и пишется только при изменении —
       трогать медиаэлемент каждый кадр прокрутки незачем. */
    if (videoOn && video) {
      var raw = 0.7 - span(p, 0.10, 0.72) * 0.58;
      var rate = Math.round(raw * 20) / 20;
      if (p > 0.78) {
        if (last.rate !== 0) { video.pause(); last.rate = 0; }
      } else {
        if (video.paused) video.play().catch(function () {});
        if (rate !== last.rate) { video.playbackRate = Math.max(0.12, rate); last.rate = rate; }
      }
    }

    var vo = ease(span(p, 0.22, 0.82));
    if (Math.abs(vo - last.veil) > 0.01) { veil.style.opacity = vo.toFixed(3); last.veil = vo; }

    var co = 1 - ease(span(p, 0.04, 0.38));
    if (Math.abs(co - last.cover) > 0.01) {
      cover.style.opacity = co.toFixed(3);
      cover.style.transform = 'translate3d(0,' + (-(1 - co) * 46).toFixed(1) + 'px,0)';
      last.cover = co;
    }

    var io = ease(span(p, 0.44, 0.88));
    if (Math.abs(io - last.invite) > 0.01) {
      inviteBox.style.opacity = io.toFixed(3);
      inviteBox.style.transform = 'translate3d(0,' + ((1 - io) * 34).toFixed(1) + 'px,0)';
      last.invite = io;
    }

    var showBar = y > G.vh * 0.9;
    if (showBar !== last.bar) { bar.classList.toggle('is-on', showBar); last.bar = showBar; }

    var dark = overDark(y);
    if (dark !== last.dark) { bar.classList.toggle('is-dark', dark); last.dark = dark; }
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { measure(); onScroll(); });
  window.addEventListener('orientationchange', function () { measure(); onScroll(); });

  measure();
  onScroll();
  window.addEventListener('load', function () { measure(); onScroll(); });

  /* Видео на паузе, когда обложка вне экрана: декодировать кадры,
     которых никто не видит, — чистая трата батареи. */
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!videoOn || !video) return;
        if (entries[i].isIntersecting) {
          if (last.rate !== 0) video.play().catch(function () {});
        } else {
          video.pause();
        }
      }
    }, { threshold: 0 }).observe(hero);
  }

  /* Тёмная или светлая шапка — по тому, что под ней сейчас лежит.
     Полоса высотой в шапку наверху окна: какие тёмные секции её задевают,
     столько и в наборе. Ни одного чтения геометрии в кадре прокрутки. */
  /* ─────────────────────────────────────────────────────────────────
     ОТСЧЁТ
     Дальше 120 дней показываем месяцы / дни / часы, ближе — дни / часы /
     минуты. «276 дней, 0 часов, 22 минуты» — это шум, а не отсчёт.
     ───────────────────────────────────────────────────────────────── */

  function plural(n, one, few, many) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b === 1) return one;
    if (b >= 2 && b <= 4) return few;
    return many;
  }

  var tickEls = {
    a: document.getElementById('tickA'), au: document.getElementById('tickAU'),
    b: document.getElementById('tickB'), bu: document.getElementById('tickBU'),
    c: document.getElementById('tickC'), cu: document.getElementById('tickCU'),
    d: document.getElementById('tickD'), du: document.getElementById('tickDU')
  };

  function put(el, v) { if (el && el.textContent !== v) el.textContent = v; }

  function setTick(vals) {
    var k = ['a', 'b', 'c', 'd'];
    for (var i = 0; i < 4; i++) {
      put(tickEls[k[i]], String(vals[i][0]));
      put(tickEls[k[i] + 'u'], vals[i][1]);
    }
  }

  function renderTick() {
    if (!tickEls.a) return;
    var ms = WEDDING.getTime() - new Date().getTime();
    if (ms <= 0) {
      setTick([[0, 'дней'], [0, 'часов'], [0, 'минут'], [0, 'секунд']]);
      return;
    }

    var days = Math.floor(ms / 86400000);
    var h = Math.floor((ms % 86400000) / 3600000);
    var mi = Math.floor((ms % 3600000) / 60000);

    if (days > 120) {
      /* Дальше 120 дней месяцы вместо трёхзначного числа дней.
         Минуты владелец попросил оставить «для антуража»: они уходят
         в самый мелкий разряд и живут своей жизнью. */
      var probe = new Date(), months = 0;
      for (var i = 0; i < 200; i++) {
        var next = new Date(probe.getTime());
        next.setMonth(next.getMonth() + 1);
        if (next.getTime() <= WEDDING.getTime()) { probe = next; months++; } else break;
      }
      var rest = WEDDING.getTime() - probe.getTime();
      var rd = Math.floor(rest / 86400000);
      var rh = Math.floor((rest % 86400000) / 3600000);
      var rm = Math.floor((rest % 3600000) / 60000);
      setTick([
        [months, plural(months, 'месяц', 'месяца', 'месяцев')],
        [rd, plural(rd, 'день', 'дня', 'дней')],
        [rh, plural(rh, 'час', 'часа', 'часов')],
        [rm, plural(rm, 'минута', 'минуты', 'минут')]
      ]);
    } else {
      var sec = Math.floor((ms % 60000) / 1000);
      setTick([
        [days, plural(days, 'день', 'дня', 'дней')],
        [h, plural(h, 'час', 'часа', 'часов')],
        [mi, plural(mi, 'минута', 'минуты', 'минут')],
        [sec, plural(sec, 'секунда', 'секунды', 'секунд')]
      ]);
    }
  }

  renderTick();
  setInterval(renderTick, 1000);

  /* ─────────────────────────────────────────────────────────────────
     ОТВЕТ ГОСТЯ

     Число спутников задаёт сам гость: готовые кнопки «+1 / +2 / +3»
     владелец снимал уже дважды. Отказ и согласие ведут на разные
     экраны — «Ждём вас» человеку, который написал «не смогу», грубо.
     ───────────────────────────────────────────────────────────────── */

  var form = document.getElementById('rsvpForm');

  if (form) {
    var elName = document.getElementById('fName');
    var errName = document.getElementById('errName');
    var errGo = document.getElementById('errGo');
    var onlyYes = document.getElementById('onlyYes');
    var onlyNo = document.getElementById('onlyNo');
    var thanks = document.getElementById('thanks');
    var thanksTitle = document.getElementById('thanksTitle');
    var thanksText = document.getElementById('thanksText');
    var again = document.getElementById('again');
    var choiceBtns = form.querySelectorAll('.choice__b');

    var MAX_MATES = 20;
    var going = null;

    /* Один и тот же узел нужен дважды: и когда гость приезжает с кем-то,
       и когда не может приехать парой. Готовых кнопок «+1 / +2 / +3»
       здесь нет намеренно — число задаёт сам гость. */
    function makeStepper(cfg) {
      var down = document.getElementById(cfg.down);
      var up = document.getElementById(cfg.up);
      var num = document.getElementById(cfg.num);
      var text = document.getElementById(cfg.text);
      var box = document.getElementById(cfg.box);
      var api = { count: 0 };

      function render() {
        num.textContent = String(api.count);
        text.textContent = api.count === 0 ? cfg.zero
          : api.count === 1 ? cfg.one
          : api.count + ' ' + plural(api.count, 'человек', 'человека', 'человек') + cfg.tail;
        down.disabled = api.count === 0;
        up.disabled = api.count >= MAX_MATES;

        var have = box.querySelectorAll('.mate').length;
        while (have < api.count) {
          have++;
          var wrap = document.createElement('div');
          wrap.className = 'mate';
          var inp = document.createElement('input');
          inp.type = 'text';
          inp.placeholder = cfg.placeholder;
          inp.setAttribute('aria-label', cfg.placeholder + ' ' + have);
          wrap.appendChild(inp);
          box.appendChild(wrap);
        }
        while (have > api.count) { box.removeChild(box.lastChild); have--; }
      }

      up.addEventListener('click', function () { if (api.count < MAX_MATES) { api.count++; render(); } });
      down.addEventListener('click', function () { if (api.count > 0) { api.count--; render(); } });

      api.render = render;
      api.set = function (n) { api.count = Math.max(0, Math.min(MAX_MATES, n | 0)); render(); };
      api.names = function () {
        var out = [], f = box.querySelectorAll('input');
        for (var i = 0; i < f.length; i++) out.push(f[i].value.trim() || 'без имени');
        return out;
      };
      api.fill = function (list) {
        var f = box.querySelectorAll('input');
        for (var i = 0; i < f.length; i++) {
          if (list[i] && list[i] !== 'без имени') f[i].value = list[i];
        }
      };
      render();
      return api;
    }

    var withMe = makeStepper({
      down: 'stepDown', up: 'stepUp', num: 'stepN', text: 'stepT', box: 'mates',
      zero: 'никого, приеду один', one: 'ещё один человек', tail: ' вместе со мной',
      placeholder: 'Имя и фамилия спутника'
    });

    var withoutMe = makeStepper({
      down: 'stepDownNo', up: 'stepUpNo', num: 'stepNNo', text: 'stepTNo', box: 'matesNo',
      zero: 'только я', one: 'ещё один человек', tail: ' вместе со мной',
      placeholder: 'Имя и фамилия'
    });

    function setGoing(v) {
      going = v;
      for (var i = 0; i < choiceBtns.length; i++) {
        var on = choiceBtns[i].getAttribute('data-go') === v;
        choiceBtns[i].setAttribute('aria-checked', on ? 'true' : 'false');
      }
      onlyYes.hidden = v !== 'yes';
      onlyNo.hidden = v !== 'no';
      errGo.hidden = true;
    }

    for (var c = 0; c < choiceBtns.length; c++) {
      choiceBtns[c].addEventListener('click', function () {
        setGoing(this.getAttribute('data-go'));
      });
    }

    /* Единственная точка отправки. Сейчас пишет в localStorage;
       чтобы ответы уходили в телеграм, раскомментировать fetch
       и подставить адрес вебхука. Больше менять нечего. */
    function sendRsvp(payload) {
      try { localStorage.setItem('rotonda-rsvp', JSON.stringify(payload)); } catch (e) {}

      // return fetch('https://ваш-вебхук.example/rsvp', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });

      return Promise.resolve();
    }

    function showThanks(payload) {
      form.hidden = true;
      document.querySelector('.rsvp__head').hidden = true;
      thanks.hidden = false;
      if (payload.going) {
        var total = 1 + payload.companions.length;
        thanksTitle.textContent = 'Ждём вас';
        thanksText.textContent = 'Записали ' + total + ' ' +
          plural(total, 'человека', 'человека', 'человек') + '. ' +
          (payload.room ? 'Комнату забронируем и напишем, куда заселяться. ' : '') +
          'До встречи ' + fmt('long') + '.';
      } else {
        var miss = 1 + payload.absent.length;
        /* «вас не будет 3 человека» по-русски звучит криво, поэтому
           до пятерых пишем словом, дальше обычным числом. */
        var TOGETHER = { 2: 'вдвоём', 3: 'втроём', 4: 'вчетвером', 5: 'впятером' };
        thanksTitle.textContent = 'Записали. Очень жаль.';
        thanksText.textContent = (miss > 1
            ? (TOGETHER[miss]
                ? 'Отметили, что не приедете ' + TOGETHER[miss] + '. '
                : 'Отметили, что не приедет ' + miss + ' ' + plural(miss, 'человек', 'человека', 'человек') + '. ')
            : '') +
          'Будем скучать. Если планы вдруг поменяются, откройте эту страницу ' +
          'снова и поменяйте ответ.';
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;

      if (!elName.value.trim()) { errName.hidden = false; ok = false; }
      else errName.hidden = true;

      if (going === null) { errGo.hidden = false; ok = false; }

      if (!ok) {
        var first = form.querySelector('.err:not([hidden])');
        if (first) first.previousElementSibling.scrollIntoView({ block: 'center' });
        if (!elName.value.trim()) elName.focus();
        return;
      }

      var payload = {
        name: elName.value.trim(),
        going: going === 'yes',
        companions: going === 'yes' ? withMe.names() : [],
        absent: going === 'no' ? withoutMe.names() : [],
        food: going === 'yes' ? document.getElementById('fFood').value.trim() : '',
        room: going === 'yes' && document.getElementById('fRoom').checked,
        bus: going === 'yes' && document.getElementById('fBus').checked,
        word: going === 'no' ? document.getElementById('fWord').value.trim() : '',
        at: new Date().toISOString()
      };

      sendRsvp(payload);
      showThanks(payload);
    });

    again.addEventListener('click', function () {
      thanks.hidden = true;
      form.hidden = false;
      document.querySelector('.rsvp__head').hidden = false;
      elName.focus();
    });

    /* Ответ переживает перезагрузку */
    try {
      var saved = JSON.parse(localStorage.getItem('rotonda-rsvp') || 'null');
      if (saved && saved.name) {
        elName.value = saved.name;
        setGoing(saved.going ? 'yes' : 'no');
        withMe.set((saved.companions || []).length);
        withMe.fill(saved.companions || []);
        withoutMe.set((saved.absent || []).length);
        withoutMe.fill(saved.absent || []);
        if (saved.food) document.getElementById('fFood').value = saved.food;
        document.getElementById('fRoom').checked = !!saved.room;
        document.getElementById('fBus').checked = !!saved.bus;
        if (saved.word) document.getElementById('fWord').value = saved.word;
        showThanks(saved);
      }
    } catch (e) {}
  }

  /* ─────────────────────────────────────────────────────────────────
     ВОПРОСЫ — открыт ровно один
     ───────────────────────────────────────────────────────────────── */

  var qas = document.querySelectorAll('.qa');
  for (var q = 0; q < qas.length; q++) {
    (function (item) {
      var btn = item.querySelector('.qa__q');
      btn.addEventListener('click', function () {
        var open = item.classList.contains('is-open');
        for (var j = 0; j < qas.length; j++) {
          qas[j].classList.remove('is-open');
          qas[j].querySelector('.qa__q').setAttribute('aria-expanded', 'false');
        }
        if (!open) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    })(qas[q]);
  }

  /* ─────────────────────────────────────────────────────────────────
     .ICS — дата берётся из той же demoDate(), а не зашита
     ───────────────────────────────────────────────────────────────── */

  var ics = document.getElementById('ics');
  if (ics) {
    ics.addEventListener('click', function (e) {
      e.preventDefault();
      function z(n) { return n < 10 ? '0' + n : '' + n; }
      function stampZ(d) {
        return d.getUTCFullYear() + z(d.getUTCMonth() + 1) + z(d.getUTCDate()) + 'T' +
               z(d.getUTCHours()) + z(d.getUTCMinutes()) + '00Z';
      }
      /* Время «плавающее», без Z и без TZID: свадьба начинается в 17:00
         по месту, а не по часовому поясу телефона гостя. С Z московский
         календарь показал бы 18:00, а календарь гостя из Калининграда —
         16:00, и оба были бы неправы. */
      function stampLocal(d) {
        return d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + 'T' +
               z(d.getHours()) + z(d.getMinutes()) + '00';
      }
      var start = new Date(WEDDING.getTime());
      start.setHours(17, 0, 0, 0);
      var end = new Date(start.getTime() + 9 * 3600000);
      var body = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//rotonda//RU',
        'BEGIN:VEVENT',
        'UID:rotonda-' + start.getTime() + '@invites',
        'DTSTAMP:' + stampZ(new Date()),
        'DTSTART:' + stampLocal(start),
        'DTEND:' + stampLocal(end),
        'SUMMARY:Свадьба Марка и Лии',
        'LOCATION:Вилла «Ротонда»\\, Прчань\\, Черногория',
        'DESCRIPTION:Сбор гостей в 17:00\\, церемония в 18:00.',
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');

      var url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
      var a = document.createElement('a');
      a.href = url; a.download = 'rotonda.ics';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  }

  /* ─────────────────────────────────────────────────────────────────
     СТУПЕНЧАТОЕ ПОЯВЛЕНИЕ
     ───────────────────────────────────────────────────────────────── */

  /* Всё, что уже стоит в первом экране, проявляется на загрузке своей
     лесенкой. Через наблюдателя это не работает: у него отступ снизу,
     и нижние элементы обложки в «кадр» не попадают — кнопка так и
     осталась бы на нулевой непрозрачности. */
  function introFirstScreen() {
    var all = document.querySelectorAll('.rise');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.classList.contains('is-in')) continue;
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
    }
  }

  if (reduce) {
    var all = document.querySelectorAll('.rise');
    for (var i = 0; i < all.length; i++) all[i].classList.add('is-in');
  } else if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (entries, obs) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        var el = entries[i].target;
        el.classList.add('is-in');
        /* will-change снимается сразу после появления: держать его
           постоянно — значит держать лишний слой в памяти */
        setTimeout(function (n) {
          return function () { n.style.filter = ''; };
        }(el), 1400);
        obs.unobserve(el);
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

    var rises = document.querySelectorAll('.rise');
    for (var j = 0; j < rises.length; j++) io2.observe(rises[j]);

    introFirstScreen();
    window.addEventListener('load', introFirstScreen, { once: true });
  }

})();
