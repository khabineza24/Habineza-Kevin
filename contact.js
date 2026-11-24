
/* ==========================================
   K VIBZ — CONTACT PAGE JAVASCRIPT
   EmailJS Direct Email Integration
========================================== */

(function () {
  'use strict';

  /* 1. EMAILJS CONFIGURATION */

  const EMAILJS_CONFIG = {
    serviceID: 'service_ip8195f',
    templateID: 'template_c9dxfm9',
    publicKey: 'ZwtE7GzXs8zPGm08n'
  };

  /* 2. YOUR CONTACT DETAILS */

  const CONTACT = {
    whatsapp: '0795169743',
    email: 'habinezakevin761@gmail.com',
    instagram: 'k_vibe.rw'
  };

  /* 3. SCROLL REVEAL ANIMATION */

  const revealItems = document.querySelectorAll('.contact-page .reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('visible'));
  }

  /* 4. CONTACT CHANNELS */

  function setChannel(id, url, enabled) {
    const element = document.getElementById(id);
    if (!element) return;

    if (enabled) {
      element.href = url;
      element.hidden = false;
    } else {
      element.hidden = true;
    }
  }

  const whatsappNumber = CONTACT.whatsapp.replace(/\D/g, '');
  const instagramName = CONTACT.instagram.replace(/^@/, '').trim();

  setChannel(
    'ch-whatsapp',
    'https://wa.me/' + whatsappNumber,
    whatsappNumber.length > 0
  );

  setChannel(
    'ch-email',
    'mailto:' + CONTACT.email.trim(),
    CONTACT.email.trim().length > 0
  );

  setChannel(
    'ch-instagram',
    'https://instagram.com/' + encodeURIComponent(instagramName),
    instagramName.length > 0
  );

  /* 5. FORM ELEMENTS */

  const form = document.getElementById('contact-form');
  if (!form) return;

  const message = document.getElementById('message');
  const counter = document.getElementById('msg-count');

  const result = document.getElementById('form-result');
  const resultTitle = document.getElementById('result-title');
  const resultNote = document.getElementById('result-note');
  const resultText = document.getElementById('result-text');

  const copyButton = document.getElementById('copy-btn');
  const submitButton = form.querySelector('[type="submit"]');

  let preparedMessage = '';
  const MAX = 600;

  /* 6. CHARACTER COUNTER */

  function updateCounter() {
    if (!message || !counter) return;

    const count = message.value.length;
    counter.textContent = count + ' / ' + MAX;
    counter.style.color = count >= MAX ? '#ff8b94' : '';
  }

  if (message) {
    message.addEventListener('input', updateCounter);
    updateCounter();
  }

  /* 7. VALIDATION */

  function clearErrors() {
    form.querySelectorAll('.invalid').forEach((field) => {
      field.classList.remove('invalid');
    });

    form.querySelectorAll('.field-error').forEach((error) => {
      error.textContent = '';
    });
  }

  function showError(field, messageText) {
    field.classList.add('invalid');

    const error = document.getElementById('err-' + field.name);

    if (error) {
      error.textContent = messageText;
    }
  }

  function validateForm() {
    clearErrors();

    let valid = true;

    const name = form.elements.name;
    const email = form.elements.email;

    const selectedSubject =
      form.querySelector('input[name="subject"]:checked');

    if (name.value.trim().length < 2) {
      showError(name, 'Please enter your name.');
      valid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.value.trim())) {
      showError(email, 'Please enter a valid email address.');
      valid = false;
    }

    if (!selectedSubject) {
      const subjectError = document.getElementById('err-subject');
      if (subjectError) {
        subjectError.textContent = 'Please choose a subject.';
      }
      valid = false;
    }

    if (message.value.trim().length < 10) {
      showError(message, 'Your message must contain at least 10 characters.');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('input', (event) => {
    const field = event.target;
    field.classList.remove('invalid');

    const error = document.getElementById('err-' + field.name);

    if (error) {
      error.textContent = '';
    }
  });

  /* 8. PREPARE MESSAGE */

  function buildMessage() {
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();

    const subject =
      form.querySelector('input[name="subject"]:checked').value;

    const content = message.value.trim();

    return (
      'Hello Kevin, my name is ' + name + '.\n\n' +
      'Subject: ' + subject + '\n\n' +
      content + '\n\n' +
      'My email: ' + email + '\n\n' +
      'Sent through the K VIBZ portfolio website.'
    );
  }

  /* 9. SHOW RESULT */

  function showResult(title, note, text) {
    resultTitle.textContent = title;
    resultNote.textContent = note;
    resultText.textContent = text;

    result.hidden = false;
    copyButton.textContent = 'Copy message';

    result.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }

  /* 10. SEND MESSAGE DIRECTLY TO YOUR EMAIL */

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      const firstError =
        form.querySelector('.invalid') ||
        document.getElementById('err-subject');

      if (firstError) {
        firstError.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }

      return;
    }

    if (typeof emailjs === 'undefined') {
      showResult(
        'Connection problem',
        'Email service could not load. Please try again later.',
        'Your message has not been sent. You can copy it below.'
      );
      preparedMessage = buildMessage();
      return;
    }

    preparedMessage = buildMessage();

    const selectedSubject =
      form.querySelector('input[name="subject"]:checked').value;

    const templateParams = {
      from_name: form.elements.name.value.trim(),
      from_email: form.elements.email.value.trim(),
      subject: selectedSubject,
      message: message.value.trim()
    };

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    try {
      await emailjs.send(
        EMAILJS_CONFIG.serviceID,
        EMAILJS_CONFIG.templateID,
        templateParams
      );

      showResult(
        'Message sent successfully!',
        'Thank you for contacting K VIBZ. Your message has been delivered to my inbox.',
        preparedMessage
      );

      form.reset();
      updateCounter();
      clearErrors();

    } catch (error) {
      console.error('EmailJS error:', error);

      showResult(
        'Message not sent',
        'Something went wrong. Please try again or contact me through WhatsApp or email.',
        preparedMessage
      );

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Send Message';
      }
    }
  });

  /* 11. COPY MESSAGE */

  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      if (!preparedMessage) return;

      try {
        await navigator.clipboard.writeText(preparedMessage);
        copyButton.textContent = 'Copied successfully ✓';

      } catch (error) {
        const temporary = document.createElement('textarea');

        temporary.value = preparedMessage;
        temporary.style.position = 'fixed';
        temporary.style.opacity = '0';

        document.body.appendChild(temporary);
        temporary.select();

        const copied = document.execCommand('copy');
        temporary.remove();

        copyButton.textContent =
          copied ? 'Copied successfully ✓' : 'Please copy manually';
      }
    });
  }

  /* 12. INITIALIZE EMAILJS */

  if (typeof emailjs !== 'undefined') {
    emailjs.init({
      publicKey: EMAILJS_CONFIG.publicKey
    });
  }

})();
