#!/usr/bin/env node
/**
 * Oferta z ERP → strona (plan v2 po radzie 04.09 i 07.09: ERP NIE pushuje do repo strony;
 * strona sama pobiera `oferta.json` i builduje — jeden pisarz do repo = ten workflow).
 *
 * Co robi:
 *  1. GET $OFERTA_URL?key=$OFERTA_PUBLIC_KEY (ERP: /api/public/oferta.json).
 *  2. Dla każdego modelu z ERP: content/modele/<code>.json (PL) → hero.price „od 20 564 zł",
 *     content/<lang>/modele/<code>.json → hero.price z kwotą € (reguła kanonu: ERP liczy € z NBP+5 gr),
 *     jsonLd.lowPrice = PLN we wszystkich językach (schema = PLN, jak dotąd).
 *     Model bez ceny (wycena indywidualna) → plików nie ruszamy.
 *  3. Wypisuje, co zmienił; exit 0 zawsze gdy pobranie się udało (brak zmian = OK).
 * Zero zależności — czysty Node 18+. Uruchom lokalnie: OFERTA_PUBLIC_KEY=... node scripts/oferta-sync.js --dry
 */
const fs = require('fs');
const path = require('path');
const { renderFeed, writeFeed } = require('./meta-catalog');

const URL_ERP = process.env.OFERTA_URL || 'https://erp.stago.com.pl/api/public/oferta.json';
const KEY = process.env.OFERTA_PUBLIC_KEY;
const DRY = process.argv.includes('--dry');
const LANGS = ['cz', 'de', 'es', 'hu', 'it', 'sk'];
const NUMRUN = /\d[\d   .,]*\d/; // pierwszy ciąg cyfrowy w cenie („4 800", „20 564")
const base = path.join(__dirname, '..', 'content');

const fmt = (n) => String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // „20 564" / „4 800" jak dotąd na stronie

function patch(file, edit) {
	if (!fs.existsSync(file)) return false;
	const before = fs.readFileSync(file, 'utf8');
	const d = JSON.parse(before);
	edit(d);
	const after = JSON.stringify(d, null, 2) + '\n';
	if (after === before) return false;
	if (!DRY) fs.writeFileSync(file, after);
	return true;
}

/**
 * Realizacje z ERP → galeria strony (Karol 10.09: ERP = jedno źródło, strona pobiera).
 *  - pliki: assets/gallery/realizacje/rz-<id8>.webp (bryła) / rw-<id8>.webp (wnętrze) + wariant -800 — prefiks rz/rw
 *    zostaje, bo build.js losuje z niego 3 zdjęcia na stronę główną (2 bryły + 1 wnętrze); pobieramy tylko brakujące,
 *  - treść: obie siatki w content/pages/realizacje.json (i wersjach językowych) przepisane z listy ERP; podpisy PL,
 *    w innych językach tylko alt (tłumaczeń podpisów nie ma w ERP).
 *  Stare pliki zostają (linkowane z innych podstron, cache immutable) — nic nie kasujemy.
 */
const GALERIA = path.join(__dirname, '..', 'assets', 'gallery', 'realizacje');
const escapeHtml = (s) =>
	String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function pobierz(urlAbs, plik) {
	if (fs.existsSync(plik)) return false;
	const r = await fetch(urlAbs);
	if (!r.ok) throw new Error(`${urlAbs} → ${r.status}`);
	const buf = Buffer.from(await r.arrayBuffer());
	if (buf.length < 1000) throw new Error(`${urlAbs} → pusty plik`);
	if (!DRY) fs.writeFileSync(plik, buf);
	return true;
}

// Numery produkcyjne zostają w ERP, nie w publicznych podpisach ani altach.
function publicLabel(label) {
	return String(label || '')
		.replace(/\bSTA(?:GO)?-\d{4}-\d+(?:_[A-Z0-9]+)?\b/gi, '')
		.replace(/\b[A-Z]\d[A-Z]\d{1,4}\b/gi, '')
		.replace(/\s+/g, ' ').replace(/^[\s·,;|–—-]+|[\s·,;|–—-]+$/g, '').trim() || 'Realizacja STAGO';
}

