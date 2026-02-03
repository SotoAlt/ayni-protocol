/**
 * GlyphRiver - Matrix-style falling glyph visualization
 *
 * Creates vertical columns of glyphs that flow down like The Matrix,
 * with each agent getting their own column.
 */

// Glyph definitions with binary patterns
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
    // Top edge
    for (let i = 0; i < size; i++) grid[y][x + i] = 1;
    // Right edge
    for (let i = 0; i < size; i++) grid[y + i][x + size - 1] = 1;
    // Bottom edge
    for (let i = 0; i < size - 2; i++) grid[y + size - 1][x + size - 1 - i] = 1;
    // Left edge (partial)
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

  // Checkerboard pattern
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

  // Broken symmetry - disrupted pattern
  const cx = 16;
  const cy = 16;
  const breakQuadrant = variant;

  for (let q = 0; q < 4; q++) {
    const dx = (q === 0 || q === 2) ? -1 : 1;
    const dy = (q < 2) ? -1 : 1;

    if (q === breakQuadrant) {
      // Broken/jagged pattern
      for (let i = 2; i <= 10; i += 3) {
        grid[cy + dy * i][cx + dx * i] = 1;
        grid[cy + dy * i][cx + dx * (i + 1)] = 1;
        grid[cy + dy * (i + 1)][cx + dx * i] = 1;
      }
    } else {
      // Normal stepped L-shape
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

  // Diamond pattern
  const cx = 16;
  const cy = 16;
  const size = 10;
  const offset = variant * 2;

  // Draw filled diamond
  for (let y = cy - size + offset; y <= cy + size - offset; y++) {
    const halfWidth = size - Math.abs(y - cy) - offset;
    for (let x = cx - halfWidth; x <= cx + halfWidth; x++) {
      if (x >= 2 && x < 30 && y >= 2 && y < 30) {
        grid[y][x] = 1;
      }
    }
  }

  // Add internal stepped lines
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

  // Chakana (Andean cross)
  const cx = 16;
  const cy = 16;
  const armLength = 8 - variant;
  const armWidth = 4 + variant;

  // Center square
  const halfWidth = Math.floor(armWidth / 2);
  for (let dy = -halfWidth; dy <= halfWidth; dy++) {
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      grid[cy + dy][cx + dx] = 1;
    }
  }

  // Four arms
  // Top
  for (let dy = -armLength; dy < -halfWidth; dy++) {
    for (let dx = -halfWidth + 1; dx < halfWidth; dx++) {
      grid[cy + dy][cx + dx] = 1;
    }
  }
  // Bottom
  for (let dy = halfWidth + 1; dy <= armLength; dy++) {
    for (let dx = -halfWidth + 1; dx < halfWidth; dx++) {
      grid[cy + dy][cx + dx] = 1;
    }
  }
  // Left
  for (let dx = -armLength; dx < -halfWidth; dx++) {
    for (let dy = -halfWidth + 1; dy < halfWidth; dy++) {
      grid[cy + dy][cx + dx] = 1;
    }
  }
  // Right
  for (let dx = halfWidth + 1; dx <= armLength; dx++) {
    for (let dy = -halfWidth + 1; dy < halfWidth; dy++) {
      grid[cy + dy][cx + dx] = 1;
    }
  }

  // Stepped corners
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  corners.forEach(([dx, dy]) => {
    grid[cy + dy * (halfWidth + 1)][cx + dx * (halfWidth + 1)] = 1;
  });

  return grid;
}

