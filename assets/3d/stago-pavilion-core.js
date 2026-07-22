/*
 * STAGO Pavilion Core — parametryczna bryla + okladziny + otwory.
 * Zero zaleznosci od DOM-utils poza document.createElement('canvas') (tekstury) — browser only.
 * THREE wstrzykiwane (dziala z r147 globalnym i z modulem three w Vite/SvelteKit).
 *
 * Uzycie (stago-v2 / Vite):   import StagoPavilionCore from './stago-pavilion-core.js'
 *                             const core = StagoPavilionCore(THREE)
 *                             const { group, meta } = core.build(config)
 * Uzycie (plain script):      window.StagoPavilionCore(THREE)
 *
 * Config (mapuje sie na pola lead_quotes):
 *   L, W, H          — wymiary [m]
 *   roof             — 'flat' | 'slope'
 *   style            — plyta warstwowa (w kolorze colWall): 'flat' (gladka) | 'micro' (mikrofala).
 *                      TYLKO te dwa wykonczenia istnieja produkcyjnie (taksonomia Karola 07-04/07-08);
 *                      legacy 'slats'/'cassette' mapowane na 'flat'.
 *   accents          — ZAKRESY lameli akcentowych, LACZLIWE (lista, mozna kilka naraz):
 *                      ['corners' (narozniki), 'entrance' (obreb wejscia), 'band' (pas gorny),
 *                       'squares' (kwadraty), 'full' (calosc)]
 *                      'full' obejmuje wszystko — gdy wybrany, pozostale zakresy sa pomijane
 *                      (zero dublowania biegow). Legacy: accent (string) → [accent].
 *   cornerW          — szerokosc pasa naroznego na froncie/tyle [m] (default 0.6)
 *   cornerSide       — szerokosc pasa na bokach [m] (default 0.35)
 *   okucia           — true: metalowe profile narozne (KIOS)
 *   tallBand         — true: wysoka attyka obwodowa (KIOS)
 *   openings         — JAWNA lista otworow (zrodlo prawdy, nadpisuje wit/drz/okn/frontSeq):
 *                      [{ wall:'A'|'B'|'C'|'D', kind:'wit'|'door'|'okn', t:0..1, hinge:'left'|'right' }]
 *                      wall: A=front, B=bok prawy, C=tyl, D=bok lewy
 *                      t: pozycja srodka otworu wzdluz sciany (0=lewa krawedz patrzac
 *                         na sciane Z ZEWNATRZ, 1=prawa); core clampuje do krawedzi
 *                      hinge: strona zawiasow drzwi (klamka po przeciwnej)
 *   wit, drz, okn    — LEGACY liczby (fallback gdy brak openings): front-zone + okna na B
 *   frontSeq         — LEGACY jawna sekwencja frontu, np. ['wit','door','wit','wit']
 *   colWall          — hex koloru elewacji (RAL)
 *   wood             — hex koloru lameli akcentowych: odcienie drewna dostaja sloje,
 *                      kolory RAL (antracyt/czarny/bialy/srebrny) renderuja sie gladko
 *
 * Standard STAGO (stale): drzwi ALU 90x210 · witryna ALU FIX 100x210 · okno FIX 100x100,
 * stolarka ALU czarna. Rozmiary NIE sa konfigurowalne — to standard produkcyjny.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.StagoPavilionCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* 12 modeli STAGO (rendery: ~/Desktop/STAGO-modele-PNG) = presety warstw na jednej beli */
  var PRESETS = {
    kios: { L: 3.5, W: 2.25, H: 2.64, roof: 'flat', wit: 2, drz: 1, okn: 0,
      style: 'flat', accents: [], okucia: true, tallBand: true,
      colWall: '#17191B', wood: '#8A6A48' },
    mila: { L: 4, W: 3, H: 2.64, roof: 'flat', wit: 2, drz: 1, okn: 0,
      style: 'flat', accents: ['full'], okucia: false, tallBand: false,
      colWall: '#17191B', wood: '#B08D5F' },
    nord: { L: 6, W: 3, H: 2.64, roof: 'flat', wit: 3, drz: 1, okn: 1,
      style: 'flat', accents: ['corners'], cornerW: 0.6, cornerSide: 0.35,
      okucia: false, tallBand: false, colWall: '#3A4045', wood: '#8A6A48' },
    cube: { L: 6, W: 3, H: 2.64, roof: 'flat', wit: 2, drz: 1, okn: 1,
      style: 'flat', accents: ['cassette', 'squares'], okucia: false, tallBand: false,
      colWall: '#17191B', wood: '#8A6A48' },
    atri: { L: 5, W: 3, H: 2.64, roof: 'flat', wit: 2, drz: 1, okn: 1,
      style: 'flat', accents: ['full'], okucia: false, tallBand: false,
      colWall: '#3A4045', wood: '#C7A06A' },
    duet: { L: 6, W: 3, H: 2.64, roof: 'flat', wit: 2, drz: 1, okn: 0,
      style: 'flat', accents: ['cassette', 'entrance'], okucia: false, tallBand: false,
      colWall: '#23282B', wood: '#B08D5F' },
    icon: { L: 5, W: 3, H: 2.64, roof: 'flat', wit: 3, drz: 1, okn: 0,
      style: 'flat', accents: ['corners', 'entrance'], cornerW: 0.9, cornerSide: 0.5,
      okucia: false, tallBand: false, colWall: '#3A4045', wood: '#8A6A48' },
    loft: { L: 6, W: 3, H: 2.64, roof: 'flat', wit: 2, drz: 1, okn: 1,
      style: 'flat', accents: ['full'], okucia: false, tallBand: true,
      colWall: '#23282B', wood: '#B08D5F' },
    noir: { L: 6, W: 3, H: 2.64, roof: 'flat', wit: 3, drz: 1, okn: 0,
      style: 'flat', accents: ['full'], okucia: false, tallBand: false,
      colWall: '#17191B', wood: '#17191B' },
    rytm: { L: 5, W: 3, H: 2.64, roof: 'flat', wit: 2, drz: 1, okn: 0,
      style: 'flat', accents: ['corners', 'band'], cornerW: 0.8, cornerSide: 0.45,
      okucia: false, tallBand: false, colWall: '#17191B', wood: '#B08D5F' },
    saga: { L: 5, W: 3, H: 2.64, roof: 'flat', wit: 2, drz: 1, okn: 0,
      style: 'micro', accents: ['band', 'corners'], cornerW: 0.6, cornerSide: 0.35,
      okucia: false, tallBand: false, colWall: '#3A4045', wood: '#C7A06A' },
    view: { L: 6, W: 3, H: 2.64, roof: 'flat',
      style: 'flat', accents: ['band'], okucia: false, tallBand: false,
      colWall: '#17191B', wood: '#B08D5F',
      /* naroznik szklany: front 3 witryny + drzwi (styk), bok B 2 witryny od frontu */
      openings: [
        { wall: 'A', kind: 'wit', t: 0.258 }, { wall: 'A', kind: 'wit', t: 0.425 },
        { wall: 'A', kind: 'wit', t: 0.592 }, { wall: 'A', kind: 'door', t: 0.75 },
        { wall: 'B', kind: 'wit', t: 0.217 }, { wall: 'B', kind: 'wit', t: 0.55 }
      ] }
  };

  var DEFAULTS = { L: 6, W: 3, H: 2.64, roof: 'flat', wit: 3, drz: 1, okn: 1,
    style: 'flat', accents: ['corners'], cornerW: 0.6, cornerSide: 0.35,
    okucia: false, tallBand: false, colWall: '#3A4045', wood: '#8A6A48' };

  var ACCENT_SCOPES = ['corners', 'entrance', 'band', 'squares', 'cassette', 'full'];

  /* wymiary standardu STAGO [m] */
  var KIND_DIMS = {
    wit:   { w: 1.0 },                       /* 100x210: od cokolu do ft */
    door:  { w: 0.9 },                       /* ALU przeszklone 90x210 */
    steel: { w: 0.9 },                       /* stalowe pelne 90x210 (zaplecze) */
    okn:   { w: 1.0, sill: 1.05, wh: 1.0 }   /* 100x100, parapet 1.05 */
  };
  var WALLS = ['A', 'B', 'C', 'D'];
  var EDGE_MARGIN = 0.15;   /* min odstep otworu od naroznika */
  var GAP_MIN = 0.04;       /* min odstep miedzy otworami */

  function normalize(cfg) {
    var c = {};
    for (var k in DEFAULTS) c[k] = (cfg && cfg[k] !== undefined) ? cfg[k] : DEFAULTS[k];

    /* wykonczenie plyty: tylko gladka/mikrofala; legacy slats/cassette → gladka */
    if (c.style !== 'flat' && c.style !== 'micro') c.style = 'flat';
    /* akcenty: lista laczliwych zakresow; legacy accent (string) → [accent] */
    var acc = (cfg && cfg.accents !== undefined) ? cfg.accents
      : (cfg && cfg.accent !== undefined ? (cfg.accent === 'none' ? [] : [cfg.accent]) : c.accents);
    if (!Array.isArray(acc)) acc = acc && acc !== 'none' ? [acc] : [];
    c.accents = acc.filter(function (a) { return ACCENT_SCOPES.indexOf(a) >= 0; });
    c.accent = c.accents.length ? c.accents[0] : 'none';   /* mirror dla konsumentow legacy */

    if (cfg && cfg.openings && cfg.openings.length !== undefined) {
      c.openings = cfg.openings.map(function (o) {
        return {
          wall: WALLS.indexOf(o.wall) >= 0 ? o.wall : 'A',
          kind: KIND_DIMS[o.kind] ? o.kind : 'wit',
          t: (o.t !== undefined) ? Math.max(0, Math.min(1, o.t)) : 0.5,
          hinge: o.hinge === 'right' ? 'right' : 'left'
        };
      });
    } else {
      /* LEGACY: frontSeq / liczby -> zwarta strefa na froncie + okna na boku B */
      var seq;
      if (cfg && cfg.frontSeq) seq = cfg.frontSeq.slice();
      else {
        var n = c.wit + c.drz; seq = [];
        for (var i = 0; i < n; i++) seq.push('wit');
        if (c.drz === 1) seq[Math.floor((n - 1) / 2)] = 'door';
        if (c.drz === 2) { seq[Math.floor(n / 2) - 1] = 'door'; seq[Math.floor(n / 2) + (n % 2)] = 'door'; }
      }
      c.openings = [];
      var widths = seq.map(function (kk) { return KIND_DIMS[kk === 'door' ? 'door' : 'wit'].w; });
      var total = 0; widths.forEach(function (w) { total += w; });
      var u = -total / 2;
      seq.forEach(function (kk, j) {
        c.openings.push({ wall: 'A', kind: (kk === 'door' ? 'door' : 'wit'),
          t: (u + widths[j] / 2 + c.L / 2) / c.L, hinge: 'left' });
        u += widths[j];
      });
      for (var oi = 0; oi < c.okn; oi++)
        c.openings.push({ wall: 'B', kind: 'okn', t: (oi + 0.5) / c.okn, hinge: 'left' });
    }

    /* pochodne liczniki + frontSeq (dla konsumentow legacy) */
    c.wit = c.openings.filter(function (o) { return o.kind === 'wit'; }).length;
    c.drz = c.openings.filter(function (o) { return o.kind === 'door'; }).length;
    c.steel = c.openings.filter(function (o) { return o.kind === 'steel'; }).length;
    c.okn = c.openings.filter(function (o) { return o.kind === 'okn'; }).length;
    c.frontSeq = c.openings
      .filter(function (o) { return o.wall === 'A' && (o.kind === 'wit' || o.kind === 'door'); })
      .sort(function (a, b) { return a.t - b.t; })
      .map(function (o) { return o.kind === 'door' ? 'door' : 'wit'; });
    return c;
  }

  return function StagoPavilionCore(THREE) {

    /* ---------- tekstury proceduralne (cache per instancja) ---------- */
    function canvasTex(draw, size) {
      size = size || 256;
      var c = document.createElement('canvas'); c.width = c.height = size;
      draw(c.getContext('2d'), size);
      var t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    }
    var texSeam = canvasTex(function (x, s) {
      x.fillStyle = '#fff'; x.fillRect(0, 0, s, s);
      x.fillStyle = 'rgba(0,0,0,.30)'; x.fillRect(0, 0, 3, s);
      x.fillStyle = 'rgba(255,255,255,.20)'; x.fillRect(3, 0, 2, s);
    });
    /* mikrofala: zebra PIONOWE (gradient wzdluz X) */
    var texMicro = canvasTex(function (x, s) {
      x.fillStyle = '#fff'; x.fillRect(0, 0, s, s);
      var rib = s / 8;
      for (var xx = 0; xx < s; xx += rib) {
        var g = x.createLinearGradient(xx, 0, xx + rib, 0);
        g.addColorStop(0, 'rgba(255,255,255,.14)');
        g.addColorStop(0.45, 'rgba(0,0,0,0)');
        g.addColorStop(0.55, 'rgba(0,0,0,.16)');
        g.addColorStop(1, 'rgba(0,0,0,.05)');
        x.fillStyle = g; x.fillRect(xx, 0, rib, s);
      }
    }, 64);
    var texCassette = canvasTex(function (x, s) {
      x.fillStyle = '#fff'; x.fillRect(0, 0, s, s);
      x.strokeStyle = 'rgba(0,0,0,.34)'; x.lineWidth = 5; x.strokeRect(2, 2, s - 4, s - 4);
      x.strokeStyle = 'rgba(255,255,255,.16)'; x.lineWidth = 2; x.strokeRect(7, 7, s - 14, s - 14);
    });
    var texWood = canvasTex(function (x, s) {
      x.fillStyle = '#fff'; x.fillRect(0, 0, s, s);
      for (var i = 0; i < 70; i++) {
        x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? 0 : 255) + ',' + (Math.random() < 0.5 ? 0 : 80) + ',0,' + (0.03 + Math.random() * 0.05) + ')';
        var w = 1 + Math.random() * 3; x.fillRect(Math.random() * s, 0, w, s);
      }
    });

    function wallMap(base, wm, hm, cell) {
      var t = base.clone(); t.needsUpdate = true;
      t.repeat.set(Math.max(1, Math.round(wm / cell)), Math.max(1, Math.round(hm / cell)));
      if (base === texSeam) t.repeat.set(Math.max(1, Math.round(wm / 1.0)), 1);
      return t;
    }

    /* ---------- build ---------- */
    function build(cfg, opts) {
      var st = normalize(cfg);
      var envTex = opts && opts.envMap ? opts.envMap : null;
      var building = new THREE.Group();
      building.name = 'stago-pavilion';

      function matWallFor(wm, hm) {
        var m = new THREE.MeshStandardMaterial({ color: st.colWall, roughness: 0.55, metalness: 0.12 });
        if (st.style === 'micro') { m.map = wallMap(texMicro, wm, hm, 0.25); m.roughness = 0.5; }
        else m.map = wallMap(texSeam, wm, hm, 1.0);   /* plyta gladka (spoiny plyt) */
        return m;
      }
      /* kolor lameli: drewniane odcienie dostaja sloje, RAL-e (niska saturacja) sa gladkie */
      function isWoodyColor(hex) {
        var hsl = {}; new THREE.Color(hex).getHSL(hsl);
        return hsl.s > 0.15;
      }
      function matAlu() { return new THREE.MeshStandardMaterial({ color: '#121517', roughness: 0.35, metalness: 0.65, envMap: envTex, envMapIntensity: 0.5 }); }
      function matGlass() { return new THREE.MeshStandardMaterial({ color: '#3a4750', roughness: 0.08, metalness: 0.5, envMap: envTex, envMapIntensity: 0.5, transparent: true, opacity: 0.5 }); }
      function matChrome() { return new THREE.MeshStandardMaterial({ color: '#c9ced2', roughness: 0.22, metalness: 1, envMap: envTex, envMapIntensity: 0.8 }); }
      function matLamel(hex) {
        var m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.62, metalness: 0.05 });
        if (isWoodyColor(hex)) { m.map = texWood.clone(); m.map.needsUpdate = true; }
        else { m.roughness = 0.5; m.metalness = 0.25; }
        return m;
      }
      function matWoodCassette(wm, hm) { var m = new THREE.MeshStandardMaterial({ color: st.wood, roughness: 0.6, metalness: 0.05, map: wallMap(texCassette, wm, hm, 0.62) }); return m; }
      /* kaseton = LAMEL KWADRATOWY jako okladzina calosci, w kolorze elewacji (DUET/CUBE) */
      function matCassetteOverlay(wm, hm) { return new THREE.MeshStandardMaterial({ color: st.colWall, roughness: 0.5, metalness: 0.15, map: wallMap(texCassette, wm, hm, 0.62) }); }
      function matDark() { return new THREE.MeshStandardMaterial({ color: '#101214', roughness: 0.6, metalness: 0.1 }); }
      function matMembrane() { return new THREE.MeshStandardMaterial({ color: '#43474a', roughness: 0.95, metalness: 0 }); }

      function box(w, h, d, x, y, z, mat) {
        var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
        building.add(m); return m;
      }

      function slatRun(runs, hex, sOpts) {
        hex = hex || st.wood;
        sOpts = sOpts || {};
        var slatW = sOpts.slatW || 0.05;          /* zebro */
        var gap = (sOpts.gap !== undefined) ? sOpts.gap : 0.025;  /* szczelina */
        var depth = sOpts.depth || 0.05;
        /* podklad przyciemniony = cien w szczelinie (jak na renderach); metal styk-w-styk bez cienia */
        var shadeBack = (sOpts.shadeBack !== undefined) ? sOpts.shadeBack : 0.5;
        var period = slatW + gap;
        var vary = isWoodyColor(hex);
        var count = 0, items = [];
        var backMat = matLamel(hex);
        backMat.color.multiplyScalar(shadeBack);
        for (var ri = 0; ri < runs.length; ri++) {
          var r = runs[ri];
          if (r.back) {
            var p = new THREE.Mesh(new THREE.BoxGeometry(r.len, r.h, 0.024), backMat);
            p.position.set((r.x0 + r.x1) / 2, r.y + r.h / 2, (r.z0 + r.z1) / 2);
            p.rotation.y = r.rotY;
            p.castShadow = true; p.receiveShadow = true; building.add(p);
          }
          var ox = (r.nx || 0) * 0.037, oz = (r.nz || 0) * 0.037;
          /* zebra rozlozone od krawedzi do krawedzi biegu, symetrycznie */
          var n = Math.max(1, Math.round((r.len + gap) / period));
          for (var i = 0; i < n; i++) {
            var t = n === 1 ? 0.5 : (slatW / 2 + i * (r.len - slatW) / (n - 1)) / r.len;
            items.push({ x: r.x0 + (r.x1 - r.x0) * t + ox, z: r.z0 + (r.z1 - r.z0) * t + oz, y: r.y + r.h / 2, h: r.h, rotY: r.rotY });
            count++;
          }
        }
        if (!count) return;
        var g = new THREE.BoxGeometry(slatW, 1, depth);
        var im = new THREE.InstancedMesh(g, matLamel(hex), count);
        var M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3();
        var col = new THREE.Color();
        items.forEach(function (it, i) {
          Q.setFromEuler(new THREE.Euler(0, it.rotY, 0));
          P.set(it.x, it.y, it.z); S.set(1, it.h, 1);
          M.compose(P, Q, S); im.setMatrixAt(i, M);
          col.set(hex).multiplyScalar(vary ? (0.94 + Math.random() * 0.12) : (0.985 + Math.random() * 0.03));
          im.setColorAt(i, col);
        });
        im.castShadow = true; im.receiveShadow = true;
        building.add(im);
      }

      var L = st.L, W = st.W, H = st.H;
      var hx = L / 2, hz = W / 2;
      var ft = Math.min(2.25, H - 0.45);
      /* dach ze spadem 10 cm na glebokosci: PRZOD (sciana A, +Z) WYZEJ = H, TYL (C, -Z) NIZEJ */
      var FALL = 0.10;
      var Hfront = H, Hback = H - FALL;
      var slopeA = Math.atan(FALL / W);   /* kat spadu; przod (+Z) w gore => rotacja -slopeA */

      /* akcenty laczliwe; 'full' obejmuje reszte biegow (zero dublowania lameli) */
      var hasFull = st.accents.indexOf('full') >= 0;
      function hasAcc(a) { return hasFull ? (a === 'full') : st.accents.indexOf(a) >= 0; }

      /* ---------- sciany A/B/C/D: opis + rozstrzygniecie pozycji otworow ---------- */
      /* uklad lokalny sciany: os X wzdluz dlugosci (u rosnie w prawo patrzac z zewnatrz),
         sciana skierowana na +Z; potem rotacja/pozycja grupy w swiat */
      var WALL_DEF = {
        A: { len: L, theta: 0,               pos: [0, 0, hz - 0.06] },
        B: { len: W, theta: Math.PI / 2,     pos: [hx - 0.06, 0, 0] },
        C: { len: L, theta: Math.PI,         pos: [0, 0, -hz + 0.06] },
        D: { len: W, theta: -Math.PI / 2,    pos: [-hx + 0.06, 0, 0] }
      };

      /* rozwiazane pozycje KAZDEGO otworu (index = pozycja w st.openings) — do UI */
      var resolvedInfo = new Array(st.openings.length);
      function resolveWall(wall) {
        var len = WALL_DEF[wall].len;
        var ops = st.openings
          .map(function (o, i) { return { o: o, idx: i }; })
          .filter(function (x) { return x.o.wall === wall; })
          .map(function (x) {
            var o = x.o, kd = KIND_DIMS[o.kind];
            var y0 = (o.kind === 'okn') ? kd.sill : 0.15;
            var y1 = (o.kind === 'okn') ? Math.min(kd.sill + kd.wh, H - 0.3) : ft;
            var c = o.t * len - len / 2;
            c = Math.max(-len / 2 + kd.w / 2 + EDGE_MARGIN,
                Math.min(len / 2 - kd.w / 2 - EDGE_MARGIN, c));
            return { kind: o.kind, hinge: o.hinge, w: kd.w, c: c, y0: y0, y1: y1, idx: x.idx };
          })
          .sort(function (a, b) { return a.c - b.c; });
        /* kolizje: przepchnij w prawo, potem docisnij od prawej krawedzi */
        var i;
        for (i = 1; i < ops.length; i++) {
          var minC = ops[i - 1].c + ops[i - 1].w / 2 + ops[i].w / 2 + GAP_MIN;
          if (ops[i].c < minC) ops[i].c = minC;
        }
        for (i = ops.length - 1; i >= 0; i--) {
          var lim = (i === ops.length - 1)
            ? (len / 2 - ops[i].w / 2 - EDGE_MARGIN)
            : (ops[i + 1].c - ops[i + 1].w / 2 - ops[i].w / 2 - GAP_MIN);
          if (ops[i].c > lim) ops[i].c = lim;
        }
        ops.forEach(function (op) {
          resolvedInfo[op.idx] = { wall: wall, c: op.c, len: len, t: (op.c + len / 2) / len };
        });
        return ops;
      }
      var resolved = {};
      WALLS.forEach(function (w) { resolved[w] = resolveWall(w); });

      /* strefa przeszklen frontu (akcent squares + attyka licza sie od niej) */
      var frontOps = resolved.A.filter(function (o) { return o.kind === 'wit' || o.kind === 'door'; });
      var nFront = frontOps.length;
      var zoneL = 0, zoneR = 0;
      if (nFront) {
        zoneL = Infinity; zoneR = -Infinity;
        frontOps.forEach(function (o) {
          zoneL = Math.min(zoneL, o.c - o.w / 2);
          zoneR = Math.max(zoneR, o.c + o.w / 2);
        });
      }
      var tw = zoneR - zoneL;
      var fillWL = nFront ? (zoneL + hx) : L;

      /* pojedynczy modul okna / drzwi stalowych w ukladzie lokalnym sciany */
      function singleModule(op) {
        var m = new THREE.Group();
        var alu = matAlu();
        function fbox(w, h, d, x, y, z, mat) {
          var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || alu);
          b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true;
          m.add(b); return b;
        }
        if (op.kind === 'okn') {
          var wh = op.y1 - op.y0, cy = op.y0 + wh / 2;
          fbox(op.w + 0.02, 0.07, 0.09, 0, op.y0 - 0.035 + 0.01, 0);
          fbox(op.w + 0.02, 0.07, 0.09, 0, op.y1 + 0.035 - 0.01, 0);
          fbox(0.07, wh, 0.09, -op.w / 2 + 0.025, cy, 0);
          fbox(0.07, wh, 0.09, op.w / 2 - 0.025, cy, 0);
          var gl = fbox(op.w - 0.12, wh - 0.1, 0.012, 0, cy, 0, matGlass());
          gl.castShadow = false; gl.userData.opIndex = op.idx;
          m.position.set(op.c, 0, -0.03);
        } else {
          /* drzwi stalowe pelne (zaplecze): rama + skrzydlo z blachy + klamka */
          var y0 = op.y0, fh = op.y1 - y0;
          fbox(op.w + 0.02, 0.07, 0.08, 0, op.y1 + 0.035, 0);
          fbox(op.w + 0.02, 0.09, 0.08, 0, y0 - 0.045 + 0.02, 0);
          fbox(0.06, fh + 0.1, 0.08, -op.w / 2 + 0.03, y0 + fh / 2, 0);
          fbox(0.06, fh + 0.1, 0.08, op.w / 2 - 0.03, y0 + fh / 2, 0);
          var leafMat = new THREE.MeshStandardMaterial({ color: '#2E3338', roughness: 0.45, metalness: 0.4, envMap: envTex, envMapIntensity: 0.35 });
          var leaf = fbox(op.w - 0.1, fh - 0.06, 0.05, 0, y0 + fh / 2, 0, leafMat);
          leaf.userData.opIndex = op.idx;
          var hx2 = (op.hinge === 'left' ? 1 : -1) * (op.w / 2 - 0.13);
          var kl = fbox(0.03, 0.16, 0.03, hx2, 1.05, 0.045, matChrome());
          kl.castShadow = false;
          m.position.set(op.c, 0, -0.05);
        }
        m.userData.opIndex = op.idx;
        return m;
      }

      /* pas witryn/drzwi ALU — SASIEDNIE moduly wspoldziela slupki (ciagla fasada
         jak w realizacjach), osobne grupy dostaja wlasne ramy */
      function stripModule(g) {
        var grp = new THREE.Group();
        var alu = matAlu();
        var y0 = 0.15, fh = ft - y0;
        var cx = (g.u0 + g.u1) / 2, w = g.u1 - g.u0;
        function sb(bw, bh, bd, x, y, z, mat) {
          var b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat || alu);
          b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true;
          grp.add(b); return b;
        }
        sb(w + 0.12, 0.07, 0.08, 0, ft + 0.035, 0);          /* rygiel gorny */
        sb(w + 0.12, 0.09, 0.08, 0, y0 - 0.025, 0);          /* rygiel dolny */
        /* slupki: krawedz startowa + prawa krawedz kazdego modulu (wspolne na styku) */
        sb(0.07, fh + 0.1, 0.08, g.u0 - cx, y0 + fh / 2, 0);
        g.ops.forEach(function (op) {
          sb(0.07, fh + 0.1, 0.08, op.c + op.w / 2 - cx, y0 + fh / 2, 0);
        });
        g.ops.forEach(function (op) {
          var lx = op.c - cx;
          if (op.kind === 'door') {
            var gw = op.w - 0.09;
            sb(gw, 0.06, 0.05, lx, y0 + 0.06, 0.005);
            sb(gw, 0.06, 0.05, lx, ft - 0.05, 0.005);
            sb(0.05, fh, 0.05, lx - gw / 2 + 0.03, y0 + fh / 2, 0.005);
            sb(0.05, fh, 0.05, lx + gw / 2 - 0.03, y0 + fh / 2, 0.005);
            var dg = sb(gw - 0.1, fh - 0.16, 0.012, lx, y0 + fh / 2, 0, matGlass());
            dg.castShadow = false; dg.userData.opIndex = op.idx;
            /* pochwyt po stronie przeciwnej do zawiasow */
            var handleX = lx + (op.hinge === 'left' ? 1 : -1) * (op.w / 2 - 0.14);
            var p = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.1, 10), matChrome());
            p.position.set(handleX, 1.1, 0.075);
            p.castShadow = true; grp.add(p);
          } else {
            var wg = sb(op.w - 0.09, fh - 0.05, 0.012, lx, y0 + fh / 2, 0, matGlass());
            wg.castShadow = false; wg.userData.opIndex = op.idx;
          }
        });
        /* wneka: przeszklenia cofniete (glebia + cien jak w realizacjach) */
        grp.position.set(cx, 0, -0.07);
        return grp;
      }

      /* budowa sciany segmentami: [segment | grupa otworow | segment] + nadproza
         + podokienniki. Sasiadujace wit/door lacza sie w pas (strip).
         wallSegs zbiera odcinki pelnej sciany dla biegow lameli (omijaja otwory).
         wallStrips zbiera pasy przeszklen (strefa wejscia dla akcentu). */
      var wallSegs = {}, wallStrips = {};
      function buildWall(wall) {
        var def = WALL_DEF[wall], len = def.len;
        var ops = resolved[wall];
        /* gora sciany idzie za dachem: przod (A) na Hfront, reszta na Hback; boki dobiera filler spadu */
        var H = (wall === 'A') ? Hfront : Hback;
        var g = new THREE.Group();
        function wbox(w, h, d, x, y, z, mat) {
          var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
          b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true;
          g.add(b);
          /* okladzina kasetonowa: cienki panel na kazdym kawalku sciany (omija otwory) */
          if (hasAcc('cassette')) {
            var ov = new THREE.Mesh(
              new THREE.BoxGeometry(w, Math.max(0.05, h - 0.02), 0.016),
              matCassetteOverlay(w, h));
            ov.position.set(x, y, 0.068);
            ov.castShadow = false; ov.receiveShadow = true; g.add(ov);
          }
          return b;
        }
        /* grupowanie: sasiadujace wit/door (styk < 6 cm) = jeden pas */
        var groups = [];
        ops.forEach(function (op) {
          var last = groups[groups.length - 1];
          var glazed = (op.kind === 'wit' || op.kind === 'door');
          if (last && last.glazed && glazed && (op.c - op.w / 2) - last.u1 < 0.06) {
            last.ops.push(op); last.u1 = op.c + op.w / 2;
            last.hasDoor = last.hasDoor || op.kind === 'door';
          } else {
            groups.push({ glazed: glazed, ops: [op], u0: op.c - op.w / 2, u1: op.c + op.w / 2,
              hasDoor: op.kind === 'door' });
          }
        });
        wallStrips[wall] = groups.filter(function (x) { return x.glazed; });

        var segs = [];
        var prev = -len / 2;
        groups.forEach(function (grp) {
          if (grp.u0 - prev > 0.01) {
            wbox(grp.u0 - prev, H, 0.12, (prev + grp.u0) / 2, H / 2, 0, matWallFor(grp.u0 - prev, H));
            segs.push({ u0: prev, u1: grp.u0 });
          }
          if (grp.glazed) {
            var bandH = H - ft;
            if (bandH > 0.02) {
              var bw = grp.u1 - grp.u0;
              var bandMat = (hasAcc('band')) ? matDark() : matWallFor(bw, bandH);
              wbox(bw, bandH, 0.12, (grp.u0 + grp.u1) / 2, ft + bandH / 2, 0, bandMat);
              segs.push({ u0: grp.u0, u1: grp.u1, y: ft, hRun: true });
            }
            g.add(stripModule(grp));
          } else {
            var op = grp.ops[0];
            var bH = H - op.y1;
            if (bH > 0.02) {
              wbox(op.w, bH, 0.12, op.c, op.y1 + bH / 2, 0, matWallFor(op.w, bH));
              segs.push({ u0: grp.u0, u1: grp.u1, y: op.y1, hRun: true });
            }
            if (op.y0 > 0.2) {  /* podokiennik (okna) */
              wbox(op.w, op.y0, 0.12, op.c, op.y0 / 2, 0, matWallFor(op.w, op.y0));
              segs.push({ u0: grp.u0, u1: grp.u1, sill: op.y0 });
            }
            g.add(singleModule(op));
          }
          prev = grp.u1;
        });
        if (len / 2 - prev > 0.01) {
          wbox(len / 2 - prev, H, 0.12, (prev + len / 2) / 2, H / 2, 0, matWallFor(len / 2 - prev, H));
          segs.push({ u0: prev, u1: len / 2 });
        }
        g.rotation.y = def.theta;
        g.position.set(def.pos[0], def.pos[1], def.pos[2]);
        building.add(g);
        wallSegs[wall] = segs;
      }

      /* cokol */
      box(L + 0.08, 0.15, W + 0.08, 0, 0.075, 0, matDark());

      /* wnetrze */
      var inW = new THREE.MeshStandardMaterial({ color: '#4b5158', roughness: 0.9, side: THREE.BackSide });
      var ib = new THREE.Mesh(new THREE.BoxGeometry(L - 0.24, H - 0.1, W - 0.24), inW);
      ib.position.set(0, H / 2, 0); building.add(ib);
      var fl = new THREE.Mesh(new THREE.BoxGeometry(L - 0.26, 0.02, W - 0.26),
        new THREE.MeshStandardMaterial({ color: '#a8a49e', roughness: 0.85 }));
      fl.position.set(0, 0.16, 0); building.add(fl);

      /* sciany z otworami */
      WALLS.forEach(buildWall);

      /* domkniecie spadu na scianach bocznych B/D: ich gora idzie od Hback (tyl) do Hfront (przod).
         buildWall stawia je plasko na Hback; ten pochylony pasek dobiera trojkatna szczeline u gory. */
      if (st.roof === 'flat') {
        var Hmid = (Hfront + Hback) / 2;
        [hx - 0.06, -(hx - 0.06)].forEach(function (sx) {
          var f = box(0.12, 0.20, W, sx, Hmid - 0.10, 0, matWallFor(W, 0.20));
          f.rotation.x = -slopeA;   /* przod (+Z) w gore, zgodnie z dachem */
        });
      }

      /* attyka / dach */
      if (st.roof === 'flat') {
        /* dach standardowy STAGO: STALY SPAD 10 cm na glebokosci — PRZOD (+Z, sciana A) WYZEJ (Hfront),
           TYL (-Z, sciana C) NIZEJ (Hback). Attyka + membrana ida za spadem; sciany dobrane w buildWall. */
        var Hm = (Hfront + Hback) / 2;
        var rimH = st.tallBand ? Math.max(0.45, Hm - ft) : (hasAcc('full') ? 0.08 : 0.16), over = 0.05;
        var rimCY = function (h) { return st.tallBand ? (h - rimH / 2 + 0.14) : (h + rimH / 2 - 0.02); };
        /* przy lamelach na calosci attyka = drewniana deska (MILA); ale wysoka
           attyka (tallBand) zawsze z plyty — LOFT: lamele na dole, plyta u gory */
        var rimMat = function (w, h) {
          if (!hasAcc('full') || st.tallBand) return matWallFor(w, h);
          var m = matLamel(st.wood); m.color.multiplyScalar(0.82); return m;
        };
        /* attyka: przod wyzej (Hfront), tyl nizej (Hback), boki pochylone (przod w gore = -slopeA) */
        box(L + over * 2, rimH, 0.07, 0, rimCY(Hfront), hz + over - 0.035, hasAcc('band') ? matDark() : rimMat(L, rimH));
        box(L + over * 2, rimH, 0.07, 0, rimCY(Hback), -hz - over + 0.035, rimMat(L, rimH));
        box(0.07, rimH, W + over * 2, -hx - over + 0.035, rimCY(Hm), 0, rimMat(W, rimH)).rotation.x = -slopeA;
        box(0.07, rimH, W + over * 2, hx + over - 0.035, rimCY(Hm), 0, rimMat(W, rimH)).rotation.x = -slopeA;
        /* membrana dachu — pochylona: przod wyzej */
        var topY = st.tallBand ? (Hm + 0.14 - 0.05) : (Hm + rimH - 0.05);
        var top = box(L + over * 2 - 0.02, 0.05, (W + over * 2 - 0.02) / Math.cos(slopeA), 0, topY, 0, matMembrane());
        top.rotation.x = -slopeA; top.castShadow = false;
      } else {
        var a = 6 * Math.PI / 180, rise = W * Math.tan(a);
        var shape = new THREE.Shape();
        shape.moveTo(-hz, 0); shape.lineTo(hz, 0); shape.lineTo(-hz, rise); shape.closePath();
        var wgm = new THREE.ExtrudeGeometry(shape, { depth: L, bevelEnabled: false });
        var wedge = new THREE.Mesh(wgm, matWallFor(L, rise || 0.2));
        wedge.rotation.y = Math.PI / 2; wedge.position.set(-hx, H, 0);
        wedge.castShadow = true; building.add(wedge);
        var hyp = Math.hypot(W, rise);
        var slab = box(L + 0.3, 0.06, hyp + 0.25, 0, H + rise / 2 + 0.04, 0, matMembrane());
        slab.rotation.x = -a;
      }

      /* okucia narozne (KIOS): metalowe profile owijajace rogi */
      if (st.okucia) {
        var okw = 0.09, okd = 0.02, okh = H - 0.18;
        var aluOk = matAlu();
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (c) {
          var sx = c[0], sz = c[1];
          box(okw, okh, okd, sx * (hx - okw / 2), 0.15 + okh / 2, sz * (hz + okd / 2), aluOk);
          box(okd, okh, okw, sx * (hx + okd / 2), 0.15 + okh / 2, sz * (hz - okw / 2), aluOk);
        });
      }

      /* lamele: baza (styl 'slats' w kolorze elewacji) + akcent (zakres, kolor st.wood).
         Biegi generowane z TYCH SAMYCH segmentow co sciany — omijaja kazdy otwor
         na kazdej scianie (nadproza/podokienniki dostaja wlasne krotkie biegi).
         Naroznik = owiniecie ciagle: bieg frontu/tylu przechodzi PRZEZ krawedz
         o glebokosc zeber (WRAP), bieg boczny dobija z INSET. */
      /* przy wysokiej attyce (tallBand) lamele koncza sie pod pasem plyty (LOFT) */
      var Y0 = 0.16;
      var TOPY = st.tallBand ? (H - Math.max(0.45, H - ft) + 0.14) : (H - 0.02);
      var SH = TOPY - Y0;
      var WRAP = 0.085, INSET = 0.02;
      function runX(x0, x1, zPlane, nz, y, h) {
        if (y === undefined) { y = Y0; h = SH; }
        return { x0: x0, x1: x1, z0: zPlane, z1: zPlane, y: y, h: h, rotY: 0, len: Math.abs(x1 - x0), back: true, nz: nz };
      }
      function runZ(z0, z1, xPlane, nx, y, h) {
        if (y === undefined) { y = Y0; h = SH; }
        return { x0: xPlane, x1: xPlane, z0: z0, z1: z1, y: y, h: h, rotY: Math.PI / 2, len: Math.abs(z1 - z0), back: true, nx: nx };
      }
      /* segment lokalny sciany -> bieg w swiecie */
      function segRun(wall, u0, u1, y, h) {
        if (wall === 'A') return runX(u0, u1, hz + 0.02, 1, y, h);
        if (wall === 'C') return runX(-u1, -u0, -hz - 0.02, -1, y, h);
        if (wall === 'B') return runZ(-u1, -u0, hx + 0.02, 1, y, h);
        return runZ(u0, u1, -hx - 0.02, -1, y, h);           /* D */
      }
      function fullRuns() {
        var rr = [];
        WALLS.forEach(function (wall) {
          var len = WALL_DEF[wall].len;
          wallSegs[wall].forEach(function (s) {
            var u0 = s.u0, u1 = s.u1, y, h;
            if (s.hRun) { y = s.y; h = TOPY - s.y; }                 /* nadproze */
            else if (s.sill) { y = Y0; h = s.sill - Y0; }            /* podokiennik */
            /* owiniecie naroznika tylko dla segmentow dobijajacych do krawedzi */
            if (wall === 'A' || wall === 'C') {
              if (u0 <= -len / 2 + 0.001) u0 = -len / 2 - WRAP;
              if (u1 >= len / 2 - 0.001) u1 = len / 2 + WRAP;
            } else {
              if (u0 <= -len / 2 + 0.001) u0 = -len / 2 + INSET;
              if (u1 >= len / 2 - 0.001) u1 = len / 2 - INSET;
            }
            if (u1 - u0 > 0.08 && (h === undefined || h > 0.1)) rr.push(segRun(wall, u0, u1, y, h));
          });
        });
        return rr;
      }
      var runs = [];
      if (hasAcc('full')) runs = runs.concat(fullRuns());
      if (hasAcc('entrance')) {
        /* obreb wejscia = pas przeszklen ZAWIERAJACY drzwi ALU (na dowolnej scianie);
           fallback: strefa przeszklen frontu, gdy nigdzie nie ma drzwi */
        var eWall = null, eStrip = null;
        ['A', 'B', 'D', 'C'].forEach(function (w) {
          if (eStrip) return;
          var s = (wallStrips[w] || []).filter(function (x) { return x.hasDoor; })[0];
          if (s) { eWall = w; eStrip = s; }
        });
        if (!eStrip && nFront > 0) { eWall = 'A'; eStrip = { u0: zoneL, u1: zoneR }; }
        if (eStrip) {
          var eLen = WALL_DEF[eWall].len;
          var pwL = Math.min(0.45, Math.max(0, (eStrip.u0 + eLen / 2) - 0.02));
          var pwR = Math.min(0.45, Math.max(0, (eLen / 2 - eStrip.u1) - 0.02));
          if (pwL > 0.1) runs.push(segRun(eWall, eStrip.u0 - pwL, eStrip.u0));
          if (pwR > 0.1) runs.push(segRun(eWall, eStrip.u1, eStrip.u1 + pwR));
          /* pas nad wejsciem pomijamy, gdy pas gorny i tak obiega caly obwod */
          if (!hasAcc('band')) runs.push(segRun(eWall, eStrip.u0, eStrip.u1, ft, TOPY - ft));
        }
      }
      var bandTopH = Math.max(0.45, TOPY - ft), bandY = TOPY - bandTopH;
      if (hasAcc('corners')) {
        var cwF = st.cornerW, cwS = st.cornerSide;
        /* przy aktywnym pasie gornym narozniki koncza sie pod pasem (zero dublowania) */
        var cY, cH;
        if (hasAcc('band')) { cY = Y0; cH = bandY - Y0; }
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (c) {
          var sx = c[0], sz = c[1];
          runs.push(runX(sx * (hx - cwF), sx * (hx + WRAP), sz * (hz + 0.02), sz, cY, cH));
          runs.push(runZ(sz * (hz - cwS), sz * (hz - INSET), sx * (hx + 0.02), sx, cY, cH));
        });
      }
      if (hasAcc('band')) {
        runs.push(runX(-hx - WRAP, hx + WRAP, hz + 0.02, 1, bandY, bandTopH));
        runs.push(runX(-hx - WRAP, hx + WRAP, -hz - 0.02, -1, bandY, bandTopH));
        runs.push(runZ(-hz + INSET, hz - INSET, -hx - 0.02, -1, bandY, bandTopH));
        runs.push(runZ(-hz + INSET, hz - INSET, hx + 0.02, 1, bandY, bandTopH));
      }
      if (hasAcc('squares')) {
        /* CUBE: kwadraty drewna WPISANE w siatke kasetonow 62 cm (nie wolny panel) */
        var G = 0.62;
        var cols = Math.max(1, Math.min(2, Math.floor((fillWL - 0.08) / G)));
        var aw = cols * G;
        var xg = -hx + G;                     /* blok zaczyna sie od 2. kolumny siatki */
        var zEdge = nFront ? zoneL : hx;
        if (xg + aw > zEdge - 0.02) xg = zEdge - 0.02 - aw;
        if (xg > -hx) {
          var sq1 = box(aw, H - 0.06, 0.014, xg + aw / 2, H / 2, hz + 0.007, matWoodCassette(aw, H));
          sq1.castShadow = false;
        }
        var sq2 = box(0.014, H - 0.06, G, -hx - 0.007, H / 2, hz - G * 1.5, matWoodCassette(G, H));
        sq2.castShadow = false;
      }
      slatRun(runs, st.wood);

      /* meta do wyceny / kadru */
      var glassA = st.wit * 1.0 * 2.1 + st.drz * 0.9 * 2.1 + st.okn * 1.0;
      var meta = {
        wallArea: Math.max(0, 2 * (L * H + W * H) - glassA - st.steel * 0.9 * 2.1),
        glassArea: glassA, roofArea: L * W,
        wit: st.wit, drz: st.drz, steel: st.steel, okn: st.okn,
        openings: st.openings,
        resolved: resolvedInfo,   /* [i] = {wall, c, len, t} — realna pozycja po clampie/kolizjach */
        bounds: { L: L, W: W, H: H }
      };
      return { group: building, meta: meta, config: st };
    }

    /* ================= rama nosna (klatka stalowa z profilu 100x50x3) ================= */
    /* Geometria parametryczna z L/W/H. Regula rozstawu (Karol): rowny podzial dlugosci
       na pola -> zebra poprzeczne na kazdej stacji, DOL I GORA (referencje KB maja czesto
       tylko dol; u nas dublujemy na gorze -> rama zamknieta). Ten sam uklad wspolrzednych
       co build(): X wzdluz dlugosci L, Z wzdluz szerokosci W, Y w gore, podloga w y=0. */
    function buildFrame(cfg, opts) {
      var st = normalize(cfg);
      var L = st.L, W = st.W, H = st.H;
      var g = new THREE.Group();
      g.name = 'stago-frame';

      /* profil 100x50x3 mm -> przekroj 0.10 x 0.05 m */
      var PH = 0.10;   /* 100 mm — wymiar wiekszy (wysokosc rygli lezacych / szerokosc slupka) */
      var PT = 0.05;   /* 50 mm  — wymiar mniejszy (grubosc) */
      var mat = new THREE.MeshStandardMaterial({ color: '#565d66', roughness: 0.5, metalness: 0.6 });
      if (opts && opts.envMap) { mat.envMap = opts.envMap; mat.envMapIntensity = 0.55; }

      function bar(w, h, d, x, y, z) {
        var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
        g.add(m); return m;
      }

      var L2 = L / 2, W2 = W / 2;
      var yBot = PH / 2;         /* rama dolna spoczywa na gruncie */
      var yTop = H - PH / 2;     /* rama gorna pod stropem */

      /* stacje wzdluz dlugosci — rowny podzial na nBays pol (narozniki wliczone) */
      var BAY = 2.5;                                    /* docelowa dlugosc pola [m] — kalibrowalne */
      var nBays = Math.max(1, Math.round(L / BAY));
      var stations = [];
      for (var i = 0; i <= nBays; i++) stations.push(-L2 + i * (L / nBays));

      /* rygle wzdluzne (po dlugosci L) — dol i gora, oba boki */
      [-W2, W2].forEach(function (z) {
        bar(L, PH, PT, 0, yBot, z);
        bar(L, PH, PT, 0, yTop, z);
      });

      /* zebra poprzeczne (po szerokosci W) na KAZDEJ stacji — DOL I GORA */
      stations.forEach(function (x) {
        bar(PT, PH, W, x, yBot, 0);
        bar(PT, PH, W, x, yTop, 0);
      });

      /* slupki pionowe na kazdej stacji, oba boki */
      var postH = yTop - yBot;
      stations.forEach(function (x) {
        [-W2, W2].forEach(function (z) {
          bar(PT, postH, PT, x, (yBot + yTop) / 2, z);
        });
      });

      var meta = { profile: '100x50x3', bays: nBays, ribs: stations.length,
        posts: stations.length * 2, bounds: { L: L, W: W, H: H } };
      return { group: g, meta: meta, config: st };
    }

    return { PRESETS: PRESETS, DEFAULTS: DEFAULTS, KIND_DIMS: KIND_DIMS,
      WALLS: WALLS, ACCENT_SCOPES: ACCENT_SCOPES, normalize: normalize,
      build: build, buildFrame: buildFrame };
  };
});
