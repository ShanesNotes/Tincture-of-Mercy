namespace Tincture.Substrate.Data;

public enum LatentPath
{
    Apothecary,
    Hesychasm,
    Iconographic
}

public static class LatentPathExtensions
{
    public static string ToId(this LatentPath path)
    {
        return path switch
        {
            LatentPath.Apothecary => "apothecary",
            LatentPath.Hesychasm => "hesychasm",
            LatentPath.Iconographic => "iconographic",
            _ => path.ToString().ToLowerInvariant()
        };
    }
}
