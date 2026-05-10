# Opening Slice: The Cabin, the Mother, the Wolves
## A primitives-teaching ramp, revised

---

## What this document is

This is the build plan for the first 30–60 minutes of *Tincture of Mercy*. It is a deliberate ramp that teaches all 15 substrate primitives through play, not tutorialization, and it ends with the inciting incident that begins the pilgrimage. It supersedes the previous slice document (v1).

Two commitments from earlier work are preserved:

1. **The 15 substrate primitives** from the original dossier. Nothing here adds or removes a primitive; everything routes through P1–P15.
2. **The care-as-RPG-skill-layer transposition.** Care and combat are the same engine in two presentations. A tincture administration and a cudgel strike both route through the Combat Table (P3). Spirit regen after a rite and rage gain on a hit are the same Resource Tick (P4). The feverish boy on the cot is on the same Aggro/Threat List (P6) as the wolf at the door.

What changes from v1:

- The slice is **five acts**, not six. The dusk-pivot has been collapsed into the seam between the rite-failure and the wolves' arrival.
- The day/night cycle is **no longer a load-bearing primitive.** The `IsDusk` flag and the night-aggro multiplier are cut. Time-of-day is narrative atmosphere, not a system.
- The mother dies in Act 4 in a **scripted forced-defeat care encounter** — the Grafted Scion of this game. This teaches P3's `Glance` result as the morally loaded outcome and establishes the world's stakes in a single beat.
- The boy survives by **fleeing during the wolf fight**, not by being absent. Kalev's combat objective is to *hold and taunt* until the boy reaches the woodline. The encounter resolves on a moving objective, not a kill-count.
- Kalev **drinks the remaining tincture himself** at the end of Act 5 to survive his wolf wounds. The dose meant for the mother is the dose he gets. His pilgrimage begins on borrowed mercy.
- The eventual Bethany reunion-cure is paid for by **corrected knowledge**, not an inherited bottle. The mother's death taught Kalev what was missing from the recipe.

This is the Claude Code-facing build plan. The previous dossier remains the engine reference.

---

## The thesis: one engine, two presentations

| Primitive | Care presentation | Combat presentation |
|---|---|---|
| **P1 Swing Timer** | Tincture administration cadence — the rite has a pulse | Cudgel auto-attack on weapon speed |
| **P2 Global Cooldown** | 1.5 s lockout between any two ritual actions | Ability cooldown between cudgel skills |
| **P3 Combat Table** | took whole / took partly / refused / spilled | hit / glance / miss / dodge / crit |
| **P4 Resource Tick** | Spirit regen out of combat (gated by P14) | Rage generation on damage dealt and taken |
| **P5 Level Disparity** | Patient acuity vs Kalev's Practice | Wolf level vs Kalev's level |
| **P6 Aggro/Threat List** | Patients' rising condition pulls Kalev's attention | Wolf threat list ranks Kalev vs the boy as targets |
| **P7 Stat Conversion** | Constitution → Burden cap, Spirit → rite amplitude | Constitution → HP, Steadiness → cudgel AP |
| **P8 XP Curve + Rested** | Witness from named-care; Recollection from hearth time | Witness from killed wolves (capped per day) |
| **P9 Quality Tier** | Mundane / Tempered / Marked tinctures | Same tiers on cudgels and armor |
| **P10 Talent-Point Drip** | Vocation points across Pastoral / Apothecary / Iconographic | Same points |
| **P11 Aggro Radius** | Skittish woodland creatures flee; patients in extremis call across rooms | Wolves detect at radius scaled by level disparity |
| **P12 Leash + Respawn** | Patients regress if abandoned mid-treatment | Wolves return to den if pulled too far from cabin |
| **P13 Death-as-Friction** | Patient death: belongings, naming-in-notebook, Faltering Burden | Kalev falls: corpse at place of falling, walk back from hearth |
| **P14 Five-Second Rule** | Vigil cooldown after a rite — Spirit doesn't regen during it | FSR after caster rites |
| **P15 Hidden Combat-Result Logging** | Notebook marginalia | Notebook marginalia |

The right-hand and left-hand columns share code. The art and the verb names diverge. **That is the entire architecture.**

---

## A new design principle: the economy of mercy

This slice introduces a principle that did not appear in the original dossier and which threads through the rest of the game:

**Self-administration carries Burden.** Every dose Kalev takes for himself is a dose that could have gone to a patient. There is no "free heal" in this game — the player's HP is in the same accounting ledger as everyone else's. When Kalev drinks the febrifuge at the end of the slice to survive his wolf wounds, he is consuming the dose the mother needed. He survives on her death. The Burden mechanic begins there, with the first self-rite, and the game's moral architecture follows from it.

