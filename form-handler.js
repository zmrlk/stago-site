/**
 * STAGO Form Handler v2.2 — Production
 *
 * v2.2: payload leada niesie atrybucję first-party (gclid/utm/landing_page
 *   z window.STAGO_ATTRIBUTION — capture robi cookies.js). Niezależne od zgody
 *   cookies: dane idą TYLKO z formularzem, który user świadomie wysyła.
 *
 * Wysyła dane formularza TYLKO do Edge Function send-contact-email.
 * Zero bezpośrednich INSERT do REST API = zero duplikatów.
 *
 * v2.1: po potwierdzonej wysyłce emituje konwersję `generate_lead`
 *   - dataLayer.push (GTM → tagi marketingowe Meta/TikTok)
 *   - gtag('event', ...) (GA4 — ładowany bezpośrednio z cookies.js, NIE przez GTM)
 *   Bez PII. Tag odpala się tylko po zgodzie (consent mode).
 *
 * Użycie: <script src="/form-handler.js"></script>
 * Formularz musi mieć atrybut data-contact-form lub id="contactForm"
 */
(function () {
  'use strict';

  // ─── CONFIG ───────────────────────────────────────────────────────
  var CONFIG = {
    ENDPOINT: 'https://erp.stago.com.pl/api/leads/intake',
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
      sending: 'Wysyłanie...',
      consentRequired: 'Aby wysłać zapytanie, zaakceptuj informację o przetwarzaniu danych osobowych.',
      contactRequired: 'Podaj numer telefonu albo adres e-mail, żebyśmy mogli odpowiedzieć.'
    },
    cz: {
      success: 'Děkujeme! Zpráva byla odeslána. Ozveme se co nejdříve.',
      error: 'Došlo k chybě. Zkuste to znovu nebo nám zavolejte.',
      rateLimit: 'Počkejte prosím 30 sekund před dalším odesláním.',
      invalidEmail: 'Zadejte prosím platnou e-mailovou adresu.',
      sending: 'Odesílání...',
      consentRequired: 'Pro odeslání dotazu prosím potvrďte souhlas se zpracováním osobních údajů.',
      contactRequired: 'Uveďte prosím telefon nebo e-mail, abychom vám mohli odpovědět.'
    },
    sk: {
      success: 'Ďakujeme! Správa bola odoslaná. Ozveme sa čo najskôr.',
      error: 'Vyskytla sa chyba. Skúste to znova alebo nám zavolajte.',
      rateLimit: 'Počkajte prosím 30 sekúnd pred ďalším odoslaním.',
      invalidEmail: 'Zadajte prosím platnú e-mailovú adresu.',
      sending: 'Odosielanie...',
      consentRequired: 'Pre odoslanie dopytu prosím potvrďte súhlas so spracovaním osobných údajov.',
      contactRequired: 'Uveďte prosím telefón alebo e-mail, aby sme vám mohli odpovedať.'
    },
    en: {
      success: 'Thank you! Your message has been sent. We\'ll get back to you soon.',
      error: 'Something went wrong. Please try again or call us.',
      rateLimit: 'Please wait 30 seconds before submitting again.',
      invalidEmail: 'Please enter a valid email address.',
      sending: 'Sending...',
      consentRequired: 'To send the message, please accept the privacy notice.',
      contactRequired: 'Please provide a phone number or an e-mail address so we can reply.'
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

  // Identyfikator zdarzenia wspólny dla piksela i API konwersji (deduplikacja Meta).
  // crypto.randomUUID nie jest dostępne w starszych Safari — stąd fallback.
  function makeEventId() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }
    } catch (e) {}
    return 'ev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  // Ciasteczka Meta (_fbc = klik w reklamę, _fbp = identyfikator przeglądarki).
  // Ustawia je fbevents.js, czyli istnieją TYLKO po zgodzie marketingowej.
  function readCookie(name) {
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    } catch (e) {
      return '';
    }
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

  // ─── ANALYTICS: konwersja generate_lead ──────────────────────────
  // Wywoływane TYLKO po potwierdzonej wysyłce (HTTP 2xx z Edge Function).
  // Zero PII: imię/email/telefon NIE trafiają do analytics (wymóg GA4 §PII).
  // Dwa tory bo GA4 jest ładowany wprost przez gtag z cookies.js (nie przez GTM):
  //   1) dataLayer.push  → GTM (custom event 'generate_lead' dla tagów Meta/TikTok)
  //   2) gtag('event')   → GA4 bezpośrednio; bez zgody to cookieless ping/modelowanie,
  //      dlatego measurement_basis zawsze opisuje pochodzenie zdarzenia.
  function trackLead(form, payload) {
    try {
      var isConfigurator = (form.id === 'cfgForm' || form.classList.contains('cfg-form'));
      var params = {
        lead_type: isConfigurator ? 'configurator' : 'contact',
        form_id: payload.consent_form_id || form.id || '',
        form_location: window.location.pathname,
        language: payload.language || '',
        container_type: payload.containerType || '',
        consent_marketing: payload.consent_marketing === true,
        consent_ads: payload.consent_ads === true,
        consent_openai_ads: payload.consent_openai_ads === true,
        measurement_basis: payload.consent_analytics === true ? 'observed_consented' : 'cookieless_aggregate'
      };

      // 1) GTM — custom event
      window.dataLayer = window.dataLayer || [];
      var dlEvent = { event: 'generate_lead' };
      for (var k in params) {
        if (Object.prototype.hasOwnProperty.call(params, k)) dlEvent[k] = params[k];
      }
      if (payload.event_id) dlEvent.event_id = payload.event_id;
      window.dataLayer.push(dlEvent);

      // 2) GA4 — recommended event (gtag dostępny tylko po zgodzie analytics)
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'generate_lead', params);
      }

      // 3) Meta Pixel / TikTok Pixel — bezpośrednio, NIE przez GTM.
      // GTM-WNJQZHX6 jest praktycznie pusty (zero tagów Meta/TikTok), więc sam
      // dataLayer.push z punktu 1 nikomu nic nie wysyła. fbq/ttq istnieją tylko
      // po zgodzie marketingowej — cookies.js ładuje je dopiero wtedy.
      // Zero PII: przekazujemy wyłącznie te same nie-osobowe parametry co do GA4.
      // ⚠️ Czwarty argument { eventID } to CAŁA deduplikacja z API konwersji.
      // Ten sam identyfikator poszedł w payloadzie do STAGO v2 (payload.event_id).
      // Usunięcie go = Meta policzy każdy lead dwa razy.
      if (typeof window.fbq === 'function') {
        window.fbq(
          'track',
          'Lead',
          {
            content_category: params.lead_type,
            content_name: params.container_type || undefined
          },
          payload.event_id ? { eventID: payload.event_id } : undefined
        );
      }
      if (typeof window.ttq === 'object' && typeof window.ttq.track === 'function') {
        window.ttq.track('SubmitForm', { content_category: params.lead_type });
      }
    } catch (e) {
      // Tracking nigdy nie może zepsuć wysyłki formularza — połykamy błąd.
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

    // Kontakt jest mozliwy telefonem albo mailem — formularze wymagaja telefonu,
    // a e-mail jest oznaczony jako opcjonalny. Blokujemy wiec tylko e-mail BLEDNY,
    // nie pusty; wczesniej pusty e-mail przerywal wysylke mimo etykiety "opcjonalnie".
    if (data.email && !isValidEmail(data.email)) {
      showMessage(form, msgs.invalidEmail, true);
      return;
    }
    if (!data.email && !data.phone) {
      showMessage(form, msgs.contactRequired, true);
      return;
    }

    // Consent collection (RODO Art. 7 — administrator must be able to demonstrate consent)
    var consentBox = form.querySelector('[name="consent"]');
    var consentMarketingBox = form.querySelector('[name="consent_marketing"]');
    if (consentBox && !consentBox.checked) {
      showMessage(form, msgs.consentRequired, true);
      return;
    }
    var consentRecord = {
      consent: consentBox ? !!consentBox.checked : null,
      consent_marketing: consentMarketingBox ? !!consentMarketingBox.checked : false,
      consent_timestamp: new Date().toISOString(),
      consent_source_url: window.location.href,
      consent_form_id: form.id || form.getAttribute('data-form-name') || ''
    };
    var cookieConsent = null;
    try {
      cookieConsent = window.STAGO_COOKIES && window.STAGO_COOKIES.state
        ? window.STAGO_COOKIES.state()
        : null;
    } catch (consentErr) {}
    var consentAnalytics = !!(cookieConsent && cookieConsent.analytics);
    var consentAds = !!(cookieConsent && cookieConsent.marketing);
    var consentOpenAIAds = !!(consentAds && cookieConsent.version === '2026-09-03-v2');
    var consentState = consentAds
      ? (consentAnalytics ? 'analytics_and_ads_granted' : 'ads_granted')
      : (consentAnalytics ? 'analytics_granted' : 'denied');

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
      if (state.accents && state.accents.length) {
        var an = { corners: 'narożniki', entrance: 'wejście', band: 'pas górny', squares: 'kwadraty', cassette: 'kasetony', full: 'całość' };
        cfgLines.push('Akcenty lamelowe: ' + state.accents.map(function (a) { return an[a] || a; }).join(', '));
      }
      if (state.woodName) cfgLines.push('Kolor lameli: ' + state.woodName);
      if (state.okuciaMetal) cfgLines.push('Okucia narożne metalowe: tak');
      if (state.openings && state.openings.length) {
        var kn = { wit: 'witryna', door: 'drzwi', okn: 'okno' };
        var wn = { A: 'przód', B: 'prawy bok', C: 'tył', D: 'lewy bok' };
        // Pozycja na ścianie i zawiasy istnieją tylko wtedy, gdy klient miał podgląd 3D
        // i mógł je świadomie ustawić. Bez nich grupujemy powtórzenia, jak w podsumowaniu na ekranie.
        var parts = [];
        var groups = {};
        state.openings.forEach(function (o) {
          var kind = kn[o.kind] || o.kind;
          var wall = wn[o.wall] || o.wall;
          if (o.t != null) {
            parts.push(kind + ' (' + wall + ', ' + Math.round(o.t * 100) + '%' +
              (o.kind === 'door' && o.hinge ? ', zawiasy ' + (o.hinge === 'right' ? 'prawe' : 'lewe') : '') + ')');
            return;
          }
          var key = kind + ' (' + wall + ')';
          if (groups[key] == null) { groups[key] = 0; parts.push(key); }
          groups[key]++;
        });
        parts = parts.map(function (p) { return groups[p] > 1 ? groups[p] + '× ' + p : p; });
        cfgLines.push('Stolarka: ' + parts.join('; '));
      }
      if (state.extras && state.extras.length) cfgLines.push('Wyposażenie: ' + state.extras.join(', '));
      if (data.message) cfgLines.push('Uwagi: ' + data.message);
      data.message = cfgLines.join('\n');
      data.containerType = state.type || data.containerType;
    }

    // Build payload (consent record persisted server-side for RODO Art. 7 audit trail)
    var payload = {
      name: data.name || '',
      email: data.email,
      phone: data.phone || '',
      message: data.message || '',
      containerType: data.containerType || '',
      language: lang,
      consent: consentRecord.consent,
      // consent_marketing = dobrowolny kontakt handlowy z checkboxa formularza.
      // consent_ads/analytics = osobna decyzja z banera cookies.
      consent_marketing: consentRecord.consent_marketing,
      consent_analytics: consentAnalytics,
      consent_ads: consentAds,
      consent_openai_ads: consentOpenAIAds,
      consent_state: consentState,
      consent_policy_version: cookieConsent && cookieConsent.version
        ? String(cookieConsent.version).slice(0, 40)
        : 'legacy',
      consent_policy_timestamp: cookieConsent && cookieConsent.ts
        ? new Date(cookieConsent.ts).toISOString()
        : null,
      measurement_basis: 'crm_declared',
      identity_state: 'declared',
      consent_timestamp: consentRecord.consent_timestamp,
      consent_source_url: consentRecord.consent_source_url,
      consent_form_id: consentRecord.consent_form_id
    };

    // Atrybucja first-party (gclid/utm złapane przez cookies.js na landingu).
    // Płaskie klucze top-level — endpoint intake czyta utm_*/gclid i buduje
    // sekcję „Źródło leada" + strukturalną kolumnę attribution.
    try {
      var attr = (window.STAGO_ATTRIBUTION && window.STAGO_ATTRIBUTION.get()) || null;
      if (attr) {
        for (var ak in attr) {
          if (Object.prototype.hasOwnProperty.call(attr, ak) && ak !== 'ts' && !(ak in payload)) {
            payload[ak] = attr[ak];
          }
        }
        if (attr.ts) payload.attribution_ts = new Date(attr.ts).toISOString();
      }
    } catch (attrErr) {}
    try {
      var attrSignal = window.STAGO_ATTRIBUTION && window.STAGO_ATTRIBUTION.signal
        ? window.STAGO_ATTRIBUTION.signal()
        : null;
      if (attrSignal && !payload.utm_source && !payload.gclid && !payload.fbclid && !payload.ttclid && !payload.oppref) {
        payload.attribution_signal = attrSignal;
      }
    } catch (signalErr) {}

    // Deduplikacja Meta (piksel ↔ API konwersji) — #667.
    // To samo zgłoszenie leci DWOMA kanałami: fbq('track','Lead') z przeglądarki
    // ORAZ z serwera STAGO v2. Meta scala je po event_id i liczy JAKO JEDNO.
    // ⚠️ event_id generujemy TUTAJ, bo obie wysyłki muszą dostać tę samą wartość:
    // payload.event_id → serwer, ten sam string → trackLead → fbq. Osobne identyfikatory
    // = podwójnie policzone konwersje i zawyżony wynik kampanii.
    // Dokładamy też ciasteczka Meta — serwer sam ich nie widzi (są na domenie klienta),
    // a to one wiążą zgłoszenie z konkretnym klikiem w reklamę.
    payload.event_id = makeEventId();
    var fbcCookie = consentAds ? readCookie('_fbc') : '';
    var fbpCookie = consentAds ? readCookie('_fbp') : '';
    if (fbcCookie) payload.fbc = fbcCookie;
    if (fbpCookie) payload.fbp = fbpCookie;

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

        // Konwersja: lead potwierdzony (przed reset — payload mamy w scope)
        trackLead(form, payload);

        form.reset();

        // Konfigurator — dedykowany success-screen (ukryj step-panels + bottom-bar, pokaż successScreen)
        if (form.id === 'cfgForm' || form.classList.contains('cfg-form')) {
          var configWrap = document.getElementById('configWrap');
          if (configWrap) {
            configWrap.querySelectorAll('.step-panel').forEach(function (p) { p.classList.remove('active'); });
          }
          var successScreen = document.getElementById('successScreen');
          if (successScreen) successScreen.classList.add('active');
          var bottomBar = document.getElementById('bottomBar');
          if (bottomBar) bottomBar.style.display = 'none';
          try { localStorage.removeItem('stago_cfg'); } catch (e) {}
        } else {
          showMessage(form, msgs.success, false);
        }

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
        hp.setAttribute('aria-hidden', 'true');
        hp.setAttribute('aria-label', 'Pole pomocnicze');
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
