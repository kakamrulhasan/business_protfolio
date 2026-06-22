/**
 * Liquid Ether - 2D Interactive Physics Fluid Simulation
 * Handles vector velocity fields, particle dynamics, and canvas rendering.
 */

class FluidSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Configurable Parameters (updated by UI controls)
    this.viscosity = 0.96;
    this.maxParticles = 1200;
    this.influenceRadius = 80;
    this.colorTheme = 'ether';
    
    // Simulation state variables
    this.gridCellSize = 30; // Size of each vector cell in pixels
    this.grid = [];
    this.particles = [];
    this.cols = 0;
    this.rows = 0;
    
    this.mouse = {
      x: 0,
      y: 0,
      px: 0,
      py: 0,
      vx: 0,
      vy: 0,
      isMoving: false,
      idleTimer: 0
    };
    
    this.colorPalettes = {
      ether: ['#00f2fe', '#4facfe', '#7b61ff', '#a5b4fc', '#6366f1'],
      gold: ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#fef08a'],
      neon: ['#ff007a', '#f43f5e', '#ec4899', '#d946ef', '#a855f7']
    };
    
    // Bind event handlers
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.tick = this.tick.bind(this);
    
    this.init();
  }
  
  init() {
    this.setupCanvas();
    this.initGrid();
    this.initParticles();
    
    // Add Event Listeners
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    
    // Start loop
    requestAnimationFrame(this.tick);
  }
  
  setupCanvas() {
    // Canvas is fixed to viewport — always use window dimensions
    this.width  = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width  = this.width;
    this.canvas.height = this.height;
  }
  
  initGrid() {
    this.cols = Math.ceil(this.width / this.gridCellSize) + 2;
    this.rows = Math.ceil(this.height / this.gridCellSize) + 2;
    
    this.grid = new Array(this.cols * this.rows);
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i] = {
        vx: 0,
        vy: 0,
        density: 0
      };
    }
  }
  
  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }
  
  createParticle(x, y) {
    const colors = this.colorPalettes[this.colorTheme];
    return {
      x: x !== undefined ? x : Math.random() * this.width,
      y: y !== undefined ? y : Math.random() * this.height,
      px: 0, // previous x (for trails)
      py: 0, // previous y (for trails)
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.6 + 0.4,
      life: Math.random() * 100 + 50,
      maxLife: 150
    };
  }
  
  handleResize() {
    this.setupCanvas();
    this.initGrid();
    // Keep existing particles, but prune if width shrank to avoid out-of-bounds calculations
    this.particles.forEach(p => {
      if (p.x > this.width) p.x = Math.random() * this.width;
      if (p.y > this.height) p.y = Math.random() * this.height;
    });
  }
  
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    // Calculate velocity
    this.mouse.vx = mx - this.mouse.x;
    this.mouse.vy = my - this.mouse.y;
    
    this.mouse.px = this.mouse.x;
    this.mouse.py = this.mouse.y;
    this.mouse.x = mx;
    this.mouse.y = my;
    
    this.mouse.isMoving = true;
    this.mouse.idleTimer = 0;
    
    this.injectForce();
  }
  
  handleTouchMove(e) {
    if (e.touches.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.touches[0].clientX - rect.left;
      const my = e.touches[0].clientY - rect.top;
      
      this.mouse.vx = mx - this.mouse.x;
      this.mouse.vy = my - this.mouse.y;
      
      this.mouse.px = this.mouse.x;
      this.mouse.py = this.mouse.y;
      this.mouse.x = mx;
      this.mouse.y = my;
      
      this.mouse.isMoving = true;
      this.mouse.idleTimer = 0;
      
      this.injectForce();
    }
  }
  
  injectForce() {
    // If mouse is inside canvas boundaries
    if (this.mouse.x < 0 || this.mouse.x > this.width || this.mouse.y < 0 || this.mouse.y > this.height) {
      return;
    }
    
    const limit = 60; // Max speed injection
    const speedX = Math.max(-limit, Math.min(limit, this.mouse.vx * 1.5));
    const speedY = Math.max(-limit, Math.min(limit, this.mouse.vy * 1.5));
    
    // Inject velocity into nearby grid cells
    const cellRadius = Math.ceil(this.influenceRadius / this.gridCellSize);
    const mouseGridX = Math.floor(this.mouse.x / this.gridCellSize);
    const mouseGridY = Math.floor(this.mouse.y / this.gridCellSize);
    
    for (let dy = -cellRadius; dy <= cellRadius; dy++) {
      for (let dx = -cellRadius; dx <= cellRadius; dx++) {
        const gx = mouseGridX + dx;
        const gy = mouseGridY + dy;
        
        // Check grid boundary
        if (gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows) {
          const index = gx + gy * this.cols;
          
          // Distance check for circular falloff
          const pixelX = gx * this.gridCellSize + this.gridCellSize / 2;
          const pixelY = gy * this.gridCellSize + this.gridCellSize / 2;
          const distSq = (pixelX - this.mouse.x) ** 2 + (pixelY - this.mouse.y) ** 2;
          const radiusSq = this.influenceRadius ** 2;
          
          if (distSq < radiusSq) {
            const force = 1 - Math.sqrt(distSq) / this.influenceRadius;
            this.grid[index].vx += speedX * force * 0.15;
            this.grid[index].vy += speedY * force * 0.15;
          }
        }
      }
    }
    
    // Trigger small particle burst on movements
    if (Math.random() < 0.3) {
      const burstSize = 3;
      for (let k = 0; k < burstSize; k++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 20;
        const px = this.mouse.x + Math.cos(angle) * r;
        const py = this.mouse.y + Math.sin(angle) * r;
        
        if (this.particles.length < this.maxParticles * 1.5) {
          const p = this.createParticle(px, py);
          p.vx = speedX * 0.2 + (Math.random() - 0.5) * 2;
          p.vy = speedY * 0.2 + (Math.random() - 0.5) * 2;
          p.life = Math.random() * 60 + 20;
          this.particles.push(p);
        }
      }
    }
  }
  
  updateGrid() {
    // Fluid simulation - Jacobi-like relaxation diffusion for grid velocities
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        const index = x + y * this.cols;
        
        // Dissipate / Apply viscosity
        this.grid[index].vx *= this.viscosity;
        this.grid[index].vy *= this.viscosity;
        
        // Neighbor indices
        const left  = (x - 1) + y * this.cols;
        const right = (x + 1) + y * this.cols;
        const up    = x + (y - 1) * this.cols;
        const down  = x + (y + 1) * this.cols;
        
        // Velocity diffusion
        const avgVx = (this.grid[left].vx + this.grid[right].vx + this.grid[up].vx + this.grid[down].vx) * 0.25;
        const avgVy = (this.grid[left].vy + this.grid[right].vy + this.grid[up].vy + this.grid[down].vy) * 0.25;
        
        this.grid[index].vx += (avgVx - this.grid[index].vx) * 0.08;
        this.grid[index].vy += (avgVy - this.grid[index].vy) * 0.08;
      }
    }
  }
  
  updateParticles() {
    const colors = this.colorPalettes[this.colorTheme];
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life--;
      
      // If particle dies, respawn or remove depending on max density
      if (p.life <= 0) {
        if (this.particles.length > this.maxParticles) {
          // Remove excess burst particles
          this.particles.splice(i, 1);
          continue;
        } else {
          // Re-initialize random particle
          this.particles[i] = this.createParticle();
          continue;
        }
      }
      
      // Save current positions for vector rendering trails
      p.px = p.x;
      p.py = p.y;
      
      // Calculate particle grid position
      const gx = Math.floor(p.x / this.gridCellSize);
      const gy = Math.floor(p.y / this.gridCellSize);
      
      let gridVx = 0;
      let gridVy = 0;
      
      // Read velocity from grid if in bounds
      if (gx >= 0 && gx < this.cols && gy >= 0 && gy < this.rows) {
        const index = gx + gy * this.cols;
        gridVx = this.grid[index].vx;
        gridVy = this.grid[index].vy;
      }
      
      // Combine particle's inertia with grid force
      p.vx = p.vx * 0.95 + gridVx * 0.06;
      p.vy = p.vy * 0.95 + gridVy * 0.06;
      
      // Add subtle background float/wind force to prevent stagnant dots
      p.vx += (Math.random() - 0.5) * 0.08;
      p.vy -= 0.02; // Gentle rising fluid movement
      
      // Update coordinates
      p.x += p.vx;
      p.y += p.vy;
      
      // Wrap coordinates around screen boundaries
      if (p.x < 0) { p.x = this.width; p.px = p.x; }
      else if (p.x > this.width) { p.x = 0; p.px = p.x; }
      
      if (p.y < 0) { p.y = this.height; p.py = p.y; }
      else if (p.y > this.height) { p.y = 0; p.py = p.y; }
    }
  }
  
  render() {
    // Leave semi-transparent trails for long motion tracks (creates glowing flow line effects)
    this.ctx.fillStyle = 'rgba(7, 8, 15, 0.085)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw fluid particles
    this.ctx.globalCompositeOperation = 'lighter';
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      
      // Draw tail trail line
      const dx = p.x - p.px;
      const dy = p.y - p.py;
      const speed = Math.sqrt(dx * dx + dy * dy);
      
      // Only draw line if not wrapped around screen edges
      if (speed < 100) {
        this.ctx.beginPath();
        this.ctx.moveTo(p.px, p.py);
        this.ctx.lineTo(p.x, p.y);
        
        // Dynamic styling: faster particles are brighter and slightly wider
        this.ctx.lineWidth = p.size * (1 + speed * 0.15);
        this.ctx.strokeStyle = p.color;
        
        // Interpolate opacity based on remaining particle life
        let alpha = p.alpha;
        if (p.life < 30) {
          alpha = p.alpha * (p.life / 30);
        }
        this.ctx.globalAlpha = alpha;
        
        this.ctx.stroke();
      }
    }
    
    this.ctx.globalAlpha = 1.0;
    this.ctx.globalCompositeOperation = 'source-over';
  }
  
  tick() {
    // Generate automated motion (fluid swirls) when user is idle
    this.mouse.idleTimer++;
    if (this.mouse.idleTimer > 120) {
      // Swirl math
      const t = Date.now() * 0.0015;
      const cx = this.width / 2 + Math.cos(t * 0.7) * (this.width * 0.25);
      const cy = this.height / 2 + Math.sin(t * 0.5) * (this.height * 0.2);
      
      const vx = Math.cos(t * 1.5) * 5;
      const vy = Math.sin(t * 1.2) * 5;
      
      // Inject force artificially
      this.mouse.vx = vx;
      this.mouse.vy = vy;
      this.mouse.x = cx;
      this.mouse.y = cy;
      this.injectForce();
    }
    
    this.updateGrid();
    this.updateParticles();
    this.render();
    
    requestAnimationFrame(this.tick);
  }
  
  // Interface methods to sync variables dynamically from Control Panel UI
  setViscosity(val) {
    this.viscosity = parseFloat(val);
  }
  
  setParticleDensity(val) {
    const prevMax = this.maxParticles;
    this.maxParticles = parseInt(val, 10);
    
    if (this.maxParticles > prevMax) {
      // Add more particles
      for (let i = 0; i < this.maxParticles - prevMax; i++) {
        this.particles.push(this.createParticle());
      }
    } else {
      // Shorten particles array
      this.particles.length = this.maxParticles;
    }
  }
  
  setInfluenceRadius(val) {
    this.influenceRadius = parseInt(val, 10);
  }
  
  setTheme(themeName) {
    if (this.colorPalettes[themeName]) {
      this.colorTheme = themeName;
      // Convert current particle colors to matching theme colors
      const colors = this.colorPalettes[themeName];
      this.particles.forEach(p => {
        p.color = colors[Math.floor(Math.random() * colors.length)];
      });
    }
  }
  
  reset() {
    this.initGrid();
    this.initParticles();
    this.mouse.idleTimer = 0;
  }
}
