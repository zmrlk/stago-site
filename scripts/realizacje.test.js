const assert = require('node:assert/strict');
const { publicLabel, karta, przepiszSiatki } = require('./oferta-sync');

for (const code of ['D3S7', 'M8Q316', 'B4N615', 'C7V114', 'K3Q4', 'STA-2026-0188_D3S7', 'STAGO-2026-0188']) {
  assert.equal(publicLabel(`Pawilon ${code}`), 'Pawilon');
  const card = karta({ label: `Pawilon ${code} · przy hali` }, 'rz-test');
  assert(!card.includes(code));
  assert(card.includes('alt="Pawilon · przy hali"'));
}
assert.equal(publicLabel('8 × 4 m, RAL 7016, trzy okna'), '8 × 4 m, RAL 7016, trzy okna');
assert.equal(publicLabel('STA-2026-0212'), 'Realizacja STAGO');
assert(karta({ label: '<img onerror="bad">' }, 'rz-test').includes('&lt;img onerror=&quot;bad&quot;&gt;'));
const source = require('../content/pages/realizacje.json').body;
const refreshed = przepiszSiatki(source, [karta({label:'Pawilon D3S7'}, 'rz-test')], [karta({label:'Wnętrze K3Q4'}, 'rw-test')]);
assert(refreshed && !refreshed.includes('D3S7') && !refreshed.includes('K3Q4'));
// Karol 16.11: na stronie same zdjęcia — bez podpisów pod zdjęciami i bez opisów nad galeriami (podpis z ERP tylko w alt).
assert(!refreshed.includes('realizacja-label') && !karta({ label: 'Lamele narożne' }, 'rz-test').includes('realizacja-label'));
assert(!/<p class="section-sub"[^>]*>[^<]*<\/p>\s*<div class="realizacje-grid"/.test(source));
assert(refreshed.includes('class="gallery-switch"'));
assert(refreshed.indexOf('class="container gallery-note"') > refreshed.indexOf('rw-test.webp'));
console.log('PASS: alts omit serials; gallery has no captions or section descriptions; ERP refresh preserves navigation and bottom note.');
