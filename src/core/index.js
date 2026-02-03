/**
 * Ayni Protocol - Core Module
 *
 * Visual glyph protocol for AI agent communication.
 */

// Core classes
export { VisualGlyph, default as VisualGlyphDefault } from './VisualGlyph.js';
export { GlyphLibrary, getDefaultLibrary } from './GlyphLibrary.js';

// Drawing primitives
export {
  drawLine,
  drawCircle,
  drawCircleOutline,
  drawRect,
  drawRectOutline,
  drawBorder,
  drawPoint,
  drawEllipse,
  drawTriangle,
  floodFill,
  default as Primitives
} from './Primitives.js';

// Humanoid poses
export {
  drawPose,
  getPoseNames,
  hasPose,
  registerPose,
  POSE_CATEGORIES,
  default as Poses
} from './Poses.js';

// Symbol overlays
export {
  drawSymbol,
  getSymbolNames,
  hasSymbol,
  registerSymbol,
  default as Symbols
} from './Symbols.js';

// Rendering
export {
  toPNG,
  savePNG,
  toSVG,
  saveSVG,
  toDataURL,
  renderGrid,
  renderWithLabel,
  default as Renderer
} from './Renderer.js';
