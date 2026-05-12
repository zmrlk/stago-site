/* STAGO — GDPR cookies banner v1
 * - Gates GTM (GTM-WNJQZHX6) + GA4 (G-XZNVTYFPWR) + Meta Pixel + TikTok Pixel
 * - Stores consent in localStorage as JSON: { necessary:true, analytics:bool, marketing:bool, ts:number }
 * - Banner appears on first visit. Footer link "Zgody cookies" reopens it.
 * - Strings come from window.STAGO_I18N_COOKIES (set by template) or fallback PL.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'stago_cookie_consent_v1';
  var GTM_ID = 'GTM-WNJQZHX6';
  var GA4_ID = 'G-XZNVTYFPWR';

  var DEFAULT_STRINGS = {
    title: 'Cookies i prywatność',
    description: 'Używamy cookies niezbędnych do działania strony. Za Twoją zgodą uruchomimy cookies analityczne (Google Analytics) i marketingowe (Meta Pixel, TikTok Pixel), żeby mierzyć skuteczność strony i kampanii.',
    acceptAll: 'Akceptuję wszystkie',
    onlyNecessary: 'Tylko niezbędne',
    settings: 'Ustawienia',
    savePreferences: 'Zapisz wybór',
    categoryNecessary: 'Niezbędne',
    categoryNecessaryDesc: 'Wymagane do działania strony, formularzy i zapamiętania ustawień. Zawsze aktywne.',
    categoryAnalytics: 'Analityczne',
    categoryAnalyticsDesc: 'Google Analytics 4 — pomiar ruchu, źródeł i zdarzeń na stronie.',
    categoryMarketing: 'Marketingowe',
    categoryMarketingDesc: 'Meta Pixel i TikTok Pixel — pomiar skuteczności reklam i remarketing.',
    moreInfo: 'Więcej w',
    moreInfoLink: 'Polityce cookies',
    moreInfoHref: 'polityka-cookies.html'
  };

  var S = Object.assign({}, DEFAULT_STRINGS, window.STAGO_I18N_COOKIES || {});

  window['ga-disable-' + GA4_ID] = true;
  window.dataLayer = window.dataLayer || [];

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function save(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function loadGTM() {
    if (window.__STAGO_GTM_LOADED) return;
    window.__STAGO_GTM_LOADED = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID + '&l=dataLayer';
    document.head.appendChild(s);
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  }

  function loadGA4() {
    window['ga-disable-' + GA4_ID] = false;
    if (window.__STAGO_GA4_LOADED) return;
    window.__STAGO_GA4_LOADED = true;
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(g);
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;
    gtag('js', new Date());
    gtag('config', GA4_ID, { anonymize_ip: true });
  }

  function disableGA4() { window['ga-disable-' + GA4_ID] = true; }

  function apply(state) {
    if (!state) return;
    if (state.analytics) {
      loadGTM();
      loadGA4();
    } else {
      disableGA4();
    }
    window.dataLayer.push({
      event: 'stago_consent_update',
      consent_analytics: !!state.analytics,
      consent_marketing: !!state.marketing
    });
  }

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
