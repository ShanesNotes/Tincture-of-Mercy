<!-- STATUS: historical/source packet. Current implementation language is C#/.NET per README and design_system/v0_8_1/canonical_locks_v0_8_1.md; any GDScript-first guidance below is superseded. -->

# TINCTURE OF MERCY: THE GARMENTS OF SKIN
## Unified Prototype Design Packet v0.6

**Artifact type:** Markdown design packet for prototype design and development handoff.
**Primary use:** Attach to a Claude instance (Claude.ai, Claude Code, or API) as the unified source for prototype design and engineering artifacts.
**Output focus:** Design, scope, systems, narrative, UI/UX, art direction, production planning, and Godot-targeted implementation specifications. Code is in scope when implementation begins; this packet is the source the code is built from.
**Version status:** v0.6 supersedes v0.5 for prototype handoff. v0.3 remains the canonical deep-lore foundation. v0.6 corrects three things: it stops actively demoting the notebook (the crafting loop is described positively without the demoting frame), it scopes the “no code” language to the current pass rather than declaring it permanent, and it adds Godot 4.x vocabulary so design language translates directly into engine concepts.

---

## 0. Versioning and source hierarchy

### Source hierarchy

1. **v0.6 Unified Prototype Design Packet** — current source for prototype design, development handoff, and Claude instances.
2. **v0.3 Working Document** — canonical deep lore, story, symbolic architecture, cast, and four-phase pilgrimage.
3. **Prior v0.4 / v0.5 scaffolds** — historical only.

### What changed in v0.6

- **Crafting is presented as the central playable mechanic** without recurring framing of what is *not* central. The notebook is described positively in its own role.
- **Code framing is corrected.** This packet is a design pass; subsequent passes produce code. Claude is fully capable of writing GDScript, C#, and shaders for Godot 4.x — that work is scheduled, not forbidden.
- **Godot 4.x vocabulary is integrated** in a new Section 33 so every design concept maps to a node, scene, resource, or asset. This makes the packet directly actionable in Claude Code or any Godot workflow.
- **Claude capabilities are described accurately** in Section 26, including Claude Code, Godot-specific Claude skills already in the wild, the frontend-design skill for UI mockups, and the API for any custom tooling.
- **Reference visuals are kept as principle sources, not imitation targets.** Same as v0.5.

---

# 1. One-page vision

## Working title

**Tincture of Mercy: The Garments of Skin**

## Genre

A 2D top-down narrative survival-care pilgrimage game with therapeutic crafting, triage, symbolic UI, and branching moral consequence.

## Short description

In post-Turn Michigan, a wounded healer named Kalev Ward travels north through rot, hospital ruin, false safety, and lake fog. He forages, scavenges, crafts medicines, treats the sick, bears grief, and decides when medicine is mercy and when it becomes Strange Fire. The journey begins in the Ironwood and bends toward Wittehaven, the Mackinac, Mount Arvon, and Paradise — where the names were already known.

## Player fantasy

The player is a **burdened healer-apothecary**.

You walk into places where people have stopped asking why. You gather what can still be gathered. You clean cloth. You boil water. You grind bitter leaves. You prepare tinctures, dressings, draughts, compresses, washes, and dangerous stabilizers. You sit with the dying. You decide whether to spend the rare medicine now, save it for someone else, or use it on yourself so your hands will stop shaking.

The fantasy is not power. The fantasy is **attention under pressure**.

## Visual north star

> A cold Michigan pilgrimage rendered as a damaged sacred manuscript: playable in simple top-down pixel art, revealed through icon panels, patterned water, hospital-white false mercy, hand-lettered names, medicine pouches, cedar, wet paper, and gold that appears only when something eternal presses through.

## Prototype thesis

The first prototype proves this loop:

> **Travel → forage/scavenge → craft therapeutics → triage/treat → choose medicine/presence/Ember → bear consequence → record name or recovery → rest → move north.**

The notebook is the record layer running alongside the loop, surfacing names, outcomes, and consequence. It does not have to dominate gameplay to do its work.

---

# 2. Non-negotiable design pillars

These are project law. Every prototype artifact must preserve them.

## 1. Names over metrics

Every major system contrasts personal names with institutional abstractions.

- Kalev’s notebook says: *this person was not lost to the spreadsheet.*
- Halloway’s Iron Ledger says: *this person was an outcome.*
- The Church register says: *this person was never yours to preserve alone.*

Every system should ask whether the player is attending to a person or reducing a person to a case.

## 2. Medicine works but cannot redeem

Medicine is not false. Treatment is not false. Crafting is not false. The Hospital saves lives. Herbs help. Dressings help. Stabilizers help. Protocols prevent chaos.

The falsehood is the **worship of treatment**: the belief that enough correct procedure can abolish mortality, grief, guilt, or the need for mercy.

This is why crafting must be strong. If medicine is weak, the moral problem collapses. The player must believe in the medicines they make.

## 3. Ember must be tempting

Ember works. It relieves Pressure. It steadies the hands. It makes hard tasks easier. It can help a patient. It can also become Strange Fire when Kalev uses it to bypass the burden he was meant to bear.

If players do not want to use Ember, the design has failed.

## 4. Wittehaven must first feel like relief

Wittehaven has clean sheets, warm food, working stores, locked doors, and someone else taking responsibility. Its systems save people. The critique works only if the player understands why people chose it.

The Ironwood is rough, improvised, hand-made care. Wittehaven is clean, sanctioned, efficient care. Both work. Only one worships itself.

## 5. The enemy is FIRST not flesh and blood

Human antagonists are plausible, wounded, and partially right. Halloway is right about some things. Protocols did save children. Metrics did prevent chaos. The evil is letting structure define mercy.

The prototype should not train the player to hate people. It should train the player to discern spirits, systems, compulsions, fears, and false mercies — *first*, before any hostile body appears on screen.

> **Post-P0 expansion clause** *(v0.8.1):* combat layers, antagonists, and bosses are **open** for design in later phases (Wittehaven enforcers, Iron Ledger inquisitors, scavenger crews). When they are added, they must extend the moral grammar established here — never replace it. Discernment of spirits remains the foundation; flesh-and-blood enemies become one surface among several.

## 6. Crafting BEGINS as care, not loot optimization

Crafting must feel like an act of care performed under scarcity and uncertainty.

In the prototype, the player is not crafting swords, armor, furniture, or profit goods. The player is preparing therapeutic things for named human beings whose symptoms, bodies, histories, and fears matter.

Crafting should be tactile, slow enough to feel intentional, simple enough to prototype, consequential enough to matter, and morally entangled with triage, fatigue, and trust.

> **Post-P0 expansion clause** *(v0.8.1):* tiered crafting, professions (apothecary / herbalist / scavenger), recipe progression, and rarity grades are **open** for design in later phases. When they are added, the cedar pouch and the Tincture Wheel remain care-coded; new progression surfaces get their own UI. Care is not retrofitted with tiers; tiers are layered above care.

---

# 3. Platform and visual decision

## Engine

**Godot 4.x (current stable: 4.3+).**

Reasoning:

- The P0 prototype needs custom systems built around care, not a pre-built RPG combat template; later phases may layer in RPG/combat systems on top of the contemplative core.
- Strong 2D support, flexible UI, free and open-source.
- Multiple mature Claude-Godot skill sets already exist (see Section 26) for AI-assisted implementation.
- **Historical note:** this v0.6 packet originally suggested GDScript-first. Current project canon supersedes that: use C#/.NET for engine implementation.

## Visual format

**2D top-down pixel art.**

“Stardew-like” is acceptable shorthand for production scope only:

- readable top-down exploration;
- human-scale tiles and interiors;
- modest production scope;
- simple character movement;
- small maps.

“Stardew-like” is **not** the visual reference for tone, palette, cozy emotional grammar, farming systems, rounded social-sim UI, bright saturation, or cute village fantasy.

## Visual target

> **Orthodox-apocalyptic Michigan pixel iconography.**

A top-down pilgrimage embedded inside a damaged sacred manuscript.

### Visual references

Three reference images accompany this packet for art-direction passes:

1. `cosmic-image-in-color-jonathan-pageau.jpg` — cosmic crucifix/tree/flood/island reference.
2. `noah-and-the-cosmic-flood-in-color-jonathan-pageau.jpg` — ark/flood/cosmic water reference.
3. `st-george-killing-the-dragon-jonathan-pageau.jpg` — framed saint/dragon/icon-panel reference.

