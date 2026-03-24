/**
 * STAGO Form Handler v2.0 — Production
 * 
 * Wysyła dane formularza TYLKO do Edge Function send-contact-email.
 * Zero bezpośrednich INSERT do REST API = zero duplikatów.
 * 
 * Użycie: <script src="/form-handler.js"></script>
 * Formularz musi mieć atrybut data-contact-form lub id="contactForm"
 */
(function () {
  'use strict';

  // ─── CONFIG ───────────────────────────────────────────────────────
  var CONFIG = {
    ENDPOINT: 'https://zrdlyhizxkqxpzqdogyr.supabase.co/functions/v1/send-contact-email',
    RATE_LIMIT_MS: 30000,
    MAX_MESSAGE_LENGTH: 2000,
    HONEYPOT_FIELD: 'website_url',
    SUCCESS_REDIRECT: null // null = pokaż komunikat inline
  };

  // ─── STATE ────────────────────────────────────────────────────────
  var lastSubmitTime = 0;

  // ─── LANGUAGE DETECTION ───────────────────────────────────────────
  function detectLanguage() {
    var lang = document.documentElement.lang || '';
    if (lang.startsWith('cs') || lang.startsWith('cz')) return 'cz';
    if (lang.startsWith('sk')) return 'sk';
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('pl')) return 'pl';

    var path = window.location.pathname.toLowerCase();
    if (path.indexOf('/cz/') !== -1 || path.indexOf('/cs/') !== -1) return 'cz';
    if (path.indexOf('/sk/') !== -1) return 'sk';
    if (path.indexOf('/en/') !== -1) return 'en';

    return 'pl';
  }

  // ─── MESSAGES ─────────────────────────────────────────────────────
  var MESSAGES = {
    pl: {
      success: 'Dziękujemy! Wiadomość została wysłana. Odezwiemy się jak najszybciej.',
      error: 'Wystąpił błąd. Spróbuj ponownie lub zadzwoń do nas.',
      rateLimit: 'Proszę poczekać 30 sekund przed ponownym wysłaniem.',
      invalidEmail: 'Proszę podać poprawny adres e-mail.',
      sending: 'Wysyłanie...'
    },
    cz: {
      success: 'Děkujeme! Zpráva byla odeslána. Ozveme se co nejdříve.',
      error: 'Došlo k chybě. Zkuste to znovu nebo nám zavolejte.',
      rateLimit: 'Počkejte prosím 30 sekund před dalším odesláním.',
      invalidEmail: 'Zadejte prosím platnou e-mailovou adresu.',
      sending: 'Odesílání...'
    },
    sk: {
      success: 'Ďakujeme! Správa bola odoslaná. Ozveme sa čo najskôr.',
      error: 'Vyskytla sa chyba. Skúste to znova alebo nám zavolajte.',
      rateLimit: 'Počkajte prosím 30 sekúnd pred ďalším odoslaním.',
      invalidEmail: 'Zadajte prosím platnú e-mailovú adresu.',
      sending: 'Odosielanie...'
    },
    en: {
      success: 'Thank you! Your message has been sent. We\'ll get back to you soon.',
      error: 'Something went wrong. Please try again or call us.',
      rateLimit: 'Please wait 30 seconds before submitting again.',
      invalidEmail: 'Please enter a valid email address.',
      sending: 'Sending...'
    }
  };

  // ─── SANITIZATION ────────────────────────────────────────────────
  function sanitize(str) {
    if (!str) return '';
    return String(str)
      .replace(/<[^>]*>/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim()
      .substring(0, CONFIG.MAX_MESSAGE_LENGTH);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ─── FIELD MAPPER ─────────────────────────────────────────────────
  var FIELD_MAP = {
    name: [
      'imię', 'imie', 'imię i nazwisko', 'name', 'your name', 'full name',
      'jméno', 'meno', 'imię*', 'imie*'
    ],
    email: [
      'email', 'e-mail', 'adres e-mail', 'adres email', 'your email',
      'e-mailová adresa', 'email*', 'e-mail*'
    ],
    phone: [
      'telefon', 'phone', 'numer telefonu', 'nr telefonu', 'your phone',
      'telefón', 'telefonní číslo', 'telefon*'
    ],
    message: [
      'wiadomość', 'wiadomosc', 'message', 'treść', 'tresc', 'your message',
      'twoja wiadomość', 'zpráva', 'správa', 'wiadomość*'
    ],
    containerType: [
      'typ kontenera', 'container type', 'rodzaj kontenera', 'typ kontejneru',
      'typ kontajnera', 'typ kontenera*'
    ]
  };

  function mapFormFields(form) {
    var data = {};
    var inputs = form.querySelectorAll('input, textarea, select');

    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var value = (input.value || '').trim();
      if (!value) continue;

      // Skip honeypot, hidden, submit, checkbox, button
      if (input.name === CONFIG.HONEYPOT_FIELD) continue;
      if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') continue;
      if (input.type === 'checkbox') continue;

      // Try matching by name attribute first
      var fieldName = (input.name || '').toLowerCase().trim();
      var label = '';

      // Try to get label text
      if (input.id) {
        var labelEl = form.querySelector('label[for="' + input.id + '"]');
        if (labelEl) label = (labelEl.textContent || '').toLowerCase().trim();
      }
      if (!label && input.placeholder) {
        label = input.placeholder.toLowerCase().trim();
      }

      // Remove asterisks from label for matching
      var cleanLabel = label.replace(/\*/g, '').trim();
      var cleanFieldName = fieldName.replace(/\*/g, '').trim();

      var matched = false;
      for (var key in FIELD_MAP) {
        if (data[key]) continue; // already mapped
        var aliases = FIELD_MAP[key];
        for (var j = 0; j < aliases.length; j++) {
          var alias = aliases[j].replace(/\*/g, '').trim();
          if (cleanFieldName === alias || cleanLabel === alias || fieldName === key) {
            data[key] = sanitize(value);
            matched = true;
            break;
          }
        }
        if (matched) break;
      }

      // Fallback: map by input type
      if (!matched) {
        if (input.type === 'email' && !data.email) {
          data.email = sanitize(value);
        } else if (input.type === 'tel' && !data.phone) {
          data.phone = sanitize(value);
        } else if (input.tagName === 'TEXTAREA' && !data.message) {
          data.message = sanitize(value);
        }
      }
    }

    return data;
  }

  // ─── UI FEEDBACK ──────────────────────────────────────────────────
  function showMessage(form, text, isError) {
    // Remove existing message
    var existing = form.querySelector('.form-handler-msg');
    if (existing) existing.remove();

    var div = document.createElement('div');
    div.className = 'form-handler-msg';
    div.style.cssText = 'padding:12px 16px;margin-top:12px;border-radius:8px;font-size:14px;line-height:1.5;';
    div.style.backgroundColor = isError ? '#fef2f2' : '#f0fdf4';
    div.style.color = isError ? '#991b1b' : '#166534';
    div.style.border = '1px solid ' + (isError ? '#fecaca' : '#bbf7d0');
    div.textContent = text;
    form.appendChild(div);

    // Auto-remove after 8s
    setTimeout(function () {
      if (div.parentNode) div.remove();
    }, 8000);
  }

  function setSubmitButton(form, loading, lang) {
    var btn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (!btn) return;

    if (loading) {
      btn._originalText = btn.textContent || btn.value;
      var loadingText = (MESSAGES[lang] || MESSAGES.pl).sending;
      if (btn.tagName === 'INPUT') {
        btn.value = loadingText;
      } else {
        btn.textContent = loadingText;
      }
      btn.disabled = true;
      btn.style.opacity = '0.6';
    } else {
      if (btn._originalText) {
        if (btn.tagName === 'INPUT') {
          btn.value = btn._originalText;
        } else {
          btn.textContent = btn._originalText;
        }
      }
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }

  // ─── SUBMIT HANDLER ──────────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault();
    var form = e.target;
    var lang = detectLanguage();
    var msgs = MESSAGES[lang] || MESSAGES.pl;

    // Honeypot check
    var honeypot = form.querySelector('[name="' + CONFIG.HONEYPOT_FIELD + '"]');
    if (honeypot && honeypot.value) {
      // Bot detected — silently pretend success
      showMessage(form, msgs.success, false);
      return;
    }

    // Rate limiting
    var now = Date.now();
    if (now - lastSubmitTime < CONFIG.RATE_LIMIT_MS) {
      showMessage(form, msgs.rateLimit, true);
      return;
    }

    // Map fields
    var data = mapFormFields(form);

    // Validate required fields
    if (!data.email || !isValidEmail(data.email)) {
      showMessage(form, msgs.invalidEmail, true);
      return;
    }

    // Set loading state
    lastSubmitTime = now;
    setSubmitButton(form, true, lang);

    // Konfigurator — dołącz state do message
    if ((form.id === 'cfgForm' || form.classList.contains('cfg-form')) && typeof state !== 'undefined') {
      var cfgLines = [];
      if (state.type) cfgLines.push('Typ: ' + state.type);
      if (state.dimL && state.dimW) cfgLines.push('Wymiary: ' + state.dimL + ' × ' + state.dimW + ' × ' + (state.dimH || '2.8') + ' m');
      if (state.profil) cfgLines.push('Profil blachy: ' + state.profil);
      if (state.kolorScian) cfgLines.push('Kolor ścian: ' + state.kolorScian);
      if (state.okucia) cfgLines.push('Okucia: ' + state.okucia);
      if (state.kolorOkuc) cfgLines.push('Kolor okuć: ' + state.kolorOkuc);
      if (state.doorType) cfgLines.push('Drzwi: ' + state.doorType + ' × ' + (state.doorQty || 1));
      if (state.windowType) cfgLines.push('Okna: ' + state.windowType + ' × ' + (state.windowQty || 2));
      if (state.extras && state.extras.length) cfgLines.push('Wyposażenie: ' + state.extras.join(', '));
      if (data.message) cfgLines.push('Uwagi: ' + data.message);
      data.message = cfgLines.join('\n');
      data.containerType = state.type || data.containerType;
    }

    // Build payload
    var payload = {
      name: data.name || '',
      email: data.email,
      phone: data.phone || '',
      message: data.message || '',
      containerType: data.containerType || '',
      language: lang
    };

    // Send to Edge Function ONLY — no direct REST API insert
    fetch(CONFIG.ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      })
      .then(function () {
        setSubmitButton(form, false, lang);
        form.reset();
        showMessage(form, msgs.success, false);

        if (CONFIG.SUCCESS_REDIRECT) {
          setTimeout(function () {
            window.location.href = CONFIG.SUCCESS_REDIRECT;
          }, 1500);
        }
      })
      .catch(function (err) {
        console.error('[STAGO] Form submission error:', err);
        setSubmitButton(form, false, lang);
        showMessage(form, msgs.error, true);
      });
  }

  // ─── INIT ─────────────────────────────────────────────────────────
  function init() {
    var forms = document.querySelectorAll('[data-contact-form], [data-stago-form], #contactForm, #contact-form, #product-form, #cfgForm, form.contact-form, form.product-form, form.cfg-form');
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', handleSubmit);
    }

    // Inject honeypot field into forms that don't have it
    for (var j = 0; j < forms.length; j++) {
      if (!forms[j].querySelector('[name="' + CONFIG.HONEYPOT_FIELD + '"]')) {
        var hp = document.createElement('input');
        hp.type = 'text';
        hp.name = CONFIG.HONEYPOT_FIELD;
        hp.tabIndex = -1;
        hp.autocomplete = 'off';
        hp.style.cssText = 'position:absolute;left:-9999px;top:-9999px;opacity:0;height:0;width:0;';
        forms[j].appendChild(hp);
      }
    }
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
