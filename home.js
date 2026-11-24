/* ==========================================
   K VIBZ — HOME PAGE SCRIPT (home.html only)
   Load AFTER script.js:
   <script src="script.js"></script>
   <script src="chatbox.js"></script>
   <script src="home.js"></script>
========================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Count-up numbers ---------- */

  (function () {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    function run(el) {
      var target = +el.getAttribute('data-count');
      if (reduceMotion) { el.textContent = target; return; }
      var start = null, duration = 1600;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) { counters.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 2. Sound: playable piano + "Play a vibe" ---------- */

  var audioCtx;
  function getCtx() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = audioCtx || new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playNote(freq, seconds, type, volume) {
    var ctx = getCtx();
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume || 0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds + 0.1);
  }

  // Piano keys (click, tap, or computer keyboard)
  var keys = document.querySelectorAll('.key');
  keys.forEach(function (key) {
    key.addEventListener('click', function () {
      playNote(parseFloat(key.getAttribute('data-note')), 1.2, 'triangle', 0.3);
      key.classList.add('pressed');
      setTimeout(function () { key.classList.remove('pressed'); }, 220);
    });
  });

  // A S D F G H J K = white keys,  W E T Y U = black keys
  var keyMap = { a: 0, s: 1, d: 2, f: 3, g: 4, h: 5, j: 6, k: 7 };
  var blackMap = { w: 8, e: 9, t: 10, y: 11, u: 12 };
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    var k = e.key.toLowerCase();
    var i = k in keyMap ? keyMap[k] : (k in blackMap ? blackMap[k] : -1);
    if (i > -1 && keys[i]) keys[i].click();
  });

  // "Play a vibe": a looping C - G - Am - F chord pattern
  var vibeBtn = document.querySelector('.vibe-btn');
  var musicCard = document.querySelector('.music-visual');

  if (vibeBtn) {
    var chords = [
      [261.63, 329.63, 392.00],   // C
      [196.00, 246.94, 293.66],   // G
      [220.00, 261.63, 329.63],   // Am
      [174.61, 220.00, 261.63]    // F
    ];
    var chordIndex = 0, vibeTimer = null;

    function playChord() {
      var c = chords[chordIndex % chords.length];
      playNote(c[0] / 2, 1.6, 'sine', 0.2);
      c.forEach(function (f, n) {
        setTimeout(function () { playNote(f, 0.9, 'triangle', 0.13); }, n * 230);
      });
      setTimeout(function () { playNote(c[2] * 2, 0.7, 'triangle', 0.08); }, 760);
      chordIndex++;
    }

    function setVibe(on) {
      vibeBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      vibeBtn.querySelector('span').textContent = on ? '■' : '▶';
      vibeBtn.lastChild.textContent = on ? ' Stop the vibe' : ' Play a vibe';
      if (musicCard) musicCard.classList.toggle('playing', on);
      clearInterval(vibeTimer);
      if (on) {
        playChord();
        vibeTimer = setInterval(playChord, 1800);
      }
    }

    vibeBtn.addEventListener('click', function () {
      setVibe(vibeBtn.getAttribute('aria-pressed') !== 'true');
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) setVibe(false);
    });
  }

  /* ---------- 3. Rotating photo ring (turns clockwise) ---------- */

  (function () {
    var scene = document.querySelector('.ring-scene');
    if (!scene) return;

    var ring = scene.querySelector('.ring');
    var cards = Array.prototype.slice.call(ring.querySelectorAll('.ring-card'));
    var caption = document.querySelector('.ring-caption');
    var pauseBtn = document.querySelector('.ring-pause');
    var prevBtn = document.querySelector('.ring-prev');
    var nextBtn = document.querySelector('.ring-next');

    var N = cards.length;
    var STEP = 360 / N;
    var SPEED = 0.012;                 // degrees per millisecond (one turn in 30 seconds)
    var angle = 0, target = 0, front = -1;
    var hovering = false, dragging = false, userPaused = reduceMotion, inView = true;
    var last = performance.now();

    ring.style.setProperty('--step', STEP + 'deg');
    cards.forEach(function (c, i) { c.style.setProperty('--i', i); });

    function snap() { target = Math.round(target / STEP) * STEP; }

    function setPaused(p) {
      userPaused = p;
      if (pauseBtn) {
        pauseBtn.textContent = p ? '▶' : '❚❚';
        pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false');
        pauseBtn.setAttribute('aria-label', p ? 'Play rotation' : 'Pause rotation');
      }
    }
    setPaused(userPaused);

    function frame(now) {
      var dt = Math.min(now - last, 50);
      last = now;

      if (inView) {
        if (!userPaused && !hovering && !dragging) target -= dt * SPEED;   // minus = clockwise
        angle += (target - angle) * 0.1;
        ring.style.transform = 'rotateY(' + angle.toFixed(2) + 'deg)';

        var idx = ((Math.round(-angle / STEP) % N) + N) % N;
        if (idx !== front) {
          front = idx;
          cards.forEach(function (c, i) { c.classList.toggle('is-front', i === idx); });
          if (caption) caption.textContent = cards[idx].getAttribute('data-caption') || '';
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // Only work while the ring is on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
      }).observe(scene);
    }

    // Hover pauses (mouse only)
    scene.addEventListener('mouseenter', function () { hovering = true; });
    scene.addEventListener('mouseleave', function () { hovering = false; });

    // Drag or swipe to spin
    var startX = 0, lastX = 0, moved = 0;
    scene.addEventListener('pointerdown', function (e) {
      dragging = true;
      startX = lastX = e.clientX;
      moved = 0;
      if (scene.setPointerCapture) scene.setPointerCapture(e.pointerId);
    });
    scene.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      target += dx * 0.35;
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      snap();
    }
    scene.addEventListener('pointerup', endDrag);
    scene.addEventListener('pointercancel', endDrag);

    // Buttons and arrow keys
    function turn(dir) { snap(); target += dir * STEP; }
    if (prevBtn) prevBtn.addEventListener('click', function () { turn(1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { turn(-1); });
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!userPaused); });
    scene.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { turn(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { turn(1); e.preventDefault(); }
    });

    // Click the front photo to see it large
    var box;
    function openBox(src, text) {
      if (!box) {
        box = document.createElement('div');
        box.className = 'photo-box';
        box.innerHTML = '<button type="button" aria-label="Close photo">✕</button><figure><img alt=""><figcaption></figcaption></figure>';
        document.body.appendChild(box);
        box.addEventListener('click', function () { box.classList.remove('open'); });
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') box.classList.remove('open');
        });
      }
      box.querySelector('img').src = src;
      box.querySelector('img').alt = text;
      box.querySelector('figcaption').textContent = text;
      box.classList.add('open');
    }

    cards.forEach(function (card, i) {
      card.addEventListener('click', function () {
        if (moved > 6) return;                       // it was a drag, not a click
        if (i !== front) {                           // bring this photo to the front by the shortest turn
          target = -i * STEP + Math.round((target + i * STEP) / 360) * 360;
          return;
        }
        var img = card.querySelector('img');
        if (img && img.style.display !== 'none' && img.complete && img.naturalWidth) {
          openBox(img.src, card.getAttribute('data-caption') || '');
        }
      });
    });
  })();

  /* ---------- 4. Soft glow that follows the mouse on cards ---------- */

  var glowSelector = '.focus-card, .explore-card, .stat, .skill-card, .fact, .tool, .step';
  document.querySelectorAll(glowSelector).forEach(function (el) { el.classList.add('glow-card'); });

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var card = e.target.closest && e.target.closest('.glow-card');
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
})();
