/* Optional WebGL hero upgrade — lazy-loads three.js from a CDN and renders
   a slowly-rotating wire-frame icosphere with point "nodes" on its vertices.
   Fails silently (keeps the 2D canvas) if:
     - the device prefers reduced motion
     - the viewport is narrow (< 780px)
     - WebGL is unavailable
     - the CDN fetch fails
*/
(() => {
  'use strict';

  const host = document.querySelector('.hero');
  if (!host) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 780) return;

  // quick WebGL sniff
  try {
    const t = document.createElement('canvas').getContext('webgl2') ||
              document.createElement('canvas').getContext('webgl');
    if (!t) return;
  } catch (_e) { return; }

  const CDN = 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

  const mount = document.createElement('div');
  mount.className = 'hero-three';
  mount.setAttribute('aria-hidden', 'true');
  host.insertBefore(mount, host.firstChild);

  // Kick off after main thread is idle so we never block LCP.
  const kickoff = () => import(/* @vite-ignore */ CDN).then((THREE) => {
    const w = () => host.clientWidth;
    const h = () => host.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w(), h());
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w() / h(), 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const geo = new THREE.IcosahedronGeometry(1.5, 2);

    // wireframe
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.55 })
    );
    scene.add(wire);

    // vertex nodes
    const nodes = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0x7c3aed, size: 0.05, transparent: true, opacity: 0.9 })
    );
    scene.add(nodes);

    // subtle ambient glow
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.45, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.05 })
    );
    scene.add(glow);

    let running = true;
    const clock = new THREE.Clock();

    const onResize = () => renderer.setSize(w(), h()) && camera.updateProjectionMatrix();
    const debouncedResize = (() => {
      let t;
      return () => { clearTimeout(t); t = setTimeout(() => {
        renderer.setSize(w(), h());
        camera.aspect = w() / h();
        camera.updateProjectionMatrix();
      }, 120); };
    })();
    window.addEventListener('resize', debouncedResize);

    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) tick(); });

    const tick = () => {
      if (!running) return;
      const t = clock.getElapsedTime();
      wire.rotation.x = t * 0.15;
      wire.rotation.y = t * 0.22;
      nodes.rotation.x = t * 0.15;
      nodes.rotation.y = t * 0.22;
      glow.scale.setScalar(1 + Math.sin(t * 1.4) * 0.02);
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    tick();

    // 2D canvas underneath is still there; dim it so the two do not fight.
    const c2d = document.getElementById('hero-canvas');
    if (c2d) c2d.style.opacity = '0.35';
  }).catch(() => { /* silent fallback to 2D canvas */ });

  if ('requestIdleCallback' in window) {
    requestIdleCallback(kickoff, { timeout: 2500 });
  } else {
    setTimeout(kickoff, 600);
  }
})();
