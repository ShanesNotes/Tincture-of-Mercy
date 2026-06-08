-- Tincture of Mercy — load_palette.lua
-- Aseprite Script: load any .gpl palette from the project tree into the active sprite.
-- Install: copy this file to Aseprite's scripts folder (File → Scripts → Open Scripts Folder).
-- Then run via File → Scripts → load_palette.
--
-- Behaviour:
--   1. Detects the open file's character from the path (e.g. .../kalev/sheets/...).
--   2. Loads tools/sprites/palettes/<character>.gpl if present, otherwise project.gpl.
--   3. Replaces the sprite palette in place.

local sprite = app.activeSprite
if not sprite then
  app.alert("Open a sprite first.")
  return
end

local fname = sprite.filename or ""

-- Find the tools/sprites/palettes/ directory by walking up from the open file.
local function find_repo_root(start)
  local p = start
  for _ = 1, 12 do
    if app.fs.isDirectory(app.fs.joinPath(p, "tools/sprites/palettes")) then
      return p
    end
    local parent = app.fs.filePath(p)
    if not parent or parent == p then break end
    p = parent
  end
  return nil
end

local repo = find_repo_root(app.fs.filePath(fname))
if not repo then
  app.alert("Could not locate tools/sprites/palettes/ — is this file inside the project?")
  return
end

-- Detect character from path: art/characters/<character>/...
local character = nil
for token in string.gmatch(fname, "[^/\\]+") do
  if character == "expect" then
    character = token
    break
  end
  if token == "characters" then
    character = "expect"
  end
end
if character == "expect" then character = nil end

local palette_dir = app.fs.joinPath(repo, "tools/sprites/palettes")
local candidate = character and app.fs.joinPath(palette_dir, character .. ".gpl") or nil
local fallback = app.fs.joinPath(palette_dir, "project.gpl")

local target = (candidate and app.fs.isFile(candidate)) and candidate or fallback
if not app.fs.isFile(target) then
  app.alert("No palette file found at " .. target)
  return
end

local palette = Palette { fromFile = target }
sprite:setPalette(palette)
app.refresh()
app.alert("Loaded palette: " .. target)
