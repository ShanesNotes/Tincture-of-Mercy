# Slice 2 — Substrate Primitive Catalog

Status: active slice spec
Owner lane: architecture + engine foundation
Authority level: active for substrate core implementation order and issue dependencies
Dependencies: `PRD.md`, `ACCEPTANCE.md`, `ISSUE_SLICES.md`, ADR 0010 once accepted
Maximum intended scope: core mechanics contracts and build order before opening act content; not final engine code
Source references: `docs/source/2026-05-09-tincture-codex-handoff/handoff_pack/docs/00_SOURCE_OF_TRUTH.md`, `01_BUILD_ORDER.md`, `03_ACCEPTANCE_CRITERIA.md`
Validation gate: every primitive lists owner, inputs, outputs, event fields, tests, and later opening act usage

## Core decision

Build and verify the substrate before implementing opening act content. The five opening acts should prove a stable simulation layer rather than define mechanics ad hoc in scene scripts.

Engine-facing substrate work preserves Godot 4.6, C#/.NET, and Forward+ unless a later accepted PRD changes the stack.

## One event truth

Care, combat, crafting, witness, notebook, economy, and aftermath are projections over the same event stream.

- The authoritative record is `SimEvent`.
- Domain presenters translate events into bedside UI, combat UI, notebook prose, debug panels, economy summaries, and later replay/analytics.
- Presenters may hide or rename fields for player-facing surfaces; they do not own outcome truth.
- `OutcomeResolver` is shared. Combat uses `OutcomeTable` data rows and attack outcomes, but it does not fork into a separate engine.

## Build order

1. `SimClock` / fixed tick scheduler
2. `SimEvent` event stream/ring buffer
3. `OutcomeResolver` / `OutcomeTable` data / scripted rolls
4. `AuraSystem`
5. `ActorState`, `StatBlock`, `DerivedStats`
6. `DisparityService`
7. `AttentionThreatTable`
8. `AggroCallFleeRadius`
9. GCD, work/cast/channel, swing/rite pulse timers
10. Resource profiles: Health, Spirit, Steady, Burden, Pressure, Numbness hooks
11. FSR/Vigil cooldown
12. `AbilityDef` / `VerbDef`
13. `ItemDef`, quality budget, loot table hooks
14. Leash/route/respawn
15. Death/friction/moral death
16. Progression state: Witness, Recollection, Vocation/path points
17. Notebook presenter and domain presenters

## Primitive contracts

