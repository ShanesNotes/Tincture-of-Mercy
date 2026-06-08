# Downloads environment first-draft triage — 2026-05-10

Source folder: `/home/ark/Downloads`  
Project copy: `art/environment/source/downloads_20260510_first_drafts/`  
Contact sheet: `art/environment/analysis/downloads_environment_contact_sheet.png`

## Verdict

These are **salvageable as source/master/reference material**, not as direct runtime assets.
They are high-resolution RGB atlas/mockup sheets with tens of thousands of colors and no tile metadata, so they need curated extraction, palette reduction, and Godot tile/collision setup before use.

## Best candidates

| File | Use | Salvage verdict |
|---|---|---|
| `interior-cabin.png` | Cabin interior tile/prop atlas: planks, wall panels, windows, doors, stove/hearth, bed/pallet, sacks, utensils, overlays. | **High** — best immediate source for cabin tiles/props. |
| `building-cabin-outdoor.png` | Cabin exterior, roof/wall chunks, windows/doors, wood piles, fences, roots, outdoor props. | **High** — best immediate source for exterior cabin/yard. |
| `ironwood-envrionment.png` | Road/ground tiles, snow/rock/brush, tree/trunk variants, roots, icons/props. | **High** — best immediate source for Ironwood road and forest set. |
| `first-encounter-mock.png` | Mixed encounter set plus map mock. | **Medium-high** — strong composition/style reference; extract tiles selectively. |
| `yard-combat-slice.png` | Wolf encounter yard/combat set, effects, terrain, props. | **Medium-high** — use after basic world/cabin are in place. |
| `cabin-inside.png` | Full cabin scene mockup. | **Medium** — good composition/lighting target, less useful as a tile atlas. |

## Problems to fix before runtime

- RGB/no alpha; black background and labels need removal.
- Too many colors for project runtime style; needs palette/cluster reduction.
- Mixed scales in one sheet; must be cut into coherent 32px/64px tiles and props.
- No collision/navigation metadata.
- Some tiles are painterly/noisy; use as masters, then simplify.

## Recommended extraction order

1. Cabin floor/wall/door/window/hearth/bed/table from `interior-cabin.png`.
2. Frozen ground, road, snow stones, trees/brush from `ironwood-envrionment.png`.
3. Exterior cabin walls/roof/fence/wood piles from `building-cabin-outdoor.png`.
4. Encounter overlays and wolf-yard props from `yard-combat-slice.png`.

## Runtime target

- Keep authored source sheets here as masters.
- Build curated runtime tilesets under `art/environment/tilesets/`.
- Keep the current 32px tile lab as the first runtime target, then expand to 48/64px props where needed.