These are principle sources, not imitation targets. Extract:

- flat symbolic composition;
- strong contour line;
- icon-gold fields;
- patterned water as chaos and threshold;
- framed panels and manuscript borders;
- dragons/serpents/beasts as symbolic pressure, not monster-combat enemies;
- layered vertical cosmology;
- sacred action as stylized rather than cinematic;
- dense symbolic geography.

### Art-direction safety

Do not instruct artists or agents to copy a living artist’s style. Use this formulation:

> Draw from Orthodox iconography, apocalyptic manuscript illumination, folk religious art, medieval symbolic composition, flat-color linework, patterned borders, and contemporary sacred illustration.

The project’s style phrase:

> **Michigan icon-manuscript pixel art.**

---

# 4. The game in one playable sentence

The player travels through post-Turn Michigan as Kalev Ward, gathering and crafting therapeutic materials to treat named people while managing Burden, Pressure, Numbness, scarce Ember, and the temptation to reduce care into protocol.

---

# 5. Core loop

## Primary loop

1. **Travel** to a cabin, road camp, sickroom, clinic, abandoned store, forest stand, or settlement.
2. **Observe** the environment and the person in need.
3. **Forage or scavenge** materials: herbs, cloth, water, fuel, jars, oil, salt, honey, salvage medicine, tools.
4. **Identify** what is usable, spoiled, risky, sanctioned, folk, or unknown.
5. **Craft therapeutics** using simple but meaningful preparation choices.
6. **Triage and treat** through procedure, medicine, warmth, presence, prayer, or Ember.
7. **Observe response** and decide whether to spend more, wait, comfort, move on, or risk a stronger intervention.
8. **Bear consequence** through Burden, Pressure, Numbness, relationship trust, supply loss, or a name written.
9. **Record** the event in the notebook: name, recovery, death, dose, mistake, memory.
10. **Rest or move north.**

## Secondary loops

### Supply loop
Forage → clean/preserve → craft → use → deplete → decide what cannot be replaced.

### Care loop
Assess → prepare → treat → watch → adjust → accept limits.

### Moral loop
Can I help? → What will it cost? → Am I treating the person or controlling the outcome? → What am I becoming as I choose?

### Relationship loop
Attend to companions → ignore them under optimization pressure → lose trust or presence → encounter consequences.

### Naming loop
Learn name → treat person → risk reducing them to case → record name or recovery → carry memory.

---

# 6. Crafting as the central mechanic

## Design thesis

Crafting is the playable expression of the title. A tincture is not merely an item — it is a worldview in a bottle: extraction, concentration, preservation, the attempt to make mercy portable.

The crafting system should let players feel the difference between:

- **careful preparation** and anxious optimization;
- **medicine** and magical thinking;
- **sanctioned protocol** and folk attention;
- **relief** and redemption;
- **enough help** and the impossible desire to save everyone.

## What crafting feels like

Tactile. Slightly slow. Warm or cold depending on context. Limited by tools and time. Connected to bodies, symptoms, and place. Emotionally charged because each crafted thing may be used on a person the player has just met.

## What crafting must avoid

Generic inventory math. Profit economy. Minecraft-style free construction. Cozy farming production chains. Realism-heavy medical simulation. A puzzle with one perfect answer per patient.

## Fictionalization rule

The game draws emotional texture from critical care, folk remedies, hospital language, and apothecary imagery. Recipes remain fictionalized and symbolic. This is not a medical instruction game.

---

# 7. Crafting vocabulary

## Folk pouch list

Kalev’s pouch list in the folk register:

> Pulseleaf, Arbor, Acebark, Phrine, Cillin, Zyl, Honey, Cedar, Wool, Cotton, Salt, Myrrh, Oil, Furos, Ember.

## Wittehaven shorthand

In Wittehaven and sanctioned medical spaces:

> LOL, ARB, ACE, PHRINE, CILLIN, ZYL, FUROS, E-7.

The same materials, recategorized as abbreviations, stocks, doses, and protocol entries.

## Therapeutic forms

| Form | Description | Possible uses |
|---|---|---|
| Draught | drinkable preparation; slow, bodily, warming | fever support; calming tremor; helping sleep; easing thirst; making a patient willing to speak |
| Tincture | concentrated preparation; portable, potent, dangerous if over-relied | rapid symptom relief; pressure reduction; stabilizing breath or pulse; risky interventions |
| Poultice | plant/cloth applied to body; slow and intimate | swelling; wound discomfort; warmth; symbolic care |
| Dressing | cloth, wash, binding, sometimes oil/honey/salt | wounds; skin lesions; bleeding; infection risk; restoring dignity |
| Wash | clean water, salt, heat, cloth, care | cleansing; reducing contamination; preparing a body or bed; Wittehaven protocol contrast |
| Compress | warmth or cold through cloth | fever; shaking; pain; presence scenes |
| Salve | oil-bound preparation; slower, preserving, fragrant | skin; wounds; ritual resonance; Lena’s care style |
| Stabilizer | high-risk preparation | acute breath crisis; severe pressure; Wittehaven protocols |
| Ember dilution | not freely craftable in prototype; preparation/dilution/administration possible | Pressure relief; patient stabilization; moral hazard |

---

# 8. Ingredient roles

| Ingredient | Register | Prototype role | Emotional function |
|---|---|---|---|
| Pulseleaf | Folk herb | calming pulse / fever support | first forage tutorial |
| Cedar | wood / scent / memory | focus, warmth, pressure support | ties to cedar dog and memory |
| Cotton | cloth | dressing base | dignity and care |
| Wool | cloth / warmth | compress, warmth | survival, human touch |
| Salt | mineral | wash / preservation | cleanliness, sting, covenant undertone |
| Honey | food / binding | soothing, dressing, trust | sweetness in a bitter world |
| Oil | carrier | salve, anointing echo | practical and sacramental edge |
| Myrrh | resin | salve, burial echo | healing and death together |
| Cillin | salvage medicine | infection support | old-world medical remnant |
| Phrine | emergency agent | acute breath/pulse support | powerful, risky, scary |
| Furos | salvage medicine | fluid/breath complications | scarce old-world precision |
| Ember | rare vial | pressure relief / stabilizer | mercy or Strange Fire |

The first prototype uses no more than 6–8 ingredients actively.

## Ingredient attributes

Each material has 3–5 simple attributes:

- **Potency** — strength of therapeutic effect.
- **Stability** — how long the crafted item lasts.
- **Purity** — how safe or clean it is.
- **Warmth** — how much it supports comfort, trust, and bodily presence.
- **Risk** — chance of side effects, rebound, or spiritual/relational cost.

The prototype may use only two or three.

---

# 9. Crafting operations

| Operation | Description | Prototype use |
|---|---|---|
| Clean | remove dirt, rot, contamination | required for dressings/washes |
| Grind | break down herb or resin | increases potency, may reduce stability |
| Steep | combine with warm water | creates draughts and washes |
| Bind | combine with cloth/oil/honey | creates dressings/poultices/salves |
| Warm | use fire/body heat/time | increases comfort, costs time/fuel |
| Seal | jar, wrap, or preserve | improves stability |
| Dilute | reduce potency/risk | essential for Ember-related choices |
| Administer | give or apply to patient | treatment moment |

## Time as a resource

Time is a crafting cost. A medicine may be better if prepared carefully, but a patient may worsen while Kalev prepares it. Example choice:

- Make a rough compress now.
- Spend time making a better draught.
- Use Ember immediately.
- Sit with the patient and do nothing else.

The player is choosing between **attention, preparation, and urgency**.

---

# 10. Recipe design

## Recipe shape

```text
Recipe name:
Therapeutic form:
Ingredients:
Operations:
Primary use:
Secondary effect:
Risk:
Time cost:
Narrative note:
Prototype status:
```

## Example prototype recipes

### Clean Dressing

```text
Therapeutic form: Dressing
Ingredients: Cotton or Wool + Salt Wash + optional Oil
Operations: Clean → Bind
Primary use: wound care / dignity / contamination reduction
Secondary effect: increases patient trust if applied gently
Risk: low
Time cost: low to medium
Narrative note: the simplest form of care; not heroic, but essential
Prototype status: include
```

### Pulseleaf Draught

