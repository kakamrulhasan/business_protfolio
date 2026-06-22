/**
 * Liquid Ether — App Controller
 * Handles: fluid simulation, settings panel, scroll nav, reveal animations,
 * about counters, skill bars, and contact form.
 */
document.addEventListener('DOMContentLoaded', () => {

  /* ══════════ 1. FLUID SIMULATION ══════════ */
  const fluidSim = new FluidSimulation('fluid-canvas');


  /* ══════════ 2. FLOATING NAVBAR — SCROLL HIGHLIGHT ══════════ */
  const navbar  = document.getElementById('navbar');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function onScroll() {
    // scrolled class
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    // active link based on scroll position
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();


  /* ══════════ 3. SETTINGS PANEL ══════════ */
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel  = document.getElementById('settingsPanel');
  const settingsClose  = document.getElementById('settingsClose');

  settingsToggle.addEventListener('click', () => settingsPanel.classList.toggle('open'));
  settingsClose.addEventListener('click',  () => settingsPanel.classList.remove('open'));

  // Close panel on outside click
  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
      settingsPanel.classList.remove('open');
    }
  });

  // Viscosity
  const slideViscosity = document.getElementById('slide-viscosity');
  const valViscosity   = document.getElementById('val-viscosity');
  slideViscosity?.addEventListener('input', e => {
    valViscosity.textContent = e.target.value;
    fluidSim.setViscosity(e.target.value);
  });

  // Particles
  const slideParticles = document.getElementById('slide-particles');
  const valParticles   = document.getElementById('val-particles');
  slideParticles?.addEventListener('input', e => {
    valParticles.textContent = e.target.value;
    fluidSim.setParticleDensity(e.target.value);
  });

  // Radius
  const slideRadius = document.getElementById('slide-radius');
  const valRadius   = document.getElementById('val-radius');
  slideRadius?.addEventListener('input', e => {
    valRadius.textContent = e.target.value + 'px';
    fluidSim.setInfluenceRadius(e.target.value);
  });

  // Theme buttons
  const themeBtns = document.querySelectorAll('.theme-btn');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fluidSim.setTheme(btn.dataset.theme);
    });
  });

  // Reset
  const btnReset = document.getElementById('btn-reset');
  btnReset?.addEventListener('click', () => {
    fluidSim.reset();
    slideViscosity.value = 0.96; valViscosity.textContent = '0.96'; fluidSim.setViscosity(0.96);
    slideParticles.value = 1200; valParticles.textContent = '1200'; fluidSim.setParticleDensity(1200);
    slideRadius.value    = 80;   valRadius.textContent    = '80px'; fluidSim.setInfluenceRadius(80);
    themeBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.theme-btn[data-theme="ether"]')?.classList.add('active');
    fluidSim.setTheme('ether');
  });


  /* ══════════ 4. SCROLL REVEAL ══════════ */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => revealObserver.observe(el));


  /* ══════════ 5. ABOUT — COUNTER ANIMATION ══════════ */
  const countEls = document.querySelectorAll('.about-stat-value[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el    = entry.target;
      const end   = parseInt(el.dataset.count, 10);
      const dur   = 1400;
      const start = performance.now();
      const tick  = (now) => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.floor(p * (2 - p) * end); // ease-out quad
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = end;
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  countEls.forEach(el => counterObserver.observe(el));


  /* ══════════ 6. SKILL BARS ══════════ */
  const skillFills = document.querySelectorAll('.skill-fill[data-width]');
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.style.width = entry.target.dataset.width + '%';
      skillObserver.unobserve(entry.target);
    });
  }, { threshold: 0.3 });
  skillFills.forEach(el => skillObserver.observe(el));


  /* ══════════ 7. CONTACT FORM ══════════ */
  const contactForm    = document.getElementById('contactForm');
  const formSuccess    = document.getElementById('formSuccess');

  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
    btn.disabled = true;

    // Simulate async send
    setTimeout(() => {
      contactForm.style.display   = 'none';
      formSuccess.style.display   = 'flex';
    }, 1500);
  });


  /* ══════════ 8. SMOOTH SCROLL FOR ANCHOR LINKS ══════════ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
