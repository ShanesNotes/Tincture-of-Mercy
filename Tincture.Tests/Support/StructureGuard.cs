namespace Tincture.Tests.Support;

internal static class StructureGuard
{
    public static string RepoRoot => Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    public static string SubstrateRoot => Path.Combine(RepoRoot, "Tincture.Substrate");

    public static string TestsRoot => Path.Combine(RepoRoot, "Tincture.Tests");

    public static IEnumerable<string> CSharpFiles(string root) => Directory
        .EnumerateFiles(root, "*.cs", SearchOption.AllDirectories)
        .Where(path => !IsUnderIgnoredBuildDirectory(root, path))
        .Order(StringComparer.Ordinal);

    public static IReadOnlyList<string> FilesContainingAny(
        string root,
        IEnumerable<string> patterns,
        ISet<string>? allowedRelativePaths = null)
    {
        var allowed = allowedRelativePaths ?? new HashSet<string>(StringComparer.Ordinal);
        return CSharpFiles(root)
            .Select(path => new
            {
                RelativePath = Path.GetRelativePath(root, path),
                Text = File.ReadAllText(path)
            })
            .Where(file => !allowed.Contains(file.RelativePath))
            .SelectMany(file => patterns
                .Where(pattern => file.Text.Contains(pattern, StringComparison.Ordinal))
                .Select(pattern => $"{file.RelativePath} contains {pattern}"))
            .Order(StringComparer.Ordinal)
            .ToList();
    }

    public static IReadOnlyList<string> FilesMatching(
        string root,
        Func<string, string, bool> predicate,
        ISet<string>? allowedRelativePaths = null)
    {
        var allowed = allowedRelativePaths ?? new HashSet<string>(StringComparer.Ordinal);
        return CSharpFiles(root)
            .Select(path => new
            {
                RelativePath = Path.GetRelativePath(root, path),
                Text = File.ReadAllText(path)
            })
            .Where(file => !allowed.Contains(file.RelativePath))
            .Where(file => predicate(file.RelativePath, file.Text))
            .Select(file => file.RelativePath)
            .Order(StringComparer.Ordinal)
            .ToList();
    }

    public static bool IsUnderIgnoredBuildDirectory(string root, string path)
    {
        var relativeParts = Path.GetRelativePath(root, path)
            .Split(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);

        return relativeParts.Contains("bin", StringComparer.Ordinal)
            || relativeParts.Contains("obj", StringComparer.Ordinal);
    }
}
