# VLM Test Prompts

Use these prompts to manually test VLM glyph recognition.

## Identification Test

```
Look at this 32x32 pixel black and white image. It shows a simple visual glyph
used in the Ayni Protocol for AI agent communication.

The glyph contains:
1. A humanoid stick figure in a specific pose
2. A symbol overlay (database, checkmark, X, diamond, etc.)
3. A border frame

Based on the pose and symbol, identify which glyph this is:
- Q01 (Query): arms raised + database symbol
- R01 (Response): arms offering + checkmark
- E01 (Error): distressed pose + X symbol
- A01 (Action): running pose + diamond

What is your answer? Explain your reasoning.
```

## Comparison Test

```
You are shown two 32x32 pixel glyphs from the Ayni Protocol.

1. Describe the pose of the humanoid figure in each glyph
2. Identify the symbol overlay in each glyph
3. Determine if these are the same glyph or different glyphs
4. Rate your confidence (low/medium/high)
```

## Batch Test

```
I'm showing you 4 glyphs from the Ayni Protocol in a 2x2 grid.
These are the foundation glyphs: Q01, R01, E01, A01.

For each position (top-left, top-right, bottom-left, bottom-right):
1. Identify the glyph ID
2. Describe the pose
3. Describe the symbol
4. State the meaning

This tests whether you can reliably distinguish between different glyph types.
```

