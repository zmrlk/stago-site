// Rzut 2D pawilonu z góry (uwagi Denisa 29.10.2026: „na start prosty 2D").
// Jedna implementacja dla dwóch miejsc: build.js (karty wymiarów, SVG w HTML)
// i konfigurator (podgląd na żywo w przeglądarce). Kolory w style.css (.rz-*).
// Rzut jest poglądowy: otwory rozkładamy równo na ścianie, bo klient nie ustawia
// ich pozycji (patrz SHOW_PLACEMENT w konfiguratorze).
(function (root) {
  var SCIANY = { A: 'przód', B: 'prawy bok', C: 'tył', D: 'lewy bok' };
  var NAZWY = { door: 'drzwi', okn: 'okno', wit: 'witryna' };
  // Szerokości w cm jak w opcjach konfiguratora (Drzwi ALU 90×210, Witryna 100×210, Okno 100×100)
  var SZER = { door: 90, okn: 100, wit: 100 };

  function liczba(v) {
    return String(Math.round(v * 10) / 10).replace('.', ',');
  }

  function rzut2d(opts) {
    var L = Number(opts.L), W = Number(opts.W);
    if (!(isFinite(L) && isFinite(W) && L > 0 && W > 0)) return '';
    var dl = Math.max(L, W), sz = Math.min(L, W); // dłuższy bok zawsze poziomo
    // Tylko znane ściany i rodzaje — stan może pochodzić z localStorage
    var otwory = (opts.openings || []).filter(function (o) {
      return o && SCIANY.hasOwnProperty(o.wall) && NAZWY.hasOwnProperty(o.kind);
    });
    var cmL = dl * 100, cmW = sz * 100;
    var pad = Math.round(Math.max(cmL, 300) * 0.16);
    var fs = Math.round((cmL + 2 * pad) * 0.035);
    var t = 12; // grubość ściany na rysunku (cm)
    var vbW = cmL + 2 * pad + Math.round(fs * 1.6), vbH = cmW + 2 * pad; // z prawej miejsce na wymiar szerokości
    var x0 = pad, y0 = pad;
    var s = [];

    s.push('<rect class="rz-sciana" x="' + x0 + '" y="' + y0 + '" width="' + cmL + '" height="' + cmW + '"/>');
    s.push('<rect class="rz-wnetrze" x="' + (x0 + t) + '" y="' + (y0 + t) + '" width="' + (cmL - 2 * t) + '" height="' + (cmW - 2 * t) + '"/>');

    // Ściany: A dół (przód), B prawa, C góra (tył), D lewa
    function sciana(id) {
      if (id === 'A') return { len: cmL, p: function (u) { return [x0 + u, y0 + cmW]; }, poz: true, wn: -1 };
      if (id === 'C') return { len: cmL, p: function (u) { return [x0 + cmL - u, y0]; }, poz: true, wn: 1 };
      if (id === 'B') return { len: cmW, p: function (u) { return [x0 + cmL, y0 + cmW - u]; }, poz: false, wn: -1 };
      return { len: cmW, p: function (u) { return [x0, y0 + u]; }, poz: false, wn: 1 };
    }

    ['A', 'B', 'C', 'D'].forEach(function (id) {
      var na = otwory.filter(function (o) { return o.wall === id; });
      if (!na.length) return;
      var sc = sciana(id);
      var suma = na.reduce(function (a, o) { return a + (SZER[o.kind] || 100); }, 0);
      var skala = Math.min(1, (sc.len * 0.8) / suma);
      // Równe odstępy między otworami i od narożników — otwory nigdy na siebie nie nachodzą
      var odstep = (sc.len - suma * skala) / (na.length + 1);
      var pozycja = 0;
      na.forEach(function (o) {
        var w = (SZER[o.kind] || 100) * skala;
        pozycja += odstep;
        var a = sc.p(pozycja), b = sc.p(pozycja + w);
        pozycja += w;
        var x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]);
        // Otwór: przerwa w ścianie na całej grubości
        if (sc.poz) {
          var yy = (id === 'A') ? y - t : y;
          s.push('<rect class="rz-otwor" x="' + x + '" y="' + yy + '" width="' + w + '" height="' + t + '"/>');
          if (o.kind === 'door') {
            // Skrzydło drzwi otwierane do środka + łuk
            var hx = x, hy = (id === 'A') ? y - t : y + t;
            var kier = (id === 'A') ? -1 : 1;
            s.push('<line class="rz-skrzydlo" x1="' + hx + '" y1="' + hy + '" x2="' + hx + '" y2="' + (hy + kier * w) + '"/>');
            s.push('<path class="rz-luk" d="M' + (hx + w) + ' ' + hy + ' A' + w + ' ' + w + ' 0 0 ' + (kier > 0 ? 1 : 0) + ' ' + hx + ' ' + (hy + kier * w) + '"/>');
          } else {
            s.push('<rect class="rz-' + (o.kind === 'wit' ? 'witryna' : 'okno') + '" x="' + x + '" y="' + (yy + t / 2 - 3) + '" width="' + w + '" height="6"/>');
          }
        } else {
          var xx = (id === 'B') ? x - t : x;
          s.push('<rect class="rz-otwor" x="' + xx + '" y="' + y + '" width="' + t + '" height="' + w + '"/>');
          if (o.kind === 'door') {
            var vx = (id === 'B') ? x - t : x + t, vy = y + w;
            var kx = (id === 'B') ? -1 : 1;
            s.push('<line class="rz-skrzydlo" x1="' + vx + '" y1="' + vy + '" x2="' + (vx + kx * w) + '" y2="' + vy + '"/>');
            s.push('<path class="rz-luk" d="M' + vx + ' ' + y + ' A' + w + ' ' + w + ' 0 0 ' + (kx > 0 ? 1 : 0) + ' ' + (vx + kx * w) + ' ' + vy + '"/>');
          } else {
            s.push('<rect class="rz-' + (o.kind === 'wit' ? 'witryna' : 'okno') + '" x="' + (xx + t / 2 - 3) + '" y="' + y + '" width="6" height="' + w + '"/>');
          }
        }
      });
    });

    // Wymiary i oznaczenia ścian
    var d = Math.round(pad * 0.45);
    s.push('<line class="rz-wymiar" x1="' + x0 + '" y1="' + (y0 + cmW + d) + '" x2="' + (x0 + cmL) + '" y2="' + (y0 + cmW + d) + '"/>');
    s.push('<text class="rz-tekst" x="' + (x0 + cmL / 2) + '" y="' + (y0 + cmW + d + fs * 1.15) + '" text-anchor="middle" font-size="' + fs + '">' + liczba(dl) + ' m</text>');
    s.push('<line class="rz-wymiar" x1="' + (x0 + cmL + d) + '" y1="' + y0 + '" x2="' + (x0 + cmL + d) + '" y2="' + (y0 + cmW) + '"/>');
    s.push('<text class="rz-tekst" x="' + (x0 + cmL + d + fs * 0.4) + '" y="' + (y0 + cmW / 2 + fs * 0.35) + '" font-size="' + fs + '">' + liczba(sz) + ' m</text>');
    s.push('<text class="rz-sciana-id" x="' + (x0 + cmL / 2) + '" y="' + (y0 + cmW - t - fs * 0.5) + '" text-anchor="middle" font-size="' + Math.round(fs * 0.8) + '">A · przód</text>');
    s.push('<text class="rz-sciana-id" x="' + (x0 + cmL / 2) + '" y="' + (y0 + t + fs * 1.1) + '" text-anchor="middle" font-size="' + Math.round(fs * 0.8) + '">C · tył</text>');
    s.push('<text class="rz-sciana-id" x="' + (x0 + t + fs * 0.5) + '" y="' + (y0 + cmW / 2 + fs * 0.3) + '" font-size="' + Math.round(fs * 0.8) + '">D</text>');
    s.push('<text class="rz-sciana-id" x="' + (x0 + cmL - t - fs * 0.5) + '" y="' + (y0 + cmW / 2 + fs * 0.3) + '" text-anchor="end" font-size="' + Math.round(fs * 0.8) + '">B</text>');

    var opis = 'Rzut poglądowy pawilonu ' + liczba(dl) + ' × ' + liczba(sz) + ' m';
    if (otwory.length) {
      opis += ': ' + otwory.map(function (o) { return (NAZWY[o.kind] || o.kind) + ' (' + (SCIANY[o.wall] || o.wall) + ')'; }).join(', ');
    }
    opis = opis.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return '<svg class="rzut2d" viewBox="0 0 ' + vbW + ' ' + vbH + '" role="img" aria-label="' + opis + '" xmlns="http://www.w3.org/2000/svg">' + s.join('') + '</svg>';
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = rzut2d;
  else root.rzut2d = rzut2d;
})(this);
