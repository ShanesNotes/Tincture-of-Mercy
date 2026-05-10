# 02_CODEX_PROMPTS — Copy/Paste Task Packets

Use one packet per Codex session. Do not run all at once.

## Packet 0 — Repo read and plan

```text
Read AGENTS.md, docs/00_SOURCE_OF_TRUTH.md, docs/01_BUILD_ORDER.md, and the four original artifacts in docs/source/.

Do not implement yet. Produce a concise implementation plan for Phase 1 only. Identify the test framework you recommend for this repo, the files you expect to create, and any questions that block implementation. If a question does not block Phase 1, park it in docs/04_OPEN_QUESTIONS.md instead of asking me.
```

## Packet 1 — SimClock and SimEvent

```text
Implement Phase 1 tasks 1 and 2 only: SimClock and SimEvent ring buffer.

Requirements:
- Use fixed ticks or integer milliseconds, not accumulated render floats.
- SimEvent must include tick, source, target, verb id, domain, kind, outcome, amount, flags.
- Keep core logic in testable plain C# classes, not Godot nodes, unless the existing repo requires otherwise.
- Add tests for deterministic tick advancement, event order, ring capacity, and querying recent events.
- Do not implement UI, actors, combat, or care content yet.

After implementation, run tests and summarize the diff.
```

## Packet 2 — Single resolver with scripted override

```text
Implement Phase 1 task 3: OutcomeResolver / CombatTable.Resolve().

Requirements:
- One resolver only. Do not create CareCombatTable or CombatCombatTable.
- Outcome enum must include Miss, Dodge, Parry, Glance, Block, Crit, Crush, Hit.
- The resolver must support seeded deterministic rolls.
- Add ScriptedRoll(Result, amplitude) override for authored outcomes; set a Scripted flag on the emitted event/result.
- Add domain projection helpers only if they are thin presenters/mappers, not separate engines.
- Add tests for deterministic seed behavior, mutually exclusive outcomes, table priority, and scripted Glance amplitude 0.4.

Do not implement wolves, patient UI, or Godot scenes yet.
```

## Packet 3 — Auras and actors

```text
Implement Phase 1 tasks 4 and 5: AuraSystem plus ActorState/StatBlock/DerivedStats.

Requirements:
- Auras are first-class: fever, bleed, warmth, Faltering, prayer, food, etc. should all be representable by data.
- Support source, target, duration, tick interval, max stacks, refresh mode, snapshot/recalculate flag, and tag list.
- ActorState should support Health, Spirit, Steady, Burden, Pressure, Numbness as resource states, though only Health/Spirit/Steady need full behavior now.
- Add tests for aura apply/tick/expire/refresh/stacking and derived stat recalculation.
```

## Packet 4 — Disparity, threat, radius

```text
Implement Phase 1 tasks 6, 7, and 8: DisparityService, AttentionThreatTable, and AggroCallFleeRadius.

Requirements:
- One delta function should support patient acuity, recipe acuity, actor level, aggro/flee radius, and Witness scaling.
- Threat table must work for patients and wolves. Do not create separate patient-attention and combat-threat engines.
- Radius must use disparity and state modifiers, but do not add IsDusk/night multiplier for the MVP.
- Add tests showing that the same threat table can rank Boy/Mother attention and Wolf target selection.
```

## Packet 5 — Timers and resources

```text
Implement Phase 1 tasks 9 and 10: GCD, work/cast/channel, swing/rite pulse timers, Spirit, Steady, and Vigil/FSR gate.

Requirements:
- GCD blocks GCD-flagged verbs only.
- Auras, scheduled ticks, swing events, leash events, and log events continue during GCD.
- Spirit regenerates outside the Vigil/FSR lock.
- Steady fills from dealt/taken damage and drains after combat.
- Add tests for all timing/resource edge cases.
```

## Packet 6 — Data verbs

```text
Implement Phase 2 task 11: AbilityDef / VerbDef data rows.

Create minimal definitions for:
- Pour Water
- Cook Porridge
- Brew Febrifuge
- Administer Febrifuge
- Throw Cup
- Bash
- Cudgel Auto
- Wolf Bite

Each verb must compose from time primitive, cost primitive, targeting primitive, resolution primitive, effect primitive, and log primitive. Do not hard-code special-case behavior unless the verb uses the explicit ScriptedRoll affordance.
```

## Packet 7 — Notebook presenter

```text
Implement Phase 2 tasks 13 and 14: domain presenters and NotebookPresenter.

Requirements:
- Presenters subscribe to SimEvents.
- Notebook lines must be generated from structured events.
- Add entries for water, porridge, febrifuge craft, mother scripted Glance/death, wolf defense, and Kalev self-administration.
- Do not add floating damage text.
- Debug overlays are allowed only behind a development flag.
```

## Packet 8 — Opening slice graybox

```text
Build the opening slice graybox using the systems already implemented.

Acceptance requirements:
- Act 1: boy and mother are actors on the same attention list; water resolves through the shared resolver.
- Act 2: porridge uses work timer; herbs use quality tiers; Spirit behavior is visible in debug.
- Act 3: Tincture Wheel minimal UI produces two doses on Hit/Crit, one on Glance, ingredient loss on rare Miss.
- Act 4: mother receives scripted Glance amplitude 0.4, then death event, then notebook cross.
- Act 5: boy escapes to woodline; wolves target via threat table; Bash is high-threat; encounter resolves on boy reaching woodline, not kill count; Kalev drinks remaining dose.

Add integration tests or scripted smoke tests where practical.
```

## Packet 9 — Review for architecture drift

```text
Review the current codebase for violations of AGENTS.md.

Specifically check:
- Did we accidentally create separate care and combat engines?
- Are any notebook entries hand-triggered instead of event-derived?
- Are any conditions implemented as bespoke fields that should be auras?
- Did any day/night danger multiplier sneak into the MVP?
- Is kill reward capped/subordinate?
- Does any UI imply floating damage-number RPG language?

Produce a findings list, then make minimal corrective changes.
```

