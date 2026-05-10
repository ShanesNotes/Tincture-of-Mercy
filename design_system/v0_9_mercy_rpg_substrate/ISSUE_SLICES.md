# Issue Slices — v0.9 Mercy RPG Substrate

Status: active issue-slice backlog
Owner lane: planning + implementation leads
Authority level: active backlog scaffold for docs and later engine work
Dependencies: `PRD.md`, `ACCEPTANCE.md`, seven slice docs
Maximum intended scope: independently grabbable issue definitions; not a tracker export yet
Source references: approved RALPLAN `.omx/plans/deepen-7-mercy-rpg-slices-consensus-plan.md`, substrate handoff source intake, accepted ADRs
Validation gate: every issue has write scope, dependencies, acceptance, and verification

## Backlog rules

- Keep issues small enough for one agent lane.
- Preserve the substrate-first gate: Epic C opening act implementation is blocked by B0 until B1-B6 pass substrate acceptance.
- Engine-facing work uses Godot 4.6, C#/.NET, and Forward+ unless a later accepted PRD changes the stack.
- Use one resolver/event-truth architecture. Domain presenters may differ; outcome truth does not fork.
- Combat is first-class. Issue scope may defer a specific feature, but issue wording should not imply project-wide combat demotion.
- Normal RPG risk/reward applies where scoped: danger, damage, loot/material consequence, equipment, item quality, rarity, Witness/Recollection/Vocation/path points, and tuning levers.

## Issue metadata template

```yaml
id: B1
lane: executor
write_scope:
  - path/or/module
blocked_by: []
acceptance:
  - measurable acceptance statement
verification:
  - command or manual review gate
notes:
  - context or source reference
```

## EPIC A — Active canon packet and PRD

### A1 — Hub/index update

```yaml
id: A1
lane: writer
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/INDEX.md
blocked_by: []
acceptance:
  - Index links PRD, ACCEPTANCE, ISSUE_SLICES, and all seven slice docs.
  - Index states source hierarchy and milestone order.
  - Index uses bread, Hesychasm, paths, and recognition/presence tie-breakers.
verification:
  - Manual link/read-path review.
```

### A2 — PRD

```yaml
id: A2
lane: writer
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/PRD.md
blocked_by: []
acceptance:
  - Product promise includes care, combat, witness, risk/reward, loot/progression, and aftermath.
  - Milestones put substrate core before opening content.
  - Out-of-scope section is milestone scoping, not project doctrine.
verification:
  - Manual PRD review against ACCEPTANCE.md A-01 through A-07.
```

### A3 — Acceptance matrix

```yaml
id: A3
lane: test-engineer
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/ACCEPTANCE.md
blocked_by: []
acceptance:
  - Matrix covers docs, substrate, opening acts, paths, economy, and drift gates.
  - Includes required-doc, stale-claim, and anti-drift validation commands.
verification:
  - Run final validation commands after all epics complete.
```

### A4 — Active packet routing contract

```yaml
id: A4
lane: writer
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/01-active-packet.md
blocked_by: []
acceptance:
  - Defines authority, context hygiene, max scope, and source/provenance treatment.
  - Names root docs that must route to the active packet.
verification:
  - Manual review with G006 routing-doc update.
```

## EPIC B — Substrate core mechanics before content

### B0 — Blocking gate before Epic C implementation

```yaml
id: B0
lane: architect
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/02-substrate-primitives.md
  - future engine test manifests
blocked_by: [B1, B2, B3, B4, B5, B6]
acceptance:
  - Substrate primitive contracts are implemented and tested before Epic C content implementation begins.
  - Epic C implementation issues retain blocked_by: [B0] until B1-B6 pass.
verification:
  - Headless substrate test suite once engine work begins.
  - Documentation review now.
```

### B1 — SimClock + SimEvent

```yaml
id: B1
lane: executor
write_scope:
  - future core simulation clock/event modules
  - design_system/v0_9_mercy_rpg_substrate/02-substrate-primitives.md
blocked_by: []
acceptance:
  - Fixed tick scheduler and event stream/ring buffer are deterministic under seed/fixture.
  - Events include tick, actor, target, verb, domain, cost, result, tags, and source metadata.
verification:
  - Future headless test: deterministic event replay.
```

