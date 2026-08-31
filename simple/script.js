/* Артём и Ксения — простой тариф.
   Три вещи: ступенчатое появление, один фирменный ход в hero, форма ответа.
   Ни таймера, ни рассадки, ни сохранения ответов — это уровни выше. */
(function () {
  'use strict';

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* ---------- фирменное взаимодействие: слои hero расходятся ----------
     Параллакс идёт через свойство translate, а не transform, чтобы не
     затирать transform, которым работает появление .rise.                */
  var hero = document.querySelector('.hero');
  var layers = [
    { el: document.querySelector('.names__a'),  x: -0.075, y: -0.16 },
    { el: document.querySelector('.stage__ph'), x: 0,      y: 0.05  },
    { el: document.querySelector('.names__b'),  x: 0.075,  y: 0.11  }
  ].filter(function (l) { return l.el; });

  if (hero && layers.length && !calm) {
    var ticking = false;

    var draw = function () {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      var h = hero.offsetHeight;
      if (y > h) return;                       /* за пределами первого экрана не считаем */
      var k = Math.min(y, h);
      layers.forEach(function (l) {
        l.el.style.translate = (k * l.x).toFixed(1) + 'px ' + (k * l.y).toFixed(1) + 'px';
      });
    };

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(draw);
    }, { passive: true });

    draw();
  }

  /* ---------- форма ответа: одно поле и один выбор ---------- */
  var form  = document.getElementById('form');
  var done  = document.getElementById('done');
  var label = document.getElementById('submitLabel');
  if (!form || !done) return;

  var LABEL = {
    yes: 'Записать меня в список',
    no:  'Передать, что не смогу'
  };
  var TITLE = { yes: 'Вы в списке', no: 'Жаль, но понятно' };
  var TEXT  = {
    yes: function (n) { return 'Спасибо, ' + n + '. Ждём вас 12 сентября в «Осинках» — сбор в 15:00.'; },
    no:  function (n) { return 'Спасибо, что сказали честно, ' + n + '. Будем скучать и обязательно покажем фотографии.'; }
  };

  var answer = function () {
    var el = form.querySelector('input[name="answer"]:checked');
    return el ? el.value : 'yes';
  };

  form.addEventListener('change', function (e) {
    if (e.target.name === 'answer' && label) label.innerHTML = LABEL[answer()];
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var raw  = (document.getElementById('who').value || '').trim();
    var name = raw.split(/\s+/)[0] || 'друзья';
    var a    = answer();

    document.getElementById('doneTitle').textContent = TITLE[a];
    document.getElementById('doneText').innerHTML    = TEXT[a](name);

    form.hidden = true;
    done.hidden = false;
    done.classList.add('is-in');
    var t = document.getElementById('doneTitle');
    t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  });
})();