```text
Therapeutic form: Draught
Ingredients: Pulseleaf + clean water + optional Honey
Operations: Clean → Steep → Administer
Primary use: fever support / calming / patient comfort
Secondary effect: may allow a short dialogue line from a fading patient
Risk: low if prepared cleanly; reduced effect if rushed
Time cost: medium
Narrative note: first tutorial craft from foraged material
Prototype status: include
```

### Cedar-Wool Compress

```text
Therapeutic form: Compress
Ingredients: Wool + warm water + Cedar shaving or scent
Operations: Warm → Bind → Administer
Primary use: tremor, fear, bodily warmth, Pressure support
Secondary effect: may reduce Kalev's Pressure slightly if he pauses with the patient
Risk: low; costs time
Time cost: medium
Narrative note: care that is nearly presence; Lena respects this recipe
Prototype status: include
```

### Bitter Phrine Tincture

```text
Therapeutic form: Tincture / stabilizer
Ingredients: Phrine + carrier + clean vial
Operations: Dilute → Seal → Administer
Primary use: acute crisis support
Secondary effect: buys time, but may increase later instability
Risk: medium to high
Time cost: low if prepared ahead; dangerous if improvised
Narrative note: the first recipe that teaches that "works" does not mean "redeems"
Prototype status: include only if the slice needs an acute intervention
```

### Ember Dose

```text
Therapeutic form: Rare stabilizer / pressure bypass
Ingredients: Ember vial; optional dilution medium
Operations: Dilute or direct administer
Primary use: immediate Pressure relief or patient stabilization
Secondary effect: converts Pressure into Numbness when self-used
Risk: high moral/mechanical consequence if repeatedly self-used
Time cost: immediate
Narrative note: should feel like relief before it feels like accusation
Prototype status: include as scarce; not craftable in prototype
```

---

# 11. Crafting interface — the Tincture Wheel

The earlier pi-chart concept folds into crafting. The player’s formulation interface is a circular diagnostic/crafting wheel.

> **Working name: The Tincture Wheel.**

## What the wheel does

Helps the player balance a crafted therapeutic across readable dimensions. For the prototype, four dimensions are sufficient:

1. **Relief** — how much it helps symptoms.
2. **Stability** — how safe/lasting it is.
3. **Warmth** — how much it supports presence/trust.
4. **Risk** — how much it may harm, numb, or rebound.

Every recipe has a shape. The player learns recipes by their shape, not by memorizing tables.

## Moral UI contrast

The same wheel changes across regimes.

### Ironwood version
Hand-drawn. Smudged graphite. Imperfect wedges. Material names handwritten. Tactile and humble.

### Wittehaven version
Clean, exact, blue-white. Case IDs. Sanctioned abbreviations. Protocol compliance scores. Seductive readability. The wheel becomes a control dashboard.

### Paradise version
No longer about optimization. Icon-like, still, name-centered. Fewer controls, more recognition.

---

# 12. Triage and treatment system

## Design thesis

Treatment is a sequence of attention, not a minigame of perfect clicks.

The player asks: What is happening to this person? What can I make with what I have? How much time do I have? Am I preserving life, easing passage, or avoiding my own helplessness? What does this person need besides intervention?

## Patient state model

```text
Name:
Case label, if Wittehaven:
Primary condition:
Visible symptoms:
Hidden need:
Trust:
Urgency:
Response to warmth/presence:
Response to crafted therapeutics:
Response to Ember:
Risk of death:
Narrative outcome:
```

## Treatment verbs

| Verb | Meaning | System role |
|---|---|---|
| Observe | look, listen, ask | reveals symptoms and name clues |
| Prepare | craft or ready supplies | converts resources into care |
| Administer | use therapeutic | changes patient state |
| Sit | presence without procedure | lowers fear, may raise Kalev’s Burden |
| Pray | non-optimizable attention | should not be a buff; use sparingly |
| Warm | blanket, compress, fire | stabilizes comfort/trust |
| Wash | clean body, tools, cloth | dignity and infection prevention |
| Write | record name/outcome | memory, save/log, consequence |
| Leave | move on | sometimes necessary, always costly |

## No perfect triage

Patients sometimes die without player failure. Otherwise the game becomes a fantasy of perfect control.

The design distinguishes:

- preventable death;
- unpreventable death;
- peaceful death;
- prolonged dying caused by over-treatment;
- recovery with cost;
- recovery that produces new ethical complications.

---

# 13. Burden, Pressure, and Numbness

The Grey Stone is a three-state model.

### Burden
The true weight of love, grief, and responsibility. Not evil. Cannot be cured. Bearing it is part of Kalev’s work. Often increases when the player truly attends to a person.

### Pressure
The dangerous overload that impairs Kalev. Shaking hands; narrowed perception; slower crafting; missed signs; poor sleep; harsh dialogue. Mechanically dangerous.

### Numbness
The Ember-induced bypass. Steadier hands; faster performance; less felt pain; narrowed dialogue; faces and names blur; easier to reduce patients to cases.

**Ember does not remove Burden. It converts Pressure into Numbness.**

## Crafting connection

- High Pressure: slower preparation, more mistakes, trembling, resource waste.
- Moderate Burden: clearer attention to names and hidden needs.
- High Numbness: efficient crafting, less warmth, higher chance of case-language, fewer relational cues.

The player should experience the temptation:

> *I can craft better if I take Ember.*

That is the system working.

---

# 14. Ember / Strange Fire

## What Ember is

A rare, potent stabilizer and pressure-relief substance. Used mercifully on a patient, or as Strange Fire when used to bypass suffering, guilt, or the need for dependence.

## Mechanical effects

**On Kalev:** reduces Pressure immediately; increases Numbness; improves short-term crafting/treatment performance; narrows perception of names, relational cues, and moral nuance; can create dependence on efficient bypass.

**On a patient:** can stabilize an acute crisis; can buy time; can ease suffering; may create later complications; may be the correct merciful use.

## Design rule

Ember is not evil. The same substance can be mercy or Strange Fire depending on intention, context, and use.

## Prototype scarcity

In the first prototype, Ember is scarce and not craftable. The player may prepare/dilute/administer it but not manufacture more. Wittehaven later introduces E-7 synthesis or sanctioned refinement, which feels seductive and dangerous.

---

# 15. The notebook

## What the notebook is

- a diegetic journal;
- a record of names;
- a save/checkpoint metaphor;
- a consequence surface;
- the place where the player sees whether they remembered a person as a person.

## Prototype use

In the Cabin/Bethany slice, the notebook does a small, exact set of things:

- records the cabin boy’s name;
- optionally records a patient’s name after care;
- shows a short note about what was crafted or administered;
- serves as a rest/checkpoint marker;
- shows the difference between “name” and “case.”

The notebook’s deeper structural arc — Mackinac loss, Birdie’s return, the page-77 entry, the priest’s register — belongs to later phases. The prototype proves the *register principle* without building the full architecture.

---

# 16. Narrative foundation for prototype

## Protagonist

### Kalev Ward
Healer. 33. Once a critical-care nurse before the Turn. Wife dead. Children taken by the State during early containment. Carries a leather notebook, a cedar dog carved by his son, a medicine pouch, and a vial of Ember.

His name carries Caleb/Cain tension:

- Caleb: faithful spy, one who enters the promised land, wholehearted dog.
- Cain: marked wanderer, brother-keeper question, fugitive.

Kalev tries to treat salvation like a clinical problem. He believes if he bears enough names and performs enough care, the ledger might balance.

## Early companions

### Birdie / Ruth
A strange, practical child encountered in the Ironwood. Kalev tries to buy her off with an apple. She refuses and follows. Birdie is not cute as a design function; she is inconvenient, hungry, observant, and unclassifiable. Her true name is Ruth, revealed late.

### Lena Hart
A healer of presence, introduced in or near Bethany. She does not reject medicine. She rejects the use of medicine to bypass grief and dependence. She repairs gloves obsessively. She sees what Kalev is doing before he can name it.

## Later figures (preserve, not prototype first)

### Director Cornelius Halloway
Magistrate of Health and Continuance in Wittehaven. Not snarling. Hollow. Partly right. Keeper of the Iron Ledger.

### Rafe Carver
Icon-carver, hermit, hidden Raphael/Melchizedek figure. Encountered structurally at Mount Arvon. May appear earlier as rumor or roadside sign.

---

# 17. World foundation

## Setting

Post-Turn Michigan. Damp, cold, late fall. Wet wool, iodine, rotting pine, rusted trusses, lake wind, weak light, old roads, cabins, hospital remnants, cedar, abandoned stores, improvised clinics.

