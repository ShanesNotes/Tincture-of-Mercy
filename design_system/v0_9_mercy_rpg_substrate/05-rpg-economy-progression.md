# Slice 5 — RPG Economy and Progression

Status: active slice spec
Owner lane: systems design + economy/progression
Authority level: active for v0.9 risk/reward, loot, itemization, and progression architecture
Dependencies: `02-substrate-primitives.md`, `03-opening-act-bible.md`, `04-latent-paths-receptivity.md`, ADR 0011
Maximum intended scope: architecture and tuning principles for opening-slice economy/progression; not final drop rates or full campaign balance
Source references: source substrate handoff, WoW research substrate notes, ADR 0008, ADR 0009, active user direction captured in `CONTEXT.md`
Validation gate: active specs allow normal RPG loops while keeping encounter objectives and event truth clear

## Core decision

The active v0.9 direction allows normal RPG mechanics where they fit the world: danger, damage, resources, loot, equipment, materials, quality, rarity, Witness/Recollection/Vocation/path points, and progression hooks.

Combat is first-class. It is not reduced to symbolic pressure. The shared substrate means combat, care, craft, economy, notebook, and aftermath produce interoperable events.

## Economy principle

Separate **encounter objective** from **material consequence**.

- In the wolf encounter, the objective is boy safety.
- If a wolf is killed or otherwise recoverable, loot/material consequence can follow from the event stream.
- Loot is not the definition of mercy or victory; it is part of the RPG economy.
- Tuning can shape farming, scarcity, danger, and pacing without erasing combat reward by doctrine.

## Allowed mechanics surface

| RPG source shape | Active use | Tincture framing |
|---|---|---|
| Soulslike gravity/friction | fixed-outcome teaching encounters, costly deaths, recovery friction, memory/burden | Mother death as gravity encounter; later death/friction can carry consequence. |
| WoW-shaped substrate | timers, threat, aggro, attack tables, resources, item quality, loot tables, progression hooks | Wolves, route pressure, care/combat timers, one event truth. |
| Diablo-shaped itemization | item quality, rarity, material consequence, loot tables, build/resource pressure | Grounded materials, equipment hooks, quality budget, not showered spectacle by default. |
| Narrative systemic encounters | authored fixtures, scripted rolls, recognition seeds, aftermath | Opening acts teach mechanics while preserving story gravity. |

## Reward and progression channels

| Channel | Source events | Purpose | Opening-slice examples |
|---|---|---|---|
| Loot/material | `loot.*`, `combat.wolf.death_or_flee`, gather events | Items, materials, crafting/equipment hooks. | wolf hide/tooth/sinew/meat per tuning; bread/food economy. |
| Equipment | item/equip events, quality tags | Later build expression and survival preparation. | simple protective wrap/knife/tool hooks if scoped later. |
| Witness | death/protection/presence events | Carries consequence and theological/narrative memory. | mother death, boy protected. |
| Recollection | notebook/witness/path events | Later recognition, memory, and payoff projection. | Bethany recognition seeds. |
| Vocation/path points | path-tagged events | Growth in Apothecary/Hesychasm/Iconographic attention. | bread care, keeping watch, image read, protection. |
| XP-style progression | event-derived progression projection where scoped | General RPG growth accounting if a surface needs it. | debug/internal accounting first; player-facing copy may use world terms. |
| Economy friction | resource spend, scarcity, cooldown, wounds | Prevents shallow repetition from dominating. | limited bread, tincture costs, FSR/Vigil cooldown, wolf danger. |

## Loot/material rules

1. Loot/material outcomes derive from events.
2. A loot table is scoped by source, context, world state, and eligibility.
3. Quality and rarity are allowed architecture terms; player-facing text can map them into tactile language where needed.
4. A killed wolf may produce useful material consequence when the world supports it.
5. A fled or leashed wolf can withhold material consequence while still resolving the encounter.
6. Loot eligibility should be visible in debug and traceable to `SimEvent`.

Illustrative loot event:

```json
{
  "domain": "Economy",
  "verb_id": "loot.wolf.material",
  "actor_id": "kalev",
  "target_id": "wolf_01",
  "source_event": "combat.wolf.death_or_flee",
  "fields": {
    "loot_table": "opening.wolf.materials",
    "item_id": "wolf_hide_rough",
    "quality": "rough",
    "rarity": "common",
    "quantity": "1",
    "eligibility": "body_recoverable"
  },
  "tags": ["combat_reward", "material", "world_grounded"]
}
```

## Item quality and rarity

