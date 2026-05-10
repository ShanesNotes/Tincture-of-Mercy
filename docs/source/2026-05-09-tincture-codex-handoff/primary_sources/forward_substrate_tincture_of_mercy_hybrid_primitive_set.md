The key synthesis is:

> **Tincture of Mercy should not be “care game plus combat system.” It should be one WoW-shaped event simulation whose outputs are presented as care, crafting, wilderness danger, moral consequence, and only sometimes combat.**

That aligns with the opening-slice artifact’s central thesis: care and combat are “the same engine — the same fifteen primitives — presented in two domains,” where tincture administration and cudgel strikes both route through the same Combat Table, Spirit/rage are both Resource Tick variants, and the feverish boy and the wolf both sit on the same attention/threat substrate.  The design rule I would lock is the one the opening slice states bluntly: **do not create `CareCombatTable` and `CombatCombatTable`; create `CombatTable.Resolve()` once, then write domain presenters on top.** 

# Forward Substrate: Tincture of Mercy Hybrid Primitive Set

## 0. Architectural thesis

**Keep the Vanilla substrate. Do not keep the Vanilla genre.**

The prior dossier’s best pushback is still correct: Vanilla WoW’s full genre spine assumes tab-target combat as the primary verb, raid-cap progression as the long-term motivator, and multiplayer social fabric. Tincture of Mercy does not need those. It needs the **internal engine coherence**: single-roll resolution, level/acurity disparity, attention/threat tables, resource timing, hidden logs, riskful travel, stat-budgeted objects, and progression by witnessed difficulty. 

So the hybrid spec should be:

```text
Vanilla WoW substrate primitives
    → translated into care / craft / wilderness / moral consequence
    → exposed through notebook, posture, sound, pathing, and sparse UI
    → combat remains real, but bounded.
```

The opening slice is strong because it teaches the shared substrate in daylight before naming it as combat at night: water for the boy teaches a partial combat-table roll; foraging teaches aggro radius through fleeing animals; tincture crafting teaches full resolution; the cudgel only appears after those primitives are already understood. 

# 1. The merged primitive list

## P0. Master Tick Clock / Event Scheduler

**Definition.**
A deterministic simulation clock that all timers reference: swing pulses, rite pulses, GCD locks, cast/work timers, channel ticks, aura ticks, fever ticks, leash timers, respawn timers, and log timestamps.

**Why keep it.**
This is what keeps the game from becoming either twitch action or loose narrative scripting. WoW’s feel comes from events resolving against timers and tables, not from animation frames.

**Care presentation.**

```text
SimClock
  → fever rises every N seconds
  → porridge simmers for 60 seconds
  → tincture pulse available every 2.5 seconds
  → Recollection accrues at hearth
```

**Combat presentation.**

```text
SimClock
  → cudgel swings every 2.6 seconds
  → Bash GCD locks for 1.5 seconds
  → wolf leash timer counts down
  → Steady drains after combat
```

**Godot note.**
Use fixed simulation time, not rendered frame time. In Godot 4.6 C#, the combat/care scheduler should advance from `_PhysicsProcess(double dt)` but store time as integer milliseconds or fixed ticks, not raw accumulating floats.

---

## P1. Swing Timer / Rite Pulse

**Definition.**
A per-actor or per-tool timer that schedules the next automatic pulse. In combat this is a weapon swing; in care it is the minimum cadence before another administration or manual procedure can resolve.

**Vanilla root.**
The prior dossier identifies Swing Timer as the per-actor `NextSwingAt` advanced by `WeaponSpeed`, producing the metronomic feel of white attacks. 

**Care presentation.**

```text
Administer Tincture = RitePulse(2.5s) + SpiritCost + CombatTable.ResolveCare()
Stir Porridge      = WorkPulse(4.0s) + QualityCheck + NotebookEvent
Compress Fever     = CarePulse(3.0s) + FeverThreatReduction
```

**Combat presentation.**

```text
Cudgel Auto = SwingTimer(2.6s) + SingleRollTable + PhysicalDamage
Wolf Bite   = SwingTimer(2.0s) + SingleRollTable + BleedAuraChance
```

**Gotcha.**
Do not tie this to animation length. Animation follows the scheduled event; the event does not wait for animation.

---

## P2. Global Cooldown / Verb Lock

**Definition.**
A short actor-wide lockout that prevents spamming GCD-flagged active verbs while allowing non-GCD events, passive ticks, queued pulses, and certain emergency actions.

**Vanilla root.**
The substrate dossier uses a 1.5s GCD as the decision-rate primitive; the opening slice uses the same rhythm for the bash key and rite-like actions.  

**Care presentation.**

```text
Pour Water       = InstantCare + Gcd(1.5s)
Administer Dose  = InstantCare + Gcd(1.5s) + FSR
Say Prayer       = InstantCare + Gcd(1.5s) + AuraApply
```

**Combat presentation.**

```text
Bash        = InstantSpecial + Gcd(1.5s) + SteadyCost(30)
Throw Cup   = InstantRanged + Gcd(1.5s) + BonusThreat
Guard Door  = InstantToggle + Gcd(1.5s) + DefensiveAura
```

