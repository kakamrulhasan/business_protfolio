/**
 * Liquid Ether - UI Controller & Integrations
 * Synchronizes controls, implements page tabs, stats counters, custom SVG charts, and interactive HUDs.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Fluid Simulation
  const fluidSim = new FluidSimulation('fluid-canvas');

  // 2. Navigation Scroll Effect (Gives header extra contrast on scroll)
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 3. Single-Page Tab Switching Logic
  const navLinks = document.querySelectorAll('[data-tab], .logo, .nav-btn, .footer-link');
  const tabs = document.querySelectorAll('.tab-content');

  function switchTab(targetId) {
    const targetTab = document.getElementById(targetId);
    if (!targetTab || targetTab.classList.contains('active')) return;

    const currentActiveTab = document.querySelector('.tab-content.active');
    
    // Update navigation active states
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-tab') === targetId) {
        link.classList.add('active');
      }
    });

    if (currentActiveTab) {
      // Fade out old tab
      currentActiveTab.style.opacity = '0';
      currentActiveTab.style.transform = 'translateY(-12px)';
      currentActiveTab.style.filter = 'blur(4px)';
      currentActiveTab.style.transition = 'opacity 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), filter 0.2s ease';

      setTimeout(() => {
        currentActiveTab.classList.remove('active');
        currentActiveTab.style.opacity = '';
        currentActiveTab.style.transform = '';
        currentActiveTab.style.filter = '';
        currentActiveTab.style.transition = '';

        // Show and animate new tab
        targetTab.classList.add('active');
        
        // Smooth scroll to top of screen on page load
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Trigger animations if entering the stats/info view
        if (targetId === 'info-view') {
          animateCounters();
          
          // Re-trigger SVG chart draw line keyframe animation
          const chartStroke = document.getElementById('chart-stroke');
          if (chartStroke) {
            chartStroke.style.animation = 'none';
            chartStroke.offsetHeight; // force reflow
            chartStroke.style.animation = null;
          }
        }
      }, 200);
    } else {
      targetTab.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Bind clicks
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const targetId = link.getAttribute('data-tab') || (href && href.startsWith('#') ? href.substring(1) : null);
      
      if (targetId && document.getElementById(targetId)) {
        e.preventDefault();
        switchTab(targetId);
      }
    });
  });

  // 4. Fluid Control Sliders & Theme Toggles
  const slideViscosity = document.getElementById('slide-viscosity');
  const valViscosity = document.getElementById('val-viscosity');
  const slideParticles = document.getElementById('slide-particles');
  const valParticles = document.getElementById('val-particles');
  const slideRadius = document.getElementById('slide-radius');
  const valRadius = document.getElementById('val-radius');
  const themeBtns = document.querySelectorAll('.btn-control[data-theme]');
  const btnReset = document.getElementById('btn-reset');
  const activeStateTag = document.getElementById('active-state-tag');

  if (slideViscosity && valViscosity) {
    slideViscosity.addEventListener('input', (e) => {
      const val = e.target.value;
      valViscosity.textContent = val;
      fluidSim.setViscosity(val);
    });
  }

  if (slideParticles && valParticles) {
    slideParticles.addEventListener('input', (e) => {
      const val = e.target.value;
      valParticles.textContent = val;
      fluidSim.setParticleDensity(val);
    });
  }

  if (slideRadius && valRadius) {
    slideRadius.addEventListener('input', (e) => {
      const val = e.target.value;
      valRadius.textContent = val + 'px';
      fluidSim.setInfluenceRadius(val);
    });
  }

  themeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      themeBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const theme = e.target.getAttribute('data-theme');
      fluidSim.setTheme(theme);
    });
  });

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      fluidSim.reset();
      
      // Reset sliders
      if (slideViscosity) { slideViscosity.value = 0.96; valViscosity.textContent = '0.96'; fluidSim.setViscosity(0.96); }
      if (slideParticles) { slideParticles.value = 1200; valParticles.textContent = '1200'; fluidSim.setParticleDensity(1200); }
      if (slideRadius) { slideRadius.value = 80; valRadius.textContent = '80px'; fluidSim.setInfluenceRadius(80); }
      
      themeBtns.forEach(b => b.classList.remove('active'));
      const defaultThemeBtn = document.querySelector('.btn-control[data-theme="ether"]');
      if (defaultThemeBtn) defaultThemeBtn.classList.add('active');
      fluidSim.setTheme('ether');
    });
  }

  // HUD active state tracker
  const canvasElement = document.getElementById('fluid-canvas');
  if (canvasElement && activeStateTag) {
    let updateStateTimeout;
    
    const updateActiveState = (isTouch, clientX, clientY) => {
      const rect = canvasElement.getBoundingClientRect();
      const x = Math.round(clientX - rect.left);
      const y = Math.round(clientY - rect.top);
      const spd = Math.round(Math.sqrt(fluidSim.mouse.vx ** 2 + fluidSim.mouse.vy ** 2));
      
      activeStateTag.style.borderColor = 'rgba(0, 242, 254, 0.4)';
      activeStateTag.style.background = 'rgba(0, 242, 254, 0.08)';
      activeStateTag.style.color = 'var(--secondary)';
      activeStateTag.innerHTML = `Velocity Field: Active (X: ${x}, Y: ${y}) | Input Mag: ${spd}px/f`;
      
      clearTimeout(updateStateTimeout);
      updateStateTimeout = setTimeout(() => {
        activeStateTag.style.borderColor = 'rgba(123, 97, 255, 0.3)';
        activeStateTag.style.background = 'rgba(123, 97, 255, 0.2)';
        activeStateTag.style.color = '#a5b4fc';
        activeStateTag.innerHTML = 'Velocity Field: Simulated Drift (Autopilot)';
      }, 1000);
    };

    canvasElement.addEventListener('mousemove', (e) => {
      updateActiveState(false, e.clientX, e.clientY);
    });

    canvasElement.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        updateActiveState(true, e.touches[0].clientX, e.touches[0].clientY);
      }
    });
  }

  // 5. Stats Counter Animation
  const statsElements = [
    { id: 'stat-tvl', end: 342.8, prefix: '$', suffix: 'M', decimals: 1 },
    { id: 'stat-apr', end: 4.82, prefix: '', suffix: '%', decimals: 2 },
    { id: 'stat-validators', end: 124850, prefix: '', suffix: '', decimals: 0 }
  ];

  const animateCounters = () => {
    statsElements.forEach(stat => {
      const el = document.getElementById(stat.id);
      if (!el) return;
      
      let start = 0;
      const duration = 1500; // ms
      const startTime = performance.now();
      
      const updateCounter = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easeProgress = progress * (2 - progress); // easeOutQuad
        const currentValue = start + easeProgress * (stat.end - start);
        
        if (stat.decimals > 0) {
          el.textContent = stat.prefix + currentValue.toFixed(stat.decimals) + stat.suffix;
        } else {
          el.textContent = stat.prefix + Math.floor(currentValue).toLocaleString() + stat.suffix;
        }
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };
      
      requestAnimationFrame(updateCounter);
    });
  };

  // Run stats once on initial loading if index.html initially exposes #info-view (default is home-view)
  const currentTab = document.querySelector('.tab-content.active');
  if (currentTab && currentTab.id === 'info-view') {
    animateCounters();
  }

  // 6. SVG Chart Hover Tooltip Mechanics
  const chartCard = document.getElementById('chart-card');
  const chartTooltip = document.getElementById('chart-tooltip');
  
  const chartData = [
    { date: 'June 13', price: '1.0182 ETH', x: 0, y: 180 },
    { date: 'June 14', price: '1.0210 ETH', x: 100, y: 160 },
    { date: 'June 15', price: '1.0195 ETH', x: 200, y: 190 },
    { date: 'June 16', price: '1.0245 ETH', x: 300, y: 150 },
    { date: 'June 17', price: '1.0220 ETH', x: 400, y: 170 },
    { date: 'June 18', price: '1.0310 ETH', x: 500, y: 120 },
    { date: 'June 19', price: '1.0285 ETH', x: 600, y: 140 },
    { date: 'June 20', price: '1.0375 ETH', x: 700, y: 90 },
    { date: 'June 21', price: '1.0350 ETH', x: 800, y: 110 },
    { date: 'June 22', price: '1.0440 ETH', x: 900, y: 60 },
    { date: 'June 23', price: '1.0423 ETH', x: 1000, y: 70 }
  ];

  if (chartCard && chartTooltip) {
    const svgEl = chartCard.querySelector('svg');
    
    // Hover dot
    const indicatorDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    indicatorDot.setAttribute('r', '7');
    indicatorDot.setAttribute('fill', '#00f2fe');
    indicatorDot.setAttribute('stroke', '#ffffff');
    indicatorDot.setAttribute('stroke-width', '2');
    indicatorDot.setAttribute('style', 'filter: drop-shadow(0 0 5px var(--secondary-glow)); opacity: 0; transition: opacity 0.15s ease;');
    svgEl.appendChild(indicatorDot);

    // Guide line
    const guideLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    guideLine.setAttribute('y1', '0');
    guideLine.setAttribute('y2', '250');
    guideLine.setAttribute('stroke', 'rgba(0, 242, 254, 0.15)');
    guideLine.setAttribute('stroke-width', '1.5');
    guideLine.setAttribute('stroke-dasharray', '4 4');
    guideLine.setAttribute('style', 'opacity: 0; transition: opacity 0.15s ease;');
    svgEl.insertBefore(guideLine, svgEl.firstChild);

    chartCard.addEventListener('mousemove', (e) => {
      const rect = chartCard.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      
      const mappedX = (mouseX / rect.width) * 1000;
      const index = Math.max(0, Math.min(chartData.length - 1, Math.round(mappedX / 100)));
      const point = chartData[index];
      
      const pixelX = (point.x / 1000) * rect.width;
      const pixelY = (point.y / 250) * rect.height;
      
      indicatorDot.setAttribute('cx', point.x.toString());
      indicatorDot.setAttribute('cy', point.y.toString());
      indicatorDot.style.opacity = '1';
      
      guideLine.setAttribute('x1', point.x.toString());
      guideLine.setAttribute('x2', point.x.toString());
      guideLine.style.opacity = '1';
      
      chartTooltip.innerHTML = `
        <div style="font-weight: 700; color: #fff;">${point.price}</div>
        <div style="color: var(--color-text-secondary); font-size: 0.75rem;">${point.date}</div>
      `;
      chartTooltip.style.left = `${pixelX}px`;
      chartTooltip.style.top = `${pixelY - 15}px`;
      chartTooltip.style.opacity = '1';
      chartTooltip.style.transform = 'translate(-50%, -100%) scale(1)';
    });

    chartCard.addEventListener('mouseleave', () => {
      indicatorDot.style.opacity = '0';
      guideLine.style.opacity = '0';
      chartTooltip.style.opacity = '0';
      chartTooltip.style.transform = 'translate(-50%, -100%) scale(0.9)';
    });
  }
});
