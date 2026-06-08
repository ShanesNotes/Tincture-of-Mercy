-- Tincture of Mercy sprite-pipeline helper library for Aseprite Lua scripts.
-- This file is loaded by the menu scripts in this folder; do not bind it to a hotkey.

local M = {}

local function trim(s)
  return (s or ""):match("^%s*(.-)%s*$")
end

function M.is_batch()
  return app.params["batch"] == "1" or not app.isUIAvailable
end

function M.message(title, text)
  if type(text) == "table" then text = table.concat(text, "\n") end
  if app.isUIAvailable and not M.is_batch() then
    app.alert{ title=title, text=text }
  else
    print(title .. ": " .. tostring(text))
  end
end

function M.abort(text)
  M.message("Tincture sprite script", text)
  error(text, 0)
end

function M.script_dir(level)
  level = level or 2
  local info = debug.getinfo(level, "S")
  local source = info and info.source or ""
  if string.sub(source, 1, 1) == "@" then
    return app.fs.filePath(string.sub(source, 2))
  end
  return "."
end

function M.find_repo_root(start)
  local param_repo = app.params["repo"]
  if param_repo and app.fs.isDirectory(app.fs.joinPath(param_repo, "tools/sprites")) then
    return param_repo
  end
  local p = start
  if not p or p == "" then
    local sprite = app.activeSprite
    p = sprite and sprite.filename and app.fs.filePath(sprite.filename) or "."
  end
  for _ = 1, 14 do
    if app.fs.isDirectory(app.fs.joinPath(p, "tools/sprites")) then
      return p
    end
    local parent = app.fs.filePath(p)
    if not parent or parent == p then break end
    p = parent
  end
  return nil
end

local function shell_quote(value)
  return string.format("%q", tostring(value))
end

function M.run_cli(repo, args, capture)
  local cli = app.fs.joinPath(repo, "tools/sprites/cli.py")
  local parts = { "python3", shell_quote(cli) }
  for _, arg in ipairs(args) do
    table.insert(parts, shell_quote(arg))
  end
  local cmd = table.concat(parts, " ")
  if capture then
    cmd = cmd .. " 2>&1"
    local handle = io.popen(cmd)
    if not handle then return nil, "could not run " .. cmd end
    local output = handle:read("*a") or ""
    handle:close()
    return output, nil
  end
  local ok = os.execute(cmd)
  return ok, nil
end