This means a few specific rules:

- Tinctures and rites used on Kalev cost the same resource budget as those used on patients.
- The notebook records self-administered doses with a different mark — a small charcoal cross next to the name (the same cross that marks the dead).
- Burden gained from self-administration *cannot be reduced* by hearth time; only by attending another patient with care that *takes whole*. The mercy must be passed forward to be set down.

This principle is what makes the inciting incident weigh: the game tells the player, in its first hour, *you survived because she didn't, and the only way to repay it is to keep walking.*

---

## The slice as a primitives ramp

Five acts. Each teaches a defined subset of primitives. Implementation order falls out of teach order.

### Act 1 — Morning, Two on the Cot (teaches P6, P7, P15, soft P3)

Kalev wakes in the cabin. The boy is on a cot near the hearth, fever-flushed but breathing easily, eyes open. The mother is also on a pallet — or in a chair pulled close — and she is *worse*. Visibly worse. Her sprite is drawn cyanotic; her breathing animation is labored at one cycle every four seconds; her dialogue is sparse and lucid in the way dying people's sometimes is. The player must read her condition correctly *from the sprite alone*, before the rite is ever offered. This is the **single most important art direction of the slice**. If the mother does not look like she is dying, the forced defeat in Act 4 will land as betrayal; if she does, it will land as tragedy.

What the player learns mechanically:

- **P6 (Aggro/Threat list)**: two patient portraits in the upper-left HUD, each with a condition bar. The mother's bar is in the red and rising slowly toward a threshold the player will eventually understand as terminal. The boy's is amber. Two entries on a list. The same data structure that will hold wolves in Act 5.
- **P7 (Stat conversion)**: a notebook page-flip exposes the character sheet briefly. Steadiness 4, Quickness 3, Constitution 5, Insight 6, Spirit 7. Numbers small enough to compute mentally.
- **P15 (Logging)**: the notebook is open on the table. The opening line is already written ("Day 1. The boy is hot. She is worse than yesterday."). Future events append here.

The first chore-quest is **fetch water from the well.** Walking outside introduces P11 in its inverted form: a deer at the woodline flees when Kalev approaches within ~6 tiles. The world reads Kalev's position before Kalev sees it. No combat. The primitive is taught silent.

Returning with water and offering it to the boy is the first **partial Combat Table roll (P3)**. The boy drinks. The result lands as a single line of marginalia — *"the boy drank what was given"* — with no floating combat text and no damage number. **The full eight-state resolver is running under the hood; only three care-relevant outcomes surface.** The engine is complete; the presentation is restrained. This is the substrate-primitive discipline made visible in minute three.

Offering the same water to the mother lands a `Glance` — she sips, refuses the rest, returns her head to the pillow. The bar drops a fraction. This is a deliberate teach: **even water glances on her now.** The player should feel, by the end of Act 1, that whatever is in her is past what water can touch.

### Act 2 — Midday, the Foraging (teaches P9, P14, P11 fully)

Two parallel chores: cook porridge for the boy, gather herbs from the wood-edge.

**Cooking** introduces **P14 (Vigil cooldown)**. The stove is lit; porridge needs to simmer for an in-game minute. Spirit does not regen while the rite is active. The player can pace through the minute with other tasks (sweep, refold blankets) or sit on the bench by the hearth, which begins to accrue Recollection (rested-XP). Pardo's reframing applied at the smallest scale: even waiting is rewarded.

**Foraging** introduces **P9 (Quality Tier)** and finishes **P11 (Aggro Radius)**. Herbs come in three tiers — mundane plantain, tempered mullein, marked St. John's-wort — distinguished by paper-grain on the gathered icon, never by glow. A skittish hare exercises the aggro-radius math from the prey side: its flight radius scales with Kalev's Quickness vs its alertness. The player loops back with a small pouch of herbs and the porridge done.

The boy eats the porridge: a clean **Hit** roll. His bar drops out of amber into pale-green. The mother accepts a spoonful and refuses the rest: another **Glance**. Marginalia: *"Three plantain. One mullein. The boy ate. She would not."*

There is no announcement that the mother is leaving for town. She is too sick. **She has been too sick for that the whole time.** This is the version-2 correction to the v1 framing — the mother does not leave the cabin. She dies in it.

### Act 3 — Afternoon, the Tincture (teaches P3 fully, P10, deepens P9 and P14)

