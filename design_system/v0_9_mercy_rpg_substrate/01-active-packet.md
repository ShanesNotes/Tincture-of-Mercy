# Slice 1 — Active Packet and PRD Routing

Status: active slice spec
Owner lane: documentation lead
Authority level: active for doc routing, PRD shape, and issue-slice handoff
Dependencies: `INDEX.md`, `PRD.md`, `ACCEPTANCE.md`, `ISSUE_SLICES.md`, `CONTEXT.md`, `docs/adr/`
Maximum intended scope: active packet structure and agent context hygiene; not a replacement for every source/lore document
Source references: approved RALPLAN `.omx/plans/deepen-7-mercy-rpg-slices-consensus-plan.md`; source intake under `docs/source/2026-05-09-tincture-codex-handoff/`
Validation gate: root/design read paths agree and the active packet can be read without reconciling raw sources first

## Purpose

This slice turns the v0.9 direction into an execution packet. Future agents should not need to infer active canon from raw handoff files, historical packets, or generated review pages before they understand the current implementation target.

## Active packet contract

The active packet consists of:

- `INDEX.md` — routing hub and source hierarchy.
- `PRD.md` — product and engineering requirements.
- `ACCEPTANCE.md` — matrix of acceptance gates.
- `ISSUE_SLICES.md` — issue-ready backlog and dependency metadata.
- `01-active-packet.md` through `07-anti-drift-vocabulary.md` — bounded slice specs.

Each slice doc states status, owner lane, authority level, dependencies, maximum intended scope, source references, and validation gate. This keeps docs reviewable and helps future agents avoid over-reading one file as the whole project.

## Authority rules

1. Active packet docs guide v0.9 substrate-first work.
2. ADRs explain why active choices were made and supersede older conflicting wording.
3. v0.8.1 docs remain valuable for tone, names, aesthetic discipline, and Godot/C# scaffold constraints where not contradicted.
4. Source intake is evidence. It should be cited, not treated as the execution contract.
5. Generated review surfaces and archive materials are review/provenance unless an active doc imports a decision.

## Context hygiene rules

- Do not promote older P0 care-only constraints into project-wide law.
- Do not soften combat into a non-system. Combat is first-class and shares the substrate.
- Do not split care/combat into parallel resolver architectures.
- Do not frame current issue scope as permanent design doctrine.
- Use Hesychasm in active docs; Pastoral is a historical/source alias.
- Use bread in active Act 2; porridge is older source wording.
- Use paths for Apothecary/Hesychasm/Iconographic growth.
- Keep Bethany recognition/presence ahead of corrected-recipe-as-payoff.
- Treat reward caps, farming controls, and scarcity as tuning levers when chosen, not as moralized combat exclusion.

## Agent read path

Root and design docs should converge on this route:

1. `CONTEXT.md`
2. `docs/adr/`
3. `design_system/v0_9_mercy_rpg_substrate/INDEX.md`
4. `design_system/v0_9_mercy_rpg_substrate/PRD.md`
5. `design_system/v0_9_mercy_rpg_substrate/ISSUE_SLICES.md`
6. Specific slice docs for the assigned work
7. v0.8.1/source/provenance docs only when evidence or legacy constraints are needed

## Issue-slice handoff rules

- Every implementation issue must list write scope, dependencies, acceptance, and verification.
- Epic C opening act implementation issues carry `blocked_by: [B0]` until substrate acceptance passes.
- If a future agent wants to add a new combat, economy, or progression feature, it should identify the substrate primitive it uses before authoring scene-specific code.
- If a future agent wants to restrict an RPG loop, it should state the tuning problem and scope instead of creating project-wide exclusions.

## Acceptance

This slice is accepted when:

- `INDEX.md`, `PRD.md`, `ACCEPTANCE.md`, and `ISSUE_SLICES.md` exist and agree on source hierarchy.
- The seven slice docs are linked from `INDEX.md` and represented in `ISSUE_SLICES.md`.
- Root/design read paths are updated by Slice 6.
- Validation commands in `ACCEPTANCE.md` pass after all seven slices land.
