# Ironwood level sources

Graybox only. Dressing is a later register slice.

Collections: `CABIN` (hearth/bed/table/door + porch) · `YARD` (woodpile choke, 12m bowl) · `WOODLINE` (3m first-fight corridor) · `FOREST` (LOOP_A 2.7m drop ledge, LOOP_B west gate) · `ROAD` (~60m ambush, Iiro route, Wither pockets, hearth 2) · `ARENA` (18m shallow bowl, pine colonnade, snare ring, lantern hang) · `ROAD_CODA` (Birdie / Bethany bend).

Metrics: capsule r=0.35 h=1.75 · step ≤0.35 · slopes ≤45° · doorways ≥0.9m · drops <6m. Trunks oversized (EN1/SC). Blender Z-up; bake converts to game Y-up via `(x, z, -y)`.

```bash
# from game/
python3 assets/src/levels/author_ironwood.py   # rebuild .blend (optional)
npm run level:bake                             # export GLB+collision + walk-graph
```

Pins: factory-empty author, `from_pydata`, 1mm weld, stable tri order, no Blender Decimate, GLB `generator=tincture-export/0` + sorted JSON, nav 6-dec + sorted ids. `PYTHONHASHSEED=0`. Re-bake is byte-identical.
