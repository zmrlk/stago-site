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
  // Wersje językowe: /de/faq → content/de/pages/faq.json, /de/modele → content/de/modele-index.json
  const lang = path.match(/^(de|cz|sk|hu|it|es)\/(.+)$/);
  const langCandidates = lang ? [
    `content/${lang[1]}/${lang[2]}.json`,
    lang[2] === 'modele' ? `content/${lang[1]}/modele-index.json` : null,
    lang[2] === 'zastosowania' ? `content/${lang[1]}/zastosowania-index.json` : null,
    `content/${lang[1]}/pages/${lang[2]}.json`,
  ] : [];
  const candidates = [
    ...langCandidates,
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

// ── Podstrony wersji językowych (cz/de/es/hu/it/sk) ──
// Blok między znacznikami jest generowany od nowa przy każdym buildzie: każda zbudowana
// podstrona językowa, której polski odpowiednik jest w sitemapie, trafia do mapy.
// Strony główne języków (/de/ itd.) zostają w ręcznej sekcji „LANDINGI KRAJOWE”.
const LANGS = ['cz', 'de', 'es', 'hu', 'it', 'sk'];
const START = '  <!-- WERSJE JĘZYKOWE — podstrony (generowane przez scripts/update-sitemap.js, nie edytuj ręcznie) -->';
const END = '  <!-- /WERSJE JĘZYKOWE -->';
xml = xml.replace(new RegExp(`\\n?${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '');
const plPaths = new Set([...xml.matchAll(/<loc>https:\/\/stago\.com\.pl\/([^<]*)<\/loc>/g)].map(m => m[1].replace(/\/$/, '')));
function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? htmlFiles(`${dir}/${e.name}`) : e.name.endsWith('.html') ? [`${dir}/${e.name}`] : []);
}
const langUrls = [];
for (const lang of LANGS) {
  if (!fs.existsSync(lang)) continue;
  for (const f of htmlFiles(lang).sort()) {
    const rest = f.slice(lang.length + 1).replace(/\.html$/, '');
    if (rest === 'index') continue;
    if (!plPaths.has(rest)) continue; // tylko strony, które w PL są w mapie (bez regulaminów itp., jeśli PL ich nie ma)
    if (plPaths.has(`${lang}/${rest}`)) continue;
    langUrls.push(`  <url><loc>${HOST}/${lang}/${rest}</loc><lastmod>2026-01-01</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
  }
}
if (langUrls.length) xml = xml.replace('</urlset>', `${START}\n${langUrls.join('\n')}\n${END}\n</urlset>`);
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
console.log(`sitemap: ${updated} wpisów lastmod przeliczonych z gita, ${langUrls.length} podstron językowych`);
if (missing.length) {
  console.error(`sitemap: BRAK pliku dla ${missing.length} URL-i:\n  ${missing.join('\n  ')}`);
  process.exitCode = 1;
}
