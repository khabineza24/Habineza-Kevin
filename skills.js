/* ==========================================
   K VIBZ — SKILLS PAGE SCRIPT (skills.html only)
   Load AFTER script.js:
   <script src="script.js"></script>
   <script src="skills.js"></script>
========================================== */

(function () {
  'use strict';

  var buttons = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.skill-card');
  if (!buttons.length || !cards.length) return;

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      // Highlight the chosen button
      buttons.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      // Show matching cards, hide the others
      cards.forEach(function (card) {
        var show = filter === 'all' || card.getAttribute('data-category') === filter;
        card.classList.toggle('is-hidden', !show);
        if (show) card.classList.add('visible');   // never leave a card invisible after filtering
      });
    });
  });
})();