| # | Primitive | Owner | Inputs | Outputs | Required event fields | Tests | Opening act usage |
|---|---|---|---|---|---|---|---|
| 1 | `SimClock` | Core simulation | fixed tick rate, pause state, seed, time scale | tick events, elapsed ticks, deterministic scheduling | `tick`, `time_scale`, `seed`, `phase` | deterministic tick progression, pause/resume, replay seed | all acts |
| 2 | `SimEvent` stream | Core simulation | event payloads from systems | append-only stream, ring buffer, replay fixture | `id`, `tick`, `actor`, `target`, `verb`, `domain`, `source`, `cost`, `result`, `tags` | ordered append, capacity rollover, replay serialization | all acts |
| 3 | `OutcomeResolver` + `OutcomeTable` data | Rules | actor state, target state, verb, table, seed/scripted fixture, modifiers | `ResolvedOutcome`, event metadata, consequence hooks | `roll_kind`, `roll_value`, `table_id`, `modifiers`, `modifier_composition`, `outcome`, `consequence_tags` | seeded care roll, scripted tincture roll, wolf attack table, shared resolver assertion | tincture, wolves |
| 4 | `AuraSystem` | Rules/state | aura def, target, duration, stack rule, source event | add/remove/expire events, modifiers | `aura_id`, `target`, `source`, `duration_ticks`, `stack_count`, `modifier_id` | add, refresh, stack, expire, event projection; expiry carries originating domain | tincture, wolves, Witness |
| 5 | `ActorState` / `StatBlock` / `DerivedStats` | Actor model | actor defs, base stats, equipment, auras, burdens | derived stats, current state, state-change events | `stat_key`, `old_value`, `new_value`, `reason`, `source_event` | derived stat recompute, health change, pressure change | bread, tincture, wolves |
| 6 | `DisparityService` | Encounter math | actor/target power, source event, verb/request context | `OutcomeModifier` rows with `Kind = Disparity` for `VerbInvocation` | `disparity_rule_id`, `disparity_actor_id`, `disparity_target_id`, `disparity_amount` | modifier-only service, B5b modifier integration | tincture, wolves |
| 7 | `AttentionThreatTable` | Combat/care attention | proximity, protected/protector/aggressor roles, noise, line-of-protection | target choice hints and `threat_target_changed` candidates | `aggressor_id`, `target_id`, `previous_target_id`, `score`, `threat_table_id` | target protected actor when exposed, target protector when line is held, deterministic tie-breaks | wolves |
| 8 | `AggroCallFleeRadius` | Encounter AI | actor route, radius defs, threat table, flee triggers | `aggro_entered`, `aggro_exited`, `pack_call_emitted`, `flee_initiated` candidates | `encounter_id`, `distance`, `target_id`, radius/threshold fields | aggro enter/exit, call pack, flee route, replay fixture | wolves |
| 9 | Timer suite | Core/rules | verb def, actor haste/steady modifiers, interruption rules | start/tick/complete/interrupted events | `timer_kind`, `duration_ticks`, `remaining_ticks`, `interrupted_by` | GCD, work/cast/channel, swing, rite pulse | bread, tincture, wolves, Witness |
| 10 | Resource profiles | Actor model | costs, damage, stress, presence, self-use, rest | Health/Spirit/Steady/Burden/Pressure/Numbness changes | `resource_key`, `old_value`, `new_value`, `delta`, `cause` | damage, burden increase, pressure spike, numbness shift | all acts |
| 11 | FSR/Vigil cooldown | Kalev state | self-administration verb, cooldown, cost, aftermath rules | cooldown event, clarity/stability event, consequence | `cooldown_id`, `started_tick`, `ready_tick`, `benefit`, `cost` | self-use available/unavailable, aftermath cost | tincture, Witness, wolves |
| 12 | `AbilityDef` / `VerbDef` | Data/rules | data rows, tags, costs, timer/cooldown ids, resolver table, presenter keys, item requirements | executable verb contracts through `VerbInvocation` | `verb_id`, `ability_id`, `cost_keys`, `timer_id`, `cooldown_id`, `table_id`, `presenter_key`, `invocation_id` | data validation, invalid missing table, shared care/combat invocation fixture, append-before-consequence order | all acts |
| 13 | `ItemDef` / quality / loot hooks | Economy/data | item defs, loot tables, quality budget, source actor, world context | item/material events, inventory hooks, reward projections | `item_id`, `quality`, `rarity`, `quantity`, `loot_table`, `source_actor` | loot roll fixture, quality budget clamp, wolf material drop | bread, wolves |
| 14 | Leash/route/respawn | Encounter/world | route graph, leash radius, reset rules, death/down state projected through DeathFriction | `route_node_reached`, `leash_triggered`, `encounter_friction_requested`, `encounter_respawn_reset` | `route_id`, `node_id`, `leash_radius`, `source_death_event_id` when death-driven | route follow, leash break, reset, later respawn hook | wolves |
| 15 | Death/friction/moral death | Consequence | Health/resource state, encounter rules, Witness rules, recovery policy | death/down/recovery/Witness events | `death_kind`, `actor`, `cause_event`, `recoverable`, `witness_hook` | mother fixed death, Kalev down/death fixture, wolf death | Witness, wolves |
| 16 | Progression state | Progression | SimEvents, path profile, Witness/Recollection rules, economy events | Witness, Recollection, Vocation/path points, XP-style projections where scoped | `progression_key`, `delta`, `source_event`, `path`, `cap_or_tuning_rule` | event-derived progression, duplicate guard, path point projection | Witness, wolves, Bethany payoff |
| 17 | Notebook/domain presenters | Presentation | event stream, actor names, register context, debug mode | notebook entries, bedside/combat/economy/debug views | `presenter_id`, `source_event_ids`, `surface`, `copy_key` | notebook projection, debug event view, combat summary, bedside prose | all acts |

## Event shape

Illustrative C# shape, not final code:

```csharp
public enum SimDomain
{
    Care,
    Craft,
    Combat,
    Witness,
    Economy,
    Progression,
    Notebook,
    Debug
}

public readonly record struct SimEvent(
    long Id,
    int Tick,
    string ActorId,
    string? TargetId,
    string VerbId,
    SimDomain Domain,
    string SourceSystem,
    IReadOnlyDictionary<string, string> Fields,
    IReadOnlyList<string> Tags
);
```

Minimum event field expectations:

- **Identity:** `id`, `tick`, `actor_id`, optional `target_id`, optional `location_id`.
- **Action:** `verb_id`, `domain`, `source_system`, optional `ability_id` or `item_id`.
- **Resolution:** `resolver_id`, `table_id`, `roll_kind`, `roll_value`, `modifiers`, `outcome` when resolved.
- **Cost:** resources spent, time spent, item spent, positional risk, pressure/burden changes.
- **Consequence:** damage, healing/tending effect, aura, death/down, loot/material, progression, notebook hook, aftermath tags.
- **Debug:** seed/scripted fixture id, data row ids, validation tags.

