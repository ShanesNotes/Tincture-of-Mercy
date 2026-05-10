using Tincture.Substrate.Combat;
using Tincture.Substrate.Economy;
using Tincture.Substrate.Events;
using Tincture.Substrate.ReadModels;
using Tincture.Substrate.Rules;

namespace Tincture.Substrate.Runtime;

public sealed class OpeningActRuntime
{
    private readonly VerbInvocation verbInvocation;
    private readonly EncounterAiSystem encounterAiSystem;
    private readonly LootSystem lootSystem;
    private readonly OpeningActSnapshotProjector snapshotProjector;

    public OpeningActRuntime(
        VerbInvocation? verbInvocation = null,
        EncounterAiSystem? encounterAiSystem = null,
        LootSystem? lootSystem = null,
        OpeningActSnapshotProjector? snapshotProjector = null)
    {
        this.verbInvocation = verbInvocation ?? new VerbInvocation();
        this.encounterAiSystem = encounterAiSystem ?? new EncounterAiSystem();
        this.lootSystem = lootSystem ?? new LootSystem();
        this.snapshotProjector = snapshotProjector ?? new OpeningActSnapshotProjector();
    }

    public OpeningActRuntimeResult Tick(OpeningActRuntimeRequest request)
    {
        request.Validate();
        var appended = new List<SimEvent>();

        foreach (var verbRequest in request.VerbInvocations)
        {
            var result = verbInvocation.Invoke(verbRequest);
            appended.AddRange(result.AppendedEvents);
        }

        foreach (var encounterRequest in request.EncounterRequests)
        {
            var result = encounterAiSystem.EvaluateAndAppend(encounterRequest);
            appended.AddRange(result.AppendedEvents);
        }

        foreach (var lootRequest in request.LootRequests)
        {
            var result = lootSystem.EvaluateAndAppend(lootRequest);
            appended.AddRange(result.AppendedEvents);
        }

        var snapshot = snapshotProjector.Project(request.EventStream.Events, request.Tick);
        return new OpeningActRuntimeResult(
            Tick: request.Tick,
            AppendedEvents: appended.OrderBy(simEvent => simEvent.Sequence).ToList().AsReadOnly(),
            Snapshot: snapshot);
    }
}

public sealed record OpeningActRuntimeRequest
{
    public long Tick { get; init; }

    public SimEventStream EventStream { get; init; } = new();

    public IReadOnlyList<VerbInvocationRequest> VerbInvocations { get; init; } = [];

    public IReadOnlyList<EncounterAiRequest> EncounterRequests { get; init; } = [];

    public IReadOnlyList<LootRequest> LootRequests { get; init; } = [];

    public void Validate()
    {
        if (Tick < 0)
        {
            throw new InvalidOperationException("OpeningActRuntimeRequest.Tick must be non-negative.");
        }

        ArgumentNullException.ThrowIfNull(EventStream);
        ArgumentNullException.ThrowIfNull(VerbInvocations);
        ArgumentNullException.ThrowIfNull(EncounterRequests);
        ArgumentNullException.ThrowIfNull(LootRequests);

        foreach (var request in VerbInvocations)
        {
            request.Validate();
            RequireSameStream(request.EventStream, nameof(VerbInvocations));
        }

        foreach (var request in EncounterRequests)
        {
            request.Validate();
            RequireSameStream(request.EventStream, nameof(EncounterRequests));
        }

        foreach (var request in LootRequests)
        {
            request.Validate();
            RequireSameStream(request.EventStream, nameof(LootRequests));
        }
    }

    private void RequireSameStream(SimEventStream stream, string listName)
    {
        if (!ReferenceEquals(EventStream, stream))
        {
            throw new InvalidOperationException($"OpeningActRuntimeRequest.{listName} must use the runtime event stream.");
        }
    }
}

public sealed record OpeningActRuntimeResult(
    long Tick,
    IReadOnlyList<SimEvent> AppendedEvents,
    OpeningActSnapshot Snapshot);
