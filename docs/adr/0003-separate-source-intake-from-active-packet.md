# Separate source intake from the active packet

Raw handoff and source materials are vendored under `docs/source/` for traceability, but the active implementation contract lives in distilled packet/PRD docs. This preserves evidence without asking future agents to resolve every source conflict during execution.

Considered Options:
- Put raw handoff docs directly in the active packet: rejected because it would reintroduce context pollution and unresolved contradictions.
- Keep sources only in Downloads/local history: rejected because future agents need searchable provenance inside the repo.
- Vendor raw sources under `docs/source/` and distill active decisions elsewhere: chosen because it supports traceability while keeping the implementation read path clean.