**Gotcha.**
Do not put everything on GCD. Passive auras, scheduled ticks, swing events, leash events, and combat-log events must continue during GCD.

---

## P3. Cast / Work / Channel Timer

**Definition.**
A timed commitment that resolves only after its duration, can optionally be interrupted or pushed back, and may tick during its duration.

**Care presentation.**

```text
Brew Febrifuge = WorkCast(60s) + IngredientInputs + QualityRoll
Distill Laudanum = ChannelWork(90s, TickEvery=15s) + TemperatureAura
Read Vigil = Channel(8s, TickEvery=2s) + PressureReduction
```

**Combat presentation.**

```text
Bandage Self = Channel(8s, TickEvery=1s) + BreakOnDamage
Aim Throw    = Cast(1.5s) + RangedAttack
Hold Door    = Channel(6s) + ThreatRedirect + BreakOnMove
```

**Gotcha.**
Cooking and crafting should use the same cast/channel machinery as combat actions. The presenter is domestic; the engine is not.

---

## P4. Single-Roll Outcome Table

**Definition.**
A single random roll walks a priority table and produces exactly one mutually exclusive outcome: Miss, Dodge, Parry, Glance, Block, Crit, Crush, or Hit. This is the most important primitive.

**Vanilla root.**
Classic melee auto-attacks use an ordered table: miss, dodge, parry, glancing blow, block, critical hit, crushing blow, ordinary hit. The table is priority-based; outcomes are mutually exclusive, and if entries above hit fill the table, lower outcomes get pushed off. ([Vanilla WoW Archive][1]) The prior Tincture dossier translates this directly: in care mode, Miss becomes spill, Glance becomes partial uptake, Crit becomes grace, Block becomes numbness, and Crush becomes flooding. 

**Care presentation.**

```text
Miss   = spill / misapplication
Dodge  = patient turns away
Parry  = relative interrupts
Glance = partial uptake
Block  = numbness / refusal deflects effect
Crit   = grace
Crush  = flooding / Burden spike
Hit    = ordinary care lands
```

**Combat presentation.**

```text
Miss   = whiff
Dodge  = wolf evades
Parry  = defended blow
Glance = reduced damage
Block  = absorbed/deflected hit
Crit   = sharp strike
Crush  = overwhelming hit
Hit    = normal damage
```

**Gotcha.**
Do not implement care as a separate skill-check system. The care result is a **projection** of the same roll.

---

## P5. Concord / Refusal Resolver

**Definition.**
The spell-hit/resist analog for rites, tinctures, prayers, and non-physical effects. It resolves whether an effect takes, partially takes, or is refused.

**Vanilla root.**
The prior dossier maps spell hit to **Concord** and resistance to **Refusal**, with binary-vs-partial effects determining whether a rite can partially land or must succeed/fail as a whole. 

**Care presentation.**

```text
Febrifuge Dose = ConcordRoll + PartialResistAllowed + FeverReduction
Confession Rite = ConcordRoll + Binary + NotebookUnlock
Lullaby = ConcordRoll + Partial + SleepAura
```

**Combat presentation.**

```text
Smoke Powder = ConcordRoll + BinaryBlind + BreakOnDamage
Fear Howl    = ConcordRoll + BinaryFear
Lantern Flare = ConcordRoll + PartialDaze
```

**Gotcha.**
Do not collapse this into the physical table. Physical contact and bodily/spiritual acceptance are adjacent but distinct.

---

## P6. Level Disparity / Acuity Gap

**Definition.**
A single delta between actor capability and target difficulty that multiple systems read: hit/miss, glance, crush, XP/Witness, aggro radius, recipe difficulty, and greyed-out triviality.

**Vanilla root.**
The substrate dossier identifies Level Disparity as a single concept read by many systems: miss%, glance%, crush%, aggro radius, XP yield, and grey-level.  Classic XP formulas use mob/player level differences, color bands, grey-level cliffs, higher-level bonuses, and lower-level ZD falloff. ([WoWWiki Archive][2])

**Care presentation.**

```text
Patient Acuity 5 vs Apothecary Practice 3
  → higher refusal chance
  → partial uptake more likely
  → higher Witness reward
  → patient "calls" attention from farther away
```

**Combat presentation.**

```text
Wolf Level 3 vs Kalev Level 2
  → more misses/glances
  → slightly larger detection radius
  → better Witness than trivial prey
```

**Gotcha.**
Keep this as one function. Do not let combat level, patient acuity, recipe difficulty, and wilderness danger become separate unrelated numbers.

---

## P7. Resource Profiles

**Definition.**
Distinct resource behaviors, not a generic resource class with renamed labels. Health, Spirit, Steady, Burden, Pressure, Numbness, Fever, and Recollection all have different tick rules.

**Vanilla root.**
Vanilla resource feel comes from different timing laws: rage builds from damage, energy ticks discretely, mana interacts with Spirit and the five-second rule. The prior dossier explicitly treats Resource Tick as class-strategy behavior rather than one generic meter.  Vanilla rage is a finite resource capped at 100, with generation tied to damage and a level-based conversion value. ([Bookdown][3])

**Recommended Tincture resources.**

