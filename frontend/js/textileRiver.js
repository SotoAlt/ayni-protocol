/**
 * TextileRiver - Andean textile-inspired message visualization
 *
 * Creates a vertical infinite scroll of message bands that flow like
 * woven patterns in traditional tocapu textiles. Each message appears
 * as a horizontal band with a colored stripe indicating the sender.
 */

// Glyph definitions with binary patterns (imported from glyphRiver for consistency)
const GLYPH_PATTERNS = {
  // Queries - stepped spiral inward
  Q01: generateQueryPattern(),
  Q02: generateQueryPattern(1),
  Q03: generateQueryPattern(2),
  Q04: generateQueryPattern(3),

  // Responses - checkerboard
  R01: generateResponsePattern(),
  R02: generateResponsePattern(1),
  R03: generateResponsePattern(2),
  R04: generateResponsePattern(3),

  // Errors - broken symmetry
  E01: generateErrorPattern(),
  E02: generateErrorPattern(1),
  E03: generateErrorPattern(2),

  // Actions - diamond
  A01: generateActionPattern(),
  A02: generateActionPattern(1),
  A03: generateActionPattern(2),

  // Payments - chakana
  P01: generatePaymentPattern(),
  P02: generatePaymentPattern(1),
  P03: generatePaymentPattern(2),

  // States - pyramid
  S01: generateStatePattern(),
  S02: generateStatePattern(1),
  S03: generateStatePattern(2),
  S04: generateStatePattern(3)
};

// Pattern generators
function generateQueryPattern(variant = 0) {
  const grid = createEmptyGrid();
  drawBorder(grid);

  // Stepped spiral inward (xicalcoliuhqui motif)
  const offset = variant * 2;
  let x = 4 + offset;
  let y = 4;
  let size = 22 - offset * 2;

  while (size > 4) {
    for (let i = 0; i < size; i++) grid[y][x + i] = 1;
    for (let i = 0; i < size; i++) grid[y + i][x + size - 1] = 1;
    for (let i = 0; i < size - 2; i++) grid[y + size - 1][x + size - 1 - i] = 1;
    for (let i = 0; i < size - 2; i++) grid[y + size - 1 - i][x + 2] = 1;

    x += 2;
    y += 2;
    size -= 4;
  }

  return grid;
}

function generateResponsePattern(variant = 0) {
  const grid = createEmptyGrid();
  drawBorder(grid);

  const divisions = 4 + variant;
  const cellSize = Math.floor(24 / divisions);
  const startX = 4;
  const startY = 4;

  for (let row = 0; row < divisions; row++) {
    for (let col = 0; col < divisions; col++) {
      if ((row + col + variant) % 2 === 0) {
        for (let dy = 0; dy < cellSize; dy++) {
          for (let dx = 0; dx < cellSize; dx++) {
            const y = startY + row * cellSize + dy;
            const x = startX + col * cellSize + dx;
            if (x < 28 && y < 28) grid[y][x] = 1;
          }
        }
      }
    }
  }

  return grid;
}

function generateErrorPattern(variant = 0) {
  const grid = createEmptyGrid();
  drawBorder(grid);

  const cx = 16;
  const cy = 16;
  const breakQuadrant = variant;

  for (let q = 0; q < 4; q++) {
    const dx = (q === 0 || q === 2) ? -1 : 1;
    const dy = (q < 2) ? -1 : 1;

    if (q === breakQuadrant) {
      for (let i = 2; i <= 10; i += 3) {
        grid[cy + dy * i][cx + dx * i] = 1;
        grid[cy + dy * i][cx + dx * (i + 1)] = 1;
        grid[cy + dy * (i + 1)][cx + dx * i] = 1;
      }
    } else {
      for (let i = 2; i <= 10; i += 2) {
        for (let j = 0; j <= i; j++) {
          grid[cy + dy * i][cx + dx * j] = 1;
          grid[cy + dy * j][cx + dx * i] = 1;
        }
      }
    }
  }

  return grid;
}

