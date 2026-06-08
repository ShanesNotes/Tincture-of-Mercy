#nullable enable
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Tincture.AiMock;

public sealed class NpcResponse
{
    [JsonPropertyName("say")]
    public string Say { get; set; } = string.Empty;

    [JsonPropertyName("gesture")]
    public string? Gesture { get; set; }

    [JsonPropertyName("register_used")]
    public string RegisterUsed { get; set; } = "sanctioned";

    [JsonPropertyName("proposed_intent")]
    public ProposedIntent? ProposedIntent { get; set; }

    [JsonPropertyName("memory_to_persist")]
    public string? MemoryToPersist { get; set; }

    [JsonPropertyName("internal_note")]
    public string InternalNote { get; set; } = string.Empty;
}

public sealed class ProposedIntent
{
    [JsonPropertyName("verb")]
    public string Verb { get; set; } = string.Empty;

    [JsonPropertyName("target")]
    public string Target { get; set; } = string.Empty;

    [JsonPropertyName("reason")]
    public string Reason { get; set; } = string.Empty;

    [JsonPropertyName("arguments")]
    public Dictionary<string, string>? Arguments { get; set; }
}
