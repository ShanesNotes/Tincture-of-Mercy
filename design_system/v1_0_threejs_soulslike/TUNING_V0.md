# v1.0 Tuning tables — v0 baseline (60Hz ticks; feel gate is the authority)

Seeded from the Opus council seat's souls-calibrated baseline, cross-checked against Codex/Grok/Kimi variants (noted where they diverge). Every value ships in `game/data/` as hot-reloadable data with an ER-referenced comment; the table freezes during each gauntlet round. Nothing here is scripture — F-gate rounds move numbers; blocking laws (sim-owned hitstop, no shake, token rule) do not move.

## Movement & defense (Burden bands)
| | Light (<30%) | Medium (30–70%) | Heavy (>70%) |
|---|---|---|---|
| Roll total | 40t | 43t | 48t |
| I-frames | t2–t16 (15) | t2–t14 (13) | t2–t12 (11) |
| Actionable from | t26 | t30 | t36 |
| Roll-cancel to attack | t20 | t22 | t26 |
(Alt reading from 3 seats: 26 i-frames as the 60Hz doubling of the 30fps convention — hold as the "generous" tune if F5/F6 rounds report unfair.)
Backstep 22t, i-frames t1–t5. Sprint drain 11 Breath/s. Jump 22 Breath, ~1.2m. Locomotion ~6m/s run; all displacement authored per-tick curves.

## Breath (stamina, 100 base)
Light attack 14 · heavy 26 · charged 34 · running 18 · rolling 16 · roll 22 (18/27 by band) · guard cost = incoming × 0.35 · regen 45/s starting 33t after last spend (40% while guarding) · zero-Breath guard break = 60t stagger.

## Steady (poise, buildup model; full reset after 90t clean)
Kalev base 20 (~35 with wolf-hide wrap) · wolf 12 · Turned humanoid 30 · Warden 65 (P1) / 80 (P2). Poise damage: light 10 · heavy 24 · charged 34 · running 14 · jump 30. Heavy attack hyperarmor t18–t29 (worth 25). Bands: flinch / stagger / knockdown per class table. Wither-typed hits ×1.4 poise.

## Hitstop (sim-owned per-actor freeze)
Light 3t · heavy 6t · charged 8t · blocked 5t · guard-break 9t · critical/death 12t. View adds ink-bloom at frame margin + 1-frame parchment inversion on criticals. No shake, no FOV punch, ever.

## Input
Buffer: attacks 10t, roll/flask 12t; single-slot, consumed at first actionable tick, dropped stale. Edge-latched at render rate into the tick queue. Deadzone defaults per-stick 0.18 radial.

## Attend (lock-on)
Acquisition half-cone 34°, range 15m; retain to 22m or 30t broken LOS; switch on stick flick >0.6 within ±45°, 12t cooldown, score 0.7 angle / 0.3 distance; on target death re-acquire ≤8m within 20t.

## Player weapon — hearth iron (opening weapon)
| Move | Startup | Active | Recovery | Tracking until | Breath | Poise dmg |
|---|---|---|---|---|---|---|
| Light 1 | 11 | 4 | 20 | t8 | 14 | 10 |
| Light 2 | 9 | 4 | 24 | t6 | 14 | 10 |
| Heavy | 24 | 5 | 34 | t16 | 26 | 24 |
| Charged | +≤45 hold | 5 | 38 | t16 | 34 | 34 |
| Running | 14 | 4 | 22 | t10 | 18 | 14 |
| Rolling | 12 | 4 | 26 | t8 | 16 | 12 |
| Riposte/backstab | 90t committed, i-frames t0–t80 | | | | 0 | — |

## Wolves (Baiter / Lunger / Harrier)
Lunger pounce 30t startup · Harrier flank bite 16t · Baiter feints low-commitment. One attack token per 3.5m ring; release 45t after resolution. Howl escalates +1. Leash 25m. Flee <25% Pulse, return ~40s. No Wither. Loot: hide/sinew/tooth/meat.

## The Warden of the Ironwood
Phase 1 (lantern left, axe right; Steady 65):
| Move | Startup | Active | Recovery | Tracks until | Poise dmg | Punish |
|---|---|---|---|---|---|---|
| Overhead fell | 32 | 4 | 46 | t24 | 40 | 2 lights / 1 heavy |
| Side clear | 22 | 5 | 30 | t16 | 32 | 1 light |
| Lantern swing (close) | 14 | 3 | 22 | t10 | 18 | roll-through only |
| Two-step chop | 26→14 | 4/4 | 38 | t18/t8 | 28+28 | after 2nd only |
| Stomp / snare kick | 18 | 3 | 26 | none | 22 | 1 light |
| Step-back + lantern raise (bait) | 40 | — | — | — | — | free heavy in P1; punished in P2 |

Transition at ~55%: hangs the lantern, self-administers E-7 — 90t invulnerable, deals no damage (ceremony, not a cheap hit).

Phase 2 (two-handed axe; Steady 80; speech narrows; 12 Wither/hit):
| Move | Startup | Active | Recovery | Notes |
|---|---|---|---|---|
| Wide fell | 36 | 5 | 40 | 55 poise dmg |
| Three-string sweep | 20→12→16 | 4 each | 44 after 3rd | main damage window |
| Snare toss (ranged) | 28 | proj | 30 | roots 45t |
| Charge-through | 30 | 6+24 travel | 36 | ends at the ring |
| Lantern-fire arc | 24 | 8 | 34 | only if player hugs the ring |
| The quiet (Wither pulse) | 30 | 12 | 40 | no damage; 25 Wither in 6m; tell = he stops moving |

Every move except the lantern swing has ≥22t punishable recovery. Arena: 18m shallow bowl, pine colonnade, snare-line ring with tin tags (root 45t + chime on contact). Ambient Wither 0.5/s off-path in the deep wood.

## Tincture (the vial — Anna's medicine)
Slice doses: 3 base, +1 per Hearth upgrade tier (pouch materials). Drink: committed clip in the frame-data table (startup/drink/recovery — punishable, survivable-if-timed). Variants: Pulseleaf Draught (instant) · Honeyed Draw (over-time) · Salt Wash (cleanse Turn) · Cedar-Wool Compress (Breath surge + brief Steady) · Bitter Phrine (large heal, deferred instability window). Ember Dose ×2 in slice: full Pulse+Breath restore + Turn cleanse + 20s surge; permanent Numbness stack each (−8% Tincture healing, +25% Turn buildup, +1 register-degradation step; partial text restore at Hearth).
