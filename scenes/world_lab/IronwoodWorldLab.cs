using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using Tincture.Substrate.Economy;
using Tincture.Substrate.Events;
using Tincture.Substrate.Progression;
using Tincture.Substrate.ReadModels;

public partial class IronwoodWorldLab : Node2D
{
    private const int TileSize = 32;
    private const int FrameWidth = 64;
    private const int FrameHeight = 96;
    private const int Columns = 5;
    private const float Speed = 115f;
    private const int MapWidth = 46;
    private const int MapHeight = 34;

    private static readonly string TileSetPath = "res://art/environment/tilesets/ironwood_cabin_runtime_32.png";
    private static readonly string KalevSheetPath = "res://art/characters/kalev/sheets/kalev_locomotion_64x96.png";
    private static readonly string LenaSheetPath = "res://art/characters/lena/sheets/lena_pixellab_locomotion_64x96.png";
    private static readonly string IiroSheetPath = "res://art/characters/iiro/sheets/iiro_locomotion_48x64.png";
    private static readonly string AnnaSheetPath = "res://art/characters/anna/sheets/anna_bedside_96x48.png";
    private static readonly string BirdieSheetPath = "res://art/characters/birdie/sheets/birdie_character_idle_48x64.png";
    private static readonly string WolfSheetPath = "res://art/characters/wolf/sheets/wolf_full_sheet_96x64.png";
    private static readonly string OpeningActEventsPath = "res://data/opening/opening_act_cabin_prologue_events.json";
    private static readonly string HearthMusicPath = "res://audio/music/runtime/kyrie_at_the_hearth.ogg";
    private static readonly string OutdoorMusicPath = "res://audio/music/runtime/The_Threshold_of_Frost.ogg";
    private static readonly string HearthCracklePath = "res://audio/bed/hearth_crackle_placeholder.wav";

    private enum Tile
    {
        Snow = 0,
        SnowShadow = 1,
        Road = 2,
        RoadEdge = 3,
        Floor = 4,
        FloorShadow = 5,
        Wall = 6,
        Door = 7,
        Tree = 8,
        Brush = 9,
        Stone = 10,
        Hearth = 11,
        Bed = 12,
        Table = 13,
        Icon = 14,
        Rug = 15,
        Fence = 16,
        Logs = 17,
        Window = 18,
        Cabinet = 19,
        ThresholdLight = 20,
        Empty = 21,
        SnowDrift = 22,
        SnowTracks = 23,
        RoadRuts = 24,
        FloorLight = 25,
        FloorWorn = 26,
        WallCorner = 27,
        WallShadow = 28,
        Roof = 29,
        RoofSnow = 30,
        Porch = 31,
        HearthLeft = 32,
        HearthRight = 33,
        BedHead = 34,
        BedFoot = 35,
        TableLong = 36,
        Chair = 37,
        HerbShelf = 38,
        Crate = 39,
        Barrel = 40,
        CandleStand = 41,
        PineSmall = 42,
        Stump = 43,
    }

    private sealed class ActorAnim
    {
        public required string Name { get; init; }
        public required Sprite2D Sprite { get; init; }
        public int FrameWidth { get; init; }
        public int FrameHeight { get; init; }
        public int Columns { get; init; }
        public int Row { get; set; }
        public double SecondsPerFrame { get; init; }
        public double Clock { get; set; }
        public int Frame { get; set; }
    }

    private readonly Dictionary<Vector2I, Tile> _groundOverrides = new();
    private readonly Dictionary<Vector2I, Tile> _propTiles = new();
    private readonly HashSet<Vector2I> _blockedTiles = new();
    private readonly List<ActorAnim> _actors = new();
    private readonly Dictionary<string, ActorAnim> _actorAnimsByName = new(StringComparer.Ordinal);
    private readonly List<SimEvent> _openingEvents = new();

    private Texture2D _tiles = null!;
    private Sprite2D _kalev = null!;
    private Node2D _player = null!;
    private Camera2D _camera = null!;
    private GpuParticles2D _breath = null!;
    private PointLight2D _hearthLight = null!;
    private AudioStreamPlayer _hearthMusic = null!;
    private AudioStreamPlayer _outdoorMusic = null!;
    private AudioStreamPlayer _hearthCrackle = null!;
    private Label _label = null!;
    private int _direction; // 0=down, 1=left, 2=up, 3=right
    private int _frame;
    private bool _moving;
    private double _clock;
    private OpeningActVisualState _openingVisualState = OpeningActVisualState.Empty;
    private OpeningActSnapshot _openingSnapshot = null!;
    private WolfEncounterVisualState _wolfEncounterVisualState = WolfEncounterVisualState.Empty;
    private int _openingEventCursor;
    private bool _advanceOpeningHeld;
    private bool _resetOpeningHeld;
    private string _openingBeatLine = string.Empty;

    public override void _Ready()
    {
        // Cool ash-night clear so anything outside CanvasModulate reads as deep slate
        // rather than warm brown. CanvasModulate then drives the dominant page tint.
        RenderingServer.SetDefaultClearColor(new Color(0.05f, 0.06f, 0.08f));

        _tiles = GD.Load<Texture2D>(TileSetPath);
        var kalevTexture = GD.Load<Texture2D>(KalevSheetPath);
        if (_tiles is null || kalevTexture is null)
        {
            GD.PushError($"Could not load world lab textures: {TileSetPath}, {KalevSheetPath}");
            return;
        }

        BuildAtmosphere();
        BuildLayout();
        BuildWorld();
        BuildCast();
        BuildPlayer(kalevTexture);
        BuildBreath();
        BuildLights();
        BuildWindowShafts();
        BuildWeather();
        BuildOverlay();
        BuildMusic();
        ApplyOpeningActProjection();
        BuildUi();
        UpdateAnimationFrame();
    }

