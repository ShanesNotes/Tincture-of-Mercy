# Slice 6 — Canon Surface Registry and Migration Notes

Status: active slice spec
Owner lane: documentation architecture + agent routing
Authority level: active registry for doc authority labels and read-path migration
Dependencies: `INDEX.md`, `PRD.md`, `CONTEXT.md`, `docs/adr/`, root/design readme files
Maximum intended scope: authority labels and migration notes for major docs; not a complete file inventory
Source references: current repo docs, accepted ADRs, approved RALPLAN
Validation gate: future agents can identify which document wins without reading raw source intake first

## Authority labels

| Label | Meaning |
|---|---|
| `active` | Current execution authority for v0.9 work. |
| `active-support` | Supports active work, but is not the primary execution contract. |
| `provenance` | Historical or scoped material that remains useful for tone, constraints, or rationale. |
| `source` | Raw intake/evidence. Cite and distill before implementation. |
| `generated-review` | Human review/display generated from other material; not independent authority. |
| `archive` | Superseded history. Use for provenance only. |
| `stale-needs-update` | Known route or claim that must be updated before agents rely on it. |

## Active canon surfaces

| Surface | Label | Winning use | Notes |
|---|---|---|---|
| `CONTEXT.md` | active | Glossary and resolved language conflicts. | First local language surface for agents. |
| `docs/adr/` | active | Accepted decisions and rationale. | ADRs supersede conflicting older docs. |
| `design_system/v0_9_mercy_rpg_substrate/INDEX.md` | active | Active packet hub and source hierarchy. | Read before older packets. |
| `design_system/v0_9_mercy_rpg_substrate/PRD.md` | active | Product/engineering contract for v0.9 substrate-first work. | Defines milestones and functional requirements. |
| `design_system/v0_9_mercy_rpg_substrate/ACCEPTANCE.md` | active | Acceptance matrix and validation commands. | Final documentation gate. |
| `design_system/v0_9_mercy_rpg_substrate/ISSUE_SLICES.md` | active | Issue-ready backlog and dependencies. | Epic C implementation stays blocked by B0 until substrate core passes. |
| `design_system/v0_9_mercy_rpg_substrate/01-active-packet.md` | active | Routing, context hygiene, and packet ownership. | Keeps future agents out of raw-source reconciliation loops. |
| `design_system/v0_9_mercy_rpg_substrate/02-substrate-primitives.md` | active | Substrate primitive catalog and build order. | Engine foundation before opening content. |
| `design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md` | active | Five-act opening slice bible. | Water, bread, tincture, mother death/Witness, wolves. |
| `design_system/v0_9_mercy_rpg_substrate/04-latent-paths-receptivity.md` | active | Paths and receptivity mechanics. | Apothecary, Hesychasm, Iconographic. |
| `design_system/v0_9_mercy_rpg_substrate/05-rpg-economy-progression.md` | active | RPG economy/progression architecture. | Normal risk/reward, loot/material, progression hooks. |
| `design_system/v0_9_mercy_rpg_substrate/06-canon-surface-registry.md` | active | This registry. | Authority labels and migration notes. |
| `design_system/v0_9_mercy_rpg_substrate/07-anti-drift-vocabulary.md` | active | Scoped vocabulary/drift policy. | Created in Slice 7. |

## Active-support surfaces

| Surface | Label | Use | Notes |
|---|---|---|---|
| `AGENTS.md` | active-support | Agent read path and behavior. | Should route to `CONTEXT.md`, ADRs, then v0.9 active packet. |
| `README.md` | active-support | Repo map and canon spine. | Not a substitute for PRD/issue slices. |
| `CLAUDE.md` | active-support | Claude-compatible agent guide. | Mirrors active routing. |
| `design_system/README.md` | active-support | Design-system map and content rules. | Routes design work to v0.9 active packet first. |
| `design_system/SKILL.md` | active-support | Portable design-system skill manifest. | Must not identify v0.8.1 as the active hub. |
| `design_system/tools/anti_drift.py` | active-support | Drift gate. | Scoped P0 vocabulary plus sanctioned active v0.9 terminology. |
| `design_system/tools/anti_drift_allowlist.json` | active-support | Documented exceptions. | Update only when validation requires it. |
| `.omx/plans/deepen-7-mercy-rpg-slices-consensus-plan.md` | active-support | Planning provenance for this packet. | Use as rationale; active docs win for execution. |
| `.omx/ultragoal/goals.json` and ledger | active-support | Durable workflow audit. | Not design canon. |

## Provenance and source surfaces

| Surface | Label | Use | Notes |
|---|---|---|---|
| `design_system/v0_8_1/` | provenance | Tone, names, visual language, Godot/C# scaffold constraints, scoped P0 care surfaces. | Conflicting combat/economy limits are older slice scope. |
| `design_system/v0_9_combat_rpg_layer/INDEX.md` | provenance | Earlier combat/RPG packet stub and research direction. | Superseded by v0.9 mercy RPG substrate packet. |
| `docs/source/2026-05-09-tincture-codex-handoff/` | source | Raw handoff/source evidence. | Cite and distill; do not execute directly from conflicts. |
| `docs/lore/*.md` | provenance | Rich voice, theology, cast, and symbolism. | Active docs/ADRs arbitrate conflicts. |
| `concept_packet.html` | generated-review | Human review surface. | Not independent canon. |
| `_archive/superseded/**` | archive | Historical provenance. | Not active implementation authority. |

## Migration notes

### v0.8.1

v0.8.1 remains useful and should not be deleted. It is scoped P0 provenance. It still carries strong visual, naming, and Godot/C# scaffold constraints where active v0.9 documents do not contradict it.

Active v0.9 supersedes v0.8.1 when the question is:

- whether combat appears in the opening slice,
- whether normal RPG risk/reward and loot/material consequence are allowed,
- whether paths are Apothecary/Hesychasm/Iconographic,
- whether Act 2 uses bread,
- whether mother death is a gravity encounter,
- whether wolf combat can be violent and lootable,
- whether source docs are execution contracts.

### Source intake

Source intake remains searchable evidence. Future agents should cite it when they need nuance, but they should implement from the active PRD, slice specs, ADRs, and issue backlog.

### `.omx/plans/`

Plans are planning history. If a plan conflicts with active packet docs, update the active docs or create a new ADR; do not treat an older plan as stronger than the active packet.

## Required read path after this slice

1. `CONTEXT.md`
2. `docs/adr/`
3. `design_system/v0_9_mercy_rpg_substrate/INDEX.md`
4. `design_system/v0_9_mercy_rpg_substrate/PRD.md`
5. `design_system/v0_9_mercy_rpg_substrate/ISSUE_SLICES.md`
6. Assigned slice doc
7. Provenance/source docs only as needed

## Acceptance

This slice is accepted when:

- Major doc surfaces are labeled.
- v0.8.1 is provenance/scoped P0 where it conflicts with active v0.9.
- Source intake is evidence, not execution authority.
- Root/design read paths agree with this registry.
- `design_system/SKILL.md` routes agents to the active v0.9 packet rather than v0.8.1 as current hub.
