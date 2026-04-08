/* STAGO — app.js — Premium Mobile Edition */

// ── CASE STUDY ROTATION ──
const stories = [
  {
    id: 'tomek',
    img: 'assets/warzywniak-tomek.webp',
    alt: 'Warzywniak Tomka — pawilon STAGO, Busko-Zdrój',
    intro: 'Płacisz czynsz za lokal, który nigdy nie będzie Twój? Może czas na zmianę — tak jak Tomek.',
    h2: 'Tomek przeniósł warzywniak. <span class="accent">Na swoich zasadach.</span>',
    chapters: [
      {
        label: 'Sytuacja',
        text: 'Tomek prowadził warzywniak w wynajętym lokalu na rynku. Przez kilka lat płacił czynsz, który nie budował niczego jego — ani metra kwadratowego, ani jednej ściany. Właściciel lokalu podniósł stawkę z dnia na dzień. Tomek zaczął liczyć i szukać wyjścia. Nie chciał kolejnego wynajmu — chciał czegoś, co będzie jego.'
      },
      {
        label: 'Jeden telefon',
        text: 'Zadzwonił do nas i opowiedział, co mu chodzi po głowie. Narysowaliśmy pawilon z dużą witryną przeszkloną — żeby owoce i warzywa były widoczne z ulicy — i zapleczem chłodniczym z tyłu. Tomek miał swoje pomysły na układ, kolory elewacji. Nie musieliśmy go przekonywać — po prostu dopasowaliśmy projekt do tego, co sobie wyobraził. Dwa spotkania, kilka poprawek i projekt był gotowy.'
      },
      {
        label: 'Efekt',
        text: 'Dziś Tomek stoi na własnej działce, we własnym pawilonie, na własnych zasadach. Rata leasingowa wychodzi go mniej niż dawny czynsz — a za kilka lat pawilon będzie w całości jego. Klienci mówią, że jego warzywniak wygląda lepiej niż połowa sklepów w mieście. Tomek mówi, że żałuje tylko jednego.'
      }
    ],
    quote: 'Żałuję tylko jednego — że nie zadzwoniłem wcześniej.',
    cite: '— Tomek, warzywniak, Busko-Zdrój'
  },
  {
    id: 'marek',
    img: 'assets/historia-marek.webp',
    alt: 'Nowy pawilon STAGO z płytą PIR — wymiana starego obiektu',
    intro: 'Stary pawilon, który więcej kosztuje niż zarabia? Marek znał to aż za dobrze.',
    h2: 'Marek wymienił pawilon. <span class="accent">Rachunki spadły o połowę.</span>',
    chapters: [
      {
        label: 'Sytuacja',
        text: 'Marek prowadził punkt usługowy w pawilonie, który kupił lata temu od innej firmy. Ściany z cienkiej blachy, izolacja praktycznie żadna. Zimą klimatyzacja na full, a w środku i tak zimno — klienci wchodzili w kurtkach. Latem odwrotnie: blaszany piec nie do wytrzymania. Rachunki za prąd rosły z roku na rok, a pawilon wyglądał coraz gorzej. Marek wiedział, że łatanie nie ma sensu — ale bał się, że wymiana to skomplikowana sprawa.'
      },
      {
        label: 'Jeden telefon',
        text: 'Zadzwonił, opowiedział sytuację. Przyjechaliśmy, obejrzeliśmy stary pawilon, zmierzyliśmy działkę. Zaproponowaliśmy nowy obiekt z płytą warstwową PIR 10 cm — to izolacja, która trzyma ciepło zimą i chłód latem, bez mostków termicznych, bez dokładania dodatkowego ocieplenia. Marek wybrał układ zbliżony do starego, żeby nie zmieniać przyzwyczajeń klientów — ale z lepszą stolarką aluminiową i porządnym zapleczem. Stary pawilon zdemontowaliśmy, nowy postawiliśmy w tym samym miejscu.'
      },
      {
        label: 'Efekt',
        text: 'Pierwszy rachunek za prąd po wymianie — Marek nie wierzył. Klima na minimum, a w środku ciepło i przyjemnie. Klienci zaczęli zostawać dłużej. Pawilon wygląda jak nowy lokal — bo to jest nowy lokal. Marek mówi, że gdyby wiedział wcześniej, ile traci na ogrzewaniu starego blaszaka, nie czekałby ani dnia.'
      }
    ],
    quote: 'Powinienem to zrobić trzy zimy temu. Tyle pieniędzy poszło w błoto.',
    cite: '— Marek, punkt usługowy, Radomsko'
  },
  {
    id: 'jan',
    img: 'assets/historia-jan.webp',
    alt: 'Serwis rowerowy Jana — pawilon STAGO z witryną',
    intro: 'Garaż pękał w szwach? Jan postanowił wyjść z garażu — dosłownie.',
    h2: 'Jan otworzył serwis rowerowy. <span class="accent">W prawdziwym lokalu.</span>',
    chapters: [
      {
        label: 'Sytuacja',
        text: 'Jan naprawiał rowery w garażu przy domu. Zaczynał hobbystycznie, ale z czasem klientów przybywało. Problem: w garażu nie było miejsca na porządny warsztat, nie mówiąc o części klienckiej. Rowery stały jeden na drugim, narzędzia leżały gdzie popadnie. Klienci wchodzili bokiem między pudłami. Jan wiedział, że jeśli chce traktować to poważnie — potrzebuje prawdziwego lokalu. Ale wynajem w mieście? Za drogo. Budowa murowana? Za długo.'
      },
      {
        label: 'Jeden telefon',
        text: 'Zadzwonił do nas. Opowiedzieliśmy mu, że pawilon modułowy to coś pomiędzy — własny lokal, ale bez pozwolenia na budowę do 35 m², bez fundamentów, bez czekania miesiącami. Zaprojektowaliśmy układ: z przodu część kliencka z ladą i wystawą akcesoriów, z tyłu warsztat z porządnym oświetleniem i miejscem na stojaki. Jan chciał duże przeszklenie od frontu — żeby ludzie widzieli, że to profesjonalny serwis, nie garaż. Dobraliśmy ciemną elewację z pomarańczowym akcentem, żeby pasowało do jego logo.'
      },
      {
        label: 'Efekt',
        text: 'Dziś Jan ma lokal, który wygląda jak prawdziwy sklep — bo to jest prawdziwy sklep. Klienci przychodzą z ulicy, bo widzą witrynę. Ma miejsce na wszystko: narzędzia poukładane, rowery na stojakach, a nie na podłodze. Mówi, że od kiedy wyprowadził się z garażu, klienci zaczęli go traktować inaczej — bardziej poważnie, częściej wracają, częściej polecają.'
      }
    ],
    quote: 'W garażu byłem gościem, który naprawia rowery. Teraz mam serwis.',
    cite: '— Jan, serwis rowerowy, Wieluń'
  },
];