    public override void _Process(double delta)
    {
        var input = ReadInput(out var requestedDirection);
        _moving = input.LengthSquared() > 0.001f;
        if (_moving)
        {
            _direction = requestedDirection;
            var next = _player.Position + input.Normalized() * Speed * (float)delta;
            MoveIfWalkable(next);
        }

        _clock += delta;
        var secondsPerFrame = _moving ? 0.12 : 0.20;
        if (_clock >= secondsPerFrame)
        {
            _clock -= secondsPerFrame;
            _frame = (_frame + 1) % Columns;
            UpdateAnimationFrame();
        }

        AnimateActors(delta);

        if (_camera is not null && _player is not null)
        {
            // Subtle look-ahead in the facing direction so the camera leads movement.
            var lookAhead = _direction switch
            {
                0 => new Vector2(0, 24),
                1 => new Vector2(-24, 0),
                2 => new Vector2(0, -24),
                3 => new Vector2(24, 0),
                _ => Vector2.Zero,
            };
            _camera.Position = _player.Position + new Vector2(0, -28) + lookAhead;
        }

        // Y-sort Kalev against the rest of the cast so taller props/actors below
        // him render in front when he steps past their feet.
        if (_player is not null)
        {
            _player.ZIndex = Mathf.RoundToInt(_player.Position.Y / TileSize) + 20;
        }

        if (_breath is not null)
        {
            _breath.Emitting = !_moving && IsOutdoorGroundUnderFeet();
        }

        UpdateOpeningActInput();
        UpdateAudioBed(delta);

        if (_label is not null)
        {
            _label.Text = BuildHudText();
        }
    }

    private void BuildLayout()
    {
        _groundOverrides.Clear();
        _propTiles.Clear();
        _blockedTiles.Clear();

        BuildIronwoodRoad();
        BuildCabin();
        BuildForestAndYard();
    }

    private void BuildIronwoodRoad()
    {
        for (var y = 0; y < MapHeight; y++)
        {
            var center = RoadCenter(y);
            for (var x = center - 2; x <= center + 2; x++)
            {
                if (!InBounds(x, y))
                {
                    continue;
                }
                var roadTile = x == center - 2 || x == center + 2
                    ? Tile.RoadEdge
                    : (Hash(x, y) % 3 == 0 ? Tile.RoadRuts : Tile.Road);
                SetGround(x, y, roadTile);
            }
        }

        // Neutral worn threshold; the warmth is carried by light, not a flat gold tile.
        for (var y = 23; y <= 27; y++)
        {
            SetGround(23, y, Tile.RoadRuts);
            SetGround(24, y, Tile.RoadRuts);
        }

        foreach (var p in new[]
        {
            new Vector2I(22, 26), new Vector2I(25, 27), new Vector2I(21, 29),
            new Vector2I(26, 31), new Vector2I(19, 24), new Vector2I(28, 23),
        })
        {
            SetGround(p.X, p.Y, Tile.SnowTracks);
        }
    }

    private static int RoadCenter(int y)
    {
        if (y < 8)
        {
            return 18 + y / 3;
        }
        if (y < 18)
        {
            return 21 + (y - 8) / 5;
        }
        if (y < 25)
        {
            return 23;
        }
        return 24 + (y - 25) / 7;
    }

    private void BuildCabin()
    {
        const int left = 15;
        const int right = 32;
        const int top = 10;
        const int bottom = 23;

        for (var y = top + 1; y < bottom; y++)
        {
            for (var x = left + 1; x < right; x++)
            {
                var h = Hash(x, y);
                var floor = y > 19
                    ? Tile.FloorShadow
                    : (h % 9 == 0 ? Tile.FloorWorn : Tile.Floor);
                SetGround(x, y, floor);
            }
        }

        // Rugs and warmer cabin center.
        for (var y = 17; y <= 20; y++)
        {
            for (var x = 21; x <= 25; x++)
            {
                SetGround(x, y, Tile.Rug);
            }
        }

        for (var y = 12; y <= 16; y++)
        {
            SetGround(17, y, Tile.FloorLight);
            SetGround(18, y, Tile.FloorLight);
            SetGround(19, y, Tile.FloorLight);
        }

        for (var x = left; x <= right; x++)
        {
            AddWall(x, top);
            if (x is not 23 and not 24)
            {
                AddWall(x, bottom);
            }
        }

        for (var y = top; y <= bottom; y++)
        {
            AddWall(left, y);
            AddWall(right, y);
        }

        // Snow-loaded roof lip and porch make the cabin read as a place rather
        // than a rectangle of floor tiles.
        for (var x = left - 1; x <= right + 1; x++)
        {
            AddProp(x, top - 2, x % 3 == 0 ? Tile.RoofSnow : Tile.Roof, true);
            AddProp(x, top - 1, Tile.Roof, true);
        }

        for (var x = 21; x <= 26; x++)
        {
            SetGround(x, bottom + 1, Tile.Porch);
        }

        AddProp(left, top, Tile.WallCorner, true);
        AddProp(right, top, Tile.WallCorner, true);
        AddProp(left, bottom, Tile.WallShadow, true);
        AddProp(right, bottom, Tile.WallShadow, true);
        AddProp(20, top, Tile.Window, true);
        AddProp(27, top, Tile.Window, true);
        AddProp(23, bottom, Tile.Door, false);
        AddProp(24, bottom, Tile.Door, false);

        AddProp(17, 13, Tile.HearthLeft, true);
        AddProp(18, 13, Tile.HearthRight, true);
        AddProp(29, 15, Tile.BedHead, true);
        AddProp(30, 15, Tile.BedFoot, true);
        AddProp(21, 18, Tile.TableLong, true);
        AddProp(22, 18, Tile.Chair, true);
        AddProp(18, 11, Tile.Icon, true);
        AddProp(30, 12, Tile.Cabinet, true);
        AddProp(26, 21, Tile.Cabinet, true);
        AddProp(17, 11, Tile.HerbShelf, true);
        AddProp(20, 15, Tile.CandleStand, true);
        AddProp(27, 18, Tile.TableLong, true);
        AddProp(28, 19, Tile.Chair, true);
        AddProp(16, 20, Tile.Barrel, true);
        AddProp(31, 21, Tile.Crate, true);
    }

