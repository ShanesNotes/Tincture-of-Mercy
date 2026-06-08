## FileSystemDock <- EditorDock

This class is available only in EditorPlugins and can't be instantiated. You can access it using `EditorInterface.get_file_system_dock`. While FileSystemDock doesn't expose any methods for file manipulation, it can listen for various file-related signals.

**Methods:**
- AddResourceTooltipPlugin(EditorResourceTooltipPlugin plugin) - Registers a new EditorResourceTooltipPlugin.
- NavigateToPath(string path) - Sets the given `path` as currently selected, ensuring that the selected file/directory is visible.
- RemoveResourceTooltipPlugin(EditorResourceTooltipPlugin plugin) - Removes an EditorResourceTooltipPlugin. Fails if the plugin wasn't previously added.

**Signals:**
- DisplayModeChanged - Emitted when the user switches file display mode or split mode.
- FileRemoved(string file) - Emitted when the given `file` was removed.
- FilesMoved(string oldFile, string newFile) - Emitted when a file is moved from `old_file` path to `new_file` path.
- FolderColorChanged - Emitted when folders change color.
- FolderMoved(string oldFolder, string newFolder) - Emitted when a folder is moved from `old_folder` path to `new_folder` path.
- FolderRemoved(string folder) - Emitted when the given `folder` was removed.
- Inherit(string file) - Emitted when a new scene is created that inherits the scene at `file` path.
- Instantiate(string[] files) - Emitted when the given scenes are being instantiated in the editor.
- ResourceRemoved(Resource resource) - Emitted when an external `resource` had its file removed.
- SelectionChanged - Emitted when the selection changes. Use `EditorInterface.get_selected_paths` in the connected method to get the selected paths.

