/* ==========================================
   K VIBZ — SURPRISE EFFECTS (all pages)
   Needs extras.css. Add after chatbox.js:
   <script src="extras.js"></script>
   Turn any effect off with the switches below.
========================================== */

(function () {
  'use strict';

  var ON = {
    splash: true,       // intro screen on the Welcome page (once per visit)
    sparkles: true,     // little notes pop out when you click or tap
    spotlight: true,    // soft light that follows the mouse
    secret: true        // type "kvibz" or click the logo 5 times
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = window.location.pathname.split('/').pop() || 'index.html';
  var NOTES = ['♪', '♫', '✦', '✧', '♬'];
  var COLORS = ['#9b6dff', '#55e6f5', '#f472b6', '#ffffff'];

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  /* ---------- 1. Intro screen (Welcome page, once per visit) ---------- */

  if (ON.splash && !reduceMotion && page === 'index.html') {
    var seen = false;
    try { seen = sessionStorage.getItem('kvSplash') === '1'; } catch (e) {}

    if (!seen) {
      try { sessionStorage.setItem('kvSplash', '1'); } catch (e) {}

      var hour = new Date().getHours();
      var greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

      var splash = document.createElement('div');
      splash.className = 'kv-splash';
      splash.setAttribute('aria-hidden', 'true');
      splash.innerHTML =
        '<div class="kv-splash-logo">' +
          '<span>K</span><span>&nbsp;</span><span>V</span><span>I</span><span>B</span><span>Z</span><span class="dot">.</span>' +
        '</div>' +
        '<p class="kv-splash-greet">' + greet + ' 👋 welcome to my world</p>' +
        '<div class="kv-splash-bar"><i></i></div>' +
        '<p class="kv-splash-skip">tap to skip</p>';
      document.body.appendChild(splash);

      var closed = false;
      var closeSplash = function () {
        if (closed) return;
        closed = true;
        splash.classList.add('hide');
        setTimeout(function () { splash.remove(); }, 700);
      };
      splash.addEventListener('click', closeSplash);
      setTimeout(closeSplash, 2600);
    }
  }

  /* ---------- 2. Notes pop out where you click ---------- */

  function burst(x, y, count, spread, life) {
    for (var i = 0; i < count; i++) {
      var n = document.createElement('span');
      n.className = 'kv-note';
      n.textContent = pick(NOTES);
      n.style.left = x + 'px';
      n.style.top = y + 'px';
      n.style.color = pick(COLORS);
      n.style.fontSize = rand(14, 26) + 'px';
      n.style.setProperty('--dx', rand(-spread, spread) + 'px');
      n.style.setProperty('--dy', rand(-spread * 1.3, -spread * 0.3) + 'px');
      n.style.setProperty('--rot', rand(-60, 60) + 'deg');
      n.style.animationDuration = rand(life * 0.7, life) + 'ms';
      document.body.appendChild(n);
      (function (el) { setTimeout(function () { el.remove(); }, life + 100); })(n);
    }
  }

  if (ON.sparkles && !reduceMotion) {
    document.addEventListener('pointerdown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      burst(e.clientX, e.clientY, 6, 60, 900);
    });
  }

  /* ---------- 3. Soft spotlight that follows the mouse ---------- */

  if (ON.spotlight && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    var glow = document.createElement('div');
    glow.className = 'kv-spotlight';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    var gx = 0, gy = 0, ticking = false;
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      gx = e.clientX; gy = e.clientY;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          glow.style.transform = 'translate3d(' + (gx - 220) + 'px,' + (gy - 220) + 'px,0)';
          glow.classList.add('on');
          ticking = false;
        });
      }
    });
    document.addEventListener('mouseleave', function () { glow.classList.remove('on'); });
  }

  /* ---------- 4. Secret: type "kvibz" or click the logo 5 times ---------- */

  function toast(text) {
    var old = document.querySelector('.kv-toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'kv-toast';
    t.setAttribute('role', 'status');
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('hide'); }, 3200);
    setTimeout(function () { t.remove(); }, 3800);
  }

  function celebrate() {
    var w = window.innerWidth, h = window.innerHeight;
    if (!reduceMotion) {
      for (var wave = 0; wave < 4; wave++) {
        (function (k) {
          setTimeout(function () { burst(rand(w * 0.15, w * 0.85), rand(h * 0.45, h * 0.85), 14, 180, 1800); }, k * 220);
        })(wave);
      }
    }
    toast('🎹 You found the secret! K VIBZ says: keep creating.');
  }

  if (ON.secret) {
    var typed = '';
    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-5);
      if (typed === 'kvibz') { typed = ''; celebrate(); }
    });

    var logo = document.querySelector('.brand');
    if (logo) {
      var clicks = 0, clickTimer;
      logo.addEventListener('click', function (e) {
        if (page === 'index.html') e.preventDefault();   // already here: don't reload, just count
        clicks++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(function () { clicks = 0; }, 1500);
        if (clicks >= 5) { clicks = 0; celebrate(); }
      });
    }
  }
})();