    private void BuildForestAndYard()
    {
        // Human-placed silhouettes near the cabin first.
        foreach (var p in new[]
        {
            new Vector2I(11, 9), new Vector2I(12, 18), new Vector2I(35, 9), new Vector2I(37, 15),
            new Vector2I(8, 24), new Vector2I(39, 25), new Vector2I(10, 29), new Vector2I(36, 30),
        })
        {
            AddProp(p.X, p.Y, Tile.Tree, true);
        }

        foreach (var p in new[]
        {
            new Vector2I(13, 10), new Vector2I(34, 13), new Vector2I(14, 29), new Vector2I(38, 28),
            new Vector2I(6, 20), new Vector2I(42, 18),
        })
        {
            AddProp(p.X, p.Y, Tile.PineSmall, true);
        }

        foreach (var p in new[]
        {
            new Vector2I(15, 28), new Vector2I(32, 26), new Vector2I(9, 17), new Vector2I(37, 23),
        })
        {
            AddProp(p.X, p.Y, Tile.Stump, true);
        }

        foreach (var p in new[]
        {
            new Vector2I(13, 25), new Vector2I(14, 25), new Vector2I(33, 22), new Vector2I(34, 22),
            new Vector2I(12, 14), new Vector2I(36, 18), new Vector2I(7, 13), new Vector2I(40, 12),
        })
        {
            AddProp(p.X, p.Y, Tile.Brush, true);
        }

        foreach (var p in new[]
        {
            new Vector2I(13, 21), new Vector2I(35, 21), new Vector2I(18, 27), new Vector2I(31, 27),
        })
        {
            AddProp(p.X, p.Y, Tile.Stone, true);
        }

        foreach (var p in new[]
        {
            new Vector2I(12, 27), new Vector2I(13, 27), new Vector2I(14, 27),
            new Vector2I(34, 26), new Vector2I(35, 26), new Vector2I(36, 26),
        })
        {
            AddProp(p.X, p.Y, Tile.Fence, true);
        }

        AddProp(18, 25, Tile.Logs, true);
        AddProp(19, 25, Tile.Logs, true);
        AddProp(31, 25, Tile.Logs, true);

        // Edge forest with deterministic variation; avoid the road/cabin core.
        for (var y = 1; y < MapHeight - 1; y++)
        {
            for (var x = 1; x < MapWidth - 1; x++)
            {
                if (x > 12 && x < 35 && y > 7 && y < 28)
                {
                    continue;
                }
                if (_propTiles.ContainsKey(new Vector2I(x, y)))
                {
                    continue;
                }
                var h = Hash(x, y);
                if (h % 19 == 0)
                {
                    AddProp(x, y, Tile.Tree, true);
                }
                else if (h % 17 == 0)
                {
                    AddProp(x, y, Tile.PineSmall, true);
                }
                else if (h % 23 == 0)
                {
                    AddProp(x, y, Tile.Brush, true);
                }
                else if (h % 37 == 0)
                {
                    AddProp(x, y, Tile.Stump, true);
                }
                else if (h % 41 == 0)
                {
                    AddProp(x, y, Tile.Stone, true);
                }
            }
        }

        for (var y = 0; y < MapHeight; y++)
        {
            for (var x = 0; x < MapWidth; x++)
            {
                if (x == 0 || y == 0 || x == MapWidth - 1 || y == MapHeight - 1)
                {
                    AddProp(x, y, Tile.Tree, true);
                }
            }
        }
    }

    private void BuildWorld()
    {
        var ground = new Node2D { Name = "GroundTiles", YSortEnabled = false };
        AddChild(ground);
        var props = new Node2D { Name = "Props", YSortEnabled = true };
        AddChild(props);

        for (var y = 0; y < MapHeight; y++)
        {
            for (var x = 0; x < MapWidth; x++)
            {
                var pos = new Vector2I(x, y);
                var groundTile = _groundOverrides.TryGetValue(pos, out var tile) ? tile : DefaultGround(x, y);
                ground.AddChild(MakeTile(groundTile, x, y, $"Ground_{x}_{y}"));
                if (_propTiles.TryGetValue(pos, out var propTile))
                {
                    var prop = MakeTile(propTile, x, y, $"Prop_{propTile}_{x}_{y}");
                    prop.ZIndex = y;
                    props.AddChild(prop);
                }
            }
        }
    }

    private void BuildCast()
    {
        var actors = new Node2D { Name = "Cast", YSortEnabled = true };
        AddChild(actors);

        AddActor(actors, "AnnaBedside", AnnaSheetPath, 96, 48, 5, 0, new Vector2(30 * TileSize + 6, 17 * TileSize + 17), 0.28);
        AddActor(actors, "IiroCabinBoy", IiroSheetPath, 48, 64, 5, 0, new Vector2(20 * TileSize + 16, 17 * TileSize + 26), 0.18);
        AddActor(actors, "LenaThreshold", LenaSheetPath, 64, 96, 5, 0, new Vector2(27 * TileSize + 16, 24 * TileSize + 22), 0.22);
        AddActor(actors, "BirdieChild", BirdieSheetPath, 48, 64, 5, 0, new Vector2(21 * TileSize + 16, 26 * TileSize + 22), 0.20);
        AddActor(actors, "Wolf01Treeline", WolfSheetPath, 96, 64, 5, 0, new Vector2(39 * TileSize + 16, 21 * TileSize + 28), 0.20);
        AddActor(actors, "Wolf02Treeline", WolfSheetPath, 96, 64, 5, 0, new Vector2(42 * TileSize + 16, 19 * TileSize + 28), 0.20);
    }

