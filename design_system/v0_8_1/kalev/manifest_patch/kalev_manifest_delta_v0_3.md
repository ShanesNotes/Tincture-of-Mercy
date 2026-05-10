# Manifest Delta — Kalev Intake v0.3

Apply this delta to the high-fidelity asset manifest.

## Replace Kalev runtime target

```text
res://art/characters/kalev/kalev_full_sheet_64x96.png
```

Frame size: `64×96`.

## Design reference path

```text
design_assets/characters/kalev/kalev_concept_foundation_v0_3.png
```

This path should be `.gdignore` if it lives inside the Godot repository.

## Deprecate

```text
kalev_front_idle_placeholder_32x48.png
kalev_4dir_idle_placeholder_128x48.png
```

These may remain only as old movement-test placeholders. They must not be cited as final quality targets.

## P0 animation priority

```text
idle_4dir
walk_4dir
write_name
administer_ember
interact_reach
```

## P0 acceptance addition

A build cannot call Kalev art-ready until `KALEV-01` through `KALEV-20` pass.
