#!/usr/bin/env node
/**
 * Cennik pawilonów (macierz rozmiar × model) → content/cennik-pawilonow.json.
 *
 * Źródło: content/cennik-pawilonow.csv — eksport arkusza „Wyceny pawilonów.xlsx”
 * (Łukasz R. / Denis Górski, 28.10.2026). Kolumny: rozmiar, szer_m, gl_m, m2, model,
 * podstawa_netto, doplata_modelu_netto, razem_netto, dostepny.
 *
 * Logika: cena = podstawa[rozmiar] + dopłata[model, rozmiar], netto PLN, bez transportu i montażu.
 * Podstawa = pawilon z 2 oknami, drzwiami i podstawowymi obróbkami; dopłata modelu obejmuje
 * elewację modelu i dodatkowe okna/witryny, jeśli model ich wymaga (Karol, 28.10.2026).
 * Pusta dopłata („x” w arkuszu) = model niedostępny w tym rozmiarze (VIEW poniżej 7×3 m).
 *
 * Uruchom po każdej zmianie CSV: node scripts/gen-cennik.js   (build.js robi to sam)
 * --check: nie zapisuje, exit 1 gdy JSON nie zgadza się z CSV.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CSV = path.join(ROOT, 'content', 'cennik-pawilonow.csv');
const OUT = path.join(ROOT, 'content', 'cennik-pawilonow.json');
const MODELS = ['ATRI', 'MILA', 'ICON', 'RYTM', 'NORD', 'LOFT', 'SAGA', 'VIEW', 'DUET', 'CUBE', 'NOIR', 'KIOS'];

function parse(text) {
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const cols = head.split(',');
  return lines.map((l) => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v.trim()])));
}

function build() {
  const rows = parse(fs.readFileSync(CSV, 'utf8'));
  const rozmiary = new Map();
  for (const r of rows) {
    const L = Number(r.szer_m), W = Number(r.gl_m); // „4x3” = długość 4 × szerokość 3
    const key = `${L}x${W}`;
    if (!rozmiary.has(key)) {
      rozmiary.set(key, { rozmiar: key, dlugosc: L, szerokosc: W, m2: L * W, podstawa: Number(r.podstawa_netto), doplaty: {} });
    }
    const model = r.model.toUpperCase();
    if (!MODELS.includes(model)) throw new Error(`Nieznany model w CSV: ${model}`);
    rozmiary.get(key).doplaty[model] = r.dostepny === 'tak' && r.doplata_modelu_netto !== '' ? Number(r.doplata_modelu_netto) : null;
  }
  const lista = [...rozmiary.values()].sort((a, b) => a.szerokosc - b.szerokosc || a.dlugosc - b.dlugosc);
  for (const r of lista) {
    if (!Number.isFinite(r.podstawa) || r.podstawa <= 0) throw new Error(`Brak podstawy dla ${r.rozmiar}`);
    for (const m of MODELS) {
      if (!(m in r.doplaty)) throw new Error(`Brak modelu ${m} dla ${r.rozmiar}`);
      const d = r.doplaty[m];
      if (d !== null && !(Number.isFinite(d) && d >= 0)) throw new Error(`Zła dopłata ${m} ${r.rozmiar}`);
    }
  }
  // „od” dla każdego modelu = najmniejszy dostępny rozmiar
  const od = {};
  for (const m of MODELS) {
    const r = lista.find((x) => x.doplaty[m] !== null);
    const max = [...lista].reverse().find((x) => x.doplaty[m] !== null);
    od[m] = {
      rozmiar: r.rozmiar,
      cena: Math.round((r.podstawa + r.doplaty[m]) * 100) / 100,
      max: Math.round((max.podstawa + max.doplaty[m]) * 100) / 100,
      maxRozmiar: max.rozmiar,
    };
  }
  return {
    _opis: 'GENEROWANE z content/cennik-pawilonow.csv przez scripts/gen-cennik.js — nie edytuj ręcznie.',
    zrodlo: 'Wyceny pawilonów.xlsx (Łukasz R. / Denis Górski, 28.10.2026)',
    waluta: 'PLN',
    netto: true,
    uwagi: 'Cena orientacyjna netto, bez transportu i montażu. Podstawa = 2 okna, drzwi, podstawowe obróbki.',
    modele: MODELS,
    rozmiary: lista,
    od,
  };
}

const json = JSON.stringify(build(), null, 2) + '\n';
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== json) {
    console.error('✗ cennik: content/cennik-pawilonow.json nie zgadza się z CSV — uruchom node scripts/gen-cennik.js');
    process.exit(1);
  }
  console.log('✓ cennik: JSON zgodny z CSV');
} else {
  fs.writeFileSync(OUT, json);
  console.log(`cennik: zapisano ${path.relative(ROOT, OUT)}`);
}
module.exports = { build };
