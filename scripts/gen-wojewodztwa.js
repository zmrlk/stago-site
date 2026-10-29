#!/usr/bin/env node
// Generator 16 stron geo: pawilony/wojewodztwo/*.html
// Źródło prawdy dla tych stron (nie edytuj HTML ręcznie — build go nadpisuje).
// Transport i montaż NIGDY nie są w cenie (zasada STAGO, check-llms.js).
const fs = require('fs');
const path = require('path');
const { wymiary } = require('./img-size');

const ROOT = path.join(__dirname, '..');

const wojewodztwa = [
  { slug: 'mazowieckie', name: 'mazowieckie', cities: ['Warszawa', 'Radom', 'Płock', 'Siedlce', 'Ostrołęka', 'Pruszków'], dist: 250, hours: '4-5', popular: ['NORD', 'LOFT', 'DUET', 'ICON', 'MILA', 'NOIR'] },
  { slug: 'malopolskie', name: 'małopolskie', cities: ['Kraków', 'Tarnów', 'Nowy Sącz', 'Oświęcim', 'Chrzanów', 'Bochnia'], dist: 130, hours: '2-3', popular: ['NORD', 'LOFT', 'MILA', 'ICON', 'RYTM', 'DUET'] },
  { slug: 'slaskie', name: 'śląskie', cities: ['Katowice', 'Częstochowa', 'Sosnowiec', 'Gliwice', 'Bytom', 'Tychy'], dist: 180, hours: '3-4', popular: ['DUET', 'LOFT', 'NORD', 'CUBE', 'NOIR', 'SAGA'] },
  { slug: 'wielkopolskie', name: 'wielkopolskie', cities: ['Poznań', 'Kalisz', 'Konin', 'Piła', 'Ostrów', 'Leszno'], dist: 400, hours: '5-6', popular: ['NORD', 'LOFT', 'RYTM', 'ICON', 'DUET', 'MILA'] },
  { slug: 'dolnoslaskie', name: 'dolnośląskie', cities: ['Wrocław', 'Wałbrzych', 'Legnica', 'Jelenia Góra', 'Lubin', 'Głogów'], dist: 380, hours: '5-6', popular: ['LOFT', 'DUET', 'NORD', 'SAGA', 'ICON', 'VIEW'] },
  { slug: 'lodzkie', name: 'łódzkie', cities: ['Łódź', 'Piotrków Trybunalski', 'Pabianice', 'Tomaszów', 'Bełchatów', 'Zgierz'], dist: 200, hours: '3-4', popular: ['LOFT', 'NORD', 'DUET', 'MILA', 'RYTM', 'CUBE'] },
  { slug: 'pomorskie', name: 'pomorskie', cities: ['Gdańsk', 'Gdynia', 'Sopot', 'Słupsk', 'Tczew', 'Wejherowo'], dist: 580, hours: '7-8', popular: ['SAGA', 'VIEW', 'LOFT', 'MILA', 'NORD', 'ICON'] },
  { slug: 'zachodniopomorskie', name: 'zachodniopomorskie', cities: ['Szczecin', 'Koszalin', 'Stargard', 'Kołobrzeg', 'Świnoujście', 'Police'], dist: 650, hours: '8-9', popular: ['SAGA', 'VIEW', 'NORD', 'MILA', 'LOFT', 'ATRI'] },
  { slug: 'lubelskie', name: 'lubelskie', cities: ['Lublin', 'Chełm', 'Zamość', 'Biała Podlaska', 'Puławy', 'Świdnik'], dist: 300, hours: '4-5', popular: ['DUET', 'MILA', 'RYTM', 'NORD', 'LOFT', 'ATRI'] },
  { slug: 'podkarpackie', name: 'podkarpackie', cities: ['Rzeszów', 'Przemyśl', 'Stalowa Wola', 'Mielec', 'Tarnobrzeg', 'Krosno'], dist: 320, hours: '4-5', popular: ['NORD', 'MILA', 'DUET', 'LOFT', 'RYTM', 'ICON'] },
  { slug: 'swietokrzyskie', name: 'świętokrzyskie', cities: ['Kielce', 'Ostrowiec', 'Skarżysko', 'Starachowice', 'Sandomierz', 'Końskie'], dist: 60, hours: '1-2', popular: ['NORD', 'LOFT', 'DUET', 'MILA', 'ICON', 'RYTM'] },
  { slug: 'kujawsko-pomorskie', name: 'kujawsko-pomorskie', cities: ['Bydgoszcz', 'Toruń', 'Włocławek', 'Grudziądz', 'Inowrocław', 'Brodnica'], dist: 380, hours: '5-6', popular: ['LOFT', 'NORD', 'DUET', 'RYTM', 'MILA', 'SAGA'] },
  { slug: 'warminsko-mazurskie', name: 'warmińsko-mazurskie', cities: ['Olsztyn', 'Elbląg', 'Ełk', 'Ostróda', 'Iława', 'Giżycko'], dist: 480, hours: '6-7', popular: ['MILA', 'NORD', 'VIEW', 'SAGA', 'ATRI', 'RYTM'] },
  { slug: 'podlaskie', name: 'podlaskie', cities: ['Białystok', 'Suwałki', 'Łomża', 'Augustów', 'Bielsk Podlaski', 'Hajnówka'], dist: 420, hours: '6-7', popular: ['MILA', 'NORD', 'RYTM', 'DUET', 'ATRI', 'CUBE'] },
  { slug: 'lubuskie', name: 'lubuskie', cities: ['Zielona Góra', 'Gorzów Wielkopolski', 'Nowa Sól', 'Żary', 'Świebodzin', 'Międzyrzecz'], dist: 460, hours: '6-7', popular: ['LOFT', 'NORD', 'SAGA', 'RYTM', 'VIEW', 'DUET'] },
  { slug: 'opolskie', name: 'opolskie', cities: ['Opole', 'Kędzierzyn-Koźle', 'Nysa', 'Brzeg', 'Kluczbork', 'Strzelce Opolskie'], dist: 250, hours: '3-4', popular: ['NORD', 'LOFT', 'DUET', 'CUBE', 'RYTM', 'MILA'] },
];

