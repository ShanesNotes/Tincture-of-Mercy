# Architecture Deepening Prelude Report

Status: implemented as a post-B0, pre-Epic-C substrate gate.

Authority:
- `docs/adr/0016-post-b0-architecture-prelude-gate.md`
- `.omx/plans/architecture-deepening-prelude-before-epic-c-consensus-plan.md`
- `design_system/v0_9_mercy_rpg_substrate/B0_SUBSTRATE_ACCEPTANCE_REPORT.md`

## Gate findings required before Epic C

1. Structural guard harness — `Tincture.Tests/Support/StructureGuard.cs` centralizes repo-root, ignored-build-directory, source enumeration, and pattern-scan helpers for new structural guards.
2. Runtime / tick coordinator — `Tincture.Substrate/Runtime/OpeningActRuntime.cs` coordinates only `VerbInvocation.Invoke`, `EncounterAiSystem.EvaluateAndAppend`, and `LootSystem.EvaluateAndAppend`.
3. Act Data Catalog — `Tincture.Substrate/Data/ActCatalog.cs` exposes immutable architecture-test act definitions through `GetAct`, `GetBeat`, and `AllActs`.
4. Item Ledger / inventory projection — `Tincture.Substrate/Economy/ItemLedger.cs` derives inventory from event truth and preserves source provenance.

## Scoped findings recorded without overbuilding

- Event vocabulary is `Tincture.Substrate/Events/SimEventVocabulary.cs`, a registry over producer-owned constants. Event identity remains beside emitters.
- `Tincture.Substrate/ReadModels/*` contains the cross-module `OpeningActSnapshot` aggregate only. Module-local snapshots remain local.
- Recognition and notebook projection remain B6 event-derived surfaces. No broad rewrite was needed for this prelude.

## Non-goals preserved

- No Epic C authored content.
- No Godot scenes or UI.
- No final opening maps or dialogue.
- No production encounter content.
- No change to B0 blocker semantics or `ISSUE_SLICES.md` blocker meaning.