## The Turn / The Withering

Not a zombie plague. Takes breath and reaches past breath toward apathy. The horror is people losing the will to ask why, losing names, becoming less narratively available.

Infected or fading people do not become monsters. They become quieter, dimmer, harder to reach, less able to say what they love.

## Location arc

1. **The Ironwood** — raw, rotting, alive, watching.
2. **Bethany** — first town, three sick, one the doctor.
3. **Wittehaven / Whitewash** — false haven, clean protocols, Continuance Hospital.
4. **The Mackinac** — bridge threshold, loss of notebook, final Ember choice.
5. **Mount Arvon** — Rafe Carver, mountain of instruction.
6. **Paradise** — bright church, register of names, graveyard recognition.

Prototype only requires:

- Cabin;
- short Ironwood road segment;
- small Bethany sickroom / clinic / house;
- campfire/rest screen.

---

# 18. Phase roadmap

The alchemical structure (Nigredo / Albedo / Citrinitas / Rubedo) is author scaffolding. Never player-facing terminology.

## Phase I — Ironwood / Bethany (prototype territory)

- Cabin seed scene.
- First name written.
- Ember self-use temptation.
- Forage Pulseleaf.
- Birdie apple refusal.
- Bethany: three sick, one doctor.
- Lena enters.
- Player crafts first meaningful therapeutics.
- Road bends toward Wittehaven.

## Phase II — Wittehaven (future)

- Relief first.
- Clean sheets, warm food, sanctioned medicine.
- Protocol integration.
- Birdie foster classification.
- Hospital UI seduction.
- Iron Ledger trial generated from player behavior.
- Exile outside the camp.

## Phase III — Straits / Mackinac / Arvon (future)

- Vial nearly empty.
- Pivotal Ember choice with former Office of Continuance official tied to Kalev’s children.
- Notebook lost during wife-name attempt on bridge.
- Bridgekeepers.
- Rafe Carver at Mount Arvon.

## Phase IV — Paradise (future)

- Bright church, not sterile.
- Names already known.
- Kalev’s name written by another hand.
- Birdie/Ruth returns.
- Wife’s name written at page 77, line 7.
- Graveyard recognition.
- Endings vary recognition, not reward.

---

# 19. Prototype vertical slice

## Target name

**Cabin/Bethany Slice**

## Purpose

Prove the game’s core identity before expanding map, lore, or systems.

The slice proves that therapeutic crafting, treatment, Pressure/Numbness, names, and companion attention can create emotional gameplay without combat, farming, or a large town.

## Slice boundaries

**Start:** Kalev inside the cabin with the dying boy.
**End:** Kalev leaves Bethany after treating the three sick, with the road bending toward Wittehaven.

## Required scenes

### Scene 1 — Cabin death
Establish tone, Turn, Grey Stone, notebook, cedar dog, Ember temptation. Observe patient; perform one futile or comforting care action; write name; feel Pressure; choose whether to self-use Ember. Crafting minimal or none.

### Scene 2 — Ironwood road forage
Teach gathering and material recognition. Walk short path; find Pulseleaf or other material; choose clean harvest vs quick harvest; encounter weather/rot; maybe find Cotton/Wool/Salt salvage. First simple preparation: Pulseleaf Draught or Clean Dressing component.

### Scene 3 — Birdie and the apple
Establish Birdie as inconvenient witness, not cute mascot. Dialogue; offer apple; she refuses and follows; player cannot optimize her away. Birdie may notice an ingredient Kalev missed or misname a plant, forcing player attention.

### Scene 4 — Bethany arrival
Introduce community care stakes. Meet Bethany residents; learn there are three sick, including the doctor; choose treatment order; supplies limited. Prepare at least two therapeutics before or between patients.

### Scene 5 — Bethany triage
Prove care-crafting loop. Three patients: a child or elder needing warmth/presence more than intervention; a fevered patient who benefits from crafted draught/dressing; the village doctor whose condition forces a hard choice. Triage order matters; crafted therapeutics matter; Ember is tempting but not mandatory; one outcome may be unavoidable; Lena’s presence reframes the player’s choices.

### Scene 6 — Lena’s introduction
Show the alternative to bypass. Lena treats or comforts someone with presence and practical skill; she notices Kalev’s vial or his avoidance; she does not moralize too early. Lena may teach or improve a recipe (compress/salve/dressing).

### Scene 7 — Rest / notebook / road north
Close the slice with consequence. Review supplies; see names/recoveries in notebook; see Pressure/Numbness state; Birdie remains or waits outside; road points toward Wittehaven. Player prepares one item for the road, showing forward planning.

## Slice success criteria

The slice succeeds if a tester can say:

- I understand that crafting medicine is central.
- I wanted to use Ember.
- I understood why using Ember might be dangerous without being told it is evil.
- I cared about at least one patient by name.
- I felt that time, supplies, and attention were all scarce.
- I understood that this is not a combat game.
- I want to see Wittehaven because it sounds like relief.

---

# 20. Art direction

## Visual thesis

*Tincture of Mercy* should look like Michigan after the Turn rendered as a broken sacred manuscript.

Surface world: cabins; rot; lake wind; hospital beds; cedar; bridge steel; patched coats; wet boots; old roads; weak light.

Symbolic layer: halos; borders; patterned water; symbolic beasts; hand-lettered names; flat color fields; impossible threshold compositions.

## Hybrid 2D visual model

### A. Playable exploration layer
- top-down or three-quarter top-down pixel art;
- small maps;
- readable silhouettes;
- tile-based movement or simple free movement;
- restrained animation;
- cold, muted palette.

### B. Icon-panel layer
Used for major beats: cabin death; name writing; first Ember use; Birdie’s apple refusal; Bethany triage outcome; Wittehaven arrival; Iron Ledger; Mackinac crossing; Paradise.

Pixel-illustrated stills, illustrated stills, or manuscript panels. One strong panel can prove the style for prototype.

### C. UI/manuscript layer
Leather; graphite; wet paper; ruled lines; marginal symbols; apothecary wheel; medicine pouch; hand-lettered names.

### D. Institutional layer (Wittehaven, future)
Clean grids; case IDs; protocol boxes; medical plus-sign branding; typed forms; blue-white fluorescence; seductive readability.

## Palette direction

| Role | Usage |
|---|---|
| Ink / contour | outlines, text, sacred borders, heavy shadow |
| Damp ash | overcast light, paper shadows, old surfaces |
| Lake slate | water, sky, road, cold interiors |
| Deep lake blue | night water, unseen pressure, bridge shadow |
| Vellum bone | notebook pages, icon panels, old walls |
| Candle white | highlights, linens, threshold light |
| Icon gold | sacred disclosure, Paradise, halos, false golden armor |
| Old ochre | earth, worn wood, old interiors |
| Cedar brown | dog, cabins, trunks, leather, beams |
| Rot brown | decay, undergrowth, rust, wounds |
| Dragon red | danger, accusation, Ember misuse, false heroism |
| Ember red | small intense accents only |
| Verdigris | aged copper, hospital tint, spiritual unease |
| Pale healing green | medicinal plants, fragile relief, Lena/Bethany accents |

> Most scenes are muted and cold. Gold and red are earned.

## Location palettes

### Ironwood
Damp ash; cedar brown; rot brown; deep lake blue shadows; small medicinal green accents.

### Bethany
Old ochre; vellum bone; wool gray; candle white; pale healing green.

### Wittehaven (future)
Hospital white; blue-white grids; verdigris cleanliness; red accusation marks; gold only as false signage.

### Mackinac (future)
Deep lake blue; slate; bone fog; rusted bridge red; patterned water lines.

### Paradise (future)
Candle white; icon gold; old wood; smoke-dark icons; living color that is not saturated cheerfulness.

---

# 21. UI/UX direction

## UI principle

Every interface asks:

> *Does this help the player attend, or does it help the player control?*

Both can be useful. The danger is when control replaces attention.

## Core UI surfaces

### 1. Medicine pouch
The practical inventory. Tactile cloth/leather. Small pouches, jars, folded papers. Quantities visible but not spreadsheet-dominant. Materials grouped by therapeutic role.

### 2. Tincture Wheel
The crafting/charting interface. Shows recipe shape; balances Relief, Stability, Warmth, Risk. Hand-drawn in Ironwood; clean institutional in Wittehaven.