| Resource         | Owner                      | Rule                                                                 |
| ---------------- | -------------------------- | -------------------------------------------------------------------- |
| **Health**       | Kalev, boy, mother, wolves | Damage-to-zero state trigger.                                        |
| **Spirit**       | Kalev                      | Regens out of FSR/Vigil lock; fuels rites.                           |
| **Steady**       | Kalev combat               | Rage analog; fills from dealt/taken damage; drains after combat.     |
| **Fever**        | Boy/mother                 | Threat-like bar; rises over time; care lowers it.                    |
| **Burden**       | Kalev                      | Moral/empathic load; can be raised by care, death, flooding.         |
| **Pressure**     | Kalev                      | Immediate stress; affects handwriting, timing, maybe misapplication. |
| **Numbness**     | Kalev                      | Defensive refusal state; blocks overload but damages sensitivity.    |
| **Recollection** | Player account / hearth    | Rested-Witness pool.                                                 |

**Gotcha.**
Spirit and Steady should not feel like the same bar. Spirit is sustainability; Steady is fight momentum.

---

## P8. Five-Second Rule / Vigil Cooldown

**Definition.**
After spending Spirit/mana on a committed rite, Spirit-based regeneration is suppressed for a fixed window. In Tincture, this is not just a caster mechanic; it is the cost of committed attention.

**Vanilla root.**
The five-second rule prevented Spirit-based mana regeneration for five seconds after casting a mana-spending spell, with exceptions such as free spells and MP5-like sources. ([Warcraft Wiki][4]) The opening slice translates this into cooking and rites: committed action costs sustainability, and hearth waiting can accrue Recollection. 

**Care presentation.**

```text
Administer Tincture = SpiritCost + FsrLock(5s)
Cook Porridge       = WorkTimer + FsrLockWhileActive
Say Vigil           = SpiritCost + FsrLock(5s)
```

**Combat presentation.**

```text
Emergency Prayer = SpiritCost + FsrLock(5s)
Bandage Channel  = FsrNeutral + BreakOnDamage
Bash             = SteadyCost, not FSR
```

**Gotcha.**
The FSR analog should not punish all activity. It gates **Spirit regen**, not movement, not watching, not passive fever ticks.

---

## P9. Attention / Threat List

**Definition.**
A per-entity ordered table of who or what currently demands attention. In combat it selects targets; in care it determines urgency, deterioration, and the HUD/order of concern.

**Vanilla root.**
Classic threat tables determine which actor a mob attacks; melee actors need 110% of current target threat to pull aggro, ranged actors need 130%; Taunt/Growl equalize to highest threat and force focus; Feign Death/Vanish-like abilities dump threat. ([Wowhead][5]) The opening slice directly maps the boy’s fever bar to threat and later uses the same structure for wolves choosing between Kalev and the boy. 

**Care presentation.**

```text
Boy Fever = AttentionSource + ThreatPerSecond + ThresholdWorsen
Mother Cough = AttentionSource + ThreatPerSecond + LowUrgency
Ignored Patient = ThreatAccumulation + AuraDeterioration
```

**Combat presentation.**

```text
Wolf Targeting = ThreatList + HighestThreat + ProximityBias
Throw Cup = RangedAction + BonusThreat
Heal Boy During Fight = HealingThreat to engaged wolves
```

**Gotcha.**
The patient should not be a quest objective outside the engine. The boy is an actor with an attention table entry.

---

## P10. Aggro / Call / Flee Radius

**Definition.**
A spatial query radius modified by disparity, state, faction, time of day, stealth/noise, and encounter flags.

**Vanilla root.**
Classic aggro radius varies with level difference at roughly 1 yard per level, with same-level around 20 yards, a minimum around combat range, and a maximum around 45 yards. ([Vanilla WoW Archive][6]) The opening slice translates this through deer/hare/grouse fleeing during the day and wolves detecting at dusk/night. 

**Care presentation.**

```text
BoyInExtremis.CallRadius = RoomWide
MotherCough.CallRadius = CabinNear
DeerFleeRadius = Alertness - KalevQuickness
```

**Combat presentation.**

```text
WolfAggroRadius = Base + LevelDelta + DuskMultiplier
StarvingWolfAggro = WolfAggroRadius * 1.25
LampLight = RadiusModifier(-danger inside light, +visibility outside)
```

**Gotcha.**
Do not make the radius visible as a gamey circle. Surface it through head turns, breath, posture, quieting animals, growls, and marginalia.

---

## P11. Leash / Return / Respawn / Regression

**Definition.**
A state reset rule. Hostiles return to origin and heal/reset after distance/time thresholds; patients or tasks regress when abandoned mid-treatment; traveling NPCs have route state that can be interrupted and later discovered.

**Vanilla root.**
The substrate dossier defines leash/respawn as full reset to spawn/origin after chase distance or timeout, with predictable respawn timing.  The opening slice extends this to the mother’s pathing, wolf retreat, and patient abandonment/regression. 

**Care presentation.**

```text
Porridge Abandoned = WorkState.Regress
Boy Untended = FeverThreat.Rise + WorsenAura
Mother Route = NpcPathGoal + OffscreenInterruption
```

**Combat presentation.**

