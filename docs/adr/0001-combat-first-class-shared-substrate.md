# Combat is first-class while sharing the substrate

Combat remains a first-class player-facing and design-system concern, with its own feel targets, encounter data, acceptance criteria, and implementation slices. The architectural decision is that combat resolution follows the shared substrate described in the substrate document: care, combat, witness, and recollection emit into one event truth rather than splitting into unrelated resolver paths.

Considered Options:
- Treat combat as only a threat presentation layer: rejected because it demotes a system the project wants to take seriously.
- Build a separate combat engine beside care: rejected because it weakens the handoff's one-substrate direction and makes later cross-register consequences harder to reason about.
