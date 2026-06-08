using Godot;

public partial class RegimeScaffold : Control
{
    [Export] public string Regime { get; set; } = "Wittehaven";

    public override void _Ready()
    {
        SetAnchorsAndOffsetsPreset(LayoutPreset.FullRect);
        BuildPage(PaletteFor(Regime));
    }

    private void BuildPage(RegimePalette p)
    {
        AddRect("Page", new Rect2(Vector2.Zero, new Vector2(640, 360)), p.Background);
        AddRect("TopRule", new Rect2(24, 24, 592, 2), p.Rule);
        AddRect("BottomRule", new Rect2(24, 334, 592, 2), p.Rule);
        AddRect("Pouch", new Rect2(38, 238, 104, 74), p.Surface, p.Rule);
        AddRect("TinctureWheel", new Rect2(246, 64, 148, 148), p.Surface, p.Rule);
        AddRect("PatientPanel", new Rect2(72, 58, 150, 104), p.Surface, p.Rule);
        AddRect("Notebook", new Rect2(432, 202, 148, 100), p.Surface, p.Rule);
        AddRect("FocusMark", new Rect2(310, 124, 20, 20), p.Accent);
        AddRect("NameLine", new Rect2(456, 232, 96, 2), p.Rule);
        AddRect("BreathLine", new Rect2(456, 254, 72, 2), p.Rule);
        AddLabel("Title", p.Title, new Vector2(36, 32), p.Ink, 18);
        AddLabel("Verbs", p.Verbs, new Vector2(82, 174), p.Ink, 14);
        AddLabel("Note", p.Note, new Vector2(418, 312), p.Ink, 12);
    }

    private void AddRect(string name, Rect2 rect, Color fill, Color? stroke = null)
    {
        var r = new ColorRect
        {
            Name = name,
            Position = rect.Position,
            Size = rect.Size,
            Color = fill,
            MouseFilter = MouseFilterEnum.Ignore,
        };
        AddChild(r);
        if (stroke is null)
        {
            return;
        }
        var s = stroke.Value;
        AddRect($"{name}StrokeTop", new Rect2(rect.Position, new Vector2(rect.Size.X, 2)), s);
        AddRect($"{name}StrokeBottom", new Rect2(rect.Position + new Vector2(0, rect.Size.Y - 2), new Vector2(rect.Size.X, 2)), s);
        AddRect($"{name}StrokeLeft", new Rect2(rect.Position, new Vector2(2, rect.Size.Y)), s);
        AddRect($"{name}StrokeRight", new Rect2(rect.Position + new Vector2(rect.Size.X - 2, 0), new Vector2(2, rect.Size.Y)), s);
    }

    private void AddLabel(string name, string text, Vector2 position, Color color, int size)
    {
        var label = new Label
        {
            Name = name,
            Text = text,
            Position = position,
            Size = new Vector2(560, 48),
            MouseFilter = MouseFilterEnum.Ignore,
        };
        label.AddThemeColorOverride("font_color", color);
        label.AddThemeFontSizeOverride("font_size", size);
        AddChild(label);
    }

    private static RegimePalette PaletteFor(string regime)
    {
        return regime.ToLowerInvariant() switch
        {
            "paradise" => new RegimePalette(
                "PARADISE / SACRED VOICE",
                "Sit · Write the name",
                "recognition, not reward",
                new Color(0.08f, 0.07f, 0.055f),
                new Color(0.85f, 0.78f, 0.60f),
                new Color(0.74f, 0.60f, 0.28f),
                new Color(0.96f, 0.90f, 0.72f),
                new Color(0.96f, 0.90f, 0.72f)),
            _ => new RegimePalette(
                "WITTEHAVEN / SANCTIONED VOICE",
                "FILE · ADMINISTER · CHART · DOSE",
                "same geometry, colder grammar",
                new Color(0.84f, 0.88f, 0.91f),
                new Color(0.96f, 0.98f, 1.0f),
                new Color(0.35f, 0.54f, 0.70f),
                new Color(0.16f, 0.24f, 0.30f),
                new Color(0.10f, 0.16f, 0.20f)),
        };
    }

    private readonly record struct RegimePalette(string Title, string Verbs, string Note, Color Background, Color Surface, Color Rule, Color Ink, Color Accent);
}