```text
Wolf Leash = ReturnToDen + FullHeal + ClearThreat
Wolf Respawn = InGameHours(6) unless named
Named Alpha = PersistentMemory + LongerRespawn
```

**Gotcha.**
Leash is not merely “enemy stops chasing.” It is a full encounter-state reset boundary.

---

## P12. Aura / Condition System

**Definition.**
The unified layer for buffs, debuffs, diseases, wounds, fever, exhaustion, vows, stances, fear, grief, poison, warmth, hunger, lamplight, and tool proficiencies. An aura has source, target, duration, tick interval, stack behavior, refresh behavior, dispel/removal rules, and whether it snapshots or recalculates dynamically.

**Why this must be added to the 15.**
The two artifacts imply auras everywhere—Faltering, fever, Numbness, Burden, Pressure, Recollection, food, medicine, vocation effects—but the 15-primitives list does not explicitly promote Aura to first-class status. For implementation, it must be promoted. Without it, every disease, tincture, burn, fear, prayer, and stance becomes bespoke code.

**Care presentation.**

```text
Fever = Aura(TickEvery=5s, IncreasesThreat, BreaksAt=Recovered)
Febrifuge = Aura(Duration=60s, TickEvery=10s, ReducesFever)
Faltering = Aura(Duration=10m, SpiritRegenMultiplier=0.7)
Warmth = Aura(Source=Hearth, PressureDecay)
```

**Combat presentation.**

```text
Bleed = Aura(TickEvery=3s, PhysicalDamage, BreaksNone)
Guarding = Aura(ThreatMultiplier=1.3, DamageTakenModifier)
Fear = Aura(ControlLoss, BreakChanceOnDamage)
LanternDaze = Aura(MoveSpeedMultiplier=0.6)
```

**Gotcha.**
Do not build “buffs” and “debuffs” as separate systems. A fever, a stance, a cooking heat state, a prayer, and a wolf bleed are all auras.

---

## P13. Item Quality / Locked Budget

**Definition.**
Every item has level, quality, slot/type, budget, and budget allocation. Quality is not cosmetic; it constrains power and meaning.

**Vanilla root.**
The prior dossier preserves the Vanilla principle that item quality and item level lock stat budget; it translates quality into paper/ink tiers: Mundane, Tempered, Marked, Hallowed, Named.  The opening slice correctly exposes only Mundane and Tempered, with Marked reserved for a rare crit-craft febrifuge. 

**Care presentation.**

```text
Plantain = MundaneReagent + LowBudget
Mullein = TemperedReagent + MediumBudget
Marked Febrifuge = CritCraft + HigherAmplitude + NotebookGoldLeaf
```

**Combat presentation.**

```text
Cudgel = WeaponItem + Speed(2.6s) + DamageRange + QualityBudget
Padded Coat = ArmorItem + ConstitutionBonus + Durability
```

**Gotcha.**
Do not use glow. Use paper grain, ink, provenance, icon frame, and notebook treatment.

---

## P14. Belongings / Loot / Provenance

**Definition.**
A drop/reward table that produces objects with provenance, not just loot. The source matters: gathered, gifted, found, inherited, taken, interred, burned.

**Vanilla root.**
The prior dossier warns that if antagonist drops become primary income, the game says “kill people for stuff”; it recommends gathering and gifts as the main income while antagonist belongings are unsettling, not rewarding. 

**Care presentation.**

```text
Attended Death = Belonging + Provenance + NotebookEntry
Gather Herbs = ResourceDrop + QualityTier + LocationMemory
Grateful Kin = Alms + RecipeUnlock + Reputation
```

**Combat presentation.**

```text
Wolf = Hide? maybe none; avoid loot loop
Brigand Pouch = DisturbingBelonging + LowGold + MoralTag
Named Alpha = MemoryToken, not farmable loot
```

**Gotcha.**
The player should not learn “violence is the best income source.” Combat rewards must be capped, morally marked, or resource-neutral.

---

## P15. Witness XP / Recollection Rested Pool

**Definition.**
Progression points earned primarily by attending to difficulty, place, and named beings. Recollection is the rested pool accrued at hearth/chapel and spent as a multiplier on future Witness.

**Vanilla root.**
Classic XP uses level-disparity formulas, grey-level cliffs, and rested XP doubling mob XP while the rested pool lasts. ([WoWWiki Archive][2]) The Tincture dossier reframes XP as Witness/Vigil, with Recollection as a 200% Witness multiplier from cabin hearth or chapel time, while keeping the mechanic data-driven. 

**Care presentation.**

```text
Attend Boy Fever = Witness(AcuityScaled)
Craft Febrifuge = Witness(SkillDeltaScaled)
Sit Hearth = RecollectionPoolAccrual
```

**Combat presentation.**

```text
Kill Wolf = Witness(small, daily capped)
Defend Boy = Witness(care-weighted, larger)
Discover Mother Path = Witness(exploration)
```

**Gotcha.**
The risk register is right: care-Witness must out-yield kill-Witness by at least 3×, and kill-Witness should have the one explicit daily cap/DR exception. 

---

## P16. Stat Conversion

**Definition.**
A pure conversion layer from primary stats to derived stats. This is where class/vocation identity lives.

