# PRD — v0.9 Mercy RPG Substrate

Status: active PRD
Owner lane: product/design + engineering architecture
Authority level: active product contract for the next implementation and issue slicing pass
Dependencies: `INDEX.md`, `CONTEXT.md`, `docs/adr/`, `02-substrate-primitives.md`, `03-opening-act-bible.md`, `04-latent-paths-receptivity.md`, `05-rpg-economy-progression.md`
Maximum intended scope: documentation and implementation requirements for substrate core plus opening vertical-slice proof; not a full game content bible
Source references: substrate handoff source docs under `docs/source/2026-05-09-tincture-codex-handoff/`; v0.8.1 packet as scoped provenance
Validation gate: `ACCEPTANCE.md`, `ISSUE_SLICES.md`, anti-drift, stale-claim scan

## Product promise

*Tincture of Mercy* is a combat-capable mercy RPG about Kalev Ward moving through post-Turn Michigan with limited medicine, limited strength, real danger, and a notebook of names. The player tends, fights, flees, crafts, witnesses, records, remembers, and bears consequence through one shared simulation substrate.

The v0.9 direction preserves the contemplative care core while bringing combat, threat, loot/material consequence, progression hooks, and encounter risk into the opening slice.

## Player experience goals

1. **Care is embodied.** Water, bread, tincture, bedside presence, and notebook records are actions under time, resource, and attention pressure.
2. **Combat is real.** Wolves can harm Kalev or the child. The player uses timing, position, threat, resources, and violence to protect the child.
3. **Death has gravity.** The mother death is a fixed-outcome teaching encounter with meaningful mechanics, not an inactive cutscene or recipe-failure branch.
4. **Rewards are grounded.** Loot, materials, progression, Witness, Recollection, and Vocation/path points are event-derived consequences, not separate scorekeeping.
5. **The room must be read.** Apothecary, Hesychasm, and Iconographic paths shape what Kalev notices, which actions fit the sufferer, and how receptivity modifies outcomes.
6. **The notebook remembers persons.** Player-facing care surfaces keep names, presence, and consequence ahead of abstract optimization.

## Engineering goals

1. **One event truth.** Care, combat, crafting, witness, economy, notebook, and aftermath are projections over the same event stream.
2. **Substrate before content.** Core mechanics are built and verified before opening act implementation begins.
3. **Shared resolver.** `OutcomeResolver` and combat table logic are shared primitives with domain-specific presenters, not separate care and combat engines.
4. **Data-driven acts.** Opening acts are authored as data and scenes over substrate primitives rather than ad hoc scene code.
5. **Debuggable acceptance.** Every primitive and act has event logs, replayable examples, and testable acceptance criteria.
6. **Godot constraints remain.** Engine-facing work preserves Godot 4.6, C#/.NET, and Forward+ unless a later accepted PRD changes that stack.

## Milestones

### M0 — Active packet and canon routing

Deliverables:
- `INDEX.md`, this `PRD.md`, `ACCEPTANCE.md`, `ISSUE_SLICES.md`, and seven slice specs.
- ADRs for substrate-before-opening and full RPG mechanics under the shared substrate.
- Updated read paths in root and design docs.
- Scoped anti-drift vocabulary plan.

Exit criteria:
- Future agents can identify active, provenance, source, generated-review, archive, and stale surfaces.
- No active doc turns v0.8.1 P0 limits into project-wide doctrine.

### M1 — Substrate core mechanics

Deliverables:
- `SimClock` fixed tick scheduler.
- `SimEvent` stream/ring buffer.
- `OutcomeResolver`, scripted rolls, and combat table shape.
- Aura, actor state, stat and derived stat, resource, disparity, threat, aggro, timer, ability, item, loot hook, leash, death/friction, progression, notebook, and presenter primitives.

Exit criteria:
- Headless tests prove deterministic events, shared resolver usage, event-derived progression, and domain presenter projections.
- Epic C opening act implementation remains blocked until M1 acceptance passes.

### M2 — Data and presenters

Deliverables:
- Domain presenters for bedside/care, combat, notebook, debug, and economy views.
- Data definitions for actors, abilities, items, loot tables, path/receptivity profiles, and act beats.

Exit criteria:
- Presenters read event truth rather than owning outcome state.
- Player-facing surfaces map numbers into tactile or register-appropriate language where required.

