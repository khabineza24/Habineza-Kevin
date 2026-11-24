/* ==========================================
   K VIBZ — PORTFOLIO PAGE SCRIPT (portfolio.html only)
   Load AFTER script.js:
   <script src="portfolio.js"></script>
========================================== */

(function () {
  'use strict';

  /* ---------- 1. Music player ---------- */

  (function () {
    var player = document.querySelector('.player');
    var tracks = Array.prototype.slice.call(document.querySelectorAll('.track'));
    if (!player || !tracks.length) return;

    var audio = new Audio();
    audio.preload = 'none';

    var titleEl = player.querySelector('.player-title');
    var metaEl = player.querySelector('.player-meta');
    var playBtn = player.querySelector('.pc-play');
    var prevBtn = player.querySelector('.pc-prev');
    var nextBtn = player.querySelector('.pc-next');
    var range = player.querySelector('.player-range');
    var curEl = player.querySelector('[data-cur]');
    var durEl = player.querySelector('[data-dur]');
    var status = player.querySelector('.player-status');
    var index = 0;

    function fmt(s) {
      if (!isFinite(s)) return '0:00';
      var m = Math.floor(s / 60);
      var sec = Math.floor(s % 60);
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function setFill() {
      var pct = range.value / 10;
      range.style.setProperty('--fill', pct + '%');
    }

    function setPlayingUI(on) {
      player.classList.toggle('playing', on);
      playBtn.textContent = on ? '❚❚' : '▶';
      playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
      tracks.forEach(function (t, i) { t.classList.toggle('is-playing', on && i === index); });
    }

    function load(i, autoplay) {
      index = (i + tracks.length) % tracks.length;
      var t = tracks[index];
      audio.src = t.getAttribute('data-src');
      titleEl.textContent = t.getAttribute('data-title') || ('Track ' + (index + 1));
      metaEl.textContent = t.getAttribute('data-meta') || '';
      tracks.forEach(function (el, n) { el.classList.toggle('active', n === index); });
      range.value = 0;
      setFill();
      curEl.textContent = '0:00';
      durEl.textContent = '0:00';
      status.textContent = '';
      setPlayingUI(false);
      if (autoplay) audio.play().catch(function () {});
    }

    audio.addEventListener('play', function () { setPlayingUI(true); });
    audio.addEventListener('pause', function () { setPlayingUI(false); });
    audio.addEventListener('loadedmetadata', function () { durEl.textContent = fmt(audio.duration); });
    audio.addEventListener('timeupdate', function () {
      if (audio.duration) {
        range.value = (audio.currentTime / audio.duration) * 1000;
        setFill();
      }
      curEl.textContent = fmt(audio.currentTime);
    });
    audio.addEventListener('ended', function () { load(index + 1, true); });
    audio.addEventListener('error', function () {
      setPlayingUI(false);
      status.textContent = 'Add your music file here: ' + tracks[index].getAttribute('data-src');
    });

    playBtn.addEventListener('click', function () {
      if (audio.paused) audio.play().catch(function () {}); else audio.pause();
    });
    prevBtn.addEventListener('click', function () { load(index - 1, !audio.paused); });
    nextBtn.addEventListener('click', function () { load(index + 1, !audio.paused); });

    range.addEventListener('input', function () {
      setFill();
      if (audio.duration) audio.currentTime = (range.value / 1000) * audio.duration;
    });

    tracks.forEach(function (t, i) {
      t.addEventListener('click', function () {
        if (i === index && audio.src) {
          if (audio.paused) audio.play().catch(function () {}); else audio.pause();
        } else {
          load(i, true);
        }
      });
    });

    load(0, false);
  })();

  /* ---------- 2. Project filter ---------- */

  (function () {
    var buttons = document.querySelectorAll('.filter-btn');
    var cards = document.querySelectorAll('.work-card');
    if (!buttons.length || !cards.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');
        buttons.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        cards.forEach(function (card) {
          var show = filter === 'all' || card.getAttribute('data-category') === filter;
          card.classList.toggle('is-hidden', !show);
          if (show) card.classList.add('visible');
        });
      });
    });
  })();

  /* ---------- 3. Click a project photo to see it large ---------- */

  (function () {
    var box;

    function open(src, alt) {
      if (!box) {
        box = document.createElement('div');
        box.className = 'pf-lightbox';
        box.innerHTML = '<button type="button" aria-label="Close photo">✕</button><img alt="">';
        document.body.appendChild(box);
        box.addEventListener('click', function () { box.classList.remove('open'); });
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') box.classList.remove('open');
        });
      }
      var img = box.querySelector('img');
      img.src = src;
      img.alt = alt || '';
      box.classList.add('open');
    }

    document.querySelectorAll('.work-image').forEach(function (frame) {
      frame.addEventListener('click', function () {
        var img = frame.querySelector('img');
        if (img && img.style.display !== 'none' && img.complete && img.naturalWidth) open(img.src, img.alt);
      });
    });
  })();

  /* ---------- 4. CV link comes from config.js (if you set one) ---------- */

  var cvLink = document.querySelector('.cv-card a[download]');
  if (cvLink && window.KV_CONFIG && window.KV_CONFIG.cv) cvLink.setAttribute('href', window.KV_CONFIG.cv);
})();
