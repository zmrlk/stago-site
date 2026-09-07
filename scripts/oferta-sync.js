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

const URL_ERP = process.env.OFERTA_URL || 'https://erp.stago.com.pl/api/public/oferta.json';
const KEY = process.env.OFERTA_PUBLIC_KEY;
const DRY = process.argv.includes('--dry');
const LANGS = ['cz', 'de', 'es', 'hu', 'it', 'sk'];
const NUMRUN = /\d[\d   .,]*\d/; // pierwszy ciąg cyfrowy w cenie („4 800", „20 564")
const base = path.join(__dirname, '..', 'content');

if (!KEY) {
	console.error('Brak OFERTA_PUBLIC_KEY (secret repo) — nie pobieram.');
	process.exit(2);
}

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

(async () => {
	const res = await fetch(`${URL_ERP}?key=${encodeURIComponent(KEY)}`, { headers: { Accept: 'application/json' } });
	if (!res.ok) {
		console.error(`ERP odpowiedział ${res.status} — zostawiam stronę bez zmian.`);
		process.exit(res.status === 503 ? 3 : 1);
	}
	const oferta = await res.json();
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
	console.log(`${DRY ? '[dry-run] ' : ''}Zmienione pliki: ${zmienione}`);
	// GitHub Actions: wynik do kolejnego kroku (commit tylko gdy coś się zmieniło)
	if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${zmienione > 0 ? 'true' : 'false'}\n`);
})().catch((e) => {
	console.error('Błąd synchronizacji:', e.message);
	process.exit(1);
});