    private void BuildPlayer(Texture2D kalevTexture)
    {
        _player = new Node2D
        {
            Name = "KalevPlayer",
            Position = new Vector2(24 * TileSize + 16, 27 * TileSize + 24),
            ZIndex = 80,
        };
        AddChild(_player);

        _kalev = new Sprite2D
        {
            Name = "KalevSprite",
            Texture = kalevTexture,
            RegionEnabled = true,
            Centered = false,
            Position = new Vector2(-FrameWidth / 2f, -84), // parent position is the feet/baseline anchor
            TextureFilter = TextureFilterEnum.Nearest,
        };
        _player.AddChild(_kalev);

        _camera = new Camera2D
        {
            Name = "WorldCamera",
            Enabled = true,
            // 1.0 reads the cabin shell, road, and treeline in one frame — keeps
            // Kalev small under the unseen order the aesthetic bible asks for.
            Zoom = new Vector2(1.0f, 1.0f),
            Position = _player.Position + new Vector2(0, -28),
            PositionSmoothingEnabled = true,
            PositionSmoothingSpeed = 5.5f,
        };
        AddChild(_camera);
        _camera.MakeCurrent();
    }

    private void BuildBreath()
    {
        if (_player is null)
        {
            return;
        }

        _breath = new GpuParticles2D
        {
            Name = "KalevColdBreath",
            Amount = 22,
            Lifetime = 1.55,
            Preprocess = 0.45,
            SpeedScale = 0.85f,
            Position = new Vector2(10, -66),
            Texture = MakeBreathTexture(),
            LocalCoords = false,
            Emitting = false,
            ZIndex = 4,
        };

        _breath.ProcessMaterial = new ParticleProcessMaterial
        {
            Direction = new Vector3(0, -1, 0),
            Spread = 22f,
            InitialVelocityMin = 7f,
            InitialVelocityMax = 15f,
            Gravity = new Vector3(3, -5, 0),
            EmissionShape = ParticleProcessMaterial.EmissionShapeEnum.Point,
            ScaleMin = 1.1f,
            ScaleMax = 2.4f,
            Color = new Color(0.93f, 0.96f, 1.0f, 0.62f),
        };
        _player.AddChild(_breath);
    }

    private void BuildMusic()
    {
        _hearthMusic = AddAudioBedPlayer("KyrieAtTheHearthMusic", HearthMusicPath, -30.0f);
        _outdoorMusic = AddAudioBedPlayer("ThresholdOfFrostOutdoorBed", OutdoorMusicPath, -19.0f);
        _hearthCrackle = AddAudioBedPlayer("HearthCrackleBed", HearthCracklePath, -34.0f);
    }

    private AudioStreamPlayer AddAudioBedPlayer(string name, string path, float volumeDb)
    {
        var stream = GD.Load<AudioStream>(path);
        if (stream is null)
        {
            GD.PushWarning($"Audio bed missing for {name}: {path}");
            return null!;
        }

        var player = new AudioStreamPlayer
        {
            Name = name,
            Stream = stream,
            Autoplay = true,
            VolumeDb = volumeDb,
        };
        AddChild(player);
        return player;
    }

    private void UpdateAudioBed(double delta)
    {
        if (_hearthMusic is null || _outdoorMusic is null || _player is null)
        {
            return;
        }

        var insideCabin = IsInsideCabinShell();
        var t = Mathf.Clamp((float)delta * 1.6f, 0.0f, 1.0f);
        _hearthMusic.VolumeDb = Mathf.Lerp(_hearthMusic.VolumeDb, insideCabin ? -12.0f : -30.0f, t);
        _outdoorMusic.VolumeDb = Mathf.Lerp(_outdoorMusic.VolumeDb, insideCabin ? -31.0f : -19.0f, t);
        if (_hearthCrackle is not null)
        {
            _hearthCrackle.VolumeDb = Mathf.Lerp(_hearthCrackle.VolumeDb, insideCabin ? -17.0f : -34.0f, t);
        }
    }

    public void ApplyOpeningActSnapshot(OpeningActSnapshot snapshot)
    {
        _openingSnapshot = snapshot;
        ApplyOpeningActVisualState(new OpeningActVisualStateProjector().Project(snapshot));
    }

    private void ApplyOpeningActVisualState(OpeningActVisualState visualState)
    {
        _openingVisualState = visualState;

        if (_hearthLight is not null)
        {
            (_hearthLight.Color, _hearthLight.Energy) = visualState.HearthLightState switch
            {
                "cold" => (new Color(0.43f, 0.50f, 0.58f), 0.25f),
                "banked" or "low" => (new Color(0.95f, 0.48f, 0.25f), 0.9f),
                "ember" or "lit" => (new Color(1.0f, 0.66f, 0.32f), 1.55f),
                _ => (new Color(1.0f, 0.66f, 0.32f), 1.55f),
            };
        }

        if (_hearthMusic is not null && visualState.ActiveAudioCue.Contains("long_pour", System.StringComparison.Ordinal))
        {
            _hearthMusic.VolumeDb = -14.0f;
        }

        SetActorRow("AnnaBedside", visualState.AnnaAnimationRow switch
        {
            "labored" => 1,
            "crisis" => 2,
            _ => 0,
        });
        SetActorRow("IiroCabinBoy", visualState.IiroAnimationRow switch
        {
            "sit" => 0,
            "sleep" => 0,
            _ => 0,
        });
    }

    private void ApplyOpeningActProjection()
    {
        using var file = FileAccess.Open(OpeningActEventsPath, FileAccess.ModeFlags.Read);
        if (file is null)
        {
            GD.PushError($"Opening act event truth missing: {OpeningActEventsPath}");
            return;
        }

        var stream = SimEventStream.FromStableJson(file.GetAsText());
        _openingEvents.Clear();
        _openingEvents.AddRange(stream.Events.OrderBy(simEvent => simEvent.Sequence));
        _openingEventCursor = _openingEvents.Count;
        ProjectOpeningEventCursor();
    }

    private void UpdateOpeningActInput()
    {
        var advancePressed = Input.IsActionPressed("ui_accept") || Input.IsKeyPressed(Key.E) || Input.IsKeyPressed(Key.Enter) || Input.IsKeyPressed(Key.KpEnter);
        if (advancePressed && !_advanceOpeningHeld)
        {
            AdvanceOpeningEvent();
        }
        _advanceOpeningHeld = advancePressed;

        var resetPressed = Input.IsKeyPressed(Key.R);
        if (resetPressed && !_resetOpeningHeld)
        {
            ResetOpeningEvents();
        }
        _resetOpeningHeld = resetPressed;
    }