### 3. Patient attention panel
Not a full medical chart at first. A human-facing observation surface. Shows: name or unknown name; visible state; fear/trust; urgency; what the patient says or cannot say; treatment options.

### 4. Notebook
Names; short notes; outcomes; crafted item used; memory fragments.

### 5. Kalev state
Burden, Pressure, Numbness. Bodily and symbolic. Stone weight in chest; smoke/numbness overlay; hand tremor in cursor; icons in margin rather than HUD bars.

## Prototype UI minimum

- simple inventory/pouch;
- simple crafting screen or overlay;
- patient interaction panel;
- subtle Kalev state indicator;
- notebook screen with name/outcome.

---

# 22. System priorities for the prototype

## Must-have

1. Movement in small top-down spaces.
2. Interact with objects/NPCs.
3. Gather materials.
4. Craft 3–5 therapeutics.
5. Treat 2–3 patients.
6. Track supplies.
7. Track Burden/Pressure/Numbness in simple form.
8. Use Ember once or twice as a meaningful choice.
9. Record names/outcomes in notebook.
10. End slice with clear consequence summary.

## Should-have

1. Simple dialogue branching.
2. Birdie companion presence.
3. Lena recipe/presence intervention.
4. Time pressure during triage.
5. One unavoidable death or ambiguous outcome.
6. One icon-panel transition.

## Nice-to-have

1. Recipe quality variation.
2. Spoilage/preservation.
3. Weather influencing foraging.
4. Patient trust changing options.
5. Hand tremor affecting crafting UI.
6. Wittehaven rumor/foreshadow overlay.

## Out of prototype scope

Wittehaven; large map; full save-loss system; multiple endings; combat; farming; procedural foraging; complex economy; fully simulated medicine; full companion AI; Paradise; Rafe’s main scene.

---

# 23. Game design non-goals

The game is not:

- a combat RPG;
- a farming sim;
- a colony sim;
- a hospital management sim;
- a survival crafting sandbox;
- a medical accuracy simulator;
- a morality meter game;
- a lore encyclopedia with walking;
- a cozy town game with dark paint;
- a puzzle game with one correct cure per patient.

---

# 24. Wittehaven preview

Not first prototype target, but early systems must invert into Wittehaven cleanly.

## Wittehaven promise
Clean beds; warm food; reliable supplies; sanctioned E-7; faster treatment; protocol clarity; safe foster houses; lower wilderness risk.

## Wittehaven cost
Informal notes become charts; names become case IDs; recipes become sanctioned formulations; prayer becomes irregular behavior; dying well can be recorded as protocol failure; Birdie becomes a foster classification; Lena becomes a liability; Kalev’s undocumented care becomes evidence.

## Crafting inversion
In the Ironwood, crafting is rough and attentive. In Wittehaven, crafting is efficient and sanctioned. The player feels the relief of standardized supplies — and then feels the cost when standardized care cannot see the person.

## Iron Ledger trial
Halloway’s Iron Ledger generates accusation from actual player behavior: undocumented Ember use; patient deaths; skipped names; rough or contaminated craft; excessive self-use; protocol refusal; names misspelled or forgotten; over-treatment; abandonment; using case logic in dialogue. The trial must be partly true.

---

# 25. Tone rules

## Prose/game tone
Spare but not empty; symbolic but embodied; theological but not lecture-like; practical details first, meaning underneath; medicine is concrete; mystery is held, not explained.

## Character tone
- Kalev thinks in hospital fragments when afraid.
- Birdie asks inconvenient, practical questions.
- Lena repairs gloves and does not sermonize.
- Halloway speaks like someone responsible for keeping people alive.
- Rafe is odd, tired, hungry, and only rarely luminous.

## Horror tone
The horror is not gore or monsters. It is apathy; fading names; clean systems doing wrong things; medicines that work but cannot save; competence without mercy; the player recognizing themselves in the ledger.

---

# 26. Claude instance instructions

This packet can be attached to any of three Claude surfaces, each with different capabilities.

## Surface A — Claude.ai (design pass)

For producing markdown design artifacts, art-direction notes, narrative drafts, dialogue, and UI/UX mockups.

**Capabilities relevant here:**
- Markdown artifacts of arbitrary length.
- React/HTML/SVG artifacts for UI mockups (the `frontend-design` skill is loaded automatically when frontend work is requested).
- Image analysis for art reference passes.
- Extended thinking for complex structural decisions.

**Prompt to attach:**

```text
You are helping formalize prototype design artifacts for a 2D top-down narrative survival-care pilgrimage game called Tincture of Mercy: The Garments of Skin.

This v0.6 Unified Prototype Design Packet is the source of truth. v0.3 is the deeper lore foundation if attached separately.

The central playable mechanic is therapeutic crafting under scarcity: foraging, scavenging, preparing, preserving, combining, and applying medicines and care materials to named patients. The notebook is the record layer that runs alongside this loop.

Engine: Godot 4.x. Visual: 2D top-down pixel art with Orthodox-apocalyptic Michigan iconography. The attached art references inform principles such as icon panels, strong contour, patterned water, manuscript borders, symbolic color, and sacred composition. Do not copy a living artist's style.

Primary prototype target: a small Cabin/Bethany vertical slice. Do not design Wittehaven, Paradise, the Mackinac, or Mount Arvon yet.

Produce markdown-only design artifacts in this pass:

1. design.md
2. prototype_scope.md
3. vertical_slice.md
4. crafting_system_design.md
5. systems_overview.md
6. ui_ux_direction.md
7. art_direction.md
8. narrative_bible.md
9. godot_project_plan.md
10. backlog.md

When asked, you can also produce HTML/React UI mockups using artifacts. Implementation code was scheduled for a later pass; current canon uses C#/.NET for engine implementation.
```

## Surface B — Claude Code (implementation pass)

Claude Code is Anthropic’s terminal-based coding agent. It can read this packet, create the Godot project structure, write GDScript and C#, manage scenes and resources, run Godot in headless mode for testing, and iterate against the design artifacts.

**Existing Godot-Claude skills worth installing before implementation:**

- **Randroids-Dojo/Godot-Claude-Skills** — Godot 4.x development skills with GdUnit4 unit testing, PlayGodot E2E automation, exports, and CI/CD deployment. Installed via `git clone https://github.com/Randroids-Dojo/Godot-Claude-Skills.git` then copied into `~/.claude/skills/godot/`.
- **GodotPrompter (jame581)** — 45 domain-specific skills covering project setup, architecture, gameplay systems, input, physics, 2D, animation, audio, UI, and GDScript/C# patterns. Composes well with Randroids skills.
- **Godot MCP server** — connects Claude to a running Godot editor for screenshots, scene management, and script validation.
- **godogen** — Reference for autonomous Godot generation pipelines if scaling up later.

**Prompt to attach (after the design pass has produced artifacts):**

```text
You are implementing a vertical slice of a 2D top-down Godot 4.x game called Tincture of Mercy: The Garments of Skin.

Source documents:
- v0.6 Unified Prototype Design Packet (this file)
- v0.3 Working Document (deeper lore, optional)
- design artifacts produced by Claude.ai (design.md, vertical_slice.md, crafting_system_design.md, etc.)

Target: the Cabin/Bethany vertical slice as defined in vertical_slice.md.

Use the Godot 4.x conventions in Section 33 of this packet. Use composition over inheritance. Use signals for cross-node communication. Use custom Resource classes for ingredients, recipes, patient states, and notebook entries. Keep nodes small and scenes focused.

Historical recommendation superseded: produce C#/.NET engine code first; do not treat C# as performance-only.

Begin with:
1. Project scaffold (project.godot, folder structure per Section 33).
2. Player.tscn with CharacterBody2D, top-down 4-directional movement, AnimatedSprite2D placeholder.
3. Cabin.tscn — single small interior with the dying boy, the cedar dog, the notebook interaction, the Ember vial.
4. Notebook UI scene.
5. Pouch UI scene.
6. Tincture Wheel UI scene (placeholder data).

Test with placeholder pixel art (e.g., flat colored squares at correct tile sizes). Real art comes later.
```

## Surface C — Anthropic API (custom tooling)

For batch generation (asset-naming sweeps, dialogue variant runs), MCP integration with internal tools, or custom production pipelines. Not required for the prototype but useful at scale.

---

# 27. Requested artifact definitions

## 1. `design.md`
**Purpose:** durable identity of the game.
**Must include:** title; genre; one-page vision; pillars; core loop; non-goals; current engine/art direction; prototype target.
**Acceptance:** A new collaborator understands the game in three minutes.