function M.context(sprite)
  sprite = sprite or app.activeSprite
  if not sprite then M.abort("Open a sprite first.") end
  local repo = M.find_repo_root(sprite.filename ~= "" and app.fs.filePath(sprite.filename) or nil)
  if not repo then M.abort("Could not locate repo root from active sprite. Pass --script-param repo=/path/to/repo.") end

  local character = app.params["character"]
  local pass_name = app.params["pass"]
  if character and pass_name then
    return { repo=repo, character=character, pass_name=pass_name }
  end

  local fname = sprite.filename or ""
  local rel = fname
  if string.sub(fname, 1, #repo + 1) == repo .. "/" then
    rel = string.sub(fname, #repo + 2)
  end

  local stem
  character, stem = string.match(rel, "^art/characters/([^/]+)/aseprite/([^/]+)%.aseprite$")
  if not character then
    character, stem = string.match(rel, "^art/characters/([^/]+)/sheets/([^/]+)%.png$")
    if character and stem then
      local prefix = character .. "_"
      if string.sub(stem, 1, #prefix) == prefix then
        pass_name = string.sub(stem, #prefix + 1)
        pass_name = string.gsub(pass_name, "_%d+x%d+$", "")
      end
    end
  elseif stem then
    local prefix = character .. "_"
    if string.sub(stem, 1, #prefix) == prefix then
      pass_name = string.sub(stem, #prefix + 1)
    end
  end

  if not character or not pass_name or pass_name == "" then
    M.abort("Could not infer character/pass. Save under art/characters/<character>/aseprite/<character>_<pass>.aseprite or pass character/pass from ./tools/sprite aseprite-run.")
  end
  return { repo=repo, character=character, pass_name=pass_name }
end

function M.metadata(ctx)
  local output, err = M.run_cli(ctx.repo, {"metadata", ctx.character, ctx.pass_name}, true)
  if err then M.abort(err) end
  if not output or output == "" then M.abort("metadata command returned no output") end
  if not json or not json.decode then M.abort("Aseprite json.decode unavailable; update Aseprite to 1.3+") end
  local ok, decoded = pcall(json.decode, output)
  if not ok then M.abort("Could not decode sprite metadata JSON:\n" .. output) end
  return decoded
end

function M.row_indices(meta, rows_text)
  rows_text = trim(rows_text or "")
  local selected = {}
  local keys = meta.animation_keys or {}
  if rows_text == "" or rows_text == "all" then
    for row = 0, meta.target_rows - 1 do selected[row] = true end
    return selected
  end
  for token in string.gmatch(rows_text, "[^,]+") do
    token = trim(token)
    local idx = tonumber(token)
    if idx then
      selected[idx] = true
    else
      local found = false
      for i, key in ipairs(keys) do
        if key == token then
          selected[i - 1] = true
          found = true
        end
      end
      if not found then M.abort("Unknown row/animation key: " .. token) end
    end
  end
  return selected
end

function M.col_indices(meta, cols_text)
  cols_text = trim(cols_text or "")
  local selected = {}
  if cols_text == "" or cols_text == "all" then
    for col = 0, meta.target_cols - 1 do selected[col] = true end
    return selected
  end
  for token in string.gmatch(cols_text, "[^,]+") do
    token = trim(token)
    local idx = tonumber(token)
    if not idx then M.abort("Column must be a 0-based integer or all, got: " .. token) end
    selected[idx] = true
  end
  return selected
end

function M.hex_to_rgb(hex)
  hex = string.gsub(hex or "", "#", "")
  if #hex ~= 6 then M.abort("Expected color as #RRGGBB, got: " .. tostring(hex)) end
  return tonumber(string.sub(hex, 1, 2), 16), tonumber(string.sub(hex, 3, 4), 16), tonumber(string.sub(hex, 5, 6), 16)
end

function M.pixel(sprite, r, g, b, a)
  a = a == nil and 255 or a
  if sprite.colorMode == ColorMode.INDEXED then
    if a == 0 then return sprite.transparentColor end
    return Color{ r=r, g=g, b=b, a=a }.index
  elseif sprite.colorMode == ColorMode.GRAY then
    local gray = math.floor((r + g + b) / 3 + 0.5)
    return app.pixelColor.graya(gray, a)
  end
  return app.pixelColor.rgba(r, g, b, a)
end

function M.alpha(pixel)
  if app.activeSprite and app.activeSprite.colorMode == ColorMode.INDEXED then
    if pixel == app.activeSprite.transparentColor then return 0 end
    return Color(pixel).alpha
  elseif app.activeSprite and app.activeSprite.colorMode == ColorMode.GRAY then
    return app.pixelColor.grayaA(pixel)
  end
  return app.pixelColor.rgbaA(pixel)
end

function M.active_edit_image()
  local sprite = app.activeSprite
  if not sprite then M.abort("Open a sprite first.") end
  local cel = app.activeCel or sprite.cels[1]
  if not cel then M.abort("No editable cel found. Select a visible layer/cel first.") end
  app.activeCel = cel
  if cel.position.x ~= 0 or cel.position.y ~= 0
      or cel.image.width ~= sprite.width or cel.image.height ~= sprite.height then
    local full = Image(sprite.spec)
    full:clear()
    full:drawImage(cel.image, cel.position)
    cel.image = full
    cel.position = Point(0, 0)
  end
  return sprite, cel, cel.image
end

function M.cell_bounds(meta, row, col)
  return col * meta.frame_w, row * meta.frame_h, meta.frame_w, meta.frame_h
end

function M.layer_by_name(sprite, name)
  for _, layer in ipairs(sprite.layers) do
    if layer.name == name then return layer end
  end
  return nil
end

function M.delete_layer_by_name(sprite, name)
  local layer = M.layer_by_name(sprite, name)
  if layer then sprite:deleteLayer(layer); return true end
  return false
end

function M.hide_project_helper_layers(sprite)
  local changed = {}
  for _, layer in ipairs(sprite.layers) do
    if string.match(layer.name or "", "^TOM ") and layer.isVisible then
      layer.isVisible = false
      table.insert(changed, layer)
    end
  end
  return changed
end

function M.restore_layers(layers)
  for _, layer in ipairs(layers or {}) do
    layer.isVisible = true
  end
end

return M