    private void AdvanceOpeningEvent()
    {
        if (_openingEventCursor >= _openingEvents.Count)
        {
            return;
        }

        _openingEventCursor++;
        ProjectOpeningEventCursor();
    }

    private void ResetOpeningEvents()
    {
        _openingEventCursor = 0;
        ProjectOpeningEventCursor();
    }

    private void ProjectOpeningEventCursor()
    {
        var events = _openingEvents.Take(_openingEventCursor).ToList();
        var tick = events.LastOrDefault()?.Tick ?? 0;
        var snapshot = events.Count == 0
            ? EmptyOpeningSnapshot(tick)
            : new OpeningActSnapshotProjector().Project(events, tick);
        ApplyOpeningActSnapshot(snapshot);
        ApplyWolfEncounterVisualState(new WolfEncounterVisualStateProjector().Project(events));
        _openingBeatLine = OpeningBeatLine(events.LastOrDefault());
    }

    private static OpeningActSnapshot EmptyOpeningSnapshot(long tick)
    {
        return new OpeningActSnapshot(
            Tick: tick,
            LastEventId: string.Empty,
            EventCount: 0,
            HearthState: string.Empty,
            AnnaBreathState: string.Empty,
            IiroPosture: string.Empty,
            NotebookState: string.Empty,
            NotebookFocusPage: string.Empty,
            CameraFocusTarget: string.Empty,
            FirstVerbInvokedTick: null,
            Inventory: InventorySnapshot.Create([]),
            Progression: ProgressionSnapshot.FromEntries([], []),
            RecognitionSeeds: RecognitionSeedSnapshot.Create([], []),
            SourceEventIds: [],
            Metadata: new SortedDictionary<string, string>(StringComparer.Ordinal)
            {
                ["event_count"] = "0",
                ["projector_id"] = "opening_act_world_lab_empty.v1",
                ["tick"] = tick.ToString(System.Globalization.CultureInfo.InvariantCulture)
            });
    }

    private static string OpeningBeatLine(SimEvent simEvent)
    {
        if (simEvent is null)
        {
            return "reset before the first verb";
        }

        if (simEvent.Fields.TryGetValue("copy_text", out var copyText) && !string.IsNullOrWhiteSpace(copyText))
        {
            return ShortBeat(copyText);
        }

        if (simEvent.Fields.TryGetValue("outcome", out var outcome) && !string.IsNullOrWhiteSpace(outcome))
        {
            return ShortBeat($"{simEvent.VerbId}: {outcome}");
        }

        return ShortBeat($"{simEvent.VerbId}: {simEvent.EventType}");
    }

    private static string ShortBeat(string text)
    {
        const int maxLength = 64;
        return text.Length <= maxLength ? text : $"{text[..(maxLength - 1)]}…";
    }

    private void ApplyWolfEncounterVisualState(WolfEncounterVisualState visualState)
    {
        _wolfEncounterVisualState = visualState;
        SetActorRow("IiroCabinBoy", visualState.IiroAnimationRow == "safe" ? 0 : 1);
        if (visualState.Wolves.TryGetValue("wolf_01", out var wolf01))
        {
            SetActorRow("Wolf01Treeline", WolfRow(wolf01));
        }
        if (visualState.Wolves.TryGetValue("wolf_02", out var wolf02))
        {
            SetActorRow("Wolf02Treeline", WolfRow(wolf02));
        }
    }

    private static int WolfRow(WolfActorVisualState wolf)
    {
        if (wolf.IsDead || wolf.IsLeashed || wolf.AnimationRow == "flee" || wolf.AnimationRow == "hurt")
        {
            return 7;
        }
        return wolf.AnimationRow switch
        {
            "attack" => 6,
            "alert" => 5,
            "approach" => 1,
            _ => 0,
        };
    }

    private bool IsInsideCabinShell()
    {
        if (_player is null)
        {
            return false;
        }

        var tile = _player.Position / TileSize;
        return tile.X >= 16.0f && tile.X <= 32.0f && tile.Y >= 10.0f && tile.Y <= 23.0f;
    }

    private void BuildUi()
    {
        var layer = new CanvasLayer { Name = "OpeningActHudLayer", Layer = 20 };
        AddChild(layer);
        var panel = new PanelContainer
        {
            Name = "OpeningActHudPanel",
            Position = new Vector2(10, 214),
            CustomMinimumSize = new Vector2(620, 132),
        };
        var panelStyle = new StyleBoxFlat
        {
            BgColor = new Color(0.06f, 0.07f, 0.09f, 0.78f),
            BorderColor = new Color(0.70f, 0.52f, 0.22f, 0.88f),
            BorderWidthLeft = 2,
            BorderWidthTop = 2,
            BorderWidthRight = 2,
            BorderWidthBottom = 2,
            ContentMarginLeft = 10,
            ContentMarginTop = 8,
            ContentMarginRight = 10,
            ContentMarginBottom = 8,
        };
        panel.AddThemeStyleboxOverride("panel", panelStyle);
        layer.AddChild(panel);

        _label = new Label
        {
            Name = "WorldHelpLabel",
            CustomMinimumSize = new Vector2(600, 112),
            AutowrapMode = TextServer.AutowrapMode.WordSmart,
        };
        _label.AddThemeColorOverride("font_color", new Color(0.91f, 0.86f, 0.74f));
        _label.AddThemeColorOverride("font_shadow_color", new Color(0.02f, 0.02f, 0.025f, 0.95f));
        _label.AddThemeConstantOverride("shadow_offset_x", 1);
        _label.AddThemeConstantOverride("shadow_offset_y", 1);
        panel.AddChild(_label);
        _label.Text = BuildHudText();
    }

