/* Тихий полдень — приглашение Ники и Глеба.
   Три задачи: завести обложку, проявлять блоки по мере прокрутки,
   принять ответ. Больше здесь ничего нет и быть не должно —
   пятна света живут в CSS, потому что это чистая композиция. */

(function () {
  'use strict';

  /* ── обложка ──────────────────────────────────────────────────────────
     Ждём шрифты: имена разложены на буквы, и подстановка Tenor Sans
     после старта анимации дёргала бы каждую букву по отдельности. */
  /* Имена подгоняются под ширину, а не набраны на глаз под конкретную пару:
     смена легенды (короткое имя на длинное) не должна снова лезть в CSS.
     Считаем самую широкую строку и ужимаем всю группу общим множителем,
     запас под ветвь берём с правого края — она стоит поверх текста. */
  function fitNames() {
    var box = document.querySelector('.names');
    var hero = document.querySelector('.hero');
    var branch = document.querySelector('.branch');
    if (!box || !hero) return;
    box.style.setProperty('--fit', 1);
    var rows = box.querySelectorAll('.names__row');
    if (!rows.length) return;

    var heroBox = hero.getBoundingClientRect();
    var cs = getComputedStyle(hero);
    var innerLeft = heroBox.left + parseFloat(cs.paddingLeft);
    var innerRight = heroBox.right - parseFloat(cs.paddingRight);

    /* На мобильном ветвь стоит выше блока с именами — ей не мешаем.
       На широком экране она висит справа на уровне текста: берём её
       реальный левый край, а не долю ширины экрана на глаз. */
    var rightEdge = innerRight;
    if (window.innerWidth > 720 && branch) {
      var b = branch.getBoundingClientRect();
      if (b.width) rightEdge = Math.min(rightEdge, b.left - 28);
    }

    var avail = rightEdge - innerLeft;
    var widest = 0;
    rows.forEach(function (r) { widest = Math.max(widest, r.getBoundingClientRect().width); });
    if (widest > avail) box.style.setProperty('--fit', Math.max(.4, avail / widest).toFixed(3));
  }

  function wake() {
    document.documentElement.classList.add('is-ready');
    fitNames();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(wake);
    setTimeout(wake, 1200);          // страховка, если шрифты не доехали
  } else {
    wake();
  }

  var fitRt;
  window.addEventListener('resize', function () {
    clearTimeout(fitRt);
    fitRt = setTimeout(fitNames, 150);
  });

  /* ── появление блоков ─────────────────────────────────────────────────
     Наблюдатель отключается сразу после срабатывания: блок проявляется
     один раз, повторный вход в зону видимости ничего не делает. */
  var targets = document.querySelectorAll('section, .foot');

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ── ответ гостя ──────────────────────────────────────────────────────
     Единственная точка отправки. Сейчас пишет в localStorage; чтобы
     ответы уходили в телеграм-бота или на почту, раскомментируйте
     fetch и подставьте свой адрес. Больше менять нигде ничего не нужно. */
  function sendRsvp(payload) {
    try {
      var all = JSON.parse(localStorage.getItem('polden-rsvp') || '[]');
      all.push(payload);
      localStorage.setItem('polden-rsvp', JSON.stringify(all));
    } catch (err) {
      /* приватный режим — молча пропускаем, ответ всё равно показан */
    }

    // return fetch('https://ВАШ-ВЕБХУК', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // });
  }

  var form = document.getElementById('rsvp');
  if (!form) return;

  var guest = document.getElementById('guest');
  var err = document.getElementById('guest-err');
  var thanks = document.getElementById('thanks');
  var thanksSub = document.getElementById('thanks-sub');
  var title = document.getElementById('answer-title');

  guest.addEventListener('input', function () { err.hidden = true; });

  /* ── спутники ────────────────────────────────────────────────────────
     Гость сам набирает число кнопками «−/+», а не выбирает из готовых
     вариантов. Потолок высокий, а не настоящее «без ограничений» —
     иначе можно накликать сотню пустых полей. */
  var MAX_PLUS = 30;
  var plus = 0;
  var plusQ = document.getElementById('plusQ');
  var plusV = document.getElementById('plusV');
  var plusHint = document.getElementById('plusHint');
  var mates = document.getElementById('mates');
  var plusBtns = form.querySelectorAll('.cnt__b');

  function goingValue() {
    var el = form.querySelector('input[name="going"]:checked');
    return el ? el.value : 'yes';
  }

  function plusWord(n) {
    if (n === 0) return 'приду один';
    var yes = goingValue() === 'yes';
    var word = ['', 'вдвоём', 'втроём', 'вчетвером', 'впятером'][n];
    if (word) return (yes ? 'придём ' : 'не приедем ') + word;
    return (yes ? 'нас будет ' : 'не приедет ') + (n + 1) + ' человек';
  }

  function renderMates() {
    plusV.textContent = plus;
    plusHint.textContent = plusWord(plus);
    plusBtns.forEach(function (b) {
      var d = +b.dataset.d;
      b.disabled = (d < 0 && plus === 0) || (d > 0 && plus === MAX_PLUS);
    });
    var have = mates.children.length;
    for (var i = have; i < plus; i++) {
      var wrap = document.createElement('div');
      wrap.className = 'field';
      wrap.innerHTML = '<label for="mate' + i + '">Кто именно</label>' +
                       '<input id="mate' + i + '" type="text" placeholder="Имя и фамилия">';
      mates.appendChild(wrap);
    }
    for (var j = have; j > plus; j--) mates.lastElementChild.remove();
  }

  plusBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      plus = Math.max(0, Math.min(MAX_PLUS, plus + (+b.dataset.d)));
      renderMates();
    });
  });
  form.querySelectorAll('input[name="going"]').forEach(function (r) {
    r.addEventListener('change', function () {
      plusQ.textContent = goingValue() === 'yes'
        ? 'Кто-то приедет с вами?'
        : 'Кто-то не сможет приехать вместе с вами?';
      renderMates();
    });
  });
  renderMates();

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    var name = guest.value.trim();
    if (name.length < 2) {
      err.hidden = false;
      guest.focus();
      return;
    }

    var going = goingValue();
    var bus = form.querySelector('input[name="bus"]').checked;
    var withNames = Array.prototype.slice.call(mates.querySelectorAll('input'))
      .map(function (i) { return i.value.trim(); }).filter(Boolean);

    sendRsvp({ name: name, going: going, plus: plus, with: withNames, bus: bus, at: new Date().toISOString() });

    thanksSub.textContent = going === 'yes'
      ? (bus ? 'Ждём вас 22 мая. Место в автобусе придержали.'
             : 'Ждём вас 22 мая у ворот в 14:00.')
      : 'Жаль, что не получится. Обнимем при первой встрече.';

    form.hidden = true;
    if (title) title.hidden = true;      // заголовок-вопрос после ответа лишний
    thanks.hidden = false;
  });
})();
