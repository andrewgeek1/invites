/* Артём и Ксения — средний тариф. Без зависимостей.
   Вся прокрутка обслуживается ОДНИМ слушателем и ОДНИМ кадром rAF:
   геометрия читается не чаще раза на ресайз, в кадре только запись стилей. */
(function () {
  'use strict';

  var WEDDING = new Date('2026-09-12T15:00:00+03:00');
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ============ появление ============ */
  (function reveal() {
    var hero = $('.hero');
    setTimeout(function () { hero.classList.add('is-in'); }, 60);

    var items = $$('.reveal, .rule');
    if (!('IntersectionObserver' in window) || REDUCED) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-in');
          io.unobserve(entries[i].target);
        }
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ============ отсчёт ============ */
  (function clock() {
    var out = {};
    $$('[data-u]', $('#clock')).forEach(function (el) { out[el.getAttribute('data-u')] = el; });
    var last = {};
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function put(k, v) { if (last[k] !== v) { last[k] = v; out[k].textContent = v; } }
    function tick() {
      var ms = WEDDING - new Date();
      if (ms <= 0) { ['d','h','m','s'].forEach(function (k) { put(k, '00'); }); return; }
      var s = Math.floor(ms / 1000);
      put('d', pad(Math.floor(s / 86400)));
      put('h', pad(Math.floor(s % 86400 / 3600)));
      put('m', pad(Math.floor(s % 3600 / 60)));
      put('s', pad(s % 60));
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* ============ календарь ============ */
  (function ics() {
    $('#ics').addEventListener('click', function () {
      var body = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//osinki//wedding//RU', 'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        'UID:artem-ksenia-2026@osinki',
        'DTSTAMP:20260823T090000Z',
        'DTSTART:20260912T120000Z',
        'DTEND:20260912T203000Z',
        'SUMMARY:Свадьба Артёма и Ксении',
        'LOCATION:Усадьба «Осинки», село Богородицкое, Нижегородская область',
        'DESCRIPTION:Сбор гостей в 14:00. Церемония в 15:00. Автобус от площади Минина в 13:00.',
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');
      var url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
      var a = document.createElement('a');
      a.href = url; a.download = 'osinki-12-09-2026.ics';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    });
  })();

  /* ============ аккордеон ============ */
  (function acc() {
    var items = $$('.acc__i');
    items.forEach(function (item) {
      var q = $('.acc__q', item);
      q.addEventListener('click', function () {
        var open = item.classList.contains('is-open');
        items.forEach(function (o) {
          o.classList.remove('is-open');
          $('.acc__q', o).setAttribute('aria-expanded', 'false');
        });
        if (!open) { item.classList.add('is-open'); q.setAttribute('aria-expanded', 'true'); }
      });
    });
  })();

  /* ============ форма ответа ============ */
  (function form() {
    var f = $('#form'), done = $('#done'), label = $('#submitLabel');
    var title = $('#doneTitle'), text = $('#doneText');
    var KEY = 'osinki-rsvp';
    var name = $('#fName');

    function going() { return $('input[name=going]:checked', f).value === 'yes'; }
    function mode() {
      var yes = going();
      f.classList.toggle('is-no', !yes);
      label.innerHTML = yes ? 'Подтвердить, что&nbsp;приду' : 'Сообщить, что&nbsp;не&nbsp;смогу';
    }
    $$('input[name=going]', f).forEach(function (r) { r.addEventListener('change', mode); });
    mode();

    name.addEventListener('input', function () { name.closest('.f').classList.remove('is-bad'); });

    function show(saved) {
      f.hidden = true; done.hidden = false;
      if (saved.going === 'yes') {
        title.textContent = 'Записали';
        text.innerHTML = saved.name.split(' ')[0] + ', ждём вас двенадцатого сентября в&nbsp;14:00 у&nbsp;ворот усадьбы.';
      } else {
        title.textContent = 'Жаль, но поняли';
        text.innerHTML = 'Спасибо, что ответили. Будем скучать — и&nbsp;обязательно пришлём фотографии.';
      }
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = name.closest('.f'), err = $('.err', box);
      if (name.value.trim().length < 2) {
        box.classList.add('is-bad');
        err.textContent = 'Напишите имя — иначе мы не поймём, кого ждать';
        name.focus();
        return;
      }
      var data = {
        name: name.value.trim(), going: going() ? 'yes' : 'no',
        plus: $('#fPlus').value.trim(), menu: $('#fMenu').value,
        bus: ($('input[name=bus]:checked', f) || {}).value || '',
        note: $('#fNote').value.trim(), at: new Date().toISOString()
      };
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (x) {}
      show(data);
    });

    $('#again').addEventListener('click', function () {
      done.hidden = true; f.hidden = false;
      try { localStorage.removeItem(KEY); } catch (x) {}
      name.focus();
    });

    try {
      var was = localStorage.getItem(KEY);
      if (was) show(JSON.parse(was));
    } catch (x) {}
  })();

  /* =========================================================
     ЕДИНЫЙ ЦИКЛ ПРОКРУТКИ
     ========================================================= */
  (function scrollEngine() {
    var bar = $('#bar'), hero = $('.hero');
    var day = $('.day'), sun = $('#sun'), stars = $('#stars'), land = $('#land'),
        hedge = $('#hedge'), face = $('#skyClock'), sky = $('#sky'),
        gold = $('#skyGold'), dusk = $('#skyDusk');
    var rows = $$('.tl__i');
    var frames = $$('.gal__frame[data-par]');

    var DAY_C = [142, 154, 118], GOLD_C = [154, 143, 106], NIGHT_C = [46, 54, 48];
    var SUN_HI = [246, 239, 221], SUN_LO = [232, 200, 138];

    /* --- геометрия: считаем редко, не в кадре прокрутки --- */
    var G = { vh: 0, heroBottom: 0, dayTop: 0, daySpan: 0, sky: 0, frames: [] };
    function measure() {
      G.vh = window.innerHeight;
      G.heroBottom = hero.offsetTop + hero.offsetHeight;
      G.dayTop = day.offsetTop;
      G.daySpan = Math.max(1, day.offsetHeight - (sky.offsetHeight || G.vh));
      G.skyH = sky.offsetHeight || G.vh;
      G.skyW = sky.offsetWidth;
      G.frames = frames.map(function (el) {
        return { el: el, top: offTop(el), h: el.offsetHeight,
                 par: parseFloat(el.getAttribute('data-par')) || 0 };
      });
      dirty = true;
    }
    function offTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }

    function mix(a, b, k) {
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
    }
    function css(c) {
      return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
    }
    function ramp(v, a, b) { return clamp((v - a) / (b - a), 0, 1); }

    /* --- кэш последних записанных значений: не трогаем DOM зря --- */
    var L = { on: null, g: -1, n: -1, gq: -1, nq: -1, sx: -1, sy: -1, clock: '', dark: null, now: -1 };

    function frame() {
      raf = 0;
      var y = window.pageYOffset || document.documentElement.scrollTop;

      /* шапка */
      var on = y > G.heroBottom - 40;
      if (on !== L.on) { L.on = on; bar.classList.toggle('is-on', on); }

      /* ход дня */
      var t = clamp((y - G.dayTop) / G.daySpan, 0, 1);
      if (t > 0 && t < 1 || L.g < 0 || t !== L.t) {
        L.t = t;
        var g = ramp(t, 0.18, 0.58), n = ramp(t, 0.62, 0.98);

        if (g !== L.g) { L.g = g; gold.style.opacity = g; }
        if (n !== L.n) { L.n = n; dusk.style.opacity = n; stars.style.opacity = ramp(t, 0.72, 1); }

        var sx = (0.14 + t * 0.72) * G.skyW;
        var sy = (0.22 + 0.70 * Math.pow(t, 1.7)) * G.skyH;
        if (sx !== L.sx || sy !== L.sy) {
          L.sx = sx; L.sy = sy;
          sun.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0)';
        }

        /* цвет пересчитываем ступенями по 5% — глазом не видно, работы в 20 раз меньше */
        var gq = Math.round(g * 20), nq = Math.round(n * 20);
        if (gq !== L.gq || nq !== L.nq) {
          L.gq = gq; L.nq = nq;
          var gg = gq / 20, nn = nq / 20;
          var s = mix(SUN_HI, SUN_LO, gg);
          sun.style.setProperty('--sun', css(s));
          sun.style.setProperty('--sunFade', 'rgba(' + (s[0]|0) + ',' + (s[1]|0) + ',' + (s[2]|0) + ',' + (0.42 - 0.3 * nn).toFixed(2) + ')');
          var lc = css(mix(mix(DAY_C, GOLD_C, gg), NIGHT_C, nn));
          land.style.setProperty('--land', lc);
          hedge.style.setProperty('--land', lc);
        }

        var dark = n > 0.45;
        if (dark !== L.dark) { L.dark = dark; face.style.setProperty('--clock', dark ? '#F4F1E8' : '#23251F'); }

        var mins = Math.round(840 + t * 570);
        var str = Math.floor(mins / 60) + ':' + ('0' + (mins % 60)).slice(-2);
        if (str !== L.clock) { L.clock = str; face.textContent = str; }

        var lit = 0;
        for (var i = 0; i < rows.length; i++) if (+rows[i].getAttribute('data-at') <= t + 0.03) lit = i + 1;
        if (lit !== L.now) {
          L.now = lit;
          for (var j = 0; j < rows.length; j++) rows[j].classList.toggle('is-now', j < lit);
        }
      }

      /* параллакс галереи — только для кадров в поле зрения */
      for (var k = 0; k < G.frames.length; k++) {
        var f = G.frames[k];
        var rel = y + G.vh - f.top;
        if (rel < 0 || rel > G.vh + f.h) continue;
        var p = rel / (G.vh + f.h) - 0.5;
        var py = (p * f.par * f.h * 2).toFixed(1);
        if (f.py !== py) { f.py = py; f.el.style.setProperty('--py', py + 'px'); }
      }
    }

    var raf = 0, dirty = false;
    function onScroll() { if (!raf) raf = requestAnimationFrame(frame); }

    measure();
    if (REDUCED) {
      frames.forEach(function (el) { el.style.setProperty('--py', '0px'); });
      window.addEventListener('scroll', onScroll, { passive: true });
      frame();
      return;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    var rt = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(function () { measure(); onScroll(); }, 160);
    });
    window.addEventListener('load', function () { measure(); onScroll(); });
    frame();
  })();
})();
