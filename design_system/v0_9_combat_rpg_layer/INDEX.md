# v0.9 — Combat / RPG Layer Packet

**Status:** superseded stub. Use `../v0_9_mercy_rpg_substrate/INDEX.md` for
the active implementation direction.

This packet began as a post-P0 combat/RPG expansion. The current direction is
broader and earlier: a combat-capable mercy RPG opening slice using the shared
substrate. Keep this file as provenance for research prompts and primitive
lists; do not use it as the active read path.

The intent is to mimic the **Vanilla World of Warcraft 1.12** combat-and-
progression engine at the substrate-primitive level (combat state machine,
swing-timer + GCD, auto-attack + ability composition, aura system, attack
table, threat, level/XP curve, loot tables with rarity tiers, weapon skill,
talent flow). Not the surface; the engine.

> **Current language:** combat is first-class in design and player-facing
> terms, while care and combat follow the shared substrate/event-truth design.
> Every primitive imported here must answer: *does this serve attention,
> names, care, and embodied risk, or does it displace them?*

---

## Source-of-truth ordering for this packet

1. `canonical_locks_v0_8_1.md` §17 — the post-P0 expansion clause that
   sanctions this packet's existence. *Read first.*
2. `research/` — three research dossiers (encyclopedia, primitives,
   synthesis). *Land them here.*
3. `SCOPE.md` — once research is in, this defines the v0.9 packet's
   sanctioned vocabulary surface, scope boundaries, and pillar
   inheritance from v0.8.1.
4. `primitives/` — one file per substrate primitive (combat-state-machine,
   swing-timer, gcd, aura, attack-table, threat, etc.). Engine spec.
5. `abilities/` — one file per concrete ability, expressed as a
   composition of primitives.
6. `encounters/` — encounter templates: aggro/leash/elite/dungeon-instance
   primitives composed into specific named encounters (the equivalent of
   Hogger, Stitches, Deadmines).
7. `acceptance/` — acceptance tests for the packet, in the same shape as
   `v0_8_1/acceptance_tests_v0_8_1.md`.

---

## Research workflow (current state)

| Pass | Agent | Output target | Status |
|---|---|---|---|
| 1 | Encyclopedia | `research/01_encyclopedia.md` | prompt drafted |
| 2 | Primitives | `research/02_primitives.md` | prompt drafted |
| 3 | Synthesis | `research/03_synthesis.md` + `SCOPE.md` draft | prompt drafted |

The three research outputs are independent and complementary. The synthesis
pass takes 1 + 2 as input and produces the v0.9 packet's actual scope and
subset-of-primitives selection.

---

## Vocabulary expansion (deferred)

Once `SCOPE.md` defines the packet's sanctioned vocabulary surface, the
following entries get added to `tools/anti_drift_allowlist.json` so the
P0 vocabulary gate does not fire inside this packet's directories:

```json
{
  "rule": "p0-vocabulary",
  "file": "v0_9_combat_rpg_layer/",
  "why": "v0.9 combat/RPG packet sanctions WoW-vanilla vocabulary for the
          combat layer (XP, level, loot, rarity, etc.). The P0 contemplative
          surface remains unchanged.",
  "owner": "design"
}
```

**Do not add this entry until `SCOPE.md` exists** — the allowlist must
inherit from a defined vocabulary surface, not pre-emptively whitelist a
whole directory.

---

## Compatibility tests (must remain green)

This packet expands; it does not replace. Any v0.9 design must keep these
v0.8.1 acceptance rows green:

- `U-09` — No raw Pressure / Burden / Numbness numbers in player-facing UI.
- `U-10` — No morality meter on the bedside / contemplative surfaces.
  *(A separate combat-only surface may expose its own numbers.)*
- `V-01` through `V-12` — visual locks (32×32 tiles, 64×96 Kalev, 640×360
  viewport, etc.) hold inside combat encounters too.
- `CANON-01..10` — canonical names and reservations.
- `M-01..M-05` — manual review gates around tone and contemplative core.

If a proposed v0.9 mechanic breaks one of these, the mechanic is wrong —
not the v0.8.1 lock.
