const fs = require('fs');
const path = require('path');

// ── Mini Mustache renderer ──
function render(template, data) {
  template = template.replace(/\{\{#(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, inner) => {
    const val = resolve(data, key);
    if (Array.isArray(val)) return val.map(item => render(inner, { ...data, ...item })).join('');
    if (val) return render(inner, data);
    return '';
  });
  template = template.replace(/\{\{\{(\w+(?:\.\w+)*)\}\}\}/g, (_, key) => {
    const val = resolve(data, key);
    return val != null ? String(val) : '';
  });
  template = template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, key) => {
    const val = resolve(data, key);
    return val != null ? escapeHtml(String(val)) : '';
  });
  return template;
}

function resolve(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : ''), obj);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── i18n config ──
const LANGS = {
  pl: { dir: '', i18n: 'content/i18n/pl.json' },
  de: { dir: 'de', i18n: 'content/i18n/de.json' },
  cz: { dir: 'cz', i18n: 'content/i18n/cz.json' },
  sk: { dir: 'sk', i18n: 'content/i18n/sk.json' },
  hu: { dir: 'hu', i18n: 'content/i18n/hu.json' },
  it: { dir: 'it', i18n: 'content/i18n/it.json' },
  es: { dir: 'es', i18n: 'content/i18n/es.json' },
};

const MODELS = ['atri','mila','icon','rytm','nord','loft','saga','view','duet','cube','noir','kios'];
const USES = ['handlowy','gastronomiczny','biurowy','uslugowy','socjalny','mieszkalny','specjalny'];

// ── Page definitions ──
// Each page: { content, template, output }
// For i18n: content path is remapped to content/{lang}/...

function getPages() {
  return [
    // Homepage
    { content: 'index.json', template: 'templates/index.html', output: 'index.html', i18n: true },
    // Konfigurator (PL only)
    { content: 'konfigurator.json', template: 'templates/konfigurator.html', output: 'konfigurator.html', i18n: false },
    // Blog articles (PL only)
    ...['pawilon-handlowy-cena','kontener-biurowy-cena','pawilon-bez-pozwolenia','cennik-pawilonow-2026',
       'pawilony-modulowe-kielce','pawilony-modulowe-krakow','pawilony-modulowe-katowice',
       'pawilony-modulowe-warszawa','pawilony-modulowe-lodz',
       'pawilony-modulowe-wroclaw','pawilony-modulowe-poznan','pawilony-modulowe-gdansk',
       'pawilony-modulowe-rzeszow','pawilony-modulowe-lublin','pawilony-modulowe-szczecin',
       'pawilony-modulowe-bydgoszcz','pawilony-modulowe-bialystok',
       'pawilon-handlowy-producent','kontener-biurowy-producent','pawilon-gastronomiczny',
       'kontener-uslugowy','dom-modulowy-producent',
       'jak-ogrzac-pawilon','jak-przygotowac-teren-pod-pawilon',
       'pawilon-modulowy-zalety-wady','jak-podlaczyc-media-do-kontenera',
       'pawilon-na-dzialalnosc-gospodarcza',
       'ile-kosztuje-utrzymanie-pawilonu','jak-przygotowac-kontener-na-zime',
       'czy-warto-kupic-pawilon-modulowy','pawilon-modulowy-vs-tradycyjny',
       'jak-ocieplic-kontener'].map(s => ({
      content: `blog/${s}.json`, template: 'templates/blog.html', output: `blog/${s}.html`, i18n: false
    })),
    // Modele hub + models
    { content: 'modele-index.json', template: 'templates/modele-hub.html', output: 'modele.html', i18n: true },
    ...MODELS.map(s => ({
      content: `modele/${s}.json`, template: 'templates/model.html', output: `modele/${s}.html`, i18n: true
    })),
    // Zastosowania hub + uses
    { content: 'zastosowania-index.json', template: 'templates/zastosowania-hub.html', output: 'zastosowania.html', i18n: true },
    ...USES.map(s => ({
      content: `zastosowania/${s}.json`, template: 'templates/zastosowanie.html', output: `zastosowania/${s}.html`, i18n: true
    })),
    // Static pages (i18n via page.html template)
    ...['faq','kontakt','realizacje','finansowanie','jak-kupic','technologia',
       'pawilon-vs-najem','dostepne-od-reki','polityka-prywatnosci','regulamin'].map(s => ({
      content: `pages/${s}.json`, template: 'templates/page.html', output: `${s}.html`, i18n: true
    })),
    // SEO landing pages (PL only for now)
    ...['pawilony-sprzedaz','pawilony-pod-klucz','cennik-pawilonow-handlowych',
       'cennik-kontenerow-biurowych','pawilon-bez-pozwolenia-przepisy',
       'stago-vs-dampol','stago-vs-novi','stago-vs-defro','ranking-producentow-pawilonow',
       'producent-kontenerow-modulowych','pawilon-na-dzialke'].map(s => ({
      content: `pages/${s}.json`, template: 'templates/page.html', output: `${s}.html`, i18n: false
    })),
  ];
}

