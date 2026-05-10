# Slice 3 — Opening Act Bible

Status: active slice spec
Owner lane: narrative design + gameplay design
Authority level: active for the five-act opening slice after substrate core acceptance
Dependencies: `02-substrate-primitives.md`, `04-latent-paths-receptivity.md`, `05-rpg-economy-progression.md`, Epic B/B0 gate in `ISSUE_SLICES.md`
Maximum intended scope: buildable act bible for the opening substrate proof; not the full campaign bible
Source references: source handoff opening-slice notes under `docs/source/2026-05-09-tincture-codex-handoff/`, with active tie-breakers from `CONTEXT.md` and ADRs
Validation gate: every act lists verbs, taught primitives, authored events, actor state, outcomes, UI/presenter outputs, notebook events, and debug acceptance

## Implementation gate

Opening act implementation waits until substrate core acceptance passes. This document can be authored now, but scene/content work should keep `blocked_by: [B0]` until the core primitives in `02-substrate-primitives.md` have tested contracts.

The opening acts prove the substrate in play:

1. Water
2. Bread
3. Tincture
4. Mother death / Witness gravity encounter
5. Wolves / boy flight / combat

## Shared act structure

Each act must define:

- **Player verbs:** actions available to Kalev.
- **Taught primitives:** substrate mechanics the act proves.
- **Authored events:** required `SimEvent` rows or fixtures.
- **Actor state:** Kalev, mother, child, wolves, and environment state touched by the act.
- **Success/cost/failure outcomes:** mechanical consequences and branch shape.
- **UI/presenter outputs:** bedside, combat, notebook, debug, and economy surfaces as applicable.
- **Notebook events:** person-specific records and later recall hooks.
- **Debug acceptance:** how a developer proves the act without relying on feel alone.

## Cast and state seeds

| Actor | Seed role | Important substrate fields |
|---|---|---|
| Kalev | Player actor; healer, fighter, witness. | Health, Spirit, Steady, Burden, Pressure, Numbness, inventory, path progress, FSR/Vigil cooldown. |
| Mother | Dying patient; fixed Act 4 death. | Health/fading state, receptivity profile, comfort state, witnessed status. |
| Child | Protected person; later Bethany recognition seed. | Fear, trust, hunger/warmth, route state, threat target state, recognition seed. |
| Wolves | Hostile encounter actors. | Health, threat, pack call/flee radius, loot/material table, route/leash state. |
| Cabin/road | Environment. | Light/time pressure, hearth warmth, food supply, exits, wolf path, boy route. |

## Act 1 — Water

### Purpose

Teach embodied care as action under time and state pressure. Water is the first proof that the substrate records small, person-specific acts before it asks for combat or high-risk choices.

### Player verbs

- `Observe` mother and child.
- `FetchWater` or `UseWater` from limited supply.
- `WashFace` / `WashHands` / `CoolCloth` as scoped data verbs.
- `WarmHands` or `StokeFire` if environmental state supports it.
- `SitNear` as a low-cost presence verb.
- `WriteNameSeed` once the notebook surface opens.

### Taught primitives

- `SimClock`
- `SimEvent`
- `ActorState`
- Resource profiles: Pressure, Burden, Steady
- Work timer for fetching/washing
- Notebook/domain presenters

### Authored events

| Event | Domain | Required fields |
|---|---|---|
| `act1.enter_cabin` | Debug/Witness | tick, Kalev, location, mother state, child state |
| `care.observe.mother` | Care | actor, target, verb, discovered state tags, pressure delta |
| `care.water.use` | Care/Economy | water source, quantity, target, comfort delta, inventory delta |
| `care.warmth.adjust` | Care | fire state, actor, target, timer, result |
| `notebook.name_seed` | Notebook | person id, name if known, source event |

### Actor state

- Mother comfort can improve even though biological rescue remains out of reach.
- Child fear/trust responds to whether Kalev attends to the room or rushes.
- Kalev Pressure may rise from delay and fall from ordered care.

### Outcomes

- **Good care:** mother comfort improves, child trust seed improves, Kalev Steady stabilizes.
- **Costly care:** water or time spent poorly raises pressure or reduces later bread flexibility.
- **No hard failure by itself:** the act teaches consequence, not a fail screen.

