# Lore — consolidated surface hub

Status: active lore consolidation (long-horizon)
Owner lane: narrative archaeology + future iteration planning
Authority: **lore and narrative arc** for human review; does not override `CONTEXT.md`, `docs/adr/`, or active v0.9 implementation contracts for engine work

## Start here

| Read first | Purpose |
|---|---|
| [`CONSOLIDATED_LORE_SURFACE.md`](CONSOLIDATED_LORE_SURFACE.md) | **Single lore entry point** — story thesis, full arc, cast, themes, symbols, iteration ledger, open questions |
| [`CAST_BIBLE.md`](CAST_BIBLE.md) | Cast roster with aliases, Father Ilarion, long-arc figures |
| [`ARCHIVE_RECOVERY_REPORT.md`](ARCHIVE_RECOVERY_REPORT.md) | Phase 5 — `_archive/superseded/` narrative deltas |
| [`../story/MEMOIR_TRANSMUTATION_BOUNDARIES.md`](../story/MEMOIR_TRANSMUTATION_BOUNDARIES.md) | Phase 7 — per-scene memoir vs mythic boundaries |
| [`../story/NARRATIVE_STORYBOARD_DECK_V0_2_LONG_ARC.md`](../story/NARRATIVE_STORYBOARD_DECK_V0_2_LONG_ARC.md) | Phase 4 — Bethany through Paradise scene cards |
| [`CONSOLIDATED_LORE_SURFACE.md` § Mechanics vs lore](CONSOLIDATED_LORE_SURFACE.md#mechanics-vs-lore-boundary) | What is simulation/engine vs what is story meaning |
| [`CONSOLIDATED_LORE_SURFACE.md` § Assets vs lore](CONSOLIDATED_LORE_SURFACE.md#assets-vs-lore-boundary) | Which art/audio embodies which beats |
| [`CONSOLIDATED_LORE_SURFACE.md` § Source index](CONSOLIDATED_LORE_SURFACE.md#complete-source-index) | Every lore-bearing file mapped |

## Deep ore (read for nuance, not as implementation contract)

| Document | Era | Best for |
|---|---|---|
| [`tincture_of_mercy_v0_3.md`](tincture_of_mercy_v0_3.md) | Deep lore foundation | Four-phase pilgrimage, symbolism, cast bible, drafted prose |
| [`tincture_of_mercy_packet_v0_6.md`](tincture_of_mercy_packet_v0_6.md) | v0.6 prototype packet | Tincture Wheel, triage rituals, Michigan icon-manuscript thesis |
| [`tincture_of_mercy_godot_design_handoff_v0_7.md`](tincture_of_mercy_godot_design_handoff_v0_7.md) | v0.7 production handoff | Eli Keene, prototype scenes, notebook entries, dialogue style |

## Related surfaces (not duplicate authority)

| Surface | Role |
|---|---|
| [`../story/SOURCE_ORE_MAP.md`](../story/SOURCE_ORE_MAP.md) | Storyboard/AI production ore map |
| [`../story/STORYBOARD_BIBLE.md`](../story/STORYBOARD_BIBLE.md) | Narrative pivot + ethical guardrails for visualization |
| [`../story/NARRATIVE_STORYBOARD_DECK_V0_1.md`](../story/NARRATIVE_STORYBOARD_DECK_V0_1.md) | Ten-scene production deck with image/VO prompts |
| [`../../CONTEXT.md`](../../CONTEXT.md) | Active glossary and resolved language conflicts |
| [`../../design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md`](../../design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md) | Active opening five-act build contract |
| [`../../design_system/v0_8_1/scene_composition_bible_v0_8_1.md`](../../design_system/v0_8_1/scene_composition_bible_v0_8_1.md) | Composition grammar (camera, light, disclosure) |

## Authority order

1. **`CONTEXT.md`** — resolved vocabulary (Bethany payoff, Hesychasm, bread beat, gravity encounter, etc.)
2. **`docs/adr/`** — accepted narrative routing decisions
3. **`design_system/v0_9_mercy_rpg_substrate/`** — active opening slice and substrate direction
4. **`docs/lore/CONSOLIDATED_LORE_SURFACE.md`** — distilled arc and iteration history (this pass)
5. **`docs/lore/tincture_of_mercy_v0_3.md`** — richest symbolic and long-arc ore
6. **`docs/lore/` v0.6 / v0.7** — prototype-era locks and scene specificity
7. **`docs/source/`** — raw handoff evidence; cite, do not implement blindly
8. **`docs/story/`** — production/storyboard support artifacts
9. **`design_system/v0_8_1/`** — tone, visual regimes, P0 prototype grammar (provenance)

## Consolidation status

| Phase | Status | Notes |
|---|---|---|
| **Phase 1 — Full repo audit** | Complete (2026-06-11) | Five parallel passes: deep lore, source intake, design system, ADRs/story/runtime, archive/art |
| **Phase 2 — Consolidated surface** | Complete (2026-06-11) | `CONSOLIDATED_LORE_SURFACE.md` |
| **Phase 3 — Runtime sync** | Complete (2026-06-11) | `NARRATIVE_STORYBOARD_DECK_V0_1.md` v0.2; cards 05/06 swapped; replay order table |
| **Phase 4 — Long-arc scene cards** | Complete (2026-06-11) | `NARRATIVE_STORYBOARD_DECK_V0_2_LONG_ARC.md` cards 11–22 |
| **Phase 5 — Archive recovery** | Complete (2026-06-11) | `ARCHIVE_RECOVERY_REPORT.md`; local `_archive/` read |
| **Phase 6 — Cast bible** | Complete (2026-06-11) | `CAST_BIBLE.md` incl. Father Ilarion + long-arc |
| **Phase 7 — Memoir boundaries** | Complete (2026-06-11) | `MEMOIR_TRANSMUTATION_BOUNDARIES.md` per-scene table |

## Long-horizon maintenance

When adding lore anywhere in the repo:

1. Check whether the claim already exists in `CONSOLIDATED_LORE_SURFACE.md` § Iteration ledger.
2. If it **changes** the arc, add a row to the ledger with source path and ADR if applicable.
3. If it is **engine-only**, keep it out of lore sections — update § Mechanics boundary instead.
4. Run `python3 design_system/tools/anti_drift.py --mode all --root design_system` before doc commits that touch active packet vocabulary.