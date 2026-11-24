/* ==========================================
   K VIBZ — WELCOME PAGE SCRIPT (index.html only)
   Add AFTER script.js:  <script src="welcome.js"></script>
   A playable piano + a sound-bar visualizer.
========================================== */
(() => {
  const panel = document.querySelector('.identity-panel');
  const piano = document.getElementById('piano');
  const now = document.querySelector('#now span:last-child');
  const cv = document.getElementById('viz');
  if (!panel || !piano || !cv) return;

  // [name, frequency, computer key]
  const whites = [
    ['C', 261.63, 'a'], ['D', 293.66, 's'], ['E', 329.63, 'd'], ['F', 349.23, 'f'],
    ['G', 392.0, 'g'], ['A', 440.0, 'h'], ['B', 493.88, 'j'], ['C', 523.25, 'k']
  ];
  // [name, frequency, computer key, gap number between white keys]
  const blacks = [
    ['C♯', 277.18, 'w', 1], ['D♯', 311.13, 'e', 2], ['F♯', 369.99, 't', 4],
    ['G♯', 415.3, 'y', 5], ['A♯', 466.16, 'u', 6]
  ];

  const byKey = {};

  function makeKey(cls, note, style) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = note[2].toUpperCase();
    b.setAttribute('aria-label', 'Play ' + note[0]);
    if (style) b.style.left = style;
    b.addEventListener('pointerdown', e => { e.preventDefault(); play(note, b); });
    byKey[note[2]] = [note, b];
    return b;
  }

  whites.forEach(n => piano.appendChild(makeKey('key-w', n)));
  blacks.forEach(n => piano.appendChild(makeKey('key-b', n, (n[3] / 8) * 100 + '%')));

  /* ---------- sound ---------- */
  let ctx, master, analyser;

  function initAudio() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;
    master.connect(analyser);
    analyser.connect(ctx.destination);
  }

  function play(note, el) {
    try {
      initAudio();
      if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4200, t);
      filter.frequency.exponentialRampToValueAtTime(900, t + 1.2);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.6, t + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

      [['triangle', 1, 1], ['sine', 2, 0.25]].forEach(([type, mult, vol]) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = note[1] * mult;
        g.gain.value = vol;
        o.connect(g).connect(filter);
        o.start(t);
        o.stop(t + 1.7);
      });

      filter.connect(env).connect(master);
    } catch (err) {
      /* audio not available: the keys still light up */
    }

    el.classList.add('on');
    setTimeout(() => el.classList.remove('on'), 220);
    now.textContent = 'NOW PLAYING · ' + note[0];
  }

  addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const hit = byKey[e.key.toLowerCase()];
    if (hit) play(hit[0], hit[1]);
  });

  /* ---------- pointer glow ---------- */
  panel.addEventListener('pointermove', e => {
    const r = panel.getBoundingClientRect();
    panel.style.setProperty('--mx', e.clientX - r.left + 'px');
    panel.style.setProperty('--my', e.clientY - r.top + 'px');
  });

  /* ---------- sound bars ---------- */
  const c = cv.getContext('2d');
  const data = new Uint8Array(64);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = 32;

  function size() {
    const r = panel.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    cv.width = r.width * d;
    cv.height = r.height * d;
  }
  size();
  addEventListener('resize', size);

  function draw(t) {
    const w = cv.width, h = cv.height, bw = w / N;
    c.clearRect(0, 0, w, h);
    if (analyser) analyser.getByteFrequencyData(data);

    const grad = c.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#9b6dff');
    grad.addColorStop(0.55, '#55e6f5');
    grad.addColorStop(1, '#f472b6');
    c.fillStyle = grad;
    c.globalAlpha = 0.5;

    for (let i = 0; i < N; i++) {
      const idle = 0.05 + (still ? 0 : 0.04 * Math.sin(t / 700 + i * 0.55));
      const v = Math.max(idle, (data[i] || 0) / 255);
      const bh = v * h * 0.5;
      c.fillRect(i * bw + bw * 0.22, h / 2 - bh, bw * 0.56, bh * 2);
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
/* ==========================================================
   K VIBZ CHAT BOX  v3   (works with chatbox.css)
   Every page needs:
     <link rel="stylesheet" href="chatbox.css">   (in the <head>)
     <script src="script.js"></script>
     <script src="chatbox.js"></script>           (right after script.js)

   HOW IT LEARNS
   1. Questions it can't answer are saved on the visitor's device
      (and sent to COLLECT_URL if you set one, so YOU see them all).
   2. It offers to be taught. A taught answer is remembered and
      matched even when the question is worded a little differently.
   3. You review everything by typing  /admin  in the chat, answer with
      /answer 1 | your answer , then type /export to get lines you paste
      into the KNOWN list below, so every visitor gets the answer.
========================================================== */
(function () {
  'use strict';

  /* ---------- 1. YOUR DETAILS (edit here) ---------- */
  const BIRTH = new Date(2007, 8, 7);   // 7 Sept 2007
  const CONTACT = {
    whatsapp: '',    // e.g. '250788000000'  (leave '' to hide)
    email: '',       // e.g. 'you@gmail.com'
    instagram: ''    // e.g. '@kvibz'
  };

  // Optional: a Formspree / Google Apps Script / webhook URL that receives
  // each unanswered question, so you can read what ALL visitors asked.
  const COLLECT_URL = '';

  // Answers YOU approve for every visitor. Paste the lines from /export here:
  //   ['how much is a haircut', 'Prices start at ... Message Kevin on the <a href="contact.html">Contact page</a>.'],
  const KNOWN = [
  ];

  /* ---------- 2. HELPERS ---------- */
  const STORE_KEY = 'kv_chat_v3';
  const MAX_LOG = 150;

  const mem = (function () {
    const blank = { name: '', asked: [], taught: [] };
    try { return Object.assign(blank, JSON.parse(localStorage.getItem(STORE_KEY) || '{}')); }
    catch (e) { return blank; }
  })();
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(mem)); } catch (e) { /* storage blocked */ } };

  const state = { last: null, ctx: null, followUp: null, riddle: null, insults: 0, stage: null, pending: '', bags: {} };

  const rand = n => Math.floor(Math.random() * n);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fill = s => s.replace(/\{name\}/g, esc(mem.name || 'friend'));

  // Lowercase, no punctuation: used to compare questions
  const norm = s => String(s).toLowerCase().replace(/[\u2018\u2019\u02bc']/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const STOP = new Set('a an the is are am was were be to of and or in on at for with my me you your i it this that do does did can could would should what who how when where why please tell about kevin'.split(' '));
  const words = s => norm(s).split(' ').filter(w => w && !STOP.has(w));

  // 0 to 1: how alike two questions are (shared meaningful words)
  function similarity(a, b) {
    const A = new Set(words(a)), B = new Set(words(b));
    if (!A.size || !B.size) return 0;
    let hit = 0;
    A.forEach(w => { if (B.has(w)) hit++; });
    return hit / (A.size + B.size - hit);
  }

  // Hides emails and phone numbers before anything is stored or sent
  const redact = s => s.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]').replace(/\+?\d[\d\s-]{7,}\d/g, '[number]');

  // Picks a reply without repeating until all have been used
  function next(id, list) {
    let bag = state.bags[id];
    if (!bag || !bag.length) {
      bag = list.map((_, i) => i).sort(() => Math.random() - 0.5);
      state.bags[id] = bag;
    }
    const item = list[bag.pop()];
    return typeof item === 'function' ? item() : item;
  }

  const age = () => {
    const n = new Date();
    let a = n.getFullYear() - BIRTH.getFullYear();
    const m = n.getMonth() - BIRTH.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < BIRTH.getDate())) a--;
    return a;
  };

  const contactHTML = () => {
    const p = [];
    if (CONTACT.whatsapp) p.push(`<a href="https://wa.me/${CONTACT.whatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener">WhatsApp</a>`);
    if (CONTACT.email) p.push(`<a href="mailto:${esc(CONTACT.email)}">${esc(CONTACT.email)}</a>`);
    if (CONTACT.instagram) p.push(`<a href="https://instagram.com/${CONTACT.instagram.replace('@', '')}" target="_blank" rel="noopener">Instagram</a>`);
    p.push('<a href="contact.html">the Contact page</a>');
    return p.join(' · ');
  };

  /* ---------- 3. LEARNING SYSTEM ---------- */
  const askedSorted = () => mem.asked.slice().sort((a, b) => b.n - a.n || b.t - a.t);

  function logUnanswered(q) {
    const text = redact(q).slice(0, 200), key = norm(text);
    if (key.length < 4) return;
    const item = mem.asked.find(x => x.k === key);
    if (item) { item.n++; item.t = Date.now(); }
    else {
      mem.asked.push({ k: key, q: text, n: 1, t: Date.now() });
      if (mem.asked.length > MAX_LOG) mem.asked = askedSorted().slice(0, MAX_LOG);
    }
    save();
    if (COLLECT_URL) {
      try {
        fetch(COLLECT_URL, {
          method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: text, page: location.pathname, time: new Date().toISOString() })
        }).catch(() => {});
      } catch (e) { /* offline: the local copy is still saved */ }
    }
  }

  function teach(q, a) {
    const key = norm(q);
    mem.taught = mem.taught.filter(x => norm(x.q) !== key);
    mem.taught.push({ q: q, a: a.slice(0, 400), t: Date.now() });
    mem.asked = mem.asked.filter(x => x.k !== key);
    save();
  }

  // Looks for a curated or taught answer to a similar question
  function findLearned(q) {
    const pool = KNOWN.map(x => ({ q: x[0], a: x[1], html: true })).concat(mem.taught.map(x => ({ q: x.q, a: x.a, html: false })));
    let best = null, top = 0;
    pool.forEach(p => {
      const s = norm(p.q) === norm(q) ? 1 : similarity(p.q, q);
      if (s > top) { top = s; best = p; }
    });
    return best && top >= 0.6 ? (best.html ? best.a : esc(best.a)) : null;
  }

  const LEARN_CMDS = {
    admin() {
      const l = askedSorted().slice(0, 10);
      if (!l.length) return 'Nothing to review 🎉 No unanswered questions are saved on this device yet.';
      return '<b>Unanswered questions</b> (most asked first):<br>' +
        l.map((x, i) => `${i + 1}. ${esc(x.q)} <small>(×${x.n})</small>`).join('<br>') +
        '<br><br>Answer one: <b>/answer 1 | your answer</b><br>Get paste-ready code: <b>/export</b>';
    },
    export() {
      if (!mem.taught.length) return 'No taught answers yet. Use <b>/admin</b> then <b>/answer</b> first.';
      const lines = mem.taught.map(x => `  [${JSON.stringify(x.q)}, ${JSON.stringify(x.a)}],`).join('\n');
      return 'Paste these lines inside <b>KNOWN</b> in chatbox.js:<pre style="white-space:pre-wrap;font-size:12px;margin:6px 0 0">' + esc(lines) + '</pre>';
    },
    forget() {
      mem.asked = []; mem.taught = []; mem.name = ''; save();
      return 'Done 🧹 I deleted your name, saved questions and taught answers from this device.';
    },
    privacy() {
      return 'I save questions I can\'t answer, plus your name if you tell me, on <b>this device only</b>' +
        (COLLECT_URL ? ' (unanswered questions may also be sent to Kevin to improve me)' : '') +
        '. Emails and phone numbers are removed. Type <b>/forget</b> to delete it all 🔒';
    }
  };

  function command(raw) {
    const m = raw.trim().match(/^\/(\w+)\s*(.*)$/s);
    if (!m) return null;
    const name = m[1].toLowerCase();
    if (name === 'answer') {
      const p = m[2].match(/^(\d+)\s*\|\s*([\s\S]+)$/);
      const item = p && askedSorted().slice(0, 10)[p[1] - 1];
      if (!item) return 'Use it like this: <b>/answer 1 | your answer</b> (see numbers with <b>/admin</b>).';
      teach(item.q, p[2].trim());
      return 'Saved ✅ I\'ll use that for "' + esc(item.q) + '" and similar questions.';
    }
    return LEARN_CMDS[name] ? LEARN_CMDS[name]() : null;
  }

  /* ---------- 4. SAFETY AND RUDE WORDS ---------- */
  const crisisRe = /\b(kill myself|suicide|end my life|want to die|self harm|hurt myself)\b/;
  const CRISIS = `I'm really sorry you're feeling this way 💜 You matter. Please talk to someone you trust right now, like a family member, friend, teacher or counsellor, or contact your local emergency services. You don't have to carry this alone.`;
  const selfTalkRe = /\bi('m| am| feel)( so| really)? (stupid|dumb|useless|ugly|a loser|worthless)\b/;
  const insultRe = /\b(stupid|idiot|idiots|dumb|useless|moron|loser|shut ?up|fool|ugly|trash|garbage|rubbish|hate you|suck|fck)\b/;
  const insultReplies = [
    [`Haha, that came out strong 😄 but I'll keep my cool. Is something bothering you? I'm happy to help.`,
     `Ouch 😅 I'm just a bot with good vibes. Let's start fresh. What would you like to know?`,
     `No stress, I won't take it personally 💜 Let's keep it friendly though.`],
    [`Let's keep it respectful please 🙏 I'm here to help, not to fight.`,
     `Bad days happen, but insults won't get us anywhere. Ask me something real and I'll gladly answer 😊`,
     `Easy now 😌 I don't reply to rude words, but I'm still here if you want to chat properly.`],
    [`I'll stay polite, but I won't continue while we're being insulted. When you're ready to chat nicely, I'm right here 🤝`,
     `Okay, I'm pausing on this one 🛑 Respect first, then we can talk music, hair or anything else.`]
  ];

  /* ---------- 5. TOPICS ----------
     add(id, regex, [replies], { more:[…], follow:fn, fn:fn, keep:true })
     ORDER MATTERS: the first matching topic wins, so specific topics
     sit above general ones. Use {name} for the visitor's name. */
  const topics = [];
  const add = (id, re, r, o) => topics.push({ id, re, r, o: o || {} });
  const extend = (id, more) => { const t = topics.find(x => x.id === id); if (t && t.r) t.r.push(...more); };
  const pick = id => next(id, topics.find(t => t.id === id).r);

  /* ----- Respect ----- */
  add('sexual', /\b(nudes?|sex|naked|horny)\b/, [
    `Let's keep it respectful 🙏 I can't chat about that. Ask me about music, hair or even dating in a decent way 😊`,
    `Not that kind of chat 😅 Try me with music, school, hairdressing or a joke instead.`
  ]);

  /* ----- Short reactions that remember the conversation ----- */
  add('ack', /^(ok|okay|k|hmm+|yes|yeah|yep|yup|no|nope|nah|cool|nice|alright|sure|lol|lmao|haha+|hehe+|wow|oh|ah|true|fine|right|i see|really|please)$/, [
    `Haha 😄 What else would you like to know?`,
    `Cool 👌 Ask me anything: music, hair, school, or even dating 😉`,
    `Alright! I'm all ears 🎧`,
    `Want a joke, a fun fact, or to know more about Kevin?`,
    `I'm here whenever you're ready 💜 What's next?`
  ], {
    keep: true,
    fn: m => {
      if (state.followUp && /^(yes|yeah|yep|yup|sure|ok|okay|alright|please)$/.test(m[0])) {
        const go = state.followUp; state.followUp = null; return go();
      }
      if (state.followUp && /^(no|nope|nah)$/.test(m[0])) {
        state.followUp = null; return `No problem 😊 What would you like to talk about instead?`;
      }
      return pick('ack');
    }
  });

  add('more', /^(more|tell me more|go on|continue|and|why|how come|explain|and then|what else)$/, null, {
    keep: true,
    fn: () => state.ctx && state.ctx.more.length ? state.ctx.more.shift()
      : `That's everything I have on that one 😄 Try "joke", "fun fact", "riddle", "music tips", "study tips" or "hair tips".`
  });

  add('answer', /^(answer|the answer|i give up|give up|tell me the answer|what'?s the answer|what is the answer)$/, null, {
    keep: true,
    fn: () => {
      if (!state.riddle) return `Answer to what? 😄 Ask me for a "riddle" first!`;
      const a = state.riddle; state.riddle = null; return a;
    }
  });

  add('name', /\b(?:my name is|call me|they call me)\s+([a-z]+)/, null, {
    fn: m => {
      mem.name = m[1].charAt(0).toUpperCase() + m[1].slice(1); save();
      return `Nice to meet you, ${mem.name}! 😄 I'll remember your name on this device. Ask me anything about Kevin, or just chat.`;
    }
  });

  /* ----- Handy things ----- */
  add('datetime', /\b(what('?s| is) (the )?(date|day|time)|what time is it|today'?s date|current time)\b/, [
    () => {
      const d = new Date();
      return `Today is ${d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} 📅 and it's ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on your device.`;
    }
  ]);

  add('learninfo', /\b(how do you learn|do you learn|can you learn|teach you|train you|make you smarter|improve you|your memory)\b/, [
    `Yes, I learn 🧠 When I can't answer something, I save the question (on your device) and offer to be taught. Reply <b>teach</b>, type the answer, and I'll remember it, even if you word the question a little differently.`,
    `I get smarter from your questions 💜 The ones I miss are saved so Kevin can add proper answers. Type <b>/privacy</b> to see what I keep, or <b>/forget</b> to delete it.`
  ]);

  /* ----- Games and fun ----- */
  const riddles = [
    [`What has hands but can't clap? 🤔`, `A clock! 🕐`],
    [`I speak without a mouth and hear without ears. What am I? 🤔`, `An echo! 🔊`],
    [`What has to be broken before you can use it? 🤔`, `An egg! 🥚`],
    [`The more you take, the more you leave behind. What am I? 🤔`, `Footsteps! 👣`],
    [`What has a neck but no head? 🤔`, `A bottle! 🍾`],
    [`What has many keys but can't open a single door? 🤔`, `A piano! 🎹`],
    [`What can travel around the world while staying in one corner? 🤔`, `A stamp! 📮`],
    [`What gets wetter the more it dries? 🤔`, `A towel! 🧺`],
    [`What has a thousand hills but no mountains in its name? 🤔`, `Rwanda, the Land of a Thousand Hills! 🇷🇼`]
  ];
  const askRiddle = () => {
    const [q, a] = riddles[rand(riddles.length)];
    state.riddle = a + ' Want another riddle?';
    return q + ` (Say "answer" when you give up 😄)`;
  };
  add('riddle', /\b(riddles?|brain ?teaser|puzzle)\b/, [askRiddle], { follow: askRiddle });

  add('joke', /\b(jokes?|make me laugh|funny story)\b/, [
    `Why did the producer bring a ladder to the studio? To reach the high notes 😂`,
    `I told my piano a joke. It didn't laugh, but it had a lot of keys to say 🎹😂`,
    `Why don't hairdressers ever win arguments? They always end up cutting them short ✂️😂`,
    `What do you call a bot that sings? A-I-DOL 🎤🤖`,
    `Why was the beat so calm? It never dropped under pressure 😎`,
    `Why do pianists make great problem solvers? They always find the right key 🎹😂`,
    `Why did the hairdresser win the race? She knew all the short cuts ✂️😂`,
    `Why was the computer cold? It left its Windows open 🥶😂`,
    `Why did the student bring music to the exam? To pass with flying notes 🎶😂`
  ], { follow: () => pick('joke') });

  add('fact', /\b(fun facts?|facts?|learn something)\b/, [
    `Fun fact: Rwanda is called the "Land of a Thousand Hills" 🇷🇼`,
    `Fun fact: Kigali is known as one of the cleanest cities in Africa ✨`,
    `Fun fact: "Muraho" is a common way to say hello in Kinyarwanda 👋`,
    `Fun fact: Music can lift your mood and boost your focus 🎧`,
    `Fun fact: a standard piano has 88 keys, 52 white and 36 black 🎹`,
    `Fun fact: Rwanda banned plastic bags in 2008 ♻️`,
    `Fun fact: hair grows about 1.25 cm (half an inch) a month on average ✂️`,
    `Fun fact: concert tuning sets the note A above middle C to 440 Hz 🎼`,
    `Fun fact: Rwanda's official languages are Kinyarwanda, English, French and Swahili 🗣️`
  ], { follow: () => pick('fact') });

  add('game', /\b(games?|quiz|trivia|bored|entertain me)\b/, [
    askRiddle,
    `Truth or vibe? Tell me your favourite song right now and I'll rate it 🎧`,
    `Bored? Try asking me for a joke, a fun fact or a riddle 😎`
  ]);

  /* ----- Dating: the visitor flirting with the bot or about Kevin ----- */
  add('askout', /\b(be my (girlfriend|boyfriend|man|boo)|date me|go out with me|want to date|wanna date|i like you|i love you|i want you|interested in you|can we date)\b/, [
    `Aww 😄 I'm just a chat assistant, so I can't date. But Kevin is single and open to meeting someone. Want to say hi to him? Try <a href="contact.html">the Contact page</a>.`,
    `That's sweet 💜 I'm only a bot though! If you'd like to talk to the real Kevin, send him a message and be yourself.`,
    `Haha you're bold 😎 Kevin's the one to talk to, so leave him a message on the <a href="contact.html">Contact page</a>.`
  ]);

  add('imgirl', /\bi(?:'m| am) (?:a )?(girl|lady|woman|female)\b/, [
    `Nice to meet you! 💜 Kevin is single and looking for a girlfriend, so you picked a good page 😄 Tell me a bit about yourself. What do you love doing?`,
    `Welcome! 😊 Kevin would love to hear from you. What's your vibe: music, movies, or long chats?`
  ]);

  add('imguy', /\bi(?:'m| am) (?:a )?(boy|man|guy|male|dude|bro)\b/, [
    `Welcome, my friend 🤝 Kevin loves meeting new people, whether it's music, business or just good vibes. What brings you here?`,
    `Nice one 😎 Are you here for music, hairdressing, or just to say hi?`
  ]);

  /* ----- Love advice (specific first, general last) ----- */
  add('rejected', /\b(they|she|he) (rejected|turned me down|said no|doesn'?t (love|like) me|chose someone else)\b|\b(friend ?zoned|unrequited|rejected me)\b/, [
    `Come here, virtual hug first 💔 Rejection hurts, but it only means the feelings don't match. It doesn't make you less worthy of love.`,
    `Please don't start insulting yourself because one person didn't choose you 💜 Take time to heal, talk to someone you trust and keep growing.`,
    `Your heart just submitted a resignation letter 😭 but it will recover. Accept the answer with respect and give yourself space.`
  ]);

  add('ghosted', /\b(left me on read|ignor(ed|ing) me|(isn'?t|is not|hasn'?t|has not) (replying|replied|responded)|replies late|dry repl(y|ies)|no reply)\b/, [
    `I know you've opened WhatsApp 86 times since sending that message 😭 Put the phone down. They may be busy, sleeping or studying. Not every late reply is a romantic emergency.`,
    `Don't send "Hello?", "Are you there?" and a pile of question marks 😂 Give some time, and notice whether it's a pattern. Real interest shows up as effort.`,
    `If it's always one-word answers, don't force it. You're looking for a partner, not a customer service department 😂`
  ]);

  add('confess', /\b(how (do|can|should) i (confess|ask (her|him|them) out|tell (her|him|them) (that )?i (love|like))|confess my (love|feelings)|declare my love|tell (her|him|them) my feelings)\b/, [
    `A serious mission 🥹 Keep it honest and pressure-free: "I've really enjoyed getting to know you, and I've started developing feelings. I wanted to be honest. How do you feel?"`,
    `No 20-page love letter needed 😂 Be honest, speak from the heart and leave room for their answer. Whatever it is, handle it with respect.`,
    `Courage isn't knowing the answer will be yes. It's being honest anyway. Your worth doesn't depend on the reply 💜`
  ]);

  add('textcrush', /\b(how (do|can|should) i (text|message|approach|talk to|impress|attract) (a |this |my )?(girl|boy|crush|person|woman|man)|what should i (say|text) (to )?(her|him|them)|get (her|his|their) attention)\b/, [
    `Breathe first 😂 You're texting a person, not negotiating peace between two countries. Try: "Hey, how's your day been?" Then really listen and build from their answer.`,
    `Try something playful but honest: "I was going to find a clever opening line, but I'd rather just get to know you." Simple beats complicated.`,
    `Ask about their music, dreams and hobbies, and remember what they say. That beats "Hey beautiful" every morning for 365 days 😭`
  ]);

  add('likesme', /\b(?:(?:she|he|they) (?:likes|loves|smiles at) me|does (?:she|he|they) (?:like|love) me|has feelings for me)\b/, [
    `Exciting! 🥹 But one smile isn't a love confession. Watch whether they make an effort, start conversations and enjoy your time together.`,
    `You've already picked baby names, haven't you? 😂 Relax and get to know them properly first.`,
    `That's a good sign if the interest is consistent 💜 Just don't send 47 messages in a row. Be yourself and let it grow at a comfortable pace.`
  ]);

  add('jealousy', /\b(i am jealous|i'?m jealous|jealous|talks to other (boys|girls|guys)|has (male|female) friends|likes another (guy|girl)|is talking to someone else)\b/, [
    `Put the detective magnifying glass down 😭 Friends of another gender don't automatically mean cheating. Trust and honest talk matter most.`,
    `It's okay to feel jealous sometimes, but don't use it to control who someone talks to. Share how you feel calmly and listen too.`,
    `Love is not ownership 💜 You can care deeply and still respect someone's freedom and friendships.`
  ]);

  add('breakup', /\b(breakup|break up|broke up|left me|my ex|miss my ex|relationship ended|moving on)\b/, [
    `Oh no 💔 When someone is part of your daily life, losing that leaves a big space. Take it one day at a time.`,
    `Please don't send a 3 AM "I still love you" and regret it by morning 😭 Give yourself time before emotional decisions.`,
    `Drink water, eat something, sleep. Your healing needs energy too 💜 Heartbreak songs are allowed, but only a few!`
  ]);

  add('pickup', /\b(pick ?up lines?|flirty message|romantic message|sweet words|make (her|him|them) (smile|blush)|cute message)\b/, [
    `Try this 😂: "Are you my favourite notification? Every time your name appears, my mood changes."`,
    `"I planned to have a productive day, then remembered your smile and my brain took a romantic holiday." 😭`,
    `"Even an ordinary conversation with you becomes the best part of my day." 🥹`,
    `"You must be a good song, because I keep coming back to you." 🎶`
  ], { follow: () => pick('pickup') });

  add('gnmessage', /\b(good ?night message|good morning message|sweet dreams|morning text|night text)\b/, [
    `Goodnight ❤️ I hope you sleep peacefully and wake up smiling. Someone is wishing you a wonderful night.`,
    `Sleep well, troublemaker 😂 I hope your dreams are as beautiful as your smile.`,
    `Good morning sunshine ☀️ I hope today brings you happiness and plenty of reasons to smile.`
  ]);

  add('marriage', /\b(marry|wedding|future (wife|husband)|baby names|marriage plans)\b/, [
    `Met Monday, texting Tuesday, in love Wednesday, wedding budget Thursday? 😭 At least learn their favourite food first!`,
    `Congratulations 😄 but before inviting 500 guests, make sure you share values, dreams and plans for the future.`
  ]);

  add('reladvice', /\b(relationship (advice|problems)|healthy relationship|trust in a relationship|what makes love last|loyalty|loyal)\b/, [
    `A healthy relationship needs five things ❤️ trust, honest communication, respect, patience and effort from both people.`,
    `A strong couple isn't two people who never argue. It's two people who can disagree without disrespect and say sorry when needed.`,
    `Never confuse constant drama with passion. You deserve laughter, growth and peace 💜`
  ]);

  add('inlove', /\b(i love (her|him|them)|i'?m in love|i am in love|i miss (her|him|them)|can'?t stop thinking about (her|him|them))\b/, [
    `Aww 🥹❤️ Tell me: what's the one thing about them that makes you smile on a bad day?`,
    `Love is sweet. Just remember it also means respecting boundaries and letting the other person be themselves.`,
    `I can hear the romantic music 🎶😂 Tell me about them. What makes them special?`
  ]);

  /* ----- Kevin: relationship status ----- */
  add('single', /\b(is (kevin|he) (single|taken|married)|(kevin|he)('s| is| has) (a )?(single|girlfriend|boyfriend|married|taken)|does (kevin|he) have a (girlfriend|partner)|are you single|relationship status|love life)\b|^single$/, [
    `Kevin is single 😄 and looking for a girlfriend. Interested? Say hi on <a href="contact.html">the Contact page</a>.`,
    `Single and focused 🎶 but open to meeting someone special. The right person might be you 😉`,
    `Yes, Kevin is single right now. He's busy with music, hair and school, but open to a good connection.`,
    `Single ✅ Looking for a real connection, not games. Want to leave him a message?`
  ]);

  add('type', /\b(what (kind|type) of (girl|woman|lady)|ideal (girl|woman)|his type|your type)\b/, [
    `Kevin hasn't written a checklist 😄 The best way to find out is to talk to him. Be honest, be kind and be yourself.`,
    `No fixed type, just a good heart and good energy 💜 Why not message him and find out?`
  ]);

  add('lovesite', /\b(i (really |truly )?(love|like|enjoy) (this|your|the|his) (site|website|portfolio|page|design|chat|bot)|(this|the) (site|website|portfolio) (is|looks) (so |very )?(nice|great|cool|amazing|awesome|beautiful|good))\b/, [
    `Thank you so much! 🙏 Kevin worked hard on it and will be glad to hear that.`,
    `That means a lot 💜 The <a href="portfolio.html">Portfolio</a> has more to explore.`,
    `Appreciated! 🔥 Tell Kevin directly on <a href="contact.html">the Contact page</a>, he'd love to hear it.`
  ]);

  add('flirt', /\b(cute|handsome|gorgeous|attractive|good looking|charming|beautiful)\b/, [
    `Aww thank you 😊 I'll tell Kevin you said that!`,
    `Haha you're making me blush (if bots could blush) 😄`,
    `Compliments accepted 💜 Want to chat with the real Kevin? Try <a href="contact.html">the Contact page</a>.`
  ]);

  /* ----- About Kevin ----- */
  add('myname', /\b(your name|what is your name|what's your name|real name|full name)\b/, [
    `The name is Habineza Kevin, but in music everyone knows him as K VIBZ 🎶`
  ]);

  add('bot', /\b(who are you|what are you|are you (a )?(bot|robot|ai|real|human)|are you kevin)\b/, [
    `I'm the K VIBZ assistant 🤖, a chat helper built to answer questions about Kevin, his music, skills and more.`,
    `I'm not Kevin himself. I'm his website assistant! I know a lot about him though 😄`,
    `Just a friendly bot living on this website 💜 I can chat about Kevin, music, hairdressing, or just vibe with you.`
  ]);

  add('kvibz', /\b(k vibz|kvibz|stage name|vibz)\b/, [
    `K VIBZ is Kevin's stage name, the name people know him by in music 🎧`,
    `K VIBZ = the music side of Habineza Kevin. Beats, sound and creativity with no limits ✦`
  ]);

  add('about', /\b(who is (kevin|he)|about (kevin|him)|tell me about (him|kevin|yourself)|introduce|describe)\b/, [
    `Kevin (Habineza Kevin, aka K VIBZ) is a Rwandan music producer, hairdressing trainee and student who studies history, geography and literature in English. Creative, curious and always learning 🎶`,
    `Think music + style + books 📚🎧✂️ Kevin produces music, does hairdressing and studies history, geography and literature.`,
    `Short version: Rwandan, creative, ambitious. He wants a future in music production or hairdressing, and he's working hard for it.`
  ], { more: [
    `He's into Afrobeat and Afro-kompa, plays the piano, and his favourite singers are Rema and Davido 🎹`,
    `Want more? Ask about his <b>school</b>, <b>family</b>, <b>skills</b> or <b>ambition</b>.`
  ] });

  add('birthday', /\b(birthday|date of birth|dob|when (were|was) (you|he|kevin) born|when is (his|your) birthday)\b/, [
    `Kevin's birthday is on 7 September 🎂 Mark your calendar!`,
    `He was born on 7 September, in Kigali (Kicukiro) 🎉`
  ]);

  add('age', /\b(how old|age|years old)\b/, [
    () => `Kevin is ${age()} years old 🎂`,
    () => `He's ${age()}, young, creative and just getting started 🚀`
  ]);

  add('location', /\b(where (are|is) (you|he|kevin|k vibz)|where (do|does) (you|he|kevin) (live|come)|where (were|was) (you|he) born|hometown|born in|(you|he|kevin) (are|is) from|where.*from)\b/, [
    `Kevin is Rwandan 🇷🇼. His family is from Rwamagana, and he was born in Kigali (Kicukiro).`,
    `Proudly Rwandan 🇷🇼 Born in Kicukiro, Kigali, with roots in Rwamagana.`,
    `Kigali-born, Rwamagana-rooted, Rwanda forever 🇷🇼`
  ]);

  add('school', /\b(school|agahozo|shalom|asyv|youth village|campus)\b/, [
    `Kevin is a student at Agahozo Shalom Youth Village 🎓`,
    `He studies at Agahozo Shalom Youth Village, where he learns, creates and grows.`
  ]);

  add('graduation', /\b(graduat\w*|2027|finish school|after school)\b/, [
    `Kevin graduates in 2027 🎓 and after that, the plan is to go big in music production or hairdressing.`,
    `2027 is the year! Graduation first, then full focus on the dream 🚀`
  ]);

  /* ----- School and study (before "studies") ----- */
  add('subjecthelp', /\bhow (do|can|to) (i |we )?(study|revise|learn|understand|get better at) (history|geography|literature)\b/, [
    `History 🏛️ Build timelines and ask "what caused this?" and "what changed afterwards?"`,
    `Geography 🗺️ Use maps, diagrams and real examples. Link physical features to how people live.`,
    `Literature 📖 For each text, note the characters, themes and a few key quotes, then explain the effect of the writer's choices.`
  ]);

  add('studytips', /\b(study (tips?|better|method|plan)|how (to|do i|can i) study|exams?|revision|revise|homework|focus|concentrat\w*|procrastinat\w*)\b/, [
    `Study smarter 📚 Try the Pomodoro method: study 25 minutes, rest 5 minutes, repeat. Then test yourself instead of just re-reading.`,
    `Good study habits 🧠 Sleep well, review notes the same day, practise recall, and explain what you learned out loud, like you're teaching a friend.`
  ], { more: [
    `Active recall: close your book and write down everything you remember. The gaps show you what to study next ✍️`,
    `Spaced repetition: review after 1 day, 3 days, then a week. Your memory loves it 🔁`,
    `Music without lyrics can help you focus 🎧 Lo-fi or instrumental beats work well.`
  ] });

  add('essay', /\b(essay|writing tips?|how to write|paragraph|thesis|introduction|conclusion)\b/, [
    `Essay recipe ✍️ Start with a clear point, add evidence, explain how the evidence proves your point, then link back to the question. Teachers call it PEEL: Point, Evidence, Explain, Link.`,
    `A good essay has 3 parts: an introduction that answers the question, body paragraphs with evidence, and a conclusion that ties it together 📝`
  ], { more: [
    `Write the introduction last. By then you know exactly what you're introducing 😉`,
    `Read your work out loud. If a sentence feels long, split it ✂️`
  ] });

  add('english', /\b(improve (my )?english|learn english|english (tips|practice|grammar|speaking)|speak english|vocabulary)\b/, [
    `Level up your English 🗣️ Read a little every day, note 3 new words, use them in sentences, and speak out loud even when nobody is listening.`,
    `Watch or listen in English with subtitles, then repeat the lines. Mistakes are proof that you're practising 💪`
  ]);

  add('studies', /\b(study|studies|subject|subjects|history|geography|literature|course|combination|student|academic|education)\b/, [
    `Kevin studies history, geography and literature in English 📚 A great mix for understanding people, places and stories.`,
    `History teaches him where we come from, geography shows him the world, and literature gives him the words 📖`,
    `Academically it's history, geography and literature. Practically it's hairdressing. Creatively it's music. Busy guy 😄`
  ]);

  add('ambition', /\b(ambition|goal|goals|dream|dreams|future|plan|plans|career|want to be|become)\b/, [
    `Kevin's ambition is to build a career in music production or hairdressing, or both! 🎧✂️`,
    `The dream: turning his creativity into a real career. Music production and hairdressing are both on the table.`,
    `Big dreams, steady steps 💜 He's learning now so he can create more later.`
  ]);

  add('family', /\b(family|mother|mom|mum|mama|father|dad|parents?|brother|sister|siblings?|adam|dafin|florence)\b/, [
    `Family matters to Kevin 💜 He has two siblings, Adam and Dafin, and his mother is Florence.`,
    `Kevin's mum is Florence, and his siblings are Adam and Dafin. A close circle!`
  ]);

  /* ----- Music knowledge (specific first) ----- */
  add('logicpro', /\b(logic ?pro|logic|daw|digital audio workstation|fl studio|ableton)\b/, [
    `Logic Pro is Apple's music production software 🎛️ It's a DAW (digital audio workstation) where you record, arrange, edit and mix. Kevin is learning to arrange and produce music with it.`,
    `A DAW is the "studio on your computer" 💻 Kevin uses Logic Pro to build beats, layer sounds and shape his ideas into songs.`
  ], { more: [
    `Inside a DAW you can use virtual instruments, drum machines, loops and effects. It's a great place to practise arrangement 🎹`,
    `Start small: make a 4-bar loop with drums, bass and chords, then build from there 🔁`
  ] });

  add('afrobeat', /\b(afro ?beats?|afro ?kompa|kompa|compas|music styles?|genres?)\b/, [
    `Kevin's interests include Afrobeat and Afro-kompa 🎶 Afrobeats is the modern African pop sound, full of groove, percussion and catchy melodies.`,
    `Kompa is a smooth, danceable style from Haiti, and Afro-kompa mixes African and kompa feeling 🥁`
  ], { more: [
    `Afrobeat (no "s") started with Fela Kuti, while Afrobeats (with "s") is today's pop sound from artists like Burna Boy, Rema and Davido 🎤`,
    `Both styles are rhythm first: drums, percussion and bass make you move 💃`
  ] });

  add('startmusic', /\b(how (do|can|to|should) (i |we )?(start|begin|learn|make|produce)( to)? (music|producing|production|beats?|a beat|songs?)|beginner.*(produc|beat)|learn music production)\b/, [
    `Great question 🎧 A simple start: <br>1️⃣ Pick one DAW (like Logic Pro) <br>2️⃣ Learn drums, bass and chords <br>3️⃣ Make a short 4-bar loop <br>4️⃣ Finish small ideas instead of perfecting one <br>5️⃣ Compare with songs you love`,
    `Start simple 💡 Open a DAW, make a drum pattern, add a bassline, then a chord or melody. Repeat daily and you'll improve fast.`
  ], { more: [
    `Finish at least one small beat every week. Finished beats teach you more than ten unfinished ones 💪`,
    `Listen like a producer: what's the drum pattern, where does the bass enter, what changes in the chorus? 🎧`,
    `Tell Kevin what you're making on the <a href="contact.html">Contact page</a>, he loves talking about music!`
  ] });

  add('chords', /\b(chords?|scales?|melody|melodies|piano (lessons?|tips|practice|beginner)|how (to|do i) play (the )?piano)\b/, [
    `Piano starter pack 🎹 Learn the C major scale first (all white keys), then try the chords C, G, Am and F. That four-chord loop sounds like a hundred songs.`,
    `Practise slowly and keep it steady 🎹 Scale, chords, then a short melody. Ten focused minutes beats an hour of rushing.`
  ], { more: [
    `A chord is usually three notes played together. C major is C, E and G 🎶`,
    `A melody is the part you hum. Chords are the colour underneath it 🎨`
  ] });

  add('songwriting', /\b(songwriting|write (a )?(song|lyrics|verse|hook)|lyrics tips|hook|chorus)\b/, [
    `Songwriting 🎤 Start with a feeling, then a hook: one short line people can repeat. Build verses that tell the story and a chorus that says the main idea.`,
    `Hum a melody over your beat before writing words. The melody tells you where the syllables should fall ✍️`
  ]);

  add('recording', /\b(record(ing)? (vocals?|voice|my voice)|vocals?|microphone|mic|home studio)\b/, [
    `Recording vocals 🎙️ Pick a quiet room, keep the mic a fist away from your mouth, use a pop filter if you can, and record a few takes. Soft furnishings help absorb echo.`,
    `Warm up your voice, drink water, and sing from your stomach, not your throat 🎤`
  ]);

  add('mixing', /\b(mix(ing)?|master(ing)?|eq|compress(ion|or)?|reverb|sound quality|clean sound)\b/, [
    `Mixing basics 🎚️ Balance the volumes first, use EQ to cut what you don't need, add a little compression for control, and use reverb gently so it doesn't get muddy.`,
    `A clean mix starts with good volume balance 🎧 Keep your master peaks below about −6 dB so there's room left for mastering.`
  ], { more: [
    `Cut before you boost: removing a clashing frequency often sounds better than turning something else up ✂️`,
    `Check your mix on different speakers: headphones, phone and a speaker 🔊`
  ] });

  add('tempo', /\b(bpm|tempo|drums?|drum pattern|808|bassline|bass line|kick)\b/, [
    `Afrobeats often sits around 100 to 115 BPM 🥁 which is a groove you can dance to without rushing.`,
    `An 808 is a deep sub-bass or kick sound from the Roland TR-808 drum machine 🔊 It's a big part of modern beats.`,
    `A solid beat starts with kick and snare, then hi-hats, then bass that locks in with the kick 🎶`
  ]);

  add('gear', /\b(headphones?|speakers?|monitors?|midi|audio interface|equipment|gear|what should i buy)\b/, [
    `Gear tip 🎧 Good headphones and a MIDI keyboard matter more than fancy extras. Learn your tools well before buying new ones.`,
    `Start with: a laptop, a DAW, closed-back headphones and a small MIDI keyboard. Upgrade only when something truly holds you back.`
  ]);

  add('recommend', /\b(recommend|suggest).*(song|songs|music|artist|artists|playlist)|what should i listen to|new music\b/, [
    `Kevin's favourite singers are Rema and Davido 🎤 For more Afrobeats, try Burna Boy, Tems, Asake and Ayra Starr. For classic Afrobeat, Fela Kuti is a must.`,
    `Want Rwandan sounds? 🇷🇼 Try Bruce Melodie, Meddy, The Ben and Knowless Butera. Tell me what you like and I'll suggest more!`
  ], { more: [`Tell me your mood: hype, chill, study or dance? 🎧 I'll point you to a style.`] });

  add('lovemusic', /\bi (really |truly )?(love|like|enjoy) (music|beats?|afrobeats?|piano|singing|dancing|songs?|producing)\b/, [
    `Same energy 🎧 Music is the heart of K VIBZ. What kind do you like most?`,
    `Love that 💜 Do you make music yourself or mostly listen?`,
    `A music lover! 🎶 You and Kevin would get along. Want to see his <a href="portfolio.html">Portfolio</a>?`
  ]);

  add('musictips', /\b((music|production|producer|beat|beats|piano) tips?|tips for (music|producing|making beats?)|production tips)\b/, [
    `Music tips 🎧 <br>1️⃣ Finish small ideas often <br>2️⃣ Learn drums, bass and chords first <br>3️⃣ Compare your track with songs you love <br>4️⃣ Take breaks so your ears stay fresh`,
    `Producer tips 🎛️ Start with the drums and bass, add chords, then keep the melody simple. Less is often more.`,
    `Piano and production tips 🎹 Practise slowly, learn a few chords, and record yourself so you can hear what to improve.`
  ], { more: [
    `Want details? Ask me about "chords", "mixing", "BPM", "songwriting" or "how to start producing" 🎶`,
    `Tell Kevin what you're working on on the <a href="contact.html">Contact page</a>. He loves talking about music!`
  ] });

  add('artists', /\b(favou?rite (singer|artist|musician)|rema|davido|davis d|who (inspires|inspired)|idol|who do you listen)\b/, [
    `Kevin's favourite singers are Rema and Davido 🎤 You can hear that Afrobeats energy in his taste.`,
    `Rema and Davido are on top of his list 🔥 Who's yours?`
  ]);

  add('collab', /\b(collab\w*|feature|work together|studio session|record\w*|make me a beat|produce for me)\b/, [
    `Collabs are welcome 🎶 Tell Kevin what you have in mind through <a href="contact.html">the Contact page</a>.`,
    `Looking for a producer? 🎧 Send Kevin your idea: genre, vibe, and what you want to achieve.`,
    `Great things start with a conversation. Reach out here: <a href="contact.html">Contact</a> and let's create 🔥`
  ]);

  add('piano', /\b(piano|keyboard|keys|instrument)\b/, [
    `Yes, Kevin plays the piano 🎹 It's part of his music foundation. (Try the keys on the Welcome page!)`,
    `Piano is part of his sound 🎹 Melodies come first, then the beats.`
  ]);

  add('music', /\b(music|produc\w*|beat|beats|song|songs|studio|rapper|rap|singer|album|track|tracks|instrumental)\b/, [
    `Music is Kevin's heart 🎧 He produces beats and sound under the name K VIBZ. Check the <a href="portfolio.html">Portfolio</a>.`,
    `K VIBZ = music production, creativity and good vibes ✦ Want to know about his favourite artists?`,
    `Beats, melodies, ideas turned into sound 🎶 That's the K VIBZ way.`,
    `Beats start as tiny ideas 🎧 A drum pattern, a chord, a melody, then the magic happens.`
  ]);

  /* ----- Hairdressing and business ----- */
  add('hairtips', /\b(hair care|healthy hair|hair tips?|grow (my )?hair|hair growth|dry hair|protective styles?|natural hair|hair routine)\b/, [
    `Hair care basics 💈 Keep it moisturised, detangle gently, trim split ends, and limit heat. Protective styles can help reduce breakage.`,
    `Sleeping on a satin or silk pillowcase (or wearing a satin bonnet) helps reduce friction and dryness 🌙`
  ], { more: [
    `Everyone's hair is different. A professional can check your hair type and scalp 💜`,
    `Drink water and eat well too. Healthy hair starts from the inside 🥗`,
    `Want to book a service? Message Kevin on the <a href="contact.html">Contact page</a> ✂️`
  ] });

  add('hairstyle', /\b(fade|taper|low cut|hair ?styles?|what (style|haircut)|which (style|haircut)|new look)\b/, [
    `Picking a style ✂️ Think about your hair type, face shape and how much time you want to spend on it. A reference photo makes things much easier.`,
    `Save 2 or 3 photos of styles you like, and ask your hairdresser what suits your hair type 💈`
  ]);

  add('booking', /\b(book\w*|appointment|price|prices|pricing|cost|how much|services?)\b/, [
    `For bookings or prices, the best way is to message Kevin directly:`,
    `Pricing depends on the service 💈 Send Kevin a message and he'll give you details:`,
    `Want to book a hair service or a music session? Contact Kevin here:`
  ]);

  add('hair', /\b(hair\w*|salon|barber|braid\w*|haircut|styling|locs|weave|wig)\b/, [
    `Kevin is training in hairdressing ✂️ It's his practical skill and one of his career dreams.`,
    `Hair is art too 💈 Kevin learns, practises and improves with every client.`,
    `Hairdressing is his hands-on side ✂️ See more on the <a href="skills.html">Skills</a> page.`
  ]);

  add('business', /\b(business|hire|hiring|job|work with you|proposal|sponsor\w*|brand|deal|invest\w*|opportunit\w*|gig|event|perform\w*)\b/, [
    `For business, collaborations or opportunities, Kevin is open to serious conversations 💼 Contact him here:`,
    `Professional enquiries are welcome 🤝 Send a clear message about what you need, the timeline and your budget, and Kevin will respond:`
  ]);

  /* ----- The site ----- */
  add('skills', /\b(what skills|his skills|list.*skills|strengths?|talents?|what can (he|kevin) do)\b/, [
    `Kevin's skill areas 💪 <br>🎧 Music production <br>🎹 Piano <br>✂️ Hairdressing <br>📚 Research and writing <br>🤝 Teamwork and leadership <br>✦ Creativity and problem-solving <br>See details on the <a href="skills.html">Skills</a> page.`
  ]);

  add('whyhire', /\bwhy (should|would) (i|we) (hire|work with|choose|pick|trust)\b/, [
    `Because Kevin is creative, responsible and always learning 💜 He values hard work, teamwork and finishing what he starts. See his <a href="portfolio.html">Portfolio</a>.`,
    `Kevin is still growing, and that means he's eager, open to feedback and serious about improving 🚀`
  ]);

  add('weakness', /\b(weakness|weaknesses|flaws?|what.*(needs?|want) to improve)\b/, [
    `Kevin is honest about it: he's still learning and building experience 🌱 That's why he practises daily and welcomes feedback.`,
    `His biggest focus is growth 💜 More practice, more projects, more experience.`
  ]);

  add('website', /\b(who (made|built|created|designed|coded) (this|the|your) (site|website|portfolio|page)|how (was|is) (this|the) (site|website|portfolio) (made|built)|built with|what language)\b/, [
    `This portfolio is handcrafted with HTML, CSS and JavaScript ✦ and I'm the little chat helper inside it 🤖`,
    `Built with HTML, CSS and JavaScript, no heavy templates. Every animation here was designed for K VIBZ 🎨`
  ]);

  add('pages', /\b(which page|what pages|site ?map|navigate|where (can|do) i (find|see)|how do i (use|navigate) (this )?(site|website))\b/, [
    `Here's the map 🗺️ <br><a href="index.html">Welcome</a> · <a href="home.html">Home</a> · <a href="about.html">About</a> · <a href="skills.html">Skills</a> · <a href="portfolio.html">Portfolio</a> · <a href="contact.html">Contact</a>`
  ]);

  add('human', /\b(talk|speak|chat) (to|with) (a |the )?(real |actual )?(person|human|kevin)|real person\b/, [
    `Want the real Kevin? 💜 Send him a message on the <a href="contact.html">Contact page</a> and he'll reply when he can.`,
    `I'm just the assistant 🤖 To reach Kevin himself, use the <a href="contact.html">Contact page</a>.`
  ]);

  add('feedback', /\b(feedback|suggestions?|report (a )?(bug|problem)|something (is )?(broken|not working)|not working)\b/, [
    `Thanks for letting us know 🙏 Please send the details to Kevin on the <a href="contact.html">Contact page</a> so he can fix it.`,
    `Feedback is welcome 💜 Tell Kevin what you'd like to see improved: <a href="contact.html">Contact</a>.`
  ]);

  add('privacy', /\b(privacy|do you (remember|store|save|record)|is this (chat )?(private|safe))\b/, [
    () => LEARN_CMDS.privacy()
  ]);

  add('portfolio', /\b(portfolio|website|site|projects?|samples?|your work|his work|show me)\b/, [
    `You can see Kevin's projects on the <a href="portfolio.html">Portfolio</a> page 🎨`,
    `Everything he's created is in the <a href="portfolio.html">Portfolio</a>. Take your time!`,
    `Start with <a href="home.html">Home</a>, then explore <a href="skills.html">Skills</a> and <a href="portfolio.html">Portfolio</a> ✦`
  ]);

  add('contact', /\b(contact|whatsapp|phone|number|email|mail|instagram|insta|reach|dm|call|telegram|social|snap\w*|tiktok|youtube)\b/, [
    `You can reach Kevin here:`,
    `Let's get you connected 💜 Contact Kevin via:`,
    `Message Kevin directly:`
  ]);

  /* ----- Rwanda ----- */
  add('phrases', /\b(kinyarwanda (words?|phrases?|lessons?)|teach me (some )?kinyarwanda|how (do|to) (i )?say .* in kinyarwanda|common phrases)\b/, [
    `Kinyarwanda starter pack 🇷🇼 <br>👋 Muraho = Hello <br>🌅 Mwaramutse = Good morning <br>🙏 Murakoze = Thank you <br>✅ Yego = Yes <br>❌ Oya = No <br>👋 Murabeho = Goodbye`,
    `Try this chat 😄 "Amakuru?" (How are you?) and the reply "Ni meza" (I'm fine).`
  ], { more: [
    `Murakoze cyane = thank you very much 💜`,
    `Mwiriwe = good afternoon / good evening 🌇`
  ] });

  add('rwanda', /\b(tell me about rwanda|about rwanda|rwanda facts?|visit rwanda|tourism|things to do in (rwanda|kigali)|rwandan (food|culture|dish|dishes)|food in rwanda|what to eat|kigali)\b/, [
    `Rwanda 🇷🇼 is called the "Land of a Thousand Hills". Popular places include Volcanoes National Park (mountain gorillas), Lake Kivu, Nyungwe Forest and Akagera National Park.`,
    `Rwandan food is tasty 😋 Try brochettes, isombe (cassava leaves), ubugari (ugali), ibitoke (plantains), and the local tea and coffee ☕`
  ], { more: [
    `On the last Saturday of each month, Rwandans take part in Umuganda, community work that keeps neighbourhoods clean and strong 🤝`,
    `Kigali sits high up in the hills, so the weather is usually mild all year 🌤️`,
    `Rwanda's currency is the Rwandan franc (RWF) and its official languages are Kinyarwanda, English, French and Swahili.`
  ] });

  add('football', /\b(football|soccer|amavubi|apr fc|rayon sports|premier league|messi|ronaldo)\b/, [
    `Football is huge in Rwanda ⚽ Amavubi is the national team, and local giants APR FC and Rayon Sports have passionate fans.`,
    `Match day energy is unmatched ⚽ Who do you support?`
  ]);

  add('weather', /\b(weather|raining|rain today|is it sunny|how hot|how cold)\b/, [
    `I can't check live weather 🌤️ but Rwanda has a mild climate thanks to its altitude, with rainy seasons roughly from March to May and from October to December.`,
    `For today's weather, check a weather app 📱 I'm better with music, hair and Rwanda facts!`
  ]);

  /* ----- Life advice ----- */
  add('lovegen', /\b(girl|girls|girlfriend|boyfriend|crush|dating|date|romance|romantic|flirting)\b/, [
    `Ooh, love talk 😄 Tell me everything. Who is it, and what happened? I promise not to judge your romantic adventures 💜`,
    `Love is beautiful and confusing 😂 What's going on? I'm listening 🍿`,
    `Honest advice from the K VIBZ assistant: be genuine, be respectful, be patient. The right person notices 💜`
  ]);

  add('money', /\b(money|save|saving|budget|broke|earn|side hustle|business idea)\b/, [
    `Money basics 💰 Pay yourself first: save a small fixed amount whenever money comes in, even a little. Track where it goes and spend less on things you forget by next week.`,
    `Turn a skill into income 🎧✂️ Beats, haircuts, tutoring or design. Start small, ask for honest feedback and keep your prices fair.`
  ]);

  add('career', /\b(which career|choose (a )?career|what should i study|what job|find my passion|career advice)\b/, [
    `Choosing a path 🧭 List what you enjoy, what you're good at, and what people would pay for. Where the three overlap is a great place to start. Try small projects before committing.`,
    `You don't have to pick one thing forever 💜 Kevin is exploring music and hairdressing at once. Curiosity is a strategy.`
  ]);

  add('health', /\b(sleep|insomnia|exercise|workout|gym|healthy|water|diet|energy)\b/, [
    `Small health wins 💪 Sleep 7 to 9 hours, drink water, move for 20 minutes a day and step outside. Your focus and mood follow.`,
    `Can't sleep? 🌙 Dim screens an hour before bed, keep a regular bedtime and try slow breathing. If it continues, talk to a health professional.`
  ]);

  add('tech', /\b(phone (slow|storage|battery)|storage full|battery|laptop (slow|tips)|wifi|password|cyber|scam)\b/, [
    `Tech tip 📱 Restart, update, and clear what you don't use. For safety: use strong unique passwords and never share codes or PINs with anyone.`,
    `Scam alert 🚨 If a message promises quick money or asks for your code, it's a scam. Check with someone you trust first.`
  ]);

  add('confidence', /\b(confidence|shy|nervous|public speaking|self esteem|afraid|scared of)\b/, [
    `Confidence is built, not born 🌱 Prepare, start small, and treat each try as practice. Everyone feels nervous before something that matters.`,
    `Before speaking: breathe slowly, plant your feet, and focus on helping your listeners, not on being judged 🎤`
  ]);

  add('sad', /\b(sad|depressed|lonely|stress\w*|tired|upset|cry\w*|hurt|bad day|anxious)\b/, [
    `I'm sorry you're feeling like this 💜 Want to talk about it? Even a small step like a walk, some music or talking to someone you trust can help.`,
    `Hard days pass 🌤️ You're stronger than you think. Put on a good song and take a deep breath.`,
    `It's okay to have a heavy day. Drink some water, breathe slowly, and be gentle with yourself 🌿 If it feels too heavy, please talk to someone you trust.`
  ]);

  add('motivation', /\b(motivat\w*|advice|inspire me|tips|encourage\w*|success|hustle)\b/, [
    `Small steps every day beat big plans never started 💪`,
    `Kevin's mindset: learn, create, grow 🌱 Do a little today that your future self will thank you for.`,
    `Don't compare your chapter one to someone else's chapter twenty ✨`,
    `Your dream doesn't have a deadline, but your effort needs a start date 🚀`,
    `Progress, not perfection 🌱 Even a 1% improvement a day adds up.`,
    `Rest is part of the work. Take a break, then come back stronger 💪`
  ]);

  /* ----- Small talk ----- */
  add('botfeelings', /\b(do you (sleep|eat|dream|feel|get tired|have feelings|have friends)|are you alive|can you feel)\b/, [
    `I'm a bot 🤖 so I don't sleep or eat, but I do enjoy a good chat!`,
    `No dreams here, just code and good vibes ✦ But I'm always happy to talk.`
  ]);

  add('whatdoing', /\b(what are you doing|what r u doing|what you doing|wyd)\b/, [
    `Waiting for your next question 😄 What would you like to know?`,
    `Just hanging out on the K VIBZ website 🎧 What about you?`
  ]);

  add('friends', /\b(be (my )?friends?|can we be friends|wanna be friends|you are my friend|you're my friend|besto|bestie)\b/, [
    `Of course 💜 Friends are always welcome here!`,
    `Aww yes 🤝 I'm happy to chat with you anytime.`
  ]);

  add('confused', /\b(i don'?t understand|what do you mean|you('re| are) confusing|that'?s not what i asked|wrong answer)\b/, [
    `Sorry about that 🙏 Let me try again. Could you say it in a different way?`,
    `My bad 😅 Try a shorter question like "Who is Kevin?" or "Music tips".`
  ]);

  add('smart', /\b(you('re| are) (so |very )?(smart|clever|intelligent|helpful)|good bot|nice bot|best bot)\b/, [
    `Thank you 💜 I'll keep trying my best!`,
    `You're kind 😄 Ask me something else and I'll do my best.`
  ]);

  add('idk', /^(idk|i don'?t know|dunno|nothing|nvm|never ?mind|just (asking|curious))$/, [
    `No problem 😊 Want a joke, a fun fact, a riddle or music tips?`,
    `All good! Say "joke", "fun fact" or "riddle" and we'll have some fun 🎧`
  ]);

  add('language', /\b(kinyarwanda|french|swahili|language|speak)\b/, [
    `I chat in English here, with a few Kinyarwanda greetings 😄 Muraho!`,
    `Kevin studies literature in English, so words matter to him 📖`
  ]);

  add('hobbies', /\b(hobb\w*|free time|weekend|passion|interests?)\b/, [
    `Music, hairdressing, learning and creating, that's the K VIBZ world 💜`,
    `When he's not studying, Kevin is usually into music or practising his hair skills 🎧✂️`
  ]);

  add('favourites', /\b(favou?rite (food|color|colour|movie|film|game|sport|team|place|animal)|food|eat|colour|color|movie)\b/, [
    `Good one 😄 I don't have that on file. Ask Kevin directly through the <a href="contact.html">Contact page</a>.`,
    `That's a secret only Kevin knows 🤫 Send him a message and ask!`
  ]);

  add('help', /\b(help|what can (you|i) (do|ask)|what do you know|what (should|can) i ask|your (features|abilities)|how can you help|how does this work|options|menu|commands)\b/, [
    `Here's what I can chat about 😄 <br>🎧 Kevin, music and piano <br>✂️ Hairdressing <br>📚 School and study tips <br>🇷🇼 Rwanda and Kinyarwanda <br>💘 Dating and relationship advice <br>😂 Jokes, riddles and fun facts <br>📩 Booking and contact <br>🧠 Teach me new answers!`,
    `Try: "Who is Kevin?", "Tell me a joke", "Is he single?", "How can I book?" or "Fun fact" 🎧`
  ]);

  /* ----- Polite basics ----- */
  add('howareyou', /\b(how are you|how r u|how are u|how's it going|what's up|wassup|whats up|how do you do|how is life)\b/, [
    `I'm doing great, thanks for asking 😄 How about you?`,
    `Feeling good, full of K VIBZ energy ✦ What about you, {name}?`,
    `All good over here 🎧 How's your day going?`
  ]);

  add('hello', /\b(hi|hello|hey|hola|yo|sup|mambo|muraho|bite|amakuru|niaje|good (morning|afternoon|evening))\b/, [
    `Hey {name}! 👋 Welcome to K VIBZ. What would you like to know?`,
    `Hello {name}! 😄 Ask me about music, hair, school, or just chat.`,
    `Muraho! 🇷🇼 Great to see you. How can I help?`,
    `Hi {name} 💜 I'm the K VIBZ assistant. Ready when you are!`,
    `Mwiriwe! 🌇 Welcome to K VIBZ. What can I help you with?`
  ]);

  add('thanks', /\b(thanks|thank you|thx|murakoze|appreciate)\b/, [
    `You're welcome! 💜`,
    `Anytime 😊 Anything else?`,
    `My pleasure! Ask away if you need more 🎧`,
    `Glad I could help, {name} 🎧`
  ]);

  add('compliment', /\b(nice|great|amazing|awesome|cool|love (it|this|your|the)|good (job|work)|impressive|well done|congrat\w*|proud)\b/, [
    `Thank you so much! 🙏 Kevin will be glad to hear that.`,
    `That means a lot 💜 Anything else you'd like to see?`,
    `Appreciated! 🔥 Have you checked the <a href="portfolio.html">Portfolio</a> yet?`
  ]);

  add('sorry', /\b(sorry|apolog\w*|my bad)\b/, [
    `No worries at all 💜 We're good!`,
    `All good 😊 Let's keep the vibes positive.`
  ]);

  add('bye', /\b(bye|goodbye|see you|cya|gotta go|good night|goodnight|ciao|murabeho)\b/, [
    `Bye {name}! 👋 Come back anytime.`,
    `Take care 💜 Keep creating!`,
    `Murabeho! 🇷🇼 Thanks for visiting K VIBZ.`
  ]);

  const fallbacks = [
    `Interesting! 😄 I'm still learning. Try asking about Kevin's music, skills, school or contact info.`,
    `Hmm, I don't have an answer for that yet. But you can ask Kevin directly on <a href="contact.html">the Contact page</a>.`,
    `Good question! Try music, hairdressing, goals, or say "joke" 😎`,
    `I didn't quite get that 🤔 Could you say it differently?`,
    `That one's beyond me, but I'm great at talking about Kevin, music and fun facts 🎧`,
    `I'm not sure I understood 🙈 Try short questions like "Who is Kevin?", "Music tips" or "Study tips".`,
    `Let's try another angle 😄 Ask about Kevin's skills, his portfolio, or say "riddle".`,
    `Good thinking 💡 I don't have the answer, but Kevin might. Try the <a href="contact.html">Contact page</a>.`,
    `Hmm, that's outside my playlist 🎶 Want music tips, hair tips or study tips instead?`,
    `Say "help" and I'll show you everything I can talk about 📋`
  ];

  /* ---------- 6. THE REPLY ENGINE ---------- */
  const CONTACT_TOPICS = ['booking', 'business', 'contact'];

  function respond(raw) {
    raw = String(raw);
    const clean = raw.toLowerCase().replace(/[\u2018\u2019\u02bc]/g, "'").replace(/\s+/g, ' ').trim();
    const bare = clean.replace(/[.!?,;:\s]+$/, '');

    if (!bare) return `I'm listening 😄 Type something and I'll answer!`;

    // 0. Commands (/admin, /answer, /export, /forget, /privacy)
    if (bare.charAt(0) === '/') {
      const out = command(raw);
      if (out) return out;
    }

    // 1. Teaching flow (the visitor is giving me an answer)
    if (state.stage === 'offer') {
      if (/^(teach|teach you|teach me|yes|yeah|yep|sure|ok|okay)$/.test(bare)) {
        state.stage = 'answer';
        return `Great 🧠 Type the answer I should give for: <b>"${esc(state.pending)}"</b> (or say "cancel").`;
      }
      state.stage = null;
    } else if (state.stage === 'answer') {
      const q = state.pending;
      state.stage = null; state.pending = '';
      if (/^(cancel|stop|never ?mind|no|skip)$/.test(bare)) return `No problem 😊 Maybe next time.`;
      teach(q, redact(raw.trim()));
      return `Thank you! 💜 I've learned that. Ask me again, even in different words, and I'll remember.`;
    }

    // 2. Safety first
    if (crisisRe.test(bare)) return CRISIS;

    if (selfTalkRe.test(bare)) {
      return `Please be kind to yourself 💜 You're learning and growing, and that takes time. Want to talk about it, or hear something fun to lift your mood?`;
    }

    // 3. Rude words
    if (insultRe.test(bare)) {
      const level = Math.min(state.insults, insultReplies.length - 1);
      state.insults++;
      state.ctx = null; state.followUp = null;
      return next('insult' + level, insultReplies[level]);
    }

    // 4. Answers Kevin approved or the visitor taught (only for real questions)
    if (!/^(ok|okay|yes|no|hi|hello|hey|thanks|bye)$/.test(bare)) {
      const learned = findLearned(raw);
      if (learned) { state.last = 'learned'; return learned; }
    }

    // 5. First matching topic
    for (let i = 0; i < topics.length; i++) {
      const t = topics[i];
      const m = bare.match(t.re);
      if (!m) continue;

      let res = t.o.fn ? t.o.fn(m, bare) : next(t.id, t.r);
      if (!res) continue;
      res = fill(res);

      if (CONTACT_TOPICS.indexOf(t.id) !== -1 && res.indexOf('href=') === -1) {
        res = res.replace(/\s+$/, '') + ' ' + contactHTML();
      }
      if (t.id === 'sorry' || t.id === 'thanks') state.insults = 0;

      state.last = t.id;
      if (!t.o.keep) {
        state.ctx = t.o.more ? { id: t.id, more: t.o.more.slice() } : null;
        state.followUp = t.o.follow || null;
      }
      return res;
    }

    // 6. Nothing matched: remember the question and offer to be taught
    state.last = null; state.ctx = null; state.followUp = null;
    const text = redact(raw.trim());
    if (words(text).length >= 2) {
      logUnanswered(text);
      state.stage = 'offer';
      state.pending = text.slice(0, 120);
      return fill(next('fallback', fallbacks)) + `<br>🧠 I saved that question so I can learn it. Want to teach me the answer? Reply <b>teach</b>.`;
    }
    return fill(next('fallback', fallbacks));
  }

  /* ---------- 7. THE CHAT WINDOW ---------- */
  const CHIPS = [
    { label: 'Who is Kevin?', text: 'who is kevin' },
    { label: '🎧 Music tips', text: 'music tips' },
    { label: '✂️ Hair tips', text: 'hair tips' },
    { label: '💪 Skills', text: 'what skills does kevin have' },
    { label: '😂 Joke', text: 'tell me a joke' },
    { label: '🧠 How do you learn?', text: 'how do you learn' },
    { label: '📩 Contact', text: 'how can i contact kevin' }
  ];

  function initUI() {
    const root = document.createElement('div');
    root.className = 'kv-chat';
    root.innerHTML =
      '<button class="kv-fab" type="button" aria-label="Open chat" aria-expanded="false">💬<span class="kv-fab-ping"></span></button>' +
      '<section class="kv-panel" role="dialog" aria-label="K VIBZ assistant">' +
        '<header class="kv-head">' +
          '<div class="kv-avatar">K</div>' +
          '<div class="kv-title"><strong>K VIBZ Assistant</strong><span><i class="kv-online"></i> Online</span></div>' +
          '<button class="kv-close" type="button" aria-label="Close chat">✕</button>' +
        '</header>' +
        '<div class="kv-messages" aria-live="polite"></div>' +
        '<div class="kv-chips"></div>' +
        '<form class="kv-form" autocomplete="off">' +
          '<input class="kv-input" type="text" placeholder="Type a message..." maxlength="300" aria-label="Your message">' +
          '<button class="kv-send" type="submit" aria-label="Send">➤</button>' +
        '</form>' +
      '</section>';
    document.body.appendChild(root);

    const fab = root.querySelector('.kv-fab');
    const panel = root.querySelector('.kv-panel');
    const closeBtn = root.querySelector('.kv-close');
    const box = root.querySelector('.kv-messages');
    const chips = root.querySelector('.kv-chips');
    const form = root.querySelector('.kv-form');
    const input = root.querySelector('.kv-input');
    let greeted = false;

    const scrollDown = () => { box.scrollTop = box.scrollHeight; };

    function addMessage(content, who) {
      const div = document.createElement('div');
      div.className = 'kv-msg ' + (who === 'user' ? 'kv-user' : 'kv-bot');
      if (who === 'user') div.textContent = content;   // visitor text is never run as HTML
      else div.innerHTML = content;
      box.appendChild(div);
      scrollDown();
    }

    function send(text) {
      text = String(text || '').trim();
      if (!text) return;
      addMessage(text, 'user');
      input.value = '';

      const typing = document.createElement('div');
      typing.className = 'kv-typing';
      typing.innerHTML = '<i></i><i></i><i></i>';
      box.appendChild(typing);
      scrollDown();

      const answer = respond(text);
      setTimeout(function () {
        typing.remove();
        addMessage(answer, 'bot');
      }, 450 + Math.min(900, answer.length * 6));
    }

    function openChat() {
      root.classList.add('is-open');
      panel.classList.add('open');
      fab.setAttribute('aria-expanded', 'true');
      fab.setAttribute('aria-label', 'Close chat');
      if (!greeted) {
        greeted = true;
        setTimeout(function () {
          addMessage(mem.name
            ? 'Welcome back, ' + esc(mem.name) + '! 👋 What would you like to know today?'
            : `Hi! 👋 I'm the K VIBZ assistant. Ask me about Kevin, music, hairdressing, skills, or just chat. I learn from the questions I miss (type <b>/privacy</b> for details). Tap a topic below to start.`, 'bot');
        }, 250);
      }
      setTimeout(function () { input.focus(); }, 50);
    }

    function closeChat() {
      root.classList.remove('is-open');
      panel.classList.remove('open');
      fab.setAttribute('aria-expanded', 'false');
      fab.setAttribute('aria-label', 'Open chat');
    }

    CHIPS.forEach(function (c) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kv-chip';
      b.textContent = c.label;
      b.addEventListener('click', function () { send(c.text); });
      chips.appendChild(b);
    });

    fab.addEventListener('click', function () { panel.classList.contains('open') ? closeChat() : openChat(); });
    closeBtn.addEventListener('click', closeChat);
    form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeChat();
    });
  }

  // For testing in the browser console:  KVChat.reply('hello')
  // Add answers from other files:        KVChat.known('question', 'answer')
  window.KVChat = {
    reply: respond,
    add: add,
    extend: extend,
    known: function (q, a) { KNOWN.push([q, a]); },
    stats: function () { return { unanswered: mem.asked.length, taught: mem.taught.length }; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI);
  else initUI();
})();