**Care presentation.**

```text
Constitution → MaxHP + Burden capacity
Spirit       → Rite amplitude + regen
Insight      → Recipe slots + Numbness threshold
Quickness    → Forage/flee interaction + dodge
Steadiness   → Carry weight + cudgel AP
```

**Combat presentation.**

```text
Constitution → HP
Steadiness   → melee damage
Quickness    → dodge / crit-like precision
Insight      → tactical unlocks
Spirit       → emergency rites
```

**Gotcha.**
Keep values small. The opening slice’s level 1–3 range and stat values around 3–7 are the right scale. 

---

## P17. Vocation Point Drip

**Definition.**
A slow, committed build ledger. Points arrive at fixed progression moments and unlock identity-changing nodes with prerequisites.

**Care presentation.**

```text
Apothecary = stronger tinctures, better crafting table outcomes
Pastoral = lower Pressure, better Concord/Refusal handling
Iconographic = memory, wards, lamplight, symbolic protection
```

**Combat presentation.**

```text
Martial branch should be shallow, optional, and morally framed.
```

**Gotcha.**
Do not import 51-point trees. Use a smaller 1–25 progression, maybe 20 total points, with multi-objective choices and narrative tradeoffs. The opening slice’s first point at the febrifuge craft is good because the player spends after caring, not after killing. 

---

## P18. Trainer / Recipe / Tool Gating

**Definition.**
Abilities are not auto-granted purely by level. They are learned from people, copied into the notebook, or unlocked by tools, quests, vows, and discovered recipes.

**Care presentation.**

```text
Mother teaches porridge
Bethany herbalist teaches stronger febrifuge
Priest teaches vigil
Staretz teaches grief rite
```

**Combat presentation.**

```text
Cudgel proficiency from cabin
Knife proficiency from field dressing
Lantern warding from Iconographic teacher
```

**Gotcha.**
Training is not friction for its own sake; it ties mechanics to named relationships.

---

## P19. Death-as-Friction / Moral Death

**Definition.**
Damage-to-zero creates a recovery state, not XP loss. For Kalev, this is corpse/hearth recovery plus Faltering. For patients, death is world-state mutation and moral record.

**Vanilla root.**
The substrate dossier keeps corpse-run/durability-style death as friction, explicitly with no XP loss.  The opening slice makes the boy’s possible death the moral version of the same primitive: the notebook records it and the next morning still comes. 

**Care presentation.**

```text
BoyDies = DeathState + NotebookName + MotherOutcomeMutation + BurdenAura
MotherDies = DeathState + WorldReputationMutation + Belonging
```

**Combat presentation.**

```text
KalevDies = CorpseMarker + HearthGhost + Faltering(10m) + PossibleItemScatter
WolfDies = CorpseState + NoTreasureLoop + MaybePeltIfNeeded
```

**Gotcha.**
Do not reload to erase moral consequence by default. Let the save model support consequence, not perfect retry.

---

## P20. Hidden Event Log / Notebook Marginalia

**Definition.**
Every simulation resolution emits a complete structured event. The UI selectively surfaces it as notebook text, audio, posture, animation, or optional debug overlay.

**Vanilla root.**
Patch 1.12 added configurable floating combat text to WoW’s UI, but the stronger lesson for Tincture is the combat-log substrate: complete events underneath, sparse presentation above. ([Warcraft Wiki][7]) The opening slice uses notebook marginalia as the player-facing log and explicitly avoids floating damage numbers during wolf combat. 

**Care presentation.**

```text
"The boy drank what was given."
"The rite did not take."
"Three plantain. One mullein, mottled."
```

**Combat presentation.**

```text
No floating combat text.
Wolf HP as candle-flame.
Crit as audio accent.
Full CombatEvent exists in ring buffer.
```

**Gotcha.**
Never delete the event just because the UI is quiet. Threat, replay, analytics, tuning, save reconstruction, and notebook all need the same event stream.

---

## P21. Encounter State Machine

**Definition.**
Actors move through Idle, Alert, Aggro, Combat, LeashReturn, Reset, Dead, Recovering, or Domain-specific variants.

**Care presentation.**

```text
Patient = Resting → Worsening → Calling → Stabilized → Recovering / Dead
Mother = AtTable → PathingToTown → Missing → Returned / Interrupted
```

**Combat presentation.**

```text
Wolf = Patrol → Alert → Aggro → Combat → LeashReturn → Den → Respawn
```

**Gotcha.**
The mother’s absence should use the same route/state machinery as a wolf patrol. That gives the world memory and avoids quest-script sprawl.

---

## P22. Day/Night Danger Modifier

**Definition.**
A global or zone-local multiplier that changes radius, spawn tables, stealth, audio, NPC routes, and risk.

**Why it emerges from the opening slice.**
The opening slice adds dusk as a mechanical pivot: lighting the cabin lamp flips an `IsDusk` flag and scales hostile aggro radius by 1.5×. 

**Care presentation.**

```text
Night = FeverTickRate + PressureModifier + LimitedVisibility
```

**Combat presentation.**

```text
Night = WolfAggroRadius * 1.5 + DifferentSpawnTable + LowerSafeRadius
```