// Pick random story and render (data is hardcoded above, not user input)
(function initStory() {
  const el = {
    img: document.getElementById('story-img'),
    intro: document.getElementById('story-intro'),
    h2: document.getElementById('story-h2'),
    narrative: document.getElementById('story-narrative'),
    quote: document.getElementById('story-quote'),
    cite: document.getElementById('story-cite')
  };
  if (!el.img || !el.narrative) return;

  const story = stories[Math.floor(Math.random() * stories.length)];

  el.img.src = story.img;
  el.img.alt = story.alt;
  el.intro.textContent = story.intro;
  el.h2.innerHTML = story.h2;

  el.narrative.innerHTML = story.chapters.map(ch => `
    <div class="story-chapter reveal">
      <div class="story-chapter-label">${ch.label}</div>
      <p>${ch.text}</p>
    </div>
  `).join('');

  // Update quote text (first text node) and cite separately
  const citeEl = el.quote.querySelector('cite');
  // Clear and rebuild blockquote content
  el.quote.textContent = `\u201C${story.quote}\u201D`;
  citeEl.textContent = story.cite;
  el.quote.appendChild(citeEl);
})();

// ── PRODUCT DATA ──
const products = {
  handlowy: {
    title: 'Pawilon handlowy',
    subtitle: 'Sklep, kiosk, punkt usługowy',
    img: 'assets/products/handlowy.png',
    desc: 'Nowoczesny pawilon handlowy to idealne rozwiązanie dla osób, które chcą szybko otworzyć sklep, punkt usługowy, kiosk, kwiaciarni czy kawiarnię. Produkujemy pawilony od 3x2m do 12x3m — dopasowane do Twoich potrzeb i lokalizacji.',
    desc2: 'Każdy pawilon handlowy wyposażamy w okna panoramiczne zapewniające doskonałe doświetlenie i ekspozycję towaru. Standardowo montujemy instalację elektryczną, oświetlenie LED i ogrzewanie. Na życzenie dodajemy klimatyzację, rolety zewnętrzne, podłogę antypoślizgową i system alarmowy.',
    specs: [
      ['Wymiary', 'od 3x2m do 12x3m'],
      ['Konstrukcja', 'Stal malowana proszkowo'],
      ['Izolacja', 'Płyta warstwowa PIR'],
      ['Okna', 'PCV, panoramiczne'],
      ['Instalacja', 'Elektryczna + oświetlenie LED'],
      ['Czas realizacji', '4-6 tygodni'],
    ]
  },
  biurowy: {
    title: 'Pawilon biurowy',
    subtitle: 'Biuro, portiernia, recepcja',
    img: 'assets/products/biurowy.png',
    desc: 'Kontener biurowy to gotowe miejsce pracy — ciepłe zimą, chłodne latem. Stosujemy izolację termiczną z płyty warstwowej PIR o grubości 60-80mm, która zapewnia komfort przez cały rok bez wysokich rachunków za ogrzewanie.',
    desc2: 'Idealny jako biuro na budowie, portiernia, punkt ochrony, recepcja lub tymczasowe biuro w trakcie remontu. Montujemy pełną instalację elektryczną, gniazda sieciowe, ogrzewanie elektryczne lub klimatyzację z funkcją grzania. Ściany wewnętrzne wykończone płytą laminowaną — łatwe w utrzymaniu czystości.',
    specs: [
      ['Wymiary', 'od 2.5x2m do 8x3m'],
      ['Izolacja', 'PIR 60-80mm (U=0.35)'],
      ['Ogrzewanie', 'Elektryczne / klimatyzacja'],
      ['Instalacja', 'Elektryczna + LAN'],
      ['Podłoga', 'Wykładzina PCV / panele'],
      ['Czas realizacji', '4-6 tygodni'],
    ]
  },
  mieszkalny: {
    title: 'Pawilon mieszkalny',
    subtitle: 'Dom modułowy, domek letniskowy',
    img: 'assets/products/mieszkalny.png',
    desc: 'Pawilon mieszkalny to pełnowartościowy budynek do zamieszkania — z łazienką, kuchnią, ogrzewaniem i pełną instalacją. Idealne rozwiązanie na domek letniskowy, mieszkanie tymczasowe, pokój gościnny na działce czy dom dla osoby starszej blisko rodziny.',
    desc2: 'Montujemy kompletną instalację wodno-kanalizacyjną, elektryczną i grzewczą. Ściany izolowane płytą PIR 80mm zapewniają ciepło nawet w zimie. Wykończenie wewnętrzne do wyboru: płyta meblowa, panele drewniane, tynk. Zewnętrze: blacha, drewno, HPL lub tynk — dostosowane do otoczenia.',
    specs: [
      ['Wymiary', 'od 6x3m do 12x4m'],
      ['Izolacja', 'PIR 80mm'],
      ['Instalacja wod-kan', 'Pełna (kuchnia + łazienka)'],
      ['Ogrzewanie', 'Elektryczne / pompa ciepła'],
      ['Wykończenie wew.', 'Panele / płyta / tynk'],
      ['Czas realizacji', '5-8 tygodni'],
    ]
  },
  sanitarny: {
    title: 'Kontener sanitarny',
    subtitle: 'Toalety, prysznice, szatnie',
    img: 'assets/products/sanitarny.png',
    desc: 'Kontener sanitarny to mobilne zaplecze sanitarne — gotowe do podłączenia wody i kanalizacji. Stosujemy materiały odporne na wilgoć: ściany z laminatu HPL, podłoga antypoślizgowa, armatura ze stali nierdzewnej.',
    desc2: 'Budujemy kontenery sanitarne na budowy, eventy, festiwale, obiekty sportowe i place zabaw. Konfiguracja do wyboru: kabiny WC, prysznice, szatnie, umywalnie. Możliwość łączenia modułów dla większych obiektów.',
    specs: [
      ['Wymiary', 'od 3x2.5m do 6x3m'],
      ['Ściany wew.', 'Laminat HPL (wodoodporny)'],
      ['Podłoga', 'Antypoślizgowa, odpływ liniowy'],
      ['Armatura', 'Stal nierdzewna'],
      ['Instalacja', 'Wod-kan + elektryczna'],
      ['Czas realizacji', '4-6 tygodni'],
    ]
  },
  magazynowy: {
    title: 'Kontener magazynowy',
    subtitle: 'Magazyn, garaż, pomieszczenie gospodarcze',
    img: 'assets/products/magazynowy.png',
    desc: 'Kontener magazynowy to solidne, zamykane pomieszczenie na narzędzia, materiały, sprzęt czy pojazd. Konstrukcja stalowa malowana proszkowo — trwałe wykończenie odporne na warunki atmosferyczne. Drzwi dwuskrzydłowe lub roletowe.',
    desc2: 'Stosujemy blachę trapezową o grubości 0.5-0.7mm, podłogę z blachy ryflowanej lub sklejki wodoodpornej. Opcjonalnie: izolacja termiczna, instalacja elektryczna, oświetlenie, wentylacja. Idealny jako garaż, schowek na działce, magazyn na budowie.',
    specs: [
      ['Wymiary', 'od 2x2m do 12x3m'],
      ['Konstrukcja', 'Stal malowana proszkowo'],
      ['Pokrycie', 'Blacha trapezowa 0.5-0.7mm'],
      ['Drzwi', 'Dwuskrzydłowe / roletowe'],
      ['Podłoga', 'Blacha ryflowana / sklejka'],
      ['Czas realizacji', '3-5 tygodni'],
    ]
  },
  premium: {
    title: 'Premium / Custom',
    subtitle: 'Projekty na indywidualne zamówienie',
    img: 'assets/products/premium.png',
    desc: 'Jeśli potrzebujesz czegoś, czego nie ma w standardowej ofercie — zrobimy to. Nietypowe wymiary, łączenie modułów, piętrowe konstrukcje, nietypowe wykończenia zewnętrzne i wewnętrzne. Każdy projekt traktujemy indywidualnie.',
    desc2: 'Realizowaliśmy już: pawilony gastronomiczne z pełnym zapleczem kuchennym, punkty medyczne, szatnie sportowe, stanowiska ochrony na lotniskach, mobilne biura sprzedaży. Jeśli da się to zbudować — zbudujemy. Wycena i projekt wizualizacji gratis.',
    specs: [
      ['Wymiary', 'Dowolne — na zamówienie'],
      ['Modułowość', 'Łączenie, piętrowanie'],
      ['Wykończenie', 'Drewno, HPL, tynk, blacha'],
      ['Instalacje', 'Pełne — wod-kan, elektr., went.'],
      ['Projekt', 'Wizualizacja 3D gratis'],
      ['Czas realizacji', '6-10 tygodni'],
    ]
  }
};

