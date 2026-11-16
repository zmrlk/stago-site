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
for (const f of ['pages', 'cz/pages', 'de/pages', 'es/pages', 'hu/pages', 'it/pages', 'sk/pages']) {
  const body = require(`../content/${f}/realizacje.json`).body;
  assert(!body.includes('realizacja-label'), f);
  assert(!/<p class="section-sub"[^>]*>[^<]*<\/p>\s*<div class="realizacje-grid"/.test(body), f);
}
assert(!require('fs').readFileSync(require('path').join(__dirname, '../templates/index.html'), 'utf8').includes('realizacja-label'));
// Pierwsza synchronizacja po 16.11 trafia na stary układ: karty z podpisem muszą zniknąć razem z kartą, a otoczenie zostać.
const stary = '<h2>A</h2><div class="realizacje-grid" style="x">\n<div class="realizacja-card"><img src="a.webp" alt="A"><div class="realizacja-label">Lamele</div></div>\n</div><h2>B</h2><div class="realizacje-grid">\n<div class="realizacja-card"><img src="b.webp" alt="B"><div class="realizacja-label">Kuchnia</div></div>\n</div><p class="gallery-note">N</p>';
const zeStarego = przepiszSiatki(stary, [karta({ label: 'X' }, 'rz-nowe')], [karta({ label: 'Y' }, 'rw-nowe')]);
assert(zeStarego && !zeStarego.includes('realizacja-label') && !zeStarego.includes('a.webp') && !zeStarego.includes('b.webp'));
assert(zeStarego.startsWith('<h2>A</h2>') && zeStarego.includes('</div><h2>B</h2>') && zeStarego.endsWith('</div><p class="gallery-note">N</p>'));
assert(refreshed.includes('class="gallery-switch"'));
assert(refreshed.indexOf('class="container gallery-note"') > refreshed.indexOf('rw-test.webp'));
console.log('PASS: alts omit serials; gallery has no captions or section descriptions; ERP refresh preserves navigation and bottom note.');