function karta(r, nazwa, zPodpisem) {
	const src = `assets/gallery/realizacje/${nazwa}-800.webp`,
		full = `assets/gallery/realizacje/${nazwa}.webp`;
	const alt = escapeHtml(publicLabel(r.label));
	const podpis = zPodpisem && r.label ? `<div class="realizacja-label">${alt}</div>` : '';
	return `<div class="realizacja-card"><img src="${src}" srcset="${src} 800w, ${full} 1400w" sizes="(max-width:720px) 100vw, (max-width:1000px) 50vw, 380px" data-full="${full}" alt="${alt}" loading="lazy">${podpis}</div>`;
}

/** Podmienia zawartość siatek (1. bryły, 2. wnętrza) w body strony realizacji; zwraca nowy body albo null, gdy układ obcy. */
function przepiszSiatki(body, kartyZewn, kartyWewn) {
	const OPEN = /<div class="realizacje-grid"[^>]*>/g;
	const otwarcia = [...body.matchAll(OPEN)];
	if (otwarcia.length !== 2) return null;
	const grupy = [kartyZewn, kartyWewn];
	// Karta z podpisem lub bez (wersje językowe mają same alt-y) — koniec siatki = koniec ostatniej karty.
	const KARTA = /<div class="realizacja-card"><img [^>]*>(?:<div class="realizacja-label">[^<]*<\/div>)?<\/div>/g;
	let wynik = '';
	let pos = 0;
	for (let i = 0; i < 2; i++) {
		const start = otwarcia[i].index + otwarcia[i][0].length;
		const granica = i === 0 ? otwarcia[1].index : body.length;
		let koniec = -1;
		for (const m of body.slice(start, granica).matchAll(KARTA)) koniec = start + m.index + m[0].length;
		if (koniec < 0) return null;
		wynik += body.slice(pos, start) + '\n        ' + grupy[i].join('\n        ');
		pos = koniec;
	}
	return wynik + body.slice(pos);
}

async function syncRealizacje(lista) {
	if (!Array.isArray(lista) || lista.length === 0) {
		console.log('Realizacje: ERP nie podał żadnej — galeria strony bez zmian.');
		return 0;
	}
	const origin = new URL(URL_ERP).origin;
	if (!DRY) fs.mkdirSync(GALERIA, { recursive: true });
	let pliki = 0;
	const karty = { zewnatrz: [], wnetrze: [], zewnatrzAlt: [], wnetrzeAlt: [] };
	for (const r of lista) {
		if (!r.id || !r.image_url) continue;
		const rodzaj = r.kind === 'wnetrze' ? 'wnetrze' : 'zewnatrz';
		const nazwa = `${rodzaj === 'wnetrze' ? 'rw' : 'rz'}-${String(r.id).replace(/-/g, '').slice(0, 8)}`;
		const full = r.image_url.startsWith('http') ? r.image_url : origin + r.image_url;
		const thumb = r.thumb_url ? (r.thumb_url.startsWith('http') ? r.thumb_url : origin + r.thumb_url) : full;
		try {
			if (await pobierz(full, path.join(GALERIA, `${nazwa}.webp`))) pliki++;
			if (await pobierz(thumb, path.join(GALERIA, `${nazwa}-800.webp`))) pliki++;
		} catch (e) {
			console.error(`  realizacja ${nazwa}: ${e.message} — pomijam to zdjęcie`);
			continue;
		}
		karty[rodzaj].push(karta(r, nazwa, true));
		karty[`${rodzaj}Alt`].push(karta(r, nazwa, false));
	}
	if (karty.zewnatrz.length + karty.wnetrze.length < 3) {
		console.error('Realizacje: za mało pobranych zdjęć (<3) — nie ruszam galerii strony.');
		return 0;
	}
	let zmienione = 0;
	for (const lang of ['pl', ...LANGS]) {
		const f = lang === 'pl' ? path.join(base, 'pages', 'realizacje.json') : path.join(base, lang, 'pages', 'realizacje.json');
		const zPodpisem = lang === 'pl';
		if (
			patch(f, (d) => {
				const nowy = przepiszSiatki(
					d.body,
					zPodpisem ? karty.zewnatrz : karty.zewnatrzAlt,
					zPodpisem ? karty.wnetrze : karty.wnetrzeAlt
				);
				if (!nowy) console.error(`  ${lang}/realizacje: nieznany układ siatek — pomijam`);
				else d.body = nowy;
			})
		) {
			zmienione++;
			console.log(`  ${lang}/realizacje: ${karty.zewnatrz.length} bryły + ${karty.wnetrze.length} wnętrza`);
		}
	}
	console.log(`Realizacje: ${lista.length} z ERP, nowych plików ${pliki}`);
	return zmienione + pliki;
}

