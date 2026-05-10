# Adopt a post-B0 architecture prelude gate before Epic C

Epic B B0 proves the shared substrate spine is accepted. Epic C should not
silently reinterpret that B0 gate; it needs a separate, explicit prelude gate
for the small set of architecture seams required before opening-act content can
safely begin.

The post-B0 prelude gates Epic C on four findings from the architecture review:

1. structural guard harness;
2. runtime / tick coordination;
3. Act Data Catalog;
4. Item Ledger / inventory projection.

Three additional findings are recorded as scoped or deferred refactors rather
than hard Epic-C blockers:

- Event vocabulary should be a registry over existing producer-owned constants,
  not a relocation of event identity away from the systems that emit events.
- `Tincture.Substrate/ReadModels/*` is for cross-module aggregate read models
  such as `OpeningActSnapshot`; module-local snapshots stay beside their
  producers unless a later ADR or concrete dependency justifies moving them.
- Recognition / notebook rule depth remains substrate-owned and event-derived;
  deepen it only when a concrete Epic C data dependency or later ADR requires
  more structure.

`OpeningActRuntime` is an ordered coordinator over concrete public seams. It may
coordinate `VerbInvocation.Invoke`, `EncounterAiSystem.EvaluateAndAppend`, and
`LootSystem.EvaluateAndAppend`. It must not call `SimEventStream.AppendBatch`
directly or expose a generic append broker. A fifth append path requires a new
ADR plus a structural guard.

This gate must not change existing B0 acceptance semantics or silently mutate
`ISSUE_SLICES.md` blocker meaning. If those meanings need to change, that is a
separate decision record.

Constraint: Epic C needs runtime/catalog/ledger/guard depth before authored opening content, while B0 acceptance semantics must remain stable.
Rejected: Treat all seven architecture findings as hard Epic-C blockers | that risks speculative scaffolding, forced snapshot relocation, and unnecessary recognition rewrites before content can start.
Rejected: Relocate all event constants into a central vocabulary file | it weakens module locality and creates coordination tax for every producer-owned event.
Rejected: Move module-local snapshots under `ReadModels/*` | co-located projections are already local and clear; only cross-module aggregate snapshots need the shared read-model namespace.
Rejected: Allow an unnamed runtime append escape clause | it invites a generic broker under a different name; future append paths need ADR plus guard.
Confidence: high
Scope-risk: moderate
Directive: Implement the prelude as a post-B0 gate on structural guards, runtime coordination, Act Data Catalog, and Item Ledger; preserve locality for event vocabulary and module-local snapshots.
Tested: Planning review verified B0 report, ADR 0010/0015 anchors, current AppendBatch callers, existing module-local snapshots, and duplicated structure-test helpers.
Not-tested: No source implementation has landed in this ADR; executable evidence belongs to the prelude manifest and targeted tests.
