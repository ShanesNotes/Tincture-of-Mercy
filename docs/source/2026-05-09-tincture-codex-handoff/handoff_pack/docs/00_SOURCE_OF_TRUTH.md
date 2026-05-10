# 00_SOURCE_OF_TRUTH — Working Canon for Implementation

This document reduces the dense artifacts into implementation canon for Codex.

## Core claim

Build one substrate, not two systems. Care and combat are different projections of the same simulation. A tincture dose, porridge, a cudgel strike, a wolf bite, and a notebook entry should all come from the same event-driven architecture.

## Current source hierarchy

1. `latent_paths.md` updates the register naming: Pastoral becomes Hesychasm. The slice itself does not change because Hesychasm surfaces later.
2. `opening_slice_design_v2.md` is the current MVP. It supersedes older slice ideas: five acts, no systemic dusk multiplier, mother dies in-cabin, boy flees during wolves, Kalev drinks the remaining dose.
3. `three_registers.md` is the moral architecture: care is Apothecary, Hesychasm/Pastoral, Iconographic; the late game is reading the room, not choosing the strongest register.
4. `Forward Substrate...md` is the expanded engine reference. Use it for SimClock, event log, aura system, resolver discipline, resource profiles, threat, and item quality. Where it conflicts with v2 slice, use v2 slice.

## MVP architecture target

The opening-slice MVP proves these primitives:

- Fixed simulation clock.
- Structured event log/ring buffer.
- Single-roll outcome resolver.
- Scripted roll override for authored outcomes.
- Domain presenters for care/combat/craft/notebook.
- Actor state and stat conversion.
- Acuity/level disparity service.
- Attention/threat table.
- Aggro/flee/call radius.
- GCD, work/cast/channel, swing/rite pulse timers.
- Resource profiles: Health, Spirit, Steady first; Burden/Pressure/Numbness as data hooks.
- Five-second/Vigil cooldown gating Spirit regeneration.
- Aura/condition system.
- Item quality and basic recipe output.
- Leash/retreat for wolves.
- Death/friction/moral event support.
- Witness/Recollection as progression event data.
- Notebook presenter.

## What not to build yet

- Full overworld.
- Full talent trees.
- Full inventory/economy.
- Full Orthodox calendar.
- Full herbal encyclopedia.
- Full day/night danger system.
- Floating damage text.
- Separate care/combat resolution systems.
- Loot loops from violence.

## First playable target

A graybox vertical slice with placeholder sprites is acceptable if it proves:

1. Water/porridge/tincture all resolve through the shared resolver.
2. The mother’s Act 4 forced Glance logs correctly.
3. The wolf fight uses the same threat table as patient attention.
4. The boy escaping, not wolf death, resolves the encounter.
5. Notebook lines are event-derived, not hand-triggered UI exceptions.

