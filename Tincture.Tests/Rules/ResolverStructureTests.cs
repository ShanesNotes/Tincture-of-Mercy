using Tincture.Substrate.Rules;

namespace Tincture.Tests.Rules;

public sealed class ResolverStructureTests
{
    private static string RepoRoot => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void ResolverStructure_ExactlyOneProductionOutcomeResolver()
    {
        var implementations = typeof(IOutcomeResolver).Assembly
            .GetTypes()
            .Where(type => typeof(IOutcomeResolver).IsAssignableFrom(type))
            .Where(type => type is { IsInterface: false, IsAbstract: false })
            .Select(type => type.FullName)
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToList();

        Assert.Equal(["Tincture.Substrate.Rules.OutcomeResolver"], implementations);
    }

    [Fact]
    public void ResolverStructure_NoOutcomeResolverImplementationsOutsideSubstrateRules()
    {
        var allowed = Path.Combine("Tincture.Substrate", "Rules", "OutcomeResolver.cs");
        var interfaceFile = Path.Combine("Tincture.Substrate", "Rules", "IOutcomeResolver.cs");
        var offenders = Directory
            .EnumerateFiles(RepoRoot, "*.cs", SearchOption.AllDirectories)
            .Where(path => !IsUnderIgnoredDirectory(path))
            .Select(path => new
            {
                path,
                relativePath = Path.GetRelativePath(RepoRoot, path),
                text = File.ReadAllText(path)
            })
            .Where(file => file.relativePath != allowed)
            .Where(file => file.relativePath != interfaceFile)
            .Where(file => file.text.Contains("IOutcomeResolver", StringComparison.Ordinal))
            .Select(file => file.relativePath)
            .OrderBy(path => path, StringComparer.Ordinal)
            .ToList();

        Assert.Empty(offenders);
    }

    private static bool IsUnderIgnoredDirectory(string path)
    {
        var relativeParts = Path.GetRelativePath(RepoRoot, path)
            .Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

        return relativeParts.Contains(".git", StringComparer.Ordinal)
            || relativeParts.Contains(".godot", StringComparer.Ordinal)
            || relativeParts.Contains("bin", StringComparer.Ordinal)
            || relativeParts.Contains("obj", StringComparer.Ordinal)
            || relativeParts.Contains("Tincture.Tests", StringComparer.Ordinal);
    }
}