// ── Hreflang generation ──
function hreflangTags(pagePath) {
  const tags = [];
  for (const [langKey, cfg] of Object.entries(LANGS)) {
    const i18nData = JSON.parse(fs.readFileSync(cfg.i18n, 'utf8'));
    const langCode = i18nData.lang; // 'pl', 'de', 'cs', 'sk', 'hu', 'it', 'es'
    const prefix = cfg.dir ? cfg.dir + '/' : '';
    const url = `https://stago.com.pl/${prefix}${pagePath}`;
    tags.push(`<link rel="alternate" hreflang="${langCode}" href="${url}">`);
  }
  // x-default → PL
  tags.push(`<link rel="alternate" hreflang="x-default" href="https://stago.com.pl/${pagePath}">`);
  return tags.join('\n  ');
}

// ── Compute path prefixes ──
function computeRoot(outputPath) {
  const depth = outputPath.split('/').length - 1;
  return '../'.repeat(depth);
}

function computePageRoot(outputPath, langDir) {
  const root = computeRoot(outputPath);
  return root + (langDir ? langDir + '/' : '');
}

// ── Adjust asset paths in content data for i18n ──
// i18n pages are 1 level deeper than PL equivalents,
// so asset paths (../assets/...) need an extra ../
function adjustAssetPaths(obj, extraPrefix) {
  if (!extraPrefix) return obj;
  return JSON.parse(JSON.stringify(obj), (key, value) => {
    if (typeof value !== 'string') return value;
    // Short values: adjust paths starting with assets/ or ../assets/
    if (value.match(/^(\.\.\/)*assets\//)) return extraPrefix + value;
    // Long values (body HTML): adjust asset paths inside HTML attributes
    if (value.length > 500) {
      return value
        .replace(/(src|href)="((?:\.\.\/)*assets\/)/g, `$1="${extraPrefix}$2`)
        .replace(/url\(((?:\.\.\/)*assets\/)/g, `url(${extraPrefix}$1`)
        .replace(/(srcset=")((?:\.\.\/)*assets\/)/g, `$1${extraPrefix}$2`);
    }
    return value;
  });
}

// ── Build ──
function buildPage({ content: contentRel, template: tmplPath, output, i18n: isI18n }, lang, langCfg) {
  const langDir = langCfg.dir;
  const isPl = lang === 'pl';

  // Content path: PL uses content/xxx.json, others use content/{lang}/xxx.json
  const contentPath = isPl ? `content/${contentRel}` : `content/${lang}/${contentRel}`;

  // Skip if content file doesn't exist for this language
  if (!fs.existsSync(contentPath)) return null;

  // Load content + i18n
  let data = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  const ui = JSON.parse(fs.readFileSync(langCfg.i18n, 'utf8'));

  // For i18n: adjust asset paths (add ../ because pages are 1 level deeper)
  if (!isPl) {
    data = adjustAssetPaths(data, '../');
  }

  // For i18n: adjust canonical URL
  if (!isPl && data.meta && data.meta.canonical) {
    data.meta.canonical = data.meta.canonical.replace(
      'https://stago.com.pl/',
      `https://stago.com.pl/${langDir}/`
    );
  }

  // Compute output path
  const outputPath = langDir ? `${langDir}/${output}` : output;

  // Set path prefixes
  data.root = computeRoot(outputPath);
  data.pageRoot = computePageRoot(outputPath, langDir);
  data.pagePath = output; // e.g. "modele/nord.html" — used by language switcher
  data.ui = ui;

  // Nav CTA href: PL uses konfigurator, export uses mailto from i18n
  if (isPl) {
    data.navCtaHref = data.pageRoot + 'konfigurator.html';
  } else {
    data.navCtaHref = ui.cta.ctaHref || (data.pageRoot + 'konfigurator.html');
  }

  // Hreflang tags (inject before </head>)
  const hreflang = hreflangTags(output);

  // Load and render template
  const tmpl = fs.readFileSync(tmplPath, 'utf8');
  let html = render(tmpl, data);

  // Inject hreflang before </head>
  if (isI18n) {
    html = html.replace('</head>', `  ${hreflang}\n</head>`);
  }

  // Ensure output directory exists
  const outDir = path.dirname(outputPath);
  if (outDir !== '.') fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(outputPath, html);
  return outputPath;
}

// ── Main ──
const pages = getPages();
let builtCount = 0;
let skippedCount = 0;

for (const page of pages) {
  for (const [lang, cfg] of Object.entries(LANGS)) {
    // Skip non-PL for pages that aren't i18n
    if (lang !== 'pl' && !page.i18n) continue;

    const result = buildPage(page, lang, cfg);
    if (result) {
      console.log(`Built ${result}`);
      builtCount++;
    } else if (lang !== 'pl') {
      skippedCount++;
    }
  }
}

console.log(`\n✓ ${builtCount} pages built, ${skippedCount} skipped (no content)`);
