/**
 * Okno „Zostaw numer, oddzwonimy” (Karol 10.11.2026).
 *
 * Stan i teksty z ERP: GET /api/public/oddzwanianie (włączone, dyżur teraz, „oddzwonimy jutro od 7:00”).
 * Zgłoszenie przez window.STAGO_LEAD z form-handler.js: ten sam wlot, zgody cookies, atrybucja i pomiar co
 * formularz wyceny, plus `oddzwon: true` (w dyżurze centrala ERP od razu dzwoni do dyżurnego).
 *
 * Kiedy widać (decyzje Karola 10.11):
 *  - komputer: pigułka w rogu 8 s po decyzji o cookies; okno otwiera się tylko na klik, nigdy samo;
 *  - telefon: tylko poza dyżurem, przycisk „Zadzwoń” w dolnym pasku otwiera panel zamiast dzwonić w próżnię;
 *  - nie po polsku, na stronie kontaktu i w konfiguratorze: nic;
 *  - po zamknięciu pigułka wraca po 7 dniach, po wysłaniu numeru po 30 dniach (pamięć przeglądarki); panel na telefonie
 *    otwiera tylko świadome dotknięcie „Zadzwoń”, więc jego zamknięcie nie blokuje kolejnego dotknięcia;
 *  - ERP nie odpowiada, usługa wyłączona albo poza dyżurem z ustawieniem „ukryj”: nic, formularz działa dalej.
 */