// ── NAV SCROLL ──
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 40 ? '0 2px 20px rgba(0,0,0,.08)' : 'none';
}, { passive: true });

// ── MOBILE NAV ──
const toggle = document.getElementById('nav-toggle');
const links = document.getElementById('nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.classList.toggle('active');
    document.body.classList.toggle('nav-open', isOpen);
  });

  // Close on link click
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('active');
      document.body.classList.remove('nav-open');
    });
  });

  // Close on overlay background click (tap outside links area)
  links.addEventListener('click', (e) => {
    if (e.target === links) {
      links.classList.remove('open');
      toggle.classList.remove('active');
      document.body.classList.remove('nav-open');
    }
  });
}

// ── STICKY CTA — IntersectionObserver (zero forced reflow) ──
const stickyCta = document.querySelector('.sticky-cta');
if (stickyCta && 'IntersectionObserver' in window) {
  // Sentinel ~300px od gory; gdy znika z viewportu => pokaz CTA
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:300px;left:0;width:1px;height:1px;pointer-events:none';
  document.body.appendChild(sentinel);
  const io = new IntersectionObserver((entries) => {
    const visible = !entries[0].isIntersecting;
    stickyCta.classList.toggle('is-visible', visible);
    document.body.classList.toggle('has-sticky-cta', visible);
  }, { threshold: 0 });
  io.observe(sentinel);
}

