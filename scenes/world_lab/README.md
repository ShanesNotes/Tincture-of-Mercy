# Ironwood world lab

Launch:

```bash
godot --path . scenes/world_lab/ironwood_world_lab.tscn
```

This is a non-main-scene playable art/world lab for the opening cabin area. It uses:

- `art/environment/tilesets/ironwood_cabin_runtime_32.png` for the curated 32px Ironwood/cabin tiles.
- `art/characters/kalev/sheets/kalev_locomotion_64x96.png` for player movement.
- PixelLab-backed runtime locomotion sheets for Lena, Iiro, and wolf where available.
- Deterministic fallback/generated sheets for Anna bedside, Birdie, Kalev action passes, and wolf full combat/call sheet.
- `audio/music/runtime/kyrie_at_the_hearth.ogg` converted from the available music source.

Validation proof for the current slice is under `screenshots/result/005/`.
