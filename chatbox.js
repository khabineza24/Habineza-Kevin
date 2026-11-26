/* ==========================================
   K VIBZ — CHAT BOX (all pages)
   Needs chatbox.css too. On every page:
   <link rel="stylesheet" href="chatbox.css">      (in the <head>)
   <script src="script.js"></script>               (before </body>)
   <script src="chatbox.js"></script>              (right after script.js)
========================================== */

/* ==========================================================
   K VIBZ CHAT BUBBLE  (appears on every page)
   Edit the details below, nothing else is needed.
========================================================== */
(function () {
  'use strict';

  /* ---------- 1. YOUR DETAILS ---------- */
  const BIRTH = new Date(2007, 8, 7);           // 7 Sept 2007
  // Your contact details now live in config.js (so you only type them once)
  const CONTACT = Object.assign(
    { whatsapp: '', email: '', instagram: '' },
    window.KV_CONFIG || {}
  );

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
    if (CONTACT.email) p.push(`<a href="mailto:${CONTACT.email}">${CONTACT.email}</a>`);
    if (CONTACT.instagram) p.push(`<a href="https://instagram.com/${CONTACT.instagram.replace('@', '')}" target="_blank" rel="noopener">Instagram</a>`);
    p.push('<a href="contact.html">the Contact page</a>');
    return p.join(' · ');
  };

  /* ---------- 2. HELPERS ---------- */
  const state = {
    userName: '',     // visitor's name, if they tell us
    last: null,       // id of the last topic
    ctx: null,        // extra answers for "tell me more"
    followUp: null,   // what happens if the visitor says "yes"
    riddle: null,     // answer to the current riddle
    insults: 0,
    bags: {}
  };
  const rand = n => Math.floor(Math.random() * n);

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

  const fill = s => s.replace(/\{name\}/g, state.userName || 'friend');

  /* ---------- 3. REPLIES TO RUDE WORDS (3 levels) ---------- */
  const insultReplies = [
    [
      'Haha, that came out strong 😄 but I\'ll keep my cool. Is something bothering you? I\'m happy to help.',
      'Ouch 😅 I\'m just a bot with good vibes. Let\'s start fresh. What would you like to know?',
      'No stress, I won\'t take it personally 💜 Let\'s keep it friendly though.'
    ],
    [
      'Let\'s keep it respectful please 🙏 I\'m here to help, not to fight.',
      'Bad days happen, but insults won\'t get us anywhere. Ask me something real and I\'ll gladly answer 😊',
      'Easy now 😌 I don\'t reply to rude words, but I\'m still here if you want to chat properly.'
    ],
    [
      'I\'ll stay polite, but I won\'t continue while we\'re being insulted. When you\'re ready to chat nicely, I\'m right here 🤝',
      'Okay, I\'m pausing on this one 🛑 Respect first, then we can talk music, hair or anything else.'
    ]
  ];

  const insultRe = /\b(stupid|idiot|idiots|dumb|useless|moron|loser|shut ?up|fool|ugly|trash|garbage|rubbish|hate you|you suck|bastard|bitch|fuck|fucking|fck|shit|asshole|crap)\b/;
  const selfTalkRe = /\bi('m| am| feel)( so| really)? (stupid|dumb|useless|ugly|a loser|worthless)\b/;

  /* ---------- 4. TOPICS ---------- */
  // T(id, regex, [replies], optionalFunction, options)
  const topics = [];
  const T = (id, re, r, fn, opts) => topics.push({ id, re, r, fn, opts: opts || {} });

  // kvAdd(id, regex, [replies], [moreAnswers], followUpFunction)
  const kvAdd = (id, re, replies, more, follow) => T(id, re, replies, null, { more, follow });

  // Adds extra answers to a topic that already exists
  const kvExtend = (id, extra) => {
    const t = topics.find(x => x.id === id);
    if (t && Array.isArray(t.r)) t.r.push(...extra);
  };

  /* ----- Safety first (must stay at the top) ----- */
  T('crisis', /\b(kill myself|suicide|end my life|want to die|self harm|hurt myself)\b/, [
    'I\'m really sorry you\'re feeling this way 💜 You matter. Please talk to someone you trust right now, like a family member, friend, teacher or counsellor, or contact your local emergency services. You don\'t have to carry this alone.'
  ]);

  T('sexual', /\b(nudes?|sex|naked|horny)\b/, [
    'Let\'s keep it respectful 🙏 I can\'t chat about that. Ask me about music, hair or even dating in a decent way 😊',
    'Not that kind of chat 😅 Try me with music, school, hairdressing or a joke instead.'
  ]);

  /* ----- Short reactions that remember what we were talking about ----- */
  T('ack', /^(ok|okay|k|hmm+|yes|yeah|yep|yup|no|nope|nah|cool|nice|alright|sure|lol|lmao|haha+|hehe+|wow|oh|ah|true|fine|right|i see|really|please)$/, [
    'Haha 😄 What else would you like to know?',
    'Cool 👌 Ask me anything: music, hair, school, or even dating 😉',
    'Alright! I\'m all ears 🎧',
    'Want a joke, a fun fact, or to know more about Kevin?',
    'I\'m here whenever you\'re ready 💜 What\'s next?'
  ], (m) => {
    const word = m[0];
    if (state.followUp && /^(yes|yeah|yep|yup|sure|ok|okay|alright|please)$/.test(word)) {
      const go = state.followUp;
      state.followUp = null;
      return go();
    }
    if (state.followUp && /^(no|nope|nah)$/.test(word)) {
      state.followUp = null;
      return 'No problem 😊 What would you like to talk about instead?';
    }
    return fill(next('ack', topics.find(t => t.id === 'ack').r));
  }, { keep: true });

  T('more', /^(more|tell me more|go on|continue|and|why|how come|explain|and then|what else)$/, null, () => {
    const c = state.ctx;
    if (c && c.more && c.more.length) return c.more.shift();
    return 'That\'s everything I have on that one 😄 Try "joke", "fun fact", "riddle", "music tips", "study tips" or "hair tips".';
  }, { keep: true });

  T('answer', /^(answer|the answer|i give up|give up|tell me the answer|what'?s the answer|what is the answer)$/, null, () => {
    if (state.riddle) {
      const a = state.riddle;
      state.riddle = null;
      return a;
    }
    return 'Answer to what? 😄 Ask me for a "riddle" first!';
  }, { keep: true });

  T('name', /\b(?:my name is|call me|they call me)\s+([a-z]+)/, null, m => {
    state.userName = m[1].charAt(0).toUpperCase() + m[1].slice(1);
    return `Nice to meet you, ${state.userName}! 😄 Ask me anything about Kevin, or just chat.`;
  });


  /* ----- Handy things ----- */
  
  kvAdd('datetime', /\b(what('?s| is) (the )?(date|day|time)|what time is it|today'?s date|current time)\b/, [
    () => {
      const d = new Date();
      return `Today is ${d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} 📅 and it\'s ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on your device.`;
    }
  ]);
  
  kvAdd('capabilities', /\b(what can (you|i) (do|ask)|what do you know|what (should|can) i ask|your (features|abilities)|how can you help)\b/, [
    `Here\'s what I can chat about 😄 <br>🎧 Kevin, music and piano <br>✂️ Hairdressing <br>📚 School and study tips <br>🇷🇼 Rwanda and Kinyarwanda <br>😂 Jokes, riddles and fun facts <br>📩 Booking and contact`,
    `Ask me about Kevin, his skills, music tips, hair tips, study tips, Rwanda, or say "riddle" or "joke" 🎶`
  ]);
  
  /* ----- Games ----- */
  
  const kvRiddles = [
    ['What has hands but can\'t clap? 🤔', 'A clock! 🕐'],
    ['I speak without a mouth and hear without ears. What am I? 🤔', 'An echo! 🔊'],
    ['What has to be broken before you can use it? 🤔', 'An egg! 🥚'],
    ['The more you take, the more you leave behind. What am I? 🤔', 'Footsteps! 👣'],
    ['What has a neck but no head? 🤔', 'A bottle! 🍾'],
    ['What has many keys but can\'t open a single door? 🤔', 'A piano! 🎹'],
    ['What can travel around the world while staying in one corner? 🤔', 'A stamp! 📮']
  ];
  
  kvAdd('riddle', /\b(riddle|riddles|brain ?teaser|puzzle)\b/,
    kvRiddles.map(([q, a]) => () => {
      state.riddle = a + ' Did you get it? Want another riddle?';
      return q + ' (Say "answer" when you give up 😄)';
    }),
    null,
    () => {
      const [q, a] = kvRiddles[rand(kvRiddles.length)];
      state.riddle = a + ' Another one?';
      return q + ' (Say "answer" to see it)';
    }
  );
  
  /* ----- Music knowledge ----- */
  
  kvAdd('logicpro', /\b(logic ?pro|logic|daw|digital audio workstation)\b/, [
    `Logic Pro is Apple\'s music production software 🎛️ It\'s a DAW (digital audio workstation) where you record, arrange, edit and mix. Kevin is learning to arrange and produce music with it.`,
    `A DAW is the "studio on your computer" 💻 Kevin uses Logic Pro to build beats, layer sounds and shape his ideas into songs.`
  ], [
    `Inside Logic Pro you can use virtual instruments, drum machines, loops and effects. It\'s a great place to practise arrangement 🎹`,
    `Want to learn it yourself? Start small: make a 4-bar loop with drums, bass and chords, then build from there 🔁`
  ]);
  
  kvAdd('afrobeat', /\b(afro ?beats?|afro ?kompa|kompa|compas|music styles?|genres?)\b/, [
    `Kevin\'s interests include Afrobeat and Afro-kompa 🎶 Afrobeats is the modern African pop sound, full of groove, percussion and catchy melodies.`,
    `Afrobeat and Afro-kompa are part of Kevin\'s sound 🥁 Kompa is a smooth, danceable style from Haiti, and Afro-kompa mixes African and kompa feeling.`
  ], [
    `Quick note: Afrobeat (no "s") started with Fela Kuti, while Afrobeats (with "s") is today\'s pop sound from artists like Burna Boy, Rema and Davido 🎤`,
    `Both styles are built on rhythm first: drums, percussion and bass make you move 💃`
  ]);
  
  kvAdd('startmusic', /\b(how (do|can|to|should) (i |we )?(start|begin|learn|make|produce)( to)? (music|producing|production|beats?|a beat|songs?)|beginner.*(produc|beat)|learn music production)\b/, [
    `Great question 🎧 A simple start: <br>1️⃣ Pick one DAW (like Logic Pro) <br>2️⃣ Learn drums, bass and chords <br>3️⃣ Make a short 4-bar loop <br>4️⃣ Finish small ideas instead of perfecting one <br>5️⃣ Compare with songs you love`,
    `Start simple 💡 Open a DAW, make a drum pattern, add a bassline, then a chord or melody. Repeat it every day and you\'ll improve fast.`
  ], [
    `Tip: finish at least one small beat every week. Finished beats teach you more than ten unfinished ones 💪`,
    `Listen like a producer: what\'s the drum pattern, where does the bass enter, what changes in the chorus? 🎧`,
    `Tell Kevin what you\'re making on the <a href="contact.html">Contact page</a>, he loves talking about music!`
  ]);
  
  kvAdd('chords', /\b(chords?|scales?|melody|melodies|piano (lessons?|tips|practice|beginner)|how (to|do i) play (the )?piano)\b/, [
    `Piano starter pack 🎹 Learn the C major scale first (all white keys, no sharps or flats), then try the chords C, G, Am and F. That four-chord loop sounds like a hundred songs.`,
    `Practise slowly and keep it steady 🎹 A good beginner routine: scale, chords, then a short melody. Ten focused minutes beats an hour of rushing.`
  ], [
    `A chord is usually three notes played together. C major is C, E and G 🎶`,
    `A melody is the part you hum. Chords are the colour underneath it 🎨`
  ]);
  
  kvAdd('mixing', /\b(mix(ing)?|master(ing)?|eq|compress(ion|or)?|reverb|sound quality|clean sound)\b/, [
    `Mixing basics 🎚️ Balance the volumes first, use EQ to cut what you don\'t need, add a little compression for control, and use reverb gently so it doesn\'t get muddy.`,
    `A clean mix usually starts with good volume balance 🎧 Keep your master peaks below about −6 dB so there\'s room left for mastering.`
  ], [
    `Cut before you boost: removing a clashing frequency often sounds better than turning something else up ✂️`,
    `Always check your mix on different speakers: headphones, phone, and a speaker 🔊`
  ]);
  
  kvAdd('tempo', /\b(bpm|tempo|drums?|drum pattern|808|bassline|bass line|kick)\b/, [
    `Afrobeats often sits around 100 to 115 BPM 🥁 which is a groove you can dance to without rushing.`,
    `An 808 is a deep sub-bass or kick sound that comes from the Roland TR-808 drum machine 🔊 It\'s a big part of modern beats.`,
    `A solid beat starts with kick and snare, then hi-hats, then bass that locks in with the kick 🎶`
  ]);
  
  kvAdd('recommend', /\b(recommend|suggest).*(song|songs|music|artist|artists|playlist)|what should i listen to|new music\b/, [
    `Kevin\'s favourite singers are Rema and Davido 🎤 For more Afrobeats, try Burna Boy, Tems, Asake and Ayra Starr. For classic Afrobeat, Fela Kuti is a must.`,
    `Want Rwandan sounds? 🇷🇼 Try Bruce Melodie, Meddy, The Ben and Knowless Butera. Tell me what you like and I\'ll suggest more!`
  ], [
    `Tell me your mood: hype, chill, study or dance? 🎧 I\'ll point you to a style.`
  ]);
  
  kvAdd('lovemusic', /\bi (really |truly )?(love|like|enjoy) (music|beats?|afrobeats?|piano|singing|dancing|songs?|producing)\b/, [
    `Same energy 🎧 Music is the heart of K VIBZ. What kind do you like most?`,
    `Love that 💜 Do you make music yourself or mostly listen?`,
    `A music lover! 🎶 You and Kevin would get along. Want to see his <a href="portfolio.html">Portfolio</a>?`
  ]);
  
  /* ----- Rwanda ----- */
  
  kvAdd('rwanda', /\b(tell me about rwanda|about rwanda|rwanda facts?|visit rwanda|tourism|things to do in (rwanda|kigali)|rwandan (food|culture|dish|dishes)|food in rwanda|what to eat)\b/, [
    `Rwanda 🇷🇼 is called the "Land of a Thousand Hills". Popular places include Volcanoes National Park (mountain gorillas), Lake Kivu, Nyungwe Forest and Akagera National Park.`,
    `Rwandan food is tasty 😋 Try brochettes, isombe (cassava leaves), ubugari (ugali), ibitoke (plantains), and the local tea and coffee ☕`
  ], [
    `On the last Saturday of each month, Rwandans take part in Umuganda, community work that keeps neighbourhoods clean and strong 🤝`,
    `Kigali sits high up in the hills, so the weather is usually mild all year 🌤️`,
    `Rwanda\'s currency is the Rwandan franc (RWF) and its official languages are Kinyarwanda, English, French and Swahili.`
  ]);
  
  kvAdd('phrases', /\b(kinyarwanda (words?|phrases?|lessons?)|teach me (some )?kinyarwanda|how (do|to) (i )?say .* in kinyarwanda|common phrases)\b/, [
    `Kinyarwanda starter pack 🇷🇼 <br>👋 Muraho = Hello <br>🌅 Mwaramutse = Good morning <br>🙏 Murakoze = Thank you <br>✅ Yego = Yes <br>❌ Oya = No <br>👋 Murabeho = Goodbye`,
    `Try this chat 😄 "Amakuru?" (How are you?) and the reply "Ni meza" (I\'m fine).`
  ], [
    `Murakoze cyane = thank you very much 💜`,
    `Mwiriwe = good afternoon / good evening 🌇`
  ]);
  
  kvAdd('weather', /\b(weather|raining|rain today|is it sunny|how hot|how cold)\b/, [
    `I can\'t check live weather 🌤️ but Rwanda has a mild climate thanks to its altitude, with rainy seasons roughly from March to May and from October to December.`,
    `For today\'s weather, check a weather app 📱 I\'m better with music, hair and Rwanda facts!`
  ]);
  
  /* ----- School and study ----- */
  
  kvAdd('studytips', /\b(study (tips?|better|method|plan)|how (to|do i|can i) study|exams?|revision|revise|homework|focus|concentrat\w*|procrastinat\w*)\b/, [
    `Study smarter 📚 Try the Pomodoro method: study 25 minutes, rest 5 minutes, repeat. Then test yourself instead of just re-reading.`,
    `Good study habits 🧠 Sleep well, review notes the same day, practise recall, and explain what you learned out loud, like you\'re teaching a friend.`
  ], [
    `Active recall: close your book and write down everything you remember. The gaps show you what to study next ✍️`,
    `Spaced repetition: review after 1 day, 3 days, then a week. Your memory loves it 🔁`,
    `Music without lyrics can help you focus 🎧 Lo-fi or instrumental beats work well.`
  ]);
  
  kvAdd('essay', /\b(essay|writing tips?|how to write|paragraph|thesis|introduction|conclusion)\b/, [
    `Essay recipe ✍️ Start with a clear point, add evidence, explain how the evidence proves your point, then link back to the question. Teachers call it PEEL: Point, Evidence, Explain, Link.`,
    `A good essay has 3 parts: an introduction that answers the question, body paragraphs with evidence, and a conclusion that ties it together 📝`
  ], [
    `Write the introduction last. By then you know exactly what you\'re introducing 😉`,
    `Read your work out loud. If a sentence feels long, split it ✂️`
  ]);
  
  kvAdd('subjecthelp', /\bhow (do|can|to) (i |we )?(study|revise|learn|understand|get better at) (history|geography|literature)\b/, [
    `History 🏛️ Build timelines and ask "what caused this?" and "what changed afterwards?"`,
    `Geography 🗺️ Use maps, diagrams and real examples. Link physical features to how people live.`,
    `Literature 📖 For each text, note the characters, themes and a few key quotes, then explain the effect of the writer\'s choices.`
  ]);
  
  /* ----- Hairdressing ----- */
  
  kvAdd('hairtips', /\b(hair care|healthy hair|hair tips?|grow (my )?hair|hair growth|dry hair|protective styles?|natural hair|hair routine)\b/, [
    `Hair care basics 💈 Keep it moisturised, detangle gently, trim split ends, and limit heat. Protective styles can help reduce breakage.`,
    `Sleeping on a satin or silk pillowcase (or wearing a satin bonnet) helps reduce friction and dryness 🌙`
  ], [
    `Everyone\'s hair is different, so what works for one person may not work for another. A professional can check your hair type and scalp 💜`,
    `Drink water and eat well too. Healthy hair starts from the inside 🥗`,
    `Want to book a service? Message Kevin on the <a href="contact.html">Contact page</a> ✂️`
  ]);
  
  kvAdd('hairstyle', /\b(fade|taper|low cut|hair ?styles?|what (style|haircut)|which (style|haircut)|new look)\b/, [
    `Picking a style ✂️ Think about your hair type, face shape and how much time you want to spend on it. Bringing a reference photo makes things much easier.`,
    `Try this: save 2 or 3 photos of styles you like, and ask your hairdresser what suits your hair type 💈`
  ]);
  
  /* ----- Kevin and the site ----- */
  
  kvAdd('skills', /\b(what skills|his skills|list.*skills|strengths?|talents?|what can (he|kevin) do)\b/, [
    `Kevin\'s skill areas 💪 <br>🎧 Music production <br>🎹 Piano <br>✂️ Hairdressing <br>📚 Research and writing <br>🤝 Teamwork and leadership <br>✦ Creativity and problem-solving <br>See details on the <a href="skills.html">Skills</a> page.`
  ]);
  
  kvAdd('whyhire', /\bwhy (should|would) (i|we) (hire|work with|choose|pick|trust)\b/, [
    `Because Kevin is creative, responsible and always learning 💜 He values hard work, teamwork and finishing what he starts. See his <a href="portfolio.html">Portfolio</a>.`,
    `Kevin is still growing, and that means he\'s eager, open to feedback and serious about improving 🚀`
  ]);
  
  kvAdd('weakness', /\b(weakness|weaknesses|flaws?|what.*(needs?|want) to improve)\b/, [
    `Kevin is honest about it: he\'s still learning and building experience 🌱 That\'s why he practises daily and welcomes feedback.`,
    `His biggest focus is growth 💜 More practice, more projects, more experience.`
  ]);
  
  kvAdd('website', /\b(who (made|built|created|designed|coded) (this|the|your) (site|website|portfolio|page)|how (was|is) (this|the) (site|website|portfolio) (made|built)|built with|what language)\b/, [
    `This portfolio is handcrafted with HTML, CSS and JavaScript ✦ and I\'m the little chat helper inside it 🤖`,
    `Built with HTML, CSS and JavaScript, no heavy templates. Every animation here was designed for K VIBZ 🎨`
  ]);
  
  kvAdd('pages', /\b(which page|what pages|site ?map|navigate|where (can|do) i (find|see)|how do i (use|navigate) (this )?(site|website))\b/, [
    `Here\'s the map 🗺️ <br><a href="index.html">Welcome</a> · <a href="home.html">Home</a> · <a href="about.html">About</a> · <a href="skills.html">Skills</a> · <a href="portfolio.html">Portfolio</a> · <a href="contact.html">Contact</a>`
  ]);
  
  kvAdd('human', /\b(talk|speak|chat) (to|with) (a |the )?(real |actual )?(person|human|kevin)|real person\b/, [
    `Want the real Kevin? 💜 Send him a message on the <a href="contact.html">Contact page</a> and he\'ll reply when he can.`,
    `I\'m just the assistant 🤖 To reach Kevin himself, use the <a href="contact.html">Contact page</a>.`
  ]);
  
  kvAdd('feedback', /\b(feedback|suggestions?|report (a )?(bug|problem)|something (is )?(broken|not working)|not working)\b/, [
    `Thanks for letting us know 🙏 Please send the details to Kevin on the <a href="contact.html">Contact page</a> so he can fix it.`,
    `Feedback is welcome 💜 Tell Kevin what you\'d like to see improved, here: <a href="contact.html">Contact</a>.`
  ]);
  
  kvAdd('privacy', /\b(privacy|do you (remember|store|save|record)|is this (chat )?(private|safe))\b/, [
    `I only know what you type in this chat, like your name if you tell me 💜 Please don\'t share passwords or private details with me.`,
    `Good question 🔒 Keep personal information like passwords, ID numbers and addresses out of the chat.`
  ]);
  
  /* ----- Small talk ----- */
  
  kvAdd('botfeelings', /\b(do you (sleep|eat|dream|feel|get tired|have feelings|have friends)|are you alive|can you feel)\b/, [
    `I\'m a bot 🤖 so I don\'t sleep or eat, but I do enjoy a good chat!`,
    `No dreams here, just code and good vibes ✦ But I\'m always happy to talk.`,
    `I don\'t get tired, which is handy for a website assistant 😄`
  ]);
  
  kvAdd('whatdoing', /\b(what are you doing|what r u doing|what you doing|wyd)\b/, [
    `Waiting for your next question 😄 What would you like to know?`,
    `Just hanging out on the K VIBZ website 🎧 What about you?`
  ]);
  
  kvAdd('friends', /\b(be (my )?friends?|can we be friends|wanna be friends|you are my friend|you're my friend)\b/, [
    `Of course 💜 Friends are always welcome here!`,
    `Aww yes 🤝 I\'m happy to chat with you anytime.`
  ]);
  
  kvAdd('confused', /\b(i don'?t understand|what do you mean|you('re| are) confusing|that'?s not what i asked|wrong answer)\b/, [
    `Sorry about that 🙏 Let me try again. Could you say it in a different way?`,
    `My bad 😅 Try a shorter question like "Who is Kevin?" or "Music tips".`
  ]);
  
  kvAdd('smart', /\b(you('re| are) (so |very )?(smart|clever|intelligent|helpful)|good bot|nice bot|best bot)\b/, [
    `Thank you 💜 I\'ll keep trying my best!`,
    `You\'re kind 😄 Ask me something else and I\'ll do my best.`
  ]);
  
  kvAdd('idk', /^(idk|i don'?t know|dunno|nothing|nvm|never ?mind|just (asking|curious))$/, [
    `No problem 😊 Want a joke, a fun fact, a riddle or music tips?`,
    `All good! Say "joke", "fun fact" or "riddle" and we\'ll have some fun 🎧`
  ]);


  kvAdd('lovesite', /\b(i (really |truly )?(love|like|enjoy) (this|your|the|his) (site|website|portfolio|page|design|chat|bot)|(this|the) (site|website|portfolio) (is|looks) (so |very )?(nice|great|cool|amazing|awesome|beautiful|good))\b/, [
    'Thank you so much! 🙏 Kevin worked hard on it and will be glad to hear that.',
    'That means a lot 💜 Anything else you\'d like to explore? The <a href="portfolio.html">Portfolio</a> has more.',
    'Appreciated! 🔥 Tell Kevin directly on <a href="contact.html">the Contact page</a>, he\'d love to hear it.'
  ]);

  kvAdd('musictips', /\b((music|production|producer|beat|beats|piano) tips?|tips for (music|producing|making beats?)|production tips)\b/, [
    `Music tips 🎧 <br>1️⃣ Finish small ideas often <br>2️⃣ Learn drums, bass and chords first <br>3️⃣ Compare your track with songs you love <br>4️⃣ Take breaks so your ears stay fresh`,
    `Producer tips 🎛️ Start with the drums and bass, add chords, then keep the melody simple. Less is often more.`,
    `Piano and production tips 🎹 Practise slowly, learn a few chords, and record yourself so you can hear what to improve.`
  ], [
    `Want details? Ask me about "chords", "mixing", "BPM" or "how to start producing" 🎶`,
    `Tell Kevin what you\'re working on on the <a href="contact.html">Contact page</a>. He loves talking about music!`
  ]);

  /* ----- Dating & love ----- */
  T('askout', /\b(be my (girlfriend|boyfriend|man|boo)|date me|go out with me|want to date|wanna date|i like you|i love you|i want you|interested in you|can we date)\b/, [
    'Aww 😄 I\'m just a chat assistant, so I can\'t date. But Kevin is single and open to meeting someone. Want to say hi to him? You can reach him through <a href="contact.html">the Contact page</a>.',
    'That\'s sweet 💜 I\'m only a bot though! If you\'d like to talk to the real Kevin, send him a message and be yourself.',
    'Haha you\'re bold 😎 I\'ll pass that on in spirit. Kevin\'s the one to talk to, so leave him a message on the <a href="contact.html">Contact page</a>.'
  ]);

  T('imgirl', /\bi(?:'m| am) (?:a )?(girl|lady|woman|female)\b/, [
    'Nice to meet you! 💜 Kevin is single and looking for a girlfriend, so you picked a good page 😄 Tell me a bit about yourself. What do you love doing?',
    'Welcome! 😊 Kevin would love to hear from you. What\'s your vibe: music, movies, or long chats?',
    'Hey you 👋 Kevin is open to meeting someone special. Introduce yourself to me first and I\'ll point you to him!'
  ]);

  T('imguy', /\bi(?:'m| am) (?:a )?(boy|man|guy|male|dude|bro)\b/, [
    'Welcome, my friend 🤝 Kevin loves meeting new people, whether it\'s music, business or just good vibes. What brings you here?',
    'Nice one 😎 Are you here for music, hairdressing, or just to say hi?'
  ]);

  T('single', /\b(single|girlfriend|boyfriend|relationship|dating|crush|married|love life)\b/, [
    'Kevin is single 😄 and he\'s looking for a girlfriend. Interested? Say hi on <a href="contact.html">the Contact page</a>.',
    'Relationship status: single and focused 🎶 but open to meeting someone special. The right person might be you 😉',
    'Yes, Kevin is single right now. He\'s busy with music, hair and school, but he\'s open to a good connection.',
    'Single, yes ✅ Looking for a real connection, not games. Want to leave him a message?'
  ]);

  T('type', /\b(what (kind|type) of (girl|woman|lady)|ideal (girl|woman)|your type|looking for|searching for)\b/, [
    'Kevin hasn\'t written a checklist 😄 The best way to find out is to talk to him. Be honest, be kind and be yourself.',
    'Good question! Kevin would say the vibe matters most. Tell me a little about you and I\'ll see how you match 😉',
    'No fixed type, just a good heart and good energy 💜 Why not message him and find out?'
  ]);

  T('flirt', /\b(cute|handsome|gorgeous|attractive|good looking|charming|beautiful)\b/, [
    'Aww thank you 😊 I\'ll tell Kevin you said that!',
    'Haha you\'re making me blush (if bots could blush) 😄',
    'Compliments accepted 💜 Want to chat with the real Kevin? Try <a href="contact.html">the Contact page</a>.'
  ]);

  /* ----- About Kevin ----- */
  T('myname', /\b(your name|what is your name|what's your name|real name|full name)\b/, [
    'The name is Habineza Kevin, but in music everyone knows him as K VIBZ 🎶'
  ]);

  T('bot', /\b(who are you|what are you|are you (a )?(bot|robot|ai|real|human)|are you kevin)\b/, [
    'I\'m the K VIBZ assistant 🤖, a chat helper built to answer questions about Kevin, his music, skills and more.',
    'I\'m not Kevin himself. I\'m his website assistant! I know a lot about him though 😄',
    'Just a friendly bot living on this website 💜 I can chat about Kevin, music, hairdressing, or just vibe with you.'
  ]);

  T('kvibz', /\b(k vibz|kvibz|stage name|vibz)\b/, [
    'K VIBZ is Kevin\'s stage name, the name people know him by in music 🎧',
    'K VIBZ = the music side of Habineza Kevin. Beats, sound and creativity with no limits ✦'
  ]);

  T('about', /\b(who is (kevin|he)|about (kevin|him)|tell me about (him|kevin|yourself)|introduce|describe)\b/, [
    'Kevin (Habineza Kevin, aka K VIBZ) is a Rwandan music producer, hairdressing trainee and student who studies history, geography and literature in English. Creative, curious and always learning 🎶',
    'Think music + style + books 📚🎧✂️ Kevin produces music, does hairdressing and studies history, geography and literature.',
    'Short version: Rwandan, creative, ambitious. He wants a future in music production or hairdressing, and he\'s working hard for it.'
  ]);

  T('age', /\b(how old|age|years old)\b/, [
    () => `Kevin is ${age()} years old 🎂`,
    () => `He's ${age()}, young, creative and just getting started 🚀`
  ]);

  T('location', /\b(where (are|is) (you|he|kevin|k vibz)|where (do|does) (you|he|kevin) (live|come)|where (were|was) (you|he) born|hometown|born in|(you|he|kevin) (are|is) from|where.*from)\b/, [
    'Kevin is Rwandan 🇷🇼. His family is from Rwamagana, and he was born in Kigali (Kicukiro).',
    'Proudly Rwandan 🇷🇼 Born in Kicukiro, Kigali, with roots in Rwamagana.',
    'Kigali-born, Rwamagana-rooted, Rwanda forever 🇷🇼'
  ]);

  T('birthday', /\b(birthday|born|date of birth|dob|when were you born)\b/, [
    'Kevin\'s birthday is on 7 September 🎂 Mark your calendar!',
    'He was born on 7 September, in Kigali (Kicukiro) 🎉'
  ]);

  T('school', /\b(school|agahozo|shalom|asyv|youth village|campus)\b/, [
    'Kevin is a student at Agahozo Shalom Youth Village 🎓',
    'He studies at Agahozo Shalom Youth Village, where he learns, creates and grows.'
  ]);

  T('graduation', /\b(graduat\w*|2027|finish school|after school)\b/, [
    'Kevin graduates in 2027 🎓 and after that, the plan is to go big in music production or hairdressing.',
    '2027 is the year! Graduation first, then full focus on the dream 🚀'
  ]);

  T('studies', /\b(study|studies|subject|subjects|history|geography|literature|course|combination|student|academic|education)\b/, [
    'Kevin studies history, geography and literature in English 📚 A great mix for understanding people, places and stories.',
    'History teaches him where we come from, geography shows him the world, and literature gives him the words. That\'s his academic side 📖',
    'Academically it\'s history, geography and literature. Practically it\'s hairdressing. Creatively it\'s music. Busy guy 😄'
  ]);

  T('ambition', /\b(ambition|goal|goals|dream|dreams|future|plan|plans|career|want to be|become)\b/, [
    'Kevin\'s ambition is to build a career in music production or hairdressing, or both! 🎧✂️',
    'The dream: turning his creativity into a real career. Music production and hairdressing are both on the table.',
    'Big dreams, steady steps 💜 He\'s learning now so he can create more later.'
  ]);

  T('family', /\b(family|mother|mom|mum|mama|father|dad|parents?|brother|sister|siblings?|adam|dafin|florence)\b/, [
    'Family matters to Kevin 💜 He has two siblings, Adam and Dafin, and his mother is Florence.',
    'Kevin\'s mum is Florence, and his siblings are Adam and Dafin. A close circle!',
    'Two siblings (Adam and Dafin) and a mother named Florence. Family comes first 💜'
  ]);

  /* ----- Music ----- */
  T('artists', /\b(favou?rite (singer|artist|musician)|rema|davido|davis d|who (inspires|inspired)|idol|who do you listen)\b/, [
    'Kevin\'s favourite singers are Rema and Davido 🎤 You can hear that Afrobeats energy in his taste.',
    'Rema and Davido are on top of his list 🔥 Who\'s yours?',
    'Big fan of Rema and Davido 🎧 Tell me your favourite artist!'
  ]);

  T('collab', /\b(collab\w*|feature|work together|studio session|record\w*|make me a beat|produce for me)\b/, [
    'Collabs are welcome 🎶 Tell Kevin what you have in mind through <a href="contact.html">the Contact page</a>.',
    'Looking for a producer? 🎧 Send Kevin your idea: genre, vibe, and what you want to achieve.',
    'Great things start with a conversation. Reach out here: <a href="contact.html">Contact</a> and let\'s create 🔥'
  ]);

  T('piano', /\b(piano|keyboard|keys|instrument)\b/, [
    'Yes, Kevin plays the piano 🎹 It\'s part of his music foundation.',
    'Piano is part of his sound 🎹 Melodies come first, then the beats.',
    'Keys and creativity 🎹 You can see more on the <a href="skills.html">Skills</a> page.'
  ]);

  T('music', /\b(music|produc\w*|beat|beats|song|songs|studio|rapper|rap|singer|album|track|tracks|instrumental)\b/, [
    'Music is Kevin\'s heart 🎧 He produces beats and sound under the name K VIBZ. Check the <a href="portfolio.html">Portfolio</a>.',
    'K VIBZ = music production, creativity and good vibes ✦ Want to know about his favourite artists?',
    'Beats, melodies, ideas turned into sound 🎶 That\'s the K VIBZ way.',
    'Kevin is a music producer, and he\'s still growing every day. Want to collaborate? Just ask!'
  ]);

  /* ----- Hairdressing & business (contact links are added automatically) ----- */
  T('booking', /\b(book\w*|appointment|price|prices|pricing|cost|how much|services?)\b/, [
    'For bookings or prices, the best way is to message Kevin directly:',
    'Pricing depends on the service 💈 Send Kevin a message and he\'ll give you details:',
    'Want to book a hair service or a music session? Contact Kevin here:'
  ]);

  T('hair', /\b(hair\w*|salon|barber|braid\w*|haircut|styling|locs|weave|wig)\b/, [
    'Kevin is training in hairdressing ✂️ It\'s his practical skill and one of his career dreams.',
    'Hair is art too 💈 Kevin learns, practises and improves with every client.',
    'Hairdressing is his hands-on side ✂️ See more on the <a href="skills.html">Skills</a> page.'
  ]);

  T('business', /\b(business|hire|hiring|job|work with you|proposal|sponsor\w*|brand|deal|invest\w*|opportunit\w*|gig|event|perform\w*)\b/, [
    'For business, collaborations or opportunities, Kevin is open to serious conversations 💼 Contact him here:',
    'Professional enquiries are welcome 🤝 Send a clear message about what you need, the timeline and your budget, and Kevin will respond:',
    'Thanks for your interest 💼 Share the details with Kevin directly:'
  ]);

  T('portfolio', /\b(portfolio|website|site|projects?|samples?|your work|his work|show me)\b/, [
    'You can see Kevin\'s projects on the <a href="portfolio.html">Portfolio</a> page 🎨',
    'Everything he\'s created is in the <a href="portfolio.html">Portfolio</a>. Take your time!',
    'Start with <a href="home.html">Home</a>, then explore <a href="skills.html">Skills</a> and <a href="portfolio.html">Portfolio</a> ✦'
  ]);

  T('contact', /\b(contact|whatsapp|phone|number|email|mail|instagram|insta|reach|dm|call|telegram|social|snap\w*|tiktok|youtube)\b/, [
    'You can reach Kevin here:',
    'Let\'s get you connected 💜 Contact Kevin via:',
    'Message Kevin directly:'
  ]);

  /* ----- Fun ----- */
  T('joke', /\b(joke|jokes|make me laugh|funny story)\b/, [
    'Why did the producer bring a ladder to the studio? To reach the high notes 😂',
    'I told my piano a joke. It didn\'t laugh, but it had a lot of keys to say 🎹😂',
    'Why don\'t hairdressers ever win arguments? They always end up cutting them short ✂️😂',
    'What do you call a bot that sings? A-I-DOL 🎤🤖',
    'Why was the beat so calm? It never dropped under pressure 😎'
  ]);

  T('game', /\b(game|play|quiz|trivia|bored|boring|entertain)\b/, [
    () => fill(next('riddle', topics.find(t => t.id === 'riddle').r)),
    'Quick game: guess my favourite number between 1 and 5 😄',
    'Truth or vibe? Tell me your favourite song right now and I\'ll rate it 🎧',
    'Bored? Try asking me for a joke, a fun fact or a riddle 😎'
  ]);

  T('fact', /\b(fun fact|facts?|teach me|learn something)\b/, [
    'Fun fact: Rwanda is called the "Land of a Thousand Hills" 🇷🇼',
    'Fun fact: Kigali is known as one of the cleanest cities in Africa ✨',
    'Fun fact: "Muraho" is a common way to say hello in Kinyarwanda 👋',
    'Fun fact: Music can lift your mood and boost your focus 🎧 Perfect for studying!'
  ]);

  T('language', /\b(kinyarwanda|french|swahili|language|speak)\b/, [
    'I chat in English here, with a few Kinyarwanda greetings 😄 Muraho!',
    'Kevin studies literature in English, so words matter to him 📖 Ask him about other languages directly!'
  ]);

  T('hobbies', /\b(hobb\w*|free time|weekend|passion|interests?)\b/, [
    'Music, hairdressing, learning and creating, that\'s the K VIBZ world 💜',
    'When he\'s not studying, Kevin is usually into music or practising his hair skills 🎧✂️'
  ]);

  T('favourites', /\b(favou?rite (food|color|colour|movie|film|game|sport|team|place|animal)|food|eat|colour|color|movie|football|sport)\b/, [
    'Good one 😄 I don\'t have that on file. Ask Kevin directly through the <a href="contact.html">Contact page</a>.',
    'That\'s a secret only Kevin knows 🤫 Send him a message and ask!'
  ]);

  /* ----- Feelings & advice ----- */
  T('sad', /\b(sad|depressed|lonely|stress\w*|tired|upset|cry\w*|hurt|bad day|anxious)\b/, [
    'I\'m sorry you\'re feeling like this 💜 Want to talk about it? Even a small step like a walk, some music or talking to someone you trust can help.',
    'Hard days pass 🌤️ You\'re stronger than you think. Put on a good song and take a deep breath.',
    'Thanks for telling me 💜 Be kind to yourself today. I\'m here to chat if it helps.'
  ]);

  T('motivation', /\b(motivat\w*|advice|inspire me|tips|encourage\w*|success|hustle)\b/, [
    'Small steps every day beat big plans never started 💪',
    'Kevin\'s mindset: learn, create, grow 🌱 Do a little today that your future self will thank you for.',
    'Don\'t compare your chapter one to someone else\'s chapter twenty ✨',
    'Your dream doesn\'t have a deadline, but your effort needs a start date 🚀'
  ]);

  T('help', /\b(help|what can (i|you)|how does this work|options|menu|commands)\b/, [
    'You can ask me about Kevin, music, piano, hairdressing, school, goals, family, bookings, contact, dating, or just say hi and chat 😄',
    'Try: "Who is Kevin?", "Tell me a joke", "Is he single?", "How can I book?" or "Fun fact" 🎧'
  ]);

  /* ----- Polite basics ----- */
  T('howareyou', /\b(how are you|how r u|how are u|how's it going|what's up|wassup|whats up|how do you do|how is life)\b/, [
    'I\'m doing great, thanks for asking 😄 How about you?',
    'Feeling good, full of K VIBZ energy ✦ What about you, {name}?',
    'All good over here 🎧 How\'s your day going?',
    'Can\'t complain! Bots don\'t get tired 😎 How are you?'
  ]);

  T('hello', /\b(hi|hello|hey|hola|yo|sup|mambo|muraho|bite|amakuru|niaje|good (morning|afternoon|evening))\b/, [
    'Hey {name}! 👋 Welcome to K VIBZ. What would you like to know?',
    'Hello {name}! 😄 Ask me about music, hair, school, or just chat.',
    'Muraho! 🇷🇼 Great to see you. How can I help?',
    'Hi {name} 💜 I\'m the K VIBZ assistant. Ready when you are!'
  ]);

  T('thanks', /\b(thanks|thank you|thx|murakoze|appreciate)\b/, [
    'You\'re welcome! 💜',
    'Anytime 😊 Anything else?',
    'My pleasure! Ask away if you need more 🎧'
  ]);

  T('compliment', /\b(nice|great|amazing|awesome|cool|love (it|this|your|the)|good (job|work)|impressive|well done|congrat\w*|proud)\b/, [
    'Thank you so much! 🙏 Kevin will be glad to hear that.',
    'That means a lot 💜 Anything else you\'d like to see?',
    'Appreciated! 🔥 Have you checked the <a href="portfolio.html">Portfolio</a> yet?'
  ]);

  T('romance', /\b(romance|romantic|kiss|hug|miss you|marry|marriage|in love|love story)\b/, [
    'Love is a beautiful thing 💜 Kevin believes in real connection. Are you asking for yourself? 😄',
    'Romance talk, I like it 😎 What\'s your idea of a perfect first date?',
    'Honest advice from the K VIBZ assistant: be genuine, be respectful, be patient. The right person notices 💜',
    'A good love story starts with a good conversation. So, how\'s yours going? 😉'
  ]);

  T('sorry', /\b(sorry|apolog\w*|my bad)\b/, [
    'No worries at all 💜 We\'re good!',
    'All good 😊 Let\'s keep the vibes positive.'
  ]);

  T('bestie', /\b(besto|bestie|friend)\b/, [
    'Uwase zawad 💜 very beautiful!'
  ]);

  T('bye', /\b(bye|goodbye|see you|cya|gotta go|good night|goodnight|ciao|murabeho)\b/, [
    'Bye {name}! 👋 Come back anytime.',
    'Take care 💜 Keep creating!',
    'Murabeho! 🇷🇼 Thanks for visiting K VIBZ.',
    'Goodnight / see you soon ✦'
  ]);


  /* ==========================================================
     MORE ANSWERS FOR TOPICS YOU ALREADY HAVE
  ========================================================== */
  
  kvExtend('joke', [
    'Why do pianists make great problem solvers? They always find the right key 🎹😂',
    'What did the drummer call his twin daughters? Anna One, Anna Two 🥁😂',
    'Why did the hairdresser win the race? She knew all the short cuts ✂️😂',
    'Why was the computer cold? It left its Windows open 🥶😂',
    'What do you call fake spaghetti? An impasta 🍝😂',
    'Why can\'t you trust stairs? They\'re always up to something 😂'
  ]);
  
  kvExtend('fact', [
    'Fun fact: a standard piano has 88 keys, 52 white and 36 black 🎹',
    'Fun fact: Rwanda banned plastic bags in 2008 ♻️',
    'Fun fact: Hair grows about 1.25 cm (half an inch) a month on average ✂️',
    'Fun fact: Rwanda has one of the highest shares of women in parliament in the world 🇷🇼',
    'Fun fact: Standard concert tuning sets the note A above middle C to 440 Hz 🎼',
    'Fun fact: Rwanda\'s official languages are Kinyarwanda, English, French and Swahili 🗣️'
  ]);
  
  kvExtend('motivation', [
    'Progress, not perfection 🌱 Even a 1% improvement a day adds up.',
    'Every pro was once a beginner who kept going 🎧',
    'Rest is part of the work. Take a break, then come back stronger 💪',
    'Done is better than perfect. Finish it, then improve it ✨'
  ]);
  
  kvExtend('hello', [
    'Mwiriwe! 🌇 Welcome to K VIBZ. What can I help you with?',
    'Hey there {name} 😄 Ready for some music talk?'
  ]);
  
  kvExtend('thanks', [
    'Glad I could help 💜',
    'Anytime, {name}! 🎧'
  ]);
  
  kvExtend('sad', [
    'I\'m here with you 💜 Do you want to tell me what happened?',
    'It\'s okay to have a heavy day. Drink some water, breathe slowly, and be gentle with yourself 🌿',
    'If things feel too heavy, please talk to someone you trust. You deserve support 💜'
  ]);
  
  kvExtend('music', [
    'Want music tips? Ask me about "chords", "mixing", "BPM" or "how to start producing" 🎛️',
    'Beats start as tiny ideas 🎧 A drum pattern, a chord, a melody, then the magic happens.'
  ]);
  
  kvExtend('hair', [
    'Want hair tips? Ask me about "hair care" or "hairstyle" ✂️',
    'Hairdressing is part science, part art, and a lot of practice 💈'
  ]);
  
  /* ==========================================================
     BIGGER FALLBACK LIST
     (used when nothing matches, so the bot never goes quiet)
  ========================================================== */
  
  const fallbacks = [
    'Interesting! 😄 I\'m still learning. Try asking about Kevin\'s music, skills, school or contact info.',
    'Hmm, I don\'t have an answer for that yet. But you can ask Kevin directly on <a href="contact.html">the Contact page</a>.',
    'Good question! Let me suggest: ask about music, hairdressing, goals, or say "joke" 😎',
    'I didn\'t quite get that 🤔 Could you say it differently?',
    'That one\'s beyond me, but I\'m great at talking about Kevin, music and fun facts 🎧',
    'Tell me more! What made you think of that? 😄',
    'I\'m not sure about that, but I can tell you a fun fact or a joke 😉',
    'Hmm 🤔 Try one of the buttons below for quick topics.',
    'I\'m not sure I understood 🙈 Try short questions like "Who is Kevin?", "Music tips" or "Study tips".',
    'I don\'t know that one yet 🌱 But I\'m great with music, hairdressing, school, Rwanda and jokes.',
    'Let\'s try another angle 😄 Ask me about Kevin\'s skills, his portfolio, or say "riddle".',
    'My brain just buffered 🔄 Could you ask in fewer words?',
    'Not sure about that one, but I can show you the <a href="portfolio.html">Portfolio</a> or the <a href="skills.html">Skills</a> page 🎨',
    'I might have missed that 🎧 Say "help" to see everything I can talk about.',
    'Good thinking 💡 I don\'t have the answer, but Kevin might. Try the <a href="contact.html">Contact page</a>.',
    'I can\'t answer that yet, but I can teach you a few Kinyarwanda words 🇷🇼 Just say "Kinyarwanda phrases".',
    'Hmm, that\'s outside my playlist 🎶 Want music tips, hair tips or study tips instead?',
    'Let\'s keep the conversation going 😊 What\'s your favourite kind of music?',
    'I\'m not sure about that, {name}, but I\'d love to hear more. What are you curious about?',
    'Try saying "what can you do" and I\'ll show you my menu 📋'
  ];

  /* ---------- 5. THE REPLY ENGINE ---------- */

  const CONTACT_TOPICS = ['booking', 'business', 'contact'];

  function respond(raw) {
    const clean = String(raw)
      .toLowerCase()
      .replace(/[\u2018\u2019\u02bc]/g, '\'')
      .replace(/\s+/g, ' ')
      .trim();
    const bare = clean.replace(/[.!?,;:\s]+$/, '');

    if (!bare) return 'I\'m listening 😄 Type something and I\'ll answer!';

    // 1. Safety first
    const crisis = topics[0];
    if (crisis.re.test(bare)) return next('crisis', crisis.r);

    // 2. Someone being hard on themselves gets kindness, not a warning
    if (selfTalkRe.test(bare)) {
      return 'Please be kind to yourself 💜 You\'re learning and growing, and that takes time. Want to talk about it, or hear something fun to lift your mood?';
    }

    // 3. Rude words
    if (insultRe.test(bare)) {
      const level = Math.min(state.insults, insultReplies.length - 1);
      state.insults++;
      state.ctx = null;
      state.followUp = null;
      return next('insult' + level, insultReplies[level]);
    }

    // 4. Find the first matching topic
    for (let i = 0; i < topics.length; i++) {
      const t = topics[i];
      const m = bare.match(t.re);
      if (!m) continue;

      let res = t.fn ? t.fn(m, bare) : next(t.id, t.r);
      if (!res) continue;
      res = fill(res);

      if (CONTACT_TOPICS.indexOf(t.id) !== -1 && res.indexOf('href=') === -1) {
        res = res.replace(/\s+$/, '') + ' ' + contactHTML();
      }

      if (t.id === 'sorry' || t.id === 'thanks') state.insults = 0;

      state.last = t.id;
      if (!t.opts.keep) {
        state.ctx = t.opts.more ? { id: t.id, more: t.opts.more.slice() } : null;
        state.followUp = t.opts.follow || null;
      }
      return res;
    }

    // 5. Nothing matched: never leave the visitor hanging
    state.last = null;
    state.ctx = null;
    state.followUp = null;
    return fill(next('fallback', fallbacks));
  }

  /* ---------- 6. THE CHAT WINDOW ---------- */

  const CHIPS = [
    { label: 'Who is Kevin?', text: 'who is kevin' },
    { label: '🎧 Music tips', text: 'music tips' },
    { label: '✂️ Hair tips', text: 'hair tips' },
    { label: '💪 Skills', text: 'what skills does kevin have' },
    { label: '😂 Joke', text: 'tell me a joke' },
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

    function scrollDown() { box.scrollTop = box.scrollHeight; }

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
      const delay = 450 + Math.min(900, answer.length * 6);
      setTimeout(function () {
        typing.remove();
        addMessage(answer, 'bot');
      }, delay);
    }

    function openChat() {
      root.classList.add('is-open');
      panel.classList.add('open');
      fab.setAttribute('aria-expanded', 'true');
      fab.setAttribute('aria-label', 'Close chat');
      if (!greeted) {
        greeted = true;
        setTimeout(function () {
          addMessage('Hi! 👋 I\'m the K VIBZ assistant. Ask me about Kevin, music, hairdressing, skills, or just chat. Tap a topic below to start.', 'bot');
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

    fab.addEventListener('click', function () {
      if (panel.classList.contains('open')) closeChat(); else openChat();
    });
    closeBtn.addEventListener('click', closeChat);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      send(input.value);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeChat();
    });
  }

  // Lets you test replies in the browser console:  KVChat.reply('hello')
  window.KVChat = { reply: respond };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }
})();
