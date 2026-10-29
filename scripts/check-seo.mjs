// Statyczna kontrola SEO zbudowanej strony (pliki .html w katalogu repo). Bez sieci i zależności.
// Błędy przerywają (exit 1); ostrzeżenia są wypisywane z liczbą i nie przerywają.
// Uruchamianie: node scripts/check-seo.mjs  (po npm run build; też w CI)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'https://stago.com.pl/';
// katalog wersji językowej → kod języka (cz/ to czeski: lang="cs")
const locales = {de: 'de', cz: 'cs', sk: 'sk', hu: 'hu', it: 'it', es: 'es'};
const skipDirs = new Set(['.git', '.github', 'node_modules', 'templates', 'content', 'scripts', 'assets', 'feeds']);
const errors = [];
const warnings = {};
const warn = (kind, item) => (warnings[kind] ??= []).push(item);

const htmlFiles = [];
(function walk(directory) {
  for (const item of fs.readdirSync(directory, {withFileTypes: true})) {
    if (item.isDirectory()) { if (!skipDirs.has(item.name)) walk(path.join(directory, item.name)); }
    else if (item.name.endsWith('.html')) htmlFiles.push(path.relative(root, path.join(directory, item.name)).split(path.sep).join('/'));
  }
})(root);

// Cloudflare Pages: _redirects wygrywa z plikiem, a /x.html → /x (308), /dir/index.html → /dir/
const cleanPath = file => file.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
const redirected = new Set();
for (const line of fs.readFileSync(path.join(root, '_redirects'), 'utf8').split('\n')) {
  const [from] = line.trim().split(/\s+/);
  if (from?.startsWith('/') && !from.includes('*')) redirected.add(from.replace(/^\//, '').replace(/\.html$/, ''));
}

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1];
const named = {amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' '};
const decode = text => text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code) =>
  code[0] !== '#' ? named[code.toLowerCase()] ?? entity
    : String.fromCodePoint(code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1))));
const ldTypes = node => !node || typeof node !== 'object' ? []
  : Array.isArray(node) ? node.flatMap(ldTypes)
  : [...[node['@type']].flat().filter(Boolean), ...Object.values(node).flatMap(ldTypes)];

const pages = {};
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const head = html.split(/<\/head>/i)[0];
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]);
  const meta = name => metas.find(tag => attr(tag, 'name') === name || attr(tag, 'property') === name);
  const content = name => decode(attr(meta(name) ?? '', 'content') ?? '');
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]);
  const dir = file.split('/')[0];
  const jsonld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map(m => {
    try { return JSON.parse(m[1]); } catch { return undefined; }
  });
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
  pages[file] = {
    url: base + cleanPath(file),
    locale: locales[dir] ? dir : 'pl',
    lang: attr(html.match(/<html\b[^>]*>/i)?.[0] ?? '', 'lang'),
    indexable: file !== '404.html' && !/http-equiv="refresh"/i.test(head) && !/noindex/i.test(content('robots'))
      && !redirected.has(cleanPath(file).replace(/\/$/, '')),
    title: decode(head.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim() ?? ''),
    description: content('description'),
    og: ['og:title', 'og:description', 'og:image', 'og:url'].filter(name => !content(name)),
    ogUrl: content('og:url'),
    canonical: links.filter(tag => attr(tag, 'rel') === 'canonical').map(tag => attr(tag, 'href')),
    hreflang: links.filter(tag => attr(tag, 'rel') === 'alternate' && attr(tag, 'hreflang'))
      .map(tag => [attr(tag, 'hreflang'), attr(tag, 'href')]),
    headings: [...html.matchAll(/<h([1-6])\b/gi)].map(m => Number(m[1])),
    imagesWithoutAlt: images.filter(tag => attr(tag, 'alt') === undefined).length,
    imagesWithoutSize: images.filter(tag => !attr(tag, 'width') || !attr(tag, 'height')).length,
    badJsonld: jsonld.filter(block => block === undefined).length,
    types: new Set(jsonld.flatMap(ldTypes)),
  };
}

