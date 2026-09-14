#!/usr/bin/env node
// Public offer only. Inventory, customer prices and the ERP export key never enter this feed.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const fields = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand', 'product_type'];
const csv = (v) => `"${String(v).replace(/"/g, '""')}"`;
const money = (cents) => (cents / 100).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function renderFeed(models) {
  assert(Array.isArray(models) && models.length > 0, 'Empty offer: keep the previous feed');
  const ids = new Set();
  const rows = models.map((m) => {
    assert(/^[A-Z0-9_-]{1,40}$/.test(m.code) && !ids.has(m.code), 'Invalid or duplicate model code');
    ids.add(m.code);
    assert(typeof m.desc_pl === 'string' && m.desc_pl.trim(), `Missing description: ${m.code}`);
    assert(typeof m.image_url === 'string' && m.image_url.trim(), `Missing image: ${m.code}`);
    // Uploads may require an ERP session. Use the model's already-public website picture.
    const source = m.image_url.startsWith('/uploads/')
      ? JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'modele', `${m.code.toLowerCase()}.json`), 'utf8')).meta.ogImage
      : m.image_url;
    const image = new URL(source, 'https://erp.stago.com.pl');
    assert(image.protocol === 'https:' && ['erp.stago.com.pl', 'stago.com.pl'].includes(image.hostname), 'Untrusted image origin');
    assert(!image.search && !image.username && !image.password, 'Image URL must not contain credentials or query parameters');
    const raw = String(m.price_pln);
    assert(/^\d+(\.\d{1,2})?$/.test(raw), `Missing or invalid price: ${m.code}`);
    const [units, fraction = ''] = raw.split('.');
    const net = Number(units) * 100 + Number(fraction.padEnd(2, '0'));
    assert(Number.isSafeInteger(net) && net > 0 && net < 100_000_000, `Invalid price: ${m.code}`);
    const gross = Math.round(net * 123 / 100);
    return [
      `STAGO-${m.code}`, `STAGO ${m.code} — pawilon modułowy na zamówienie`,
      `${m.desc_pl.trim()} Cena od ${money(gross)} zł brutto (${money(net)} zł netto, VAT 23%) dla bazy 4×3 m. Wymiary, elewację, stolarkę i wyposażenie ustalamy indywidualnie. Transport, montaż i termin potwierdzamy w ofercie. Wizualizacja poglądowa przedstawia przykładowy wariant.`,
      'available for order', 'new', `${(gross / 100).toFixed(2)} PLN`,
      `https://stago.com.pl/modele/${m.code.toLowerCase()}.html`, image.href,
      'STAGO', 'Pawilony i kontenery modułowe'
    ];
  });
  return [fields, ...rows].map(row => row.map(csv).join(',')).join('\n') + '\n';
}

function writeFeed(content, dry = false) {
  const file = path.join(__dirname, '..', 'feeds', 'meta-catalog.csv');
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return 0;
  if (!dry) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, content);
    fs.renameSync(temporary, file);
  }
  return 1;
}

module.exports = { renderFeed, writeFeed };
if (require.main === module) {
  if (process.argv.includes('--check')) {
    const item = { code: 'NORD', desc_pl: 'Okna, "szkło"', image_url: '/modele/nord.webp', price_pln: '20564.00' };
    const result = renderFeed([item]);
    assert(result.includes('"25293.72 PLN"'));
    assert(result.includes('Okna, ""szkło""'));
    for (const models of [[], [item, item], [{ ...item, price_pln: null }], [{ ...item, image_url: 'https://example.com/x' }]]) {
      assert.throws(() => renderFeed(models));
    }
    console.log('Meta feed checks: PASS');
  } else {
    const offer = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    console.log(`Meta feed: ${offer.modele.length} items; changed=${writeFeed(renderFeed(offer.modele), process.argv.includes('--dry'))}`);
  }
}
