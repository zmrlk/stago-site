#!/usr/bin/env node
/**
 * Aktualizuje ocenę i liczbę opinii Google w danych strukturalnych.
 *
 * Widget reviews.js odświeża tylko to, co widzi użytkownik. Google czyta
 * aggregateRating z HTML, więc liczba musi być świeża już w źródle — inaczej
 * w wynikach wyszukiwania zostaje wartość sprzed miesięcy (13 zamiast 24).
 *
 * Wynik trafia do content/reviews.json i stamtąd bierze go build.js.
 * Gdy API nie odpowie, plik zostaje nietknięty — build nie może paść
 * przez chwilową awarię Google.
 */
const fs = require('fs');
const path = require('path');

const CACHE = path.join('content', 'reviews.json');
const PLACE_RE = /STAGO_PLACE_ID\s*=\s*'([^']+)'/;
const KEY_RE = /STAGO_GOOGLE_API_KEY\s*=\s*'([^']+)'/;

function zTemplatki(regex) {
  try {
    const t = fs.readFileSync(path.join('templates', 'index.html'), 'utf8');
    const m = t.match(regex);
    return m ? m[1] : null;
  } catch (e) {
    return null;
  }
}

function wczytajCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  } catch (e) {
    return null;
  }
}

async function main() {
  const placeId = process.env.STAGO_PLACE_ID || zTemplatki(PLACE_RE);
  const key = process.env.STAGO_GOOGLE_API_KEY || zTemplatki(KEY_RE);
  const stary = wczytajCache();

  if (!placeId || !key) {
    console.log('reviews: brak place_id albo klucza — zostaje ostatnia znana wartość');
    return;
  }

  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=rating,userRatingCount`;
  let dane;
  try {
    const res = await fetch(url, { headers: { 'X-Goog-Api-Key': key } });
    dane = await res.json();
    if (dane.error) throw new Error(dane.error.message || 'blad API');
  } catch (e) {
    console.log(`reviews: Google nie odpowiedziało (${String(e.message).slice(0, 60)}) — zostaje ostatnia znana wartość`);
    return;
  }

  const liczba = dane.userRatingCount;
  const ocena = dane.rating;
  if (!liczba || !ocena) {
    console.log('reviews: odpowiedź bez oceny/liczby — zostaje ostatnia znana wartość');
    return;
  }

  const nowy = {
    ratingValue: String(ocena),
    reviewCount: String(liczba),
    updated: new Date().toISOString().slice(0, 10),
  };

  // Liczniki sprawdzamy zawsze — plik z cache moze byc aktualny, a tresc nie
  // (tak bylo 08-18: cache 24, a w naglowkach wciaz 13).
  aktualizujLicznikiWTresci(liczba);

  if (stary && stary.reviewCount === nowy.reviewCount && stary.ratingValue === nowy.ratingValue) {
    console.log(`reviews: bez zmian (${nowy.reviewCount} opinii, ocena ${nowy.ratingValue})`);
    return;
  }

  fs.writeFileSync(CACHE, JSON.stringify(nowy, null, 2) + '\n');
  const skad = stary ? `${stary.reviewCount} → ` : '';
  console.log(`reviews: ${skad}${nowy.reviewCount} opinii, ocena ${nowy.ratingValue}`);
}

// Naglowek sekcji opinii ma wlasna, przetlumaczona etykiete ("13 opinii",
// "13 Bewertungen"). Widget podmienia ja na zywo, ale zanim wystartuje — i gdyby
// nie wystartowal — powinna byc aktualna juz w HTML. Podmieniamy sama liczbe,
// zostawiajac slowo w jezyku danej wersji.
function aktualizujLicznikiWTresci(liczba) {
  const pliki = ['content/index.json', 'content/de/index.json', 'content/cz/index.json',
    'content/sk/index.json', 'content/hu/index.json', 'content/it/index.json', 'content/es/index.json'];
  let zmienione = 0;
  for (const f of pliki) {
    let dane;
    try {
      dane = JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch (e) {
      continue;
    }
    const stara = dane.reviews && dane.reviews.count;
    if (typeof stara !== 'string') continue;
    const nowa = stara.replace(/^\d+/, String(liczba));
    if (nowa === stara) continue;
    dane.reviews.count = nowa;
    fs.writeFileSync(f, JSON.stringify(dane, null, 2) + '\n');
    zmienione++;
  }
  if (zmienione) console.log(`reviews: licznik w naglowku odswiezony w ${zmienione} wersjach jezykowych`);
}

main();
