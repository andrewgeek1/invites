/* ══════════════════════════════════════════════════════════
   Витрина: переключатель палитры и появление блоков.
   Без зависимостей.
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Палитры. Каждая несёт не только цвет, но и шрифт —
     пара должна увидеть, что меняется весь характер, а не оттенок.
     Шрифты те же, что стоят на настоящих сайтах.
     --------------------------------------------------------- */
  var PALETTES = {
    olive:  { bg:'#F4F1E8', ink:'#23251F', acc:'#6B7A4F',
              font:'"Onest", sans-serif', ital:'normal' },
    bottle: { bg:'#16261E', ink:'#E8E2D4', acc:'#C9A96A',
              font:'"Cormorant Garamond", serif', ital:'italic' },
    ink:    { bg:'#12100E', ink:'#F2EDE6', acc:'#C9A87C',
              font:'"Playfair Display", serif', ital:'normal' },
    wax:    { bg:'#F0EBE3', ink:'#2A2622', acc:'#9E3B2E',
              font:'"Oswald", sans-serif', ital:'normal' },
    steel:  { bg:'#E9EDEF', ink:'#1E2A30', acc:'#5E7A85',
              font:'"Onest", sans-serif', ital:'normal' },
    shade:  { bg:'#EDEDE8', ink:'#3F4A32', acc:'#B07A2E',
              font:'"Tenor Sans", sans-serif', ital:'normal' },
    sunset: { bg:'#2A0E15', ink:'#F2E3C8', acc:'#D08A22',
              font:'"Forum", serif', ital:'normal' },
    silver: { bg:'#08090C', ink:'#F2F5F8', acc:'#C6D6E6',
              font:'"Jost", sans-serif', ital:'normal' }
  };

  var demo = document.getElementById('demo');
  var sws  = Array.prototype.slice.call(document.querySelectorAll('.sw'));

  function paint(key) {
    var p = PALETTES[key];
    if (!p || !demo) return;
    demo.style.setProperty('--d-bg',   p.bg);
    demo.style.setProperty('--d-ink',  p.ink);
    demo.style.setProperty('--d-acc',  p.acc);
    demo.style.setProperty('--d-font', p.font);
    demo.style.setProperty('--d-ital', p.ital);
    // акцент самой страницы едет за выбором — кнопки и номера шагов
    document.documentElement.style.setProperty('--accent', p.acc);

    sws.forEach(function (b) {
      var on = b.dataset.p === key;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  sws.forEach(function (b) {
    b.addEventListener('click', function () { paint(b.dataset.p); });
  });

  /* стрелками влево-вправо переключаем палитры, не уходя с клавиатуры */
  document.querySelector('.swatches') &&
  document.querySelector('.swatches').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var i = sws.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    var n = (i + (e.key === 'ArrowRight' ? 1 : -1) + sws.length) % sws.length;
    sws[n].focus(); paint(sws[n].dataset.p);
  });

  /* ---------------------------------------------------------
     Появление блоков при прокрутке.
     Наблюдатель отключается после срабатывания — держать его
     на всех узлах до конца страницы незачем.
     --------------------------------------------------------- */
  var marks = [];
  document.querySelectorAll(
    '.head, .work, .swatches, .demo, .paint__note, .cards li, .tiers li, .steps li, .need__list li, .end > *'
  ).forEach(function (el, i) {
    el.classList.add('rise');
    el.style.setProperty('--d', (i % 5) * 70 + 'ms');
    marks.push(el);
  });

  if (calm || !('IntersectionObserver' in window)) {
    marks.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    marks.forEach(function (el) { io.observe(el); });
  }

  /* первый экран показываем сразу — он уже виден */
  document.querySelectorAll('.top .rise').forEach(function (el) { el.classList.add('is-in'); });

  paint('olive');
})();
