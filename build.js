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
  { content: 'content/pawilon-handlowy.json', template: 'templates/product.html', output: 'pawilon-handlowy.html' },
  { content: 'content/kontener-biurowy.json', template: 'templates/product.html', output: 'kontener-biurowy.html' },
  { content: 'content/kontener-magazynowy.json', template: 'templates/product.html', output: 'kontener-magazynowy.html' },
  // Blog articles
  { content: 'content/blog/pawilon-handlowy-cena.json', template: 'templates/blog.html', output: 'blog/pawilon-handlowy-cena.html' },
  { content: 'content/blog/kontener-biurowy-cena.json', template: 'templates/blog.html', output: 'blog/kontener-biurowy-cena.html' },
  { content: 'content/blog/pawilon-bez-pozwolenia.json', template: 'templates/blog.html', output: 'blog/pawilon-bez-pozwolenia.html' },
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
