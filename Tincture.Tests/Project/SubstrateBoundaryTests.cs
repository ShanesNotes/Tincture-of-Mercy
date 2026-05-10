namespace Tincture.Tests.Project;

public sealed class SubstrateBoundaryTests
{
    private static string RepoRoot => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void NoGodotReference_InSubstrateProject()
    {
        var projectText = File.ReadAllText(Path.Combine(RepoRoot, "Tincture.Substrate", "Tincture.Substrate.csproj"));

        Assert.Contains("Microsoft.NET.Sdk", projectText);
        Assert.DoesNotContain("Godot.NET.Sdk", projectText, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("PackageReference Include=\"Godot", projectText, StringComparison.OrdinalIgnoreCase);
    }


    [Fact]
    public void GodotProject_ReferencesSubstrateWithoutCompilingCoreProjects()
    {
        var projectText = File.ReadAllText(Path.Combine(RepoRoot, "Tincture-of-Mercy.csproj"));

        Assert.Contains("ProjectReference Include=\"Tincture.Substrate/Tincture.Substrate.csproj\"", projectText);
        Assert.Contains("Compile Remove=\"Tincture.Substrate/**/*.cs\"", projectText);
        Assert.Contains("Compile Remove=\"Tincture.Tests/**/*.cs\"", projectText);
    }

    [Fact]
    public void TinctureTests_ReferenceSubstrateWithoutReferencingGodotProject()
    {
        var projectText = File.ReadAllText(Path.Combine(RepoRoot, "Tincture.Tests", "Tincture.Tests.csproj"));

        Assert.Contains("ProjectReference Include=\"..\\Tincture.Substrate\\Tincture.Substrate.csproj\"", projectText);
        Assert.DoesNotContain("Tincture-of-Mercy.csproj", projectText, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Godot.NET.Sdk", projectText, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Determinism_NoPrivateEntropyInSubstrate()
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate");
        var blockedPatterns = new[]
        {
            "new Random(",
            "System.Random",
            "Random.Shared",
            "Guid.NewGuid(",
            "DateTime.Now",
            "DateTime.UtcNow",
            "DateTimeOffset.Now",
            "DateTimeOffset.UtcNow",
            "DateTime.Today",
            "Stopwatch.GetTimestamp(",
            "Stopwatch.StartNew(",
            "new Stopwatch(",
            "Environment.TickCount",
            "RandomNumberGenerator"
        };

        var offenders = Directory
            .EnumerateFiles(sourceRoot, "*.cs", SearchOption.AllDirectories)
            .Where(path => !IsUnderIgnoredBuildDirectory(sourceRoot, path))
            .Select(path => new { path, text = File.ReadAllText(path) })
            .SelectMany(file => blockedPatterns
                .Where(pattern => file.text.Contains(pattern, StringComparison.Ordinal))
                .Select(pattern => $"{Path.GetRelativePath(sourceRoot, file.path)} contains {pattern}"))
            .ToList();

        Assert.Empty(offenders);
    }

    private static bool IsUnderIgnoredBuildDirectory(string root, string path)
    {
        var relativeParts = Path.GetRelativePath(root, path)
            .Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

        return relativeParts.Contains("bin", StringComparer.Ordinal)
            || relativeParts.Contains("obj", StringComparer.Ordinal);
    }
}
