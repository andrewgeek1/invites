/* Роман и Дарья — простой тариф.
   Появление блоков лесенкой и форма ответа. Кадр обложки статичен:
   владелец просил, чтобы фотография не ездила при прокрутке.
   Ни таймера, ни рассадки, ни сохранения ответов: это уровни выше. */
(function () {
  'use strict';

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MAX_PARTY = 30;

  /* ---------- появление ---------- */
  var rise = [].slice.call(document.querySelectorAll('.rise'));

  if (calm || !('IntersectionObserver' in window)) {
    rise.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    var first = document.querySelector('.hero');
    rise.forEach(function (el) {
      /* первый экран показываем сразу, лесенкой, не дожидаясь скролла */
      if ((first && first.contains(el)) || el.getBoundingClientRect().top < window.innerHeight) {
        requestAnimationFrame(function () { el.classList.add('is-in'); });
      } else {
        io.observe(el);
      }
    });
  }

  /* ---------- форма ответа ---------- */
  var form = document.getElementById('form');
  var done = document.getElementById('done');
  if (!form || !done) return;

  var who      = document.getElementById('who');
  var errWho   = document.getElementById('errWho');
  var label    = document.getElementById('submitLabel');
  var partyQ   = document.getElementById('partyQ');
  var partyN   = document.getElementById('partyN');
  var partyHint= document.getElementById('partyHint');
  var guests   = document.getElementById('guests');
  var minusBtn = form.querySelector('.stepper__b--minus');
  var plusBtn  = form.querySelector('.stepper__b[data-step="1"]');

  var party = 0;

  var answer = function () {
    var el = form.querySelector('input[name="answer"]:checked');
    return el ? el.value : 'yes';
  };

  /* числа людей словом до пятерых, дальше числом */
  var WORD = ['', 'вдвоём', 'втроём', 'вчетвером', 'впятером'];
  var howMany = function (total, yes) {
    if (total === 1) return yes ? 'Приду один' : 'Не смогу приехать';
    if (total <= 5) return (yes ? 'Придём ' : 'Не приедем ') + WORD[total - 1];
    return (yes ? 'Нас будет ' : 'Не приедет ') + total + ' человек';
  };

  var renderGuests = function () {
    var yes = answer() === 'yes';
    var need = yes ? party : 0;                 /* имена нужны только у тех, кто приедет */
    while (guests.children.length > need) guests.removeChild(guests.lastChild);
    while (guests.children.length < need) {
      var i = guests.children.length + 1;
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'guest';
      inp.placeholder = 'Имя спутника';
      inp.setAttribute('aria-label', 'Имя спутника номер ' + i);
      guests.appendChild(inp);
    }
  };

  var sync = function () {
    var yes = answer() === 'yes';
    partyQ.textContent = yes ? 'Кто-то придёт вместе с вами?'
                             : 'Кто-то не сможет приехать вместе с вами?';
    partyN.textContent = party;
    partyHint.textContent = howMany(party + 1, yes);
    minusBtn.disabled = party === 0;
    plusBtn.disabled = party === MAX_PARTY;
    if (label) label.innerHTML = yes
      ? (party === 0 ? 'Записать меня в&nbsp;список' : 'Записать нас в&nbsp;список')
      : (party === 0 ? 'Передать, что не&nbsp;смогу' : 'Передать, что не&nbsp;сможем');
    renderGuests();
  };

  form.addEventListener('click', function (e) {
    var b = e.target.closest('.stepper__b');
    if (!b) return;
    party = Math.min(MAX_PARTY, Math.max(0, party + (+b.dataset.step)));
    sync();
  });

  form.addEventListener('change', function (e) {
    if (e.target.name === 'answer') sync();
  });

  var flag = function (input, on) {
    if (on) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = (who.value || '').trim();
    var bad = !name;
    errWho.hidden = !bad;
    flag(who, bad);

    var names = [];
    [].forEach.call(guests.children, function (inp) {
      var v = (inp.value || '').trim();
      flag(inp, !v);
      if (!v) bad = true; else names.push(v);
    });

    if (bad) {
      (who.getAttribute('aria-invalid') ? who : guests.querySelector('[aria-invalid]')).focus();
      return;
    }

    var yes   = answer() === 'yes';
    var first = name.split(/\s+/)[0];
    var total = party + 1;

    document.getElementById('doneTitle').textContent = yes ? 'Вы в списке' : 'Очень жаль.';

    var when = ' 12 сентября в «Ольховке», сбор в 15:00.';
    var text;
    if (yes) {
      if (total === 1)     text = 'Спасибо, ' + first + '. Ждём вас' + when;
      else if (total <= 5) text = 'Спасибо, ' + first + '. Ждём вас ' + WORD[total - 1] + when;
      else                 text = 'Спасибо, ' + first + '. Ждём вас, ' + total + ' человек,' + when;
    } else {
      if (total === 1)     text = 'Спасибо, что сказали честно, ' + first + '. Будем скучать.';
      else if (total <= 5) text = 'Спасибо, ' + first + '. Записали: не приедете ' + WORD[total - 1] + '. Будем скучать.';
      else                 text = 'Спасибо, ' + first + '. Записали: не приедет ' + total + ' человек. Будем скучать.';
    }
    document.getElementById('doneText').textContent = text;

    form.hidden = true;
    done.hidden = false;
    done.classList.add('is-in');
    var t = document.getElementById('doneTitle');
    t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  });

  sync();
})();
