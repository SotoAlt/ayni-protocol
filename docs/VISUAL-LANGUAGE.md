# Ayni Protocol - Visual Language Design

## Overview

The Ayni Protocol uses a visual communication system inspired by **tocapu**, the geometric patterns woven into Andean textiles for over 4,000 years. These patterns served as a pre-Columbian communication system, encoding administrative, religious, and social information.

Our glyph system bridges ancient visual grammar with modern AI agent communication.

## Design Principles

### 1. Grid-Based Mathematical Precision

Andean weavers used strict thread-counting (48-72 warp threads per inch). Our 32x32 grid follows this tradition:

- **1024 "threads"** (pixels) per glyph
- Every pixel must be intentional
- One thread out of place = obvious error (validation by visual inspection)

```
32×32 grid = 1024 bits = 128 bytes
```

### 2. Yanantin: Complementary Duality

In Andean philosophy, yanantin represents complementary opposites that form a whole:

- **Black/white** are not opposition but *complementary forces*
- Design pairs: Q01/R01 (query/response), E01/A01 (error/action)
- Use figure/ground reversal strategically
- Balance in visual weight across the glyph

### 3. Frame-Within-Field Composition

Traditional tocapu structure:

```
┌────────────────────────────────┐
│ 2px border (semantic frame)    │
│ ┌──────────────────────────┐   │
│ │                          │   │
│ │   24×24 primary motif    │   │
│ │   (category meaning)     │   │
│ │                          │   │
│ │   ┌────────┐            │   │
│ │   │ 8×8    │ symbol     │   │
│ │   │ corner │ overlay    │   │
│ │   └────────┘            │   │
│ └──────────────────────────┘   │
└────────────────────────────────┘
```

- **Outer frame:** 2px solid border (clear semantic boundary)
- **Motif zone:** 24×24 central area (category meaning via pattern)
- **Symbol zone:** 8×8 corner (specific action via overlay)

### 4. Geometric Abstraction

Following authentic Andean tradition:

- **NO curves** (looms create straight lines naturally)
- **Stepped designs** (tiered pyramids, ziggurats)
- **Checkerboard patterns** (Inca administrative symbol)
- **Diagonal arrangements** (dynamic meaning, motion)
- **Fret motifs** (xicalcoliuhqui/stepped spiral)

## Dual Style System

Ayni supports two rendering styles for different use cases:

### Geometric Style (Default)

Pure tocapu-inspired patterns. Best for:
- Maximum visual distinctness
- Cultural authenticity
- Compression-friendly (high-contrast patterns)
- VLM-friendly recognition

| Category | Motif | Description |
|----------|-------|-------------|
| Query | Stepped Spiral | Xicalcoliuhqui motif, seeking/questioning |
| Response | Checkerboard | Completeness, organization |
| Error | Broken Symmetry | Disruption, anomaly |
| Action | Diamond | Motion, transformation |
| Payment | Chakana | Andean cross, reciprocity |
| State | Pyramid | Hierarchy, progress levels |

### Representational Style

Improved humanoid figures with tocapu discipline. Best for:
- Human intuition (poses are immediately recognizable)
- Educational contexts
- Debugging/development

| Category | Pose | Description |
|----------|------|-------------|
| Query | Arms Up | Questioning, seeking |
| Response | Arms Down | Offering, providing |
| Error | Distressed | Hands to head, concern |
| Action | Running | Dynamic motion |
| State | Standing | Idle, waiting |

## Motif Reference

### Query Motifs (Q01-Q04)

**Stepped Spiral (Xicalcoliuhqui)**

The stepped fret motif represents:
- Water/wave (seeking, flow)
- Journey inward (questioning)
- Systematic search

```
████████████████████████████████
█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░█
█░██████████████████████████░░░█
█░█░░░░░░░░░░░░░░░░░░░░░░░░█░░░█
█░█░████████████████████░░░█░░░█
█░█░█░░░░░░░░░░░░░░░░░░█░░░█░░░█
█░█░█░████████████████░█░░░█░░░█
█░█░█░█░░░░░░░░░░░░░░█░█░░░█░░░█
█░█░█░█░██████████░░░█░█░░░█░░░█
█░█░█░█░█░░░░░░░░█░░░█░█░░░█░░░█
...
```

Variants: Q01 (tight), Q02 (loose), Q03 (offset), Q04 (doubled)

### Response Motifs (R01-R04)

**Checkerboard**

The alternating pattern represents:
- Inca administrative order
- Completeness/wholeness
- Structured data response

Variants: R01 (4×4), R02 (6×6), R03 (8×8), R04 (asymmetric)

### Error Motifs (E01-E06)

**Broken Symmetry**

Intentionally disrupted pattern represents:
- Yanantin disrupted (balance broken)
- Anomaly detection
- System failure

