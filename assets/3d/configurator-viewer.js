/*
 * STAGO Configurator 3D — podglad na zywo w kroku konfiguratora.
 * Vanilla port PavilionViewer.svelte. Wymaga wczesniej zaladowanych:
 *   assets/3d/three.min.js  (global THREE, r147)
 *   assets/3d/stago-pavilion-core.js  (global StagoPavilionCore)
 *
 * API (window.StagoConfigurator3D):
 *   mount(hostEl)   — tworzy/przenosi <canvas> do hostEl (preview-hero) i startuje renderer
 *   update(state)   — mapuje state wizarda -> config silnika i przebudowuje bryle
 *   resize()        — przelicza rozmiar (po zmianie layoutu/kroku)
 *   snapshot()      — dataURL PNG (do leada/PDF, opcjonalnie)
 */
(function () {
  'use strict';

  var THREE, core, renderer, scene, camera, building, frame;
  var canvasEl = null, mounted = false, lastHost = null;
  var yaw = 0.72, pitch = 0.14, zoom = 1, drag = null;
  var cfg = { L: 6, W: 3, H: 2.64 };

  function disposeGroup(g) {
    g.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        (Array.isArray(o.material) ? o.material : [o.material])
          .forEach(function (m) { if (m && m.dispose) m.dispose(); });
      }
    });
  }

  /* CSS kolor (hex lub rgb()) -> hex; null dla gradientu/nieznanego */
  function cssToHex(v) {
    if (!v) return null;
    v = String(v).trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v;
    var m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (m) {
      var h = function (n) { return ('0' + parseInt(n, 10).toString(16)).slice(-2); };
      return '#' + h(m[1]) + h(m[2]) + h(m[3]);
    }
    return null;
  }

  /* state wizarda (window.state) -> config silnika (preset jako baza) */
  function mapState(st) {
    var key = (st && st.type ? String(st.type) : 'nord').toLowerCase();
    var base = (core.PRESETS && core.PRESETS[key]) ? core.PRESETS[key] : core.DEFAULTS;
    var c = {};
    for (var k in base) c[k] = base[k];
    if (st) {
      var L = parseFloat(st.dimL), W = parseFloat(st.dimW), H = parseFloat(st.dimH);
      if (L > 0) c.L = L;
      if (W > 0) c.W = W;
      if (H > 0) c.H = H;
      if (st.profil) c.style = /mikro/i.test(st.profil) ? 'micro' : 'flat';
      var hx = cssToHex(st.kolorScianHex);
      if (hx) c.colWall = hx;

      /* Akcenty lamelowe (jawna lista zakresów), kolor lameli → wood, okucia metal */
      if (st.accents && st.accents.length) c.accents = st.accents.slice();
      var wh = cssToHex(st.woodHex);
      if (wh) c.wood = wh;
      if (typeof st.okuciaMetal === 'boolean') c.okucia = st.okuciaMetal;
      /* Stolarka per-sciana: jesli wizard niesie jawna liste otworow, ona rzadzi */
      if (st.openings && st.openings.length) {
        c.openings = st.openings.map(function (o) {
          return { wall: o.wall, kind: o.kind, t: o.t, hinge: o.hinge };
        });
      } else {
        var drz = parseInt(st.doorQty, 10); if (!isNaN(drz)) c.drz = drz;
        var okn = parseInt(st.windowQty, 10); if (!isNaN(okn)) c.okn = okn;
        /* brak jawnej stolarki -> pozwol silnikowi zderiwowac otwory,
           chyba ze preset niesie jawny naroznik szklany (VIEW) */
        if (key !== 'view') delete c.openings;
      }
    }
    return c;
  }

  function rebuild() {
    if (!core || !scene) return;
    if (building) { scene.remove(building); disposeGroup(building); }
    building = core.build(cfg).group;
    scene.add(building);
  }

  function initScene() {
    THREE = window.THREE;
    core = window.StagoPavilionCore(THREE);

    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    scene = new THREE.Scene();
    scene.background = new THREE.Color('#E7EBEE');
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

    scene.add(new THREE.HemisphereLight('#dfe9f2', '#9aa096', 0.55));
    var sun = new THREE.DirectionalLight('#fff6e8', 1.25);
    sun.position.set(9, 13, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);
    var fill = new THREE.DirectionalLight('#dce6ee', 0.28);
    fill.position.set(-8, 6, -6);
    scene.add(fill);

    var ground = new THREE.Mesh(
      new THREE.CircleGeometry(45, 48),
      new THREE.MeshStandardMaterial({ color: '#b6bab4', roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    rebuild();
    loop();
  }

  function resize() {
    if (!canvasEl || !renderer) return;
    var r = canvasEl.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }

  function loop() {
    if (!drag) yaw += 0.0018;
    var L = cfg.L || 6, W = cfg.W || 3, H = cfg.H || 2.64;
    var d = (Math.max(L, W * 1.6) * 1.15 + 3.6) / zoom, ty = H * 0.48;
    camera.position.set(
      d * Math.cos(pitch) * Math.sin(yaw),
      ty + d * Math.sin(pitch),
      d * Math.cos(pitch) * Math.cos(yaw));
    camera.lookAt(0, ty, 0);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(loop);
  }

  function bindPointer() {
    canvasEl.addEventListener('pointerdown', function (e) {
      drag = [e.clientX, e.clientY];
      if (canvasEl.setPointerCapture) { try { canvasEl.setPointerCapture(e.pointerId); } catch (x) {} }
    });
    canvasEl.addEventListener('pointermove', function (e) {
      if (!drag) return;
      yaw += (e.clientX - drag[0]) * 0.008;
      pitch = Math.min(1.15, Math.max(0.02, pitch + (e.clientY - drag[1]) * 0.005));
      drag = [e.clientX, e.clientY];
    });
    canvasEl.addEventListener('pointerup', function () { drag = null; });
    canvasEl.addEventListener('pointercancel', function () { drag = null; });
    canvasEl.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoom = Math.min(2.6, Math.max(0.55, zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    }, { passive: false });
  }

  function ensureMaxBtn(host) {
    if (!host || host.querySelector('.stago3d-max')) return;
    if (!host.style.position) host.style.position = 'relative';
    var b = document.createElement('button');
    b.className = 'stago3d-max';
    b.type = 'button';
    b.title = 'Powiększ podgląd';
    b.setAttribute('aria-label', 'Powiększ podgląd');
    b.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
    b.addEventListener('click', function (e) { e.stopPropagation(); API.fullscreen(true); });
    host.appendChild(b);
  }

  var API = {
    ready: function () { return !!(window.THREE && window.StagoPavilionCore); },
    mount: function (host) {
      if (!host || !API.ready()) return;
      if (!canvasEl) {
        canvasEl = document.createElement('canvas');
        canvasEl.className = 'stago3d-canvas';
        canvasEl.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;cursor:grab;border-radius:inherit';
      }
      if (canvasEl.parentNode !== host) host.appendChild(canvasEl);
      ensureMaxBtn(host);
      lastHost = host;
      if (!mounted) { mounted = true; initScene(); bindPointer(); }
      setTimeout(resize, 30);
    },
    update: function (state) {
      if (!core) return;
      cfg = mapState(state);
      rebuild();
    },
    resize: resize,
    fullscreen: function (on) {
      var stage = document.getElementById('r3dStage');
      var modal = document.getElementById('render3dModal');
      if (!stage || !modal || !canvasEl) return;
      if (on) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        stage.appendChild(canvasEl);
      } else {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        if (lastHost) lastHost.appendChild(canvasEl);
      }
      setTimeout(resize, 40);
    },
    snapshot: function () {
      if (!renderer) return null;
      renderer.render(scene, camera);
      return canvasEl.toDataURL('image/png');
    }
  };

  window.StagoConfigurator3D = API;
  window.addEventListener('resize', resize);
})();
