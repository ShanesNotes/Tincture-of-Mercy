# Acceptance Matrix — v0.9 Mercy RPG Substrate

Status: active acceptance contract
Owner lane: QA + architecture
Authority level: active gate for docs, issue slices, and later implementation claims
Dependencies: `PRD.md`, `ISSUE_SLICES.md`, active slice specs, and Epic B pipeline handoff
Maximum intended scope: acceptance criteria for v0.9 substrate-first packet and opening-slice proof
Source references: `docs/source/2026-05-09-tincture-codex-handoff/handoff_pack/docs/03_ACCEPTANCE_CRITERIA.md`, v0.8.1 packet as scoped provenance
Validation gate: commands at the end of this file

## Acceptance levels

- **Docs gate:** proves the active packet and routing docs are coherent.
- **Substrate gate:** proves core mechanics before opening act implementation.
- **Opening gate:** proves the five-act slice after substrate acceptance.
- **Drift gate:** proves older scoped language has not re-entered active docs as doctrine.

## Cross-slice acceptance

| ID | Claim | Evidence required | Gate |
|---|---|---|---|
| A-01 | Active packet exists and is navigable. | `INDEX.md`, `PRD.md`, `ACCEPTANCE.md`, `ISSUE_SLICES.md`, `01` through `07` slice docs, and the `08` Epic B pipeline handoff exist. | Docs |
| A-02 | Source hierarchy is explicit. | `INDEX.md` and `06-canon-surface-registry.md` label active, provenance, source, generated-review, archive, stale surfaces. | Docs |
| A-03 | Substrate precedes opening content. | `PRD.md`, `02-substrate-primitives.md`, and `ISSUE_SLICES.md` define M1/B0 gate before Epic C implementation. | Docs/Substrate |
| A-04 | One event truth. | `02-substrate-primitives.md` and issues specify care/combat/craft/notebook as event projections. | Substrate |
| A-05 | One resolver family. | Implementation issues use `OutcomeResolver` and `OutcomeTable` data rows under one resolver architecture; no issue creates separate care/combat resolvers or combat-only table adapters. | Substrate |
| A-06 | Combat is first-class. | PRD, act bible, economy spec, and issue backlog include combat encounter data, threat, damage, cost, loot/material consequence, progression hooks, and feel/acceptance. | Docs/Opening |
| A-07 | Normal RPG risk/reward applies. | Economy spec allows damage, danger, loot, XP/Witness, equipment/material quality, rarity, and progression hooks with tuning levers. | Docs/Opening |
| A-08 | Care remains embodied. | Opening act bible defines water, bread, tincture, presence, witness, notebook, resources, and consequences. | Opening |
| A-09 | Act 2 uses bread. | Active act spec and issue slices use bread; porridge appears only when labeled as older source wording. | Drift |
| A-10 | Mother death is a gravity encounter. | Act 4 has meaningful player actions, event logging, fixed outcome, Witness/notebook aftermath, and debug acceptance. | Opening |
| A-11 | Wolf encounter is real combat. | Act 5 includes lethal/risky combat, threat targets, boy path objective, cost, possible wolf loot/material consequence, and aftermath events. | Opening |
| A-12 | Latent paths are active gameplay. | Paths spec defines Apothecary, Hesychasm, Iconographic, path progression, receptivity profile, and register match modifier. | Docs/Substrate |
| A-13 | Bethany payoff follows recognition/presence. | Paths spec and context glossary state corrected recipe is subordinate Apothecary learning. | Drift |
| A-14 | Anti-drift is scoped. | Vocabulary spec and allowlist/tooling permit active v0.9 RPG terms while preserving v0.8.1 care-surface restrictions. | Drift |
| A-15 | Root routing agrees. | `AGENTS.md`, `CONTEXT.md`, `README.md`, `CLAUDE.md`, `design_system/README.md`, and `design_system/SKILL.md` route to v0.9 active packet and label v0.8.1 as provenance/scoped P0. | Docs |

## Substrate acceptance matrix

| Primitive | Required tests/evidence | Later act that proves it |
|---|---|---|
| `SimClock` | Deterministic ticks, pause/resume, replay seed capture. | All acts |
| `SimEvent` | Ring buffer/event stream records actor, target, verb, domain, cost, result, tick, tags. | All acts |
| `OutcomeResolver` | Scripted fixture roll and seeded roll both produce stable events for care and combat domains; B2 records additive modifier composition under a named composer rule. | Tincture, wolves |
| `AuraSystem` | Add/remove/expire aura events and modifier projection. | Tincture, wolves |
| `ActorState` / `StatBlock` / `DerivedStats` | Health, Spirit, Steady, Burden, Pressure, Numbness hooks update through events. | Bread, Witness, wolves |
| `DisparityService` | Computes encounter and care mismatch/risk without owning final outcomes. | Tincture, wolves |
| `AttentionThreatTable` | Threat changes from care, movement, attacks, proximity, boy target pressure. | Wolves |
| `AggroCallFleeRadius` | Call/flee/leash radius events and target selection are replayable. | Wolves |
| Timers | GCD, work/cast/channel, swing, rite pulse timers emit start/tick/complete/interrupted events. | Bread, tincture, wolves |
| Resource profiles | Health/Spirit/Steady/Burden/Pressure/Numbness costs and consequences are event-derived. | All acts |
| FSR/Vigil | Cooldown and self-administration consequence are tracked. | Witness, wolves |
| `AbilityDef` / `VerbDef` | Verbs declare costs, domains, resolver table, tags, timer/cooldown ids, item requirements, and presenter text keys; consequential care/combat actions execute through `VerbInvocation`. | All acts |
| `ItemDef` / loot hooks | Quality budget, loot table hooks, material outcomes, and item events. | Bread, wolves |
| Leash/route/respawn | Routes and return/reset events are explicit; later content can tune friction. | Wolves |
| Death/friction/moral death | Death, downing, recovery, Witness, and consequence are event-backed. | Witness, wolves |
| Progression state | Witness, Recollection, Vocation/path points accrue from events. | Witness, wolves |
| Notebook/presenters | Notebook and domain presenters read events without owning authoritative state. | All acts |