function generateActionPattern(variant = 0) {
  const grid = createEmptyGrid();
  drawBorder(grid);

  const cx = 16;
  const cy = 16;
  const size = 10;
  const offset = variant * 2;

  for (let y = cy - size + offset; y <= cy + size - offset; y++) {
    const halfWidth = size - Math.abs(y - cy) - offset;
    for (let x = cx - halfWidth; x <= cx + halfWidth; x++) {
      if (x >= 2 && x < 30 && y >= 2 && y < 30) {
        grid[y][x] = 1;
      }
    }
  }

  for (let i = 2; i < size - 2 - offset; i += 2) {
    for (let x = cx - i; x <= cx + i; x++) {
      if (cy - i >= 2) grid[cy - i][x] = (x + i) % 2;
      if (cy + i < 30) grid[cy + i][x] = (x + i) % 2;
    }
  }

  return grid;
}

function generatePaymentPattern(variant = 0) {
  const grid = createEmptyGrid();
  drawBorder(grid);

  const cx = 16;
  const cy = 16;
  const armLength = 8 - variant;
  const armWidth = 4 + variant;

  const halfWidth = Math.floor(armWidth / 2);
  for (let dy = -halfWidth; dy <= halfWidth; dy++) {
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      grid[cy + dy][cx + dx] = 1;
    }
  }

  for (let dy = -armLength; dy < -halfWidth; dy++) {
    for (let dx = -halfWidth + 1; dx < halfWidth; dx++) {
      grid[cy + dy][cx + dx] = 1;
    }
  }
  for (let dy = halfWidth + 1; dy <= armLength; dy++) {
    for (let dx = -halfWidth + 1; dx < halfWidth; dx++) {
      grid[cy + dy][cx + dx] = 1;
    }
  }
  for (let dx = -armLength; dx < -halfWidth; dx++) {
    for (let dy = -halfWidth + 1; dy < halfWidth; dy++) {
      grid[cy + dy][cx + dx] = 1;
    }
  }
  for (let dx = halfWidth + 1; dx <= armLength; dx++) {
    for (let dy = -halfWidth + 1; dy < halfWidth; dy++) {
      grid[cy + dy][cx + dx] = 1;
    }
  }

  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  corners.forEach(([dx, dy]) => {
    grid[cy + dy * (halfWidth + 1)][cx + dx * (halfWidth + 1)] = 1;
  });

  return grid;
}

function generateStatePattern(variant = 0) {
  const grid = createEmptyGrid();
  drawBorder(grid);

  const levels = 4 + variant % 2;
  const direction = variant < 2 ? 'up' : 'down';
  const baseWidth = 22;
  const levelHeight = Math.floor(20 / levels);
  const widthStep = Math.floor(baseWidth / levels / 2);
  const bottomY = 26;
  const cx = 16;

  for (let level = 0; level < levels; level++) {
    const width = baseWidth - level * widthStep * 2;
    const y = direction === 'up'
      ? bottomY - level * levelHeight
      : bottomY - (levels - 1 - level) * levelHeight;

    const startX = cx - Math.floor(width / 2);
    for (let dy = 0; dy < levelHeight; dy++) {
      for (let dx = 0; dx < width; dx++) {
        if (y - dy >= 2 && y - dy < 30) {
          grid[y - dy][startX + dx] = 1;
        }
      }
    }
  }

  return grid;
}

function createEmptyGrid() {
  return Array(32).fill(null).map(() => Array(32).fill(0));
}

function drawBorder(grid, thickness = 1) {
  for (let t = 0; t < thickness; t++) {
    for (let i = t; i < 32 - t; i++) {
      grid[t][i] = 1;
      grid[31 - t][i] = 1;
      grid[i][t] = 1;
      grid[i][31 - t] = 1;
    }
  }
}

