using Tincture.Substrate.Rules;

namespace Tincture.Tests.Rules;

public sealed class VerbInvocationStructureTests
{
    private static string RepoRoot => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void VerbInvocationStructure_OnlyVerbInvocationEmitsInvocationEvents()
    {
        var sourceRoot = Path.Combine(RepoRoot, "Tincture.Substrate");
        var allowed = Path.Combine("Rules", "VerbInvocation.cs");
        var offenders = Directory
            .EnumerateFiles(sourceRoot, "*.cs", SearchOption.AllDirectories)
            .Where(path => !IsUnderIgnoredBuildDirectory(sourceRoot, path))
            .Select(path => new
            {
                path,
                relativePath = Path.GetRelativePath(sourceRoot, path),
                text = File.ReadAllText(path)
            })
            .Where(file => !string.Equals(file.relativePath, allowed, StringComparison.Ordinal))
            .Where(file =>
                file.text.Contains("EventType = \"verb_invocation_", StringComparison.Ordinal)
                || file.text.Contains("EventType = VerbInvocation.", StringComparison.Ordinal))
            .Select(file => file.relativePath)
            .OrderBy(path => path, StringComparer.Ordinal)
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void VerbInvocationStructure_DoesNotEmitTimerOrCooldownEvents()
    {
        var source = File.ReadAllText(Path.Combine(RepoRoot, "Tincture.Substrate", "Rules", "VerbInvocation.cs"));

        Assert.DoesNotContain("EventType = \"timer_", source, StringComparison.Ordinal);
        Assert.DoesNotContain("EventType = TimerSystem.", source, StringComparison.Ordinal);
        Assert.DoesNotContain("EventType = \"cooldown_", source, StringComparison.Ordinal);
        Assert.DoesNotContain("EventType = CooldownSystem.", source, StringComparison.Ordinal);
    }

    [Fact]
    public void VerbInvocationStructure_UsesConcreteResolverWithoutNewResolverImplementations()
    {
        var source = File.ReadAllText(Path.Combine(RepoRoot, "Tincture.Substrate", "Rules", "VerbInvocation.cs"));

        Assert.Contains("OutcomeResolver", source, StringComparison.Ordinal);
        Assert.DoesNotContain("IOutcomeResolver", source, StringComparison.Ordinal);
    }

    private static bool IsUnderIgnoredBuildDirectory(string root, string path)
    {
        var relativeParts = Path.GetRelativePath(root, path)
            .Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

        return relativeParts.Contains("bin", StringComparer.Ordinal)
            || relativeParts.Contains("obj", StringComparer.Ordinal);
    }
}
