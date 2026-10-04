# v1.0 — three.js souls-like adaptation (ACTIVE packet)

The active direction as of 2026-08-13: Tincture of Mercy resurrected as a browser souls-like in three.js (Elden Ring bar, illuminated fairy-tale register, lore intact). Ordered by Shane; hard decisions ruled by four-model council (ADR 0017). Supersedes `v0_9_mercy_rpg_substrate/` as the active build packet; v0.9 and the Godot/C# tree remain provenance (STORY_RESCUE_PLAN's "any future game is adaptation" — this is that adaptation).

Read order for any v1.0 worker:
1. `../../GLOSSARY.md` + `../../docs/adr/` (0017 first) — repo authority chain.
2. `DECISIONS.md` — the nine council rulings (repo/toolchain, camera+renderer law L1–L12, sim architecture, animation pipeline, combat parameterization, naming, slice scope, physics, gauntlet).
3. `PRD.md` — goal, success criteria, R1–R14, milestones.
4. `GATES.md` — latency/feel/art/perf gates + adversarial audit protocol.
5. `TUNING_V0.md` — v0 frame data (hot-reloadable data in `game/data/`; feel gate owns final numbers).
6. `ENCOUNTERS.md` — Ironwood beat sheet, pack grammar, the Warden.
7. `ART_BIBLE.md` + `PATTERN_ATLAS_PLAN.md` — binding visual law (164 citable rules) + Ironwood atlas cells.
8. `TEXT_BIBLE.md` + `text_bible_v0.json` — the four text laws + 212 shipping strings ×3 registers with the Numbness ladder.
9. Lore bible (canon, unchanged): `../../docs/lore/CONSOLIDATED_LORE_SURFACE.md`, `CAST_BIBLE.md`, `STORY_RESCUE_PLAN.md`.
10. Art canon (style law source): `/home/ark/symbolic-world/DESIGN.md` + grammar HTMLs; exemplar plates `/home/ark/gizmo-design-system/art reference/` — study-only, "emulate the hand, never copy the page."

Code lives in `game/` (own package.json + CI lane; `npm --prefix game run verify`). No Godot/C# ports. `design_system/tools/anti_drift.py` does not govern `game/`.
