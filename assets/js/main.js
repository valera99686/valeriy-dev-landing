/* Valeriy-Dev Automation — UI interactions */
(() => {
  'use strict';

  // ---- Year in footer ----
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- Mobile nav toggle ----
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    // Close on link click (mobile)
    nav.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---- Card spotlight (mouse position as CSS vars) ----
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width) * 100 + '%');
      card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height) * 100 + '%');
    });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    });
  });

  // ---- Contact form ----
  const form = document.getElementById('contact-form');
  if (form) {
    const statusEl = form.querySelector('.form-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    const setStatus = (msg, type) => {
      statusEl.textContent = msg || '';
      statusEl.classList.remove('success', 'error');
      if (type) statusEl.classList.add(type);
    };

    const validate = () => {
      let ok = true;
      form.querySelectorAll('.field').forEach((f) => f.classList.remove('invalid'));
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      if (!name) { form.name.closest('.field').classList.add('invalid'); ok = false; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        form.email.closest('.field').classList.add('invalid'); ok = false;
      }
      if (message.length < 5) { form.message.closest('.field').classList.add('invalid'); ok = false; }
      return ok;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('', null);
      if (!validate()) {
        setStatus('Please fill in all fields correctly.', 'error');
        return;
      }

      const action = form.getAttribute('action') || '';
      const hasRealEndpoint = /^https?:\/\//.test(action) && !/FORMSPREE_ENDPOINT/.test(action);
      const usingJson = hasRealEndpoint && !/formspree\.io/.test(action);

      // Fallback: open mail client if no real endpoint is configured
      if (!hasRealEndpoint) {
        const subject = encodeURIComponent(`Inquiry from ${form.name.value.trim()}`);
        const body = encodeURIComponent(
          `Name: ${form.name.value.trim()}\nEmail: ${form.email.value.trim()}\n\n${form.message.value.trim()}`
        );
        window.location.href = `mailto:admin@valeriy-dev.xyz?subject=${subject}&body=${body}`;
        setStatus('Opening your mail client…', 'success');
        return;
      }

      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      try {
        const fd = new FormData(form);
        const body = usingJson
          ? JSON.stringify(Object.fromEntries(fd.entries()))
          : fd;
        const headers = { 'Accept': 'application/json' };
        if (usingJson) headers['Content-Type'] = 'application/json';
        const res = await fetch(action, { method: 'POST', headers, body });
        if (res.ok) {
          form.reset();
          setStatus('Thanks — your message is on its way. We will reply within 2 business days.', 'success');
        } else {
          const data = await res.json().catch(() => ({}));
          setStatus(data.error || 'Something went wrong. Please email admin@valeriy-dev.xyz.', 'error');
        }
      } catch (_err) {
        setStatus('Network error. Please email admin@valeriy-dev.xyz.', 'error');
      } finally {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
      }
    });
  }

  // ---- Typed hero accent ----
  const typed = document.getElementById('typed');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typed && !reduceMotion) {
    const phrases = ['& AI Workflows', '& Python Agents', '& Telegram Bots', '& LLM Integrations'];
    let pi = 0, ci = 0, dir = 1;
    const tick = () => {
      const full = phrases[pi];
      ci += dir;
      if (ci > full.length) { dir = -1; ci = full.length; setTimeout(tick, 1800); return; }
      if (ci < 0) { dir = 1; ci = 0; pi = (pi + 1) % phrases.length; setTimeout(tick, 250); return; }
      typed.textContent = full.slice(0, ci);
      setTimeout(tick, dir > 0 ? 70 : 35);
    };
    typed.textContent = '';
    setTimeout(tick, 800);
  }

  // ---- Scroll progress bar ----
  const progress = document.getElementById('scroll-progress');
  const backTop = document.getElementById('back-to-top');
  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop / Math.max(1, (h.scrollHeight - h.clientHeight));
    if (progress) progress.style.width = (scrolled * 100).toFixed(2) + '%';
    if (backTop) backTop.classList.toggle('show', h.scrollTop > 500);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (backTop) {
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  // ---- Stat counters ----
  const statEls = document.querySelectorAll('.stat-num');
  if ('IntersectionObserver' in window && statEls.length) {
    const countIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        countIo.unobserve(el);
        if (el.dataset.count == null) return; // textual stats (e.g. "EU", "AWS") — leave as-is
        const target = Number(el.dataset.count);
        if (Number.isNaN(target)) return;
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
        const duration = 1200;
        const start = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const val = Math.round(target * eased);
          el.textContent = prefix + val + suffix;
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    statEls.forEach((el) => countIo.observe(el));
  }

  // ---- Copy-to-clipboard on code snippet ----
  document.querySelectorAll('.code-snippet').forEach((pre) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.textContent = 'copy';
    pre.appendChild(btn);
    btn.addEventListener('click', async () => {
      const text = pre.querySelector('code')?.innerText ?? '';
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'copied';
        btn.classList.add('ok');
        setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('ok'); }, 1600);
      } catch (_e) {
        btn.textContent = 'error';
        setTimeout(() => { btn.textContent = 'copy'; }, 1600);
      }
    });
  });

  // ---- Service Worker registration (PWA / offline) ----
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ });
    });
  }

  // ---- Reveal on scroll ----
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'none';
            io.unobserve(entry.target);
          }
        }
      }, { threshold: 0.1 })
    : null;
  if (io && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.card, .stack-group, .section-head, .contact-form, .contact-copy, .process-list li, .plan, .faq-item, .case, .arch-figure').forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(14px)';
      el.style.transition = 'opacity .6s ease, transform .6s ease';
      io.observe(el);
    });
  }
})();
