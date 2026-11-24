
/* ==========================================
   K VIBZ — PORTFOLIO PAGE JAVASCRIPT
   1. Scroll reveal
   2. Project filters
   3. Audio player controls
========================================== */

(function () {
  'use strict';

  /* 1. SCROLL REVEAL */

  var items = document.querySelectorAll('.portfolio-page .reveal');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    items.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* 2. PROJECT FILTERS */

  var buttons = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.work-card');

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {

      var filter = btn.getAttribute('data-filter');

      buttons.forEach(function (b) {
        b.classList.remove('active');
      });

      btn.classList.add('active');

      cards.forEach(function (card) {

        var categories = (card.getAttribute('data-category') || '')
          .split(/\s+/);

        var show =
          filter === 'all' || categories.includes(filter);

        card.classList.toggle('is-hidden', !show);

        if (show) {
          card.classList.add('visible');
        }

        /* Pause hidden audio */
        if (!show) {
          var audio = card.querySelector('audio');

          if (audio) {
            audio.pause();
          }
        }
      });
    });
  });

  /* 3. AUDIO PLAYER */

  var audioPlayers = document.querySelectorAll('.portfolio-audio');

  audioPlayers.forEach(function (player) {

    player.addEventListener('play', function () {

      audioPlayers.forEach(function (otherPlayer) {

        if (otherPlayer !== player) {
          otherPlayer.pause();
        }

      });

    });

    player.addEventListener('error', function () {
      console.warn('Could not load audio:', player.currentSrc);
    });

  });

})();
