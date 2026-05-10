# Full substrate core precedes opening slice implementation

The active v0.9 implementation order is substrate first, opening content second. The opening five-act slice should prove a tested simulation/event substrate rather than define mechanics ad hoc in scene scripts.

Core substrate includes `SimClock`, `SimEvent`, `OutcomeResolver`, auras, actor state, resources, disparity, threat, aggro, timers, ability/item data, loot hooks, death/friction, progression, notebook, and domain presenters.

Considered Options:
- Start with the opening act scenes and backfill substrate later: rejected because it would couple narrative content to temporary mechanics and invite separate care/combat paths.
- Build only a narrow care substrate first: rejected because the active slice includes combat, flight, loot/material consequence, progression, and aftermath.
- Build the full core substrate before opening act implementation: chosen because it gives care and combat one event truth and makes the opening acts proof fixtures rather than architecture sources.
