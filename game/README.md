# Tincture of Mercy — three.js game

This directory is the browser souls-like implementation and owns its npm toolchain and CI lane.

> The Godot/C# tree is provenance; no ports.

Read the active packet in this order:
1. `../CONTEXT.md` and `../docs/adr/0017-threejs-soulslike-adaptation.md`
2. `../design_system/v1_0_threejs_soulslike/INDEX.md`
3. `../design_system/v1_0_threejs_soulslike/DECISIONS.md` → `PRD.md` → `GATES.md` → `TUNING_V0.md`

From this directory, run `npm run verify` for the fast gate.
Install Chromium with `npx playwright install chromium --with-deps`, then run `npm run verify:full` for E2E.
