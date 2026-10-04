# Tincture of Mercy Domain Context

This context captures the project language that governs story, care, doctrine, and simulation design. It is the shared glossary for documentation and implementation decisions.

## Language

**Bethany payoff**:
The later recognition that Kalev's care mattered because he was present to a person, not because a corrected recipe mechanically saved them.
_Avoid_: recipe victory, cure payoff, apothecary success ending

**Recognition**:
A person-specific response that reveals remembered presence across time.
_Avoid_: quest reward, success flag, reputation payout

**Presence**:
Sustained attention to a sufferer as a form of care even when biological rescue is impossible.
_Avoid_: passive waiting, idle empathy

**Corrected recipe**:
An Apothecary-layer learning artifact that may improve future practice but is not the cause of the Bethany payoff.
_Avoid_: salvific recipe, true ending cure

**Combat system**:
A first-class player-facing system for hostile encounters, timing, threat, risk, and bodily consequence.
_Avoid_: minigame, optional threat wrapper, separate combat fork

**Shared substrate**:
The common simulation layer that resolves care, combat, witness, recollection, and other verbs through one event truth.
_Avoid_: care engine plus combat engine, parallel resolver

**Mercy RPG vertical slice**:
The first playable shape that proves care, combat, witness, flight, and aftermath as RPG systems inside one opening slice.
_Avoid_: care-only prototype, combat-postponed prototype, genre demo

**Active direction**:
The currently routed implementation target that future agents should use before older packets.
_Avoid_: every packet is equally current, latest-looking file wins

**Scoped P0 restriction**:
A limit that applied to an earlier prototype slice, not a permanent project law.
_Avoid_: never, impossible, project-wide ban

**Source intake**:
Vendored raw handoff material kept for evidence and nuance, separate from the active implementation contract.
_Avoid_: active canon, implementation packet, agent read path

**Active packet**:
The distilled v0.9 mercy RPG substrate packet under `design_system/v0_9_mercy_rpg_substrate/`, including PRD, acceptance, issue slices, and the seven slice specs.
_Avoid_: raw handoff as direct contract, every source file is active

**Canon surface registry**:
The authority map that labels active, support, provenance, source, generated-review, archive, and stale surfaces.
_Avoid_: latest-looking file wins, all docs have equal authority

**Hesychasm**:
The active name for the discipline/register of prayerful attention, interior watchfulness, and sustained presence.
_Avoid_: Pastoral

**Pastoral**:
Historical/source-doc alias for **Hesychasm**, retained only when quoting or discussing older materials.
_Avoid_: active register name

**Voice registers**:
The copy-language modes used by surfaces and speakers: folk, sanctioned, and sacred.
_Avoid_: latent paths, skills

**Latent paths**:
The learning/attention paths of Apothecary, Hesychasm, and Iconographic practice.
_Avoid_: skill trees, skills, three registers

**Bread beat**:
The second opening-slice care beat where ordinary food, timing, resources, and consequence make care concrete.
_Avoid_: porridge beat

**Gravity encounter**:
A fixed-outcome teaching encounter where meaningful player actions teach the substrate while the story establishes that care does not control death.
_Avoid_: fake failure, unwinnable cutscene, recipe failure

**Wolf encounter**:
The opening combat encounter where Kalev protects the child through real violence, threat, cost, and possible wolf loot.
_Avoid_: nonviolent threat scene, lootless combat, loot-as-win-condition

**RPG risk/reward**:
The normal combat-economy logic where danger, player action, resources, loot, progression, and consequence are mechanically meaningful.
_Avoid_: moralized no-loot rule, purely symbolic combat, lootless risk

## Relationships

- A **corrected recipe** can coexist with **recognition**, but it must not replace **presence** as the meaning of the **Bethany payoff**.
- **Recognition** validates **presence**; it does not prove that care succeeded by technical cure.
- **Presence** can be meaningful even when Apothecary outcomes fail.
- The **combat system** is first-class in design and player-facing language while using the **shared substrate** for resolution and event logging.
- The **shared substrate** keeps care and combat interoperable without making combat subordinate to care.
- A **mercy RPG vertical slice** includes combat from the beginning; it is not a care-only prototype that postpones combat to a later layer.
- The **active direction** supersedes stale read paths without deleting their provenance value.
- A **scoped P0 restriction** must not be repeated as a project-wide rule unless a later active document explicitly chooses that rule again.
- **Source intake** supports traceability, but active work should be sliced from distilled PRD and packet docs.
- The **active packet** is the execution surface for v0.9; source intake and older packets support evidence and nuance.
- The **canon surface registry** decides which document authority label applies before implementation work begins.
- **Hesychasm** replaces **Pastoral** in active v0.9 direction documents.
- **Voice registers** govern language and presentation; **latent paths** govern learning, attention, and practice.
- Active docs should prefer **paths** over skills when describing Apothecary, Hesychasm, and Iconographic growth.
- The **bread beat** replaces the older porridge beat in the active five-act opening slice.
- The **bread beat** proves ordinary mercy under constraint, not cooking complexity or recipe success.
- The mother death is a **gravity encounter**: fixed outcome, meaningful actions, real learning, and persistent consequence.
- The **wolf encounter** objective is protection and escape; wolf loot is allowed as material consequence, not the measure of victory.
- **RPG risk/reward** applies to combat. The shared substrate exists partly to make WoW-shaped combat, loot, threat, timers, item quality, resources, and progression coherent with care.

