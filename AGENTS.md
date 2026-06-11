# Tincture of Mercy — agent guide

This repo is in an early canon-routing transition. Optimize for clean future agent context: read the active direction first, treat older packets as scoped provenance, and avoid turning local scope limits into project-wide doctrine.

## Read-in order

1. `CONTEXT.md` — project glossary and resolved language conflicts.
2. `docs/adr/` — decision records that explain active canon-routing choices.
3. `design_system/v0_9_mercy_rpg_substrate/INDEX.md` — active packet hub.
4. `design_system/v0_9_mercy_rpg_substrate/PRD.md` and `ISSUE_SLICES.md` — active requirements and issue dependencies.
5. Assigned slice doc under `design_system/v0_9_mercy_rpg_substrate/`.
6. `design_system/v0_8_1/INDEX.md` — provenance for tone, names, visual language, and Godot/C# scaffold constraints where not contradicted by the active direction.
7. `docs/source/` — raw handoff/source intake when evidence or nuance is needed; do not treat this as the active contract.
8. `README.md` — layout map and broader document index.

## Active direction

The next implementation target is a combat-capable mercy RPG vertical slice. Combat is first-class in design and player-facing language, while care, combat, witness, recollection, economy, notebook, and aftermath follow the shared substrate/event-truth design.

Full substrate core mechanics are specified and built before opening-slice content. Opening acts prove the substrate after the B0 gate in `design_system/v0_9_mercy_rpg_substrate/ISSUE_SLICES.md` passes.

When Bethany or later payoff language conflicts, follow the `latent_paths` direction: recognition and presence are the payoff; corrected recipes are Apothecary-layer learning, not the salvific cause.

## Context-pollution guardrail

Do not generalize v0.8.1 care-only P0 restrictions into project-wide rules. Historical combat-exclusion language means older slice scope unless a current document explicitly restates the limit.

Prefer scoped wording over absolute wording. Use "v0.8.1 scoped combat outside its P0 care prototype" rather than "combat is off-limits." Use "shared substrate" rather than "separate care and combat engines."

## Verification

For documentation work, verify that the root read path, design-system read path, context glossary, ADRs, active packet, and canon registry agree. For engine work, preserve Godot 4.6 C# / Forward+ constraints unless a later accepted PRD changes them.
