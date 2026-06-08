#nullable enable
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace Tincture.AiMock;

/// <summary>
/// Minimal OpenAI-compatible chat client. Targets LM Studio's local server
/// (default http://localhost:1234/v1) but works against any /v1/chat/completions
/// endpoint that honors `response_format: { type: "json_object" }`.
///
/// Production note: in Godot, this exact class can be used as-is from a C#
/// service. Just construct it once, inject into your ChatService, and call
/// CompleteAsync from a Task. Godot's main thread is fine for awaiting HTTP
/// because we're not blocking it.
/// </summary>
public sealed class LlmClient : IDisposable
{
    private readonly HttpClient http;
    private readonly string baseUrl;
    private readonly string model;

    public LlmClient(string baseUrl, string model, TimeSpan? timeout = null)
    {
        this.baseUrl = baseUrl.TrimEnd('/');
        this.model = model;
        this.http = new HttpClient { Timeout = timeout ?? TimeSpan.FromMinutes(2) };
    }

    public async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userJson,
        double temperature = 0.4,
        CancellationToken ct = default)
    {
        var req = new ChatRequest
        {
            Model = model,
            Temperature = temperature,
            ResponseFormat = new ResponseFormat { Type = "json_object" },
            Messages = new List<ChatMessage>
            {
                new() { Role = "system", Content = systemPrompt },
                new() { Role = "user", Content = userJson },
            },
        };

        using var response = await http.PostAsJsonAsync($"{baseUrl}/v1/chat/completions", req, ct).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            throw new HttpRequestException($"LLM server returned {(int)response.StatusCode}: {body}");
        }

        var payload = await response.Content.ReadFromJsonAsync<ChatResponse>(cancellationToken: ct).ConfigureAwait(false)
            ?? throw new InvalidOperationException("LLM returned empty body.");
        var content = payload.Choices?[0]?.Message?.Content
            ?? throw new InvalidOperationException("LLM returned no content.");
        return content;
    }

    public void Dispose() => http.Dispose();

    private sealed class ChatRequest
    {
        [JsonPropertyName("model")] public string Model { get; set; } = string.Empty;
        [JsonPropertyName("temperature")] public double Temperature { get; set; }
        [JsonPropertyName("messages")] public List<ChatMessage> Messages { get; set; } = new();
        [JsonPropertyName("response_format")] public ResponseFormat? ResponseFormat { get; set; }
    }

    private sealed class ChatMessage
    {
        [JsonPropertyName("role")] public string Role { get; set; } = string.Empty;
        [JsonPropertyName("content")] public string Content { get; set; } = string.Empty;
    }

    private sealed class ResponseFormat
    {
        [JsonPropertyName("type")] public string Type { get; set; } = "json_object";
    }

    private sealed class ChatResponse
    {
        [JsonPropertyName("choices")] public List<Choice>? Choices { get; set; }
    }

    private sealed class Choice
    {
        [JsonPropertyName("message")] public ChatMessage? Message { get; set; }
    }
}