### UI/presenter outputs

- Bedside panel: tactile states such as cold, dry, calmer, fading.
- Inventory/economy debug: water used, time spent.
- Notebook: first name/person hook when available.
- Debug event panel: event stream with care verbs and resource deltas.

### Debug acceptance

- A replay fixture shows `care.observe.mother` then `care.water.use` events in tick order.
- Mother comfort and child trust projections derive from events.
- No scene-local variable owns the final state without event backing.

## Act 2 — Bread

### Purpose

Teach ordinary mercy under constraint. Bread makes food, timing, scarcity, and receptivity concrete without turning care into a recipe-victory puzzle.

### Player verbs

- `CheckFood`.
- `BreakBread`.
- `OfferBread` to child or mother as data permits.
- `MoistenBread` if water remains.
- `WaitForBreath` / `SitNear` to time the offer.
- `SaveBread` for later scarcity tension.

### Taught primitives

- `ItemDef` for bread/food.
- Work/channel timer for preparation/offer.
- Receptivity state and register fit.
- Resource profiles: Pressure, Burden, Steady.
- Economy event for limited food.
- Notebook presenter for ordinary care.

### Authored events

| Event | Domain | Required fields |
|---|---|---|
| `item.bread.inspect` | Economy/Care | item id, quality/condition, quantity |
| `care.bread.break` | Care/Economy | actor, item, portions, timer, cost |
| `care.bread.offer` | Care | target, receptivity profile, timing, outcome |
| `state.receptivity.shift` | Care | target, from/to tags, source event |
| `notebook.ordinary_mercy` | Notebook | person id, event refs, copy key |

### Actor state

- Child hunger/fear can shift toward trust if bread is offered with attention.
- Mother comfort can change modestly through timing and gentleness.
- Kalev may spend a scarce item that affects later economy.

### Outcomes

- **Fitting offer:** receptivity improves, pressure eases, child trust seed strengthens.
- **Poor timing:** food is spent with less effect, pressure or burden rises.
- **Saving bread:** preserves resource but may leave hunger/fear unresolved.

### UI/presenter outputs

- Care UI uses tactile language: dry, softened, held, refused, accepted.
- Economy/debug can show bread quantity and event-derived inventory changes.
- Notebook records the person and act, not a score.

### Debug acceptance

- Bread inventory changes only through `item.bread.*` or `care.bread.*` events.
- Receptivity shifts cite their source event.
- Act 2 data and UI use bread as the active object.

## Act 3 — Tincture

### Purpose

Expose the one-roll resolver and Ember/medicine temptation. The act shows medicine as real and costly without making technical cure the final meaning of care.

### Player verbs

- `InspectTincture`.
- `Grind` / `Steep` / `Measure` as scoped craft verbs.
- `AdministerTincture`.
- `HoldBackDose`.
- `SelfAdminister` through FSR/Vigil if state and cooldown permit.
- `RecordPreparation` in debug/notebook as appropriate.

### Taught primitives

- `OutcomeResolver` with scripted fixture and seeded roll support.
- `AbilityDef` / `VerbDef` for craft/treat verbs.
- `AuraSystem` for medicine effects.
- FSR/Vigil cooldown and consequence.
- DisparityService for fit/risk.
- Resource profiles: Spirit, Steady, Numbness, Pressure.

### Authored events

| Event | Domain | Required fields |
|---|---|---|
| `craft.tincture.prepare` | Craft | item ids, quality, timer, actor steady, result |
| `resolver.tincture.roll` | Care/Craft | fixture id or seed, table id, modifiers, outcome |
| `care.tincture.administer` | Care | target, dose, route, outcome event ref |
| `aura.tincture.apply` | Care | aura id, target, duration, modifier |
| `fsr_vigil.self_use` | Care/Progression | cooldown, benefit, cost, numbness/pressure delta |
| `notebook.tincture_record` | Notebook | preparation refs, person, consequence tags |

### Actor state

- Mother state can be eased or clarified by treatment, but Act 4 remains fixed.
- Kalev Steady affects preparation and administration.
- Self-administration can reduce immediate Pressure or improve Steady while increasing Numbness, Burden, cooldown debt, or later consequence.

