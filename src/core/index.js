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

// Motifs (unified pose/pattern system)
export {
  drawMotif,
  getMotifNames,
  hasMotif,
  registerMotif,
  MOTIF_CATEGORIES,
  setMotifStyle,
  getMotifStyle,
  // Backward compatibility
  drawPose,
  getPoseNames,
  hasPose,
  registerPose,
  POSE_CATEGORIES,
  default as Motifs
} from './Motifs.js';

// Tocapu geometric patterns
export {
  drawTocapuMotif,
  drawSteppedSpiral,
  drawCheckerboard,
  drawBrokenSymmetry,
  drawDiamond,
  drawChakana,
  drawSteppedPyramid,
  drawWavePattern,
  drawConcentricSquares,
  drawCrosshatch,
  default as TocapuMotifs
} from './TocapuMotifs.js';

// Legacy Poses alias (backward compatibility)
export { default as Poses } from './Motifs.js';

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