### M3 — Opening act graybox

Deliverables:
- Water, bread, tincture, mother death/Witness gravity encounter, wolves/boy flight/combat.

Exit criteria:
- Each act proves named substrate primitives and writes notebook/debug events.
- Act 5 includes lethal/risky combat, boy-safety objective, cost, possible loot/material consequence, and aftermath.

### M4 — Vertical-slice verification

Deliverables:
- Acceptance tests, stale-claim checks, anti-drift pass, and manual read-through.

Exit criteria:
- `ACCEPTANCE.md` passes or lists explicit open risks.
- `ISSUE_SLICES.md` can be used as the implementation backlog.

## Functional requirements

### FR1 — Shared event stream

All consequential actions produce `SimEvent` records with actor, target, verb, domain, roll/fixture metadata when applicable, cost, result, consequence tags, timestamp/tick, and notebook/progression hooks.

### FR2 — Shared outcome resolver

Care, combat, craft, witness, and path/receptivity checks call one resolver family. Domain tables and presenters can differ; outcome truth is not forked.

### FR3 — Combat encounter support

The substrate supports melee/ranged or close/long verbs as later scoped, threat/aggro, attack tables, damage, death, leash, flee, resource cost, cooldowns, loot/material drops, and progression hooks.

### FR4 — Care and bedside support

The substrate supports observe, wash, warm, feed/bread, craft, administer tincture, sit, write, and witness actions with embodied state, timing, receptivity, and consequence.

### FR5 — Latent path support

Apothecary, Hesychasm, and Iconographic paths affect available readings, action framing, costs, risks, and receptivity modifiers without replacing one another as a ladder.

### FR6 — RPG economy/progression support

The substrate supports event-derived loot, material, equipment, quality, rarity, Witness, Recollection, Vocation/path points, and tuning levers for farming, risk, and pacing.

### FR7 — Opening slice proof

The five-act opening proves the substrate after core mechanics pass acceptance. Act 2 uses bread. Act 4 is a gravity encounter. Act 5 is real combat with loot/material consequence allowed.

## Non-functional requirements

- Deterministic headless test paths for fixed seeds and scripted outcomes.
- Small, reviewable issue slices with dependency metadata.
- Documentation surfaces with explicit authority labels.
- Drift gates that keep v0.8.1 care-language constraints scoped while allowing active v0.9 RPG language.
- No reliance on raw source intake as the execution contract.

## Out of scope for the next milestone

These are milestone boundaries, not project-wide bans:

- Full campaign content beyond the opening slice.
- Final art, final animation, final combat feel tuning, and final item balance.
- Complete quest UI or full production economy.
- Final controller/keybinding design.
- External publishing/deployment work.

## Design constraints

- Combat is first-class and may be violent, lethal, risky, and lootable when the encounter supports it.
- Protecting the child is the wolf encounter objective; loot/material consequence is allowed but is not the victory condition.
- Bethany payoff is recognition/presence; corrected recipe remains subordinate Apothecary learning.
- Hesychasm is active terminology; Pastoral is a historical/source alias only.
- Bread is active Act 2 terminology; porridge is older source wording.
- Use scoped language. Avoid turning current issue scope into project doctrine.

## Primary risks

| Risk | Mitigation |
|---|---|
| Old care-only language re-enters active docs as doctrine. | Canon registry, ADRs, context glossary, stale-claim scan. |
| Broad RPG permission causes unfocused design. | Substrate-first gate, event truth, issue dependencies, encounter objectives. |
| Combat and care split into two engines. | Shared resolver acceptance and no separate resolver issue rule. |
| Docs become too large for agents. | Seven bounded slice docs plus index and registry. |
| Anti-drift blocks valid v0.9 vocabulary. | Scoped vocabulary doc and allowlist updates when required. |

## Acceptance summary

The PRD is accepted when:

- The active packet exists and links its seven slice specs.
- Substrate core mechanics are specified before opening content.
- Combat supports normal RPG risk/reward/loot/progression under shared event truth.
- Opening act requirements encode water, bread, tincture, mother death/Witness, and wolves/boy flight/combat.
- Latent paths and receptivity are data contracts, not only lore notes.
- Root/design docs route future agents to this packet before provenance.
- Validation gates in `ACCEPTANCE.md` pass.