const modelDescs = {
  ATRI: 'Otwarta bryła z dużym przeszkleniem',
  MILA: 'Klasyczny układ, symetryczne proporcje',
  ICON: 'Premium loft z narożnym przeszkleniem',
  RYTM: 'Drewniana ramka, symetryczny front',
  NORD: 'Premium bryła z narożnymi oknami',
  LOFT: 'Front showroomowy z trzema witrynami',
  SAGA: 'Wydłużona bryła z frontem witrynowym',
  VIEW: 'Bryła z panoramicznymi narożnikami',
  DUET: 'Bryła z bocznymi akcentami i frontem',
  CUBE: 'Modułowy kubik z wyrazistą wstawką',
  NOIR: 'Wydłużony monolit z lamelami',
  KIOS: 'Kompaktowa bryła z pełną witryną',
};

function atrybutWymiaru(rel) {
  const dim = wymiary(path.join(ROOT, rel));
  return dim ? ` width="${dim.w}" height="${dim.h}"` : '';
}

function jsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function buildPage(w) {
  const url = `https://stago.com.pl/pawilony/wojewodztwo/${w.slug}`;
  const title = `Pawilony modułowe — woj. ${w.name} | ${w.cities[0]} | STAGO`;
  const description = `Pawilony modułowe STAGO, województwo ${w.name}: ${w.cities[0]}, ${w.cities[1]}, ${w.cities[2]}. Transport z Jędrzejowa i montaż — wycena indywidualna.`;
  const faq = [
    {
      q: `Ile kosztuje transport pawilonu do ${w.cities[0]}?`,
      a: `Transport i montaż wyceniamy osobno, przed podpisem umowy. Z zakładu w Jasionce pod Jędrzejowem do ${w.cities[0]} to około ${w.dist} km, naczepą około ${w.hours} godzin. Dojeżdżamy do każdej miejscowości w regionie.`,
    },
    {
      q: `Jak długo czeka się na pawilon w regionie ${w.name}?`,
      a: 'Standardowo 4–6 tygodni od podpisania umowy do gotowego pawilonu na działce. Pierwsze 1–2 tygodnie to projekt, 3–4 tygodnie produkcja, dostawa w jeden dzień.',
    },
    {
      q: `Czy montujecie pawilon na miejscu w ${w.cities[1]}?`,
      a: 'Tak. Ekipa przyjeżdża z naczepą i ustawia pawilon na przygotowanym podłożu. Wymagamy utwardzonego podłoża — pomagamy je zaplanować przed dostawą.',
    },
    {
      q: `Czy muszę mieć pozwolenie na pawilon — region ${w.name}?`,
      a: 'Pawilon do 35 m² wymaga zgłoszenia w urzędzie, nie pełnego pozwolenia na budowę. Powyżej 35 m² potrzebne jest pozwolenie. Przepisy są takie same w całej Polsce.',
    },
    {
      q: 'Czy mogę przyjechać zobaczyć produkcję?',
      a: `Tak. Zakład jest w Jasionce pod Jędrzejowem (woj. świętokrzyskie). Z ${w.cities[0]} to około ${w.dist} km.`,
    },
  ];
  const inne = wojewodztwa
    .filter(x => x.slug !== w.slug)
    .map(x => `<a class="city-pill" href="${x.slug}.html">${x.name}</a>`)
    .join('\n        ');
  const modele = w.popular.map(code => {
    const plik = `assets/modele/${code.toLowerCase()}.webp`;
    return `        <a href="../../modele/${code.toLowerCase()}.html" class="model-card">
          <div class="model-card-img"><img src="../../${plik}" alt="Pawilon modułowy STAGO ${code}"${atrybutWymiaru(plik)} loading="lazy"></div>
          <div class="model-card-body">
            <span class="model-card-code">${code}</span>
            <h3>${code}</h3>
            <p>${modelDescs[code]}</p>
            <span class="model-card-cta">Zobacz model &rarr;</span>
          </div>
        </a>`;
  }).join('\n');
  const logo = ' width="130" height="29"';
  const logoWhite = ' width="140" height="31"';

  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Produkcja i dostawa pawilonów modułowych',
    provider: {
      '@type': 'Organization',
      name: 'STAGO',
      url: 'https://stago.com.pl',
      telephone: '+48509508210',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Jasionka 117',
        addressLocality: 'Jędrzejów',
        postalCode: '28-300',
        addressCountry: 'PL',
      },
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: `województwo ${w.name}`,
      containsPlace: w.cities.map(name => ({ '@type': 'City', name })),
    },
    description,
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Strona główna', item: 'https://stago.com.pl/' },
      { '@type': 'ListItem', position: 2, name: 'Regiony', item: 'https://stago.com.pl/regiony' },
      { '@type': 'ListItem', position: 3, name: `Województwo ${w.name}`, item: url },
    ],
  };
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://www.googletagmanager.com">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="https://stago.com.pl/assets/og.jpg">
  <meta property="og:locale" content="pl_PL">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="https://stago.com.pl/assets/og.jpg">
  <meta name="theme-color" content="#1D1D1B">
  <link rel="preload" href="../../assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="../../assets/fonts/inter-latin-ext.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="../../style.css" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="../../style.css"></noscript><style>
