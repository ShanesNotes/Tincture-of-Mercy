# Tincture of Mercy — agent guide

A 2D top-down mercy RPG in Godot 4.6 (C# / Forward+). Hand-authored, not auto-generated. The active direction is a combat-capable opening slice where care, combat, witness, recollection, economy, notebook, and aftermath follow a shared substrate.

## Read-in order before doing engine work

1. `AGENTS.md` and `CONTEXT.md` — active agent routing and resolved glossary.
2. `docs/adr/` — accepted decisions, especially canon-routing decisions.
3. `design_system/v0_9_mercy_rpg_substrate/INDEX.md` — active packet hub.
4. `design_system/v0_9_mercy_rpg_substrate/PRD.md` and `ISSUE_SLICES.md` — active requirements and issue dependencies.
5. Assigned slice doc under `design_system/v0_9_mercy_rpg_substrate/`.
6. `design_system/v0_8_1/INDEX.md` — provenance for tone, names, visual language, and Godot/C# scaffold constraints where not contradicted by the active direction.

`concept_packet.html` is a generated review surface, not canon. Use it for human review only after active direction and ADRs.

Full layout map and document index: `README.md`.

## Available skills

- **`/godot`** (Randroids-Dojo) — develop / test / build / deploy Godot 4.x. GdUnit4 unit tests, PlayGodot E2E automation, web/desktop exports, CI/CD, Vercel / GitHub Pages / itch.io deploy. This project uses C#/.NET as the canonical engine language; treat GDScript examples as translation aids only.
- **`/godot-api`** (godogen) — narrow Godot class / C# API lookup. Bootstrap the local API docs once with `bash .claude/skills/godot-api/tools/ensure_doc_api.sh`.

## Anti-drift gate

`design_system/tools/anti_drift.py` enforces scoped P0 vocabulary and canonical naming. It must not be read as a project-wide ban on combat/RPG language. Run before commits:

```bash
python3 design_system/tools/anti_drift.py --mode all --root design_system
```

Exit 0 = clean. The P0 vocabulary restriction is scoped; active v0.9 vocabulary is described in `design_system/v0_9_mercy_rpg_substrate/07-anti-drift-vocabulary.md`.

## Notes

- Sprites are authored at native canvas size, never downscaled from concept art. Kalev / principal adults 64×96; Birdie 48×64; minor adults 48×72; bedside patients 96×48 or 128×64; environment tiles 32×32.
- The canonical Kalev concept reference is `art/characters/kalev/kalev_design_asset.png`. Older v0.2 / v0.3 iterations live in `_archive/superseded/kalev_concept_iterations/`.
- The Codex flavor of these skills lives at `.codex/skills/` and is independent of `.claude/`. Touch one, the other is unaffected.
