# B2 resolver spine uses generic outcome tables and named modifier composition

Epic B B2 keeps the resolver spine generic: care and combat both feed `OutcomeTable`
rows into the single `OutcomeResolver`, without a separate combat-table adapter.
Latent paths are represented as `LatentPath` enum values and serialize to stable
`path_id` strings at the event boundary. Modifier assembly is deterministic order;
modifier composition is additive for B2 and recorded as
`modifier_composer.additive.v1`.

Constraint: B3+ must build on one event truth, one resolver family, typed receptivity, deterministic replay, and stable fixtures.
Rejected: Keep a no-op `CombatTable.AsOutcomeTable()` adapter | it adds a combat-shaped seam without carrying distinct combat semantics.
Rejected: Keep path ids as free strings inside receptivity modifiers | it weakens the typed path/register contract B2 exists to establish.
Confidence: high
Scope-risk: narrow
Directive: Add new combat semantics as `OutcomeTable` rows, modifiers, or later data fields unless a future ADR intentionally changes the resolver spine.
Tested: B2 unit tests cover care/combat shared resolver, typed receptivity metadata, additive composer rule, and fixture stability.
Not-tested: B3 actor/resource/cost/aura integration is intentionally not implemented yet.
