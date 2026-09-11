// Isolated production-handler check; no network, CRM writes or ad conversions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(process.argv[2] || path.join(__dirname, '../form-handler.js'), 'utf8');

function fixture({ fieldName = 'type', ok = true, result = { success: true, lead_id: 'test-lead' },
  consent = true, analytics = true, marketing = true, network = false, invalidJson = false,
  throwGa4 = false, phone = '000000000', email = '', honeypot = '' } = {}) {
  const sent = [], ga4 = [], meta = [], dataLayer = [], messages = [], timers = [];
  const listeners = {}, windowListeners = {};
  let cookieState = { analytics, marketing, version: '2026-09-03-v2' }, clock = Date.now(), serial = 0;
  const fields = [
    { name: 'name', value: 'PRIVATE NAME', type: 'text' },
    { name: 'phone', value: phone, type: 'tel' },
    { name: 'email', value: email, type: 'email' },
    { name: fieldName, value: 'biurowy', type: 'select-one', tagName: 'SELECT' }
  ];
  const button = { tagName: 'BUTTON', textContent: 'Wyślij', style: {} };
  const form = {
    id: 'contact-form', classList: { contains: () => false }, reset() {},
    getBoundingClientRect: () => ({ width: 400, height: 500, top: 50, bottom: 550 }),
    querySelectorAll: () => fields,
    querySelector: (s) => s.includes('button[') ? button
      : s === '[name="consent"]' ? { checked: consent }
      : s === '[name="website_url"]' ? { value: honeypot } : null,
    addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn); },
    appendChild: (e) => { if (e.className === 'form-handler-msg') messages.push(e.textContent); }
  };
  const window = {
    innerHeight: 800,
    location: { pathname: '/kontakt', href: 'https://example.test/kontakt' },
    dataLayer: { push: (e) => dataLayer.push(e) },
    gtag: (...e) => { if (throwGa4) throw new Error('blocked analytics'); ga4.push(e); },
    fbq: (...e) => meta.push(e),
    addEventListener: (name, fn) => { (windowListeners[name] ||= []).push(fn); },
    STAGO_COOKIES: { state: () => cookieState },
    crypto: { randomUUID: () => '11111111-1111-4111-8111-' + String(++serial).padStart(12, '0') }
  };
  vm.runInNewContext(source, {
    window, Date: class extends Date { static now() { return clock; } },
    document: { documentElement: { lang: 'pl' }, cookie: '', readyState: 'complete',
      querySelectorAll: () => [form], createElement: () => ({ style: {}, setAttribute() {} }) },
    fetch: async (_, options) => {
      sent.push(JSON.parse(options.body));
      if (network) throw new TypeError('offline');
      return { ok, status: ok ? 201 : 500, json: async () => {
        if (invalidJson) throw new Error('invalid JSON'); return result;
      } };
    },
    setTimeout: (fn, delay) => { if (delay === 0) timers.push(fn); },
    console: { error() {} }
  });
  function emit(name, target = form) {
    for (const fn of listeners[name] || []) fn({ preventDefault() {}, target });
  }
  return {
    sent, ga4, meta, dataLayer, messages,
    emit, submit: () => emit('submit'),
    invalid: (name, missing = true) => emit('invalid', { name, validity: { valueMissing: missing } }),
    input: () => emit('input', fields[0]),
    async settle() { await new Promise(setImmediate); while (timers.length) timers.shift()(); },
    advance() { clock += 31000; },
    setConsent(state) {
      cookieState = { ...cookieState, ...state };
      for (const fn of windowListeners['stago:consent-update'] || []) fn();
    },
    stages: () => ga4.filter(e => e[1].startsWith('lead_form_')).map(e => e[1].replace('lead_form_', '')),
    errors: () => ga4.filter(e => e[1] === 'lead_form_error').map(e => e[2]),
    leads: () => meta.filter(e => e[0] === 'track' && e[1] === 'Lead')
  };
}