function generateStatePattern(variant = 0) {
  const grid = createEmptyGrid();
  drawBorder(grid);

  // Stepped pyramid
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

// Helper functions
function createEmptyGrid() {
  return Array(32).fill(null).map(() => Array(32).fill(0));
}

function drawBorder(grid, thickness = 1) {
  for (let t = 0; t < thickness; t++) {
    for (let i = t; i < 32 - t; i++) {
      grid[t][i] = 1;       // Top
      grid[31 - t][i] = 1;  // Bottom
      grid[i][t] = 1;       // Left
      grid[i][31 - t] = 1;  // Right
    }
  }
}

/**
 * GlyphRiver class - manages the river visualization
 */
export class GlyphRiver {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.columns = new Map();
    this.maxGlyphsPerColumn = options.maxGlyphs || 8;
    this.onGlyphClick = options.onGlyphClick || (() => {});
  }

  /**
   * Add or get a column for an agent
   */
  getColumn(agentId) {
    if (!this.columns.has(agentId)) {
      const column = this.createColumn(agentId);
      this.columns.set(agentId, column);
    }
    return this.columns.get(agentId);
  }

  /**
   * Create a new column element
   */
  createColumn(agentId) {
    const column = document.createElement('div');
    column.className = 'river-column';
    column.innerHTML = `
      <div class="river-column__header">${agentId.toUpperCase()}</div>
      <div class="river-column__content" data-agent="${agentId}"></div>
    `;
    this.container.appendChild(column);
    return column.querySelector('.river-column__content');
  }

  /**
   * Add a glyph to a column
   */
  addGlyph(message) {
    const { from, glyph, category, timestamp, meaning, data } = message;
    const column = this.getColumn(from);

    // Create glyph card
    const card = document.createElement('div');
    card.className = `glyph-card glyph-card--${category}`;
    card.dataset.message = JSON.stringify(message);

    // Create canvas for glyph
    const canvas = document.createElement('canvas');
    canvas.className = 'glyph-card__canvas';
    canvas.width = 32;
    canvas.height = 32;

    // Render glyph pattern
    this.renderGlyph(canvas, glyph, category);

    // Time formatting
    const time = new Date(timestamp);
    const timeStr = time.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    card.innerHTML = `
      <div class="glyph-card__visual"></div>
      <div class="glyph-card__info">
        <span class="glyph-card__id">${glyph}</span>
        <span class="glyph-card__time">${timeStr}</span>
      </div>
    `;

    card.querySelector('.glyph-card__visual').appendChild(canvas);

    // Click handler
    card.addEventListener('click', () => {
      this.onGlyphClick(message);
    });

    // Add to top of column
    column.insertBefore(card, column.firstChild);

    // Remove old glyphs if exceeding max
    while (column.children.length > this.maxGlyphsPerColumn) {
      const lastChild = column.lastChild;
      lastChild.style.animation = 'glyph-exit 0.3s ease-out forwards';
      setTimeout(() => lastChild.remove(), 300);
    }

    return card;
  }

  /**
   * Render a glyph pattern to canvas
   */
  renderGlyph(canvas, glyphId, category) {
    const ctx = canvas.getContext('2d');
    const pattern = GLYPH_PATTERNS[glyphId] || GLYPH_PATTERNS.Q01;

    // Clear canvas
    ctx.fillStyle = '#030711';
    ctx.fillRect(0, 0, 32, 32);

    // Get category color
    const colors = {
      query: '#00d9ff',
      response: '#00ff41',
      error: '#ff006e',
      action: '#ffcc00',
      payment: '#9d4edd',
      state: '#00b4d8'
    };
    const color = colors[category] || colors.query;

    // Draw pixels
    ctx.fillStyle = color;
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        if (pattern[y][x]) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
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
    const colors = {
      query: '#00d9ff',
      response: '#00ff41',
      error: '#ff006e',
      action: '#ffcc00',
      payment: '#9d4edd',
      state: '#00b4d8'
    };
    const color = colors[category] || colors.query;

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
   * Clear all columns
   */
  clear() {
    this.container.innerHTML = '';
    this.columns.clear();
  }

  /**
   * Get all glyph patterns (for external use)
   */
  static getPatterns() {
    return GLYPH_PATTERNS;
  }
}

export default GlyphRiver;