Break position indicates error type:
- E01: top-right (general error)
- E02: bottom-right (payment error)
- E03: top-left (permission)
- E04: bottom-left (not found)

### Action Motifs (A01-A05)

**Diamond (Rhombus)**

Tilted square represents:
- Transformation
- Motion/direction
- Decision point

Rotation indicates action type:
- A01: upright (execute)
- A02: tilted right (update)
- A03: tilted left (delete)

### Payment Motifs (P01-P03)

**Chakana (Andean Cross)**

The four-pointed stepped cross represents:
- Reciprocity (ayni)
- Four directions of exchange
- Balance of giving and receiving

```
        ████
        ████
    ████████████
    ████████████
████████████████████
████████████████████
    ████████████
    ████████████
        ████
        ████
```

The chakana's four points represent:
- **Top:** Love/emotion
- **Right:** Wisdom/knowledge
- **Bottom:** Work/labor
- **Left:** Sharing/community

### State Motifs (S01-S04)

**Stepped Pyramid**

Tiered structure represents:
- Hierarchy/levels
- Progress/completion
- System state

Direction indicates:
- S01/S02: Ascending (processing)
- S03/S04: Descending (completing)

## Symbol Overlays

8×8 geometric symbols placed in corners:

| Symbol | Position | Meaning |
|--------|----------|---------|
| database | (24, 8) | Data storage |
| checkmark | (24, 8) | Success |
| x | (6, 8) | Failure |
| diamond | (24, 8) | Action |
| clock | (24, 20) | Time/cache |
| lock | (6, 8) | Security |
| coin | (24, 20) | Payment |
| network | (6, 20) | API/connection |

## Visual Distinctness Requirements

### Hamming Distance

Each glyph pair must differ by at least **150 bits** (15% of 1024):

```javascript
// Validation
const library = new GlyphLibrary();
const result = library.hammingDistanceMatrix({ minDistance: 150 });
console.log(result.validation.passed); // true
console.log(result.stats.min);         // Should be >= 150
```

### Category Color Coding (Display)

When rendering glyphs in UI:

| Category | Hex Color | Glow |
|----------|-----------|------|
| Query | #00d9ff | Cyan |
| Response | #00ff41 | Green |
| Error | #ff006e | Magenta |
| Action | #ffcc00 | Yellow |
| Payment | #9d4edd | Purple |
| State | #00b4d8 | Teal |

## Implementation

### Using the Motif System

```javascript
import { drawMotif, setMotifStyle } from 'ayni-protocol/core';

// Set global style
setMotifStyle('geometric'); // or 'representational'

// Draw a motif
const glyph = new VisualGlyph({ id: 'Q01', category: 'query' });
drawMotif(glyph, 'arms_up'); // Uses current style

// Override style per-call
drawMotif(glyph, 'arms_up', 16, 16, { style: 'representational' });
```

### Using Tocapu Motifs Directly

```javascript
import {
  drawSteppedSpiral,
  drawCheckerboard,
  drawBrokenSymmetry,
  drawDiamond,
  drawChakana
} from 'ayni-protocol/core';

// Direct geometric pattern
drawSteppedSpiral(glyph, 'inward', 16, 16);
drawCheckerboard(glyph, 4, 4, 4, 24);
drawChakana(glyph, 16, 16, 12);
```

## Cultural Considerations

### Respectful Use

The tocapu patterns are part of living Andean cultures. Our implementation:

1. **Educational context:** Explains cultural origins in documentation
2. **Not appropriation:** Creates new patterns inspired by principles, not copying sacred symbols
3. **Attribution:** Credits Andean textile traditions
4. **Future:** Plans for partnership with Andean communities (Phase 6)

### Tocapu Principles We Follow

1. **Mathematical precision** (grid-based)
2. **Geometric abstraction** (no curves)
3. **Semantic layering** (frame + motif + symbol)
4. **Complementary duality** (yanantin)
5. **Visual communication** (meaning through pattern)

### What We Don't Do

1. Copy specific sacred tocapu patterns
2. Claim cultural ownership
3. Misrepresent patterns as "authentic" tocapu
4. Use patterns without explaining their inspiration

## Future Work

### Phase 6: Cultural Integration (2027+)

- Partner with Andean organizations
- Digitize authentic pattern vocabulary
- Document symbolic meanings
- Establish ethical review board
- Create physical Jacquard loom weavings
- Develop educational programs

## References

- Cereceda, Verónica. "Semiología de los textiles andinos"
- Frame, Mary. "The Visual Images of Fabric Structures in Ancient Peruvian Art"
- Silverman, Gail P. "El tejido andino: un libro de sabiduría"
- Paternosto, César. "The Stone and the Thread: Andean Roots of Abstract Art"
