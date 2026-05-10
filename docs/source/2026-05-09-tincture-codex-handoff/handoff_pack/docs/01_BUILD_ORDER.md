# 01_BUILD_ORDER — Codex Task Sequence

Each item should be a separate Codex task/commit unless it is tiny.

## Phase 0 — Repo discipline

0. Initialize repo structure.
1. Add this handoff pack and original artifacts under `docs/`.
2. Add minimal test harness.
3. Add project-local instructions/config after review.

## Phase 1 — Pure substrate, no Godot scene dependency

1. `SimClock`
   - Fixed tick or integer millisecond clock.
   - Schedules timers without render-frame coupling.
   - Tests: deterministic advancement; scheduled event fires once; no drift under repeated increments.

2. `SimEvent` ring buffer
   - Structured events include tick, source, target, verb, domain, result, amount, flags.
   - Tests: append, order, capacity, query by actor/domain.

3. `OutcomeResolver` / `CombatTable.Resolve()`
   - One resolver with outcome enum.
   - Supports domain projection but does not fork into care/combat engines.
   - Supports `ScriptedRoll(Result, amplitude)` and flags scripted events.
   - Tests: deterministic RNG seed; mutually exclusive outcomes; scripted override bypasses RNG and logs flag.

4. `AuraSystem`
   - Aura definition and instance.
   - Duration, tick interval, stacks, refresh, source/target.
   - Tests: apply, tick, expire, refresh, stack cap.

5. `ActorState`, `StatBlock`, `DerivedStats`
   - Small values.
   - Health, Spirit, Steady; placeholders for Burden, Pressure, Numbness.
   - Tests: derived stat recalculation.

6. `DisparityService`
   - One delta for patient acuity / recipe acuity / actor level.
   - Tests: same delta is reusable by resolver/radius/Witness.

7. `AttentionThreatTable`
   - Per-entity table of actor IDs to threat/attention values.
   - Tests: add threat, decay, top target, forced focus/taunt hook.

8. `AggroCallFleeRadius`
   - Uses disparity; no dusk multiplier in MVP.
   - Tests: same-level baseline; higher acuity/level changes radius; floor/ceiling.

9. Timers: GCD, Work/Cast/Channel, Swing/Rite pulse
   - Actor lockouts and scheduled pulses.
   - Tests: GCD blocks flagged actions but not aura ticks/swing events.

10. Resource profiles
   - Spirit regen with Vigil/FSR gate.
   - Steady fills from dealt/taken damage and drains after combat.
   - Tests: Spirit suppressed during FSR; Steady gain/drain.

## Phase 2 — Data rows and presenters

11. `AbilityDef` / `VerbDef`
   - Pour Water, Cook Porridge, Brew Febrifuge, Administer Febrifuge, Throw Cup, Bash, Cudgel Auto, Wolf Bite.
   - Tests: verbs compose from time/cost/target/resolution/effect/log primitives.

12. `ItemDef` / Quality tiers
   - Mundane Plantain, Tempered Mullein, Febrifuge, Cudgel.
   - Tests: craft outcome maps to quality/charges.

13. Domain presenters
   - CarePresenter, CombatPresenter, CraftPresenter, NotebookPresenter.
   - Tests: same event result maps to different text/visual descriptors.

14. Notebook event compilation
   - Lines generated from events.
   - Supports charcoal cross marker and scripted event marker internally.
   - Tests: water, porridge, mother Glance, self-administration produce expected entries.

## Phase 3 — Opening slice graybox

15. Act 1 graybox
   - Cabin, boy, mother, well, deer flee.
   - Teaches patient attention list and first care rolls.

16. Act 2 graybox
   - Cooking timer, foraging quality, Spirit gating.

17. Act 3 graybox
   - Tincture Wheel minimal UI; full resolver craft result; first vocation point placeholder.

18. Act 4 graybox
   - Scripted mother Glance amplitude 0.4; death event; notebook cross.

19. Act 5 graybox
   - Equip cudgel; wolf threat list includes Kalev and boy; boy path objective; Bash as high-threat action; wolf leash/retreat; Kalev self-administers remaining dose.

20. Full slice test pass
   - Verify no hand-authored UI line bypasses event log.
   - Verify no separate care resolver exists.
   - Verify combat reward is capped and subordinate to care/witness.

