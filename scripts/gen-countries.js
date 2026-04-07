// Generator 6 landing pages dla krajów eksportowych
// Run: node scripts/gen-countries.js
const fs = require('fs');
const path = require('path');

const countries = [
  {
    code: 'de', flag: '🇩🇪', langCode: 'de', country: 'Deutschland',
    title: 'Modulare Pavillons aus Polen — STAGO | Hersteller',
    desc: 'STAGO — Hersteller modularer Pavillons aus Polen. Geschäfte, Büros, Gastronomie, Wohnmodule. Lieferung nach Deutschland. Polnische Qualität, europäische Preise.',
    h1: 'Modulare Pavillons aus Polen.',
    h1accent: 'Direkt vom Hersteller.',
    sub: 'STAGO produziert hochwertige modulare Pavillons in Polen — und liefert sie nach ganz Deutschland. Geschäftslokale, Büros, Gastronomie, Wohnmodule. Stahlrahmen, PIR-Isolierung 100mm, Aluminium-Stolarka. Bessere Qualität zu europäischen Preisen.',
    usps: [
      { h3: 'Deutsche Qualität, polnischer Preis', text: 'Wir bauen nach denselben Standards wie deutsche Hersteller — Stahlrahmen, PIR-Isolierung 100mm, Aluminium-Stolarka. Aber zu einem Bruchteil des Preises.' },
      { h3: 'Lieferung nach ganz Deutschland', text: 'Wir transportieren mit eigenen LKW von unserem Werk in Polen. Lieferzeit nach Deutschland: 5-10 Tage je nach Region. Montage durch unser Team vor Ort.' },
      { h3: 'Alles nach Maß', text: '12 Modelle als Ausgangspunkt — Größe, Material, Farbe, Innenausstattung passen wir individuell an. Ladengeschäft, Büro, Wohnmodul oder Gartenpavillon.' },
    ],
    exportH3: 'Export nach Deutschland — Bedingungen',
    exportItems: [
      { l: 'Lieferzeit', r: '5-10 Tage' },
      { l: 'Transport', r: 'inklusive (eigene LKW)' },
      { l: 'Montage', r: 'inklusive (unser Team)' },
      { l: 'Garantie', r: '2 Jahre + Service' },
      { l: 'Zoll', r: 'EU — keine Gebühren' },
      { l: 'MwSt.', r: 'wir stellen DE-Rechnung aus' },
    ],
    ctaH2: 'Brauchen Sie einen Pavillon in Deutschland?',
    ctaSub: 'Sagen Sie uns, was Sie brauchen — wir senden Ihnen eine kostenlose 3D-Visualisierung und ein verbindliches Angebot innerhalb von 24 Stunden.',
    ctaBtn: 'Kostenlose Anfrage',
    callBtn: 'Anrufen: +48 509 508 210',
    nav: { models: 'Modelle', uses: 'Anwendungen', proj: 'Projekte', fin: 'Finanzierung', faq: 'FAQ', contact: 'Kontakt' },
  },
  {
    code: 'cz', flag: '🇨🇿', langCode: 'cs', country: 'Česká republika',
    title: 'Modulové pavilony z Polska — STAGO | Výrobce',
    desc: 'STAGO — výrobce modulových pavilonů z Polska. Obchody, kanceláře, gastronomie, obytné moduly. Doprava do České republiky. Polská kvalita, evropské ceny.',
    h1: 'Modulové pavilony z Polska.',
    h1accent: 'Přímo od výrobce.',
    sub: 'STAGO vyrábí kvalitní modulové pavilony v Polsku — a dodáváme je do celé České republiky. Prodejny, kanceláře, gastronomie, obytné moduly. Ocelová konstrukce, PIR izolace 100mm, hliníkové okna. Lepší kvalita za evropské ceny.',
    usps: [
      { h3: 'Evropská kvalita, polská cena', text: 'Stavíme podle stejných standardů jako západní výrobci — ocelový rám, PIR izolace 100mm, hliníkové okna. Ale za zlomek ceny.' },
      { h3: 'Doprava do celé ČR', text: 'Vlastní doprava z našeho závodu v Polsku. Dodací lhůta do České republiky: 3-5 dní. Montáž na místě naším týmem.' },
      { h3: 'Vše na míru', text: '12 modelů jako výchozí bod — rozměr, materiál, barva, vnitřní vybavení přizpůsobíme individuálně. Obchod, kancelář, byt, zahradní pavilon.' },
    ],
    exportH3: 'Export do České republiky — podmínky',
    exportItems: [
      { l: 'Dodací lhůta', r: '3-5 dní' },
      { l: 'Doprava', r: 'v ceně' },
      { l: 'Montáž', r: 'v ceně' },
      { l: 'Záruka', r: '2 roky + servis' },
      { l: 'Clo', r: 'EU — žádné poplatky' },
      { l: 'DPH', r: 'vystavujeme CZ fakturu' },
    ],
    ctaH2: 'Potřebujete pavilon v České republice?',
    ctaSub: 'Řekněte nám, co potřebujete — zašleme vám zdarma 3D vizualizaci a závaznou nabídku do 24 hodin.',
    ctaBtn: 'Bezplatná poptávka',
    callBtn: 'Zavolat: +48 509 508 210',
    nav: { models: 'Modely', uses: 'Použití', proj: 'Realizace', fin: 'Financování', faq: 'FAQ', contact: 'Kontakt' },
  },
  {
    code: 'sk', flag: '🇸🇰', langCode: 'sk', country: 'Slovensko',
    title: 'Modulové pavilóny z Poľska — STAGO | Výrobca',
    desc: 'STAGO — výrobca modulových pavilónov z Poľska. Obchody, kancelárie, gastronómia, obytné moduly. Doprava na Slovensko. Poľská kvalita, európske ceny.',
    h1: 'Modulové pavilóny z Poľska.',
    h1accent: 'Priamo od výrobcu.',
    sub: 'STAGO vyrába kvalitné modulové pavilóny v Poľsku — a dodávame ich na celé Slovensko. Predajne, kancelárie, gastronómia, obytné moduly. Oceľová konštrukcia, PIR izolácia 100mm, hliníkové okná. Lepšia kvalita za európske ceny.',
    usps: [
      { h3: 'Európska kvalita, poľská cena', text: 'Staviame podľa rovnakých štandardov ako západní výrobcovia — oceľový rám, PIR izolácia 100mm, hliníkové okná. Ale za zlomok ceny.' },
      { h3: 'Doprava po celom Slovensku', text: 'Vlastná doprava z nášho závodu v Poľsku. Dodacia lehota na Slovensko: 2-4 dni. Montáž na mieste naším tímom.' },
      { h3: 'Všetko na mieru', text: '12 modelov ako východiskový bod — rozmer, materiál, farba, vnútorné vybavenie prispôsobíme individuálne. Obchod, kancelária, byt, záhradný pavilón.' },
    ],
    exportH3: 'Export na Slovensko — podmienky',
    exportItems: [
      { l: 'Dodacia lehota', r: '2-4 dni' },
      { l: 'Doprava', r: 'v cene' },
      { l: 'Montáž', r: 'v cene' },
      { l: 'Záruka', r: '2 roky + servis' },
      { l: 'Clo', r: 'EU — žiadne poplatky' },
      { l: 'DPH', r: 'vystavujeme SK faktúru' },
    ],
    ctaH2: 'Potrebujete pavilón na Slovensku?',
    ctaSub: 'Povedzte nám, čo potrebujete — pošleme vám bezplatnú 3D vizualizáciu a záväznú ponuku do 24 hodín.',
    ctaBtn: 'Bezplatný dopyt',
    callBtn: 'Zavolať: +48 509 508 210',
    nav: { models: 'Modely', uses: 'Použitie', proj: 'Realizácie', fin: 'Financovanie', faq: 'FAQ', contact: 'Kontakt' },
  },
  {
    code: 'hu', flag: '🇭🇺', langCode: 'hu', country: 'Magyarország',
    title: 'Moduláris pavilonok Lengyelországból — STAGO | Gyártó',
    desc: 'STAGO — moduláris pavilonok lengyel gyártója. Üzletek, irodák, vendéglátás, lakómodulok. Szállítás Magyarországra. Lengyel minőség, európai árak.',
    h1: 'Moduláris pavilonok Lengyelországból.',
    h1accent: 'Közvetlenül a gyártótól.',
    sub: 'A STAGO minőségi moduláris pavilonokat gyárt Lengyelországban — és egész Magyarországra szállítunk. Üzletek, irodák, vendéglátás, lakómodulok. Acélkeret, PIR szigetelés 100mm, alumínium nyílászárók. Jobb minőség európai áron.',
    usps: [
      { h3: 'Európai minőség, lengyel ár', text: 'Ugyanazon szabványok szerint építünk, mint a nyugati gyártók — acélkeret, PIR szigetelés 100mm, alumínium nyílászárók. De töredékáron.' },
      { h3: 'Szállítás egész Magyarországra', text: 'Saját szállítás lengyelországi üzemünkből. Szállítási idő Magyarországra: 3-5 nap. Helyszíni szerelés csapatunkkal.' },
      { h3: 'Mindent egyedi méretre', text: '12 modell kiindulópontként — méret, anyag, szín, belső felszerelés egyénileg testreszabva. Üzlet, iroda, lakás, kerti pavilon.' },
    ],
    exportH3: 'Export Magyarországra — feltételek',
    exportItems: [
      { l: 'Szállítási idő', r: '3-5 nap' },
      { l: 'Szállítás', r: 'az árban' },
      { l: 'Szerelés', r: 'az árban' },
      { l: 'Garancia', r: '2 év + szerviz' },
      { l: 'Vám', r: 'EU — díjmentes' },
      { l: 'ÁFA', r: 'HU számlát állítunk ki' },
    ],
    ctaH2: 'Pavilonra van szüksége Magyarországon?',
    ctaSub: 'Mondja el, mire van szüksége — 24 órán belül elküldjük az ingyenes 3D vizualizációt és az árajánlatot.',
    ctaBtn: 'Ingyenes ajánlat',
    callBtn: 'Hívás: +48 509 508 210',
    nav: { models: 'Modellek', uses: 'Alkalmazások', proj: 'Megvalósítások', fin: 'Finanszírozás', faq: 'GYIK', contact: 'Kapcsolat' },
  },
  {
    code: 'it', flag: '🇮🇹', langCode: 'it', country: 'Italia',
    title: 'Padiglioni modulari dalla Polonia — STAGO | Produttore',
    desc: 'STAGO — produttore di padiglioni modulari dalla Polonia. Negozi, uffici, ristorazione, moduli abitativi. Consegna in Italia. Qualità polacca, prezzi europei.',
    h1: 'Padiglioni modulari dalla Polonia.',
    h1accent: 'Direttamente dal produttore.',
    sub: 'STAGO produce padiglioni modulari di alta qualità in Polonia — e consegna in tutta Italia. Negozi, uffici, ristorazione, moduli abitativi. Telaio in acciaio, isolamento PIR 100mm, infissi in alluminio. Qualità superiore a prezzi europei.',
    usps: [
      { h3: 'Qualità europea, prezzo polacco', text: 'Costruiamo secondo gli stessi standard dei produttori occidentali — telaio in acciaio, isolamento PIR 100mm, infissi in alluminio. Ma a una frazione del prezzo.' },
      { h3: 'Consegna in tutta Italia', text: 'Trasporto proprio dal nostro stabilimento in Polonia. Tempi di consegna in Italia: 7-12 giorni. Installazione in loco con il nostro team.' },
      { h3: 'Tutto su misura', text: '12 modelli come punto di partenza — dimensioni, materiali, colori, allestimenti interni personalizzati. Negozio, ufficio, casa, padiglione da giardino.' },
    ],
    exportH3: 'Export in Italia — condizioni',
    exportItems: [
      { l: 'Tempi di consegna', r: '7-12 giorni' },
      { l: 'Trasporto', r: 'incluso' },
      { l: 'Installazione', r: 'inclusa' },
      { l: 'Garanzia', r: '2 anni + assistenza' },
      { l: 'Dogana', r: 'UE — nessuna tassa' },
      { l: 'IVA', r: 'fattura IT disponibile' },
    ],
    ctaH2: 'Hai bisogno di un padiglione in Italia?',
    ctaSub: 'Dicci di cosa hai bisogno — ti invieremo una visualizzazione 3D gratuita e un preventivo entro 24 ore.',
    ctaBtn: 'Richiesta gratuita',
    callBtn: 'Chiama: +48 509 508 210',
    nav: { models: 'Modelli', uses: 'Applicazioni', proj: 'Realizzazioni', fin: 'Finanziamento', faq: 'FAQ', contact: 'Contatto' },
  },
  {
    code: 'es', flag: '🇪🇸', langCode: 'es', country: 'España',
    title: 'Pabellones modulares de Polonia — STAGO | Fabricante',
    desc: 'STAGO — fabricante de pabellones modulares desde Polonia. Tiendas, oficinas, gastronomía, módulos residenciales. Entrega en España. Calidad polaca, precios europeos.',
    h1: 'Pabellones modulares de Polonia.',
    h1accent: 'Directamente del fabricante.',
    sub: 'STAGO fabrica pabellones modulares de alta calidad en Polonia — y los entrega en toda España. Tiendas, oficinas, gastronomía, módulos residenciales. Estructura de acero, aislamiento PIR 100mm, carpintería de aluminio. Mejor calidad a precios europeos.',
    usps: [
      { h3: 'Calidad europea, precio polaco', text: 'Construimos según los mismos estándares que los fabricantes occidentales — estructura de acero, aislamiento PIR 100mm, carpintería de aluminio. Pero a una fracción del precio.' },
      { h3: 'Entrega en toda España', text: 'Transporte propio desde nuestra fábrica en Polonia. Tiempo de entrega en España: 8-14 días. Instalación in situ con nuestro equipo.' },
      { h3: 'Todo a medida', text: '12 modelos como punto de partida — dimensiones, materiales, colores, interiores personalizados. Tienda, oficina, vivienda, pabellón de jardín.' },
    ],
    exportH3: 'Exportación a España — condiciones',
    exportItems: [
      { l: 'Tiempo de entrega', r: '8-14 días' },
      { l: 'Transporte', r: 'incluido' },
      { l: 'Instalación', r: 'incluida' },
      { l: 'Garantía', r: '2 años + servicio' },
      { l: 'Aduana', r: 'UE — sin tasas' },
      { l: 'IVA', r: 'factura ES disponible' },
    ],
    ctaH2: '¿Necesitas un pabellón en España?',
    ctaSub: 'Cuéntanos qué necesitas — te enviaremos una visualización 3D gratuita y un presupuesto en 24 horas.',
    ctaBtn: 'Consulta gratuita',
    callBtn: 'Llamar: +48 509 508 210',
    nav: { models: 'Modelos', uses: 'Aplicaciones', proj: 'Proyectos', fin: 'Financiación', faq: 'FAQ', contact: 'Contacto' },
  },
];