**Gotcha.**
Night must affect care too, not just monsters. Otherwise it becomes “combat time” instead of “the world has changed.”

---

## P23. Reward-Return Loop / Cabin-as-Town

**Definition.**
A safe return loop where the player deposits, repairs, reads, rests, cooks, trains, replenishes, and reflects.

**Why keep it.**
The opening slice correctly stages the cabin as the first town: pantry, hearth, notebook, boy, mother, tools. Bethany can become the larger town later. 

**Care presentation.**

```text
Enter Cabin = SetDownPack + PantryDeposit + NotebookRead + HearthRecollection
```

**Combat presentation.**

```text
After Wolf Defense = RepairCudgel + CleanWounds + ReadNightLog + Recollection
```

**Gotcha.**
The return loop should produce reflection, not shopping addiction.

---

## P24. Hidden Information / Discovery

**Definition.**
The engine knows exact threat, roll tables, fever rates, and timers; the player reads them indirectly through behavior, notebook, sound, and imperfect UI.

**Why keep it.**
The prior risk register correctly forbids floating combat text and recommends marginalia, audio, and posture instead.  This opacity is not a lack of UX; it is the contemplative texture.

**Care presentation.**

```text
No exact "Fever: 73.2%" unless debug.
Use breathing, color, posture, mother dialogue, notebook wording.
```

**Combat presentation.**

```text
No DPS meter.
No exact threat meter.
Use wolf facing, growl, movement, boy danger, candle-flame HP.
```

**Gotcha.**
Debug overlays are fine for development. They should not become the default player fantasy.

# 2. Composition rules

## Rule 1 — One resolver, many presenters

```text
CombatTable.Resolve(context)
  → OutcomeRoll
  → CarePresenter / CombatPresenter / CraftPresenter / NotebookPresenter
```

The engine should not know whether the roll is “medicine” or “cudgel.” It knows actors, stats, skill delta, aura modifiers, result table, RNG seed, and timestamp.

## Rule 2 — Every active verb is data

A verb should be expressible as:

```text
Verb =
  TimePrimitive
+ CostPrimitive
+ CooldownPrimitive
+ TargetingPrimitive
+ ResolutionPrimitive
+ EffectPrimitive
+ LogPrimitive
```

Examples:

```text
Pour Water =
  Instant
+ Gcd(1.5s)
+ Target(Patient)
+ SingleRollOutcomeTable(care_projection)
+ FeverDelta(-small)
+ NotebookEvent

Brew Febrifuge =
  WorkCast(60s)
+ IngredientCost(Plantain, Mullein, Water)
+ SkillDelta(ApothecaryPractice vs RecipeAcuity)
+ SingleRollOutcomeTable(craft_projection)
+ CreateItem(Mundane/Tempered/Marked Febrifuge)
+ NotebookEvent

Administer Febrifuge =
  Instant
+ Gcd(1.5s)
+ SpiritCost
+ FsrLock(5s)
+ ConcordRoll
+ AuraApply(FeverReduction, TickEvery=10s)
+ NotebookEvent

Cudgel Auto =
  SwingTimer(2.6s)
+ SingleRollOutcomeTable(combat_projection)
+ PhysicalDamage
+ SteadyGainFromDamage
+ ThreatGain
+ CombatEvent

Throw Cup =
  InstantRanged
+ Gcd(1.5s)
+ SmallDamage
+ BonusThreat(high)
+ CombatEvent

Bash =
  InstantSpecial
+ Gcd(1.5s)
+ SteadyCost(30)
+ SingleRollOutcomeTable(no_glance_if_special, if desired)
+ StunOrDazeAura
+ BonusThreat
+ CombatEvent
```

## Rule 3 — Disparity is shared

```text
Delta = TargetAcuityOrLevel - ActorPracticeOrLevel
```

That one delta feeds:

```text
Outcome table weights
Concord/refusal
Aggro/call radius
Witness reward
Grey/trivial threshold
Craft quality
```

Do not fork this into unrelated “combat difficulty,” “recipe difficulty,” and “patient difficulty.”

## Rule 4 — Event stream first, UI second

All systems emit structured events before presentation:

```csharp
public readonly record struct SimEvent(
    long Tick,
    ActorId Source,
    ActorId Target,
    StringName VerbId,
    EventKind Kind,
    OutcomeResult Result,
    int Amount,
    SchoolOrDomain Domain,
    EventFlags Flags
);
```

Then the notebook, HUD, audio, threat, analytics, save replay, and debug tools subscribe.

## Rule 5 — Auras own ongoing state

Do not make fever a special field, bleed a special field, Faltering a special field, and Recollection a special field. Make them aura instances with different tags.

```csharp
public sealed partial class AuraDef : Resource
{
    [Export] public StringName Id;
    [Export] public float DurationSec;
    [Export] public float TickIntervalSec;
    [Export] public int MaxStacks = 1;
    [Export] public AuraRefreshMode RefreshMode;
    [Export] public bool SnapshotOnApply;
    [Export] public Godot.Collections.Array<AuraEffectDef> Effects;
}
```

# 3. Opening slice: final primitive ramp

## Act 1 — Morning: Attention before combat