// ── SCROLL REVEAL WITH INTERSECTION OBSERVER ──
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealElements = document.querySelectorAll('.reveal');
if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const parent = el.parentElement;
        const siblings = parent ? Array.from(parent.querySelectorAll(':scope > .reveal')) : [];
        const idx = siblings.indexOf(el);
        const delay = idx >= 0 ? idx * 80 : 0;
        setTimeout(() => el.classList.add('visible'), delay);
        revealObserver.unobserve(el);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));
} else {
  // Immediately reveal all elements if reduced motion is preferred
  revealElements.forEach(el => el.classList.add('visible'));
}

// ── COUNT-UP ANIMATION ON TRUST BAR ──
function animateCountUp(el, target, suffix, duration) {
  const start = 0;
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);

    if (suffix === '/5') {
      // For rating: show decimal
      const val = (start + (5.0 - start) * eased).toFixed(1);
      el.textContent = val + '/5';
    } else {
      el.textContent = current + suffix;
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }
  requestAnimationFrame(tick);
}

const trustBar = document.querySelector('.trust-bar');
if (trustBar && !prefersReducedMotion) {
  let trustAnimated = false;
  const trustObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !trustAnimated) {
        trustAnimated = true;
        const items = trustBar.querySelectorAll('.trust-item strong');
        items.forEach(item => {
          const text = item.textContent.trim();
          if (text.includes('5.0')) {
            animateCountUp(item, 5, '/5', 1200);
          } else if (text.includes('50+')) {
            animateCountUp(item, 50, '+', 1400);
          } else if (text.includes('4-6')) {
            // Simple text swap with delay
            item.textContent = '0';
            setTimeout(() => { item.textContent = '4-6 tyg.'; }, 800);
          } else if (text.includes('Cała')) {
            item.style.opacity = '0';
            item.style.transition = 'opacity .6s ease';
            setTimeout(() => {
              item.textContent = 'Cała PL';
              item.style.opacity = '1';
            }, 600);
          }
        });
        trustObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  trustObserver.observe(trustBar);
}

