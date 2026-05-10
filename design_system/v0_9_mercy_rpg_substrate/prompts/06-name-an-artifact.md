# Name-an-artifact prompt template

Status: active prompt template
Owner lane: any contributor / agent introducing a new artifact under `res://`
Dependencies: `design_system/v0_9_mercy_rpg_substrate/09-naming-conventions.md` (the canonical reference)
Use case: when a contributor or AI agent is about to create a new file, resource, scene, class, animation, signal, or game data ID and needs a project-conformant name without re-deriving the rules.

## How to use

Fill in the `[BRACKETS]` and submit to a model (Claude, GPT, Codex, or any LLM) that has read `09-naming-conventions.md`. Or run it as a self-check before committing the artifact. The output is a single proposed name plus a one-line rationale you can paste into a commit message.

## Prompt

```text
You are naming a new artifact for *Tincture of Mercy* — a combat-capable mercy RPG vertical slice in Godot 4.6 / C# / Forward+. Your job is to produce a single name (or path) that conforms to the project naming canon in `design_system/v0_9_mercy_rpg_substrate/09-naming-conventions.md`. Do not introduce a name outside the patterns documented there.

ARTIFACT TYPE
[Choose exactly one:]
[ ] sprite sheet (PNG)
[ ] concept reference (PNG, design-only)
[ ] tileset (PNG)
[ ] prop sprite (PNG)
[ ] UI element (PNG)
[ ] VFX (PNG)
[ ] audio SFX (OGG)
[ ] audio ambient (OGG)
[ ] shader (.gdshader)
[ ] resource (.tres) — specify subtype: SpriteFrames | ItemDef | LootTable | EncounterDef | ReceptivityProfile | AbilityDef | other
[ ] scene (.tscn) — specify subtype: character | encounter | act | other
[ ] C# class — specify: actor | system | data type | presenter | test
[ ] animation key (in SpriteFrames or AnimationPlayer)
[ ] custom signal (Godot signal)
[ ] verb ID (in SimEvent)
[ ] item ID (in ItemDef)
[ ] encounter ID
[ ] receptivity profile ID
[ ] aura ID
[ ] loot table ID
[ ] path ID or voice register ID
[ ] resource key (Health/Spirit/Steady/Burden/Pressure/Numbness or new)
[ ] node name (in scene tree)
[ ] input action

DESCRIPTION
[One sentence: what does this artifact do? What does it represent? When is it used?]

CONTEXT
- Active in act(s): [Act 1 Water | Act 2 Bread | Act 3 Tincture | Act 4 Mother death | Act 5 Wolves | post-opening | engine-wide | n/a]
- Domain (if applicable): [Care | Craft | Combat | Witness | Economy | Progression | Notebook | Debug]
- Related substrate primitive (if applicable): [SimClock | SimEvent | OutcomeResolver | AuraSystem | ActorState | DisparityService | AttentionThreatTable | AggroCallFleeRadius | Timer suite | Resource profiles | FSR/Vigil | AbilityDef/VerbDef | ItemDef/loot | Leash/route | Death/friction | Progression state | Notebook/presenters | n/a]
- Related character (if applicable): [Kalev | Lena | Mother | Boy | Wolves | other | n/a]

OUTPUT (return exactly this shape, nothing more)
1. Proposed name or path: <one string>
2. Category: <one word from the artifact-type list>
3. Why this name: <one sentence — cite the section of 09-naming-conventions.md you applied>
4. Blocked-legacy-pattern check: <PASS or list any blocked legacy patterns this name approaches>

CONSTRAINTS
- Filesystem and asset names: lowercase snake_case
- C# classes, methods, public fields, node names, enum types/values: PascalCase
- Godot signals, animation keys, item IDs, actor IDs, path IDs: snake_case
- Verb IDs, encounter IDs, aura IDs, loot table IDs: dotted snake_case (e.g. `care.water.use`, `opening.wolves_road`, `aura.tincture_calm`)
- Resource paths: always `res://`-rooted
- No introduction of: nora_field, bitterleaf, dr_bell, JetBrainsMono, ember_slot_8, quest_log, Pastoral (as active path), porridge (as active beat), combat_engine, care_engine, separate combat resolver
- v0.9 active terms: SimEvent, OutcomeResolver, Hesychasm, bread, paths, recognition, presence
- v0.8.1 P0 player-facing care vocabulary restrictions still apply to player-facing care surface copy (XP/level/quest/achievement → use Recollection/Vocation/path points/notebook entry on those surfaces; allowed as internal/debug identifiers everywhere)

If the artifact has a stable counterpart already in the project (an existing convention for similar items), prefer extending the pattern rather than inventing a new one.