Teach:

```text
P9 Attention/Threat
P16 Stat Conversion
P20 Hidden Log
P4 Partial Outcome Roll
P10 Flee Radius preview
```

Player fetches water. Deer flees. Boy drinks or refuses. No combat UI.

## Act 2 — Midday: Work and material quality

Teach:

```text
P3 Work Timer
P8 Vigil/FSR
P13 Quality
P10 Aggro/Flee Radius
P11 Route/Return
```

Player cooks, forages, sees Mundane/Tempered herbs, watches animals react to proximity, mother leaves on a route.

## Act 3 — Afternoon: Crafting as combat-table literacy

Teach:

```text
P4 Single-Roll Table
P5 Concord/Refusal
P6 Acuity Gap
P15 Witness
P17 Vocation Drip
```

Tincture Wheel runs the same resolver that will resolve cudgel strikes. Hit gives Tempered; Crit gives Marked; Glance gives reduced charge; Miss loses ingredients. This is exactly the right tutorial structure. 

## Act 4 — Dusk: World-state modifier

Teach:

```text
P22 Day/Night Danger
P1 Swing Timer
P2 GCD
P7 Steady Resource
```

Kalev takes the cudgel down. Only now does he gain a swing-bearing item. Practice swing shows 2.6s pulse, 1.5s lock, Steady at zero. 

## Act 5 — Night: Defense as care under force

Teach:

```text
P9 Threat table
P1 Swing
P2 GCD
P4 Combat table
P7 Steady/rage
P10 Aggro
P11 Leash
P19 Death
```

The wolf threat list contains Kalev and the boy. Throw Cup is a high-threat pull. The second wolf creates the first real tanking puzzle. The boy’s death is moral death; Kalev’s death is recovery friction. 

## Act 6 — Dawn: Progression and reflection

Teach:

```text
P15 Witness
P20 Notebook event stream
P23 Cabin return loop
P15 Recollection
```

Witness totals from care, defense, and exploration. Kill-Witness is capped. Recollection starts at the hearth. The notebook becomes the truth surface. 

# 4. Implementation order for Claude Code

I would adjust the artifact’s implementation order slightly by inserting the missing Aura and Clock primitives before content work:

| Order | Build                                      | Why                                                        |
| ----: | ------------------------------------------ | ---------------------------------------------------------- |
|     1 | `SimClock` / fixed tick scheduler          | Prevents drift and frame-coupled bugs.                     |
|     2 | `SimEvent` ring buffer                     | Every later system emits events.                           |
|     3 | `CombatTable.Resolve()`                    | Most-used resolver; must be pure/tested.                   |
|     4 | `AuraSystem`                               | Fever, Faltering, warmth, bleed, prayer, food all need it. |
|     5 | `ActorState` + `StatBlock` + derived stats | Required by all rolls.                                     |
|     6 | `DisparityService`                         | One delta read by rolls, radius, Witness, recipes.         |
|     7 | `AttentionThreatTable`                     | Boy/mother first; wolves later.                            |
|     8 | `AggroCallFleeRadius`                      | Deer/hare/wolves/patients.                                 |
|     9 | `GCD` + `WorkTimer` + `SwingTimer`         | Time-axis verbs.                                           |
|    10 | `ResourceProfiles`                         | Spirit first, Steady second.                               |
|    11 | `FSR/VigilCooldown`                        | Gates Spirit regen.                                        |
|    12 | `AbilityDef` / `VerbDef` data rows         | Pour, Brew, Administer, Throw, Bash.                       |
|    13 | `QualityBudget` + `ItemDef`                | Herbs, febrifuge, cudgel.                                  |
|    14 | `LeashRouteRespawn`                        | Wolves and mother route.                                   |
|    15 | `DeathManager`                             | Kalev and boy death consequences.                          |
|    16 | `ProgressionState`                         | Witness, Recollection, Vocation points.                    |
|    17 | `NotebookPresenter`                        | Player-facing log.                                         |
|    18 | Opening-slice content data                 | Cabin, boy, mother, deer, herbs, wolves.                   |

This preserves the artifact’s key instruction—Combat Table, logging, threat, stat conversion, disparity, aggro radius, timers, resources, FSR, XP/rested, quality, leash, death, talents—but puts Clock and Aura ahead of content because they are substrate, not polish. 

# 5. Minimal C# shape

```csharp
public enum OutcomeResult { Miss, Dodge, Parry, Glance, Block, Crit, Crush, Hit }
public enum DomainKind { Care, Combat, Craft, Travel, Recovery }

public readonly record struct ResolveContext(
    ActorId Source,
    ActorId Target,
    StringName VerbId,
    DomainKind Domain,
    int SourcePractice,
    int TargetAcuity,
    float CritChance,
    float BlockChance,
    long Tick,
    ulong RngStream
);

public readonly record struct OutcomeRoll(
    OutcomeResult Result,
    float EffectMultiplier,
    EventFlags Flags
);

public interface IResultPresenter
{
    void Present(in SimEvent ev, in OutcomeRoll roll);
}

public static class OutcomeResolver
{
    public static OutcomeRoll ResolveSingleRoll(in ResolveContext ctx, IRng rng);
}
```

