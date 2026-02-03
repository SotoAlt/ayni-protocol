/**
 * Primitives - Drawing primitives for glyph rendering
 *
 * Provides low-level drawing operations using Bresenham algorithms
 * for pixel-perfect rendering on 32x32 grids.
 */

/**
 * Draw a line using Bresenham's algorithm
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} x0 - Start X
 * @param {number} y0 - Start Y
 * @param {number} x1 - End X
 * @param {number} y1 - End Y
 */
export function drawLine(glyph, x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    glyph.set(x0, y0, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/**
 * Draw a filled circle
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} r - Radius
 */
export function drawCircle(glyph, cx, cy, r) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= r) {
        glyph.set(x, y, 1);
      }
    }
  }
}

/**
 * Draw a circle outline (not filled)
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} r - Radius
 */
export function drawCircleOutline(glyph, cx, cy, r) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= r && dist >= r - 1) {
        glyph.set(x, y, 1);
      }
    }
  }
}

/**
 * Draw a filled rectangle
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} x - Top-left X
 * @param {number} y - Top-left Y
 * @param {number} w - Width
 * @param {number} h - Height
 */
export function drawRect(glyph, x, y, w, h) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      glyph.set(x + i, y + j, 1);
    }
  }
}

/**
 * Draw a rectangle outline (not filled)
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} x - Top-left X
 * @param {number} y - Top-left Y
 * @param {number} w - Width
 * @param {number} h - Height
 */
export function drawRectOutline(glyph, x, y, w, h) {
  drawLine(glyph, x, y, x + w - 1, y);           // Top
  drawLine(glyph, x, y + h - 1, x + w - 1, y + h - 1); // Bottom
  drawLine(glyph, x, y, x, y + h - 1);           // Left
  drawLine(glyph, x + w - 1, y, x + w - 1, y + h - 1); // Right
}

/**
 * Draw a border around the entire glyph
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} thickness - Border thickness (default: 1)
 */
export function drawBorder(glyph, thickness = 1) {
  for (let t = 0; t < thickness; t++) {
    for (let i = t; i < 32 - t; i++) {
      glyph.set(i, t, 1);       // Top
      glyph.set(i, 31 - t, 1);  // Bottom
      glyph.set(t, i, 1);       // Left
      glyph.set(31 - t, i, 1);  // Right
    }
  }
}

/**
 * Draw a point (single pixel)
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
export function drawPoint(glyph, x, y) {
  glyph.set(x, y, 1);
}

/**
 * Draw an ellipse
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} rx - X radius
 * @param {number} ry - Y radius
 */
export function drawEllipse(glyph, cx, cy, rx, ry) {
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        glyph.set(x, y, 1);
      }
    }
  }
}

/**
 * Draw a triangle
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} x1 - First vertex X
 * @param {number} y1 - First vertex Y
 * @param {number} x2 - Second vertex X
 * @param {number} y2 - Second vertex Y
 * @param {number} x3 - Third vertex X
 * @param {number} y3 - Third vertex Y
 */
export function drawTriangle(glyph, x1, y1, x2, y2, x3, y3) {
  drawLine(glyph, x1, y1, x2, y2);
  drawLine(glyph, x2, y2, x3, y3);
  drawLine(glyph, x3, y3, x1, y1);
}

/**
 * Flood fill from a point
 * @param {VisualGlyph} glyph - Target glyph
 * @param {number} x - Start X
 * @param {number} y - Start Y
 * @param {number} targetValue - Value to replace (0 or 1)
 */
export function floodFill(glyph, x, y, targetValue = 0) {
  if (x < 0 || x >= 32 || y < 0 || y >= 32) return;
  if (glyph.get(x, y) !== targetValue) return;

  const stack = [[x, y]];
  while (stack.length > 0) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cx >= 32 || cy < 0 || cy >= 32) continue;
    if (glyph.get(cx, cy) !== targetValue) continue;

    glyph.set(cx, cy, 1);
    stack.push([cx + 1, cy]);
    stack.push([cx - 1, cy]);
    stack.push([cx, cy + 1]);
    stack.push([cx, cy - 1]);
  }
}

export default {
  drawLine,
  drawCircle,
  drawCircleOutline,
  drawRect,
  drawRectOutline,
  drawBorder,
  drawPoint,
  drawEllipse,
  drawTriangle,
  floodFill
};