    private string BuildHudText()
    {
        var movement = $"Kalev {(_moving ? "walk" : "idle")}_{DirectionName(_direction)}";
        if (_openingSnapshot is null)
        {
            return $"Ironwood cabin slice | WASD/arrows move | {movement}";
        }

        var inventory = _openingSnapshot.Inventory;
        var wolf01 = _wolfEncounterVisualState.Wolves.TryGetValue("wolf_01", out var firstWolf)
            ? $"{firstWolf.AnimationRow} dmg:{firstWolf.DamageTaken} loot:{firstWolf.LootItemId}×{firstWolf.LootQuantity}"
            : "not projected";
        var wolf02 = _wolfEncounterVisualState.Wolves.TryGetValue("wolf_02", out var secondWolf)
            ? $"{secondWolf.AnimationRow} {secondWolf.LootWithheldReason}"
            : "not projected";

        return $"Ironwood mercy RPG slice | E/Enter advance, R reset | {_openingEventCursor}/{_openingEvents.Count} | {movement}\n" +
            $"event truth: {_openingSnapshot.EventCount} events | bread {inventory.QuantityOf("bread")} water {inventory.QuantityOf("water_supply")} tincture {inventory.QuantityOf("tincture_dose")} wolf_hide {inventory.QuantityOf("wolf_hide")}\n" +
            $"Anna {_openingVisualState.AnnaAnimationRow} | Iiro {_wolfEncounterVisualState.ObjectiveState}@{_wolfEncounterVisualState.IiroRouteNode} | wolf_01 {wolf01} | wolf_02 {wolf02}\n" +
            $"notebook {_openingVisualState.NotebookDisplayState} p{_openingVisualState.NotebookFocusPage} | audio {_openingVisualState.ActiveAudioCue} | last: {_openingBeatLine}";
    }

    private Sprite2D MakeTile(Tile tile, int x, int y, string name)
    {
        var tileIndex = (int)tile;
        return new Sprite2D
        {
            Name = name,
            Texture = _tiles,
            RegionEnabled = true,
            RegionRect = new Rect2((tileIndex % 8) * TileSize, (tileIndex / 8) * TileSize, TileSize, TileSize),
            Centered = false,
            Position = new Vector2(x * TileSize, y * TileSize),
            TextureFilter = TextureFilterEnum.Nearest,
        };
    }

    private void AddActor(Node2D parent, string name, string path, int frameWidth, int frameHeight, int columns, int row, Vector2 feet, double secondsPerFrame)
    {
        var texture = GD.Load<Texture2D>(path);
        if (texture is null)
        {
            GD.PushWarning($"Actor texture missing for {name}: {path}");
            return;
        }

        var node = new Node2D
        {
            Name = name,
            Position = feet,
            ZIndex = Mathf.RoundToInt(feet.Y / TileSize) + 20,
        };
        parent.AddChild(node);

        var sprite = new Sprite2D
        {
            Name = $"{name}Sprite",
            Texture = texture,
            RegionEnabled = true,
            RegionRect = new Rect2(0, row * frameHeight, frameWidth, frameHeight),
            Centered = false,
            Position = new Vector2(-frameWidth / 2f, -frameHeight + 4),
            TextureFilter = TextureFilterEnum.Nearest,
        };
        node.AddChild(sprite);

        _actors.Add(new ActorAnim
        {
            Name = name,
            Sprite = sprite,
            FrameWidth = frameWidth,
            FrameHeight = frameHeight,
            Columns = columns,
            Row = row,
            SecondsPerFrame = secondsPerFrame,
        });
        _actorAnimsByName[name] = _actors[^1];
    }

    private void SetActorRow(string actorName, int row)
    {
        if (!_actorAnimsByName.TryGetValue(actorName, out var actor))
        {
            return;
        }

        actor.Row = row;
        actor.Frame = Mathf.Clamp(actor.Frame, 0, actor.Columns - 1);
        actor.Sprite.RegionRect = new Rect2(actor.Frame * actor.FrameWidth, actor.Row * actor.FrameHeight, actor.FrameWidth, actor.FrameHeight);
    }

    private void AnimateActors(double delta)
    {
        foreach (var actor in _actors)
        {
            actor.Clock += delta;
            if (actor.Clock < actor.SecondsPerFrame)
            {
                continue;
            }
            actor.Clock -= actor.SecondsPerFrame;
            actor.Frame = (actor.Frame + 1) % actor.Columns;
            actor.Sprite.RegionRect = new Rect2(actor.Frame * actor.FrameWidth, actor.Row * actor.FrameHeight, actor.FrameWidth, actor.FrameHeight);
        }
    }

    private Vector2 ReadInput(out int direction)
    {
        var v = Vector2.Zero;
        direction = _direction;
        if (Input.IsActionPressed("ui_left") || Input.IsKeyPressed(Key.A))
        {
            v.X -= 1;
            direction = 1;
        }
        if (Input.IsActionPressed("ui_right") || Input.IsKeyPressed(Key.D))
        {
            v.X += 1;
            direction = 3;
        }
        if (Input.IsActionPressed("ui_up") || Input.IsKeyPressed(Key.W))
        {
            v.Y -= 1;
            direction = 2;
        }
        if (Input.IsActionPressed("ui_down") || Input.IsKeyPressed(Key.S))
        {
            v.Y += 1;
            direction = 0;
        }
        return v;
    }

    private void MoveIfWalkable(Vector2 nextFeet)
    {
        var xOk = IsWalkable(new Vector2(nextFeet.X, _player.Position.Y));
        var yOk = IsWalkable(new Vector2(_player.Position.X, nextFeet.Y));
        if (xOk)
        {
            _player.Position = new Vector2(nextFeet.X, _player.Position.Y);
        }
        if (yOk)
        {
            _player.Position = new Vector2(_player.Position.X, nextFeet.Y);
        }
    }

