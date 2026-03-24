const fs = require('fs');
const path = require('path');

// Mini Mustache renderer — handles {{var}}, {{{raw}}}, {{#arr}}...{{/arr}}
function render(template, data) {
  // Sections: {{#key}}...{{/key}}
  template = template.replace(/\{\{#(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, inner) => {
    const val = resolve(data, key);
    if (Array.isArray(val)) return val.map(item => render(inner, { ...data, ...item })).join('');
    if (val) return render(inner, data);
    return '';
  });
  // Raw (unescaped): {{{key}}}
  template = template.replace(/\{\{\{(\w+(?:\.\w+)*)\}\}\}/g, (_, key) => {
    const val = resolve(data, key);
    return val != null ? String(val) : '';
  });
  // Escaped: {{key}}
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

// ── Build all pages ──

const pages = [
  // Homepage
  { content: 'content/index.json', template: 'templates/index.html', output: 'index.html' },
  // Product pages
  { content: 'content/products/pawilon-handlowy.json', template: 'templates/product.html', output: 'pawilon-handlowy.html' },
  { content: 'content/products/kontener-biurowy.json', template: 'templates/product.html', output: 'kontener-biurowy.html' },
  { content: 'content/products/kontener-magazynowy.json', template: 'templates/product.html', output: 'kontener-magazynowy.html' },
  { content: 'content/products/pawilon-mieszkalny.json', template: 'templates/product.html', output: 'pawilon-mieszkalny.html' },
  { content: 'content/products/kontener-sanitarny.json', template: 'templates/product.html', output: 'kontener-sanitarny.html' },
  { content: 'content/products/pawilon-premium.json', template: 'templates/product.html', output: 'pawilon-premium.html' },
  // Konfigurator
  { content: 'content/konfigurator.json', template: 'templates/konfigurator.html', output: 'konfigurator.html' },
  // Blog articles
  { content: 'content/blog/pawilon-handlowy-cena.json', template: 'templates/blog.html', output: 'blog/pawilon-handlowy-cena.html' },
  { content: 'content/blog/kontener-biurowy-cena.json', template: 'templates/blog.html', output: 'blog/kontener-biurowy-cena.html' },
  { content: 'content/blog/pawilon-bez-pozwolenia.json', template: 'templates/blog.html', output: 'blog/pawilon-bez-pozwolenia.html' },
  { content: 'content/blog/cennik-pawilonow-2026.json', template: 'templates/blog.html', output: 'blog/cennik-pawilonow-2026.html' },
  { content: 'content/blog/pawilony-modulowe-kielce.json', template: 'templates/blog.html', output: 'blog/pawilony-modulowe-kielce.html' },
  { content: 'content/blog/pawilony-modulowe-krakow.json', template: 'templates/blog.html', output: 'blog/pawilony-modulowe-krakow.html' },
  { content: 'content/blog/pawilony-modulowe-katowice.json', template: 'templates/blog.html', output: 'blog/pawilony-modulowe-katowice.html' },
  { content: 'content/blog/pawilony-modulowe-warszawa.json', template: 'templates/blog.html', output: 'blog/pawilony-modulowe-warszawa.html' },
  { content: 'content/blog/pawilony-modulowe-lodz.json', template: 'templates/blog.html', output: 'blog/pawilony-modulowe-lodz.html' },
  // Use-case SEO landing pages
  { content: 'content/blog/pawilon-handlowy-producent.json', template: 'templates/blog.html', output: 'blog/pawilon-handlowy-producent.html' },
  { content: 'content/blog/kontener-biurowy-producent.json', template: 'templates/blog.html', output: 'blog/kontener-biurowy-producent.html' },
  { content: 'content/blog/pawilon-gastronomiczny.json', template: 'templates/blog.html', output: 'blog/pawilon-gastronomiczny.html' },
  { content: 'content/blog/kontener-uslugowy.json', template: 'templates/blog.html', output: 'blog/kontener-uslugowy.html' },
  { content: 'content/blog/dom-modulowy-producent.json', template: 'templates/blog.html', output: 'blog/dom-modulowy-producent.html' },
];

pages.forEach(({ content: contentPath, template: templatePath, output }) => {
  const data = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  const tmpl = fs.readFileSync(templatePath, 'utf8');
  const html = render(tmpl, data);
  // Ensure output directory exists
  const outDir = path.dirname(output);
  if (outDir !== '.') fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(output, html);
  console.log(`Built ${output}`);
});