## 2. `prototype_scope.md`
**Purpose:** prevent scope creep.
**Must include:** what the prototype includes; what it excludes; required player experience; success criteria; content list; estimated phases of prototype design.
**Acceptance:** The prototype can be built without inventing Wittehaven, Paradise, or full game structure.

## 3. `vertical_slice.md`
**Purpose:** scene-by-scene playable sequence.
**Must include:** Cabin; Ironwood road; Birdie apple; Bethany arrival; Bethany triage; Lena introduction; rest/road north; decision points; required craftables; required outcomes.
**Acceptance:** A designer can storyboard the whole slice.

## 4. `crafting_system_design.md`
**Purpose:** central mechanic design.
**Must include:** design thesis; ingredients; therapeutic forms; crafting operations; recipe templates; prototype recipes; how crafting interacts with Pressure/Numbness; how crafting differs between Ironwood and Wittehaven later; UI concept for the Tincture Wheel.
**Acceptance:** The crafting system feels central and buildable.

## 5. `systems_overview.md`
**Purpose:** connect mechanics.
**Must include:** travel; foraging; crafting; treatment; Burden/Pressure/Numbness; Ember; notebook; companions; patient states; consequences.
**Acceptance:** Systems support the pillars and each other.

## 6. `ui_ux_direction.md`
**Purpose:** interface grammar.
**Must include:** medicine pouch; Tincture Wheel; patient panel; notebook; state indicators; Ironwood vs Wittehaven UI contrast; accessibility/readability needs.
**Acceptance:** UI expresses attention vs control.

## 7. `art_direction.md`
**Purpose:** visual language.
**Must include:** Orthodox-apocalyptic Michigan pixel iconography; reference principles; palette roles; location palettes; sprite/panel/UI guidance; what not to copy; what not to become.
**Acceptance:** An artist can make first mood boards without relying on “Stardew-like.”

## 8. `narrative_bible.md`
**Purpose:** narrative source for prototype only.
**Must include:** premise; cast needed in slice; key lore needed in slice; tone rules; dialogue rules; Phase I beats; future arc summary only.
**Acceptance:** A writer can draft prototype dialogue without rewriting the cosmology.

## 9. `godot_project_plan.md`
**Purpose:** Godot-specific implementation planning.
**Must include:** scene list with node trees; asset categories with pixel sizes and naming; Resource classes; autoload singletons; signal architecture; prototype milestones; testing checkpoints; beginner-friendly constraints.
**Acceptance:** Claude Code can begin the implementation pass with clear build order.

## 10. `backlog.md`
**Purpose:** actionable design/development tickets.
**Must include:** small tasks; priority labels; dependencies; acceptance criteria; no broad vague tickets like “make crafting.”
**Acceptance:** Work can proceed one small task at a time.

---

# 28. Backlog seed

## Priority 0 — Design locks

- Lock the Cabin/Bethany vertical slice boundaries.
- Lock prototype ingredient list.
- Lock 3–5 prototype craftables.
- Lock patient count and triage order options.
- Lock how Ember appears in the slice.
- Lock how the notebook appears without dominating the slice.

## Priority 1 — Core playable loop design

- Design foraging interaction for Pulseleaf.
- Design medicine pouch inventory surface.
- Design Tincture Wheel first-pass UI.
- Design Clean Dressing recipe.
- Design Pulseleaf Draught recipe.
- Design Cedar-Wool Compress recipe.
- Design one risky stabilizer or Ember-use moment.
- Design patient treatment interaction.
- Design Burden/Pressure/Numbness first-pass behavior.

## Priority 2 — Narrative slice design

- Draft Cabin death interaction.
- Draft Birdie apple scene.
- Draft Bethany arrival dialogue.
- Draft three patient profiles.
- Draft Lena introduction.
- Draft slice ending and road-to-Wittehaven hook.

## Priority 3 — Art/UI direction

- Create mood board from reference principles.
- Define Ironwood palette swatches in Aseprite.
- Define Bethany palette swatches in Aseprite.
- Define medicine pouch look.
- Define Tincture Wheel sketch.
- Define one icon-panel concept for the Cabin or Birdie scene.

## Priority 4 — Godot implementation (next pass)

- Scaffold Godot 4.x project with folder structure per Section 33.
- Build Player.tscn (CharacterBody2D + AnimatedSprite2D + Camera2D).
- Build Cabin.tscn with Area2D interactables.
- Build TileMapLayer for Cabin interior.
- Build pouch UI scene.
- Build Notebook UI scene.
- Build Tincture Wheel UI scene.
- Implement Ingredient, Recipe, PatientState as custom Resources.
- Implement GameState autoload singleton.

## Priority 5 — Later expansion only

- Wittehaven institutional UI.
- Iron Ledger generation.
- Birdie foster disappearance.
- Mackinac bridge sequence.
- Rafe Carver scene.
- Paradise register/graveyard endings.

---

# 29. Prototype open questions

## Crafting

1. How many craftables for the first prototype: 3, 4, or 5?
2. Should Ember be usable on a patient in the prototype, or only on Kalev?
3. Should recipe quality vary, or should a recipe simply succeed/fail?
4. Should crafting happen in real time, paused menu time, or scene time?
5. Should Birdie or Lena directly teach a recipe?
6. Is the Tincture Wheel a literal crafting interface in prototype or a design metaphor for later?

## Narrative

1. What is the cabin boy’s name?
2. Who are the three Bethany patients?
3. Which Bethany patient can die without player failure?
4. What exactly does Lena do that Kalev cannot?
5. Does Birdie join before or after the first forage tutorial?
6. Does the prototype reveal Wittehaven by rumor, sign, map, or NPC testimony?

## UI

1. How visible should Burden/Pressure/Numbness be?
2. Does the player see exact quantities or tactile approximations?
3. Does the notebook show all notes or only names/outcomes?
4. Does crafting use a radial wheel, list, or table in the first prototype?
5. How much should the UI look handwritten vs readable for accessibility?

## Art

1. Top-down or three-quarter top-down?
2. 24×24, 32×32, or 48×48 tile size?
3. Are icon panels pixel art, illustrated, or hybrid?
4. How stylized are halos and symbolic elements in ordinary gameplay?
5. How much gold appears in the prototype, if any?

---

# 30. Recommended provisional answers

## Crafting

- Prototype craftables: **4** (Clean Dressing, Pulseleaf Draught, Cedar-Wool Compress, Ember Dose/Dilution).
- Recipe quality: simple three-level outcome — rough / sound / excellent.
- Crafting time: scene time, not real-time pressure at first.
- Ember: usable on Kalev and optionally on the doctor.
- Tincture Wheel: include as simplified UI sketch or lightweight interface; do not overbuild.

## Narrative

- Birdie enters after first forage, before Bethany.
- Lena enters during Bethany triage, not after all treatment is done.
- One patient death may be unavoidable, but the manner of dying changes.
- Wittehaven is introduced by rumor: clean beds, working stores, sanctioned medicine.

## UI

- Show exact inventory quantities for prototype clarity.
- Show Burden/Pressure/Numbness with symbolic indicators plus tooltip text.
- Notebook records names/outcomes only, not a full journal yet.

## Art

- Use top-down or slight three-quarter top-down.
- **32×32 tiles** is the sweet spot for readability and asset economy. Character sprites at 32×32 base; potentially 32×48 for taller silhouettes.
- Include one icon-panel still as a prototype target.
- Gold sparingly — perhaps only in Ember hallucination or name-writing threshold.

---

# 31. The unified design statement

> *Tincture of Mercy* is a top-down iconographic pixel pilgrimage about a healer-apothecary in post-Turn Michigan who crafts medicines for named people under scarcity, discovering that medicine works but cannot redeem, that records matter but cannot possess the dead, and that mercy cannot be optimized.

Everything else serves that.

---

# 32. Guardrails

## Preserve
- therapeutic crafting as central mechanic;
- names over metrics;
- medicine works but cannot redeem;
- Ember temptation;
- Wittehaven as false relief;
- no conventional combat;
- iconographic Michigan visual direction;
- small Cabin/Bethany prototype first;
- the notebook as sacred record layer;
- human antagonists as partially right;
- mystery without vagueness.

