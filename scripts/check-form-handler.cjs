// Isolated production-handler check; no network, CRM writes or ad conversions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../form-handler.js'), 'utf8');

async function submit(fieldName, { ok = true, consent = true } = {}) {
  const sent = [], events = [], messages = [];
  let handler;
  const fields = [
    { name: 'name', value: 'Kontrola lokalna', type: 'text' },
    { name: 'phone', value: '000000000', type: 'tel' },
    { name: fieldName, value: 'biurowy', type: 'select-one', tagName: 'SELECT' }
  ];
  const button = { tagName: 'BUTTON', textContent: 'Wyślij', style: {} };
  const form = {
    id: 'contact-form', classList: { contains: () => false }, reset() {},
    querySelectorAll: () => fields,
    querySelector: (s) => s.includes('button[') ? button : s === '[name="consent"]' ? { checked: consent } : null,
    addEventListener: (_, fn) => { handler = fn; },
    appendChild: (e) => { if (e.className === 'form-handler-msg') messages.push(e.textContent); }
  };
  const window = {
    location: { pathname: '/kontakt', href: 'https://example.test/kontakt' },
    dataLayer: { push: (e) => events.push(e) },
    gtag: (...e) => events.push(e),
    STAGO_COOKIES: { state: () => ({ analytics: true, marketing: true, version: '2026-09-03-v2' }) },
    crypto: { randomUUID: () => '11111111-1111-4111-8111-111111111111' }
  };
  vm.runInNewContext(source, {
    window, document: { documentElement: { lang: 'pl' }, cookie: '', readyState: 'complete',
      querySelectorAll: () => [form], createElement: () => ({ style: {}, setAttribute() {} }) },
    fetch: async (_, options) => { sent.push(JSON.parse(options.body)); return { ok, status: ok ? 200 : 500, json: async () => ({}) }; },
    setTimeout() {}, console: { error() {} }
  });
  handler({ preventDefault() {}, target: form });
  await new Promise(setImmediate);
  return { sent, events, messages };
}

(async () => {
  for (const alias of ['type', 'typ', 'containerType']) {
    const r = await submit(alias);
    assert.equal(r.sent.length, 1);
    assert.equal(r.sent[0].containerType, 'biurowy', alias);
    assert.equal(r.events.length, 2, 'GTM and GA4 paths preserved');
    assert.equal(r.events[0].event_id, r.sent[0].event_id);
    assert.ok(!JSON.stringify(r.events).includes('000000000'), 'No phone in analytics');
  }
  const denied = await submit('type', { consent: false });
  assert.equal(denied.sent.length, 0);
  assert.equal(denied.events.length, 0);
  const failed = await submit('type', { ok: false });
  assert.equal(failed.events.length, 0, 'Failed submission must not count');
  assert.equal(failed.messages.length, 1);
  console.log('PASS: purpose aliases, optional email, consent, success and failure tracking');
})().catch(e => { console.error(e); process.exitCode = 1; });
