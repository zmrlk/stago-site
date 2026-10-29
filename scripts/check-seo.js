#!/usr/bin/env node
// Bramka SEO. Build (build.js) i CI mają paść, gdy indeksowalna strona
// zjedzie z ustaleń: jeden h1, title/description, canonical bez .html,
// hreflang tylko do istniejących wersji, og:url, sitemap = strony
// indeksowalne, brak linków na 404 i na źródła 301, obrazy z alt i
// wymiarami, JSON-LD się parsuje, CSS nie blokuje pierwszego rysowania.
// Uruchomienie: node scripts/check-seo.js

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const HOST = 'https://stago.com.pl';
const TITLE_MAX = 70;
const DESC_MIN = 50;
const DESC_MAX = 165;

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'templates') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return m ? m[2] : null;
}

function meta(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const key = (attr(tag, 'name') || attr(tag, 'property') || '').toLowerCase();
    if (key === name.toLowerCase()) return attr(tag, 'content') || '';
  }
  return null;
}

function cleanUrl(relHtml) {
  const rel = relHtml.replace(/\\/g, '/').replace(/\.html$/, '').replace(/\/index$/, '').replace(/^index$/, '');
  return HOST + (rel === '' ? '/' : '/' + rel);
}

function loadRedirects() {
  const map = new Map();
  const raw = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [from, to] = t.split(/\s+/);
    if (from && to) map.set(from.replace(/^\//, ''), to);
  }
  return map;
}

function pageExists(rel) {
  const clean = rel.replace(/^\//, '').replace(/\.html$/, '').replace(/\/$/, '');
  if (clean === '') return fs.existsSync(path.join(ROOT, 'index.html'));
  if (fs.existsSync(path.join(ROOT, clean + '.html'))) return true;
  if (fs.existsSync(path.join(ROOT, clean, 'index.html'))) return true;
  if (fs.existsSync(path.join(ROOT, rel.replace(/^\//, '')))) return true;
  return false;
}

function headBezNoscript(html) {
  const end = html.search(/<\/head>/i);
  const head = end === -1 ? html.slice(0, 4000) : html.slice(0, end);
  return head.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');
}

function audit() {
  const errors = [];
  const files = walk(ROOT);
  const redirects = loadRedirects();
  const redirectSources = new Set();
  for (const from of redirects.keys()) {
    redirectSources.add(from.replace(/\.html$/, ''));
    redirectSources.add(from);
  }

  const titles = new Map();
  const indexableUrls = [];

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const html = fs.readFileSync(file, 'utf8');
    const robots = meta(html, 'robots') || '';
    const noindex = /noindex/i.test(robots);
    const self = cleanUrl(rel);

    const title = ((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || '').trim();
    const description = meta(html, 'description') || '';
    const canonTag = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i) || [])[0] || '';
    const canon = canonTag ? attr(canonTag, 'href') : '';
    const h1 = html.match(/<h1\b/gi) || [];

    if (!noindex) {
      indexableUrls.push(self);
      if (!title) errors.push(`${rel}: brak <title>`);
      else if (title.length < 15 || title.length > TITLE_MAX) errors.push(`${rel}: title ${title.length} znaków (dozwolone 15–${TITLE_MAX})`);
      if (!description) errors.push(`${rel}: brak meta description`);
      else if (description.length < DESC_MIN || description.length > DESC_MAX) {
        errors.push(`${rel}: description ${description.length} znaków (dozwolone ${DESC_MIN}–${DESC_MAX})`);
      }
      if (title) {
        if (!titles.has(title)) titles.set(title, []);
        titles.get(title).push(rel);
      }
      if (h1.length !== 1) errors.push(`${rel}: h1=${h1.length} (wymagany dokładnie jeden)`);
      if (!canon) errors.push(`${rel}: brak canonical`);
      else if (/\.html(?:$|\?)/.test(canon)) errors.push(`${rel}: canonical z .html (${canon})`);
      else if (/\/(de|cz|sk|hu|it|es)\/\1(\/|$)/.test(canon)) errors.push(`${rel}: canonical z podwójnym prefiksem języka (${canon})`);
      else if (canon.replace(/\/$/, '') !== self.replace(/\/$/, '')) errors.push(`${rel}: canonical ${canon} ≠ ${self}`);

      for (const key of ['og:title', 'og:description', 'og:image', 'og:url']) {
        if (!meta(html, key)) errors.push(`${rel}: brak ${key}`);
      }
      const ogUrl = meta(html, 'og:url') || '';
      if (ogUrl && /\.html(?:$|\?)/.test(ogUrl)) errors.push(`${rel}: og:url z .html`);

      const hreflangs = [...html.matchAll(/<link\b[^>]*rel=["']alternate["'][^>]*>/gi)]
        .map(m => ({ lang: attr(m[0], 'hreflang'), href: attr(m[0], 'href') }))
        .filter(x => x.lang);
      if (hreflangs.length) {
        const selfHref = hreflangs.some(x => x.href && x.href.replace(/\/$/, '') === self.replace(/\/$/, ''));
        if (!selfHref) errors.push(`${rel}: hreflang bez adresu tej strony`);
        for (const h of hreflangs) {
          if (!h.href || !h.href.startsWith(HOST)) errors.push(`${rel}: hreflang ${h.lang} nie jest absolutny`);
          else if (/\.html/.test(h.href)) errors.push(`${rel}: hreflang z .html (${h.href})`);
          else if (h.lang !== 'x-default') {
            const p = h.href.replace(HOST, '').replace(/^\//, '');
            if (!pageExists(p)) errors.push(`${rel}: hreflang ${h.lang} wskazuje na brak strony /${p}`);
          }
        }
      }

      const head = headBezNoscript(html);
      for (const tag of head.match(/<link\b[^>]*>/gi) || []) {
        if ((attr(tag, 'rel') || '').toLowerCase() !== 'stylesheet') continue;
        const href = attr(tag, 'href') || '';
        if (/style\.css|fonts\.googleapis|fonts\.gstatic/i.test(href)) {
          errors.push(`${rel}: render-blocking CSS ${href}`);
        }
      }
    }

    for (const block of html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []) {
      const body = block.replace(/^[\s\S]*?>/, '').replace(/<\/script>$/i, '');
      try { JSON.parse(body); } catch (e) { errors.push(`${rel}: JSON-LD nie parsuje się (${e.message})`); }
    }

    // Obietnica „transport/montaż w cenie” jest fałszywa (zasada STAGO).
    // Pytanie w poradniku („czy transport jest w cenie?”) i zaprzeczenie („nie w cenie”) zostają.
    if (!noindex && /transport i montaż w cenie|montaż w cenie pawilonu|koszt:<\/strong> w cenie pawilonu|im pavillonpreis enthalten|zahrnte v ponuke|v ponuke pavilonu|con transporte, montaje e impuestos|szállítással, telepítéssel és adóval/i.test(html)) {
      errors.push(`${rel}: tekst obiecuje transport lub montaż w cenie pawilonu`);
    }

    const scope = noindex ? null : html;
    if (scope) {
      for (const tag of scope.match(/<img\b[^>]*>/gi) || []) {
        const alt = attr(tag, 'alt');
        const src = attr(tag, 'src') || '';
        if (alt == null) errors.push(`${rel}: img bez alt (${src.slice(0, 80)})`);
        if (!/\.(svg)(\?|$)/i.test(src)) {
          if (!attr(tag, 'width') || !attr(tag, 'height')) errors.push(`${rel}: img bez width/height (${src.slice(0, 80)})`);
        }
      }
      for (const href of [...scope.matchAll(/\shref=["']([^"']+)["']/gi)].map(m => m[1])) {
        if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
        let local = null;
        if (/^https?:\/\//i.test(href)) {
          if (!href.startsWith(HOST)) continue;
          local = href.slice(HOST.length).replace(/^\//, '');
        } else if (href.startsWith('//')) continue;
        else local = path.normalize(path.join(path.dirname(rel), href.split('#')[0].split('?')[0])).replace(/\\/g, '/');
        local = local.replace(/^\//, '');
        const key = local.replace(/\.html$/, '');
        if (redirectSources.has(key) || redirectSources.has(local)) {
          errors.push(`${rel}: link na adres z _redirects (${href})`);
          continue;
        }
        if (!pageExists(local) && !fs.existsSync(path.join(ROOT, local))) {
          errors.push(`${rel}: link na brakującą stronę (${href})`);
        }
      }
    }
  }

  for (const [title, pages] of titles) {
    if (pages.length > 1) errors.push(`zduplikowany title (${pages.length}): ${title} — ${pages.join(', ')}`);
  }

  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const locSet = new Set(locs.map(u => u.replace(/\/$/, '')));
  for (const loc of locs) {
    const p = loc.replace(HOST, '').replace(/^\//, '');
    const key = p.replace(/\.html$/, '');
    if (!pageExists(p)) errors.push(`sitemap: brak pliku dla ${loc}`);
    if (redirectSources.has(key)) errors.push(`sitemap: adres przekierowania ${loc}`);
    const file = p === '' ? 'index.html' : (fs.existsSync(path.join(ROOT, p + '.html')) ? p + '.html' : path.join(p, 'index.html'));
    if (fs.existsSync(path.join(ROOT, file))) {
      const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
      if (/noindex/i.test(meta(html, 'robots') || '')) errors.push(`sitemap: noindex ${loc}`);
    }
    if (/stago-vs-|ranking-producentow|\/test-3d|\/katalog(?:\/|$)/.test(loc)) {
      errors.push(`sitemap: wycofana strona ${loc}`);
    }
  }
  for (const url of indexableUrls) {
    if (!locSet.has(url.replace(/\/$/, ''))) errors.push(`sitemap: brak indeksowalnej strony ${url}`);
  }

  const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  if (!/Sitemap:\s*https:\/\/stago\.com\.pl\/sitemap\.xml/.test(robots)) errors.push('robots.txt: brak Sitemap');

  const wymagane = [
    'stago-vs-defro', 'stago-vs-dampol', 'stago-vs-novi',
    'ranking-producentow-pawilonow', 'test-3d', 'katalog',
    'kontenery-biurowe', 'kontenery-budowlane', 'kontenery-handlowe', 'kontenery-mieszkalne',
  ];
  for (const src of wymagane) {
    if (!redirects.has(src) && !redirects.has(src + '.html')) errors.push(`_redirects: brak 301 dla /${src}`);
  }

  return errors;
}

if (require.main === module) {
  const errors = audit();
  if (errors.length) {
    console.error(`check-seo: ${errors.length} błędów`);
    for (const e of errors.slice(0, 50)) console.error('  ' + e);
    if (errors.length > 50) console.error(`  … i ${errors.length - 50} kolejnych`);
    process.exit(1);
  }
  console.log('check-seo: OK');
}

module.exports = { audit };