## Avoid
- making medicine sinful;
- making Ember obviously evil;
- making Wittehaven cartoon villainy;
- making Birdie twee;
- making Lena a moral lecture device;
- making Rafe an exposition machine;
- making the Turn a monster/zombie system;
- making crafting generic survival busywork;
- making the first prototype too large.

## Prototype mantra

> *Small map. Few ingredients. Few patients. Real consequence. Strong atmosphere. Crafting first. Names carried, not collected.*

---

# 33. Godot 4.x translation layer

This section maps narrative and design language to Godot concepts so the design is directly actionable in the engine.

## 33.1 Project structure

```
tincture_of_mercy/
├── project.godot
├── icon.svg
├── addons/                    # third-party plugins (GdUnit4, dialogue tools)
├── assets/
│   ├── sprites/
│   │   ├── characters/        # Kalev, Birdie, Lena, NPCs (sheet PNGs)
│   │   ├── items/             # ingredient & item icons
│   │   ├── ui/                # frames, borders, pouch, wheel
│   │   └── tilesets/          # environment tilesheets
│   ├── icon_panels/           # major-beat illustrated stills
│   ├── fonts/                 # manuscript-style + readable UI
│   ├── audio/
│   │   ├── sfx/
│   │   ├── ambient/
│   │   └── music/
│   └── shaders/               # paper, candle flicker, ember glow
├── data/                      # custom Resource files (.tres)
│   ├── ingredients/           # IngredientResource for each material
│   ├── recipes/               # RecipeResource
│   ├── patients/              # PatientResource (state templates)
│   └── tilesets/              # TileSet resources
├── scenes/
│   ├── main.tscn              # entry scene; loads world manager
│   ├── world/
│   │   ├── cabin.tscn
│   │   ├── ironwood_road.tscn
│   │   └── bethany.tscn
│   ├── characters/
│   │   ├── player.tscn        # Kalev
│   │   ├── birdie.tscn
│   │   └── lena.tscn
│   └── ui/
│       ├── pouch.tscn
│       ├── tincture_wheel.tscn
│       ├── notebook.tscn
│       ├── patient_panel.tscn
│       └── kalev_state_overlay.tscn
├── scripts/
│   ├── autoloads/             # singletons (see 33.7)
│   ├── components/            # composable behaviors
│   ├── resources/             # Resource class scripts
│   └── ui/
└── tests/                     # GdUnit4 tests
```

## 33.2 Core node types

| Design concept | Godot node | Notes |
|---|---|---|
| Kalev / Birdie / Lena | `CharacterBody2D` + `AnimatedSprite2D` + `CollisionShape2D` + `Camera2D` (player only) | 4-direction or 8-direction movement; `Texture Filter: Nearest` on sprites |
| NPCs / patients | `CharacterBody2D` (movable) or `StaticBody2D` (bedridden) + `AnimatedSprite2D` | bedridden patients use `Sprite2D` with subtle breath-loop animation |
| Cabin / Bethany interior | `Node2D` root + `TileMapLayer` (floor/walls/decor) + `Node2D` for entities | Use multiple `TileMapLayer` nodes for Z-sort: floor, walls, decor, foreground |
| Ingredients in world (forageable) | `Area2D` + `Sprite2D` + `CollisionShape2D` | emit `body_entered` signal for pickup |
| Doors / scene transitions | `Area2D` with `body_entered` signal | call `SceneRouter.change_scene()` |
| Cedar dog (interactable) | `Area2D` + `Sprite2D` | inventory slot 1, locked; touching triggers memory dialog |
| Notebook page | `CanvasLayer` + `Control` + `RichTextLabel` for entries; custom `TextureRect` for paper |
| Tincture Wheel | `CanvasLayer` + `Control` + custom `_draw()` for radial dimensions | possibly `Polygon2D` segments for wedges |
| Pouch | `CanvasLayer` + `GridContainer` of `TextureButton` slots |
| Patient panel | `CanvasLayer` + `MarginContainer` + `VBoxContainer` |
| Kalev state overlay | `CanvasLayer` + `Control` with three small icons (margin, not HUD bar) |
| Dialogue | `CanvasLayer` + `RichTextLabel` (typewriter via Tween or Dialogic plugin) |
| Camera | `Camera2D` child of player; `position_smoothing_enabled = true`; `zoom = Vector2(2,2)` for 32×32 art at 1080p |

## 33.3 Custom Resource classes

Resources are Godot’s data containers (`extends Resource`). They serialize to `.tres` and let the design team author content without touching scenes.

```gdscript
# IngredientResource.gd
class_name IngredientResource
extends Resource

@export var id: StringName
@export var folk_name: String          # "Pulseleaf"
@export var sanctioned_name: String    # "LOL"
@export var icon: Texture2D
@export var potency: float = 1.0
@export var stability: float = 1.0
@export var purity: float = 1.0
@export var warmth: float = 0.0
@export var risk: float = 0.0
@export var description_folk: String
@export var description_sanctioned: String
```

```gdscript
# RecipeResource.gd
class_name RecipeResource
extends Resource

@export var id: StringName
@export var display_name: String
@export var therapeutic_form: String   # Draught, Tincture, Poultice, ...
@export var ingredients: Array[IngredientResource]
@export var operations: Array[StringName]   # [&"clean", &"steep", &"administer"]
@export var time_cost: float
@export var primary_use: String
@export var secondary_effect: String
@export var risk_level: int            # 0=low, 1=medium, 2=high
@export var narrative_note: String
```

```gdscript
# PatientResource.gd  (template only — runtime state lives on a node)
class_name PatientResource
extends Resource

@export var id: StringName
@export var name: String
@export var case_label: String
@export var primary_condition: String
@export var visible_symptoms: Array[String]
@export var hidden_need: String
@export var trust_initial: float
@export var urgency_initial: float
@export var death_risk_initial: float
@export var response_to_warmth: Dictionary
@export var response_to_recipes: Dictionary
@export var response_to_ember: Dictionary
@export var possible_outcomes: Array[String]
```

```gdscript
# NotebookEntryResource.gd
class_name NotebookEntryResource
extends Resource

@export var page_number: int
@export var line_number: int
@export var name_written: String
@export var outcome: String
@export var note: String
@export var timestamp: int
```

## 33.4 Asset specifications

### Pixel sizes

| Asset | Recommended size | Notes |
|---|---|---|
| Tile | 32×32 | base tile size; world built on this grid |
| Character base | 32×32 | per-frame in spritesheet |
| Character tall | 32×48 | for Kalev with coat — top 16px above feet |
| Item icon (pouch) | 24×24 or 32×32 | match UI tile rhythm |
| Icon panel still | 480×320 or 640×400 | viewport-fitted at 2× zoom |
| UI frame elements | nine-patch via `StyleBoxTexture` | leather/parchment borders |

### Sprite sheets

Per-character sheet layout (rows = animations, columns = frames):

```
Row 0: idle_down       (4 frames)
Row 1: idle_left       (4 frames)
Row 2: idle_up         (4 frames)
Row 3: idle_right      (4 frames)  — or flip Left
Row 4: walk_down       (4 frames)
Row 5: walk_left       (4 frames)
Row 6: walk_up         (4 frames)
Row 7: walk_right      (4 frames)
Row 8: interact        (2 frames)
Row 9: kneel/bend      (3 frames)  — for bedside scenes
```

Imported as `SpriteFrames` resource for `AnimatedSprite2D`. Use `Texture Filter: Nearest` and `Texture Repeat: Disabled` in import settings to preserve pixel crispness.

### Tilesets

Per location, one `TileSet` resource with:

- physics layer (collision)
- terrain set (autotile for floors/walls)
- custom data layer for `material_dropped` (e.g., a rotted log tile yields Wool salvage chance)

Recommended tilesheet image size: power-of-two width (e.g., 512×512 or 256×512).

### Audio