### B2 — Resolver + scripted rolls

```yaml
id: B2
lane: executor
write_scope:
  - future OutcomeResolver / CombatTable modules
blocked_by: [B1]
acceptance:
  - Care, craft, combat, witness, and path/receptivity checks use one resolver family.
  - Scripted roll fixtures and seeded rolls are testable.
verification:
  - Future tests prove a tincture care check and wolf attack check both record resolver metadata.
```

### B3 — Auras + actor state + resources

```yaml
id: B3
lane: executor
write_scope:
  - future actor state, stat, aura, resource modules
blocked_by: [B1, B2]
acceptance:
  - Health, Spirit, Steady, Burden, Pressure, and Numbness hooks are event-derived.
  - Aura add/remove/expire and modifiers are observable in debug.
verification:
  - Future unit tests for state/resource changes.
```

### B4 — Disparity + threat + aggro/leash

```yaml
id: B4
lane: executor
write_scope:
  - future disparity, threat, aggro, route, leash modules
blocked_by: [B1, B2, B3]
acceptance:
  - Disparity contributes risk but does not own outcomes.
  - Threat/aggro can target Kalev or the boy and can resolve flee/leash events.
verification:
  - Future combat simulation fixture.
```

### B5 — Timers + ability/item data + presenters

```yaml
id: B5
lane: executor
write_scope:
  - future timer, AbilityDef, VerbDef, ItemDef, presenter modules
blocked_by: [B1, B2]
acceptance:
  - GCD, work/cast/channel, swing, and rite pulse timers emit events.
  - Ability/item definitions include costs, resolver table, tags, quality/loot hooks, and presenter keys.
verification:
  - Future data validation tests.
```

### B6 — Progression + notebook truth surface

```yaml
id: B6
lane: executor
write_scope:
  - future progression, notebook, recollection modules
blocked_by: [B1, B2, B3]
acceptance:
  - Witness, Recollection, Vocation/path points, notebook entries, and economy outcomes are derived from events.
verification:
  - Future tests verify notebook/progression projection from event fixtures.
```

## EPIC C — Opening act bible

### C1 — Act 1 water

```yaml
id: C1
lane: writer/executor
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md
  - future act data/scenes
blocked_by: [B0]
acceptance:
  - Defines verbs, events, state, success/cost outcomes, UI/presenter outputs, and debug acceptance for water.
verification:
  - Manual doc review now; future act fixture after substrate gate.
```

### C2 — Act 2 bread

```yaml
id: C2
lane: writer/executor
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md
  - future act data/scenes
blocked_by: [B0]
acceptance:
  - Uses bread, limited food, timing, receptivity, and consequence.
  - Does not frame care as recipe success.
verification:
  - Stale-claim scan and future act fixture.
```

### C3 — Act 3 tincture

```yaml
id: C3
lane: writer/executor
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md
  - future act data/scenes
blocked_by: [B0]
acceptance:
  - Proves resolver, scripted roll, resource temptation, and consequence.
verification:
  - Future resolver fixture.
```

### C4 — Act 4 gravity encounter

```yaml
id: C4
lane: writer/executor
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md
  - future act data/scenes
blocked_by: [B0]
acceptance:
  - Mother death has meaningful mechanics and fixed outcome.
  - Witness, notebook, burden, and recollection hooks fire.
verification:
  - Future gravity encounter replay fixture.
```

### C5 — Act 5 wolves/flight/combat/loot

```yaml
id: C5
lane: writer/executor
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md
  - future combat/flight act data/scenes
blocked_by: [B0]
acceptance:
  - Includes lethal/risky combat, threat targets, boy route, costs, possible wolf loot/material outcome, and aftermath.
  - Objective is boy safety, not kill count.
verification:
  - Future combat simulation and route fixture.
```

## EPIC D — Paths and receptivity

### D1 — Path vocabulary and unlocks

```yaml
id: D1
lane: writer
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/04-latent-paths-receptivity.md
blocked_by: []
acceptance:
  - Defines Apothecary, Hesychasm, Iconographic as paths.
  - Distinguishes paths from folk/sanctioned/sacred voice registers.
verification:
  - Manual terminology review and stale-claim scan.
```

### D2 — Receptivity profile data contract

