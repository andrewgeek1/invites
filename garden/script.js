/* ══════════════════════════════════════════════════════════
   Даниил и Вера · лента из семи экранов
   ── управление лентой, прорастающая графика, форма ответа

   Про скорость: в кадре прокрутки только запись стилей.
   Вся геометрия и все ссылки на узлы считаются на загрузке
   и на ресайзе; ничего не пишется, если значение не менялось.
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reel    = document.getElementById('reel');
  var screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));
  var dots    = Array.prototype.slice.call(document.querySelectorAll('.dots button'));
  var fill    = document.querySelector('.hud__fill');
  var counter = document.querySelector('.hud__count b');
  var prevBtn = document.querySelector('.arrow--prev');
  var nextBtn = document.querySelector('.arrow--next');
  var calm    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var LAST  = screens.length - 1;
  var index = 0;
  var width = 0;

  /* ── слои параллакса: собраны один раз, в кадре не ищутся ── */
  var layers = screens.map(function (sc) {
    var holder = sc.querySelector('.media[data-depth]');
    if (!holder) return null;
    var img = holder.querySelector('img');
    if (!img) return null;
    return { img: img, depth: +holder.dataset.depth || 0, last: null };
  });

  /* ── подготовка штрихов: длина пути → пунктир на всю длину ── */
  function primeStrokes() {
    document.querySelectorAll('.draw').forEach(function (p) {
      var len;
      try { len = p.getTotalLength(); } catch (e) { len = 800; }
      p.style.setProperty('--len', Math.ceil(len) + 2);
    });
  }

  /* ── порядковый номер для ступенчатого появления списков ── */
  document.querySelectorAll('.clock li, .asks li').forEach(function (li, i) {
    li.style.setProperty('--i', i % 6);
  });

  function measure() {
    width = screens[0].getBoundingClientRect().width || window.innerWidth;
  }

  /* ── отрисовка: параллакс + смена активного экрана ── */
  function paint() {
    if (!width) measure();
    var pos = reel.scrollLeft / width;

    for (var i = 0; i < layers.length; i++) {
      var L = layers[i];
      if (!L) continue;
      var rel = i - pos;
      if (rel < -1.35 || rel > 1.35) continue;
      // округление до целого пикселя убирает шквал одинаковых записей
      var px = calm ? 0 : Math.round(rel * L.depth * -1);
      if (px !== L.last) {
        L.last = px;
        L.img.style.setProperty('--px', px + 'px');
      }
    }

    var now = Math.round(pos);
    if (now < 0) now = 0;
    if (now > LAST) now = LAST;
    if (now === index) return;

    screens[index].classList.remove('is-live');
    dots[index].setAttribute('aria-current', 'false');
    index = now;
    screens[index].classList.add('is-live');
    dots[index].setAttribute('aria-current', 'true');

    fill.style.width = ((index + 1) / screens.length * 100) + '%';
    counter.textContent = ('0' + (index + 1)).slice(-2);
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === LAST;
  }

  function go(i) {
    if (i < 0) i = 0;
    if (i > LAST) i = LAST;
    reel.scrollTo({ left: i * width, behavior: calm ? 'auto' : 'smooth' });
  }

  var ticking = false;
  reel.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    var run = function () { ticking = false; paint(); };
    if (window.requestAnimationFrame) requestAnimationFrame(run); else run();
  }, { passive: true });

  /* ── колесо и вертикальный тачпад листают ленту вбок ──
     Замок снимается не по таймеру от начала жеста, а через паузу после
     ПОСЛЕДНЕГО события. Инерция трекпада досыпает события ещё полсекунды
     после того, как палец ушёл, — на прежнем таймере они успевали
     пролистнуть второй экран. */
  var wheelLock = false, wheelIdle = null;
  reel.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   // горизонтальный жест — нативно
    var card = e.target.closest && e.target.closest('.card');
    if (card && card.scrollHeight > card.clientHeight + 2) return;  // форма прокручивается сама
    if (Math.abs(e.deltaY) < 4) return;
    e.preventDefault();

    clearTimeout(wheelIdle);
    wheelIdle = setTimeout(function () { wheelLock = false; }, 320);
    if (wheelLock) return;
    wheelLock = true;
    go(index + (e.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  document.addEventListener('keydown', function (e) {
    var t = e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(index + 1); }
    if (e.key === 'ArrowLeft'  || e.key === 'PageUp')   { e.preventDefault(); go(index - 1); }
    if (e.key === 'Home') { e.preventDefault(); go(0); }
    if (e.key === 'End')  { e.preventDefault(); go(LAST); }
  });

  dots.forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.go); }); });
  prevBtn.addEventListener('click', function () { go(index - 1); });
  nextBtn.addEventListener('click', function () { go(index + 1); });

  window.addEventListener('resize', function () {
    var was = index;
    measure();
    for (var i = 0; i < layers.length; i++) if (layers[i]) layers[i].last = null;
    reel.scrollTo({ left: was * width, behavior: 'auto' });
  });

  /* ══════════════════════════════════════════════════════════
     Форма ответа
     ══════════════════════════════════════════════════════════ */
  var card    = document.querySelector('.card');
  var form    = document.getElementById('rsvp');
  var thanks  = document.getElementById('thanks');
  var tInk    = document.getElementById('thanks-ink');
  var tBody   = document.getElementById('thanks-body');
  var redo    = document.getElementById('redo');
  var guests  = document.getElementById('guests-wrap');
  var bus     = document.getElementById('bus-wrap');
  var namesWrap  = document.getElementById('names-wrap');
  var namesBox   = document.getElementById('names');
  var namesLabel = document.getElementById('names-label');
  var status  = form.querySelector('.form__status');
  var STORE   = 'rsvp-garden';

  /* ────────────────────────────────────────────────────────────
     ЕДИНСТВЕННАЯ ТОЧКА ОТПРАВКИ.
     Сейчас ответ лежит в браузере гостя — сайту не нужен сервер.
     Чтобы ответы падали в телеграм, поднимите бота с вебхуком
     и раскомментируйте fetch ниже. Форма payload не меняется,
     остальной код трогать не нужно.
     ──────────────────────────────────────────────────────────── */
  function sendRsvp(payload) {
    // return fetch('https://ваш-домен/rsvp', {
    //   method: 'POST',
    //   headers: { 'content-type': 'application/json' },
    //   body: JSON.stringify(payload)
    // }).then(function (r) {
    //   if (!r.ok) throw new Error('HTTP ' + r.status);
    // });
    try { localStorage.setItem(STORE, JSON.stringify(payload)); } catch (e) {}
    return Promise.resolve();
  }

  function showErr(name, text) {
    var box = form.querySelector('.err[data-for="' + name + '"]');
    if (box) box.textContent = text || '';
  }

  function guestCount() {
    var r = form.querySelector('input[name=guests]:checked');
    return r ? +r.value : 0;
  }

  /* Сколько спутников выбрали — столько строк под имена.
     Уже введённое не теряется: значения переносятся в новые поля. */
  function renderNameRows(preset) {
    var n = guestCount();
    var kept = [];
    var was = namesBox.querySelectorAll('input');
    for (var k = 0; k < was.length; k++) kept.push(was[k].value);

    namesBox.textContent = '';
    for (var j = 0; j < n; j++) {
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'guest-name';
      inp.placeholder = 'Имя и фамилия';
      inp.setAttribute('aria-label', 'Имя гостя ' + (j + 1));
      inp.value = (preset && preset[j]) || kept[j] || '';
      inp.addEventListener('input', function () {
        this.classList.remove('is-bad'); showErr('names', '');
      });
      namesBox.appendChild(inp);
    }
    namesWrap.hidden = n === 0;
    namesLabel.textContent = n === 1 ? 'Как его зовут' : 'Как их зовут';
  }

  function toggleExtras() {
    var yes = form.querySelector('input[name=going][value=yes]').checked;
    guests.hidden = !yes;
    bus.hidden = !yes;
    if (!yes) { namesWrap.hidden = true; namesBox.textContent = ''; }
    else renderNameRows();
  }

  form.querySelectorAll('input[name=going]').forEach(function (r) {
    r.addEventListener('change', function () { toggleExtras(); showErr('going', ''); });
  });
  form.querySelectorAll('input[name=guests]').forEach(function (r) {
    r.addEventListener('change', function () { renderNameRows(); showErr('names', ''); });
  });
  form.querySelector('#f-name').addEventListener('input', function () {
    this.classList.remove('is-bad'); showErr('name', '');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nameEl = form.querySelector('#f-name');
    var name = nameEl.value.trim();
    var going = form.querySelector('input[name=going]:checked');
    var bad = false;

    // Гасим прошлые ошибки перед новой проверкой: поле могли исправить
    // автозаполнением, которое не всегда шлёт событие input.
    showErr('name', ''); showErr('going', ''); showErr('names', '');
    nameEl.classList.remove('is-bad');
    namesBox.querySelectorAll('input').forEach(function (i) { i.classList.remove('is-bad'); });

    if (name.length < 2) {
      nameEl.classList.add('is-bad');
      showErr('name', 'Напишите, пожалуйста, имя — иначе мы не поймём, кто ответил.');
      bad = true;
    }
    if (!going) {
      showErr('going', 'Отметьте, придёте или нет.');
      bad = true;
    }
    var companions = [];
    if (going && going.value === 'yes') {
      var rows = namesBox.querySelectorAll('input');
      var blank = false;
      for (var i = 0; i < rows.length; i++) {
        var v = rows[i].value.trim();
        if (!v) { rows[i].classList.add('is-bad'); blank = true; }
        else companions.push(v);
      }
      if (blank) {
        showErr('names', rows.length === 1
          ? 'Напишите, пожалуйста, имя гостя — иначе не поймём, кого ждать.'
          : 'Впишите имена всех, кто приедет с вами.');
        bad = true;
      }
    }

    if (bad) { if (nameEl.classList.contains('is-bad')) nameEl.focus(); return; }

    var payload = {
      name: name,
      going: going.value,
      guests: going.value === 'yes' ? guestCount() : 0,
      companions: companions,
      bus: going.value === 'yes' && form.querySelector('input[name=bus]').checked,
      note: form.querySelector('#f-note').value.trim(),
      at: new Date().toISOString()
    };

    var btn = form.querySelector('button[type=submit] span');
    var was = btn.textContent;
    btn.textContent = 'Отправляем…';
    status.textContent = '';

    sendRsvp(payload).then(function () {
      renderThanks(payload);
    }).catch(function () {
      btn.textContent = was;
      status.textContent = 'Не получилось отправить. Попробуйте ещё раз или напишите нам в мессенджер.';
    });
  });

  function renderThanks(p) {
    if (p.going === 'yes') {
      tInk.textContent = 'Ждём вас!';
      var crew = p.companions || [];
      // Имена перечисляем отдельным предложением в именительном: склонять
      // произвольное «Мария Крылова» → «Марию Крылову» надёжно нельзя.
      var who = crew.length
        ? 'Записали вас. С вами: ' + crew.join(', ') + '.'
        : 'Записали вас.';
      tBody.textContent = who + ' ' + (p.bus ? (crew.length ? 'Места в автобусе от площади Минина забронированы. '
                                : 'Место в автобусе от площади Минина забронировано. ') : '')
        + '19 июня, 15:30, оранжерея «Стеклянный сад».';
    } else {
      tInk.textContent = 'Будем скучать';
      tBody.textContent = 'Спасибо, что дали знать, ' + p.name.split(' ')[0]
        + '. Фотографии обязательно пришлём.';
    }

    form.hidden = true;
    thanks.hidden = false;
    card.classList.add('is-answered');   // прячет «Будете с нами?» — его место занял росчерк

    // класс вешаем следующим кадром, иначе переход clip-path не запустится
    thanks.classList.remove('is-writing');
    if (calm) { thanks.classList.add('is-writing'); return; }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { thanks.classList.add('is-writing'); });
    });
  }

  redo.addEventListener('click', function () {
    try { localStorage.removeItem(STORE); } catch (e) {}
    thanks.hidden = true;
    thanks.classList.remove('is-writing');
    card.classList.remove('is-answered');
    form.hidden = false;
    form.reset();
    namesBox.textContent = '';
    toggleExtras();
    form.querySelector('button[type=submit] span').textContent = 'Отправить ответ';
    form.querySelector('#f-name').focus();
  });

  /* уже отвечали с этого устройства — показать ответ, а не пустую форму */
  (function restore() {
    var raw;
    try { raw = localStorage.getItem(STORE); } catch (e) { return; }
    if (!raw) return;
    try { renderThanks(JSON.parse(raw)); } catch (e) {}
  })();

  /* ── старт ── */
  primeStrokes();
  measure();
  toggleExtras();
  screens[0].classList.add('is-live');
  dots[0].setAttribute('aria-current', 'true');
  prevBtn.disabled = true;
  paint();

  /* шрифты меняют метрики — пересчитать после их загрузки */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure);
  }
})();
