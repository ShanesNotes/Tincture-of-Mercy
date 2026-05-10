# Active canon routes through the mercy RPG substrate packet

The active implementation direction now routes through the mercy RPG substrate packet rather than the older v0.8.1 care-only P0 read path. v0.8.1 remains valuable provenance for tone, names, visual language, and Godot/C# constraints, but its P0 restrictions should not be generalized into project-wide claims such as combat being absent from the game.

Considered Options:
- Keep v0.8.1 as the active implementation target: rejected because it causes context pollution for agents now planning a combat-capable opening slice.
- Delete or archive v0.8.1 immediately: rejected because it still contains useful provenance and concrete scaffold constraints.
- Add a small active routing layer before the full PRD: chosen because it gives future agents the right read path while keeping the early-stage docs reversible.