```yaml
id: D2
lane: architect
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/04-latent-paths-receptivity.md
  - future receptivity data schema
blocked_by: [B2]
acceptance:
  - Defines `ReceptivityProfile` and `register_match_modifier` fields and examples.
verification:
  - Future resolver tests with path/register modifiers.
```

### D3 — Bethany recognition/presence payoff

```yaml
id: D3
lane: writer
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/04-latent-paths-receptivity.md
  - CONTEXT.md
blocked_by: []
acceptance:
  - Recognition/presence is active payoff.
  - Corrected recipe remains subordinate Apothecary learning.
verification:
  - Manual review against CONTEXT.md.
```

## EPIC E — RPG economy/progression

### E1 — Loot/material/equipment quality

```yaml
id: E1
lane: writer/architect
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/05-rpg-economy-progression.md
  - future item/loot data modules
blocked_by: [B1, B2, B5]
acceptance:
  - Defines item quality, rarity, loot tables, material outcomes, and equipment hooks.
  - Wolves may produce useful material consequence when world-grounded.
verification:
  - Manual spec review now; future loot table validation.
```

### E2 — Witness/Recollection/Vocation accounting

```yaml
id: E2
lane: writer/architect
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/05-rpg-economy-progression.md
  - future progression modules
blocked_by: [B1, B2, B6]
acceptance:
  - Defines event-derived Witness, Recollection, Vocation/path points, and relationship to XP-style progression.
verification:
  - Future progression projection fixture.
```

### E3 — Reward tuning levers, not moral bans

```yaml
id: E3
lane: writer
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/05-rpg-economy-progression.md
  - docs/adr/0011-full-rpg-mechanics-allowed-with-shared-substrate.md
blocked_by: []
acceptance:
  - Farming controls, diminishing returns, scarcity, or encounter caps are framed as balance/tuning.
  - No active rule erases loot/material reward from violent combat as doctrine.
verification:
  - Stale-claim scan.
```

## EPIC F — Canon registry/migration

### F1 — Surface registry

```yaml
id: F1
lane: writer
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/06-canon-surface-registry.md
blocked_by: []
acceptance:
  - Major docs are labeled active, active-support, provenance, source, generated-review, archive, or stale-needs-update.
verification:
  - Manual registry review.
```

### F2 — Root/design/agent docs update

```yaml
id: F2
lane: executor
write_scope:
  - AGENTS.md
  - CONTEXT.md
  - README.md
  - CLAUDE.md
  - design_system/README.md
  - design_system/SKILL.md
blocked_by: [F1]
acceptance:
  - Read paths agree with the active v0.9 packet.
  - design_system/SKILL.md no longer sends agents to v0.8.1 as the active hub.
verification:
  - Stale-claim scan and manual read-path review.
```

### F3 — Stale plans/source migration notes

```yaml
id: F3
lane: writer
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/06-canon-surface-registry.md
blocked_by: [F1]
acceptance:
  - .omx plans and source intake are labeled historical/planning evidence unless actively superseded by this packet.
verification:
  - Manual registry review.
```

## EPIC G — Anti-drift/vocabulary

### G1 — Vocabulary matrix

```yaml
id: G1
lane: writer
write_scope:
  - design_system/v0_9_mercy_rpg_substrate/07-anti-drift-vocabulary.md
blocked_by: []
acceptance:
  - Defines player-facing, debug, dev, and source/provenance vocabulary scopes.
  - Sanctions active RPG terms for v0.9 where appropriate.
verification:
  - Manual vocabulary review.
```

### G2 — Allowlist/lint updates

```yaml
id: G2
lane: executor
write_scope:
  - design_system/tools/anti_drift_allowlist.json
  - design_system/tools/anti_drift.py
blocked_by: [G1]
acceptance:
  - Tooling changes are made only if final validation requires them.
  - Allowlist entries include why and owner.
verification:
  - python3 design_system/tools/anti_drift.py --mode all --root design_system
```

### G3 — Verification script and grep checks

```yaml
id: G3
lane: verifier
write_scope:
  - validation evidence only
blocked_by: [A1, A2, A3, A4, B0, D1, E3, F2, G1]
acceptance:
  - Anti-drift passes.
  - Required-doc existence check passes.
  - Context-aware stale-claim scan passes.
verification:
  - Commands in ACCEPTANCE.md.
```
