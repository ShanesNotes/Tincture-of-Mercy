# 03_ACCEPTANCE_CRITERIA — Opening Slice MVP

## Architecture acceptance

- [ ] Exactly one single-roll resolver exists.
- [ ] Care, combat, craft, and notebook are projections/presenters over events.
- [ ] Core simulation can run headless in tests.
- [ ] Fixed simulation time is used for timers.
- [ ] Every active verb emits a SimEvent.
- [ ] The mother’s scripted Glance is logged as a normal event with a Scripted flag.
- [ ] Auras represent ongoing state; fever/bleed/warmth/Faltering are not bespoke one-off systems.
- [ ] Threat/attention table works for patients and wolves.
- [ ] No `IsDusk` danger multiplier exists in MVP code.
- [ ] No floating damage text exists in default presentation.

## Slice acceptance

### Act 1
- [ ] Boy and mother appear in patient attention UI/debug.
- [ ] Mother is visibly worse than the boy in art/animation or placeholder labels.
- [ ] Deer/hare flee radius is functional.
- [ ] Offering water emits resolver event and notebook line.

### Act 2
- [ ] Porridge uses work timer.
- [ ] Herbs have quality tiers.
- [ ] Spirit/Vigil behavior is testable.
- [ ] Boy’s porridge Hit improves condition; mother’s Glance barely helps.

### Act 3
- [ ] Tincture Wheel or placeholder craft UI calls shared resolver.
- [ ] Hit/Crit/Glance/Miss craft outcomes map to dose count/quality/loss.
- [ ] First vocation point placeholder exists without requiring full tree.

### Act 4
- [ ] Administering to boy lands clean.
- [ ] Administering to mother uses ScriptedRoll(Glance, 0.4).
- [ ] Mother death event occurs after visible partial effect.
- [ ] Notebook records charcoal cross/name marker.
- [ ] Text framing avoids “apothecary failed”; it frames Kalev’s incomplete register.

### Act 5
- [ ] Equipping cudgel gives swing timer.
- [ ] Bash uses GCD, costs Steady, and creates high threat.
- [ ] Wolves consider both Kalev and boy in threat table.
- [ ] Boy path to woodline is the win condition.
- [ ] Wolf retreat/leash occurs on encounter resolution.
- [ ] Kalev self-administers remaining dose; Burden/self-mercy hook is recorded.

## Feel acceptance

- [ ] Combat feels like care under force, not a genre pivot.
- [ ] The notebook feels like the truth surface.
- [ ] The player learns by outcomes, not tutorial popups.
- [ ] Violence does not become the best income source.
- [ ] The mother’s death feels tragic and signposted, not arbitrary.

