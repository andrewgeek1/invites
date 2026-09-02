/* Тихий полдень — приглашение Ники и Глеба.
   Три задачи: завести обложку, проявлять блоки по мере прокрутки,
   принять ответ. Больше здесь ничего нет и быть не должно —
   пятна света живут в CSS, потому что это чистая композиция. */

(function () {
  'use strict';

  /* ── обложка ──────────────────────────────────────────────────────────
     Ждём шрифты: имена разложены на буквы, и подстановка Tenor Sans
     после старта анимации дёргала бы каждую букву по отдельности. */
  function wake() { document.documentElement.classList.add('is-ready'); }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(wake);
    setTimeout(wake, 1200);          // страховка, если шрифты не доехали
  } else {
    wake();
  }

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

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    var name = guest.value.trim();
    if (name.length < 2) {
      err.hidden = false;
      guest.focus();
      return;
    }

    var going = form.querySelector('input[name="going"]:checked').value;
    var bus = form.querySelector('input[name="bus"]').checked;

    sendRsvp({ name: name, going: going, bus: bus, at: new Date().toISOString() });

    thanksSub.textContent = going === 'yes'
      ? (bus ? 'Ждём вас 22 мая. Место в автобусе придержали.'
             : 'Ждём вас 22 мая у ворот в 14:00.')
      : 'Жаль, что не получится. Обнимем при первой встрече.';

    form.hidden = true;
    if (title) title.hidden = true;      // заголовок-вопрос после ответа лишний
    thanks.hidden = false;
  });
})();