## Example dialogue

> **Dev:** "When the boy recognizes Kalev in Bethany, is that because Kalev fixed the tincture recipe?"
> **Domain expert:** "No — the recipe can show Apothecary learning, but the payoff is that the boy recognizes Kalev's presence."
>
> **Dev:** "Should we avoid calling wolves a combat system because care and combat share the same resolver?"
> **Domain expert:** "No — combat is a first-class system. The design choice is that it resolves through the same substrate as care."
>
> **Dev:** "Is the first playable mainly a care prototype, with combat later?"
> **Domain expert:** "No — it is a combat-capable mercy RPG vertical slice from the beginning."
>
> **Dev:** "v0.8.1 says no combat in P0. Should future agents treat that as never combat?"
> **Domain expert:** "No — that was a scoped P0 restriction. The active direction now includes first-class combat."
>
> **Dev:** "Should agents implement straight from the handoff source files?"
> **Domain expert:** "No — keep those files as source intake, then implement from distilled active docs."
>
> **Dev:** "Should active docs keep calling the presence register Pastoral?"
> **Domain expert:** "No — use Hesychasm. Pastoral is a historical alias only."
>
> **Dev:** "Are Apothecary, Hesychasm, and Iconographic skills?"
> **Domain expert:** "No — they are latent paths. Skills language points agents toward a skill-tree frame too early."
>
> **Dev:** "Should Act 2 still be porridge because the source docs say porridge?"
> **Domain expert:** "No — active direction uses bread. The porridge source is historical."
>
> **Dev:** "Is bread a crafting minigame?"
> **Domain expert:** "No — bread is ordinary mercy under constraint: food, timing, receptivity, and consequence."
>
> **Dev:** "If mother dies no matter what, are the player actions fake?"
> **Domain expert:** "No — it is a gravity encounter. The actions teach the substrate and establish that care does not control death."
>
> **Dev:** "If Kalev fights wolves to protect a child, can that be lethal and lootable?"
> **Domain expert:** "Yes — combat is real. The boy escaping is the objective; wolf loot is allowed as consequence."
>
> **Dev:** "Should wolf loot be softened because this is a mercy game?"
> **Domain expert:** "No — normal RPG risk/reward applies. Ground it in the world, but do not erase the RPG economy."

## Flagged ambiguities

- The handoff materials used both "corrected recipe" and recognition/presence language for Bethany. Resolved: **Bethany payoff** follows the `latent_paths` direction; the corrected recipe is subordinate and must not be framed as the salvific cause.
- Combat language should not be demoted to "just threat presentation." Resolved: **combat system** is a first-class design and player-facing term, implemented through the **shared substrate** described by the substrate document.
- Current v0.8.1 docs describe a care-only P0 with combat deferred. Resolved for the new direction: the first playable is a **mercy RPG vertical slice** with combat present from the opening slice.
- To reduce context pollution, future agents should start from the **active direction** and treat older absolute-sounding closures as **scoped P0 restrictions** unless reaccepted by a later ADR.
- Raw handoff materials should be vendored under **source intake** and kept out of the active implementation read path.
- Active v0.9 work now routes through the **active packet**: `INDEX.md`, `PRD.md`, `ACCEPTANCE.md`, `ISSUE_SLICES.md`, and the seven slice specs.
- **Canon surface registry** resolves document authority before agents interpret older plans, generated review pages, or raw source files.
- `latent_paths` resolved the register rename: active v0.9 docs use **Hesychasm**; **Pastoral** remains a historical/source-doc alias.
- The active distinction is **voice registers** for folk/sanctioned/sacred copy and **latent paths** for Apothecary/Hesychasm/Iconographic practice.
- The active opening slice keeps the five-act structure but swaps the older porridge beat for the **bread beat**.
- **Bread beat** acceptance should look for limited food use, timing, mother-state/receptivity change, event logging, and no recipe-success framing.
- Mother death is a **gravity encounter**: the player performs meaningful care actions, learns mechanics, witnesses a fixed death, and carries the consequences forward.
- **Wolf encounter** acceptance should allow violent/lethal protection, threat handling, the boy reaching safety, event-logged cost, and recoverable wolf loot.
- Combat acceptance should test **RPG risk/reward**: danger, threat, damage, resource use, possible death/recovery, loot/material drops, and progression hooks.
