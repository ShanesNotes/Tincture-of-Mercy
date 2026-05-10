# AGENTS.md — Tincture of Mercy

## Project identity

Tincture of Mercy is not “care game plus combat system.” It is one event simulation whose outputs are presented as care, crafting, wilderness danger, moral consequence, and only sometimes combat.

The first milestone is the opening slice: The Cabin, the Mother, the Wolves. The goal is not to build a full RPG. The goal is to prove that one substrate can support care and combat through different presenters.

## Canon hierarchy

When source documents disagree, use this order:

1. `docs/00_SOURCE_OF_TRUTH.md` — current working canon for implementation.
2. `docs/source/latent_paths.md` — latest naming and real-tradition grounding. It renames Pastoral to Hesychasm.
3. `docs/source/opening_slice_design_v2.md` — current opening-slice canon and MVP build order.
4. `docs/source/three_registers.md` — moral architecture, with Pastoral understood as Hesychasm where superseded.
5. `docs/source/Forward Substrate - Tincture of Mercy Hybrid Primitive Set.md` — expanded substrate reference. Use it for architecture, but defer to opening_slice_design_v2 where the slice changed.

## Non-negotiable architecture rules

- Do not create separate care and combat engines.
- Implement `CombatTable.Resolve()` once; care, combat, craft, and notebook are presenters/projections.
- The event log comes before UI.
- Every resolved action emits a structured simulation event.
- Timers, GCD, work/cast/channel, swing/rite pulses, and aura ticks run from a fixed simulation clock.
- Auras/conditions are first-class. Fever, bleed, warmth, Faltering, Numbness, prayer, food, and grief should not become bespoke fields.
- Disparity/acurity gap should be one service used by roll outcomes, aggro/call radius, Witness, and recipes.
- Care-Witness must out-yield kill-Witness. Kill-Witness is capped; killing is not the economy.
- No floating damage text as default UI. Use notebook, posture, sound, animation, and debug overlays only for development.

## Opening-slice rules

- The slice is five acts.
- Day/night is atmosphere, not a first-class danger multiplier.
- The mother is visibly past apothecary from Act 1.
- Act 4 uses a scripted `Glance` with amplitude 0.4. It logs as a scripted event.
- The mother’s death is not “apothecary failed.” It is “Kalev had one register and did not yet know what else was needed.”
- The wolf fight objective is to hold threat while the boy reaches the woodline. It is not a kill-count objective.
- Kalev self-administers the remaining dose after the wolf fight. This starts the economy of mercy / Burden logic.

## Registers

Use three care registers:

- Apothecary: material care. Ingredients, recipes, timing, dosing.
- Hesychasm: cultivated stillness, watchfulness, prayer, presence from interior discipline.
- Iconographic: hosting/yielding; rare, authored scenes; must not feel like a power fantasy.

Do not present the registers as a ladder. Apothecary remains viable. Hesychasm and Iconographic expand what care can reach; they do not replace bodily medicine.

## Coding style expectations

- Prefer small, testable pure functions for core simulation.
- Keep Godot-facing nodes thin; put deterministic logic in plain C# classes where possible.
- Add unit tests for each primitive before adding presentation.
- Do not add broad content systems until the opening-slice primitives are proven.
- Keep all values small and legible for the slice.
- Make debug output explicit and removable.

## Response expectations for Codex

For each task:

1. State the intended files to change.
2. Implement the smallest working slice.
3. Add or update tests.
4. Run tests or explain exactly why they could not be run.
5. Summarize the diff and any unresolved risks.

