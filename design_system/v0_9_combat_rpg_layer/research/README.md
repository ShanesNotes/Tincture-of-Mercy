# Research dossiers — v0.9 Combat / RPG Layer

Three independent research passes feed this packet. Land each output as a
single markdown file at the path indicated.

## Pass 1 — Encyclopedia

**Output target:** `01_encyclopedia.md`

Comprehensive dossier on Vanilla WoW 1.12 RPG mechanics: XP scaling, loot
tables, rarity, weapon skill, combat-table avoidance, talent flow, danger
curve, reward-return loop, encounter pacing, death penalty, hidden
information. *What* the mechanics are and *why they felt the way they
felt*, plus a contemplative-care risk register.

## Pass 2 — Primitives (substrate)

**Output target:** `02_primitives.md`

Engine-model spec: the irreducible substrate primitives from which every
ability composes. Combat state machine, swing timer, GCD, resource
generation, ability shapes, attack table priority, aura system, threat,
combat log event stream, AI/aggro state machine. The vocabulary of
building blocks. Light C# signatures.

## Pass 3 — Synthesis

**Output target:** `03_synthesis.md`

Takes 1 + 2 as input. Produces:
- The **subset selection** — which primitives belong, which don't, why.
- The **minimal viable RPG layer** that preserves the contemplative core.
- A draft `SCOPE.md` for this packet (sanctioned vocabulary, scope
  boundaries, pillar inheritance from v0.8.1).
- A composition map from chosen primitives → concrete v0.9 abilities.
- Encounter-design guidance for the project's named-NPC universe.
- An honest assessment of whether the WoW substrate is right for this
  game, or whether a smaller subset (or different lineage) serves better.

## Workflow

1. Run Pass 1 prompt in Claude.ai Research mode. Paste output as
   `01_encyclopedia.md`.
2. Run Pass 2 prompt in Claude.ai Research mode. Paste output as
   `02_primitives.md`.
3. Run Pass 3 prompt in Claude.ai Research mode (with 1 + 2 attached as
   context, or with the relevant excerpts pasted into the prompt body).
   Paste output as `03_synthesis.md`.
4. Use the synthesis output to write `../SCOPE.md` and start populating
   `../primitives/` and `../abilities/`.