### Outcomes

- **Clean preparation/admin:** clearer event result, comfort or state effect, good debug trace.
- **Rough preparation/admin:** cost, diminished effect, pressure/burden changes.
- **Self-use:** tactical benefit with later cost and notebook/recollection consequence.

### UI/presenter outputs

- Craft/debug surface can show resolver metadata.
- Care UI describes bodily effects without raw formulas.
- State overlay can show FSR/Vigil cooldown in register-appropriate form.
- Notebook records what Kalev did and what it cost.

### Debug acceptance

- Resolver event includes table id, modifiers, roll/fixture metadata, and outcome.
- Care and later combat resolver fixtures use the same resolver family.
- Self-use emits both benefit and consequence events.

## Act 4 — Mother death / Witness gravity encounter

### Purpose

Set the gravity of the game. This is an inverse first-boss shape: the player acts meaningfully, learns mechanics, and cannot convert care into control over death.

The death outcome is fixed for this beat. The mechanics are real: player actions affect comfort, recognition seed, Kalev state, Witness/Recollection hooks, notebook text, and later burdens.

### Player verbs

- `ObserveBreath`.
- `Administer` if tincture remains and timing allows.
- `SitNear` / `HoldHand`.
- `SpeakName` if known.
- `Pray` or `KeepWatch` as Hesychasm-linked verbs when available.
- `DrawSign` / `NoticeImage` as Iconographic-linked verbs when available.
- `WitnessDeath`.
- `WriteName`.

### Taught primitives

- Death/friction/moral death events.
- Witness and Recollection progression.
- Resource profiles: Burden, Pressure, Numbness, Spirit.
- Path/receptivity hooks.
- Notebook presenter.
- Resolver fixture where appropriate, with fixed outcome authored as such.

### Authored events

| Event | Domain | Required fields |
|---|---|---|
| `care.last_actions` | Care | action list, comfort deltas, source refs |
| `resolver.death_fixture` | Witness | fixture id, fixed outcome flag, modifiers recorded |
| `death.mother` | Witness | actor, cause/context, tick, witnessed_by, comfort tags |
| `witness.kalev` | Witness/Progression | actor, target, burden delta, recollection seed |
| `notebook.write_name` | Notebook | person id, name, page/line if available, source death event |
| `progression.recollection_seed` | Progression | source witness event, path tags, later payoff hook |

### Actor state

- Mother dies in the authored event.
- Kalev gains Burden and Witness/Recollection state.
- Child fear/trust and later recognition seed respond to whether Kalev was present, ordered, numb, or absent.
- Numbness may rise if self-use or detachment shaped the moment.

### Outcomes

- **Present witness:** better recognition/presence seed, different notebook text, lower immediate panic, higher carried Burden.
- **Technical rush:** may improve some comfort/state tags but can miss presence/receptivity opportunities.
- **Numb avoidance:** less immediate Pressure at possible cost to names, memory, or later recognition.

### UI/presenter outputs

- Bedside UI quiets into witnessed state.
- Notebook opens as a person record, not a success/failure trophy.
- Debug panel marks the fixed outcome as authored while preserving action consequences.
- Progression debug shows Witness/Recollection event projections.

### Debug acceptance

- Death occurs through a `death.mother` event with fixed outcome metadata.
- Player actions before death are present in the event stream and affect at least three projections: comfort/state, Kalev resources, child/recognition seed, notebook/progression.
- The act is not implemented as a non-interactive cutscene.

## Act 5 — Wolves / boy flight / combat

### Purpose

Prove combat as a first-class system under the shared substrate. Kalev protects the child through real danger, threat, violence, cost, and possible wolf loot/material consequence. The objective is boy safety.

### Player verbs

- `Move` / `PlaceSelfBetween`.
- `CallToBoy`.
- `Guard` / `Shove` / `Strike` / `Attack` as scoped combat verbs.
- `Dodge` / `Retreat` / `DrawThreat`.
- `UseItem` / `UseTincture` / `SelfAdminister` if available.
- `LootWolf` or `GatherMaterial` after combat when world state permits.
- `WriteAftermath` once safe.

### Taught primitives

