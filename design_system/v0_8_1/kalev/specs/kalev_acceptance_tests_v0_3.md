# Kalev Acceptance Tests v0.3

## Character readability

- KALEV-01 — At 1×, silhouette reads as long coat, burdened shoulders, practical boots.
- KALEV-02 — At 1×, Kalev does not read as a warrior, rogue, paladin, or combat class.
- KALEV-03 — At 1×, at least one of notebook or pouch is clearly readable.
- KALEV-04 — At 2×, notebook, pouch, cedar dog charm, and Ember vial are legible.
- KALEV-05 — Ember is restrained: no persistent glow outside Ember action frames.
- KALEV-06 — No weapon silhouette appears in idle or walk frames.

## Animation

- KALEV-07 — Idle has restrained breath/coat weight, not cozy bounce.
- KALEV-08 — Walk feels practical and heavy, not heroic.
- KALEV-09 — `write_name` animation makes the notebook action unmistakable.
- KALEV-10 — `administer_ember` is tempting and clinical, not flashy magic.
- KALEV-11 — Care animations exist or are scheduled before any action/combat animations.

## Godot integration

- KALEV-12 — 64×96 frames import with nearest-neighbor filtering and no smoothing.
- KALEV-13 — Character anchors correctly on 32×32 tile floors.
- KALEV-14 — Collision shape covers body/feet, not coat silhouette.
- KALEV-15 — Kalev fits through Cabin/Bethany doors after collision tuning.
- KALEV-16 — Kalev remains readable in Cabin, Ironwood Road, and Bethany palettes.

## Canon/drift

- KALEV-17 — The cedar dog remains present but not oversized.
- KALEV-18 — The notebook remains present; Kalev is a name-bearer, not a generic traveler.
- KALEV-19 — No attack/dodge/victory animation is added for P0.
- KALEV-20 — Concept sheet is not used directly as `AnimatedSprite2D` runtime art.
