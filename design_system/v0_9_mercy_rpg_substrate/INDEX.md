# v0.9 Mercy RPG Substrate — Active Packet

Status: active implementation-direction packet
Owner lane: design + engineering documentation
Authority level: active for v0.9 PRD, issue slicing, and substrate-first implementation planning
Dependencies: `CONTEXT.md`, `docs/adr/`, source intake under `docs/source/2026-05-09-tincture-codex-handoff/`
Validation gate: read this file, then `PRD.md`, `ACCEPTANCE.md`, and `ISSUE_SLICES.md`; run `python3 design_system/tools/anti_drift.py --mode all --root design_system`

This packet is the active routing hub for the combat-capable mercy RPG direction. It keeps the useful v0.8.1 care discipline as scoped provenance while giving future agents a clean, substrate-first execution surface.

## Source hierarchy

Use this order when a document conflicts:

1. `CONTEXT.md` — active glossary and resolved language conflicts.
2. `docs/adr/` — accepted decisions and decision rationale.
3. `design_system/v0_9_mercy_rpg_substrate/` — this active packet.
4. `design_system/v0_8_1/` — provenance for tone, visual language, names, Godot/C# scaffold constraints, and scoped P0 limits where not superseded.
5. `docs/source/2026-05-09-tincture-codex-handoff/` — raw source evidence and nuance, not direct implementation authority.
6. Older lore, archive, and generated review pages — texture and provenance only.

## Packet map

| Doc | Purpose | Status |
|---|---|---|
| `PRD.md` | Product and engineering requirements for v0.9 substrate-first mercy RPG work. | Active |
| `ACCEPTANCE.md` | Cross-slice acceptance matrix and verification gates. | Active |
| `ISSUE_SLICES.md` | Issue-ready backlog with dependencies and validation. | Active |
| `01-active-packet.md` | Routing contract, doc ownership, and context hygiene rules. | Active |
| `02-substrate-primitives.md` | Core substrate primitive catalog and build order. | Active |
| `03-opening-act-bible.md` | Five-act opening slice bible: water, bread, tincture, Witness, wolves. | Active |
| `04-latent-paths-receptivity.md` | Apothecary, Hesychasm, Iconographic paths and receptivity mechanics. | Active |
| `05-rpg-economy-progression.md` | Risk/reward, loot, progression, itemization, and tuning levers. | Active |
| `06-canon-surface-registry.md` | Authority labels for major doc surfaces and migration notes. | Active |
| `07-anti-drift-vocabulary.md` | Scoped vocabulary and drift-gate policy for v0.9 RPG language. | Active |
| `08-epic-b-substrate-pipeline-plan.md` | Pipeline-shaped Epic B execution graph for B-prep through B0, including B1/B2 anti-fracture seams. | Active implementation handoff |
| `09-naming-conventions.md` | Godot artifact naming canon: filesystem layout, code identifiers, animation keys, verb/item/encounter IDs, blocked legacy patterns, validation. | Active |
| `10-asset-pipeline.md` | Source → runtime sprite asset pipeline: source/sheets/aseprite folder split, `tools/sprites/` deterministic conversion, Aseprite vs LibreSprite, project-spec amendment. | Active |
| `prompts/` | Sprite-sheet authoring prompts (master template + Kalev pass-sliced production plan + Lena/Mother/Boy/Wolf full sheets) and the `prompts/06-name-an-artifact.md` template for naming new Godot artifacts. | Active |
| `tools/sprites/` (project root) | Asset-pipeline scripts: `make_runtime_sprite.py`, `validate_sprite.py`, `palette.py`, `palettes/*.gpl`. Required gate before any runtime sheet enters Godot. | Active |
| `B0_SUBSTRATE_ACCEPTANCE_REPORT.md` | B0 substrate gate acceptance evidence. | Active-support |
| `ARCHITECTURE_DEEPENING_PRELUDE_REPORT.md` | Prelude architecture deepening report. | Active-support |
| `EPIC_C_OPENING_ACT_REPORT.md` | Epic C opening-act progress report. | Active-support |
| `EPIC_C_C6_GRAYBOX_REPORT.md` | Epic C graybox (C6) progress report. | Active-support |