```csharp
public sealed partial class AbilityDef : Resource
{
    [Export] public StringName Id;
    [Export] public DomainKind Domain;
    [Export] public bool TriggersGcd = true;
    [Export] public float GcdSec = 1.5f;
    [Export] public float CastOrWorkSec;
    [Export] public float PulseOrSwingSec;
    [Export] public Godot.Collections.Array<CostDef> Costs;
    [Export] public Godot.Collections.Array<EffectDef> Effects;
    [Export] public bool UsesSingleRoll = true;
    [Export] public bool StartsFsr;
}
```

```csharp
public sealed partial class ActorState : Node
{
    [Signal] public delegate void SimEventEmittedEventHandler(SimEvent ev);

    [Export] public StatBlock BaseStats;
    public DerivedStats Derived { get; private set; }
    public long GcdEndsAtTick;
    public long FsrEndsAtTick;
    public long NextSwingAtTick;
    public ResourceState Health, Spirit, Steady, Burden, Pressure, Numbness;
    public AuraContainer Auras { get; } = new();
    public ThreatTable Attention { get; } = new();
}
```

# 6. What to cut or demote

## Cut as core

```text
Tab targeting as primary interface
Full 51-point trees
Raid-like endgame treadmill
Auction-house economy
Loot lottery from kills
Visible threat meter
DPS meter
Floating combat text
PvP-style crowd-control tuning
Full Vanilla class/resource roster
```

## Keep as substrate only

```text
Attack table
Threat table
GCD
Swing timer
Rage-like Steady
FSR-like Vigil cooldown
Rested XP as Recollection
Corpse run as Faltering recovery
Quality budget
Aggro radius
Leash/reset
Hidden logs
```

## Add for Tincture specifically

```text
Aura/Condition system as first-class
Concord/Refusal resolver
Attention threat for patients
Moral death state
Belongings/provenance
Cabin-as-town return loop
Day/night danger multiplier
Notebook presenter
Kill-Witness cap
```

# 7. The hard design guardrails

1. **Care must out-yield combat.** Kill-Witness capped at roughly 30% of daily Witness is the right exception; never generalize DR everywhere. 
2. **No floating combat text.** Use notebook, posture, candle-flame HP, audio, and animation. This directly mitigates the “slot machine” risk. 
3. **No separate care engine.** One resolver; multiple presenters. 
4. **The boy is not a quest objective.** He is an actor with health, fever, auras, attention threat, death state, and log events.
5. **The wolf encounter is care under pressure.** The goal is not “kill wolves”; the goal is “keep the boy alive when care must become force.”
6. **Progression is Witness, not grinding.** The player advances by attending to difficulty, not by optimizing kill loops.
7. **Rarity means meaning.** A Named object may be narratively heavier, not numerically stronger.
8. **Opacity is intentional.** Exact threat/roll math belongs in debug; the player reads signs.

# 8. Final recommendation

Move forward with the hybrid. The opening slice captures the correct architecture because it makes combat **derivative of care**, not adjacent to it. The wolves are not an action-game pivot; they are the moment the same attention/threat/resource/roll systems cross a moral threshold. That is much stronger than either “no combat” or “WoW clone with apothecary flavor.”

The final substrate should be:

```text
SimClock
+ EventLog
+ ActorState
+ AuraSystem
+ Disparity
+ SingleRollOutcomeTable
+ Concord/Refusal
+ Timers/GCD/Work/Swing
+ Distinct Resource Profiles
+ Attention/Threat
+ Aggro/Call/Flee Radius
+ Leash/Route/Respawn
+ Item Quality/Budget/Provenance
+ Witness/Recollection Progression
+ Vocation Drip
+ Death/Faltering/Moral Consequence
+ Notebook/Hidden-Info Presenter
```

That is the best set between the artifacts. It keeps the WoW primitives that create systemic coherence, drops the genre furniture that would overpower the contemplative premise, and gives Claude Code a single implementation target: **one substrate, two presentations, many verbs as data rows.**

[1]: https://vanilla-wow-archive.fandom.com/wiki/Attack_table "Attack table | Vanilla WoW Wiki | Fandom"
[2]: https://wowwiki-archive.fandom.com/wiki/Formulas%3AMob_XP "Formulas:Mob XP | WoWWiki | Fandom"
[3]: https://bookdown.org/marrowwar/marrow_compendium/abilities.html "Chapter 4 Abilities and Rotation | Marrow’s Compendium of Dragonslaying"
[4]: https://warcraft.wiki.gg/wiki/Five_second_rule?utm_source=chatgpt.com "Five second rule - Warcraft Wiki - Your wiki guide to the World of Warcraft"
[5]: https://www.wowhead.com/classic/guide/threat-overview-classic-wow "Threat and Aggro Management in WoW Classic - Wowhead"
[6]: https://vanilla-wow-archive.fandom.com/wiki/Aggro_radius "Aggro radius | Vanilla WoW Wiki | Fandom"
[7]: https://warcraft.wiki.gg/wiki/Patch_1.12?utm_source=chatgpt.com "Patch 1.12.0 - Warcraft Wiki - Your wiki guide to the World of Warcraft"

