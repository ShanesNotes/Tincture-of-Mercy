# Sprite-sheet prompt — Kalev · Pass 1a · idle_down only · smallest viable test

Status: active authoring prompt · smallest-surface companion to `01a-kalev-pass1-locomotion.md`
Owner lane: art direction + production
Sheet target: `art/characters/kalev/sheets/kalev_idle_down_64x96.png`
Pass purpose: prove the workflow can produce a single Godot-droppable strip — correct format, correct dimensions, alpha channel, palette pin, single-pixel outline — before attempting any larger surface. If this does not pass, the workflow does not work; reroute to a specialist tool or human pixel artist.
Prerequisite: nothing.
Plan reference: `01-kalev-runtime-sprite-plan-v0_1.md` (this is a sub-pass for tool diagnosis)

## Why this exists

Three prior attempts at the full Pass 1 (320×768, 5×8 grid) returned illustrations rather than runtime sheets. This file slices the surface area down to its absolute minimum — 4 frames in one row, 256×96 — so the technical-container constraints have the model's full attention. If it succeeds, multiplying out to the full 8 rows is mechanical. If it fails, the prompt is not the bottleneck.

## Prompt — paste verbatim

```text
OUTPUT FORMAT — these requirements are absolute and override every artistic concern below:

1. File format: PNG (not JPEG, not WebP, not GIF)
2. Dimensions: exactly 256 pixels wide × 96 pixels tall. Not 1024×1024. Not 512×512. Not square. Not larger than 256×96 in either direction.
3. Color mode: RGBA with an explicit alpha channel.
4. Background: alpha = 0 across every pixel not occupied by the character. The background is genuinely transparent — no beige fill, no cream fill, no gray fill, no color whatsoever behind or between the character figures.
5. Total unique colors: ≤ 24 across the entire image.
6. Edges: a solid one-pixel outline in #1A1612 around every character silhouette. No anti-aliasing on the outline. No soft fade. No semi-transparent silhouette pixels.

If you cannot produce a 256×96 RGBA PNG with a genuinely transparent background and ≤ 24 unique colors, output nothing.

CONTENT
Produce a 4-frame idle animation cycle of one character viewed from the front, arranged left-to-right in a 1-row × 4-column grid. Each frame occupies a 64×96 pixel cell. The character is centered horizontally in each cell with feet at y = 84 within the cell.

CHARACTER
Kalev Ward: a tired man in his early thirties. He wears a long weathered cedar-brown wool coat reaching mid-thigh, a dark scarf around his neck, a small leather pouch on his right hip, and a leather-bound notebook held in his left hand. Practical boots. Short dark hair, short beard. Burdened, weighty posture — never a hero stance. No weapons. No glow. No magic effects.

The four frames show one slow breath cycle. Pose is identical across all four frames except for these 1-pixel shifts:
- Frame 1: chest at rest, shoulders relaxed (baseline pose)
- Frame 2: chest 1 pixel higher than frame 1 (inhale)
- Frame 3: chest at rest, identical to frame 1 (return)
- Frame 4: shoulders dipped 1 pixel below frame 1 (exhale)

PALETTE — use only these nine hex values, no others:
- #1A1612  (outline, hair, boots)
- #6B4A2C  (coat base, pouch)
- #4A3A26  (coat shadow)
- #EFE6D0  (skin highlight)
- #6B6358  (skin shadow)
- #2B2520  (skin / face line)
- #2A3329  (scarf)
- #E8DFC9  (notebook page edge)
- transparent (background, alpha = 0)

Do not introduce any color outside this list. If a color is needed that is not on the list, omit it rather than substitute.

OUTPUT
One PNG file. No watermark. No border around the canvas. No background. No metadata burned into the image. The character is the only visible content; everything else is alpha = 0.

REMEMBER, before you output anything:
1. The image is exactly 256 pixels wide.
2. The image is exactly 96 pixels tall.
3. The image is a PNG with an alpha channel (RGBA).
4. Every pixel outside the character silhouette has alpha = 0 (truly transparent, no color underneath).
5. The image contains ≤ 24 unique colors.
6. The character outline is one-pixel solid #1A1612 with no anti-aliasing.

If your output is going to be 1024 wide, 1024 tall, JPEG, RGB without alpha, or filled with a background color, abort and produce a smaller correctly-formatted image instead.
```

## Verification — run this against the output before deciding pass/fail

```python
from PIL import Image
im = Image.open('/path/to/output.png')
ok = (
    im.format == 'PNG'
    and im.size == (256, 96)
    and im.mode == 'RGBA'
)
rgba = im.convert('RGBA')
colors = rgba.getcolors(maxcolors=200_000)
unique = len(colors) if colors else 999_999
fully_t = sum(1 for y in range(96) for x in range(256) if rgba.getpixel((x, y))[3] == 0)
print(f"format={im.format} size={im.size} mode={im.mode} colors={unique} alpha0={fully_t}/{256*96}")
print("PASS" if (ok and unique <= 24 and fully_t > 0.20 * 256 * 96) else "FAIL")
```

Pass criteria, all must hold:
- `format == 'PNG'`
- `size == (256, 96)`
- `mode == 'RGBA'`
- `unique colors ≤ 24`
- `≥ 20% of pixels have alpha = 0`

## If this passes

Multiply the same approach for the remaining 7 idle/walk rows of the original Pass 1. Each row is its own 256×96 PNG; assemble into the 320×768 sheet by composition (transparent column 4 between strips, stacked vertically). The plumbing is in `01-kalev-runtime-sprite-plan-v0_1.md`.

## If this fails

The prompt is not the bottleneck. Switch tool: PixelLab, Aseprite + ML plugin, Pixaki, Retro Diffusion at native target, or hand the existing concept references to a human pixel artist with the blank canvas template at `design_system/v0_8_1/kalev/templates/kalev_full_sheet_64x96_BLANK_TRANSPARENT_TEMPLATE.png`.