If the proposed name would shadow or conflict with an existing identifier, flag it explicitly.
```

## Worked examples

These show how the prompt produces names. Use them as quick reference; do not copy verbatim — fill in your own context.

### Example 1 — A new audio cue for the wolf howl

**Input:**
```
ARTIFACT TYPE: [x] audio SFX (OGG)
DESCRIPTION: A wolf pack-call howl that plays when a wolf escalates threat by calling its pack.
CONTEXT:
- Active in act(s): Act 5 Wolves
- Domain: Combat
- Related primitive: AggroCallFleeRadius
- Related character: Wolves
```

**Expected output:**
```
1. Proposed name or path: res://audio/sfx/combat/wolf_pack_call.ogg
2. Category: audio SFX
3. Why this name: Filesystem snake_case, audio path under sfx/<category>/<sound>; Combat domain folder, Wolves character; descriptive sound name. Per 09-naming-conventions.md "Audio sfx" row.
4. Blocked-legacy-pattern check: PASS.
```

### Example 2 — A new animation row on the wolf sheet

**Input:**
```
ARTIFACT TYPE: [x] animation key (in SpriteFrames or AnimationPlayer)
DESCRIPTION: The wolf turns its head sharply on hearing a noise, before deciding whether to investigate or aggro.
CONTEXT:
- Active in act(s): Act 5 Wolves
- Related primitive: AttentionThreatTable
- Related character: Wolves
```

**Expected output:**
```
1. Proposed name or path: ear_prick
2. Category: animation key
3. Why this name: snake_case animation key, action-first verb without direction suffix because it's body-relative not world-relative. Per 09-naming-conventions.md "Animation names" row.
4. Blocked-legacy-pattern check: PASS.
```

### Example 3 — A new SimEvent verb when Kalev shoves a wolf away from the boy

**Input:**
```
ARTIFACT TYPE: [x] verb ID (in SimEvent)
DESCRIPTION: A combat verb fired when Kalev pushes a wolf away from the boy with his body, drawing or maintaining threat without using a weapon.
CONTEXT:
- Active in act(s): Act 5 Wolves
- Domain: Combat
- Related primitive: AttentionThreatTable
- Related character: Kalev
```

**Expected output:**
```
1. Proposed name or path: combat.protect.shove
2. Category: verb ID
3. Why this name: dotted snake_case verb ID, domain.subject.action grammar; protect subject reflects Kalev's silhouette discipline (not attack/strike); shove action describes the push_guard animation that backs it. Per 09-naming-conventions.md "Verb ID" row.
4. Blocked-legacy-pattern check: PASS.
```

### Example 4 — A new C# class for the threat table

**Input:**
```
ARTIFACT TYPE: [x] C# class
- subtype: system
DESCRIPTION: The data structure and methods that track threat values per actor, support target choice between Kalev and the boy, and emit threat-change events.
CONTEXT:
- Domain: Combat (also Care)
- Related primitive: AttentionThreatTable
```

**Expected output:**
```
1. Proposed name or path: TinctureOfMercy.Combat.AttentionThreatTable (file: scripts/systems/combat/AttentionThreatTable.cs)
2. Category: C# class
3. Why this name: PascalCase class name matches the substrate primitive name in 02-substrate-primitives.md exactly; namespace follows TinctureOfMercy.<Domain>; file path under scripts/systems/<system>/<ClassName>.cs. Per 09-naming-conventions.md "Class" and "Namespace" rows.
4. Blocked-legacy-pattern check: PASS — name does not approach combat_engine or care_engine blocked legacy patterns.
```

### Example 5 — A loot drop item

**Input:**
```
ARTIFACT TYPE: [x] item ID (in ItemDef)
DESCRIPTION: A rough wolf hide dropped when a wolf body is recoverable after combat. Used in later crafting (warmth, repair) and trade.
CONTEXT:
- Active in act(s): Act 5 Wolves
- Domain: Economy
- Related primitive: ItemDef / quality / loot hooks
- Related character: Wolves
```

**Expected output:**
```
1. Proposed name or path: wolf_hide_rough (file: data/items/wolf_hide_rough.tres)
2. Category: item ID
3. Why this name: snake_case item ID; <subject>_<material>_<quality> pattern matches 05-rpg-economy-progression.md item-quality table where "rough" is the default opening-slice wolf-material quality. Per 09-naming-conventions.md "Item ID" row.
4. Blocked-legacy-pattern check: PASS.
```

## When to skip the prompt

- The artifact is a near-clone of an existing one (e.g., another bedside patient sheet) — copy the existing name's pattern and just substitute the new character/subject.
- The artifact's name is forced by an external interface (e.g., Godot built-in node name like `AnimatedSprite2D`).
- You are renaming only — re-running the prompt won't help; consult `09-naming-conventions.md` directly to confirm the new form.

## Acceptance

This template is accepted when:

- A contributor unfamiliar with the project can produce a project-conformant name by filling in the BRACKETS.
- An AI agent can use the OUTPUT shape to produce a single, parseable proposed name.
- The five worked examples produce the names shown above when run against the canon.
