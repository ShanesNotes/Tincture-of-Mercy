# Slice 7 — Anti-Drift Vocabulary and Validation

Status: active slice spec
Owner lane: documentation QA + tooling
Authority level: active for scoped vocabulary policy and final packet validation
Dependencies: `ACCEPTANCE.md`, `06-canon-surface-registry.md`, `design_system/tools/anti_drift.py`, `design_system/tools/anti_drift_allowlist.json`
Maximum intended scope: vocabulary/drift policy for v0.9 docs and later implementation surfaces; not final player-facing copy for every UI
Source references: v0.8.1 anti-drift rules as scoped provenance, active v0.9 PRD/slices/ADRs
Validation gate: anti-drift, required-doc existence check, context-aware stale-claim scan

## Core policy

The anti-drift gate protects scope and language. It should not convert v0.8.1 P0 care-surface copy cautions into project-wide doctrine.

Active v0.9 work can use RPG and combat vocabulary where the surface calls for it. Bedside, notebook, and contemplative care surfaces should still prefer tactile, person-specific language.

## Vocabulary scopes

| Scope | Audience | Allowed vocabulary posture | Examples |
|---|---|---|---|
| Player-facing bedside/care | player | Tactile, embodied, person-specific. Avoid abstract optimization language. | warm, dry, steady, carried, fading, write name. |
| Player-facing combat | player | Clear danger and action language. Can use direct combat terms when readability matters. | strike, guard, wound, threat, flee, loot/gather if surfaced. |
| Player-facing notebook | player | Names, memory, consequence, presence. Economy terms only when grounded in prose. | rough hide, bloodied cloth, Eli's name, page/line. |
| Debug/dev | developers/QA | Direct systems language. | XP, threat, aggro, damage, resolver, loot table, rarity, quality, path points. |
| Source/provenance | designers/agents | Quote or summarize older/source language with labels. | historical/source aliases and older beat names when needed. |
| Active docs | agents/implementers | Precise architecture language. | combat, loot, progression, boss/gravity encounter, substrate, event truth. |

## Sanctioned v0.9 terms

These terms are allowed in active v0.9 documentation and debug/dev contexts when they serve a clear spec purpose:

- combat
- damage
- threat
- aggro
- Health
- Spirit
- Steady
- Burden
- Pressure
- Numbness
- GCD
- swing timer
- cast/channel/work timer
- aura
- attack table
- loot
- loot table
- material drop
- equipment
- item quality
- rarity
- XP-style accounting
- Witness
- Recollection
- Vocation/path points
- level/leveling as internal or later-scoped progression vocabulary
- boss/gravity encounter
- death/friction
- path
- Apothecary
- Hesychasm
- Iconographic
- `ReceptivityProfile`
- `register_match_modifier`

## Scoped v0.8.1 care-surface restrictions

v0.8.1 care and notebook surfaces avoided overt RPG/combat vocabulary because that prototype emphasized bedside discernment. Keep that discipline for care surfaces unless an active issue chooses otherwise.

Do not read those P0 restrictions as project-wide exclusions. The active v0.9 packet includes first-class combat, RPG economy, loot/material consequence, and progression hooks.

## Historical/source language handling

When older/source language must be mentioned:

- Label it as historical, source, provenance, or older wording.
- State the active replacement or tie-breaker nearby.
- Avoid repeating older closure language as an active rule.

Examples:

| Older/source phrase shape | Active handling |
|---|---|
| older care-only P0 scope | label as scoped v0.8.1 provenance. |
| older food beat name | label as older source wording; active Act 2 uses bread. |
| older presence label | label as historical/source alias; active path name is Hesychasm. |
| older combat-reward caution | label as tuning/provenance; active economy allows grounded loot/material consequence. |

## Player-facing vocabulary matrix

| Surface | Prefer | Use carefully | Usually keep debug/internal |
|---|---|---|---|
| Bedside care | tend, wash, warm, sit, breath, fading, steady | medicine, dose, wound | XP, DPS, aggro, loot table, rarity. |
| Combat | strike, guard, flee, wound, threat, recover | damage, loot, cooldown, Health | raw formulas, table ids. |
| Notebook | name, page, line, carried, remembered, rough hide | material, wound, protection | XP, roll value, resolver id. |
| Economy/debug | loot, material, quality, rarity, table, eligibility | farming, diminishing returns | none; this is where direct system language belongs. |
| Wittehaven/sanctioned | case, outcome, stabilizer, impairment | sanctioned combat/economy terms when the surface exists | folk/sacred mixed into the same panel. |

## Tooling policy

`design_system/tools/anti_drift.py` currently scopes P0 vocabulary checks to player-facing runtime locations and documented meta files. The docs added in this packet do not require a tool code change by themselves.

Update `design_system/tools/anti_drift_allowlist.json` only when a real validation failure proves that an active v0.9 runtime or documentation path needs a documented exception. Any allowlist entry must include:

- `rule`
- `file`
- `why`
- `owner`
- optional `contains` when narrower matching is safer

## Validation commands

Run from repo root:

```bash
python3 design_system/tools/anti_drift.py --mode all --root design_system
```

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
]
missing = [path for path in required if not Path(path).is_file()]
if missing:
    raise SystemExit('missing required active docs:\n' + '\n'.join(missing))
CHECKDOCS
```

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

## Acceptance

This slice is accepted when:

- Active v0.9 vocabulary scopes are explicit.
- Combat/RPG terms are sanctioned for active docs and debug/dev surfaces.
- v0.8.1 care-surface caution remains scoped.
- No tooling update is made unless validation requires it.
- Anti-drift, required-doc, and stale-claim checks pass.
