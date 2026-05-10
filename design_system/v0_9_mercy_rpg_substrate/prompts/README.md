# Sprite-sheet authoring prompts · v0.9

Status: active authoring prompt set
Owner lane: art direction + production + Godot integration
Authority level: active for v0.9 sprite-sheet production. Each prompt is self-contained and may be sent to a human pixel artist or a design model without re-explaining project context.

## Files

| File | Purpose | Priority |
|---|---|---|
| `00-master-template.md` | Fillable template for any future character | reference |
| `01-kalev-runtime-sprite-plan-v0_1.md` | **The Kalev anchor-asset production plan.** Pass-sliced strategy, file layout, Godot import notes, validation script, "actually usable?" checklist. **Start here for Kalev.** | **P0** |
| `01a-kalev-pass1-locomotion.md` | Pass 1 prompt — idle ×4dir + walk ×4dir. Locks scale, palette, baseline, Godot slicing. | **P0** |
| `01b-kalev-pass2-care.md` | Pass 2 prompt — write_name, wash, warm, sit, kneel. Mercy-game identity. | P1 (after Pass 1) |
| `01c-kalev-pass3-tincture-danger.md` | Pass 3 prompt — administer_ember, self_administer, recoil_neutral. Tincture & FSR/Vigil. | P2 (after Pass 2) |
| `01d-kalev-pass4-combat.md` | Pass 4 prompt — hurt, dodge_brace, push_guard, downed. v0.9 combat compatibility. | P3 (after Pass 3) |
| `01z-kalev-full-sheet-v0_3-reference.md` | Superseded reference — the v0.3 single-14-row prompt before pass-slicing. Kept for provenance. | reference only |
| `02-lena-64x96.md` | Lena Hart full sheet, 64×96. Post-opening companion. | P3 |
| `03-mother-bedside-96x48.md` | Mother bedside sheet, 96×48. Required for Act 4 graybox. | **P0** |
| `04-boy-48x64.md` | Boy / child full sheet, 48×64. Required for Acts 2, 4, 5. | **P0** |
| `05-wolf-96x64.md` | Wolf combat sheet, 96×64. Required for Act 5. | **P0** |
| `06-name-an-artifact.md` | **Name-an-artifact prompt template.** Use when introducing any new file, resource, scene, class, animation, signal, or game data ID under `res://`. | reference |

## Suggested authoring order

The Kalev anchor-asset reasoning: get the pipeline right on Kalev first; every other character then inherits a working palette, baseline, and Godot import pattern.

1. **Kalev Pass 1** — locomotion. Locks the project's pixel-art benchmark.
2. **Kalev Pass 2** — care. Proves the mercy-game identity.
3. **Kalev Pass 3** — tincture / danger. Bridges Acts 3–5 emotionally.
4. **Kalev Pass 4** — combat compatibility. Closes the v0.9 combat-capable expansion.
5. **Mother bedside** — smallest sheet, contained scope; unlocks Act 4 graybox.
6. **Boy** — drops into Acts 2, 4, 5 once Kalev and Mother exist.
7. **Wolf** — Act 5 hostile encounter sheet; first non-human combat actor; new 96×64 canvas.
8. **Lena** — post-opening; can run in parallel with engine work on Bethany payoff scenes.

## What the prompts enforce

- **Native canvas authoring** — no concept-art downscales. The 1122×1402 design assets in `art/characters/*/` are silhouette references only.
- **Color budget** — ≤ 24 colors per frame, ≤ 36–48 colors per sheet.
- **Single-pixel ink outlines** — no anti-aliased silhouettes; clean nearest-neighbor scaling in Godot.
- **Palette pinned to `colors_and_type.css` tokens** — every hex value cited.
- **Baseline anchoring** — feet at y = 84 (or canvas-specific equivalent) for Godot collision consistency.
- **Cross-pass discipline** — once Kalev's coat color is set in Pass 1, it must be pixel-identical in every later pass.
- **Acceptance criteria** — each prompt ends with self-checkable rules (dimensions, color count, silhouette laws, anchor points).

## Verification helper

After a sprite sheet is produced, the following Python check confirms basic acceptance criteria mechanically:

```python
from PIL import Image
from pathlib import Path

EXPECTED = {
    # Kalev passes
    'art/characters/kalev/sheets/kalev_locomotion_64x96.png': (320, 768, 48),
    'art/characters/kalev/sheets/kalev_care_64x96.png':       (320, 480, 48),
    'art/characters/kalev/sheets/kalev_tincture_64x96.png':   (320, 288, 48),
    'art/characters/kalev/sheets/kalev_combat_64x96.png':     (320, 384, 48),
    # Other characters
    'art/characters/lena/lena_full_sheet_64x96.png':          (320, 864, 48),
    'art/characters/patients/mother_bed_96x48.png':           (480, 144, 36),
    'art/characters/boy/boy_full_sheet_48x64.png':            (240, 576, 36),
    'art/characters/wolves/wolf_full_sheet_96x64.png':        (480, 512, 32),
}

for rel_path, (w, h, max_colors) in EXPECTED.items():
    p = Path(rel_path)
    if not p.exists():
        print(f'{rel_path}: MISSING')
        continue
    with Image.open(p) as im:
        if im.size != (w, h):
            print(f'{rel_path}: WRONG SIZE {im.size} expected {(w, h)}')
            continue
        if im.mode != 'RGBA':
            print(f'{rel_path}: WRONG MODE {im.mode} expected RGBA')
            continue
        colors = im.getcolors(maxcolors=10_000)
        unique = len(colors) if colors else 'too many'
        ok = isinstance(unique, int) and unique <= max_colors
        flag = 'OK' if ok else f'FAIL ({unique} > {max_colors})'
        print(f'{rel_path}: {im.size} {im.mode} {unique} colors — {flag}')
```

This validates dimensions, mode, and color budget. It does NOT validate silhouette laws, anchor points, animation arcs, or cross-pass color identity — those are human review.

## Tool guidance

General-purpose image models (Midjourney, DALL·E, SDXL base) consistently produce *pixel-art-styled illustrations* at high resolution and fail the color-count and outline criteria. Prefer:

1. A multimodal LLM with a Pillow / image-generation tool, instructed to author at native size with a palette-clamp pass.
2. Aseprite + a pixel-art-tuned ML plugin.
3. Specialist pixel-art models (PixelLab, Pixaki, Retro Diffusion at small native target).
4. A human pixel artist working from these prompts and the existing `design_system/v0_8_1/kalev/templates/` blank canvas.

Whichever path you take: each output must pass the verification helper above before it ships into `SpriteFrames`.

## Naming new artifacts

When a sprite sheet, resource, scene, class, animation, or game data ID is introduced for the first time, run it through `06-name-an-artifact.md` against the canon in `design_system/v0_9_mercy_rpg_substrate/09-naming-conventions.md`. This avoids drift, keeps Godot imports predictable, and makes future-agent search reliable.
