# Kalev — Canonical Concept Reference

The canonical Kalev design reference is the **latest standalone iteration** at the project root:

```
res://art/characters/kalev/kalev_design_asset.png
```

This is the visual law for Kalev's silhouette, costume, emotional read,
material language, and accessory placement: long weathered coat, scarf/collar,
medicine pouch (right hip), notebook (left hand), cedar dog charm, restrained
Ember vial, gloves, tired face, burdened posture, non-heroic stance.

Older v0.2 / v0.3 concept iterations have been moved to
`_archive/superseded/kalev_concept_iterations/` for provenance.

## Hard rules

1. The concept image is a **reference**, not a runtime sprite.
   Do not load it into `AnimatedSprite2D`.
2. The runtime sheet must be **redrawn at native 64×96 per frame**, not
   downscaled from this concept art.
3. Final runtime path: `res://art/characters/kalev/kalev_full_sheet_64x96.png`.
   `SpriteFrames` resource: `res://art/characters/kalev/kalev_spriteframes.tres`.

See `../templates/`, `../prompts/`, and `../specs/` for the production specs.
