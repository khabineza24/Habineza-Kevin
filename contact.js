/* ==========================================
   K VIBZ — CONTACT PAGE SCRIPT (contact.html only)
   Your WhatsApp / email are set in config.js
========================================== */

(function () {
  'use strict';

  var CFG = window.KV_CONFIG || {};
  var whatsapp = String(CFG.whatsapp || '').replace(/\D/g, '');
  var email = String(CFG.email || '').trim();
  var instagram = String(CFG.instagram || '').replace('@', '').trim();

  var form = document.getElementById('contactForm');
  if (!form) return;

  var nameEl = document.getElementById('cName');
  var contactEl = document.getElementById('cContact');
  var topicEl = document.getElementById('cTopic');
  var msgEl = document.getElementById('cMessage');
  var countEl = document.getElementById('cCount');
  var statusEl = document.getElementById('ctStatus');
  var waBtn = document.getElementById('sendWhatsApp');
  var mailBtn = document.getElementById('sendEmail');
  var copyBtn = document.getElementById('copyMsg');
  var setupEl = document.getElementById('ctSetup');
  var methods = document.getElementById('methods');

  var TOPICS = {
    music: 'Music & collaboration',
    hair: 'Hairdressing',
    business: 'Opportunities & projects',
    hello: 'Just saying hello'
  };

  /* ---------- 1. Show only the contact methods you have set up ---------- */

  function addMethod(icon, label, html) {
    var d = document.createElement('div');
    d.className = 'ct-method';
    d.innerHTML = '<span class="ct-icon">' + icon + '</span><div><small>' + label + '</small>' + html + '</div>';
    methods.appendChild(d);
  }

  if (whatsapp) addMethod('💬', 'WHATSAPP', '<a href="https://wa.me/' + whatsapp + '" target="_blank" rel="noopener"><strong>Chat with me</strong></a>');
  if (email) addMethod('✉️', 'EMAIL', '<a href="mailto:' + encodeURI(email) + '"><strong>' + email.replace(/</g, '&lt;') + '</strong></a>');
  if (instagram) addMethod('📸', 'INSTAGRAM', '<a href="https://instagram.com/' + encodeURIComponent(instagram) + '" target="_blank" rel="noopener"><strong>@' + instagram.replace(/</g, '&lt;') + '</strong></a>');

  if (whatsapp) waBtn.hidden = false;
  if (email) mailBtn.hidden = false;

  var isLocal = window.location.protocol === 'file:' || /^(localhost|127\.)/.test(window.location.hostname);
  if (!whatsapp && !email && isLocal) setupEl.hidden = false;

  /* ---------- 2. Pre-select the topic from the link (?topic=hair) ---------- */

  try {
    var wanted = new URLSearchParams(window.location.search).get('topic');
    if (wanted && TOPICS[wanted]) topicEl.value = wanted;
  } catch (e) {}

  /* ---------- 3. Character counter ---------- */

  function updateCount() { countEl.textContent = msgEl.value.length + ' / 500'; }
  msgEl.addEventListener('input', function () {
    updateCount();
    showError(msgEl, '');
  });
  nameEl.addEventListener('input', function () { showError(nameEl, ''); });
  updateCount();

  /* ---------- 4. Checking the form ---------- */

  function showError(field, text) {
    var p = form.querySelector('.ct-error[data-for="' + field.id + '"]');
    if (p) p.textContent = text;
    field.classList.toggle('has-error', !!text);
  }

  function valid() {
    var ok = true;
    if (nameEl.value.trim().length < 2) { showError(nameEl, 'Please tell me your name.'); ok = false; }
    if (msgEl.value.trim().length < 10) { showError(msgEl, 'Please write at least 10 characters.'); ok = false; }
    if (!ok) {
      setStatus('', '');
      var first = form.querySelector('.has-error');
      if (first) first.focus();
    }
    return ok;
  }

  function buildMessage() {
    var lines = [
      'Hello Kevin 👋',
      'My name is ' + nameEl.value.trim() + '.',
      'Topic: ' + TOPICS[topicEl.value],
      '',
      msgEl.value.trim()
    ];
    if (contactEl.value.trim()) lines.push('', 'You can reach me on: ' + contactEl.value.trim());
    return lines.join('\n');
  }

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'ct-status' + (kind ? ' ' + kind : '');
  }

  /* ---------- 5. The three buttons ---------- */

  waBtn.addEventListener('click', function () {
    if (!valid()) return;
    window.open('https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(buildMessage()), '_blank', 'noopener');
    setStatus('Opening WhatsApp with your message… 💜', 'ok');
  });

  mailBtn.addEventListener('click', function () {
    if (!valid()) return;
    var subject = 'K VIBZ: ' + TOPICS[topicEl.value];
    window.location.href = 'mailto:' + encodeURI(email) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(buildMessage());
    setStatus('Opening your email app… 💜', 'ok');
  });

  copyBtn.addEventListener('click', function () {
    if (!valid()) return;
    var text = buildMessage();
    function done() { setStatus('Message copied ✔ Now paste it in WhatsApp, email or Instagram.', 'ok'); }
    function fallback() {
      var t = document.createElement('textarea');
      t.value = text;
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); done(); } catch (e) { setStatus('Could not copy. Please select the text and copy it yourself.', 'bad'); }
      t.remove();
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); });
})();