const indexable = Object.entries(pages).filter(([, page]) => page.indexable);
const byUrl = new Map(indexable.map(([, page]) => [page.url, page]));
for (const [file, page] of indexable) {
  const fail = message => errors.push(`${file}: ${message}`);
  const lang = page.locale === 'pl' ? 'pl' : locales[page.locale];
  if (!page.lang?.startsWith(lang)) fail(`html lang "${page.lang}" is not ${lang}`);
  if (!page.title) fail('missing <title>');
  if (!page.description) fail('missing meta description');
  if (page.canonical.length !== 1 || page.canonical[0] !== page.url) fail(`canonical ${JSON.stringify(page.canonical)} is not ${page.url}`);
  if (page.headings.filter(level => level === 1).length !== 1) fail(`expected exactly one <h1>, found ${page.headings.filter(level => level === 1).length}`);
  if (page.imagesWithoutAlt) fail(`${page.imagesWithoutAlt} <img> without alt`);
  if (page.badJsonld) fail(`${page.badJsonld} JSON-LD block(s) do not parse`);
  if (!page.types.size) fail('missing JSON-LD');
  if (page.ogUrl && page.ogUrl !== page.url) fail(`og:url ${page.ogUrl} is not ${page.url}`);
  if (page.hreflang.length) {
    const alternates = new Map(page.hreflang);
    if (!alternates.has('x-default')) fail('hreflang without x-default');
    if (alternates.get(lang) !== page.url) fail('hreflang without self-reference');
    for (const [code, href] of alternates) {
      const other = byUrl.get(href);
      if (!other) fail(`hreflang ${code} points to a non-indexable or missing page: ${href}`);
      else if (code !== 'x-default' && !other.hreflang.some(([, back]) => back === page.url)) fail(`hreflang ${code} is not reciprocated by ${href}`);
    }
  }

  if (page.og.length) warn('missing Open Graph tags', `${file} (${page.og.join(', ')})`);
  if (page.title.length > 60) warn('title longer than 60 characters', `${file} (${page.title.length})`);
  if (page.description.length > 160) warn('description longer than 160 characters', `${file} (${page.description.length})`);
  if (page.description.length < 70) warn('description shorter than 70 characters', `${file} (${page.description.length})`);
  if (page.headings.some((level, i) => i && level - page.headings[i - 1] > 1)) warn('heading level skipped', file);
  if (page.imagesWithoutSize) warn('<img> without width/height', `${file} (${page.imagesWithoutSize})`);
}

for (const field of ['title', 'description']) {
  const seen = new Map();
  for (const [file, page] of indexable) {
    const key = `${page.locale}\n${page[field]}`;
    seen.set(key, [...(seen.get(key) ?? []), file]);
  }
  for (const files of seen.values()) if (files.length > 1) errors.push(`duplicate ${field} within one locale: ${files.join(', ')}`);
}

const sitemap = [...fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
for (const url of sitemap) if (!byUrl.has(url)) errors.push(`sitemap lists a missing or non-indexable page: ${url}`);
for (const url of byUrl.keys()) if (!sitemap.includes(url)) errors.push(`indexable page missing from sitemap: ${url}`);
if (new Set(sitemap).size !== sitemap.length) errors.push('sitemap lists the same URL more than once');
if (!/^Sitemap: https:\/\/stago\.com\.pl\/sitemap\.xml$/m.test(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8'))) errors.push('robots.txt does not point to https://stago.com.pl/sitemap.xml');

for (const [kind, items] of Object.entries(warnings)) {
  console.log(`WARN ${kind}: ${items.length} of ${indexable.length} pages`);
  for (const item of items) console.log(`  ${item}`);
}
if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`);
  const failed = new Set(errors.map(error => error.split(':')[0])).size;
  console.error(`FAIL: ${errors.length} SEO errors (${failed} files/sources) in ${indexable.length} indexable of ${htmlFiles.length} HTML files.`);
  process.exit(1);
}
console.log(`PASS: ${indexable.length} indexable of ${htmlFiles.length} HTML files, sitemap ${sitemap.length} of ${byUrl.size} pages; canonical, hreflang, h1, alt, og:url and JSON-LD checked.`);