    private bool IsWalkable(Vector2 feet)
    {
        var probes = new[]
        {
            feet + new Vector2(-10, -4),
            feet + new Vector2(10, -4),
            feet + new Vector2(-10, 8),
            feet + new Vector2(10, 8),
        };
        foreach (var p in probes)
        {
            var tx = Mathf.FloorToInt(p.X / TileSize);
            var ty = Mathf.FloorToInt(p.Y / TileSize);
            if (!InBounds(tx, ty))
            {
                return false;
            }
            if (_blockedTiles.Contains(new Vector2I(tx, ty)))
            {
                return false;
            }
        }
        return true;
    }

    private bool IsOutdoorGroundUnderFeet()
    {
        if (_player is null)
        {
            return false;
        }

        var tx = Mathf.FloorToInt(_player.Position.X / TileSize);
        var ty = Mathf.FloorToInt(_player.Position.Y / TileSize);
        if (!InBounds(tx, ty))
        {
            return false;
        }

        var pos = new Vector2I(tx, ty);
        var tile = _groundOverrides.TryGetValue(pos, out var overrideTile) ? overrideTile : DefaultGround(tx, ty);
        return tile is Tile.Snow or Tile.SnowShadow or Tile.SnowDrift or Tile.SnowTracks or Tile.Road or Tile.RoadEdge or Tile.RoadRuts;
    }

    private void UpdateAnimationFrame()
    {
        if (_kalev is null)
        {
            return;
        }
        var row = _direction switch
        {
            0 => _moving ? 1 : 0,
            1 => _moving ? 3 : 2,
            2 => _moving ? 5 : 4,
            3 => _moving ? 7 : 6,
            _ => 0,
        };
        _kalev.RegionRect = new Rect2(_frame * FrameWidth, row * FrameHeight, FrameWidth, FrameHeight);
    }

    private void AddWall(int x, int y)
    {
        AddProp(x, y, Tile.Wall, true);
        SetGround(x, y, Tile.FloorShadow);
    }

    private void AddProp(int x, int y, Tile tile, bool blocked)
    {
        if (!InBounds(x, y))
        {
            return;
        }
        var pos = new Vector2I(x, y);
        _propTiles[pos] = tile;
        if (blocked)
        {
            _blockedTiles.Add(pos);
        }
    }

    private void SetGround(int x, int y, Tile tile)
    {
        if (InBounds(x, y))
        {
            _groundOverrides[new Vector2I(x, y)] = tile;
        }
    }

    private Tile DefaultGround(int x, int y)
    {
        var h = Hash(x, y);
        if (h % 37 == 0)
        {
            return Tile.SnowTracks;
        }
        if (h % 23 == 0)
        {
            return Tile.SnowDrift;
        }
        return h % 17 == 0 ? Tile.SnowShadow : Tile.Snow;
    }

    private static bool InBounds(int x, int y)
    {
        return x >= 0 && y >= 0 && x < MapWidth && y < MapHeight;
    }

    private static int Hash(int x, int y)
    {
        unchecked
        {
            return (x * 73856093) ^ (y * 19349663);
        }
    }

    private static string DirectionName(int direction)
    {
        return direction switch
        {
            0 => "down",
            1 => "left",
            2 => "up",
            3 => "right",
            _ => "down",
        };
    }

    // ---------- Atmosphere ----------

    // Damp lake-slate page tint that the aesthetic bible asks of Ironwood: overcast
    // light pressed onto the whole scene before any lamp pushes back against it.
    private void BuildAtmosphere()
    {
        var modulate = new CanvasModulate
        {
            Name = "IronwoodCanvasModulate",
            Color = new Color(0.62f, 0.66f, 0.78f, 1.0f),
        };
        AddChild(modulate);
    }

    private void BuildLights()
    {
        // Hearth tile sits at (17–18, 13) inside the cabin shell. Place a warm
        // additive point light over that floor so the hearth radiates onto the
        // bone-cold modulated scene and the gold there finally feels earned.
        var hearthTexture = MakeRadialLightTexture(96, softness: 1.25f);
        _hearthLight = new PointLight2D
        {
            Name = "HearthLight",
            Position = new Vector2(17.5f * TileSize, 13.5f * TileSize),
            Color = new Color(1.0f, 0.66f, 0.32f),
            Energy = 1.55f,
            TextureScale = 4.5f,
            BlendMode = Light2D.BlendModeEnum.Add,
            Texture = hearthTexture,
            RangeZMin = -1024,
            RangeZMax = 1024,
        };
        AddChild(_hearthLight);

        // Door/threshold bleed: smaller, slightly cooler — the rumor of warmth
        // visible from the road. Sits between road and porch.
        var thresholdTexture = MakeRadialLightTexture(72, softness: 1.4f);
        var threshold = new PointLight2D
        {
            Name = "ThresholdLight",
            Position = new Vector2(23.5f * TileSize, 23.2f * TileSize),
            Color = new Color(0.95f, 0.74f, 0.42f),
            Energy = 0.85f,
            TextureScale = 2.8f,
            BlendMode = Light2D.BlendModeEnum.Add,
            Texture = thresholdTexture,
            RangeZMin = -1024,
            RangeZMax = 1024,
        };
        AddChild(threshold);

        // Candle stand near the bed: a tiny, intimate disclosure on the cabin's east half.
        var candleTexture = MakeRadialLightTexture(48, softness: 1.6f);
        var candle = new PointLight2D
        {
            Name = "CandleLight",
            Position = new Vector2(20.5f * TileSize, 15.5f * TileSize),
            Color = new Color(0.96f, 0.78f, 0.5f),
            Energy = 0.6f,
            TextureScale = 1.4f,
            BlendMode = Light2D.BlendModeEnum.Add,
            Texture = candleTexture,
            RangeZMin = -1024,
            RangeZMax = 1024,
        };
        AddChild(candle);
    }

    private void BuildWindowShafts()
    {
        var shafts = new Node2D
        {
            Name = "WindowLightShafts",
            ZIndex = 6,
        };
        AddChild(shafts);

        AddWindowShaft(shafts, new Vector2(20.5f * TileSize, 10.9f * TileSize), new Vector2(46, 250));
        AddWindowShaft(shafts, new Vector2(27.5f * TileSize, 10.9f * TileSize), new Vector2(-48, 250));
    }

