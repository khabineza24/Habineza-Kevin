/* ==========================================
   K VIBZ — COMMON SCRIPT (all pages)
   Add before </body> on every page:
   <script src="script.js"></script>
========================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Moving words in the header ----------
     Copies the words once so the loop never shows a gap. */

  var track = document.querySelector('.ticker-track');
  if (track) {
    Array.from(track.children).forEach(function (word) {
      track.appendChild(word.cloneNode(true));
    });
  }

  /* ---------- 2. Mobile menu button ---------- */

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');

  if (header && toggle) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Close the menu after choosing a page
    document.querySelectorAll('.navigation a').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- 3. Header glows when the page is scrolled ---------- */

  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 4. Scroll reveal ----------
     Any element with class "reveal" fades in when it scrolls into view. */

  var revealItems = document.querySelectorAll('.reveal');
  if (revealItems.length) {
    if (!('IntersectionObserver' in window)) {
      revealItems.forEach(function (el) { el.classList.add('visible'); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealItems.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  /* ---------- 5. Highlight the current page in the menu ----------
     So you never need to move class="active" by hand. */

  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  var navLinks = Array.from(document.querySelectorAll('.navigation a'));
  var matched = navLinks.some(function (a) {
    return (a.getAttribute('href') || '').split('#')[0] === currentPage;
  });
  if (matched) {
    navLinks.forEach(function (a) {
      var isHere = (a.getAttribute('href') || '').split('#')[0] === currentPage;
      a.classList.toggle('active', isHere);
      if (isHere) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* ---------- 6. Footer year updates itself ---------- */

  var footerText = document.querySelector('.site-footer p');
  if (footerText) {
    footerText.textContent = footerText.textContent.replace(/20\d\d/, new Date().getFullYear());
  }

  /* ---------- 7. Reading progress bar + back-to-top button ---------- */

  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  var topBtn = document.createElement('button');
  topBtn.type = 'button';
  topBtn.className = 'back-to-top';
  topBtn.setAttribute('aria-label', 'Back to top');
  topBtn.textContent = '↑';
  document.body.appendChild(topBtn);

  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  function updateScrollUI() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    bar.style.transform = 'scaleX(' + pct + ')';
    topBtn.classList.toggle('show', window.scrollY > 500);
  }
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  window.addEventListener('resize', updateScrollUI);
  updateScrollUI();

  /* ---------- 8. Floating particle background ---------- */

  var canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  var ctx = canvas.getContext('2d');
  var width = 0, height = 0, points = [], running = true;
  var colors = ['155,109,255', '85,230,245', '244,114,182'];
  var LINK_DISTANCE = 130;

  function build() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = Math.round(Math.min(70, (width * height) / 22000));
    points = [];
    for (var i = 0; i < count; i++) {
      points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        c: colors[i % colors.length]
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < points.length; i++) {
      var p = points[i];

      if (!reduceMotion) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.c + ',0.7)';
      ctx.fill();

      for (var j = i + 1; j < points.length; j++) {
        var q = points[j];
        var dx = p.x - q.x, dy = p.y - q.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DISTANCE) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = 'rgba(' + p.c + ',' + (0.16 * (1 - dist / LINK_DISTANCE)) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    if (running) draw();
    requestAnimationFrame(loop);
  }

  build();
  draw();
  if (!reduceMotion) requestAnimationFrame(loop);

  // Rebuild when the window size changes
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { build(); draw(); }, 200);
  });

  // Pause when the tab is hidden to save battery
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
  });
})();