- SFX: `.wav` for short stings; `.ogg` for longer.
- Ambient: looped `.ogg` per location (Ironwood wind, Bethany hearth, candle hiss).
- Music: sparse; only at thresholds (cabin death, Birdie's apple, Bethany triage outcome).

## 33.5 Naming conventions

- Resources: `snake_case.tres` (e.g., `pulseleaf.tres`, `clean_dressing.tres`).
- Scenes: `snake_case.tscn` (e.g., `cabin.tscn`, `tincture_wheel.tscn`).
- Scripts: `snake_case.gd`, class names `PascalCase`.
- Signals: past-tense, `snake_case` (e.g., `name_recorded`, `ember_self_used`).
- Sprite assets: `kalev_walk_down.png`, `pulseleaf_icon.png`.

## 33.6 Signal architecture

Signals are Godot’s event system. Cross-system communication goes through autoloads to avoid coupling scenes.

Key signals (defined on autoload singletons):

```gdscript
# GameEvents.gd (autoload)
signal name_recorded(name: String, page: int, line: int)
signal patient_treated(patient_id: StringName, outcome: String)
signal recipe_crafted(recipe_id: StringName, quality: int)
signal ember_self_used(remaining: int)
signal ember_patient_used(patient_id: StringName, remaining: int)
signal pressure_changed(value: float)
signal numbness_changed(value: float)
signal burden_changed(value: float)
signal companion_left(companion_id: StringName, reason: String)
signal scene_changed(from: String, to: String)
```

UI scenes connect to these signals; gameplay scenes emit them. The notebook listens for `name_recorded` and updates display.

## 33.7 Autoload singletons

Add via `Project Settings > Autoload`. Available globally as named nodes.

| Singleton | Responsibility |
|---|---|
| `GameEvents` | global signal bus (above) |
| `GameState` | run-level state: pressure, burden, numbness, ember count, current scene |
| `Inventory` | pouch contents; ingredient quantities |
| `NotebookState` | array of `NotebookEntryResource`; current page/line cursor |
| `SceneRouter` | scene transition with fade; preserves player state |
| `RecipeBook` | loaded `RecipeResource` instances; lookup by id |
| `IngredientCatalog` | loaded `IngredientResource` instances; lookup by id |
| `AudioManager` | music/ambient/SFX channels |
| `DialogueManager` | runs dialogue trees (or wraps Dialogic if used) |

## 33.8 Scene composition examples

### Player.tscn

```
Player (CharacterBody2D)
├── AnimatedSprite2D
├── CollisionShape2D (RectangleShape2D, ~12×8 at feet)
├── InteractionArea (Area2D)
│   └── CollisionShape2D (raycast forward by facing direction)
└── Camera2D (current = true; smoothing on; zoom 2,2)
```

Script: `player.gd` handles input, movement, animation switching, interaction raycasts.

### Cabin.tscn

```
Cabin (Node2D)
├── Background (TileMapLayer)         # floor
├── Walls (TileMapLayer)              # walls + collision
├── Decor (TileMapLayer)              # furniture, props
├── Foreground (TileMapLayer, z=1)    # things drawn over player
├── Entities (Node2D)
│   ├── DyingBoy (StaticBody2D)
│   │   ├── Sprite2D (subtle breath animation via AnimationPlayer)
│   │   ├── InteractArea (Area2D)
│   │   └── AnimationPlayer
│   ├── CedarDog (Area2D)
│   ├── EmberVial (Area2D)
│   └── Notebook (Area2D)
├── Lights (CanvasModulate / PointLight2D for candle)
├── AmbientSound (AudioStreamPlayer2D)
└── PlayerSpawn (Marker2D)
```

### Bethany.tscn (slice end)

```
Bethany (Node2D)
├── Floor / Walls / Decor / Foreground (TileMapLayer × 4)
├── Entities (Node2D)
│   ├── PatientChild (StaticBody2D, on bed)
│   ├── PatientFever (StaticBody2D, on bed)
│   ├── PatientDoctor (StaticBody2D, on bed)
│   ├── Lena (CharacterBody2D, scripted patrol/idle)
│   ├── Birdie (CharacterBody2D, follows player at distance)
│   └── BethanyResidents (Node2D, container of background NPCs)
├── CookingFire (Node2D — used for Warm operation)
├── HerbDryingRack (Area2D — used for Seal operation)
└── PlayerSpawn (Marker2D)
```

## 33.9 UI architecture

Top of every scene tree: a single `CanvasLayer` for HUD overlays. UI scenes can be instantiated and freed, or kept resident with `visible` toggling.

```
WorldRoot (Node)
├── CurrentScene (Node2D — swapped by SceneRouter)
└── HUD (CanvasLayer)
    ├── KalevStateOverlay (Control, always visible — three small symbols)
    ├── DialogueBox (Control, hidden by default)
    ├── PouchPanel (Control, hidden — opened with key)
    ├── NotebookPanel (Control, hidden — opened at rest)
    ├── TinctureWheel (Control, hidden — opened during crafting)
    └── PatientPanel (Control, hidden — opened on patient interact)
```

UI uses `Theme` resource for consistent visual language. Two themes: `theme_ironwood.tres` (handwritten, warm leather) and (later) `theme_wittehaven.tres` (clean, blue-white, institutional). The same scene can swap themes to drive the moral-UI shift.

## 33.10 Time and tick model

- Movement is real-time. The player walks freely.
- **Crafting opens a modal scene** that pauses world time. Crafting itself takes "scene seconds" — visual progress without real-world urgency.
- **Triage has soft real-time pressure** via patient `urgency` ticking down, but the player can pause to access pouch/wheel/notebook.
- The Cabin scene has no urgency timer — it is contemplative.
- The Bethany scene has urgency timers per patient that begin when the player meets them.

This balances atmosphere (no twitch reflexes) with consequence (you cannot perfect every patient).

## 33.11 Save/load

For prototype: a single autosave on rest. Serialize `GameState`, `Inventory`, and `NotebookState` to a `user://save.tres` file using `ResourceSaver`. The notebook is the diegetic save metaphor; the .tres is the literal save.

Later phases (post-Mackinac) will introduce diegetic save loss — the file persists, but the in-game notebook UI shows the lost state until Paradise restores access.

## 33.12 Accessibility minimums

- Configurable text speed for dialogue.
- Color-independent UI cues (icons + text, not color alone) so palette work doesn’t exclude colorblind players.
- Scalable UI font (`Theme` font size variable).
- All input rebindable via `Project Settings > Input Map`.
- Subtitle support for ambient narration.

## 33.13 Testing approach

- **GdUnit4** for unit tests of resource logic (recipe combination, ember effects, notebook entries).
- **PlayGodot** (Playwright-style E2E) for slice playthrough scripts: launch Cabin, walk to boy, open notebook, write name, exit cabin, forage Pulseleaf, etc.
- Manual playtesting against the Slice Success Criteria in Section 19.

---

# 34. Existing Claude tooling for this project

Practical tools available now if/when implementation begins:

**For design and writing (Claude.ai):**
- This packet attached as a project file in a Claude project.
- The `frontend-design` skill (auto-loads when UI work is requested) for HTML/React mockups of the Tincture Wheel, notebook, pouch.
- Image analysis for art-direction passes against reference visuals.

**For implementation (Claude Code):**
- `Randroids-Dojo/Godot-Claude-Skills` — install into `~/.claude/skills/godot/`. Provides GdUnit4 testing patterns, PlayGodot automation, export pipelines, deployment to itch.io / Vercel.
- `GodotPrompter (jame581)` — 45 Godot 4.x skills covering project setup through C# patterns; composes with Randroids skills.
- Godot MCP server — connects Claude to a running Godot editor for screenshots and scene inspection.
- `godogen (htdt/godogen)` — reference for autonomous Godot generation pipelines if scaling up to multiple agents.

**For custom tooling (Anthropic API):**
- Batch generation for ingredient/recipe variant testing, dialogue tree expansion, asset-naming sweeps.
- MCP integration with Godot or pi-chart-style charting tools if those become production utilities.

---

# 35. Recommended next sequence

1. **Lock the v0.6 prototype scope** (Section 19, Section 30 provisional answers).
2. **Hand v0.6 to Claude.ai** with the Surface A prompt to produce the ten markdown design artifacts.
3. **Review and revise artifacts** against the v0.3 lore foundation; merge anything from v0.3 that the artifacts didn't surface.
4. **Produce art mood boards** from reference principles (Aseprite swatches, one icon-panel concept, character silhouette pass).
5. **Hand the complete artifact set + v0.6 to Claude Code** with the Surface B prompt to scaffold the Godot project per Section 33.
6. **Build the Cabin scene** as the first playable unit. Use placeholder pixel art (flat colors at 32×32) so tone, movement, and notebook interaction can be tested before final art.
7. **Add Ironwood road forage scene.**
8. **Add Bethany scene with three patients.**
9. **Iterate against the Slice Success Criteria.**
10. **Begin Phase II design only after Phase I plays cleanly.**

---

*v0.6 ends here. v0.3 remains the deeper lore. Future versions can continue from this number.*
