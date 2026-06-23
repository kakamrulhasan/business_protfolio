/**
 * Liquid Ether — App Controller
 * Handles: fluid simulation, settings panel, scroll nav, reveal animations,
 * about counters, skill bars, and contact form.
 */
document.addEventListener('DOMContentLoaded', () => {
  const galleryImages = Array.from(document.querySelectorAll('.service-gallery-track img'));
  const lightbox = document.getElementById('imageLightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  let activeImageIndex = 0;

  const openLightbox = (index) => {
    activeImageIndex = index;
    const img = galleryImages[activeImageIndex];
    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  galleryImages.forEach((img, index) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openLightbox(index));
  });

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };

  const showNextImage = () => {
    const nextIndex = (activeImageIndex + 1) % galleryImages.length;
    openLightbox(nextIndex);
  };

  const showPrevImage = () => {
    const prevIndex = (activeImageIndex - 1 + galleryImages.length) % galleryImages.length;
    openLightbox(prevIndex);
  };

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', showPrevImage);
  nextBtn.addEventListener('click', showNextImage);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNextImage();
    if (e.key === 'ArrowLeft') showPrevImage();
  });


  /* ══════════ 1. FLUID SIMULATION ══════════ */
  const fluidSim = new FluidSimulation('fluid-canvas');


  /* ══════════ 2. FLOATING NAVBAR — SCROLL HIGHLIGHT ══════════ */
  const navbar = document.getElementById('navbar');
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

  /* ══════════ 2.5. SERVICE SECTION SLIDES ══════════ */
  const servicesSection = document.querySelector('.services-section');
  const serviceSlides = Array.from(document.querySelectorAll('.service-slide'));
  const serviceSteps = Array.from(document.querySelectorAll('.service-step'));

  function setActiveService(index) {
    serviceSlides.forEach((slide, slideIndex) => {
      slide.classList.toggle('active', slideIndex === index);
    });
    serviceSteps.forEach((step, stepIndex) => {
      step.classList.toggle('active', stepIndex === index);
    });
  }

  const serviceObserver = new IntersectionObserver((entries) => {
    let bestIndex = null;
    let bestRatio = 0;
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const index = serviceSlides.indexOf(entry.target);
      if (index < 0) return;
      if (entry.intersectionRatio > bestRatio) {
        bestRatio = entry.intersectionRatio;
        bestIndex = index;
      }
    });
    if (bestIndex !== null) setActiveService(bestIndex);
  }, {
    root: null,
    rootMargin: '-40% 0px -40% 0px',
    threshold: [0.25, 0.5, 0.75],
  });

  serviceSlides.forEach(slide => serviceObserver.observe(slide));
  setActiveService(0);

  /* ══════════ 3. SETTINGS PANEL ══════════ */
  const settingsToggle = document.getElementById('settingsToggle');
  const settingsPanel = document.getElementById('settingsPanel');
  const settingsClose = document.getElementById('settingsClose');

  settingsToggle.addEventListener('click', () => settingsPanel.classList.toggle('open'));
  settingsClose.addEventListener('click', () => settingsPanel.classList.remove('open'));

  // Close panel on outside click
  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && !settingsToggle.contains(e.target)) {
      settingsPanel.classList.remove('open');
    }
  });

  // Viscosity
  const slideViscosity = document.getElementById('slide-viscosity');
  const valViscosity = document.getElementById('val-viscosity');
  slideViscosity?.addEventListener('input', e => {
    valViscosity.textContent = e.target.value;
    fluidSim.setViscosity(e.target.value);
  });

  // Particles
  const slideParticles = document.getElementById('slide-particles');
  const valParticles = document.getElementById('val-particles');
  slideParticles?.addEventListener('input', e => {
    valParticles.textContent = e.target.value;
    fluidSim.setParticleDensity(e.target.value);
  });

  // Radius
  const slideRadius = document.getElementById('slide-radius');
  const valRadius = document.getElementById('val-radius');
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
    slideRadius.value = 80; valRadius.textContent = '80px'; fluidSim.setInfluenceRadius(80);
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
      const el = entry.target;
      const end = parseInt(el.dataset.count, 10);
      const dur = 1400;
      const start = performance.now();
      const tick = (now) => {
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
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('fname')?.value?.trim() || '';
    const lastName = document.getElementById('lname')?.value?.trim() || '';
    const email = document.getElementById('email')?.value?.trim() || '';
    const service = document.getElementById('service')?.value?.trim() || 'Not specified';
    const message = document.getElementById('message')?.value?.trim() || '';
    const btn = contactForm.querySelector('button[type="submit"]');

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
    btn.disabled = true;

    const subject = `New portfolio inquiry from ${firstName} ${lastName}`.trim();
    const formData = new FormData(contactForm);
    formData.set('_subject', subject);
    formData.set('_replyto', email);
    formData.set('_captcha', 'false');
    formData.set('_template', 'table');

    try {
      const response = await fetch('https://formsubmit.co/ajax/kakamrul2000@gmail.com', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Submission failed');

      contactForm.reset();
      contactForm.style.display = 'none';
      formSuccess.style.display = 'flex';
    } catch (error) {
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Try Again';
      btn.disabled = false;
      alert('Sorry, the message could not be sent right now. Please try again.');
    }
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