- `AttentionThreatTable`.
- `AggroCallFleeRadius`.
- GCD, swing, work/cast/channel timers.
- Health/damage/death.
- Ability/verb data.
- Item/loot hooks and quality/material outcomes.
- Leash/route/flee.
- Progression and notebook projections.

### Encounter data

| Field | Requirement |
|---|---|
| Encounter id | `opening.wolves_road` |
| Objective | Child reaches safety route node or safe state. |
| Fail/cost pressure | Kalev can be hurt/downed/die per tuning; child can be endangered per authored limits. |
| Targets | Wolves can target Kalev or child based on threat, proximity, and route state. |
| Leash/flee | Wolves have route/leash/flee behavior; pack calls can escalate. |
| Loot/material | Wolf body can produce grounded material consequence such as hide, tooth, meat, sinew, or wound-risk material per economy spec. |
| Progression | Witness/Recollection/Vocation/path hooks derive from combat and protection events. |

### Authored events

| Event | Domain | Required fields |
|---|---|---|
| `encounter.wolves.start` | Combat/Debug | encounter id, actors, routes, seed |
| `threat.target.shift` | Combat | wolf, old target, new target, reason, threat deltas |
| `combat.attack.resolve` | Combat | resolver/table id, actor, target, roll, damage, tags |
| `combat.damage.apply` | Combat | target, health delta, source event, armor/equipment tags |
| `route.boy.advance` | Combat/Debug | route id, node, danger state, source |
| `combat.wolf.death_or_flee` | Combat | wolf id, cause, loot eligibility, route/leash state |
| `loot.wolf.material` | Economy | item/material id, quality, quantity, source wolf, table id |
| `progression.protection` | Progression | boy safety, witness/recollection/path deltas, source events |
| `notebook.aftermath` | Notebook | person refs, encounter refs, consequence tags |

### Actor state

- Kalev Health/Steady/Pressure/Burden respond to combat and protection choices.
- Child route/fear/safety state is central.
- Wolves have Health, threat, aggro, route, leash, and loot eligibility.
- Inventory can change through item use and loot/material gathering.

### Outcomes

- **Boy reaches safety:** encounter objective resolves; aftermath and progression events fire.
- **Costly protection:** Kalev spends resources, takes wounds, uses FSR/Vigil, or carries burden.
- **Wolf killed:** death event can enable loot/material consequence.
- **Wolf flees/leashes:** encounter can resolve without every wolf dying, but combat remains real.
- **Kalev down/death:** allowed by tuning; death/friction policy determines recovery or run end.

### UI/presenter outputs

- Combat presenter can use direct RPG debug/dev vocabulary: threat, damage, Health, cooldown, loot, route.
- Player-facing final copy can be toned by surface: immediate combat can be clear and urgent; notebook aftermath returns to names and consequence.
- Economy presenter records material/loot consequence separately from the boy-safety objective.
- Debug panel shows threat table, route state, resolver rolls, timers, and loot table events.

### Debug acceptance

- A fixture proves a wolf targets the boy, Kalev draws threat, and the boy reaches safety.
- A fixture proves Kalev can take damage and the event stream records cost.
- A fixture proves a killed wolf can produce a loot/material event when eligible.
- A fixture proves encounter objective is child safety, not kill count.
- All combat events use `SimEvent` and `OutcomeResolver`/combat table contracts from Slice 2.

## Cross-act notebook and progression seeds

| Seed | Source acts | Later meaning |
|---|---|---|
| Child trust/recognition | Water, Bread, Witness, Wolves | Bethany recognition/presence payoff. |
| Mother name/Witness | Water, Witness | Recollection and burden. |
| Bread ordinary mercy | Bread | Shows mercy through small acts under scarcity. |
| Tincture cost | Tincture, Witness | Apothecary learning and self-use consequence. |
| Protection | Wolves | Combat, risk, and mercy can coexist without splitting systems. |

## Acceptance

This slice is accepted when:

- All five acts have verbs, taught primitives, events, actor state, outcomes, UI/presenter outputs, notebook events, and debug acceptance.
- Act 2 uses bread.
- Act 4 is a fixed-outcome gravity encounter with meaningful mechanics.
- Act 5 is real combat with lethal/risky/lootable resolution and boy safety as objective.
- Each act names the substrate primitives it proves.