// Textile-inspired color palette for agents
const AGENT_COLORS = {
  alice: '#CD5C5C',    // Terracotta
  bob: '#1E3A5F',      // Deep Blue
  carol: '#228B22',    // Forest Green
  dave: '#CC7722',     // Ochre
  eve: '#800020',      // Burgundy
  system: '#FFD700',   // Gold
  // Additional agents get assigned from this rotation
  _palette: [
    '#8B4513',  // Saddle Brown
    '#2F4F4F',  // Dark Slate
    '#8B008B',  // Dark Magenta
    '#006400',  // Dark Green
    '#4682B4',  // Steel Blue
    '#B8860B',  // Dark Goldenrod
    '#556B2F',  // Dark Olive Green
    '#483D8B',  // Dark Slate Blue
  ]
};

// Category colors (cyberpunk palette)
const CATEGORY_COLORS = {
  query: '#00d9ff',
  response: '#00ff41',
  error: '#ff006e',
  action: '#ffcc00',
  payment: '#9d4edd',
  state: '#00b4d8'
};

// Glyph meanings
const GLYPH_MEANINGS = {
  Q01: 'Query Database',
  Q02: 'Query API',
  Q03: 'Search Request',
  Q04: 'Filter Query',
  R01: 'Response Success',
  R02: 'Response Data',
  R03: 'Response Empty',
  R04: 'Response Cached',
  E01: 'Error General',
  E02: 'Error Payment',
  E03: 'Error Permission',
  A01: 'Execute Action',
  A02: 'Update Action',
  A03: 'Delete Action',
  P01: 'Payment Sent',
  P02: 'Payment Confirmed',
  P03: 'Payment Refund',
  S01: 'State Idle',
  S02: 'State Processing',
  S03: 'State Waiting',
  S04: 'State Complete'
};

/**
 * TextileRiver class - manages the textile river visualization
 */
export class TextileRiver {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.messages = [];
    this.agentColors = new Map();
    this.agentColorIndex = 0;
    this.autoScroll = true;
    this.maxMessages = options.maxMessages || 100;
    this.onMessageClick = options.onMessageClick || (() => {});
    this.glyphSize = options.glyphSize || 128;

