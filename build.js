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

// Build
const content = JSON.parse(fs.readFileSync('content/index.json', 'utf8'));
const template = fs.readFileSync('templates/index.html', 'utf8');
const html = render(template, content);
fs.writeFileSync('index.html', html);
console.log('Built index.html from template + content');

// Copy static pages (not templated yet)
const staticPages = ['pawilon-handlowy.html', 'kontener-biurowy.html', 'kontener-magazynowy.html'];
// These stay as-is for now — can be templated later
