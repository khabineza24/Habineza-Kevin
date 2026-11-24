/* ==========================================
   K VIBZ — SKILLS PAGE SCRIPT (skills.html)
   1. Scroll reveal   2. Filter buttons
========================================== */

(function () {
  'use strict';

  /* ---------- 1. Scroll reveal ---------- */

  var items = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach(function (el) { observer.observe(el); });
  } else {
    // Old browsers: just show everything
    items.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- 2. Filter buttons ---------- */

  var buttons = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.skill-card');

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      buttons.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      cards.forEach(function (card) {
        var show = filter === 'all' || card.getAttribute('data-category') === filter;
        card.classList.toggle('is-hidden', !show);

        // Make sure cards that reappear are visible
        if (show) card.classList.add('visible');
      });
    });
  });
})();