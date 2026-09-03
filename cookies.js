/* STAGO — GDPR cookies banner v2 (Google Consent Mode v2, tryb advanced)
 * - gtag.js (GA4 G-XZNVTYFPWR) + GTM (GTM-WNJQZHX6) ładowane ZAWSZE,
 *   ale z consent default = denied ustawionym PRZED załadowaniem tagów.
 * - Zgoda w banerze → gtag('consent','update'): analytics → analytics_storage,
 *   marketing → ad_storage + ad_user_data + ad_personalization.
 * - Bez zgody Google dostaje wyłącznie bezcookiesowe pingi (bez identyfikatora
 *   użytkownika) — służą modelowaniu konwersji w GA4/Google Ads.
 * - Atrybucja first-party: gclid/utm z URL → localStorage dopiero po zgodzie;
 *   bez zgody formularz dostaje wyłącznie ogólny rodzaj źródła, bez click ID.
 * - phone_click: klik w link tel: → event GA4 + dataLayer (GTM).
 * - Meta Pixel + TikTok Pixel: ładowane WYŁĄCZNIE po zgodzie marketingowej
 *   (nie mają Consent Mode — każde odpalenie to od razu cookie dostawcy).
 *   Konwersję Lead/SubmitForm wysyła form-handler.js po potwierdzonej wysyłce.
 * - Stores consent in localStorage with a policy version. Legacy choices keep
 *   working for their original scope, but do not authorize new quote telemetry.
 * - Banner appears on first visit. Footer link "Zgody cookies" reopens it.
 * - Strings come from window.STAGO_I18N_COOKIES (set by template) or fallback PL.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'stago_cookie_consent_v1';
  var CONSENT_POLICY_VERSION = '2026-09-03-v1';
  var GTM_ID = 'GTM-WNJQZHX6';
  var GA4_ID = 'G-XZNVTYFPWR';
  // WŁASNY dataset strony („STAGO — strona", założony 2026-08-13).
  // ⚠️ NIE wpinać tu 1483664383140099 („Piksel VSL", lejek agencji na stago.online):
  // tamten dataset ma włączoną bramkę API konwersji (Openbridge), przez co piksel
  // POST-uje zdarzenia na losowe hosty *.on.aws / *.run.app zamiast na
  // www.facebook.com/tr — nasze CSP je blokuje i pomiar milczy (sprawdzone na
  // prodzie 13.08: 10 min nasłuchu, zero zdarzeń). Openbridge wyłącza się tylko
  // w Menedżerze zdarzeń, nie z poziomu strony (fbevents.js bierze tę konfigurację
  // z serwera Mety). Własny dataset = klasyczne /tr, które CSP już przepuszcza.
  var META_PIXEL_ID = '2257244741790961';
  // Puste = piksel TikTok nieaktywny (brak ID; kampanie chodziły na koncie agencji).
  // Wpisanie ID tutaj wystarczy, żeby ruszył — reszta kodu jest gotowa.
  var TIKTOK_PIXEL_ID = '';

  var DEFAULT_STRINGS = {
    title: 'Cookies',
    description: 'Pomóż nam dopasować treści i oferty. Za Twoją zgodą mierzymy, co jest przydatne, oraz skuteczność reklam. Odmowa nie ogranicza działania strony.',
    acceptAll: 'Akceptuję wszystkie',
    onlyNecessary: 'Tylko niezbędne',
    settings: 'Ustawienia',
    savePreferences: 'Zapisz wybór',
    categoryNecessary: 'Niezbędne',
    categoryNecessaryDesc: 'Potrzebne do działania strony i formularzy. Zawsze aktywne.',
    categoryAnalytics: 'Analityczne',
    categoryAnalyticsDesc: 'Pomiar korzystania ze strony i indywidualnej wyceny (czas i oglądane sekcje). AI może podpowiedzieć opiekunowi temat kontaktu, ale nie podejmuje decyzji za Ciebie.',
    categoryMarketing: 'Marketingowe',
    categoryMarketingDesc: 'Pozwala mierzyć skuteczność reklam i lepiej dopasować komunikację.',
    moreInfo: 'Więcej w',
    moreInfoLink: 'Polityce cookies',
    moreInfoHref: 'polityka-cookies.html'
  };

  var S = Object.assign({}, DEFAULT_STRINGS, window.STAGO_I18N_COOKIES || {});

  // ─── CONSENT MODE v2 — defaults PRZED załadowaniem tagów ──────────
  // Neutralizuj legacy kill-switch (stare cache'owane HTML ustawiały go na true).
  window['ga-disable-' + GA4_ID] = false;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  if (typeof window.gtag !== 'function') window.gtag = gtag;

  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID, { anonymize_ip: true });

  // Tagi ładowane bezwarunkowo (tryb advanced) — consent steruje tym, CO wysyłają,
  // nie tym, CZY istnieją. Przed zgodą: wyłącznie cookieless pingi (modelowanie).
  function loadTags() {
    if (window.__STAGO_TAGS_LOADED) return;
    window.__STAGO_TAGS_LOADED = true;
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(g);
    // Tag Manager (GTM-WNJQZHX6) NIE jest ladowany — sprawdzone 2026-08-18:
    // kontener jest pusty (zero tagow), a GA4, piksel Meta, TikTok i konwersje
    // z formularza ida bezposrednio, z pominieciem GTM. Samo jego wczytanie
    // kosztowalo 315 kB, a Google dociagalo przez nie DRUGA kopie gtag.js (489 kB) —
    // razem 804 kB z 1293 kB analityki szlo w prozne.
    // Gdy pojawi sie ktos zarzadzajacy tagami z panelu, wystarczy odkomentowac:
    // var s = document.createElement('script');
    // s.async = true;
    // s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID + '&l=dataLayer';
    // document.head.appendChild(s);
    // window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  }
  loadTags();

  // ─── PIKSELE MARKETINGOWE (Meta, TikTok) ──────────────────────────
  // W przeciwieństwie do tagów Google NIE ładują się bezwarunkowo: startują
  // dopiero po zgodzie marketingowej, bo nie mają odpowiednika Consent Mode
  // i każde ich odpalenie to już cookie po stronie dostawcy.
  // Baza obu snippetów sama emituje PageView przy inicjalizacji.
  function loadMetaPixel() {
    if (window.__STAGO_META_LOADED || !META_PIXEL_ID) return;
    window.__STAGO_META_LOADED = true;
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  function loadTikTokPixel() {
    if (window.__STAGO_TIKTOK_LOADED || !TIKTOK_PIXEL_ID) return;
    window.__STAGO_TIKTOK_LOADED = true;
    /* eslint-disable */
    !function (w, d, t) {
      w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
      ttq.setAndDefer = function (o, m) { o[m] = function () { o.push([m].concat(Array.prototype.slice.call(arguments, 0))); }; };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.instance = function (id) {
        var o = ttq._i[id] || [];
        for (var j = 0; j < ttq.methods.length; j++) ttq.setAndDefer(o, ttq.methods[j]);
        return o;
      };
      ttq.load = function (id, opts) {
        var url = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._i = ttq._i || {}; ttq._i[id] = []; ttq._i[id]._u = url;
        ttq._t = ttq._t || {}; ttq._t[id] = +new Date();
        ttq._o = ttq._o || {}; ttq._o[id] = opts || {};
        var s = d.createElement('script'); s.type = 'text/javascript'; s.async = !0;
        s.src = url + '?sdkid=' + id + '&lib=' + t;
        var f = d.getElementsByTagName('script')[0]; f.parentNode.insertBefore(s, f);
      };
      ttq.load(TIKTOK_PIXEL_ID); ttq.page();
    }(window, document, 'ttq');
    /* eslint-enable */
  }

  function loadMarketingPixels() {
    loadMetaPixel();
    loadTikTokPixel();
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function save(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function apply(state) {
    if (!state) return;
    window.gtag('consent', 'update', {
      analytics_storage: state.analytics ? 'granted' : 'denied',
      ad_storage: state.marketing ? 'granted' : 'denied',
      ad_user_data: state.marketing ? 'granted' : 'denied',
      ad_personalization: state.marketing ? 'granted' : 'denied'
    });
    // Piksele startują wyłącznie po zgodzie marketingowej. Raz załadowanego
    // snippetu nie da się cofnąć bez przeładowania — po odwołaniu zgody
    // przestaje strzelać dopiero od następnej odsłony (guard __STAGO_*_LOADED
    // żyje w window, więc ginie razem ze stroną).
    if (state.marketing) loadMarketingPixels();
    persistAttribution(state);
    window.dataLayer.push({
      event: 'stago_consent_update',
      consent_analytics: !!state.analytics,
      consent_marketing: !!state.marketing
    });
  }

  // ─── ATRYBUCJA FIRST-PARTY (gclid/utm → localStorage PO zgodzie) ───
  // Click ID wymaga marketing=true; same UTM mogą być zachowane przy analytics=true.
  // Bez obu zgód niczego nie zapisujemy w terminalu i ujawniamy formularzowi tylko
  // ogólny rodzaj wejścia (np. google_ads), nigdy unikalny identyfikator kliknięcia.
  var ATTR_KEY = 'stago_attribution_v1';
  var ATTR_TTL_MS = 90 * 24 * 60 * 60 * 1000;
  var CLICK_ID_PARAMS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'msclkid', 'oppref'];
  var ATTR_PARAMS = [
    'gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'msclkid', 'oppref',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'
  ];
  var pendingAttribution = null;

  function filteredAttribution(source, state) {
    if (!source || !state || (!state.analytics && !state.marketing)) return null;
    var result = {};
    for (var key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
      if (CLICK_ID_PARAMS.indexOf(key) !== -1 && !state.marketing) continue;
      result[key] = source[key];
    }
    return result.ts ? result : null;
  }

  function persistAttribution(state) {
    try {
      var allowed = filteredAttribution(pendingAttribution, state);
      if (allowed) localStorage.setItem(ATTR_KEY, JSON.stringify(allowed));
      else if (!state || (!state.analytics && !state.marketing)) localStorage.removeItem(ATTR_KEY);
      else {
        var existing = localStorage.getItem(ATTR_KEY);
        if (existing) {
          var filtered = filteredAttribution(JSON.parse(existing), state);
          if (filtered) localStorage.setItem(ATTR_KEY, JSON.stringify(filtered));
          else localStorage.removeItem(ATTR_KEY);
        }
      }
    } catch (e) {}
  }

  function captureAttribution() {
    try {
      var qs = window.location.search;
      if (!qs || qs.length < 2) return;
      var pairs = qs.substring(1).split('&');
      var found = {};
      var has = false;
      for (var i = 0; i < pairs.length; i++) {
        var eq = pairs[i].indexOf('=');
        if (eq < 1) continue;
        var key = decodeURIComponent(pairs[i].substring(0, eq)).toLowerCase();
        if (ATTR_PARAMS.indexOf(key) === -1) continue;
        var val = decodeURIComponent(pairs[i].substring(eq + 1).replace(/\+/g, ' '));
        if (!val) continue;
        found[key] = String(val).substring(0, 200);
        has = true;
      }
      if (!has) return;
      found.landing_page = window.location.pathname;
      found.ts = Date.now();
      pendingAttribution = found;
      persistAttribution(load());
    } catch (e) {}
  }

  function getAttribution() {
    try {
      var state = load();
      if (!state || (!state.analytics && !state.marketing)) return null;
      var current = filteredAttribution(pendingAttribution, state);
      if (current) return current;
      var raw = localStorage.getItem(ATTR_KEY);
      if (!raw) return null;
      var a = JSON.parse(raw);
      if (!a || !a.ts || (Date.now() - a.ts) > ATTR_TTL_MS) {
        localStorage.removeItem(ATTR_KEY);
        return null;
      }
      return filteredAttribution(a, state);
    } catch (e) { return null; }
  }

  function getAttributionSignal() {
    var a = pendingAttribution;
    if (!a) return null;
    if (a.gclid || a.gbraid || a.wbraid) return 'google_ads';
    if (a.fbclid) return 'meta_ads';
    if (a.ttclid) return 'tiktok_ads';
    if (a.oppref) return 'chatgpt_ads';
    if (a.msclkid) return 'microsoft_ads';
    if (a.utm_source) return 'utm';
    return null;
  }
  captureAttribution();

  window.STAGO_ATTRIBUTION = { get: getAttribution, signal: getAttributionSignal };

  // ─── PHONE CLICK — konwersja miękka (działa też przed zgodą: cookieless ping) ──
  document.addEventListener('click', function (e) {
    var t = e.target;
    var a = t && t.closest ? t.closest('a[href^="tel:"]') : null;
    if (!a) return;
    try {
      var num = (a.getAttribute('href') || '').replace('tel:', '');
      var params = { phone_number: num, page: window.location.pathname };
      window.dataLayer.push({ event: 'phone_click', phone_number: num, page: params.page });
      window.gtag('event', 'phone_click', params);
    } catch (err) {}
  }, true);

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') n.className = attrs[k];
        else if (k === 'text') n.textContent = attrs[k];
        else n.setAttribute(k, attrs[k]);
      });
    }
    if (children) children.forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function makeSwitch(cat, locked) {
    var sw = el('div', {
      'class': 'stago-cookie-switch' + (locked ? ' on locked' : ''),
      'data-cat': cat,
      'role': 'switch',
      'tabindex': locked ? '-1' : '0',
      'aria-checked': locked ? 'true' : 'false'
    });
    if (locked) sw.setAttribute('aria-disabled', 'true');
    return sw;
  }

  function makeCategory(titleText, descText, sw) {
    return el('div', { 'class': 'stago-cookie-cat' }, [
      el('div', { 'class': 'stago-cookie-cat-info' }, [
        el('strong', { 'text': titleText }),
        el('span', { 'text': descText })
      ]),
      sw
    ]);
  }

  var bannerEl = null;

  function styles() {
    if (document.getElementById('stago-cookie-styles')) return;
    var css = document.createElement('style');
    css.id = 'stago-cookie-styles';
    css.textContent = [
      '#stago-cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;background:#fff;color:#1D1D1B;border:1px solid #e8e8e8;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.18);padding:20px 22px;font-family:Inter,system-ui,sans-serif;max-width:720px;margin:0 auto;display:none}',
      '#stago-cookie-banner.show{display:block}',
      '#stago-cookie-banner h3{margin:0 0 8px;font-size:1.1rem;font-weight:800}',
      '#stago-cookie-banner p{margin:0 0 14px;font-size:.92rem;line-height:1.5;color:#444}',
      '#stago-cookie-banner .stago-cookie-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}',
      '#stago-cookie-banner button{padding:10px 18px;border-radius:8px;font-size:.88rem;font-weight:700;cursor:pointer;border:1px solid transparent;font-family:inherit}',
      '#stago-cookie-banner .btn-accept{background:#E8461C;color:#fff;border-color:#E8461C}',
      '#stago-cookie-banner .btn-accept:hover{background:#d23f17}',
      '#stago-cookie-banner .btn-necessary{background:#fff;color:#1D1D1B;border-color:#1D1D1B}',
      '#stago-cookie-banner .btn-necessary:hover{background:#f6f6f6}',
      '#stago-cookie-banner .btn-settings{background:transparent;color:#1D1D1B;border-color:#e0e0e0}',
      '#stago-cookie-banner .btn-settings:hover{border-color:#1D1D1B}',
      '#stago-cookie-banner .stago-cookie-cats{display:none;margin:10px 0 16px}',
      '#stago-cookie-banner.open .stago-cookie-cats{display:block}',
      '#stago-cookie-banner.open .btn-save{display:inline-block}',
      '#stago-cookie-banner .btn-save{display:none;background:#1D1D1B;color:#fff;border-color:#1D1D1B}',
      '#stago-cookie-banner .stago-cookie-cat{display:flex;align-items:start;gap:12px;padding:10px 0;border-top:1px solid #f0f0f0}',
      '#stago-cookie-banner .stago-cookie-cat:first-child{border-top:none}',
      '#stago-cookie-banner .stago-cookie-cat-info{flex:1;min-width:0}',
      '#stago-cookie-banner .stago-cookie-cat-info strong{display:block;font-size:.92rem;font-weight:700;margin-bottom:2px}',
      '#stago-cookie-banner .stago-cookie-cat-info span{font-size:.82rem;color:#666;line-height:1.45}',
      '#stago-cookie-banner .stago-cookie-switch{width:42px;height:24px;border-radius:100px;background:#ddd;position:relative;cursor:pointer;flex-shrink:0;transition:background .2s}',
      '#stago-cookie-banner .stago-cookie-switch::after{content:"";width:18px;height:18px;border-radius:50%;background:#fff;position:absolute;top:3px;left:3px;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.15)}',
      '#stago-cookie-banner .stago-cookie-switch.on{background:#E8461C}',
      '#stago-cookie-banner .stago-cookie-switch.on::after{transform:translateX(18px)}',
      '#stago-cookie-banner .stago-cookie-switch.locked{background:#1D1D1B;cursor:not-allowed}',
      '#stago-cookie-banner .stago-cookie-more{margin-top:8px;font-size:.82rem;color:#666}',
      '#stago-cookie-banner .stago-cookie-more a{color:#E8461C;text-decoration:none}',
      '#stago-cookie-banner .stago-cookie-more a:hover{text-decoration:underline}',
      '@media(max-width:600px){#stago-cookie-banner{left:8px;right:8px;bottom:8px;padding:16px}#stago-cookie-banner .stago-cookie-actions{flex-direction:column-reverse}#stago-cookie-banner button{width:100%}}'
    ].join('');
    document.head.appendChild(css);
  }

  function buildBanner() {
    if (bannerEl) return bannerEl;
    styles();

    var necSwitch = makeSwitch('necessary', true);
    var anaSwitch = makeSwitch('analytics', false);
    var mktSwitch = makeSwitch('marketing', false);

    var btnSettings = el('button', { type: 'button', 'class': 'btn-settings', 'text': S.settings });
    var btnNecessary = el('button', { type: 'button', 'class': 'btn-necessary', 'text': S.onlyNecessary });
    var btnAccept = el('button', { type: 'button', 'class': 'btn-accept', 'text': S.acceptAll });
    var btnSave = el('button', { type: 'button', 'class': 'btn-save', 'text': S.savePreferences });

    var moreLink = el('a', { href: S.moreInfoHref, 'text': S.moreInfoLink });
    var moreP = el('p', { 'class': 'stago-cookie-more' });
    moreP.appendChild(document.createTextNode(S.moreInfo + ' '));
    moreP.appendChild(moreLink);

    bannerEl = el('div', {
      id: 'stago-cookie-banner',
      role: 'dialog',
      'aria-labelledby': 'stago-cookie-title',
      'aria-modal': 'false'
    }, [
      el('h3', { id: 'stago-cookie-title', 'text': S.title }),
      el('p', { 'text': S.description }),
      el('div', { 'class': 'stago-cookie-cats' }, [
        makeCategory(S.categoryNecessary, S.categoryNecessaryDesc, necSwitch),
        makeCategory(S.categoryAnalytics, S.categoryAnalyticsDesc, anaSwitch),
        makeCategory(S.categoryMarketing, S.categoryMarketingDesc, mktSwitch)
      ]),
      el('div', { 'class': 'stago-cookie-actions' }, [btnSettings, btnNecessary, btnAccept, btnSave]),
      moreP
    ]);
    document.body.appendChild(bannerEl);

    btnAccept.addEventListener('click', function () {
      finalize({ necessary: true, analytics: true, marketing: true });
    });
    btnNecessary.addEventListener('click', function () {
      finalize({ necessary: true, analytics: false, marketing: false });
    });
    btnSettings.addEventListener('click', function () {
      bannerEl.classList.add('open');
    });
    btnSave.addEventListener('click', function () {
      finalize({
        necessary: true,
        analytics: anaSwitch.classList.contains('on'),
        marketing: mktSwitch.classList.contains('on')
      });
    });
    [anaSwitch, mktSwitch].forEach(function (sw) {
      function toggle() {
        sw.classList.toggle('on');
        sw.setAttribute('aria-checked', sw.classList.contains('on') ? 'true' : 'false');
      }
      sw.addEventListener('click', toggle);
      sw.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
      });
    });

    return bannerEl;
  }

  function show(initialState) {
    buildBanner();
    if (initialState) {
      var a = bannerEl.querySelector('[data-cat="analytics"]');
      var m = bannerEl.querySelector('[data-cat="marketing"]');
      a.classList.toggle('on', !!initialState.analytics);
      a.setAttribute('aria-checked', initialState.analytics ? 'true' : 'false');
      m.classList.toggle('on', !!initialState.marketing);
      m.setAttribute('aria-checked', initialState.marketing ? 'true' : 'false');
    }
    bannerEl.classList.add('show');
  }

  function hide() {
    if (bannerEl) bannerEl.classList.remove('show', 'open');
  }

  function finalize(state) {
    state.ts = Date.now();
    state.version = CONSENT_POLICY_VERSION;
    save(state);
    apply(state);
    hide();
  }

  var existing = load();
  if (existing) {
    apply(existing);
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { show(); });
    } else {
      show();
    }
  }

  window.STAGO_COOKIES = {
    open: function () { show(load()); },
    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      show();
    },
    state: function () { return load(); }
  };
})();
