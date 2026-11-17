// Składa do dist/ wyłącznie pliki strony. Cloudflare Pages (projekt stago):
// build command `node scripts/publish.mjs`, build output directory `dist`.
// Briefy, docs/, content/, templates/, scripts/, .github/, build.js i package.json
// nie trafiają na stago.com.pl, nawet gdy ktoś je doda do repo.
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'dist';
const KATALOGI = ['assets', 'blog', 'cz', 'de', 'es', 'hu', 'it', 'sk', 'modele', 'pawilony', 'zastosowania', 'feeds'];
const W_GLOWNYM = /\.(html|css|png|jpe?g|webp|svg|ico)$|^(robots\.txt|llms\.txt|sitemap.*\.xml|_redirects|_headers)$/;
const NIGDY = /\.(md|ya?ml|cjs|mjs|ts|sh|py|env|log)$|(^|\/)\./;

const kopiuj = (p) => {
  fs.mkdirSync(path.dirname(path.join(OUT, p)), { recursive: true });
  fs.copyFileSync(p, path.join(OUT, p));
};
const plik = (p) => fs.existsSync(p) && fs.statSync(p).isFile();

fs.rmSync(OUT, { recursive: true, force: true });
const glowne = fs.readdirSync('.').filter(plik);
glowne.filter((f) => W_GLOWNYM.test(f)).forEach(kopiuj);
for (const k of KATALOGI) {
  for (const f of fs.readdirSync(k, { recursive: true })) {
    const p = path.join(k, f);
    if (plik(p) && !NIGDY.test(p)) kopiuj(p);
  }
}

const htmle = fs.readdirSync(OUT, { recursive: true }).filter((f) => f.endsWith('.html'));
const caly = htmle.map((f) => fs.readFileSync(path.join(OUT, f), 'utf8')).join('\n');
// JS z katalogu głównego tylko wtedy, gdy ładuje go jakaś strona (build.js zostaje poza).
for (const f of glowne.filter((f) => f.endsWith('.js'))) {
  if (new RegExp(`(^|[/"'])${f.replace(/\./g, '\\.')}([?"'#]|$)`, 'm').test(caly)) kopiuj(f);
}

// Kontrola: odnośnik, który działa w repo, musi działać w dist/. Inaczej build pada,
// a Cloudflare zostawia poprzednie wdrożenie.
const istnieje = (baza, p) => [p, `${p}.html`, path.join(p, 'index.html')].some((x) => plik(path.join(baza, x)));
const braki = new Set();
for (const f of htmle) {
  const html = fs.readFileSync(path.join(OUT, f), 'utf8');
  for (const [, url] of html.matchAll(/(?:src|href)="([^"#?]+)/g)) {
    if (/^[a-z]+:|^\/\//i.test(url)) continue;
    const p = url.startsWith('/') ? url.slice(1) : path.join(path.dirname(f), url);
    if (istnieje('.', p) && !istnieje(OUT, p)) braki.add(`${f} -> ${url}`);
  }
}
if (braki.size) {
  console.error(`publish: brakuje ${braki.size} plików używanych przez stronę:\n${[...braki].join('\n')}`);
  process.exit(1);
}
console.log(`publish: dist/ gotowe, ${fs.readdirSync(OUT, { recursive: true }).filter((f) => plik(path.join(OUT, f))).length} plików`);