    this.init();
  }

  /**
   * Initialize the river container
   */
  init() {
    // Add scroll event listener to detect manual scrolling
    this.container.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = this.container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

      if (!isAtBottom && this.autoScroll) {
        this.autoScroll = false;
        this.showScrollButton();
      }
    });
  }

  /**
   * Get or assign a color for an agent
   */
  getAgentColor(agentId) {
    const normalizedId = agentId.toLowerCase();

    if (this.agentColors.has(normalizedId)) {
      return this.agentColors.get(normalizedId);
    }

    // Check if it's a predefined agent
    if (AGENT_COLORS[normalizedId]) {
      this.agentColors.set(normalizedId, AGENT_COLORS[normalizedId]);
      return AGENT_COLORS[normalizedId];
    }

    // Assign from palette
    const color = AGENT_COLORS._palette[this.agentColorIndex % AGENT_COLORS._palette.length];
    this.agentColorIndex++;
    this.agentColors.set(normalizedId, color);
    return color;
  }

  /**
   * Add a message band to the river
   */
  addMessage(message) {
    const { from, to, glyph, category, timestamp, meaning, data, encrypted, size } = message;

    // Store message
    this.messages.push(message);

    // Create message band
    const band = document.createElement('div');
    band.className = `message-band message-band--${category}`;
    band.dataset.message = JSON.stringify(message);

    // Get agent color
    const agentColor = this.getAgentColor(from);

    // Format time
    const time = new Date(timestamp);
    const timeStr = time.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Create canvas for large glyph
    const canvasId = `glyph-canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Build band HTML
    band.innerHTML = `
      <div class="agent-stripe" style="background-color: ${agentColor}"></div>
      <div class="message-band__content">
        <div class="message-band__header">
          <div class="message-band__flow">
            <span class="message-band__sender" style="color: ${agentColor}">${from.toUpperCase()}</span>
            <span class="message-band__arrow">→</span>
            <span class="message-band__recipient">${to.toUpperCase()}</span>
          </div>
          <div class="message-band__meta">
            <span class="message-band__size">${size || 128}B</span>
            <span class="message-band__time">${timeStr}</span>
          </div>
        </div>
        <div class="message-band__glyph">
          <div class="glyph-display">
            <canvas id="${canvasId}" width="${this.glyphSize}" height="${this.glyphSize}"></canvas>
          </div>
          <div class="glyph-textile-border glyph-textile-border--${category}"></div>
        </div>
        <div class="message-band__footer">
          <span class="message-band__id">${glyph}</span>
          <span class="message-band__meaning">${meaning || GLYPH_MEANINGS[glyph] || 'Unknown'}</span>
          ${encrypted ? '<span class="message-band__encrypted">ENCRYPTED</span>' : ''}
        </div>
      </div>
    `;

    // Click handler
    band.addEventListener('click', () => {
      this.onMessageClick(message);
    });

    // Add to container
    this.container.appendChild(band);

    // Render glyph after band is in DOM
    requestAnimationFrame(() => {
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        this.renderGlyph(canvas, glyph, category);
      }
    });

    // Auto-scroll if enabled
    if (this.autoScroll) {
      this.scrollToBottom();
    }

    // Remove old messages if exceeding max
    while (this.messages.length > this.maxMessages) {
      this.messages.shift();
      const firstBand = this.container.querySelector('.message-band');
      if (firstBand) {
        firstBand.classList.add('message-band--exit');
        setTimeout(() => firstBand.remove(), 300);
      }
    }

    return band;
  }

  /**
   * Render a glyph pattern to canvas at specified size
   */
  renderGlyph(canvas, glyphId, category) {
    const ctx = canvas.getContext('2d');
    const pattern = GLYPH_PATTERNS[glyphId] || GLYPH_PATTERNS.Q01;
    const size = canvas.width;
    const pixelSize = size / 32;

    // Clear canvas with void color
    ctx.fillStyle = '#030711';
    ctx.fillRect(0, 0, size, size);

    // Get category color
    const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.query;

    // Draw pixels
    ctx.fillStyle = color;
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        if (pattern[y][x]) {
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }

    // Add subtle textile weave overlay
    ctx.strokeStyle = `${color}22`;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < size; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
    }
  }

  /**
   * Render glyph to a larger canvas (for modal)
   */
  renderGlyphLarge(canvas, glyphId, category, size = 256) {
    const ctx = canvas.getContext('2d');
    const pattern = GLYPH_PATTERNS[glyphId] || GLYPH_PATTERNS.Q01;
    const pixelSize = size / 32;

    // Clear canvas
    ctx.fillStyle = '#030711';
    ctx.fillRect(0, 0, size, size);

    // Get category color
    const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.query;

    // Draw pixels
    ctx.fillStyle = color;
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        if (pattern[y][x]) {
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }
  }

  /**
   * Scroll to bottom of river
   */
  scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight;
  }

  /**
   * Show scroll-to-bottom button
   */
  showScrollButton() {
    let btn = this.container.parentElement.querySelector('.scroll-to-bottom');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'scroll-to-bottom';
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
        <span>New messages</span>
      `;
      btn.addEventListener('click', () => {
        this.autoScroll = true;
        this.scrollToBottom();
        btn.classList.remove('visible');
      });
      this.container.parentElement.appendChild(btn);
    }
    btn.classList.add('visible');
  }

  /**
   * Resume auto-scroll
   */
  resumeAutoScroll() {
    this.autoScroll = true;
    this.scrollToBottom();
    const btn = this.container.parentElement.querySelector('.scroll-to-bottom');
    if (btn) {
      btn.classList.remove('visible');
    }
  }

  /**
   * Clear all messages
   */
  clear() {
    this.container.innerHTML = '';
    this.messages = [];
  }

  /**
   * Get all registered agent colors
   */
  getAgentColors() {
    return new Map(this.agentColors);
  }

  /**
   * Get all glyph patterns (for external use)
   */
  static getPatterns() {
    return GLYPH_PATTERNS;
  }

  /**
   * Get glyph meanings
   */
  static getMeanings() {
    return GLYPH_MEANINGS;
  }
}

export default TextileRiver;