if (require.main === module) {
if (!KEY) {
	console.error('Brak OFERTA_PUBLIC_KEY (secret repo) — nie pobieram.');
	process.exit(2);
}
(async () => {
	const res = await fetch(`${URL_ERP}?key=${encodeURIComponent(KEY)}`, { headers: { Accept: 'application/json' } });
	if (!res.ok) {
		console.error(`ERP odpowiedział ${res.status} — zostawiam stronę bez zmian.`);
		process.exit(res.status === 503 ? 3 : 1);
	}
	const oferta = await res.json();
	const metaFeed = renderFeed(oferta.modele); // Validate before changing any public files.
	console.log(`ERP: ${oferta.modele.length} modeli, kurs € ${oferta.eur_rate} (${oferta.eur_rate_source}), ${oferta.generated_at}`);
	let zmienione = 0;
	const brak = [];
	for (const m of oferta.modele) {
		const code = String(m.code).toLowerCase();
		if (m.price_pln == null) continue; // wycena indywidualna → nie nadpisujemy tekstu na stronie
		const pl = path.join(base, 'modele', `${code}.json`);
		if (!fs.existsSync(pl)) {
			brak.push(m.code);
			continue;
		}
		if (
			patch(pl, (d) => {
				if (d.hero && typeof d.hero.price === 'string') d.hero.price = d.hero.price.replace(NUMRUN, fmt(m.price_pln));
				if (d.jsonLd) d.jsonLd.lowPrice = String(Math.round(m.price_pln));
			})
		) {
			zmienione++;
			console.log(`  pl/${code}: ${fmt(m.price_pln)} zł`);
		}
		for (const l of LANGS) {
			const f = path.join(base, l, 'modele', `${code}.json`);
			if (
				patch(f, (d) => {
					if (d.hero && typeof d.hero.price === 'string' && m.price_eur != null)
						d.hero.price = d.hero.price.replace(NUMRUN, fmt(m.price_eur));
					if (d.jsonLd) d.jsonLd.lowPrice = String(Math.round(m.price_pln));
				})
			) {
				zmienione++;
				console.log(`  ${l}/${code}: ${fmt(m.price_eur)} €`);
			}
		}
	}
	if (brak.length) console.log(`Modele z ERP bez strony (pomijam): ${brak.join(', ')}`);
	zmienione += await syncRealizacje(oferta.realizacje || []);
	zmienione += writeFeed(metaFeed, DRY);
	console.log(`${DRY ? '[dry-run] ' : ''}Zmienione pliki: ${zmienione}`);
	// GitHub Actions: wynik do kolejnego kroku (commit tylko gdy coś się zmieniło)
	if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${zmienione > 0 ? 'true' : 'false'}\n`);
})().catch((e) => {
	console.error('Błąd synchronizacji:', e.message);
	process.exit(1);
});
}

module.exports = { publicLabel, karta, przepiszSiatki };
