using Tincture.Substrate.Events;

namespace Tincture.Substrate.Sim.Timers;

public sealed record TimerRequest
{
    public string RequestId { get; init; } = string.Empty;

    public string ActorId { get; init; } = string.Empty;

    public string? TargetId { get; init; }

    public string VerbId { get; init; } = string.Empty;

    public SimDomain Domain { get; init; }

    public long StartedTick { get; init; }

    public string CompletionKey { get; init; } = "verb_invocation.timer_complete";

    public string CompletionConsumer { get; init; } = "verb_invocation";

    public string? SourceEventId { get; init; }

    public SortedDictionary<string, string> ContextFields { get; init; } = new(StringComparer.Ordinal);

    public TimerRequest Validate()
    {
        if (string.IsNullOrWhiteSpace(RequestId))
        {
            throw new InvalidOperationException("TimerRequest.RequestId must be non-blank.");
        }

        if (string.IsNullOrWhiteSpace(ActorId))
        {
            throw new InvalidOperationException("TimerRequest.ActorId must be non-blank.");
        }

        if (string.IsNullOrWhiteSpace(VerbId))
        {
            throw new InvalidOperationException("TimerRequest.VerbId must be non-blank.");
        }

        _ = Domain.ToId();

        if (StartedTick < 0)
        {
            throw new InvalidOperationException("TimerRequest.StartedTick must be non-negative.");
        }

        if (string.IsNullOrWhiteSpace(CompletionKey))
        {
            throw new InvalidOperationException("TimerRequest.CompletionKey must be non-blank.");
        }

        if (string.IsNullOrWhiteSpace(CompletionConsumer))
        {
            throw new InvalidOperationException("TimerRequest.CompletionConsumer must be non-blank.");
        }

        if (!CompletionConsumer.All(character =>
            character is >= 'a' and <= 'z'
            || character is >= '0' and <= '9'
            || character == '_'))
        {
            throw new InvalidOperationException("TimerRequest.CompletionConsumer must be snake_case for event tags.");
        }

        return this with { ContextFields = SimEvent.StableDictionary(ContextFields) };
    }
}

public sealed record TimerInterruptRequest
{
    public string InterruptId { get; init; } = string.Empty;

    public long Tick { get; init; }

    public string Reason { get; init; } = string.Empty;

    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(InterruptId))
        {
            throw new InvalidOperationException("TimerInterruptRequest.InterruptId must be non-blank.");
        }

        if (Tick < 0)
        {
            throw new InvalidOperationException("TimerInterruptRequest.Tick must be non-negative.");
        }

        if (string.IsNullOrWhiteSpace(Reason))
        {
            throw new InvalidOperationException("TimerInterruptRequest.Reason must be non-blank.");
        }
    }
}