## Opening act acceptance matrix

| Act | Must teach | Must record | Failure/cost shape |
|---|---|---|---|
| Water | Observe, wash, warm, basic state, resource/time pressure. | Care events, mother/boy state, notebook seed. | Wasted time, pressure, reduced receptivity, not hard fail by itself. |
| Bread | Food under constraint, timing, receptivity, ordinary mercy. | Bread use, receptivity shift, cost, embodied response. | Limited food spent poorly, pressure/burden changes, no recipe-victory framing. |
| Tincture | Shared resolver, scripted roll, resource temptation. | Craft/administer, roll metadata, result, consequence. | Wrong timing/cost can worsen state but does not rewrite Act 4 outcome. |
| Mother death/Witness | Meaningful care into fixed death, Witness, notebook, burden. | Witness event, death event, recollection hook, notebook entry. | Outcome fixed; actions alter learning, cost, state, and aftermath. |
| Wolves/boy flight/combat | Threat, aggro, timers, attacks, damage, flee route, loot/material consequence. | Combat events, boy safety state, loot/material event if earned, aftermath. | Kalev can be harmed or die per tuning; child safety is objective. |

## Required documentation checks

```bash
python3 - <<'CHECKDOCS'
from pathlib import Path
required = [
    'design_system/v0_9_mercy_rpg_substrate/INDEX.md',
    'design_system/v0_9_mercy_rpg_substrate/PRD.md',
    'design_system/v0_9_mercy_rpg_substrate/ACCEPTANCE.md',
    'design_system/v0_9_mercy_rpg_substrate/ISSUE_SLICES.md',
    'design_system/v0_9_mercy_rpg_substrate/01-active-packet.md',
    'design_system/v0_9_mercy_rpg_substrate/02-substrate-primitives.md',
    'design_system/v0_9_mercy_rpg_substrate/03-opening-act-bible.md',
    'design_system/v0_9_mercy_rpg_substrate/04-latent-paths-receptivity.md',
    'design_system/v0_9_mercy_rpg_substrate/05-rpg-economy-progression.md',
    'design_system/v0_9_mercy_rpg_substrate/06-canon-surface-registry.md',
    'design_system/v0_9_mercy_rpg_substrate/07-anti-drift-vocabulary.md',
    'design_system/v0_9_mercy_rpg_substrate/08-epic-b-substrate-pipeline-plan.md',
]
missing = [path for path in required if not Path(path).is_file()]
if missing:
    raise SystemExit('missing required active docs:\n' + '\n'.join(missing))
CHECKDOCS
```

## Stale-claim scan

Use this after the active packet and routing docs are updated. It intentionally allows labeled historical/source/provenance mentions while flagging active stale claims.

```bash
python3 - <<'CHECKSTALE'
from pathlib import Path
import re

roots = [Path('AGENTS.md'), Path('CLAUDE.md'), Path('README.md'), Path('CONTEXT.md'), Path('design_system'), Path('docs')]
exclude_parts = {'v0_8_1', 'source', '_archive'}
patterns = [
    re.compile(r'\bcombat\b.*\b(postponed|post-P0|deferred to post-P0|not in first playable)\b', re.I),  # allowlist: stale-scan pattern
    re.compile(r'\b(no loot reward from violence|lootless violence)\b', re.I),  # allowlist: stale-scan pattern
    re.compile(r'\bcombat\b.*\bsubordinate\b', re.I),  # allowlist: stale-scan pattern
    re.compile(r'\bv0[._]8[._]1\b.*\b(current canon hub|active implementation target)\b', re.I),  # allowlist: stale-scan pattern
    re.compile(r'\bPastoral\b', re.I),  # allowlist: stale-scan pattern
    re.compile(r'\bporridge\b', re.I),  # allowlist: stale-scan pattern
]
allowed_markers = [
    '_avoid_', 'avoid:', 'do not', "don't", 'without ', 'historical', 'source',
    'provenance', 'alias', 'older', 'where source docs say', 'replaces',
    'replaced', 'must not', 'no moralized', 'doctrine', 'allowlist', 'sanctioned',
    'scoped', 'stale', 'instead of', 'rather than', 'no active', 'not active',
    'not project-wide', 'not restated', 'not a moral ban', 'not a project-wide', 'rejected',
    'sanction', 'keeps care and combat interoperable',
]
violations = []
files = []
for root in roots:
    if root.is_file():
        files.append(root)
    elif root.is_dir():
        files.extend(path for path in root.rglob('*') if path.is_file() and not any(part in exclude_parts for part in path.parts))
for path in files:
    if path.suffix.lower() not in {'.md', '.json', '.py', '.yaml', '.yml', '.toml', '.txt'}:
        continue
    lines = path.read_text(errors='ignore').splitlines()
    for line_no, line in enumerate(lines, 1):
        if any(rx.search(line) for rx in patterns):
            text = line.strip()
            window = ' '.join(lines[max(0, line_no - 2):min(len(lines), line_no + 1)]).strip()
            low = window.lower()
            if not any(marker in low for marker in allowed_markers):
                violations.append(f'{path}:{line_no}: {text}')
if violations:
    raise SystemExit('unlabeled active stale-claim candidates:\n' + '\n'.join(violations))
CHECKSTALE
```

## Anti-drift gate

```bash
python3 design_system/tools/anti_drift.py --mode all --root design_system
```