The cabin holds Kalev, the boy, and the mother. Kalev sets up the apothecary table to brew a febrifuge for both of them. This is the **first full Combat Table roll (P3)** the player is meant to read consciously.

The crafting interface is the Tincture Wheel: pick three ingredients from the gathered herbs, choose a method (boil, steep, distill), commit. The system runs P3 against the recipe's `Acuity` value (P5: how hard this tincture is to brew vs Kalev's apothecary Practice) and produces a tier outcome:

- **Hit** → Tempered febrifuge, two doses
- **Crit** → Marked febrifuge, two doses (gold-leaf entry in notebook)
- **Glance** → Tempered, one dose only
- **Miss** → flask cracks, ingredients lost — a deliberate, rare outcome smoothed by the pity-timer mitigation from §C of the previous dossier
- The other table results (Refusal/Dodge/Parry/Block/Crush) are not exposed in the care domain; the engine rolls them but maps silently

The same code path will resolve a cudgel swing in Act 5. The player has now seen the combat table fire several times — water, porridge, crafting — without ever being told it is the combat table.

**P10 (Talent-Point Drip)** soft-unlocks here. Kalev levels from 1 to 2 mid-craft and the notebook turns to a Vocation page. He has 1 point. Three Vocations (Pastoral, Apothecary, Iconographic), each with 5 points needed for tier 2. The player makes their first commitment.

The tincture in Kalev's hand at the end of Act 3 has two doses. *He is going to need them both.*

### Act 4 — Evening, the Failure (teaches P3 as moral teach; the Grafted Scion beat)

Kalev administers the first dose to the boy. Clean **Hit**. The boy's bar drops through pale-green into clear. He sleeps.

Kalev turns to the mother. The player offers the second dose.

The roll is rigged. **The result is `Glance` with amplitude 0.4, scripted, deterministic.**

The animation plays out fully. The mother drinks. She does not refuse. The bar drops a fraction — visible, real — and then her breathing changes. She has a moment of clarity. She looks at the boy. She says one short line that should not be melodramatic; it should be the kind of thing dying people actually say. *"He's better. Good."* Or a name. Or nothing — just a hand on the boy's hair. Then her bar reaches its terminal threshold and she dies.

Kalev does nothing for several seconds. The screen does not cut. The hearth pops. A page in the notebook turns by itself and her name appears under a small charcoal cross, written in Kalev's hand with no input from the player.

This is the moral teach. The rite worked. It wasn't enough. **`Glance` is the most loaded outcome in the engine and the player has just had it explained to them by a death.**

The signposting matters here more than anywhere else in the game. If the mother's sprite and breathing have done their job in Acts 1–3, this lands as confirmation. If they haven't, it lands as betrayal. Get the sprite right and the rest holds.

The remaining tincture on the table — the broken-into bottle, half-full — becomes a persistent inventory item. It will matter at the end of Act 5.

### Act 5 — Night, the Wolves and the Leaving (teaches P1, P2, P4, P6 in combat, P11/P12 fully, P13)

The wolves arrive. Why now is left ambiguous: drawn by death, or simply the world being indifferent. The first howl comes from close. The boy wakes.

Kalev takes the cudgel down from its peg. **This is where P1 (Swing Timer), P2 (GCD), and P4 (Rage Resource Tick) instantiate on the player actor.** Until this moment, Kalev has had no swing-timer-bearing item. The act of arming **gives him a `WeaponSpeed` and a `NextSwingAt`**. The engine has supported these primitives all along; only now does the player-character expose them.

A practice swing is not offered. There is no time. The first wolf is at the door.

**The combat objective is not to kill the wolves.** It is to hold them in the cabin yard while the boy escapes through the back, across the field, into the woodline. A small minimap affordance shows the boy as a moving icon: when he reaches the woodline, the encounter resolves regardless of remaining wolf HP. This is mechanically distinct from any combat in any other RPG and teaches the player on night one that **combat in this game is sometimes about something other than winning.**

What surfaces during the fight:

- **P1 (Swing Timer)**: cudgel auto-swings every 2.6s. The pulse is audible.
- **P2 (GCD)**: pressing the bash key locks the GCD bar. Player learns the 1.5s decision rhythm.
- **P3 (Combat Table)**: every swing rolls. The eight-state resolver runs. Damage numbers do not float; the wolf's HP is a candle-flame that shortens, and crits cause a single sharper audio cue. Misses are a soft *whuff*.
- **P4 (Rage Resource Tick)**: the Steady bar fills on damage taken and dealt. At 30 Steady, the bash ability becomes available — and bash, critically, generates *high threat* relative to its damage. **This is the taunt.** Kalev uses bash not to kill but to keep the wolves on himself.
- **P5 (Level Disparity)**: the wolves are level 2, Kalev is level 2. Even fight. Misses happen. Glances happen. The fight is survivable but real.
- **P6 in combat**: the wolves' threat list contains both Kalev and the boy. The boy's threat starts low and *decays as he runs* (distance reduces threat-weight per the standard formula). Kalev's threat rises as he hits, taunts, takes damage. The puzzle is to keep his threat above the boy's for the ~45 seconds the boy needs to clear the field.

