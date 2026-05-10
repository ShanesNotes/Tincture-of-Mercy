# Kalev Ward Design Asset Intake v0.3 — High-Fidelity Runtime Upgrade

This pack updates the Kalev intake after the character-scale decision: Kalev is no longer targeted at the earlier 32×48 economy placeholder scale. The production runtime target is now **premium large-pixel 64×96** for Kalev, while the environment remains on the 32×32 tile grid.

## What changed from v0.2

- `32×48` Kalev placeholder is deprecated for final production.
- Kalev runtime target is now `64×96` per frame.
- The concept sheet is preserved as the visual foundation, not as a runtime sprite.
- No final runtime sheet is included here; the final sprite must be redrawn at native 64×96 rather than downscaled from the concept art.
- Godot import and scene guidance now assumes a larger character canvas and closer, more intimate care-scene framing.

## Canonical concept asset

Use:

```text
design_assets/characters/kalev/kalev_concept_foundation_v0_3.png
```

This is the canonical visual reference for Kalev’s silhouette, costume, emotional read, material language, and accessory placement.

Reference crops are included for convenience:

```text
design_assets/characters/kalev/kalev_hero_pose_crop_reference_v0_3.png
design_assets/characters/kalev/kalev_turnaround_crop_reference_v0_3.png
design_assets/characters/kalev/kalev_concept_palette_reference_v0_3.png
```

These are **design references**, not runtime assets.

## Runtime target

Final Godot sprite sheet target:

```text
Path: res://art/characters/kalev/kalev_full_sheet_64x96.png
Frame size: 64×96
Background: transparent PNG
Texture filtering: nearest-neighbor
Environment grid: 32×32 tiles remain unchanged
Scene node: CharacterBody2D + AnimatedSprite2D
```

Priority animations:

```text
P0.1 idle_down / idle_left / idle_up / idle_right — 4 frames each
P0.2 walk_down / walk_left / walk_up / walk_right — 4 frames each
P0.3 write_name — 3 frames
P0.4 administer_ember — 5 frames
P0.5 sit / wash / warm / kneel — as budget allows
```

## Hard rule

Do not use the concept sheet directly in `AnimatedSprite2D`. It has a background, uneven pose scale, and presentation layout. It should guide a proper 64×96 redraw.

## Why this matters

Kalev has to carry identity in the gameplay sprite: long coat, burdened shoulders, medicine pouch, notebook, cedar dog charm, Ember vial, gloves, tired face, and non-heroic posture. The old tiny placeholder cannot carry that load.