// ── PRODUCT MODALS ──
function openModal(id) {
  const p = products[id];
  if (!p) return;

  // Remove existing
  document.querySelectorAll('.modal,.modal-backdrop').forEach(el => el.remove());

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <button class="modal-close">&times;</button>
    <img class="modal-img" src="${p.img}" alt="${p.title}">
    <div class="modal-body">
      <h2>${p.title}</h2>
      <div class="modal-subtitle">${p.subtitle}</div>
      <p>${p.desc}</p>
      <p>${p.desc2}</p>
      <div class="modal-specs">
        ${p.specs.map(([label, val]) => `<div class="modal-spec"><strong>${label}</strong><span>${val}</span></div>`).join('')}
      </div>
      <div class="modal-cta">
        <a href="#kontakt" class="btn btn-primary" onclick="closeModal()">Zapytaj o wycenę</a>
        <a href="tel:+48509508210" class="btn btn-outline-dark">Zadzwoń: 509 508 210</a>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => requestAnimationFrame(() => {
    backdrop.classList.add('active');
    modal.classList.add('active');
  }));

  const close = () => closeModal();
  backdrop.addEventListener('click', close);
  modal.querySelector('.modal-close').addEventListener('click', close);
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKey); }
  });
}

function closeModal() {
  document.querySelectorAll('.modal,.modal-backdrop').forEach(el => {
    el.classList.remove('active');
    setTimeout(() => el.remove(), 300);
  });
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-modal]').forEach(card => {
  card.style.cursor = 'pointer';
  card.addEventListener('click', () => openModal(card.dataset.modal));
});

