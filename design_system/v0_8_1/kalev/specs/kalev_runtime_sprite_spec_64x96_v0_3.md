# Kalev Runtime Sprite Spec v0.3 — 64×96 Premium Large-Pixel

## Runtime path

```text
res://art/characters/kalev/kalev_full_sheet_64x96.png
res://art/characters/kalev/kalev_spriteframes.tres
```

## Canvas

```text
Native frame size: 64×96
Transparent background: yes
Tile grid underfoot: 32×32
Logical viewport: 960×540
Default presentation: nearest-neighbor, no smoothing
```

## Grounding and origin

The sprite is taller than one tile. Use consistent foot anchoring:

```text
Frame canvas: 64×96
Visual foot contact: y = 88–94 depending on pose
Scene origin: bottom-center foot anchor
Collision capsule: roughly 22×28, centered near feet/body mass
Interaction ray: emits from chest or hand anchor depending on action
```

Suggested Godot offsets:

```text
AnimatedSprite2D centered at CharacterBody2D origin with sprite offset y ≈ -48
CollisionShape2D centered around lower body, not full coat height
Camera framing tests at 1× and 2× zoom
```

## Sheet layout

Recommended first production sheet:

| Row | Animation | Frames | Notes |
|---:|---|---:|---|
| 0 | idle_down | 4 | subtle breath, coat still, no bounce |
| 1 | idle_left | 4 | pouch side readable where applicable |
| 2 | idle_up | 4 | back strap and coat weight |
| 3 | idle_right | 4 | may mirror left only if dog/vial asymmetry is handled |
| 4 | walk_down | 4 | heavy practical walk |
| 5 | walk_left | 4 | coat hem and pouch motion restrained |
| 6 | walk_up | 4 | back strap, boots, no heroic stride |
| 7 | walk_right | 4 | same as left, asymmetry checked |
| 8 | write_name | 3 | notebook opens / pencil hand / graphite pause |
| 9 | administer_ember | 5 | vial drawn / held / restrained red glint / recoil |
| 10 | sit | 2 | presence action; low movement |
| 11 | wash | 4 | cloth/basin dignity action |
| 12 | warm | 3 | blanket/compress gesture |
| 13 | kneel | 3 | bedside care / name record |

## P0 priority

1. Four-direction idle.
2. Four-direction walk.
3. `write_name`.
4. `administer_ember`.
5. One general `care_kneel` animation if budget allows.

## Readability acceptance

At 1×:

- Long coat readable.
- Notebook or pouch readable.
- Burdened shoulder shape readable.
- No weapon silhouette.

At 2×:

- Cedar dog charm readable.
- Ember vial readable but restrained.
- Face reads tired/attentive.
- Gloves/boots/material separation readable.

## Prohibition

Do not downscale the concept sheet into this sheet. Redraw at 64×96 using the concept as a model sheet.
