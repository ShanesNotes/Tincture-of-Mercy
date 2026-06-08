#nullable enable
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Tincture.AiMock;

public sealed class RuntimeEnvelope
{
    [JsonPropertyName("scene")]
    public SceneSnapshot Scene { get; set; } = new();

    [JsonPropertyName("kalev")]
    public KalevSnapshot Kalev { get; set; } = new();

    [JsonPropertyName("self")]
    public SelfSnapshot Self { get; set; } = new();

    [JsonPropertyName("event_tail")]
    public List<string> EventTail { get; set; } = new();

    [JsonPropertyName("memory")]
    public List<string> Memory { get; set; } = new();

    [JsonPropertyName("wiki")]
    public List<string> Wiki { get; set; } = new();

    [JsonPropertyName("kalev_says")]
    public string KalevSays { get; set; } = string.Empty;

    [JsonPropertyName("kalev_did")]
    public string? KalevDid { get; set; }
}

public sealed class SceneSnapshot
{
    [JsonPropertyName("location")]
    public string Location { get; set; } = string.Empty;

    [JsonPropertyName("hour")]
    public string Hour { get; set; } = string.Empty;

    [JsonPropertyName("weather")]
    public string Weather { get; set; } = string.Empty;

    [JsonPropertyName("present")]
    public List<string> Present { get; set; } = new();
}

public sealed class KalevSnapshot
{
    [JsonPropertyName("hp")] public double Hp { get; set; }
    [JsonPropertyName("spirit")] public double Spirit { get; set; }
    [JsonPropertyName("steady")] public double Steady { get; set; }
    [JsonPropertyName("burden")] public double Burden { get; set; }
    [JsonPropertyName("pressure")] public double Pressure { get; set; }
    [JsonPropertyName("numbness")] public double Numbness { get; set; }
    [JsonPropertyName("active_rite")] public string? ActiveRite { get; set; }
    [JsonPropertyName("carried")] public List<string> Carried { get; set; } = new();
}

public sealed class SelfSnapshot
{
    [JsonPropertyName("condition")] public string Condition { get; set; } = string.Empty;
    [JsonPropertyName("disposition_to_kalev")] public double DispositionToKalev { get; set; }
    [JsonPropertyName("register_open")] public List<string> RegisterOpen { get; set; } = new();
}
