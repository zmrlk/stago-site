#!/usr/bin/env node
// Odświeża <lastmod> w sitemap.xml na podstawie historii gita ŹRÓDŁA strony
// (content/*.json), nie zbudowanego .html — masowy rebuild (np. bump cssV)
// nie może udawać zmiany treści. Strony generowane bez content JSON
// (wojewódzkie, landingi krajów) biorą datę z gita samego .html.
// Uruchamiany przez build.js; ręcznie: node scripts/update-sitemap.js

const fs = require('fs');
const { execFileSync } = require('child_process');

const SITEMAP = 'sitemap.xml';
const HOST = 'https://stago.com.pl';

// clean URL path ("/modele/nord") → plik źródłowy treści
function sourceFor(p) {
  if (p === '/') return 'content/index.json';
  const langRoot = p.match(/^\/(de|cz|sk|hu|it|es)\/$/);
  if (langRoot) return `content/${langRoot[1]}/index.json`;
  const path = p.replace(/^\//, '').replace(/\/$/, '');
  const candidates = [
    `content/${path}.json`,                 // modele/nord, zastosowania/handlowy, blog/x
    path === 'modele' ? 'content/modele-index.json' : null,
    path === 'zastosowania' ? 'content/zastosowania-index.json' : null,
    `content/pages/${path}.json`,           // jak-kupic, faq, cenniki...
    `${path}.html`,                         // wojewódzkie i inne generowane
  ].filter(Boolean);
  return candidates.find(f => fs.existsSync(f)) || null;
}

function gitDate(file) {
  // niezacommitowana zmiana pliku = data dzisiejsza
  const dirty = execFileSync('git', ['status', '--porcelain', '--', file]).toString().trim();
  if (dirty) return new Date().toISOString().slice(0, 10);
  const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', file]).toString().trim();
  return d || null;
}

let xml = fs.readFileSync(SITEMAP, 'utf8');
let updated = 0;
const missing = [];

xml = xml.replace(
  /<url>([\s\S]*?)<loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g,
  (block, pre, loc, post) => {
    const p = loc.replace(HOST, '') || '/';
    const src = sourceFor(p);
    if (!src) { missing.push(loc); return block; }
    const date = gitDate(src);
    if (!date) return block;
    const swapped = (pre + post).includes('<lastmod>')
      ? block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${date}</lastmod>`)
      : block;
    if (swapped !== block) updated++;
    return swapped;
  }
);

fs.writeFileSync(SITEMAP, xml);
console.log(`sitemap: ${updated} wpisów lastmod przeliczonych z gita`);
if (missing.length) {
  console.error(`sitemap: BRAK pliku dla ${missing.length} URL-i:\n  ${missing.join('\n  ')}`);
  process.exitCode = 1;
}
