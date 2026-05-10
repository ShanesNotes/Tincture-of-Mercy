# Kalev Godot Import + Scene Spec v0.3

## Runtime import settings

For `kalev_full_sheet_64x96.png`:

```text
Import type: Texture2D / CompressedTexture2D
Compression: Lossless
Mipmaps: Off
Texture filter: Nearest
Texture repeat: Disabled
Premultiplied alpha: Off unless testing proves need
```

Project setting or node setting:

```text
CanvasItem texture_filter = Nearest
```

## Character scene

```text
res://scenes/characters/kalev.tscn
```

Recommended node tree:

```text
Kalev : CharacterBody2D
  AnimatedSprite2D
  CollisionShape2D
  Node2D/FacingAnchor
  RayCast2D/InteractRay
  Marker2D/PouchAnchor
  Marker2D/NotebookAnchor
  Marker2D/EmberAnchor
  AudioStreamPlayer2D/FootstepPlayer
```

## 64×96 anchoring

Because Kalev is larger than the tile grid:

- collision belongs to his body/feet, not coat silhouette;
- interact ray should start from chest/hand height, not floor origin;
- occlusion tests are required around doors, beds, and prep tables;
- camera must be tested in Cabin and Bethany interiors for intimacy without crowding.

## Placeholder rule

Use flat 64×96 blocks if needed for movement tests, but do not reintroduce the old 32×48 placeholder as production target.

## Runtime asset distinction

```text
design_assets/characters/kalev/kalev_concept_foundation_v0_3.png  # model sheet, .gdignore
res://art/characters/kalev/kalev_full_sheet_64x96.png              # production runtime sheet
```