A second wolf flanks the cabin. Multi-target threat management. No dialog explains it; the wolves' sprite-orientation and the boy's icon position on the minimap tell the whole story.

**If Kalev falls (HP=0)**, P13 fires. Corpse at the place of falling. The boy is taken or escapes depending on his progress. Kalev wakes at the hearth with Faltering. The wolves are gone. The morning will be harder than it would have been. There is no XP loss. There is only the cost of having lost.

**If the boy reaches the woodline**, the wolves leash off (P12). They retreat into the trees, away from the cabin, in the direction the boy did *not* go. The remaining wolf at the door turns and runs.

Kalev is wounded. He stumbles back into the cabin. The boy is gone. The mother is on her pallet with her hand still on a pillow. The bottle is on the apothecary table.

He drinks it.

**The roll comes up clean — Hit, full amplitude.** The dose she needed is the dose he gets. He sits at the bench by the hearth. The notebook is open. He picks up the charcoal and writes — the player does not type — *"He ran north. I will follow when I can stand."*

The slice ends. Total play time: 30–60 minutes. The engine has taught all 15 primitives. The pilgrimage has its inciting incident, its first loss, its first survivor, and its first debt.

---

## The eventual reunion (post-slice setup)

What Kalev carries north is not the bottle. It is gone. He carries the **corrected recipe** — what the mother's death taught him about what the febrifuge was missing. The correction goes into the notebook's recipe page as a hand-drawn revision in a different ink than the original. When Kalev arrives in Bethany — hours of play later, at level 4 or 5 — and finds the boy among the named patients in the triage, sick again or sick still, **he brews a new tincture using the corrected recipe**. The boy is healed by knowledge Kalev paid for, not by an inherited object.

This is the load-bearing emotional payoff for the leveling system. The player did not grow because they grinded. They grew because of what her death taught them. Every subsequent rite Kalev performs is improved by a knowledge he bought at a price.

The boy does not recognize Kalev at first. The fever has fragmented his memory of the cabin night. The administration rolls produce *Refusals* and *Dodges* — the boy doesn't trust this man, or doesn't recognize him, and turns his head away. Kalev has to *earn* the cure through repeated patient attempts. The recognition only comes after the fever finally breaks: the boy wakes clear-eyed, looks at Kalev properly for the first time, and says *"you were the one in the cabin."*

That moment is what justifies the entire combat-table-as-care primitive. The Refusal result, the Dodge result, the rare Crit-as-grace — they were always rolling, but the player has spent hours reading them, and now those mechanics cash out for one of the most loaded scenes in the game.

---

## What this changes about the previous dossier

A handful of section reframes:

**§10 Danger curve**: the day/night cycle is no longer a danger-shift verb. Strip the `IsDusk` flag and the night-aggro multiplier from P11. Time-of-day is atmosphere; level disparity is the only first-class danger primitive.

**§11 Reward-return loop**: the cabin *was* the town; after Act 5 it is gone. Kalev returns there in dreams or memory only. Bethany is the first true town. The return-loop learnings carry forward without their teacher.

**§12 Named landmarks**: the mother is the first. Her grave-mark in the cabin field becomes the first persistent named-place in the world map. The wolf alpha gets a name in the marginalia — *"the grey one"* — and may recur. The boy is a named patient who appears later.

**§13 Death**: the mother's death teaches death-as-friction at the moral level before Kalev ever risks his own. By the time P13 might fire on Kalev in Act 5, the player has already been taught what death costs.

**§3 Rarity tiers**: the slice exposes Mundane and Tempered. Marked appears only on a Crit-craft of the febrifuge in Act 3 — making it a tutorial-rare event the player will remember. Hallowed and Named are post-slice content.

**§7 Stat budgets**: keep the lvl 1–25 cap, but the slice is lvl 1–3. Stat values 3–7. Mentally tractable from the first minute.

