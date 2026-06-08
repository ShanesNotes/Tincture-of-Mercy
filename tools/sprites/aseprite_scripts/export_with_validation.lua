-- Tincture of Mercy — export_with_validation.lua
-- Aseprite Script: export the active sprite to its canonical runtime path AND run the
-- project Python validator. Replaces the manual Ctrl+S → File → Export Sprite Sheet → CLI dance.
--
-- Install: copy to Aseprite's scripts folder (File → Scripts → Open Scripts Folder).
-- Bind to a hotkey: Edit → Keyboard Shortcuts → "export_with_validation".
--
-- Behaviour:
--   1. Reads the open .aseprite filename.
--   2. Resolves the runtime PNG path from tools/sprites/specs via ./tools/sprite path.
--   3. Hides TOM helper layers, then saves/exports PNG with project canonical settings.
--   4. Calls tools/sprites/cli.py validate <character> <pass>.
--   5. Pops up a dialog with the result.

local sprite = app.activeSprite
if not sprite then
  app.alert("Open a sprite first.")
  return
end

local script_dir = app.fs.filePath(string.sub(debug.getinfo(1, "S").source, 2))
local tom = dofile(app.fs.joinPath(script_dir, "tom_sprite_lib.lua"))

local ctx = tom.context(sprite)
local repo = ctx.repo
local character = ctx.character
local pass_name = ctx.pass_name
local meta = tom.metadata(ctx)
local export_path = meta.paths.runtime
local sheets_dir = app.fs.joinPath(repo, "art/characters/" .. character .. "/sheets")
local cli = app.fs.joinPath(repo, "tools/sprites/cli.py")
if not export_path or export_path == "" then
  app.alert("Could not resolve runtime path for " .. character .. " / " .. pass_name .. ". Check tools/sprites/specs/.")
  return
end

-- Ensure target dir exists
if not app.fs.isDirectory(sheets_dir) then
  tom.message("export_with_validation", "Sheets directory missing: " .. sheets_dir)
  return
end

-- Save/export PNG copy. TOM helper layers are guide/overlay layers and must
-- never enter runtime PNGs.
local hidden = tom.hide_project_helper_layers(sprite)
local ok, err = pcall(function()
  if #sprite.frames > 1 and sprite.width == meta.frame_w and sprite.height == meta.frame_h then
    app.command.ExportSpriteSheet {
      ui=false,
      askOverwrite=false,
      type=SpriteSheetType.ROWS,
      columns=meta.target_cols,
      rows=meta.target_rows,
      textureFilename=export_path,
      borderPadding=0,
      shapePadding=0,
      innerPadding=0,
      trimSprite=false,
      trim=false,
      trimByGrid=false,
      ignoreEmpty=false,
      mergeDuplicates=false,
      openGenerated=false,
      splitLayers=false,
      splitTags=false,
      splitGrid=false,
      listLayers=true,
      listTags=true,
      listSlices=true,
    }
  else
    sprite:saveCopyAs(export_path)
  end
end)
tom.restore_layers(hidden)
if not ok then
  tom.message("export_with_validation", "Export failed: " .. tostring(err))
  return
end

-- Run the Python validator
local cmd = string.format("python3 %q validate %q %q 2>&1", cli, character, pass_name)
local handle = io.popen(cmd)
local output = handle and handle:read("*a") or ""
local _, _, rc = handle and handle:close() or nil, nil, 1
-- io.popen():close() in Lua does not always return rc; we parse "PASS" from output instead.
local passed = string.find(output, "PASS\n") or string.find(output, "PASS$")

local title = passed and "PASS — runtime updated" or "FAIL — see details"
if app.isUIAvailable and not tom.is_batch() then
  local dlg = Dialog { title = title }
  dlg:label { text = "Export: " .. export_path }
  dlg:newrow()
  dlg:label { text = passed and "Validation passed." or "Validation failed:" }
  dlg:newrow()
  dlg:label { text = output }
  dlg:button { id = "ok", text = "OK" }
  dlg:show()
else
  print(title)
  print("Export: " .. export_path)
  print(output)
end
