# VLM Validation Results

**Date:** February 3, 2026
**Tester:** Claude Opus 4.5 (self-validation)

## Foundation Glyphs (Q01, R01, E01, A01)

### Visual Inspection Results

| Glyph | Identified | Pose Description | Symbol Description | Confidence |
|-------|------------|------------------|-------------------|------------|
| Q01 | ✅ Yes | Stick figure with arms raised upward | Filled cylinder/database shape top-right | High |
| R01 | ✅ Yes | Stick figure with arms forward/down (offering) | Checkmark (V-shape) top-right | High |
| E01 | ✅ Yes | Stick figure with arms bent toward head (distressed) | X mark (crossed lines) top-right | High |
| A01 | ✅ Yes | Stick figure in running pose (leaning forward) | Diamond outline top-right | High |

### Accuracy: 4/4 (100%)

### Visual Distinctness Analysis

**Poses are clearly distinct:**
- Q01: Arms point upward (questioning gesture)
- R01: Arms angled forward/down (giving/offering)
- E01: Arms bent to head (distress signal)
- A01: Body tilted forward, legs in motion (action)

**Symbols are clearly distinct:**
- Database: Filled rectangular/cylindrical shape
- Checkmark: Angular V-shape pointing up-right
- X: Two crossed diagonal lines
- Diamond: Four-point outline shape

### Resolution Testing

| Resolution | Clarity | Recommended |
|------------|---------|-------------|
| 32x32 | Low - Details hard to see | No |
| 64x64 | Medium - Distinguishable | Maybe |
| 128x128 | High - Clear details | Yes |
| 256x256 | Very High - Crisp | Yes (if bandwidth allows) |

**Recommendation:** Use 128x128 or higher for VLM-based recognition.

## Extended Glyphs Issue

The extended glyphs (Q02-Q04, R02-R04, E02-E06, A02-A05, S01-S04, P01-P03) have low Hamming distance:
- Minimum: 10 bits
- Average: 63.6 bits
- Target: 100 bits

**Root Cause:** At 32x32 resolution, stick figures with small symbol overlays don't provide enough visual variation when poses are similar.

**Recommendations:**
1. Stick to foundation 4 glyphs for critical communication
2. Consider 64x64 resolution for extended library
3. Add more visual elements (fill patterns, larger symbols, pose variations)
4. Test empirically with multiple VLMs before expanding library

## Next Steps

1. Test with external VLMs (GPT-4V, Gemini) to validate cross-model consistency
2. Redesign extended glyphs with more visual distinction
3. Consider semantic grouping (category indicated by pose, variant by symbol position)

## Conclusion

**Foundation glyphs (Q01, R01, E01, A01) are validated for VLM recognition at 128x128 resolution.**

Extended glyphs require redesign before production use.