const buildPage = (c) => `<!DOCTYPE html>
<html lang="${c.langCode}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.title}</title>
  <meta name="description" content="${c.desc}">
  <link rel="canonical" href="https://stago.com.pl/${c.code}/">
  <link rel="alternate" hreflang="pl" href="https://stago.com.pl/">
  <link rel="alternate" hreflang="${c.langCode}" href="https://stago.com.pl/${c.code}/">
  <meta name="theme-color" content="#1D1D1B">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../style.css">
  <link rel="icon" type="image/png" href="../assets/sygnet.png">
</head>
<body>
  <nav class="nav" id="nav">
    <div class="nav-inner">
      <a href="../index.html" class="nav-logo"><img src="../assets/logo.png" alt="STAGO" class="nav-logo-img"></a>
      <div class="nav-links" id="nav-links">
        <a href="#models">${c.nav.models}</a>
        <a href="#export">${c.nav.uses}</a>
        <a href="#contact">${c.nav.contact}</a>
        <a href="../index.html" style="font-size:.85rem">🇵🇱 PL</a>
      </div>
      <div class="nav-right">
        <a href="tel:+48509508210" class="nav-phone"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>+48 509 508 210</a>
      </div>
      <button class="nav-toggle" id="nav-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>
  </nav>

  <section class="container country-hero">
    <span class="country-flag">${c.flag}</span>
    <h1 class="h1">${c.h1} <span class="accent">${c.h1accent}</span></h1>
    <p class="hub-sub" style="max-width:760px;margin:24px auto 32px">${c.sub}</p>
    <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
      <a href="mailto:export@stago.com.pl?subject=${encodeURIComponent(c.country + ' — Inquiry')}" class="btn btn-primary btn-lg">${c.ctaBtn}</a>
      <a href="tel:+48509508210" class="btn btn-outline-dark">${c.callBtn}</a>
    </div>
  </section>

  <section class="section section-light" id="models">
    <div class="container">
      <h2 class="h2">${c.usps[0].h3.split(',')[0]}</h2>
      <div class="country-usp-grid">
        ${c.usps.map(u => `<div class="country-usp"><h3>${u.h3}</h3><p>${u.text}</p></div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="section" id="export">
    <div class="container">
      <div class="country-export-info">
        <h3>${c.exportH3}</h3>
        <ul>
          ${c.exportItems.map(it => `<li><strong>${it.l}:</strong> ${it.r}</li>`).join('\n          ')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section section-light">
    <div class="container">
      <h2 class="h2">12 ${c.nav.models.toLowerCase()}</h2>
      <p class="section-sub" style="max-width:680px;margin:0 auto 40px">${c.sub.split('.')[0]}.</p>
      <div class="hub-grid" style="margin-top:24px">
        ${['nord','loft','duet','icon','mila','noir'].map(m => `<a href="../modele/${m}.html" class="hub-card"><div class="hub-card-img"><img src="../assets/modele/${m}.png" alt="STAGO ${m.toUpperCase()}" loading="lazy"></div><div class="hub-card-body"><span class="hub-card-code">${m.toUpperCase()}</span><h3>${m.toUpperCase()}</h3><span class="hub-card-cta">→</span></div></a>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="section section-dark" id="contact">
    <div class="container" style="text-align:center">
      <h2 class="h2">${c.ctaH2}</h2>
      <p style="color:var(--t-light2);font-size:1.05rem;max-width:600px;margin:16px auto 32px">${c.ctaSub}</p>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
        <a href="mailto:export@stago.com.pl?subject=${encodeURIComponent(c.country + ' — Inquiry')}" class="btn btn-primary btn-lg">${c.ctaBtn}</a>
        <a href="tel:+48509508210" class="btn btn-outline-light">${c.callBtn}</a>
      </div>
      <p style="margin-top:32px;font-size:.85rem;color:var(--t-light2)">STAGO &middot; Jasionka 117, 28-300 Jędrzejów, Poland &middot; export@stago.com.pl</p>
    </div>
  </section>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <img src="../assets/logo-white.png" alt="STAGO" class="footer-logo">
        <p>Modular pavilions producer.<br>Jędrzejów, Poland.</p>
      </div>
      <div class="footer-cols">
        <div><h4>STAGO</h4><a href="../index.html">🇵🇱 Polska</a><a href="../de/">🇩🇪 Deutschland</a><a href="../cz/">🇨🇿 Česko</a><a href="../sk/">🇸🇰 Slovensko</a></div>
        <div><h4>Export</h4><a href="../hu/">🇭🇺 Magyarország</a><a href="../it/">🇮🇹 Italia</a><a href="../es/">🇪🇸 España</a></div>
        <div><h4>${c.nav.contact}</h4><a href="tel:+48509508210">+48 509 508 210</a><a href="mailto:export@stago.com.pl">export@stago.com.pl</a></div>
        <div><h4>Address</h4><span class="footer-cities">Jasionka 117<br>28-300 Jędrzejów<br>Poland</span></div>
      </div>
    </div>
    <div class="footer-bottom"><p>&copy; 2026 STAGO &middot; Made by <a href="https://isiko.pl" target="_blank">ISIKO</a></p></div>
  </footer>

  <script>document.getElementById('nav-toggle')?.addEventListener('click',function(){document.getElementById('nav-links').classList.toggle('open');});</script>
</body>
</html>
`;

countries.forEach(c => {
  const dir = path.join(__dirname, '..', c.code);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), buildPage(c));
  console.log(`Generated ${c.code}/index.html`);
});
console.log(`\nDone — ${countries.length} country landings generated.`);