(function () {
  'use strict';

  var URL_STANU = 'https://erp.stago.com.pl/api/public/oddzwanianie';
  var KLUCZ = 'stago_oddzwon';
  var DZIEN = 864e5;
  var PO_ZAMKNIECIU = 7 * DZIEN;
  var PO_WYSLANIU = 30 * DZIEN;
  var OPOZNIENIE_MS = 8000;
  var TELEFON = matchMedia('(max-width: 768px)'); // ten sam próg co dolny pasek „Zadzwoń” (style.css)

  if ((document.documentElement.lang || '').slice(0, 2) !== 'pl') return;
  if (/\/(kontakt|konfigurator)(\.html)?$/.test(location.pathname)) return;

  function pamiec() {
    try { return JSON.parse(localStorage.getItem(KLUCZ)) || {}; } catch (e) { return {}; }
  }
  function zapamietaj(pole) {
    var p = pamiec();
    p[pole] = Date.now();
    try { localStorage.setItem(KLUCZ, JSON.stringify(p)); } catch (e) {}
  }
  function wyslaneNiedawno() { var p = pamiec(); return !!(p.wyslane && Date.now() - p.wyslane < PO_WYSLANIU); }
  function pigulkaZamknieta() { var p = pamiec(); return !!(p.zamkniete && Date.now() - p.zamkniete < PO_ZAMKNIECIU); }
  if (wyslaneNiedawno()) return;
  var timerPigulki = null;

  // Stan z ERP; brak odpowiedzi w 4 s = brak okna.
  function pobierzStan() {
    var kontroler = typeof AbortController === 'function' ? new AbortController() : null;
    var t = kontroler && setTimeout(function () { kontroler.abort(); }, 4000);
    return fetch(URL_STANU, kontroler ? { signal: kontroler.signal } : {})
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .finally(function () { if (t) clearTimeout(t); });
  }

  // „Zostaw numer, oddzwonimy w 30 sekund” → nagłówek „Zostaw numer.” + akcent „Oddzwonimy w 30 sekund.”
  function naglowek(tekst) {
    var t = String(tekst || '').trim().replace(/[.!]+$/, '');
    var i = t.indexOf(', ');
    if (i < 0) return ['', t + '.'];
    var reszta = t.slice(i + 2);
    return [t.slice(0, i) + '.', reszta.charAt(0).toUpperCase() + reszta.slice(1) + '.'];
  }

  function el(tag, klasa, tekst) {
    var e = document.createElement(tag);
    if (klasa) e.className = klasa;
    if (tekst != null) e.textContent = tekst;
    return e;
  }

  var IKONA_TEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>';
  var IKONA_STRZALKA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var IKONA_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function zbuduj(stan) {
    var teraz = stan.teraz === true;
    var sek = Math.max(1, Math.round(Number(stan.obietnica_s) || 30));
    var wrap = el('div', 'odz');

    // pigułka (tylko komputer)
    var pig = el('button', 'odz-pig');
    pig.type = 'button';
    pig.hidden = true;
    pig.setAttribute('aria-haspopup', 'dialog');
    pig.innerHTML = '<span class="odz-pig-ikona">' + IKONA_TEL + '</span>';
    var pigTekst = el('span', 'odz-pig-tekst', teraz ? 'Oddzwonimy w ' + sek + ' s' : 'Zostaw numer');
    var pigPod = el('small');
    pigPod.appendChild(el('span', 'odz-kropka' + (teraz ? '' : ' szara')));
    pigPod.appendChild(document.createTextNode(teraz ? 'Teraz odbieramy' : 'Oddzwonimy ' + (stan.kiedy || 'w dzień roboczy')));
    pigTekst.appendChild(pigPod);
    pig.appendChild(pigTekst);

    // panel
    var panel = el('form', 'odz-panel');
    panel.id = 'odz-panel';
    panel.noValidate = true;
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'odz-h');
    pig.setAttribute('aria-controls', 'odz-panel');
    var x = el('button', 'odz-x');
    x.type = 'button';
    x.setAttribute('aria-label', 'Zamknij');
    x.innerHTML = IKONA_X;
    var tresc = el('div');
    panel.appendChild(x);
    panel.appendChild(tresc);

    wrap.appendChild(pig);
    wrap.appendChild(panel);
    document.body.appendChild(wrap);

    function formularz() {
      tresc.textContent = '';
      var st = el('p', 'odz-stan');
      st.appendChild(el('span', 'odz-kropka' + (teraz ? '' : ' szara')));
      st.appendChild(document.createTextNode(teraz ? 'Teraz odbieramy' : 'Poza godzinami pracy'));
      var n = naglowek(stan.komunikat);
      var h = el('h2', 'odz-h', n[0]);
      h.id = 'odz-h';
      h.appendChild(el('span', null, n[1]));
      var pole = el('label', 'odz-pole');
      pole.appendChild(el('b', null, '+48'));
      var tel = el('input');
      tel.type = 'tel';
      tel.name = 'phone';
      tel.inputMode = 'tel';
      tel.autocomplete = 'tel-national';
      tel.placeholder = '509 508 210';
      tel.setAttribute('aria-label', 'Numer telefonu');
      pole.appendChild(tel);
      var blad = el('p', 'odz-blad');
      blad.id = 'odz-blad';
      blad.setAttribute('role', 'alert');
      tel.setAttribute('aria-describedby', 'odz-blad');
      tresc.appendChild(st);
      tresc.appendChild(h);
      tresc.appendChild(pole);
      tresc.appendChild(blad);
      var kom = null;
      if (!teraz) {
        var inna = el('button', 'odz-link', 'Wolisz inną godzinę?');
        inna.type = 'button';
        inna.setAttribute('aria-expanded', 'false');
        kom = el('textarea', 'odz-kom');
        kom.hidden = true;
        kom.maxLength = 300;
        kom.placeholder = 'np. po 16:00 albo w czwartek rano';
        kom.setAttribute('aria-label', 'Kiedy zadzwonić');
        inna.addEventListener('click', function () {
          kom.hidden = false;
          inna.hidden = true;
          kom.focus();
        });
        tresc.appendChild(inna);
        tresc.appendChild(kom);
      }
      var wyslij = el('button', 'odz-wyslij', teraz ? 'Oddzwońcie do mnie ' : 'Zostaw numer ');
      wyslij.type = 'submit';
      wyslij.insertAdjacentHTML('beforeend', IKONA_STRZALKA);
      tresc.appendChild(wyslij);
      var zgoda = el('p', 'odz-zgoda', 'Wysyłając numer, zgadzasz się na telefon w sprawie zapytania. ');
      var a = el('a', null, 'Polityka prywatności');
      a.href = (window.STAGO_ROOT || '/') + 'polityka-prywatnosci.html';
      zgoda.appendChild(a);
      tresc.appendChild(zgoda);
      return { tel: tel, pole: pole, blad: blad, kom: kom, wyslij: wyslij };
    }

    var licznik = null;
    function potwierdzenie(odp) {
      clearInterval(licznik);
      tresc.textContent = '';
      tresc.appendChild(el('span', 'odz-ptak'));
      var dzwoni = teraz && odp && odp.stan === 'dzwoni';
      var h = el('h2', 'odz-h', dzwoni ? 'Dzwonimy.' : 'Zapisane.');
      h.id = 'odz-h';
      h.tabIndex = -1;
      h.appendChild(el('span', null, dzwoni ? 'Miej telefon pod ręką.' : naglowek(stan.po_zgloszeniu || 'Oddzwonimy ' + (stan.kiedy || 'w dzień roboczy'))[1]));
      tresc.appendChild(h);
      if (dzwoni) {
        var l = el('div', 'odz-licznik');
        var liczba = el('strong', null, '0:' + String(sek).padStart(2, '0'));
        l.appendChild(liczba);
        l.appendChild(el('span', null, 'do połączenia'));
        tresc.appendChild(l);
        var n = sek;
        licznik = setInterval(function () {
          n--;
          liczba.textContent = n > 0 ? '0:' + String(n).padStart(2, '0') : 'Łączymy';
          if (n <= 0) clearInterval(licznik);
        }, 1000);
      }
      var p = el('p', null, dzwoni ? 'Nie dodzwoniliśmy się? Zadzwoń sam: ' : 'Pilne? Zadzwoń: ');
      var t = el('a', null, '509 508 210');
      t.href = 'tel:+48509508210';
      p.appendChild(t);
      tresc.appendChild(p);
      h.focus({ preventScroll: true }); // fokus z usuniętego formularza na nagłówek potwierdzenia (czytnik ekranu go odczyta)
      requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.add('odz-gotowe'); }); });
    }

    var f = null;
    var wysylka = false;
    var wyslane = false;
    var wywolujacy = null;
    function otworz(skad) {
      wywolujacy = skad || document.activeElement;
      clearTimeout(timerPigulki);
      pig.hidden = true;
      panel.hidden = false;
      // w trakcie wysyłki i po niej zostaje ten sam formularz albo potwierdzenie (bez drugiego numeru w tle)
      if (wysylka || wyslane) return;
      panel.classList.remove('odz-gotowe');
      f = formularz();
      f.tel.focus({ preventScroll: true });
    }
    function zamknij() {
      clearInterval(licznik);
      clearTimeout(timerPigulki);
      panel.hidden = true;
      if (!TELEFON.matches) zapamietaj('zamkniete'); // komputer: pigułka wraca po 7 dniach
      if (wywolujacy && wywolujacy.offsetParent !== null && typeof wywolujacy.focus === 'function') wywolujacy.focus({ preventScroll: true });
      else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }

    x.addEventListener('click', zamknij);
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') zamknij(); });
    pig.addEventListener('click', function () { otworz(pig); });

    panel.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f || wysylka || wyslane) return;
      var cyfry = f.tel.value.replace(/\D/g, '').replace(/^(0048|48)(?=\d{9}$)/, '');
      if (cyfry.length !== 9) {
        f.pole.classList.add('blad');
        f.blad.textContent = 'Podaj 9 cyfr numeru, na przykład 509 508 210.';
        f.tel.focus();
        return;
      }
      f.pole.classList.remove('blad');
      f.blad.textContent = '';
      if (!window.STAGO_LEAD) { f.blad.textContent = 'Nie udało się wysłać. Zadzwoń: 509 508 210.'; return; }
      wysylka = true;
      f.wyslij.disabled = true;
      var kiedy = f.kom && f.kom.value.trim();
      window.STAGO_LEAD.wyslij({
        name: '',
        phone: '+48' + cyfry,
        message: 'Prośba o oddzwonienie z okna na stronie.' + (kiedy ? '\nKiedy dzwonić: ' + kiedy : ''),
        language: 'pl',
        oddzwon: true,
        consent: true,
        consent_marketing: false,
        consent_timestamp: new Date().toISOString(),
        consent_source_url: location.href,
        consent_form_id: 'oddzwon'
      }).then(function (wynik) {
        var odp = wynik && wynik.oddzwon;
        if (odp && odp.stan === 'zly_numer') {
          wysylka = false;
          f.wyslij.disabled = false;
          f.pole.classList.add('blad');
          f.blad.textContent = odp.komunikat || 'Podaj polski numer telefonu.';
          f.tel.focus();
          return;
        }
        wyslane = true;
        zapamietaj('wyslane');
        potwierdzenie(odp);
      }).catch(function () {
        wysylka = false;
        f.wyslij.disabled = false;
        f.blad.textContent = 'Nie udało się wysłać. Spróbuj jeszcze raz albo zadzwoń: 509 508 210.';
      });
    });

    return { pig: pig, otworz: otworz, teraz: teraz, wyslane: function () { return wyslane; } };
  }

  // Pigułka dopiero po decyzji o cookies (baner i okno nie mogą na siebie nachodzić).
  function poDecyzjiCookies(fn) {
    var st = window.STAGO_COOKIES && window.STAGO_COOKIES.state && window.STAGO_COOKIES.state();
    if (st) return fn();
    window.addEventListener('stago:consent-update', function raz() {
      window.removeEventListener('stago:consent-update', raz);
      fn();
    });
  }

  function start() {
    pobierzStan().then(function (stan) {
      if (!stan || stan.widzet !== true) return;
      var okno = zbuduj(stan);
      // telefon poza dyżurem: „Zadzwoń” w dolnym pasku otwiera panel (w dyżurze dzwoni jak zawsze)
      if (!okno.teraz) {
        document.addEventListener('click', function (e) {
          var a = e.target.closest && e.target.closest('.sticky-phone');
          if (!a || !TELEFON.matches || okno.wyslane()) return;
          e.preventDefault();
          okno.otworz(a);
        });
      }
      if (pigulkaZamknieta()) return;
      poDecyzjiCookies(function () {
        timerPigulki = setTimeout(function () {
          if (TELEFON.matches || okno.wyslane() || pigulkaZamknieta() || wyslaneNiedawno()) return;
          if (document.getElementById('odz-panel').hidden) okno.pig.hidden = false;
        }, OPOZNIENIE_MS);
      });
    }).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
