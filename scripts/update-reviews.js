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

  if (stary && stary.reviewCount === nowy.reviewCount && stary.ratingValue === nowy.ratingValue) {
    console.log(`reviews: bez zmian (${nowy.reviewCount} opinii, ocena ${nowy.ratingValue})`);
    return;
  }

  fs.writeFileSync(CACHE, JSON.stringify(nowy, null, 2) + '\n');
  const skad = stary ? `${stary.reviewCount} → ` : '';
  console.log(`reviews: ${skad}${nowy.reviewCount} opinii, ocena ${nowy.ratingValue}`);
}

main();