Use quality/rarity to support risk/reward, crafting, equipment, and later progression. Keep player-facing wording appropriate to surface.

| Internal term | Possible player-facing mapping | Notes |
|---|---|---|
| poor | torn, fouled, cracked | Useful for gritty salvage. |
| rough | rough, usable, smoke-stained | Good default for opening wolf material. |
| sound | sound, clean, kept | Strong ordinary quality. |
| fine | well-cut, steady, close-grained | Earned, not flashy. |
| rare | uncommon, hard-won, marked | Use carefully on world surfaces. |
| legendary/epic-style tier | named relic, remembered thing, singular piece | Allowed architecture concept later; presentation should fit the game. |

## Progression accounting

Progression should be event-derived and inspectable.

### Witness

Witness accrues from being present to irreversible events, deaths, protection, and aftermath. It is not only a reward; it can be burden and memory.

Event sources:

- `death.mother`
- `witness.kalev`
- `progression.protection`
- later deaths, rescues, losses, and commemorations

### Recollection

Recollection tracks later-returning memory and recognition hooks.

Event sources:

- `notebook.write_name`
- `presence.speak_name`
- `care.bread.offer`
- `progression.recollection_seed`
- `notebook.aftermath`

### Vocation/path points

Path points are growth in attention and practice. They can unlock readings, reduce costs, change receptivity fit, or expose new verbs.

Event sources:

- Apothecary: bodily care, craft, dosing, wound work, food/water attention.
- Hesychasm: presence, keeping watch, speaking names, bearing death, protecting at cost.
- Iconographic: image reading, threshold recognition, page marks, symbolic arrangement.

### XP-style projection

If a future implementation needs familiar RPG accounting, XP-style values can be internal or debug-facing projections over events. Player-facing surfaces should use the register that fits the moment: notebook, recollection, vocation, practice, wound, burden, material, or named memory.

## Tuning levers

Tuning levers are allowed when they solve balance, pacing, or tone problems. They should be written as scoped rules.

| Tuning need | Lever | Good framing |
|---|---|---|
| Avoid shallow farming dominance | diminishing returns, scarcity, danger, time pressure, patrol changes | "This route's wolves stop producing useful hide after the body is spoiled or the pack scatters." |
| Keep protection objective central | objective reward separate from loot | "Boy safety resolves the encounter; loot is a material consequence." |
| Prevent infinite safety | wounds, cooldowns, pressure, route risk, leash/call behavior | "Repeated fighting raises danger and cost." |
| Keep care meaningful | attention/resource opportunity costs | "Time spent looting may affect the next bedside beat." |
| Preserve notebook tone | presenter mapping | "Debug may show XP; notebook records names and burdens." |

## Opening wolf loot examples

| Material | Source condition | Use |
|---|---|---|
| Rough hide | wolf body recoverable, time to gather | later wrap, trade, repair, warmth. |
| Sinew | successful gather with tool/time | binding, craft component. |
| Tooth/claw | rarer drop or deliberate gather | charm, tool, trade, later icon/object tension. |
| Meat | context-dependent and risky | food scarcity, disease/spoilage tuning, moral/practical tension. |
| Blood/wound risk | combat aftermath | care cost, infection/danger hooks. |

## Economy and care interaction

RPG economy should intensify care rather than replace it:

- Looting takes time and attention.
- Materials can enable later care or survival.
- Combat wounds create care needs.
- Bread, water, tincture, and wolf materials all use the same inventory/event accounting.
- Notebook aftermath can record the cost of taking or leaving materials.

## Validation examples

| Test/review | Expected result |
|---|---|
| Wolf killed and body recoverable. | `combat.wolf.death_or_flee` followed by eligible `loot.wolf.material`. |
| Wolf flees after boy safe. | Encounter resolves; loot may be absent because no body/material was recoverable. |
| Kalev loots while hurt. | Time/pressure/wound events continue; next care beat can be affected. |
| Debug progression projection reads events. | Witness/Recollection/path points derive from source events, not manual scene flags. |
| Care UI reads material consequence. | Player-facing notebook can mention rough hide or bloodied cloth without turning the notebook into a score sheet. |

## Acceptance

This slice is accepted when:

- Combat supports normal RPG risk/reward, including loot/material and progression consequences.
- Kill/combat rewards, care rewards, exploration rewards, and Witness/Recollection all use event-derived accounting.
- Economy tuning is framed as balance/scarcity/pacing, not moralized combat demotion.
- Wolves can produce useful material consequence when world-grounded.
- Encounter objective and reward economy are distinct.
