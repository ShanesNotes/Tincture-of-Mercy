using Godot;

public partial class KalevLocomotionTest : Node2D
{
    private const int FrameWidth = 64;
    private const int FrameHeight = 96;
    private const int Columns = 5;

    private static readonly string SheetPath = "res://art/characters/kalev/sheets/kalev_locomotion_64x96.png";

    private Sprite2D _sprite = null!;
    private Label _label = null!;
    private int _direction; // 0=down, 1=left, 2=up, 3=right
    private int _frame;
    private bool _moving;
    private double _clock;

    public override void _Ready()
    {
        RenderingServer.SetDefaultClearColor(new Color(0.145f, 0.122f, 0.102f));

        var texture = GD.Load<Texture2D>(SheetPath);
        if (texture is null)
        {
            GD.PushError($"Could not load Kalev locomotion sheet: {SheetPath}");
            return;
        }

        _sprite = new Sprite2D
        {
            Name = "KalevSprite",
            Texture = texture,
            RegionEnabled = true,
            Centered = true,
            Position = new Vector2(320, 190),
            Scale = new Vector2(3, 3),
            TextureFilter = TextureFilterEnum.Nearest,
        };
        AddChild(_sprite);

        var camera = new Camera2D
        {
            Name = "Camera2D",
            Enabled = true,
            Position = new Vector2(320, 180),
        };
        AddChild(camera);

        _label = new Label
        {
            Name = "HelpLabel",
            Text = "Kalev locomotion test  |  Arrow keys/WASD move  |  idle uses last direction",
            Position = new Vector2(12, 12),
        };
        AddChild(_label);

        UpdateFrame();
    }

    public override void _Process(double delta)
    {
        var requestedDirection = _direction;
        var moving = false;

        if (Input.IsActionPressed("ui_down") || Input.IsKeyPressed(Key.S))
        {
            requestedDirection = 0;
            moving = true;
        }
        else if (Input.IsActionPressed("ui_left") || Input.IsKeyPressed(Key.A))
        {
            requestedDirection = 1;
            moving = true;
        }
        else if (Input.IsActionPressed("ui_up") || Input.IsKeyPressed(Key.W))
        {
            requestedDirection = 2;
            moving = true;
        }
        else if (Input.IsActionPressed("ui_right") || Input.IsKeyPressed(Key.D))
        {
            requestedDirection = 3;
            moving = true;
        }

        if (requestedDirection != _direction || moving != _moving)
        {
            _direction = requestedDirection;
            _moving = moving;
            _frame = 0;
            _clock = 0;
            UpdateFrame();
            return;
        }

        var secondsPerFrame = _moving ? 0.12 : 0.18;
        _clock += delta;
        if (_clock < secondsPerFrame)
        {
            return;
        }

        _clock -= secondsPerFrame;
        _frame = (_frame + 1) % Columns;
        UpdateFrame();
    }

    private void UpdateFrame()
    {
        if (_sprite is null)
        {
            return;
        }

        var row = RowFor(_direction, _moving);
        _sprite.RegionRect = new Rect2(_frame * FrameWidth, row * FrameHeight, FrameWidth, FrameHeight);

        if (_label is not null)
        {
            var directionName = _direction switch
            {
                0 => "down",
                1 => "left",
                2 => "up",
                3 => "right",
                _ => "down",
            };
            _label.Text = $"Kalev {( _moving ? "walk" : "idle" )}_{directionName}  frame {_frame + 1}/{Columns}";
        }
    }

    private static int RowFor(int direction, bool moving)
    {
        return direction switch
        {
            0 => moving ? 1 : 0, // down
            1 => moving ? 3 : 2, // left
            2 => moving ? 5 : 4, // up
            3 => moving ? 7 : 6, // right
            _ => 0,
        };
    }
}