## Product direction

The first playable target is a **combat-capable mercy RPG vertical slice**. It proves water, bread, tincture, witness, wolves, flight, combat, loot/material consequence, progression hooks, and aftermath through one shared simulation substrate.

Combat is first-class in product and design language. It has encounter data, feel targets, acceptance criteria, loot/material consequences, and implementation issues. The substrate design choice is that care, combat, crafting, witness, recollection, economy, notebook, and aftermath all resolve through a shared event truth rather than separate resolver paths.

Normal RPG mechanics are allowed at the architecture level when coherent with the world: Soulslike gravity/friction encounters, WoW-shaped timers/threat/resources, and Diablo-shaped item quality/loot tables can all be used where an active PRD or issue slice scopes them.

## Milestone order

1. **M0 — Active docs and canon routing.** This packet, ADRs, issue slices, acceptance, and anti-drift vocabulary are aligned.
2. **M1 — Substrate core mechanics.** Implement headless/core mechanics before opening act content. Use `08-epic-b-substrate-pipeline-plan.md` as the execution graph: B-prep establishes the plain C# substrate/test boundary, then B1/B2 lock deterministic event truth, seeded RNG, append semantics, typed receptivity, modifier assembly, and one resolver family before later slices add actors, costs, timers, encounters, loot, progression, and notebook truth surfaces.
3. **M2 — Data and presenters.** Add content data, domain presenters, debug surfaces, and UX mappings over the substrate.
4. **M3 — Opening act graybox.** Build water, bread, tincture, mother death/Witness, and wolves/boy flight/combat after M1 acceptance passes.
5. **M4 — Vertical-slice verification.** Prove event truth, encounter cost, loot/material consequence, path/receptivity effects, notebook records, and regression gates.

## Opening slice spine

1. **Water** — Apothecary begins through bodily care, limited time, and visible state.
2. **Bread** — ordinary mercy under constraint: food, timing, receptivity, and consequence without turning care into a cooking minigame.
3. **Tincture** — the shared outcome resolver becomes visible through a craft/treat beat.
4. **Mother death / Witness** — a fixed-outcome gravity encounter: the player performs meaningful actions, learns the substrate, witnesses death, and carries consequences.
5. **Wolves / boy flight / combat** — real combat and flight. Kalev protects the child through threat, violence, risk, cost, and possible wolf loot. The encounter objective is the boy reaching safety.

## Latent paths tie-breakers

- Use **Apothecary**, **Hesychasm**, and **Iconographic** as active path names.
- Use **paths**, not skills, for this growth architecture.
- **Hesychasm** is the active name. **Pastoral** is a historical/source alias when older materials are discussed.
- Voice registers are copy modes: folk, sanctioned, and sacred. They are distinct from latent paths.
- Bethany payoff follows recognition/presence. A corrected recipe can exist as Apothecary learning, but it is not the salvific cause.
- Where older source docs use porridge, active v0.9 act docs use **bread**.

## Context-pollution guardrail

Do not turn scoped v0.8.1 P0 limits into project-wide doctrine. Older care-only language remains useful provenance for tone and bedside discipline; it does not define the v0.9 combat-capable slice unless a current ADR or active packet doc restates that scope.

Prefer bounded wording:

- "v0.8.1 scoped combat outside its P0 care prototype."
- "v0.9 makes combat first-class while keeping one substrate event truth."
- "This issue does not build a feature yet" rather than "the project excludes the feature."

## Required validation

```bash
python3 design_system/tools/anti_drift.py --mode all --root design_system
```

For final packet verification, also run the required-doc existence check and context-aware stale-claim scan in `ISSUE_SLICES.md`.