**§14 Diminishing returns**: kill-Witness DR is the only DR in the engine and it activates in this slice (the wolves' Witness award caps at 30% of daily max). One exception, never extended.

---

## Implementation order for the coding agent

Build in this order; ship the slice when these are done.

1. **P3 Combat Table resolver** — pure function, zero dependencies. Test against the dossier's worked examples (level 60 vs +3 boss = 24.6% miss, 40% glance, etc.). Most-touched code in the engine; get it right first. **Add a `ScriptedRoll(Result, float amplitude)` override** for Act 4's forced Glance. The presence of this override is itself a substrate decision: the engine supports authored outcomes, not just rolled ones.
2. **P15 Combat-Result Logging** — ring buffer of `CombatEvent` records. Subscribers added later; buffer exists from event 1.
3. **P6 Aggro/Threat List** — `Dictionary<ActorId, float>` per combat-engaged entity. Built now even though Act 1 uses it for patients — patient list and wolf list are the same data structure.
4. **P7 Stat Conversion** — `StatBlock.tres` and `ClassStatProfile.tres`. Static; rarely touched after writing.
5. **P5 Level Disparity** — single `int Delta(attacker, defender)` function used by P3, P11, P8.
6. **P11 Aggro Radius** — depends on P5. **No `IsDusk` multiplier.** The radius is a function of level disparity alone.
7. **P1 Swing Timer + P2 GCD** — per-actor floats, advanced in `_PhysicsProcess`. Engine supports them from start; player-character only gets a swing-timer when equipped with a swing-timer-bearing item (the cudgel in Act 5).
8. **P4 Resource Tick** — class-strategy pattern. Implement spirit-regen first (drives Acts 1–4), rage second (drives Act 5).
9. **P14 Five-Second Rule** — per-actor float; gates P4. Built alongside P4.
10. **P8 XP Curve + Rested** — `XpCurve.tres`, `MobDifficultyMatrix.tres`, `RestedPool` field. Kill-Witness DR (the §14 exception) lives here.
11. **P9 Quality Tier** — `RarityTier` enum, `RarityMultiplier.tres`. Items reference; Combat Table doesn't read directly.
12. **P12 Leash + Respawn** — per-mob origin and timer. Needed for Act 5's wolf-retreat moment.
13. **P13 Death-as-Friction** — `DeathManager` autoload. Needed by end of Act 5.
14. **P10 Talent-Point Drip** — `TalentTree.tres` per Vocation. Needed by Act 3's level-up.

P1 through P9 are the combat-table substrate; P10 through P14 are the world substrate. Both are MVP.

---

## Two new things this slice requires the engine to support

**Scripted rolls.** The combat table must accept authored outcomes. Act 4's forced Glance is the canonical example: the rite plays out fully, the result is determined in advance, and the engine logs it as a `CombatEvent` with a `Scripted = true` flag. The flag exists so future encounters can use the same affordance — boss fights with phase transitions, rituals with predetermined endings, named patients whose deaths are story beats. Build it once; use it many times.

**Persistent recipe corrections.** The notebook's recipe pages must support hand-drawn revisions stored as separate data than the original recipe. When Kalev brews a corrected recipe in Bethany, the system reads `BaseRecipe + Correction` and rolls against the combined Acuity. The correction is acquired from a story flag set during Act 4's death (`mother_taught_correction = true`). This is a small piece of code but it is the load-bearing mechanism for every "knowledge gained from loss" beat in the rest of the game. Plan for it now.

---

## The one thing not to compromise

The discipline that makes this work is: **the same code path serves both domains**. When the coding agent is tempted to write a `CareCombatTable` and a `CombatCombatTable`, refuse it. Write `CombatTable.Resolve()` once; write `CareDomain.Present(roll)` and `CombatDomain.Present(roll)` as thin presenters on top. Same for threat lists, swing timers, GCD, resource ticks, all of it.

If two presenters diverge enough that they need different *engines*, you have lost the substrate-primitives discipline and will spend the rest of the project debugging two versions of the same physics. The whole point of the fifteen primitives is that they are *fifteen*, not thirty. Hold that line and the game will compose itself; lose that line and you are writing a normal RPG, badly.

The cabin and the wolves are the same scene. Care is what Kalev does in daylight; combat is what care looks like when it has to use a cudgel. Healing the boy in Bethany is what the Combat Table looks like when both parties want the rite to take. The engine does not know the difference. Neither, eventually, will the player.

The slice ends with Kalev walking north on his own legs, on a borrowed dose, with a corrected recipe in his book and a charcoal cross on the page where her name is written. From here the game is a long pilgrimage of trying to repay what the world gave him by mistake.

That is the prologue. Build it.
