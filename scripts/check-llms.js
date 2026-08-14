#!/usr/bin/env node
// Kontrola spójności warstwy dla modeli językowych (llms.txt) ze stroną.
// Właściciel warstwy: Karol (stago-site). Zasada kanonu: warstwa LLM ma
// właściciela, automatyczną kontrolę spójności i dowód działania — sam plik
// nie wystarcza. Uruchamiany przez build.js; build MA PADAĆ na dryfie.
// Historia: llms.txt przez ~3 miesiące obiecywał "transport i montaż w cenie"
// (fałsz — twarda zasada STAGO: transport NIGDY nie jest w cenie) i linkował
// stare adresy .html.

const fs = require('fs');

const llms = fs.readFileSync('llms.txt', 'utf8');
const errors = [];

// 1. Zakazane obietnice — fałsz wobec oferty
if (/transport[^.\n]*w cenie|montaż[^.\n]*w cenie/i.test(llms)) {
  errors.push('llms.txt obiecuje transport/montaż "w cenie" — transport NIGDY nie jest w cenie (zasada z 2026-05-22)');
}
if (/od 4 tygodni/i.test(llms)) {
  errors.push('llms.txt podaje "od 4 tygodni" — strona mówi "4–6 tygodni"');
}

// 2. Stare adresy .html — kanon to clean URLs (CF Pages, commit e14ece1)
const htmlLinks = llms.match(/https:\/\/stago\.com\.pl\/[^\s)]+\.html/g);
if (htmlLinks) {
  errors.push(`llms.txt linkuje stare adresy .html: ${htmlLinks.join(', ')}`);
}

// 3. Każdy linkowany URL musi istnieć jako plik w repo
const links = [...llms.matchAll(/https:\/\/stago\.com\.pl\/([^\s)]*)/g)].map(m => m[1]);
for (const p of links) {
  const clean = p.replace(/\/$/, '');
  const exists = clean === ''
    || fs.existsSync(`${clean}.html`)
    || fs.existsSync(`${clean}/index.html`);
  if (!exists) errors.push(`llms.txt linkuje nieistniejącą stronę: /${p}`);
}

// 4. Cena bazowa = jedno źródło prawdy (strony modeli)
const nordRaw = fs.readFileSync('content/modele/nord.json', 'utf8');
const priceMatch = nordRaw.match(/"price":\s*"od (\d{2})[\s ]?(\d{3}) zł/);
const priceDigits = priceMatch;
if (priceDigits) {
  const canonical = `${priceDigits[1]} ${priceDigits[2]}`;
  const re = new RegExp(`${priceDigits[1]}[\\s ]?${priceDigits[2]}`);
  if (!re.test(llms)) errors.push(`llms.txt nie podaje ceny bazowej ${canonical} zł ze stron modeli — dryf cen`);
}

// 5. Kontakt = spójny z content/pages/kontakt.json
const kontakt = fs.readFileSync('content/pages/kontakt.json', 'utf8');
for (const val of ['509 508 210', 'kontakt@stago.com.pl']) {
  if (kontakt.includes(val) && !llms.includes(val)) {
    errors.push(`llms.txt nie zawiera "${val}" z podstrony kontakt`);
  }
}

// 6. Termin realizacji: jeśli strona przestanie mówić "4–6 tygodni", ten check
// ma paść i wymusić aktualizację obu warstw naraz
const jakKupic = fs.readFileSync('content/pages/jak-kupic.json', 'utf8');
const siteSays46 = /4[–-]6 tygod/i.test(jakKupic);
const llmsSays46 = /4[–-]6 tygod/i.test(llms);
if (siteSays46 !== llmsSays46) {
  errors.push('Rozjazd terminu realizacji między jak-kupic a llms.txt — zaktualizuj OBA');
}

if (errors.length) {
  console.error('✗ check-llms: warstwa LLM rozjechana ze stroną:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exitCode = 1;
} else {
  console.log('✓ check-llms: llms.txt spójny ze stroną');
}