    private static void AddWindowShaft(Node2D parent, Vector2 origin, Vector2 drift)
    {
        AddShaftBand(parent, "AshBlueShaft", origin, drift, 34, 84, new Color(0.58f, 0.66f, 0.88f, 0.24f));
        AddShaftBand(parent, "VellumWarmCore", origin + new Vector2(0, 10), drift * 0.82f, 16, 42, new Color(0.92f, 0.76f, 0.50f, 0.14f));
        AddShaftBand(parent, "CandleDustLine", origin + new Vector2(0, 20), drift * 0.58f, 6, 16, new Color(1.0f, 0.86f, 0.62f, 0.09f));
    }

    private static void AddShaftBand(Node2D parent, string name, Vector2 origin, Vector2 drift, float topHalfWidth, float bottomHalfWidth, Color color)
    {
        var end = origin + drift;
        var shaft = new Polygon2D
        {
            Name = name,
            Polygon =
            [
                origin + new Vector2(-topHalfWidth, 0),
                origin + new Vector2(topHalfWidth, 0),
                end + new Vector2(bottomHalfWidth, 0),
                end + new Vector2(-bottomHalfWidth, 0),
            ],
            Color = color,
            Material = new CanvasItemMaterial
            {
                BlendMode = CanvasItemMaterial.BlendModeEnum.Add,
            },
            Antialiased = false,
        };
        parent.AddChild(shaft);
    }

    private void BuildWeather()
    {
        if (_camera is null)
        {
            return;
        }

        var flake = MakeFlakeTexture();

        var snow = new GpuParticles2D
        {
            Name = "Snowfall",
            Amount = 96,
            Lifetime = 5.5,
            Preprocess = 4.0,
            SpeedScale = 1.0f,
            Position = new Vector2(0, -260),
            Texture = flake,
            LocalCoords = false,
        };

        var pm = new ParticleProcessMaterial
        {
            Direction = new Vector3(0, 1, 0),
            Spread = 6.0f,
            InitialVelocityMin = 22.0f,
            InitialVelocityMax = 38.0f,
            Gravity = new Vector3(-6, 18, 0),
            EmissionShape = ParticleProcessMaterial.EmissionShapeEnum.Box,
            EmissionBoxExtents = new Vector3(440, 8, 0),
            ScaleMin = 0.6f,
            ScaleMax = 1.4f,
            Color = new Color(1f, 1f, 1f, 0.78f),
            AngularVelocityMin = -20f,
            AngularVelocityMax = 20f,
        };
        snow.ProcessMaterial = pm;
        _camera.AddChild(snow);
    }

    private void BuildOverlay()
    {
        var overlay = new CanvasLayer
        {
            Name = "AtmosphereOverlay",
            Layer = 5,
        };
        AddChild(overlay);

        var vellum = new ColorRect
        {
            Name = "DampVellumOverlay",
            Color = new Color(1, 1, 1, 1),
            MouseFilter = Control.MouseFilterEnum.Ignore,
        };
        vellum.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect);
        overlay.AddChild(vellum);

        var vellumShader = GD.Load<Shader>("res://shaders/damp_vellum.gdshader");
        if (vellumShader is not null)
        {
            vellum.Material = new ShaderMaterial { Shader = vellumShader };
        }
        else
        {
            GD.PushWarning("Damp vellum shader missing; overlay disabled.");
            vellum.Visible = false;
        }

        var vignette = new ColorRect
        {
            Name = "ManuscriptVignette",
            Color = new Color(1, 1, 1, 1),
            MouseFilter = Control.MouseFilterEnum.Ignore,
        };
        vignette.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect);
        overlay.AddChild(vignette);

        var shader = GD.Load<Shader>("res://shaders/manuscript_vignette.gdshader");
        if (shader is not null)
        {
            vignette.Material = new ShaderMaterial { Shader = shader };
        }
        else
        {
            GD.PushWarning("Manuscript vignette shader missing; overlay disabled.");
            vignette.Visible = false;
        }
    }

    private static ImageTexture MakeRadialLightTexture(int size, float softness = 1.0f)
    {
        var img = Image.CreateEmpty(size, size, false, Image.Format.Rgba8);
        var c = (size - 1) * 0.5f;
        for (var y = 0; y < size; y++)
        {
            for (var x = 0; x < size; x++)
            {
                var dx = (x - c) / c;
                var dy = (y - c) / c;
                var d = Mathf.Sqrt(dx * dx + dy * dy);
                var a = 1.0f - Mathf.Clamp(d, 0.0f, 1.0f);
                a = Mathf.Pow(a, softness);
                img.SetPixel(x, y, new Color(1f, 1f, 1f, a));
            }
        }
        return ImageTexture.CreateFromImage(img);
    }

    private static ImageTexture MakeFlakeTexture()
    {
        var img = Image.CreateEmpty(2, 2, false, Image.Format.Rgba8);
        img.SetPixel(0, 0, new Color(1, 1, 1, 1));
        img.SetPixel(1, 0, new Color(1, 1, 1, 0.85f));
        img.SetPixel(0, 1, new Color(1, 1, 1, 0.85f));
        img.SetPixel(1, 1, new Color(1, 1, 1, 0.65f));
        return ImageTexture.CreateFromImage(img);
    }

    private static ImageTexture MakeBreathTexture()
    {
        var img = Image.CreateEmpty(4, 4, false, Image.Format.Rgba8);
        for (var y = 0; y < 4; y++)
        {
            for (var x = 0; x < 4; x++)
            {
                var dx = x - 1.5f;
                var dy = y - 1.5f;
                var d = Mathf.Sqrt(dx * dx + dy * dy);
                var a = Mathf.Clamp(1.0f - d / 2.2f, 0.0f, 1.0f) * 0.9f;
                img.SetPixel(x, y, new Color(0.93f, 0.96f, 1.0f, a));
            }
        }
        return ImageTexture.CreateFromImage(img);
    }
}
