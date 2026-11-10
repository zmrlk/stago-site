/* Jak kupić (9.11): mapa etapów i podgląd 3D na żądanie. Szablon podstron nie ładuje app.js, więc osobny plik. */
// Jak kupić: mapa etapów podświetla czytany etap (bez JS działa jako zwykłe linki)
(function () {
  var mapa = document.querySelector('.jk-mapa');
  if (!mapa || !('IntersectionObserver' in window)) return;
  var linki = [].slice.call(mapa.querySelectorAll('a'));
  var io = new IntersectionObserver(function (wpisy) {
    wpisy.forEach(function (w) {
      if (!w.isIntersecting) return;
      linki.forEach(function (a) {
        if (a.getAttribute('href') === '#' + w.target.id) a.setAttribute('aria-current', 'step');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  linki.forEach(function (a) { var e = document.querySelector(a.getAttribute('href')); if (e) io.observe(e); });
})();

// Jak kupić: podgląd 3D ładuje silnik konfiguratora dopiero po kliknięciu; przy błędzie zostaje render
(function () {
  var fig = document.querySelector('[data-podglad-3d]');
  if (!fig) return;
  var btn = fig.querySelector('.jk-3d-btn'), pole = fig.querySelector('.jk-3d-pole'), img = pole.querySelector('img');
  var baza = img.getAttribute('src').replace(/assets\/.*$/, '');
  function skrypt(src) {
    return new Promise(function (ok, blad) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = blad; document.head.appendChild(s); });
  }
  btn.addEventListener('click', function () {
    btn.disabled = true; btn.textContent = 'Ładuję podgląd 3D…';
    skrypt(baza + 'assets/3d/three.min.js')
      .then(function () { return skrypt(baza + 'assets/3d/stago-pavilion-core.js'); })
      .then(function () { return skrypt(baza + 'assets/3d/configurator-viewer.js'); })
      .then(function () {
        var v = window.StagoConfigurator3D;
        if (!v || !v.ready()) throw new Error('3d');
        img.hidden = true;
        v.mount(pole);
        v.update({ type: 'NORD', dimL: 6, dimW: 3 });
        if (v.resize) v.resize();
        btn.hidden = true;
        var opis = fig.querySelector('figcaption span'); if (opis) opis.textContent = 'Przeciągnij, żeby obrócić. Przykładowy model, swój projekt dostajesz po rozmowie.';
      })
      .catch(function () { img.hidden = false; btn.disabled = false; btn.textContent = 'Obróć pawilon w 3D'; });
  });
})();
