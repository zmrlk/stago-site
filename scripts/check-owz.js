#!/usr/bin/env node
// Uruchom z katalogu repo: node scripts/check-owz.js. Bez builda i połączeń sieciowych.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const url = 'https://erp.stago.com.pl/api/public/owz.pdf';
const locales = ['pl', 'de', 'cz', 'sk', 'hu', 'it', 'es'];
const labels = Object.fromEntries(locales.map(lang => [lang, JSON.parse(fs.readFileSync(`content/i18n/${lang}.json`, 'utf8')).footer.owz]));
const files = execFileSync('git', ['ls-files', '*.html'], { encoding: 'utf8' }).trim().split('\n');
const counts = Object.fromEntries(locales.map(lang => [lang, 0]));
let templates = 0;
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const footer = html.match(/<div class="footer-legal">([\s\S]*?)<\/div>/);
  if (!footer) continue;
  assert.equal(html.split(url).length - 1, 1, `${file}: dokładnie jeden link OWZ`);
  const template = file.startsWith('templates/');
  const lang = locales.includes(file.split('/')[0]) ? file.split('/')[0] : 'pl';
  const label = template && !['templates/blog.html', 'templates/product.html'].includes(file) ? '{{{ui.footer.owz}}}' : labels[lang];
  assert(label, `${file}: brak etykiety`);
  assert(footer[1].includes(`<a href="${url}" target="_blank" rel="noopener">${label}</a>`), `${file}: link/etykieta`);
  if (template) templates++; else counts[lang]++;
}
for (const lang of locales) assert(counts[lang] > 0, `${lang}: brak stopek OWZ`);
assert.equal(templates, 8);
console.log(JSON.stringify({ status: 'PASS', templates, pages: counts, network: false, build: false }));
