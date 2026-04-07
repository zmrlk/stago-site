// Generator 16 stron geo SEO dla województw
// Run: node scripts/gen-wojewodztwa.js
const fs = require('fs');
const path = require('path');

const wojewodztwa = [
  { slug: 'mazowieckie', name: 'mazowieckie', cities: ['Warszawa','Radom','Płock','Siedlce','Ostrołęka','Pruszków'], dist: 250, hours: '4-5', popular: ['NORD','LOFT','DUET','ICON','MILA','NOIR'] },
  { slug: 'malopolskie', name: 'małopolskie', cities: ['Kraków','Tarnów','Nowy Sącz','Oświęcim','Chrzanów','Bochnia'], dist: 130, hours: '2-3', popular: ['NORD','LOFT','MILA','ICON','RYTM','DUET'] },
  { slug: 'slaskie', name: 'śląskie', cities: ['Katowice','Częstochowa','Sosnowiec','Gliwice','Bytom','Tychy'], dist: 180, hours: '3-4', popular: ['DUET','LOFT','NORD','CUBE','NOIR','SAGA'] },
  { slug: 'wielkopolskie', name: 'wielkopolskie', cities: ['Poznań','Kalisz','Konin','Piła','Ostrów','Leszno'], dist: 400, hours: '5-6', popular: ['NORD','LOFT','RYTM','ICON','DUET','MILA'] },
  { slug: 'dolnoslaskie', name: 'dolnośląskie', cities: ['Wrocław','Wałbrzych','Legnica','Jelenia Góra','Lubin','Głogów'], dist: 380, hours: '5-6', popular: ['LOFT','DUET','NORD','SAGA','ICON','VIEW'] },
  { slug: 'lodzkie', name: 'łódzkie', cities: ['Łódź','Piotrków Trybunalski','Pabianice','Tomaszów','Bełchatów','Zgierz'], dist: 200, hours: '3-4', popular: ['LOFT','NORD','DUET','MILA','RYTM','CUBE'] },
  { slug: 'pomorskie', name: 'pomorskie', cities: ['Gdańsk','Gdynia','Sopot','Słupsk','Tczew','Wejherowo'], dist: 580, hours: '7-8', popular: ['SAGA','VIEW','LOFT','MILA','NORD','ICON'] },
  { slug: 'zachodniopomorskie', name: 'zachodniopomorskie', cities: ['Szczecin','Koszalin','Stargard','Kołobrzeg','Świnoujście','Police'], dist: 650, hours: '8-9', popular: ['SAGA','VIEW','NORD','MILA','LOFT','ATRI'] },
  { slug: 'lubelskie', name: 'lubelskie', cities: ['Lublin','Chełm','Zamość','Biała Podlaska','Puławy','Świdnik'], dist: 300, hours: '4-5', popular: ['DUET','MILA','RYTM','NORD','LOFT','ATRI'] },
  { slug: 'podkarpackie', name: 'podkarpackie', cities: ['Rzeszów','Przemyśl','Stalowa Wola','Mielec','Tarnobrzeg','Krosno'], dist: 320, hours: '4-5', popular: ['NORD','MILA','DUET','LOFT','RYTM','ICON'] },
  { slug: 'swietokrzyskie', name: 'świętokrzyskie', cities: ['Kielce','Ostrowiec','Skarżysko','Starachowice','Sandomierz','Końskie'], dist: 60, hours: '1-2', popular: ['NORD','LOFT','DUET','MILA','ICON','RYTM'] },
  { slug: 'kujawsko-pomorskie', name: 'kujawsko-pomorskie', cities: ['Bydgoszcz','Toruń','Włocławek','Grudziądz','Inowrocław','Brodnica'], dist: 380, hours: '5-6', popular: ['LOFT','NORD','DUET','RYTM','MILA','SAGA'] },
  { slug: 'warminsko-mazurskie', name: 'warmińsko-mazurskie', cities: ['Olsztyn','Elbląg','Ełk','Ostróda','Iława','Giżycko'], dist: 480, hours: '6-7', popular: ['MILA','NORD','VIEW','SAGA','ATRI','RYTM'] },
  { slug: 'podlaskie', name: 'podlaskie', cities: ['Białystok','Suwałki','Łomża','Augustów','Bielsk Podlaski','Hajnówka'], dist: 420, hours: '6-7', popular: ['MILA','NORD','RYTM','DUET','ATRI','CUBE'] },
  { slug: 'lubuskie', name: 'lubuskie', cities: ['Zielona Góra','Gorzów Wielkopolski','Nowa Sól','Żary','Świebodzin','Międzyrzecz'], dist: 460, hours: '6-7', popular: ['LOFT','NORD','SAGA','RYTM','VIEW','DUET'] },
  { slug: 'opolskie', name: 'opolskie', cities: ['Opole','Kędzierzyn-Koźle','Nysa','Brzeg','Kluczbork','Strzelce Opolskie'], dist: 250, hours: '3-4', popular: ['NORD','LOFT','DUET','CUBE','RYTM','MILA'] },
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

const buildPage = (w) => `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pawilony modułowe STAGO — województwo ${w.name} | ${w.cities[0]}, ${w.cities[1]}, ${w.cities[2]}</title>
  <meta name="description" content="Producent pawilonów modułowych STAGO. Województwo ${w.name} — ${w.cities.slice(0,4).join(', ')} i okolice. Transport z Jędrzejowa, montaż na miejscu. Darmowa wycena.">
  <link rel="canonical" href="https://stago.com.pl/pawilony/wojewodztwo/${w.slug}.html">
  <meta name="theme-color" content="#1D1D1B">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../style.css">
  <link rel="icon" type="image/png" href="../../assets/sygnet.png">
</head>
<body>
  <nav class="nav" id="nav">
    <div class="nav-inner">
      <a href="../../index.html" class="nav-logo"><img src="../../assets/logo.png" alt="STAGO" class="nav-logo-img"></a>
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
    <a href="../../index.html">Strona główna</a><span>/</span><a href="../../realizacje.html">Realizacje</a><span>/</span>${w.name}
  </div>

  <section class="container hub-hero">
    <p class="eyebrow">Województwo ${w.name}</p>
    <h1 class="h1">Pawilony modułowe STAGO. <span class="accent">Region: ${w.name}.</span></h1>
    <p class="hub-sub">Dostarczamy pawilony modułowe na cały region — województwo ${w.name}. Miasta: ${w.cities.slice(0,5).join(', ')} i okolice. Transport z naszego zakładu w Jasionce pod Jędrzejowem, montaż naszą ekipą. Wycena darmowa.</p>
  </section>

  <section class="section section-light">
    <div class="container">
      <p class="eyebrow">Nasz zasięg</p>
      <h2 class="h2">Obsługujemy cały region</h2>
      <p class="section-sub">Dojeżdżamy lawetą do każdej miejscowości w regionie. Transport i montaż w cenie pawilonu — niezależnie od tego, gdzie mieszkasz.</p>
      <div class="cities-grid">
        ${w.cities.map(c => `<div class="city-pill">${c}</div>`).join('\n        ')}
        <div class="city-pill city-pill-more">+ inne miejscowości</div>
      </div>
      <div class="region-stats">
        <div class="region-stat"><strong>~${w.dist} km</strong><span>z naszego zakładu</span></div>
        <div class="region-stat"><strong>${w.hours} h</strong><span>czas dostawy lawetą</span></div>
        <div class="region-stat"><strong>w cenie</strong><span>transport i montaż</span></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <p class="eyebrow">Polecane modele</p>
      <h2 class="h2">Co wybierają klienci z regionu</h2>
      <p class="section-sub">Te bryły sprawdzają się najlepiej w warunkach regionu — od miasta po działki rekreacyjne. Każdy model dopasujemy pod Twoją sytuację.</p>
      <div class="models-grid" style="margin-top:40px">
${w.popular.map(code => `        <a href="../../modele/${code.toLowerCase()}.html" class="model-card">
          <div class="model-card-img"><img src="../../assets/modele/${code.toLowerCase()}.png" alt="STAGO ${code}" loading="lazy"></div>
          <div class="model-card-body">
            <span class="model-card-code">${code}</span>
            <h3>${code}</h3>
            <p>${modelDescs[code]}</p>
            <span class="model-card-cta">Zobacz model &rarr;</span>
          </div>
        </a>`).join('\n')}
      </div>
    </div>
  </section>

  <section class="section section-light">
    <div class="container">
      <p class="eyebrow">Pytania klientów z regionu</p>
      <h2 class="h2">Pawilony — region ${w.name}</h2>
      <div class="faq-list" style="max-width:780px;margin:40px auto 0">
        <details class="faq-item"><summary>Ile kosztuje transport pawilonu do ${w.cities[0]}?</summary><p>Nic — transport jest w cenie pawilonu. Z naszego zakładu w Jasionce pod Jędrzejowem do ${w.cities[0]} to ${w.dist} km, lawetą około ${w.hours} godzin. Dojeżdżamy do każdej miejscowości w regionie.</p></details>
        <details class="faq-item"><summary>Jak długo czeka się na pawilon w regionie ${w.name}?</summary><p>Standardowo 4-6 tygodni od podpisania umowy do gotowego pawilonu na Twojej działce. Pierwsze 1-2 tygodnie projekt, 3-4 tygodnie produkcja, dostawa w jeden dzień. Dla pilnych realizacji robimy szybciej — zadzwoń.</p></details>
        <details class="faq-item"><summary>Czy montujecie pawilon na miejscu w ${w.cities[1]}?</summary><p>Tak. Nasza ekipa przyjeżdża z lawetą, ustawia pawilon dźwigiem lub bezpośrednio z lawety. Sprawdzamy wszystko z Tobą podczas odbioru. Wymagamy tylko utwardzonego podłoża — pomagamy je zaplanować przed dostawą.</p></details>
        <details class="faq-item"><summary>Czy muszę mieć pozwolenie na pawilon — region ${w.name}?</summary><p>Pawilon do 35 m² — wystarczy zgłoszenie w urzędzie, nie pełne pozwolenie na budowę. Powyżej 35 m² potrzebne jest pozwolenie. Pomagamy z dokumentami w obu wariantach — przepisy są takie same w całej Polsce.</p></details>
        <details class="faq-item"><summary>Czy mogę przyjechać zobaczyć produkcję?</summary><p>Tak — i zachęcamy. Nasz zakład jest w Jasionce pod Jędrzejowem (region świętokrzyskie). Z ${w.cities[0]} to około ${w.dist} km. Większość klientów przyjeżdża 1-2 razy zobaczyć Twój pawilon w trakcie produkcji.</p></details>
      </div>
    </div>
  </section>

  <section class="section section-dark">
    <div class="container" style="text-align:center">
      <p class="eyebrow">Wycena dla regionu</p>
      <h2 class="h2">Pawilon — ${w.cities[0]}? <span class="accent">Zadzwoń.</span></h2>
      <p style="color:var(--t-light2);font-size:1.05rem;max-width:600px;margin:16px auto 32px">Powiedz, czego potrzebujesz i gdzie ma stanąć. Wycena darmowa, w 24 godziny dostajesz konkretną propozycję z transportem i montażem w cenie.</p>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
        <a href="tel:+48509508210" class="btn btn-primary btn-lg">Zadzwoń: 509 508 210</a>
        <a href="../../konfigurator.html" class="btn btn-outline-light">Darmowa wycena online</a>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <img src="../../assets/logo-white.png" alt="STAGO" class="footer-logo">
        <p>Producent pawilonów modułowych.<br>Jędrzejów, woj. świętokrzyskie.</p>
      </div>
      <div class="footer-cols">
        <div><h4>Modele</h4><a href="../../modele.html">Wszystkie 12 modeli</a><a href="../../modele/nord.html">NORD</a><a href="../../modele/loft.html">LOFT</a><a href="../../modele/duet.html">DUET</a></div>
        <div><h4>Zastosowania</h4><a href="../../zastosowania.html">Wszystkie</a><a href="../../zastosowania/handlowy.html">Handlowe</a><a href="../../zastosowania/biurowy.html">Biurowe</a><a href="../../zastosowania/gastronomiczny.html">Gastronomiczne</a></div>
        <div><h4>Firma</h4><a href="../../jak-kupic.html">Jak kupić</a><a href="../../technologia.html">Technologia</a><a href="../../finansowanie.html">Finansowanie</a><a href="../../realizacje.html">Realizacje</a><a href="../../faq.html">FAQ</a><a href="../../kontakt.html">Kontakt</a></div>
        <div><h4>Kontakt</h4><a href="tel:+48509508210">509 508 210</a><a href="mailto:kontakt@stago.com.pl">kontakt@stago.com.pl</a><a href="https://maps.google.com/?q=Jasionka+117+Jędrzejów" target="_blank">Jasionka 117, Jędrzejów</a></div>
      </div>
    </div>
    <div class="footer-bottom"><p>&copy; 2026 STAGO &middot; Stworzone przez <a href="https://isiko.pl" target="_blank">ISIKO</a></p></div>
  </footer>

  <script>document.getElementById('nav-toggle')?.addEventListener('click',function(){document.getElementById('nav-links').classList.toggle('open');});</script>
</body>
</html>
`;

const outDir = path.join(__dirname, '..', 'pawilony', 'wojewodztwo');
fs.mkdirSync(outDir, { recursive: true });
wojewodztwa.forEach(w => {
  fs.writeFileSync(path.join(outDir, `${w.slug}.html`), buildPage(w));
  console.log(`Generated ${w.slug}.html`);
});
console.log(`\nDone — ${wojewodztwa.length} województwa generated.`);