// ── BLOG ARTICLES (modal) ──
const articles = {
  jakosc: {
    title: 'Jak sprawdzić jakość pawilonu zanim kupisz? 7 rzeczy',
    date: '15 marca 2026',
    img: 'assets/gallery/k8.png',
    content: `
      <p>Kupujesz pawilon modułowy — prawdopodobnie za kilkanaście lub kilkadziesiąt tysięcy złotych. Chcesz mieć pewność, że dostaniesz solidny produkt. Oto 7 konkretnych rzeczy, które powinieneś sprawdzić — niezależnie od tego, u kogo kupujesz.</p>

      <h3>1. Grubość blachy zewnętrznej</h3>
      <p>Standardowa blacha trapezowa powinna mieć minimum 0.5mm. Tańsi producenci stosują 0.35-0.4mm — taka blacha gnie się pod palcem i po roku wygląda fatalnie. Zapytaj wprost o grubość i poproś o potwierdzenie.</p>

      <h3>2. Typ i grubość izolacji</h3>
      <p>Płyta warstwowa PUR 40mm to absolutne minimum. Dla obiektów całorocznych — 60-80mm. PIR jest lepszy (niższe współczynniki przenikania ciepła). Wełna mineralna to najtańsza opcja, ale gorzej izoluje i chłonie wilgoć. Zapytaj: jaki materiał izolacyjny i jaka grubość?</p>

      <h3>3. Jakość spawów</h3>
      <p>Obejrzyj spawy na konstrukcji nośnej. Powinny być równe, bez porów i pęknięć. Nierówne, „brudne" spawy to sygnał, że producent oszczędza na fachowcach. To wpływa na trwałość całej konstrukcji.</p>

      <h3>4. Szczelność dachu</h3>
      <p>Dach to najsłabszy punkt pawilonu. Sprawdź: jaki jest spadek (minimum 3%), jak wykonane są obróbki blacharskie na krawędziach, czy zastosowano uszczelnienia silikonowe. Przeciekający dach po roku to koszt naprawy 2-5 tys. zł.</p>

      <h3>5. Okna i drzwi</h3>
      <p>Okna PCV z podwójną szybą to standard. Sprawdź okucia (czy otwierają się płynnie), uszczelki (czy nie są suche/pęknięte) i czy okna mają nawiewniki. Drzwi powinny mieć zamek wielopunktowy i solidne zawiasy.</p>

      <h3>6. Podłoga</h3>
      <p>W pawilonach handlowych i biurowych podłoga musi być izolowana od dołu (styropian/PUR pod płytą). Wykończenie: wykładzina PCV lub panele. Pytaj o nośność podłogi — szczególnie jeśli planujesz ciężki sprzęt.</p>

      <h3>7. Wykończenie wewnętrzne</h3>
      <p>Ściany wewnętrzne z płyty laminowanej to trwałe i łatwe w utrzymaniu rozwiązanie. Tynk gipsowy wygląda lepiej, ale jest droższy i mniej odporny na transport. Sufit podwieszany ukrywa instalacje i wygląda profesjonalnie.</p>

      <p><strong>Podsumowanie:</strong> Zanim podpiszesz umowę, odwiedź zakład producenta. Obejrzyj gotowy pawilon na żywo. Zapytaj o materiały, grubości, gwarancję. Dobry producent nie ma nic do ukrycia.</p>
    `
  },
  plyta: {
    title: 'Płyta warstwowa — co musisz wiedzieć przed zakupem',
    date: '10 marca 2026',
    img: 'assets/gallery/k12.png',
    content: `
      <p>Płyta warstwowa to najważniejszy element pawilonu modułowego. To ona decyduje o izolacji termicznej, akustycznej i trwałości całego obiektu. Oto co musisz wiedzieć.</p>

      <h3>PUR, PIR czy wełna mineralna?</h3>
      <p><strong>PUR (pianka poliuretanowa)</strong> — najpopularniejszy wybór. Dobra izolacja, niska waga, wodoodporny. Współczynnik λ = 0.022-0.028 W/(m·K). Stosunek jakości do ceny — najlepszy.</p>
      <p><strong>PIR (pianka poliizocyjanurowa)</strong> — lepsza wersja PUR. Wyższa odporność ogniowa (klasa B-s1,d0), nieco lepszy współczynnik λ. Droższy o 15-25%, ale wart dopłaty w obiektach użyteczności publicznej.</p>
      <p><strong>Wełna mineralna</strong> — najtańsza opcja. Dobra izolacja akustyczna, niepalna. Ale: chłonie wilgoć (traci właściwości izolacyjne), cięższa, wymaga staranniejszego montażu. Nie polecamy do pawilonów na zewnątrz.</p>

      <h3>Grubość ma znaczenie</h3>
      <p><strong>40mm</strong> — minimum dla obiektów sezonowych (lato). Niski koszt, ale zimą będzie zimno.</p>
      <p><strong>60mm</strong> — standard dla obiektów całorocznych. Dobry kompromis między ceną a komfortem. Rachunki za ogrzewanie w normie.</p>
      <p><strong>80mm</strong> — premium. Dla domów modułowych i obiektów, gdzie komfort termiczny jest kluczowy. Oszczędność na ogrzewaniu zwraca się w 2-3 lata.</p>
      <p><strong>100mm+</strong> — obiekty pasywne, specjalne wymagania. Rzadko stosowane w pawilonach.</p>

      <h3>Na co jeszcze zwrócić uwagę?</h3>
      <p><strong>Okładzina zewnętrzna:</strong> blacha ocynkowana powlekana (min. 0.5mm) w kolorze RAL. Tańsze płyty mają cieńszą blachę — szybciej koroduje.</p>
      <p><strong>Łączenia:</strong> System pióro-wpust zapewnia szczelność. Sprawdź czy producent stosuje uszczelki na łączeniach.</p>
      <p><strong>Certyfikaty:</strong> Płyty powinny mieć deklarację właściwości użytkowych (DoP) i atest higieniczny.</p>

      <p><strong>Nasza rekomendacja:</strong> PIR 60mm dla większości zastosowań. PIR 80mm dla domów modułowych. Unikaj wełny w pawilonach na zewnątrz.</p>
    `
  },
  dach: {
    title: 'Dach w pawilonie — dlaczego szczelność to podstawa',
    date: '5 marca 2026',
    img: 'assets/gallery/k17.png',
    content: `
      <p>Dach to miejsce, gdzie najczęściej pojawiają się problemy z pawilonami — szczególnie tymi od mniej doświadczonych producentów. Przeciekający dach po roku to nie rzadkość. Oto jak tego uniknąć.</p>

      <h3>Spadek dachu</h3>
      <p>Minimum 3% — czyli 3cm na każdy metr długości. Dla pawilonów powyżej 6m długości rekomendujemy 5%. Zbyt mały spadek = stojąca woda = korozja, przecieki, problemy.</p>
      <p>Zapytaj producenta: jaki spadek ma dach? Jeśli mówi „płaski" — uciekaj. Nie ma czegoś takiego jak szczelny płaski dach na pawilonie.</p>

      <h3>Obróbki blacharskie</h3>
      <p>To detale na krawędziach dachu — obróbki okapowe, kalenicowe, wiatrownice. Powinny być wykonane z blachy powlekanej (nie ocynkowanej — ta koroduje) i zamocowane na uszczelkach EPDM.</p>
      <p>Złe obróbki = woda dostaje się pod blachę = mokra izolacja = grzyb, pleśń, utrata izolacyjności. Naprawa po fakcie to koszt 2-5 tys. zł.</p>

      <h3>System odwodnienia</h3>
      <p>Pawilon powinien mieć rynnę i rurę spustową. Dla dachów bez rynien woda spływa bezpośrednio przy ścianach — niszczy elewację i podmywa fundament.</p>

      <h3>Uszczelnienia</h3>
      <p>Wszystkie połączenia dachowe powinny być uszczelnione silikonem lub taśmą butylową. Śruby mocujące blachę dachową muszą mieć podkładki EPDM (gumowe). Zwykłe podkładki metalowe nie zapewniają szczelności.</p>

      <h3>Izolacja termiczna dachu</h3>
      <p>Dach traci najwięcej ciepła (ciepłe powietrze idzie do góry). Izolacja dachu powinna być co najmniej taka sama jak ścian, a najlepiej grubsza. Dla pawilonów całorocznych: min. 60mm PUR na dachu.</p>

      <h3>Jak sprawdzić przed zakupem?</h3>
      <ul>
        <li>Poproś o pokazanie gotowego pawilonu w zakładzie producenta</li>
        <li>Wejdź na dach (lub poproś o zdjęcie) — zobacz spadek i obróbki</li>
        <li>Zapytaj o gwarancję na szczelność dachu osobno</li>
        <li>Sprawdź opinie — przeciekający dach to najczęstsza skarga</li>
      </ul>

      <p><strong>W STAGO</strong> stosujemy spadek min. 5%, obróbki z blachy powlekanej RAL, rynny aluminiowe i podwójne uszczelnienie silikonem + taśmą butylową na wszystkich połączeniach.</p>
    `
  }
};