@font-face{font-family:Inter;font-style:normal;font-weight:100 900;font-display:swap;src:url(../../assets/fonts/inter-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:Inter;font-style:normal;font-weight:100 900;font-display:swap;src:url(../../assets/fonts/inter-latin-ext.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
body{font-family:Inter,system-ui,-apple-system,sans-serif;color:#1D1D1B;background:#fff;margin:0;-webkit-font-smoothing:antialiased}
</style>
  <link rel="icon" type="image/png" href="../../assets/sygnet.png">
  <script type="application/ld+json">${jsonLd(service)}</script>
  <script type="application/ld+json">${jsonLd(crumbs)}</script>
  <script type="application/ld+json">${jsonLd(faqLd)}</script>
</head>
<body>
  <nav class="nav" id="nav">
    <div class="nav-inner">
      <a href="../../index.html" class="nav-logo"><img src="../../assets/logo.webp" alt="STAGO" class="nav-logo-img"${logo}></a>
      <div class="nav-links" id="nav-links">
        <a href="../../modele.html">Modele</a>
        <a href="../../zastosowania.html">Zastosowania</a>
        <a href="../../realizacje.html">Realizacje</a>
        <a href="../../finansowanie.html">Finansowanie</a>
        <a href="../../faq.html">FAQ</a>
        <a href="../../kontakt.html">Kontakt</a>
        <a href="../../konfigurator.html" class="btn btn-nav">Darmowa wycena</a>
      </div>
      <div class="nav-right">
        <a href="tel:+48509508210" class="nav-phone"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>509 508 210</a>
      </div>
      <button class="nav-toggle" id="nav-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>
  </nav>

  <div class="container breadcrumbs">
    <a href="../../index.html">Strona główna</a><span>/</span><a href="../../regiony.html">Regiony</a><span>/</span>${w.name}
  </div>

  <section class="container hub-hero">
    <p class="eyebrow">Województwo ${w.name}</p>
    <h1 class="h1">Pawilony modułowe STAGO. <span class="accent">Region: ${w.name}.</span></h1>
    <p class="hub-sub">Dostarczamy pawilony modułowe w województwie ${w.name} — ${w.cities.slice(0, 5).join(', ')} i okolice. Transport z zakładu w Jasionce pod Jędrzejowem, montaż naszą ekipą. Transport i montaż wyceniamy osobno.</p>
  </section>

  <section class="section section-light">
    <div class="container">
      <p class="eyebrow">Nasz zasięg</p>
      <h2 class="h2">Obsługujemy cały region</h2>
      <p class="section-sub">Dojeżdżamy naczepą do każdej miejscowości w regionie. Transport i montaż są osobną pozycją wyceny — niezależnie od miejscowości.</p>
      <div class="cities-grid">
        ${w.cities.map(c => `<div class="city-pill">${c}</div>`).join('\n        ')}
        <div class="city-pill city-pill-more">+ inne miejscowości</div>
      </div>
      <div class="region-stats">
        <div class="region-stat"><strong>~${w.dist} km</strong><span>z naszego zakładu</span></div>
        <div class="region-stat"><strong>${w.hours} h</strong><span>czas dostawy naczepą</span></div>
        <div class="region-stat"><strong>Wycena</strong><span>transport i montaż indywidualnie</span></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <p class="eyebrow">Polecane modele</p>
      <h2 class="h2">Co wybierają klienci z regionu</h2>
      <p class="section-sub">Te bryły sprawdzają się w regionie — od miasta po działki. Każdy model dopasujemy pod Twoją sytuację. Ceny netto, bez transportu i montażu, są w <a href="../../cennik-pawilonow-handlowych.html">cenniku pawilonów</a>.</p>
      <div class="models-grid" style="margin-top:40px">
${modele}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container" style="max-width:780px;margin:0 auto">
      <p class="eyebrow">Dlaczego warto</p>
      <h2 class="h2">Pawilon modułowy w regionie ${w.name}</h2>
      <p style="color:var(--t2);line-height:1.7;margin-top:20px">Region ${w.name} obsługujemy z zakładu w Jasionce pod Jędrzejowem — od ${w.cities[0]} po mniejsze miejscowości. Dostarczamy pawilony handlowe, biurowe, gastronomiczne i usługowe. Transport i montaż organizujemy osobno i wpisujemy je w wycenę przed podpisem umowy.</p>
      <p style="color:var(--t2);line-height:1.7;margin-top:16px">Pawilon modułowy STAGO to spawana rama stalowa, ściany z płyty warstwowej PIR 100 mm i stolarka aluminiowa. Klienci z ${w.cities[0]} i okolic dostają indywidualny projekt i realizację w 4–6 tygodni.</p>
      <p style="color:var(--t2);line-height:1.7;margin-top:16px">Niezależnie od tego, czy potrzebujesz punktu handlowego w ${w.cities[0]}, biura w ${w.cities[1]}, czy pawilonu pod ${w.cities[2]} — wycenę, w tym transport i montaż, dostajesz przed decyzją.</p>
    </div>
  </section>

  <section class="section section-light">
    <div class="container" style="max-width:780px;margin:0 auto">
      <p class="eyebrow">Proces</p>
      <h2 class="h2">Jak to działa — dostawa do regionu ${w.name}</h2>
      <ol style="color:var(--t2);line-height:1.8;margin-top:20px;padding-left:20px">
        <li style="margin-bottom:12px"><strong>Rozmowa i wycena</strong> — dzwonisz pod <a href="tel:+48509508210" style="color:var(--accent);font-weight:700">509 508 210</a>. W 24 h dostajesz wycenę pawilonu oraz osobną pozycję za transport do ${w.cities[0]}.</li>
        <li style="margin-bottom:12px"><strong>Projekt</strong> — rysujemy pawilon pod Twoje potrzeby.</li>
        <li style="margin-bottom:12px"><strong>Produkcja w zakładzie</strong> — 3–4 tygodnie. Spawanie ramy, montaż ścian PIR 100 mm, wyposażenie instalacyjne.</li>
        <li style="margin-bottom:12px"><strong>Transport ${w.dist} km z Jędrzejowa</strong> — naczepa jedzie do Ciebie w około ${w.hours} h.</li>
        <li style="margin-bottom:12px"><strong>Montaż na miejscu</strong> — ekipa ustawia pawilon na przygotowanym podłożu.</li>
      </ol>
    </div>
  </section>

  <section class="section section-light">
    <div class="container">
      <p class="eyebrow">Pytania klientów z regionu</p>
      <h2 class="h2">Pawilony — region ${w.name}</h2>
      <div class="faq-list" style="max-width:780px;margin:40px auto 0">
        ${faq.map(item => `<details class="faq-item"><summary>${item.q}</summary><p>${item.a}</p></details>`).join('\n        ')}
      </div>
      <p style="max-width:780px;margin:24px auto 0"><a href="../../pawilon-bez-pozwolenia-przepisy.html">Pawilon do 35 m² — zgłoszenie czy pozwolenie</a></p>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <p class="eyebrow">Inne regiony</p>
      <h2 class="h2">Pawilony w pozostałych województwach</h2>
      <div class="cities-grid">
        <a class="city-pill" href="../../regiony.html">Wszystkie regiony</a>
        ${inne}
      </div>
    </div>
  </section>

  <section class="section section-dark">
    <div class="container" style="text-align:center">
      <p class="eyebrow">Wycena dla regionu</p>
      <h2 class="h2">Pawilon — ${w.cities[0]}? <span class="accent">Zadzwoń.</span></h2>
      <p style="color:var(--t-light2);font-size:1.05rem;max-width:600px;margin:16px auto 32px">Powiedz, czego potrzebujesz i gdzie ma stanąć. Wycena darmowa, w 24 godziny, z osobną pozycją za transport i montaż.</p>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
        <a href="tel:+48509508210" class="btn btn-primary btn-lg">Zadzwoń: 509 508 210</a>
        <a href="../../konfigurator.html" class="btn btn-outline-light">Darmowa wycena online</a>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <img src="../../assets/logo-white.webp" alt="STAGO" class="footer-logo"${logoWhite} loading="lazy">
        <p>Producent pawilonów modułowych.<br>Jędrzejów, woj. świętokrzyskie.</p>
      </div>
      <div class="footer-cols">
        <div><h4>Modele</h4><a href="../../modele.html">Wszystkie modele</a><a href="../../cennik-pawilonow-handlowych.html">Cennik pawilonów</a><a href="../../konfigurator.html">Konfigurator</a></div>
        <div><h4>Zastosowania</h4><a href="../../zastosowania.html">Wszystkie</a><a href="../../zastosowania/handlowy.html">Handlowe</a><a href="../../zastosowania/biurowy.html">Biurowe</a><a href="../../zastosowania/gastronomiczny.html">Gastronomiczne</a></div>
        <div><h4>Firma</h4><a href="../../jak-kupic.html">Jak kupić</a><a href="../../technologia.html">Technologia</a><a href="../../finansowanie.html">Finansowanie</a><a href="../../regiony.html">Regiony</a><a href="../../realizacje.html">Realizacje</a><a href="../../faq.html">FAQ</a><a href="../../kontakt.html">Kontakt</a></div>
        <div><h4>Kontakt</h4><a href="tel:+48509508210">+48 509 508 210</a><a href="tel:+48509508110">+48 509 508 110</a><a href="mailto:kontakt@stago.com.pl">kontakt@stago.com.pl</a><a href="https://maps.app.goo.gl/YehaPostjwupY4zh7" target="_blank" rel="noopener">Jasionka 117, Jędrzejów</a></div>
      </div>
    </div>
    <div class="container footer-bottom">
      <div class="footer-legal"><a href="../../polityka-prywatnosci.html">Polityka prywatności</a><a href="../../regulamin.html">Regulamin</a><a href="https://erp.stago.com.pl/api/public/owz.pdf" target="_blank" rel="noopener">OWZ (PDF)</a></div>
      <p>&copy; 2026 STAGO &middot; Stworzone przez <a href="https://isiko.pl" target="_blank">ISIKO</a></p>
    </div>
  </footer>
  <script>document.getElementById('nav-toggle')?.addEventListener('click',function(){document.getElementById('nav-links').classList.toggle('open');});</script>
  <script src="../../cookies.js"></script>
</body>
</html>
`;
}

const outDir = path.join(ROOT, 'pawilony', 'wojewodztwo');
fs.mkdirSync(outDir, { recursive: true });
for (const w of wojewodztwa) {
  const html = buildPage(w);
  if ((html.match(/<h1\b/gi) || []).length !== 1) {
    console.error(`gen-wojewodztwa: ${w.slug} nie ma dokładnie jednego h1`);
    process.exit(1);
  }
  if (/transport[^<.]{0,40}w cenie|montaż[^<.]{0,40}w cenie/i.test(html)) {
    console.error(`gen-wojewodztwa: ${w.slug} obiecuje transport lub montaż w cenie`);
    process.exit(1);
  }
  const title = (html.match(/<title>([^<]*)<\/title>/) || [, ''])[1];
  const desc = (html.match(/name="description" content="([^"]*)"/) || [, ''])[1];
  if (title.length > 70 || desc.length > 165 || desc.length < 70) {
    console.error(`gen-wojewodztwa: ${w.slug} title=${title.length} desc=${desc.length}`);
    process.exit(1);
  }
  fs.writeFileSync(path.join(outDir, `${w.slug}.html`), html);
  console.log(`Generated ${w.slug}.html`);
}
console.log(`województwa: ${wojewodztwa.length}`);