## Resolver shape

Illustrative C# shape:

```csharp
public interface IOutcomeResolver
{
    ResolvedOutcome Resolve(OutcomeRequest request);
}

public readonly record struct OutcomeRequest(
    string ActorId,
    string? TargetId,
    string VerbId,
    string TableId,
    SimDomain Domain,
    int Tick,
    IReadOnlyDictionary<string, int> Modifiers,
    string? ScriptedFixtureId
);

public readonly record struct ResolvedOutcome(
    string OutcomeKey,
    int? RollValue,
    IReadOnlyDictionary<string, int> AppliedModifiers,
    IReadOnlyList<SimEvent> Events
);
```

Rules:

- Combat rows are `OutcomeTable` data, not a second resolver engine.
- B2 uses additive modifier composition (`modifier_composer.additive.v1`) as the named v1 seam; later multiplicative, floor, cap, or domain-specific composition changes require a named composer change and fixture updates.
- Scripted rolls are valid for authored teaching moments when recorded as fixtures.
- Resolver output emits events; presenters and progression derive from those events.
- Care outcomes may use tactile language in UI while keeping debug metadata available.

## Resource profile notes

| Resource | Role | Typical changes | Presenter note |
|---|---|---|---|
| Health | Bodily survival and damage. | wolf damage, death/down checks, recovery. | Player-facing combat can show danger clearly; bedside/care may map numbers to tactile state. |
| Spirit | Capacity for attention, prayerful steadiness, and costly acts. | presence actions, Witness aftermath, self-use cost. | Avoid generic mana framing in care surfaces. |
| Steady | Hand/nerve reliability under pressure. | washing, tincture, weapon handling, panic. | Useful for both care and combat timing. |
| Burden | Accumulated carried consequence. | Witness, failed protection, death, hard choices. | Notebook and state overlays project it through language and posture. |
| Pressure | Immediate stress/time/encounter load. | fading patient, wolf threat, boy danger. | Drives urgency without needing raw numbers in care UI. |
| Numbness | Detachment and case-language drift. | Ember/FSR/Vigil, repeated trauma, Wittehaven pressure. | Affects names/register presentation and path perception. |

## Path/receptivity hook

`OutcomeResolver` accepts path/receptivity modifiers from `04-latent-paths-receptivity.md`. The modifier changes fit, risk, recognition, cost, or available readings; it does not create a separate care path engine.

Example fields:

- `path_id`: serialized from `LatentPath` (`apothecary`, `hesychasm`, `iconographic`)
- `voice_register`: `folk`, `sanctioned`, `sacred`
- `target_receptivity`: data row id
- `register_match_modifier`: signed integer or named modifier
- `fit_tags`: e.g. `bodily`, `presence`, `image`, `fear`, `hunger`

## Opening-slice dependency rule

Epic C implementation issues remain blocked by B0 until these are true:

1. B1 through B6 core substrate issues pass tests or documented review gates.
2. Event replay proves a care action and a combat action through the same stream.
3. Resolver tests prove a tincture/care fixture and a wolf/combat fixture through the same resolver family.
4. Progression/notebook projection reads events rather than scene-local state.

## Headless test plan

| Test | Claim proven |
|---|---|
| `SimClock_ReplaysFixedTicks` | deterministic scheduler foundation. |
| `SimEvent_AppendsAndReplays` | event truth can be inspected and replayed. |
| `OutcomeResolver_CareAndCombatSharePath` | care and combat use one resolver family. |
| `AuraSystem_ExpiresByTick` | modifiers can be event-derived and deterministic. |
| `ActorState_ResourcesChangeFromEvents` | Health/Spirit/Steady/Burden/Pressure/Numbness update through events. |
| `ThreatTable_TargetsBoyOrKalev` | wolf encounter target pressure is explicit. |
| `Timers_EmitStartCompleteInterrupted` | work/cast/channel/swing/rite timings are observable. |
| `LootHooks_EmitMaterialOutcome` | combat reward can produce grounded material consequence. |
| `Progression_ProjectsWitnessRecollectionPathPoints` | progression is event-derived. |
| `Notebook_ProjectsNamedEvents` | notebook is a presenter over event truth. |

## Acceptance

This slice is accepted when:

- All 17 primitives above list owner, inputs, outputs, event fields, tests, and opening-act usage.
- `OutcomeResolver` is explicitly shared across care and combat domains.
- Epic B issue dependencies keep core substrate before Epic C opening act implementation.
- The illustrative C# contracts are understood as shape guidance, not final code.
