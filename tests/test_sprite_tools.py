from __future__ import annotations

import argparse
import contextlib
import io
import json
import os
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from PIL import Image


REPO_ROOT = Path(__file__).resolve().parents[1]
SPRITE_TOOLS = REPO_ROOT / "tools" / "sprites"
if str(SPRITE_TOOLS) not in sys.path:
    sys.path.insert(0, str(SPRITE_TOOLS))


import _common  # noqa: E402
import catalog  # noqa: E402
import cli  # noqa: E402
import health  # noqa: E402
import make_runtime_sprite  # noqa: E402
import preview  # noqa: E402
import retarget  # noqa: E402
import runtime_sheet  # noqa: E402
import validate_sprite  # noqa: E402


class SpriteToolRegressionTests(unittest.TestCase):
    def test_ingest_then_convert_uses_default_source_and_preview_flags(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            source = tmp_path / "drop.png"
            source.write_bytes(b"not an image; ingest only copies before conversion")
            staged = tmp_path / "staged.png"

            class FakeSpec:
                name = "fake"
                palette = "project"

                def get_pass(self, pass_name: str) -> dict:
                    assert pass_name == "idle_front"
                    return {
                        "source_frames": 1,
                        "source_cols": 1,
                        "source_rows": 1,
                    }

                def source_path(self, pass_name: str) -> Path:
                    assert pass_name == "idle_front"
                    return staged

                def runtime_path(self, pass_name: str) -> Path:
                    return tmp_path / f"fake_{pass_name}_64x96.png"

                def target_cols(self, pass_name: str) -> int:
                    return 1

                def target_rows(self, pass_name: str) -> int:
                    return 1

                def frame_w(self, pass_name: str) -> int:
                    return 64

                def frame_h(self, pass_name: str) -> int:
                    return 96

                def baseline_y(self, pass_name: str) -> int:
                    return 84

            calls: list[list[str]] = []

            def fake_subprocess_call(cmd: list[str]) -> int:
                calls.append(cmd)
                return 0

            args = argparse.Namespace(
                file=str(source),
                character="fake",
                pass_name="idle_front",
                then_convert=True,
            )
            with (
                mock.patch.object(cli, "load_spec", return_value=FakeSpec()),
                mock.patch.object(cli.subprocess, "call", side_effect=fake_subprocess_call),
                mock.patch.object(cli, "cmd_preview", return_value=0),
            ):
                with contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(cli.cmd_ingest(args), 0)

            self.assertEqual(staged.read_bytes(), source.read_bytes())
            self.assertEqual(len(calls), 1)

    def test_catalog_status_uses_full_validator_not_only_shape_and_alpha(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            sheet = Path(tmp) / "bad_palette.png"
            im = Image.new("RGBA", (4, 4), (0, 0, 0, 0))
            for x in range(2):
                for y in range(2):
                    im.putpixel((x, y), (18, 52, 86, 255))  # off every project palette.
            im.save(sheet)

            spec = SimpleNamespace(
                palette="kalev",
                runtime_path=lambda pass_name: sheet,
                sheet_w=lambda pass_name: 4,
                sheet_h=lambda pass_name: 4,
                frame_w=lambda pass_name: 4,
                frame_h=lambda pass_name: 4,
                baseline_y=lambda pass_name: 3,
                target_cols=lambda pass_name: 1,
                target_rows=lambda pass_name: 1,
            )
            with mock.patch.object(catalog, "load_spec", return_value=spec):
                status, stat = catalog._validate_terse("fake", "idle")

            self.assertEqual(status, "FAIL")
            self.assertEqual(stat["colors"], 2)  # off-palette opaque + transparent.

    def test_validate_sprite_reports_invalid_images_as_failures(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            bad = Path(tmp) / "bad.png"
            bad.write_text("not a png")
            report = validate_sprite.validate_runtime_sheet(
                path=bad,
                expected_w=4,
                expected_h=4,
                palette=[(0, 0, 0)],
                frame_w=4,
                frame_h=4,
                baseline_y=3,
                target_cols=1,
                target_rows=1,
            )
            self.assertFalse(report.ok)
            self.assertTrue(any("could not open image" in f for f in report.failures))

    def test_validate_sprite_wrong_size_reports_failure_without_baseline_crash(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            small = Path(tmp) / "small.png"
            Image.new("RGBA", (2, 2), (0, 0, 0, 0)).save(small)
            report = validate_sprite.validate_runtime_sheet(
                path=small,
                expected_w=4,
                expected_h=4,
                palette=[(0, 0, 0)],
                frame_w=4,
                frame_h=4,
                baseline_y=3,
                target_cols=1,
                target_rows=1,
            )
            self.assertFalse(report.ok)
            self.assertTrue(any("dimensions must be 4×4" in f for f in report.failures))

    def test_validate_sprite_rejects_all_transparent_sheets(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            blank = Path(tmp) / "blank.png"
            Image.new("RGBA", (4, 4), (0, 0, 0, 0)).save(blank)
            report = validate_sprite.validate_runtime_sheet(
                path=blank,
                expected_w=4,
                expected_h=4,
                palette=[(0, 0, 0)],
                frame_w=4,
                frame_h=4,
                baseline_y=3,
                target_cols=1,
                target_rows=1,
            )
            self.assertFalse(report.ok)
            self.assertIn("sheet has no opaque pixels", report.failures)

    def test_preview_empty_row_detection_uses_alpha_channel(self) -> None:
        im = Image.new("RGBA", (8, 4), (255, 0, 0, 0))
        frames = preview._row_frames(im, row=0, target_cols=2, fw=4, fh=4)
        self.assertEqual(frames, [])

    def test_source_grid_bounds_cover_non_divisible_image_width(self) -> None:
        self.assertEqual(make_runtime_sprite.source_grid_bounds(0, 0, 5, 1, 2, 1), (0, 0, 2, 1))
        self.assertEqual(make_runtime_sprite.source_grid_bounds(1, 0, 5, 1, 2, 1), (2, 0, 5, 1))

    def test_health_timeout_counts_as_failure_exit(self) -> None:
        self.assertEqual(health._status_exit_code({"PASS": 1, "MISSING": 8, "FAIL": 0, "TIMEOUT": 0}), 0)
        self.assertEqual(health._status_exit_code({"PASS": 1, "MISSING": 7, "FAIL": 0, "TIMEOUT": 1}), 1)
        self.assertEqual(health._status_exit_code({"PASS": 1, "MISSING": 7, "FAIL": 1, "TIMEOUT": 0}), 1)

    def test_scaffold_rejects_non_snake_case_character_names(self) -> None:
        with self.assertRaises(SystemExit):
            _common.validate_character_name("../bad")
        with self.assertRaises(SystemExit):
            _common.validate_character_name("Kalev")
        self.assertEqual(_common.validate_character_name("dr_amos"), "dr_amos")

    def test_find_aseprite_honors_env_command_lookup(self) -> None:
        with (
            mock.patch.dict(os.environ, {"ASEPRITE_BIN": "aseprite-test"}, clear=False),
            mock.patch.object(_common.shutil, "which", return_value="/tmp/aseprite-test"),
        ):
            self.assertEqual(_common.find_aseprite(), "/tmp/aseprite-test")

    def test_metadata_command_exports_spec_backed_polish_context(self) -> None:
        spec = cli.load_spec("kalev")
        payload = cli.sprite_metadata(spec, "idle_front")
        self.assertEqual(payload["character"], "kalev")
        self.assertEqual(payload["pass"], "idle_front")
        self.assertEqual(payload["frame_w"], 64)
        self.assertEqual(payload["frame_h"], 96)
        self.assertEqual(payload["baseline_y"], 84)
        self.assertEqual(payload["target_cols"], 4)
        self.assertEqual(payload["target_rows"], 1)
        self.assertEqual(payload["animation_keys"], ["idle_down"])
        self.assertTrue(payload["paths"]["runtime"].endswith("kalev_idle_front_64x96.png"))
        self.assertTrue(payload["paths"]["master"].endswith("kalev_idle_front_master.png"))

    def test_aseprite_run_builds_headless_script_command(self) -> None:
        calls: list[list[str]] = []

        def fake_call(cmd: list[str]) -> int:
            calls.append(cmd)
            return 0

        args = argparse.Namespace(
            script="baseline_overlay",
            character="kalev",
            pass_name="idle_front",
            input=None,
            output="/tmp/kalev_overlay.png",
            in_place=False,
            param=["mode=add", "rows=idle_down"],
            validate=False,
        )
        with (
            mock.patch.object(cli, "find_aseprite", return_value="/bin/aseprite"),
            mock.patch.object(cli.subprocess, "call", side_effect=fake_call),
            contextlib.redirect_stdout(io.StringIO()),
        ):
            self.assertEqual(cli.cmd_aseprite_run(args), 0)

        self.assertEqual(len(calls), 1)
        cmd = calls[0]
        self.assertEqual(cmd[0:2], ["/bin/aseprite", "-b"])
        self.assertIn("--script", cmd)
        self.assertIn("--script-param", cmd)
        self.assertIn("character=kalev", cmd)
        self.assertIn("pass=idle_front", cmd)
        self.assertIn("rows=idle_down", cmd)
        self.assertIn("--save-as", cmd)
        self.assertIn("/tmp/kalev_overlay.png", cmd)

    def test_aseprite_script_inventory_contains_polish_helpers(self) -> None:
        script_names = {p.name for p in cli.list_aseprite_scripts()}
        self.assertIn("add_hair_canopy.lua", script_names)
        self.assertIn("auto_tag_animations.lua", script_names)
        self.assertIn("baseline_overlay.lua", script_names)
        self.assertIn("mirror_left_to_right.lua", script_names)
        self.assertIn("shrink_or_lift_cell.lua", script_names)

    def test_isolate_main_subject_drops_disconnected_shadow_blob(self) -> None:
        """A figure plus an AI-rendered ground-shadow blob below the feet must have
        the blob masked out so bbox/scale-to-fit anchors the figure cleanly to baseline."""
        im = Image.new("RGBA", (30, 40), (0, 0, 0, 0))
        # Main figure: 20×30 = 600 opaque pixels at y=2..32
        for y in range(2, 32):
            for x in range(5, 25):
                im.putpixel((x, y), (107, 74, 44, 255))
        # Shadow blob: 6×3 = 18 opaque pixels at y=36..39 (3% of figure → below 10% threshold)
        for y in range(36, 39):
            for x in range(12, 18):
                im.putpixel((x, y), (50, 50, 50, 255))

        cleaned = make_runtime_sprite.isolate_main_subject(im)
        self.assertEqual(cleaned.getpixel((10, 10))[3], 255, "main figure should survive")
        self.assertEqual(cleaned.getpixel((14, 37))[3], 0, "shadow blob should be removed")
        self.assertEqual(cleaned.getchannel("A").getbbox(), (5, 2, 25, 32))

    def test_isolate_main_subject_preserves_large_secondary_components(self) -> None:
        """Held items / detached anatomy that sit close to the body and overlap its
        y-range must survive so notebooks, hats, and hands aren't stripped from
        valid sources. 'Close' means within `x_overlap_tolerance` (default 5px)."""
        im = Image.new("RGBA", (40, 40), (0, 0, 0, 0))
        # Body: 600 px at x=0..19
        for y in range(0, 30):
            for x in range(0, 20):
                im.putpixel((x, y), (107, 74, 44, 255))
        # Detached held item just off the body at x=22..31 (3-pixel gap from body edge)
        for y in range(10, 26):
            for x in range(22, 32):
                im.putpixel((x, y), (232, 223, 201, 255))

        cleaned = make_runtime_sprite.isolate_main_subject(im)
        self.assertEqual(cleaned.getpixel((5, 5))[3], 255)
        self.assertEqual(cleaned.getpixel((26, 15))[3], 255)

    def test_isolate_main_subject_preserves_small_internal_anatomy(self) -> None:
        """A small disconnected anatomical feature inside the main's y-range
        (e.g., a hand or held vial briefly off the body in a walk frame) must
        survive even if it's only 2-3% of the main, because position is what
        distinguishes it from a shadow blob — not size."""
        im = Image.new("RGBA", (40, 60), (0, 0, 0, 0))
        # Body: 800 px main figure
        for y in range(5, 45):
            for x in range(10, 30):
                im.putpixel((x, y), (107, 74, 44, 255))
        # Small internal feature: 36 px (~4.5% of body), positioned beside the body
        # within its y-range — represents a swinging hand or held vial.
        for y in range(20, 26):
            for x in range(32, 38):
                im.putpixel((x, y), (198, 62, 31, 255))

        cleaned = make_runtime_sprite.isolate_main_subject(im)
        # Body still present
        self.assertEqual(cleaned.getpixel((15, 20))[3], 255)
        # Small internal feature must survive (position-based, not size-based filtering)
        self.assertEqual(cleaned.getpixel((35, 22))[3], 255)

    def test_isolate_main_subject_preserves_above_main_components(self) -> None:
        """A component sitting above the main (a held-aloft item, a hat brim
        slightly detached) must survive."""
        im = Image.new("RGBA", (40, 50), (0, 0, 0, 0))
        # Body
        for y in range(15, 45):
            for x in range(10, 30):
                im.putpixel((x, y), (107, 74, 44, 255))
        # Above-main feature
        for y in range(2, 8):
            for x in range(15, 25):
                im.putpixel((x, y), (199, 154, 58, 255))

        cleaned = make_runtime_sprite.isolate_main_subject(im)
        self.assertEqual(cleaned.getpixel((20, 5))[3], 255, "above-main feature must survive")

    def test_isolate_main_subject_drops_noise_floor(self) -> None:
        """Sub-floor pixel specks (single-pixel chroma-key bleed inside or beside
        the figure) must be dropped even when they overlap the main's y-range."""
        im = Image.new("RGBA", (40, 40), (0, 0, 0, 0))
        for y in range(5, 35):
            for x in range(10, 30):
                im.putpixel((x, y), (107, 74, 44, 255))
        # Stray single pixel near the figure
        im.putpixel((35, 20), (255, 0, 255, 255))

        cleaned = make_runtime_sprite.isolate_main_subject(im, min_pixel_floor=5)
        self.assertEqual(cleaned.getpixel((20, 20))[3], 255)
        self.assertEqual(cleaned.getpixel((35, 20))[3], 0)

    def test_isolate_main_subject_drops_neighbor_cell_bleed_at_far_edge(self) -> None:
        """A substantial component sitting at the far edge of the cell with no
        x-overlap with the main is bleed from a neighboring figure in a multi-cell
        source sheet. It must be dropped — it has correct y-range but is spatially
        separated from the main by far more than the tolerance."""
        im = Image.new("RGBA", (60, 40), (0, 0, 0, 0))
        # Main figure on the left side of the cell
        for y in range(5, 35):
            for x in range(2, 18):
                im.putpixel((x, y), (107, 74, 44, 255))
        main_xmax = 17
        # Bleed strip on the right edge: substantial size (160 px), overlaps main y-range,
        # but starts far past `x_overlap_tolerance` pixels from main.
        bleed_xmin = 50
        self.assertGreater(bleed_xmin - main_xmax, 5, "test invariant: bleed is far enough to fail tolerance")
        for y in range(10, 30):
            for x in range(50, 58):
                im.putpixel((x, y), (107, 74, 44, 255))

        cleaned = make_runtime_sprite.isolate_main_subject(im)
        self.assertEqual(cleaned.getpixel((10, 20))[3], 255, "main kept")
        self.assertEqual(cleaned.getpixel((54, 20))[3], 0, "neighbor-cell bleed dropped")

    def test_isolate_main_subject_handles_fully_transparent_input(self) -> None:
        im = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
        cleaned = make_runtime_sprite.isolate_main_subject(im)
        self.assertIsNone(cleaned.getchannel("A").getbbox())

    def test_passthrough_used_when_source_dims_match_runtime_dims(self) -> None:
        """Industry-standard delivery: source IS the runtime sheet — no isolation, no fit."""
        with tempfile.TemporaryDirectory() as tmp:
            src_path = Path(tmp) / "src.png"
            out_path = Path(tmp) / "out.png"
            # 2 cols × 1 row of 16×24 cells = 32×24 sheet, transparent except one pixel per cell
            sheet = Image.new("RGBA", (32, 24), (0, 0, 0, 0))
            sheet.putpixel((4, 20), (107, 74, 44, 255))   # cedar-brown, palette-exact
            sheet.putpixel((20, 20), (109, 76, 46, 255))  # near cedar-brown — should snap
            sheet.save(src_path)

            palette = [(107, 74, 44), (26, 22, 18)]
            make_runtime_sprite.compose_sheet(
                source_path=src_path, output_path=out_path, palette=palette,
                source_frames=2, source_cols=2, source_rows=1,
                target_cols=2, target_rows=1, frame_w=16, frame_h=24,
                baseline_y=20, start_target_index=0,
            )
            result = Image.open(out_path).convert("RGBA")
            self.assertEqual(result.size, (32, 24))
            # passthrough: figure pixels still at exact source positions, palette-snapped
            self.assertEqual(result.getpixel((4, 20)), (107, 74, 44, 255))
            self.assertEqual(result.getpixel((20, 20)), (107, 74, 44, 255))
            # transparent pixels stay transparent (alpha 0, all channels 0)
            self.assertEqual(result.getpixel((0, 0)), (0, 0, 0, 0))

    def test_passthrough_does_not_run_isolation_or_aspect_fit(self) -> None:
        """Native-shape sources skip the chroma+isolate+fit chain entirely.

        A small disconnected component would be DROPPED by isolate_main_subject
        (size below noise floor of 5 px). In passthrough we keep it untouched.
        """
        with tempfile.TemporaryDirectory() as tmp:
            src_path = Path(tmp) / "src.png"
            out_path = Path(tmp) / "out.png"
            sheet = Image.new("RGBA", (16, 24), (0, 0, 0, 0))
            # main figure block
            for y in range(10, 20):
                for x in range(4, 12):
                    sheet.putpixel((x, y), (107, 74, 44, 255))
            # a single-pixel "speck" far from the main figure — would be dropped by isolation
            sheet.putpixel((1, 1), (107, 74, 44, 255))
            sheet.save(src_path)

            palette = [(107, 74, 44)]
            make_runtime_sprite.compose_sheet(
                source_path=src_path, output_path=out_path, palette=palette,
                source_frames=1, source_cols=1, source_rows=1,
                target_cols=1, target_rows=1, frame_w=16, frame_h=24,
                baseline_y=20, start_target_index=0,
            )
            result = Image.open(out_path).convert("RGBA")
            # The speck survives passthrough — proving no isolation ran.
            self.assertEqual(result.getpixel((1, 1)), (107, 74, 44, 255))

    def test_legacy_chroma_path_used_when_source_dims_differ(self) -> None:
        """If source dims do NOT match runtime, fall back to chroma+isolate+fit."""
        with tempfile.TemporaryDirectory() as tmp:
            src_path = Path(tmp) / "src.png"
            out_path = Path(tmp) / "out.png"
            # high-res chroma source: 64×96 cell with magenta bg, figure in center
            cell = Image.new("RGBA", (64, 96), (255, 0, 255, 255))
            for y in range(20, 80):
                for x in range(20, 44):
                    cell.putpixel((x, y), (107, 74, 44, 255))
            cell.save(src_path)

            palette = [(107, 74, 44)]
            make_runtime_sprite.compose_sheet(
                source_path=src_path, output_path=out_path, palette=palette,
                source_frames=1, source_cols=1, source_rows=1,
                target_cols=1, target_rows=1, frame_w=16, frame_h=24,
                baseline_y=20, start_target_index=0,
            )
            result = Image.open(out_path).convert("RGBA")
            self.assertEqual(result.size, (16, 24))
            # legacy path produces transparent bg (no magenta) and aspect-fits to baseline
            self.assertEqual(result.getpixel((0, 0))[3], 0)
            # at least one figure pixel sits at the baseline row (y=20)
            row20_opaque = sum(1 for x in range(16) if result.getpixel((x, 20))[3] > 0)
            self.assertGreater(row20_opaque, 0, "legacy path should anchor figure to baseline")

    def test_box_resize_method_downconverts_without_semi_alpha(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            src_path = Path(tmp) / "src.png"
            out_path = Path(tmp) / "out.png"
            cell = Image.new("RGBA", (64, 96), (255, 0, 255, 255))
            # Semi-transparent edge is common in AI pseudo-pixel art; runtime must binarize it.
            for y in range(20, 80):
                for x in range(20, 44):
                    alpha = 180 if x in (20, 43) else 255
                    cell.putpixel((x, y), (107, 74, 44, alpha))
            cell.save(src_path)

            palette = [(107, 74, 44)]
            make_runtime_sprite.compose_sheet(
                source_path=src_path, output_path=out_path, palette=palette,
                source_frames=1, source_cols=1, source_rows=1,
                target_cols=1, target_rows=1, frame_w=16, frame_h=24,
                baseline_y=20, start_target_index=0, resize_method="box",
            )
            result = Image.open(out_path).convert("RGBA")
            alphas = {px[3] for px in result.getdata()}
            self.assertLessEqual(alphas, {0, 255})

    def test_retarget_writes_candidate_without_overwriting_runtime(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            source = tmp_path / "master.png"
            runtime = tmp_path / "runtime.png"
            preview_dir = tmp_path / "preview"
            Image.new("RGBA", (16, 24), (1, 2, 3, 255)).save(runtime)

            master = Image.new("RGBA", (64, 96), (255, 0, 255, 255))
            for y in range(20, 80):
                for x in range(20, 44):
                    master.putpixel((x, y), (107, 74, 44, 255))
            master.save(source)

            class FakeSpec:
                name = "fake"
                palette = "kalev"

                def get_pass(self, pass_name: str) -> dict:
                    return {
                        "source_frames": 1,
                        "source_cols": 1,
                        "source_rows": 1,
                        "target_cols": 1,
                        "target_rows": 1,
                    }

                def source_path(self, pass_name: str) -> Path:
                    return tmp_path / "source.png"

                def master_path(self, pass_name: str) -> Path:
                    return tmp_path / "master_default.png"

                def runtime_path(self, pass_name: str) -> Path:
                    return runtime

                def preview_dir(self) -> Path:
                    return preview_dir

                def canvas_label(self, pass_name: str) -> str:
                    return "16x24"

                def frame_w(self, pass_name: str) -> int:
                    return 16

                def frame_h(self, pass_name: str) -> int:
                    return 24

                def baseline_y(self, pass_name: str) -> int:
                    return 20

                def target_cols(self, pass_name: str) -> int:
                    return 1

                def target_rows(self, pass_name: str) -> int:
                    return 1

                def sheet_w(self, pass_name: str) -> int:
                    return 16

                def sheet_h(self, pass_name: str) -> int:
                    return 24

            with contextlib.redirect_stdout(io.StringIO()):
                rc = retarget.run(FakeSpec(), "idle", source=source, method="box", promote=False)
            self.assertEqual(rc, 0)
            self.assertEqual(Image.open(runtime).convert("RGBA").getpixel((0, 0)), (1, 2, 3, 255))
            candidates = list(preview_dir.glob("candidates/*/fake_idle_box_16x24.png"))
            self.assertEqual(len(candidates), 1)
            self.assertTrue((candidates[0].parent / "retarget_report.json").exists())

    def test_pixellab_balance_reports_missing_api_key_without_crashing(self) -> None:
        import pixellab as pl
        self.assertEqual(pl.ENV_API_KEY, "PIXELLAB_SECRET")
        with mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop(pl.ENV_API_KEY, None)
            args = SimpleNamespace()
            with contextlib.redirect_stdout(io.StringIO()) as buf:
                rc = pl.cmd_balance(args)
            self.assertEqual(rc, 1)
            self.assertIn(f"{pl.ENV_API_KEY} not set", buf.getvalue())

    def test_pixellab_character_state_round_trip_uses_json_file(self) -> None:
        import pixellab as pl
        with tempfile.TemporaryDirectory() as tmp:
            with mock.patch.object(pl, "PIXELLAB_STATE_DIR", Path(tmp)):
                state = pl.CharacterState(
                    character="kalev",
                    character_id="char_abc123",
                    prompt="test prompt",
                    created_at="2026-05-10T12:00:00+00:00",
                    canvas_w=64, canvas_h=96, palette="kalev",
                    last_animations={"locomotion": ["job_001", "job_002"]},
                )
                saved = state.save()
                self.assertTrue(saved.exists())

                loaded = pl.CharacterState.load("kalev")
                self.assertIsNotNone(loaded)
                self.assertEqual(loaded.character_id, "char_abc123")
                self.assertEqual(loaded.canvas_w, 64)
                self.assertEqual(loaded.last_animations["locomotion"], ["job_001", "job_002"])

                self.assertIsNone(pl.CharacterState.load("nobody"))

    def test_pixellab_generate_errors_when_no_character_state(self) -> None:
        import pixellab as pl
        with tempfile.TemporaryDirectory() as tmp:
            with mock.patch.object(pl, "PIXELLAB_STATE_DIR", Path(tmp)):
                args = SimpleNamespace(character="kalev", pass_name="locomotion", dry_run=False)
                with self.assertRaises(SystemExit) as ctx:
                    pl.cmd_generate(args)
                self.assertIn("character create kalev", str(ctx.exception))

    def test_pixellab_generate_errors_when_canvas_mismatches_pass(self) -> None:
        import pixellab as pl
        with tempfile.TemporaryDirectory() as tmp:
            with mock.patch.object(pl, "PIXELLAB_STATE_DIR", Path(tmp)):
                # Save a state with mismatched canvas (32×32 vs locomotion's 64×96)
                state = pl.CharacterState(
                    character="kalev", character_id="char_x", prompt="x",
                    created_at="2026-05-10T12:00:00+00:00",
                    canvas_w=32, canvas_h=32, palette="kalev", last_animations={},
                )
                state.save()
                args = SimpleNamespace(character="kalev", pass_name="locomotion", dry_run=False)
                with self.assertRaises(SystemExit) as ctx:
                    pl.cmd_generate(args)
                self.assertIn("32×32", str(ctx.exception))

    def test_pixellab_assemble_lays_frames_in_spec_grid(self) -> None:
        """assemble crops each frame to alpha-bbox then anchors feet at baseline.
        With a multi-pixel figure, the bottom of the figure should land at y=baseline."""
        import pixellab as pl
        spec = cli.load_spec("kalev")
        pass_name = "locomotion"
        keys = spec.get_pass(pass_name)["animation_keys"]
        target_cols = spec.target_cols(pass_name)
        target_rows = spec.target_rows(pass_name)
        fw, fh = spec.frame_w(pass_name), spec.frame_h(pass_name)
        baseline_y = spec.baseline_y(pass_name)

        with tempfile.TemporaryDirectory() as tmp:
            frames_dir = Path(tmp) / "frames"
            frames_dir.mkdir()
            # Authoring a small figure (10×40 block of cedar-brown pixels).
            test_frame = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
            for y in range(20, 60):
                for x in range(28, 38):
                    test_frame.putpixel((x, y), (107, 74, 44, 255))
            test_frame.save(frames_dir / f"{keys[0]}_0.png")

            runtime_path = Path(tmp) / "runtime.png"
            with mock.patch.object(spec, "runtime_path", return_value=runtime_path):
                with mock.patch.object(pl, "load_spec", return_value=spec):
                    args = SimpleNamespace(
                        character="kalev", pass_name=pass_name,
                        frames_dir=str(frames_dir),
                        intake_root=str(Path(tmp) / "intake"),
                    )
                    with contextlib.redirect_stdout(io.StringIO()):
                        rc = pl.cmd_assemble(args)
                    self.assertEqual(rc, 0)
                    sheet = Image.open(runtime_path).convert("RGBA")
                    self.assertEqual(sheet.size, (target_cols * fw, target_rows * fh))
                    # The figure's bottom should sit at y=baseline_y in cell (0,0).
                    bottom_row = [sheet.getpixel((x, baseline_y)) for x in range(fw)]
                    cedar_count = sum(1 for px in bottom_row if px == (107, 74, 44, 255))
                    self.assertGreater(cedar_count, 0,
                                       "expected at least one cedar pixel at baseline")
                    # And cell (1, 0) (next column, idle_down frame 1) should be empty.
                    cell_1_pixels = [sheet.getpixel((fw + x, y))
                                     for x in range(fw) for y in range(fh)]
                    self.assertTrue(all(px[3] == 0 for px in cell_1_pixels),
                                    "missing-frame cell should be transparent")

                    manifests = list((Path(tmp) / "intake").glob("*/manifest.json"))
                    self.assertEqual(len(manifests), 1)
                    manifest_text = manifests[0].read_text()
                    self.assertNotIn("PIXELLAB_SECRET", manifest_text)
                    self.assertNotIn("Bearer ", manifest_text)
                    manifest = json.loads(manifest_text)
                    self.assertEqual(manifest["adapter"], "manual_frames")
                    self.assertEqual(manifest["character"], "kalev")
                    self.assertEqual(manifest["pass"], "locomotion")
                    self.assertEqual(manifest["artifacts"][-1]["kind"], "runtime_sheet")

    def test_pixellab_cli_preserves_status_alias_and_character_refresh(self) -> None:
        import pixellab as pl

        parser = argparse.ArgumentParser()
        sub = parser.add_subparsers(dest="command", required=True)
        pl.add_subcommand(sub)

        status = parser.parse_args(["pixellab", "status"])
        self.assertIs(status.func, pl.cmd_balance)

        refresh = parser.parse_args(["pixellab", "character", "refresh", "kalev"])
        self.assertIs(refresh.func, pl.cmd_character_refresh)
        self.assertEqual(refresh.character, "kalev")

    def test_animation_catalog_keeps_idle_walk_mapping_and_reports_unsupported(self) -> None:
        import animation_catalog as ac

        self.assertEqual(ac.ANIM_TEMPLATE_BY_KEY["idle_down"], ("breathing-idle", "south"))
        self.assertEqual(ac.ANIM_TEMPLATE_BY_KEY["walk_right"], ("walking", "east"))

        plan = ac.plan_animation_keys(["idle_down", "write_name", "downed"])
        self.assertEqual(plan["job_count"], 1)
        self.assertEqual([row["key"] for row in plan["unsupported"]], ["write_name", "downed"])
        self.assertIn("write_name", ac.unsupported_message(plan))

    def test_pixellab_generate_dry_run_uses_catalog_without_network_calls(self) -> None:
        import pixellab as pl

        with tempfile.TemporaryDirectory() as tmp:
            with mock.patch.object(pl, "PIXELLAB_STATE_DIR", Path(tmp)):
                pl.CharacterState(
                    character="kalev",
                    character_id="char_dry",
                    prompt="prompt kept out of manifests on dry-run",
                    created_at="2026-05-10T12:00:00+00:00",
                    canvas_w=64,
                    canvas_h=96,
                    palette="kalev",
                    last_animations={},
                ).save()
                args = SimpleNamespace(
                    character="kalev",
                    pass_name="locomotion",
                    dry_run=True,
                    seed=None,
                    timeout=1,
                    poll_interval=0.01,
                )
                with (
                    mock.patch.object(pl, "_post", side_effect=AssertionError("POST not allowed")),
                    mock.patch.object(pl, "_get", side_effect=AssertionError("GET not allowed")),
                    mock.patch.object(pl, "_download", side_effect=AssertionError("download not allowed")),
                    mock.patch.object(pl, "_wait_for_job", side_effect=AssertionError("poll not allowed")),
                    contextlib.redirect_stdout(io.StringIO()) as buf,
                ):
                    self.assertEqual(pl.cmd_generate(args), 0)

                out = buf.getvalue()
                self.assertIn("job count:      8", out)
                self.assertIn("--dry-run: skipping API calls", out)

    def test_pixellab_generate_unsupported_pass_fails_before_network(self) -> None:
        import pixellab as pl

        args = SimpleNamespace(
            character="kalev",
            pass_name="care",
            dry_run=False,
            seed=None,
            timeout=1,
            poll_interval=0.01,
        )
        with (
            mock.patch.object(pl, "_post", side_effect=AssertionError("POST not allowed")),
            mock.patch.object(pl, "_get", side_effect=AssertionError("GET not allowed")),
            mock.patch.object(pl, "_download", side_effect=AssertionError("download not allowed")),
            mock.patch.object(pl, "_wait_for_job", side_effect=AssertionError("poll not allowed")),
            contextlib.redirect_stdout(io.StringIO()),
            self.assertRaises(SystemExit) as ctx,
        ):
            pl.cmd_generate(args)
        self.assertIn("write_name", str(ctx.exception))

    def test_pixellab_character_create_writes_pending_manifest_before_paid_post(self) -> None:
        import pixellab as pl

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            ref = tmp_path / "ref.png"
            Image.new("RGBA", (64, 96), (0, 0, 0, 0)).save(ref)
            intake = tmp_path / "intake"

            def fake_post(path: str, body: dict) -> dict:
                self.assertEqual(path, "/create-character-v3")
                manifests = list(intake.glob("*/manifest.json"))
                self.assertEqual(len(manifests), 1)
                text = manifests[0].read_text()
                self.assertIn('"status": "pending"', text)
                self.assertIn('"fingerprint"', text)
                self.assertNotIn("very specific private prompt", text)
                self.assertNotIn("PIXELLAB_SECRET", text)
                self.assertNotIn("Bearer ", text)
                self.assertNotIn("base64", text)
                raise SystemExit("stop after provenance assertion")

            args = SimpleNamespace(
                character="kalev",
                pass_name="idle_front",
                prompt="very specific private prompt",
                reference=str(ref),
                seed=123,
                dry_run=False,
                intake_root=str(intake),
            )
            with (
                mock.patch.object(pl, "_post", side_effect=fake_post),
                contextlib.redirect_stdout(io.StringIO()) as out,
                self.assertRaises(SystemExit) as ctx,
            ):
                pl.cmd_character_create(args)
            self.assertIn("stop after provenance assertion", str(ctx.exception))
            self.assertNotIn("very specific private prompt", out.getvalue())
            self.assertIn("prompt:    hash=", out.getvalue())

    def test_pixellab_generate_writes_pending_manifest_before_paid_post(self) -> None:
        import pixellab as pl

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            intake = tmp_path / "intake"
            with mock.patch.object(pl, "PIXELLAB_STATE_DIR", tmp_path / "state"):
                pl.CharacterState(
                    character="kalev",
                    character_id="char_pending",
                    prompt="very specific private animation prompt",
                    created_at="2026-05-10T12:00:00+00:00",
                    canvas_w=64,
                    canvas_h=96,
                    palette="kalev",
                    last_animations={},
                ).save()

                def fake_post(path: str, body: dict) -> dict:
                    self.assertEqual(path, "/animate-character")
                    manifests = list(intake.glob("*/manifest.json"))
                    self.assertEqual(len(manifests), 1)
                    text = manifests[0].read_text()
                    self.assertIn('"status": "pending"', text)
                    self.assertIn('"fingerprint"', text)
                    self.assertIn('"template_animation_id": "breathing-idle"', text)
                    self.assertNotIn("very specific private animation prompt", text)
                    self.assertNotIn("PIXELLAB_SECRET", text)
                    self.assertNotIn("Bearer ", text)
                    self.assertNotIn("base64", text)
                    raise SystemExit("stop after pending manifest assertion")

                args = SimpleNamespace(
                    character="kalev",
                    pass_name="locomotion",
                    dry_run=False,
                    seed=99,
                    timeout=1,
                    poll_interval=0.01,
                    intake_root=str(intake),
                )
                with (
                    mock.patch.object(pl, "_post", side_effect=fake_post),
                    contextlib.redirect_stdout(io.StringIO()),
                    self.assertRaises(SystemExit) as ctx,
                ):
                    pl.cmd_generate(args)
                self.assertIn("stop after pending manifest assertion", str(ctx.exception))

    def test_pixellab_zip_fallback_selects_latest_groups_and_pads_short_rows(self) -> None:
        import pixellab as pl
        import animation_catalog as ac
        import source_intake

        def png_bytes(color: tuple[int, int, int, int]) -> bytes:
            buf = io.BytesIO()
            Image.new("RGBA", (4, 4), color).save(buf, format="PNG")
            return buf.getvalue()

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            zip_buf = io.BytesIO()
            metadata = {
                "frames": {
                    "animations": {
                        "animating-old": {
                            d: [f"animations/animating-old/{d}/frame_{i:03d}.png" for i in range(4)]
                            for d in ["south", "west", "north", "east"]
                        },
                        "walking-old": {
                            d: [f"animations/walking-old/{d}/frame_{i:03d}.png" for i in range(6)]
                            for d in ["south", "west", "north", "east"]
                        },
                        "animating-new": {
                            d: [f"animations/animating-new/{d}/frame_{i:03d}.png" for i in range(4)]
                            for d in ["south", "west", "north", "east"]
                        },
                        "walking-new": {
                            d: [f"animations/walking-new/{d}/frame_{i:03d}.png" for i in range(6)]
                            for d in ["south", "west", "north", "east"]
                        },
                    }
                }
            }
            with zipfile.ZipFile(zip_buf, "w") as z:
                z.writestr("metadata.json", json.dumps(metadata))
                for group, directions in metadata["frames"]["animations"].items():
                    for paths in directions.values():
                        for path in paths:
                            is_new = "new" in group
                            z.writestr(path, png_bytes((107 if is_new else 20, 74, 44, 255)))

            run = source_intake.begin_run(
                character="kalev",
                pass_name="locomotion",
                adapter="pixellab_rest",
                operation="test-zip-fallback",
                root=tmp_path / "intake",
            )
            spec = cli.load_spec("kalev")
            plan = ac.plan_animation_keys(spec.get_pass("locomotion")["animation_keys"])
            with mock.patch.object(pl, "_download_zip", return_value=zip_buf.getvalue()):
                frames = pl._frames_from_character_zip(
                    character_id="char_test",
                    plan=plan,
                    target_cols=spec.target_cols("locomotion"),
                    run=run,
                )

            self.assertEqual(sum(len(cols) for cols in frames.values()), 40)
            self.assertTrue((run.raw_dir / "idle_down_4.png").exists())
            self.assertEqual(Image.open(run.raw_dir / "idle_down_4.png").getpixel((0, 0)), (107, 74, 44, 255))
            manifest = json.loads(run.manifest_path.read_text())
            self.assertEqual(
                manifest["events"][-1]["details"]["selected_groups"],
                {"breathing-idle": "animating-new", "walking": "walking-new"},
            )

    def test_runtime_sheet_complete_assembly_passes_baseline_validation(self) -> None:
        spec = cli.load_spec("kalev")
        pass_name = "locomotion"
        keys = spec.get_pass(pass_name)["animation_keys"]
        target_cols = spec.target_cols(pass_name)
        fw, fh = spec.frame_w(pass_name), spec.frame_h(pass_name)

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            frames_dir = tmp_path / "frames"
            frames_dir.mkdir()
            for key in keys:
                for col in range(target_cols):
                    frame = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
                    for y in range(20, 60):
                        for x in range(28, 38):
                            frame.putpixel((x, y), (107, 74, 44, 255))
                    frame.save(frames_dir / f"{key}_{col}.png")

            report = runtime_sheet.assemble_frame_dir(
                spec=spec,
                pass_name=pass_name,
                frames_dir=frames_dir,
                output_path=tmp_path / "runtime.png",
                normalized_dir=tmp_path / "normalized",
                validate=True,
            )

            self.assertTrue(report.validation)
            self.assertTrue(report.validation.ok, report.validation.failures)
            self.assertEqual(report.missing_frames, [])


if __name__ == "__main__":
    unittest.main()