document.querySelectorAll('[data-blog]').forEach(card => {
  card.style.cursor = 'pointer';
  card.addEventListener('click', () => {
    const a = articles[card.dataset.blog];
    if (!a) return;
    document.querySelectorAll('.modal,.modal-backdrop').forEach(el => el.remove());

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <button class="modal-close">&times;</button>
      <img class="modal-img" src="${a.img}" alt="${a.title}">
      <div class="modal-body">
        <span class="blog-date" style="display:block;margin-bottom:12px">${a.date}</span>
        <h2 style="font-size:1.4rem;margin-bottom:16px">${a.title}</h2>
        <div class="article-content">${a.content}</div>
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e5e5;text-align:center">
          <p style="color:#888;margin-bottom:12px;font-size:.9rem">Szukasz solidnego pawilonu?</p>
          <a href="#kontakt" class="btn btn-primary" onclick="closeModal()">Darmowa wycena</a>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      backdrop.classList.add('active');
      modal.classList.add('active');
    }));
    backdrop.addEventListener('click', closeModal);
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKey); }
    });
  });
});

// ── FORM ──
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Wysłano! Odezwiemy się w 24h.';
    btn.disabled = true;
    btn.style.background = '#22c55e';
    btn.style.borderColor = '#22c55e';
    setTimeout(() => {
      btn.textContent = orig;
      btn.disabled = false;
      btn.style.background = '';
      btn.style.borderColor = '';
      form.reset();
    }, 4000);
  });
}

// ── GALLERY LIGHTBOX ──
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    if (!img) return;
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    const pic = document.createElement('img');
    pic.src = img.src;
    pic.alt = img.alt;
    lb.appendChild(pic);
    lb.addEventListener('click', () => { lb.classList.remove('active'); setTimeout(() => lb.remove(), 300); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { lb.classList.remove('active'); setTimeout(() => lb.remove(), 300); document.removeEventListener('keydown', onKey); }
    });
    document.body.appendChild(lb);
    requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.add('active')));
  });
});

// ── SMOOTH ANCHOR SCROLL ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
