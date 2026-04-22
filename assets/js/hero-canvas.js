/* Lightweight particle-network animation for hero background. */
(() => {
  'use strict';

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  let particles = [];
  let raf = null;
  let running = true;

  const CFG = {
    density: 0.00009,   // particles per pixel
    maxParticles: 90,
    minParticles: 25,
    linkDistance: 140,
    speed: 0.25,
    color: [0, 229, 255],
    color2: [124, 58, 237]
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  function initParticles() {
    const count = Math.max(CFG.minParticles, Math.min(CFG.maxParticles, Math.floor(width * height * CFG.density)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * CFG.speed,
      vy: (Math.random() - 0.5) * CFG.speed,
      r: 1 + Math.random() * 1.4
    }));
  }

  function step() {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);

    // update
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
    }

    // links
    const [r1, g1, b1] = CFG.color;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        const D = CFG.linkDistance;
        if (d2 < D * D) {
          const alpha = (1 - Math.sqrt(d2) / D) * 0.45;
          ctx.strokeStyle = `rgba(${r1}, ${g1}, ${b1}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // dots
    for (const p of particles) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${r1}, ${g1}, ${b1}, 0.9)`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(step);
  }

  function start() {
    if (raf) return;
    running = true;
    raf = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  // Pause when tab not visible (saves CPU/battery)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  window.addEventListener('resize', () => {
    // simple debounce
    clearTimeout(window.__hc_rt);
    window.__hc_rt = setTimeout(resize, 120);
  });

  resize();
  start();
})();