(async () => {
  for (const alias of ['type', 'typ', 'containerType']) {
    const h = fixture({ fieldName: alias });
    h.input(); h.input(); h.submit(); await h.settle();
    assert.equal(h.sent.length, 1);
    assert.equal(h.sent[0].containerType, 'biurowy', alias);
    assert.deepEqual(h.stages(), ['view', 'start', 'submit', 'success']);
    assert.equal(h.dataLayer.filter(e => e.event === 'generate_lead').length, 1);
    assert.equal(h.leads().length, 1);
    assert.equal(h.leads()[0][3].eventID, h.sent[0].event_id, 'Pixel/CAPI dedupe stays intact');
    const attempt = h.ga4.find(e => e[1] === 'lead_form_submit')[2];
    assert.equal(attempt.form_attempt_id, h.sent[0].event_id, 'Attempt links to CRM event_id');
    assert.equal(h.ga4.find(e => e[1] === 'lead_form_success')[2].form_session_id, attempt.form_session_id);
    const wire = JSON.stringify([h.ga4, h.meta, h.dataLayer]);
    assert.ok(!wire.includes('"000000000"') && !wire.includes('PRIVATE NAME'), 'No field values in analytics');
  }
  const native = fixture();
  native.invalid('name'); native.invalid('consent'); await native.settle();
  assert.deepEqual(native.stages(), ['view', 'start', 'submit', 'error']);
  assert.equal(native.errors()[0].field_name, 'name');
  assert.equal(native.sent.length, 0, 'Native invalid does not POST');
  const firstId = native.errors()[0].form_attempt_id;
  native.submit(); await native.settle();
  assert.notEqual(native.sent[0].event_id, firstId, 'Correction is a separate attempt');
  assert.equal(native.leads().length, 1);

  for (const [options, reason] of [
    [{ consent: false }, 'required'], [{ email: 'invalid' }, 'format'],
    [{ phone: '' }, 'contact_missing'], [{ ok: false }, 'http'],
    [{ network: true }, 'network'], [{ invalidJson: true }, 'response'],
    [{ result: { success: false } }, 'response'], [{ result: { success: true } }, 'response']
  ]) {
    const h = fixture(options); h.submit(); await h.settle();
    assert.equal(h.errors().length, 1, reason);
    assert.equal(h.errors()[0].error_type, reason);
    assert.equal(h.leads().length, 0, 'No Lead for ' + reason);
    assert.equal(h.dataLayer.filter(e => e.event === 'generate_lead').length, 0);
    assert.ok(!h.stages().includes('success'));
  }
  const rate = fixture(); rate.submit(); await rate.settle(); rate.submit(); await rate.settle();
  assert.equal(rate.errors()[0].error_type, 'rate_limit');
  assert.equal(rate.sent.length, 1);
  rate.advance(); rate.submit(); await rate.settle(); assert.equal(rate.sent.length, 2);

  const denied = fixture({ analytics: false, marketing: false });
  denied.input(); denied.submit(); await denied.settle();
  assert.equal(denied.sent.length, 1, 'Tracking consent does not block form');
  assert.equal(denied.stages().length, 0);
  assert.equal(denied.meta.length, 0);
  denied.setConsent({ analytics: true }); denied.input(); denied.input();
  assert.deepEqual(denied.stages(), ['view', 'start'], 'Late consent starts a measured funnel');
  denied.setConsent({ analytics: false }); denied.input();
  assert.deepEqual(denied.stages(), ['view', 'start']);

  const revoked = fixture(); revoked.submit(); revoked.setConsent({ analytics: false, marketing: false });
  await revoked.settle();
  assert.equal(revoked.leads().length, 0, 'Revoking consent while POST runs blocks browser Lead');
  assert.ok(!revoked.stages().includes('success'));
  const adsOnly = fixture({ analytics: false }); adsOnly.submit(); await adsOnly.settle();
  assert.equal(adsOnly.stages().length, 0); assert.equal(adsOnly.leads().length, 1);
  const blocked = fixture({ throwGa4: true }); blocked.submit(); await blocked.settle();
  assert.equal(blocked.sent.length, 1); assert.equal(blocked.leads().length, 1);
  const bot = fixture({ honeypot: 'bot' }); bot.submit(); await bot.settle();
  assert.equal(bot.sent.length, 0); assert.equal(bot.leads().length, 0);
  console.log('PASS: funnel, native validation, retries, HTTP/network/response failures, consent, privacy, CRM confirmation and dedupe');
})().catch(e => { console.error(e); process.exitCode = 1; });
