## ScriptEditor <- PanelContainer

Godot editor's script editor. **Note:** This class shouldn't be instantiated directly. Instead, access the singleton using `EditorInterface.get_script_editor`.

**Methods:**
- ClearDocsFromScript(Script script) - Removes the documentation for the given `script`. **Note:** This should be called whenever the script is changed to keep the open documentation state up to date.
- CloseFile(string path) -> int - Closes the file at the given `path`, discarding any unsaved changes. Returns `OK` on success or `ERR_FILE_NOT_FOUND` if the file is not found.
- GetBreakpoints() -> string[] - Returns array of breakpoints.
- GetCurrentEditor() -> ScriptEditorBase - Returns the ScriptEditorBase object that the user is currently editing.
- GetCurrentScript() -> Script - Returns a Script that is currently active in editor.
- GetOpenScriptEditors() -> ScriptEditorBase[] - Returns an array with all ScriptEditorBase objects which are currently open in editor.
- GetOpenScripts() -> Script[] - Returns an array with all Script objects which are currently open in editor.
- GetUnsavedFiles() -> string[] - Returns an array of file paths of scripts with unsaved changes open in the editor.
- GotoHelp(string topic) - Opens help for the given topic. The `topic` is an encoded string that controls which class, method, constant, signal, annotation, property, or theme item should be focused. The supported `topic` formats include `class_name:class`, `class_method:class:method`, `class_constant:class:constant`, `class_signal:class:signal`, `class_annotation:class:@annotation`, `class_property:class:property`, and `class_theme_item:class:item`, where `class` is the class name, `method` is the method name, `constant` is the constant name, `signal` is the signal name, `annotation` is the annotation name, `property` is the property name, and `item` is the theme item.
- GotoLine(int lineNumber) - Goes to the specified line in the current script.
- OpenScriptCreateDialog(string baseName, string basePath) - Opens the script create dialog. The script will extend `base_name`. The file extension can be omitted from `base_path`. It will be added based on the selected scripting language.
- RegisterSyntaxHighlighter(EditorSyntaxHighlighter syntaxHighlighter) - Registers the EditorSyntaxHighlighter to the editor, the EditorSyntaxHighlighter will be available on all open scripts. **Note:** Does not apply to scripts that are already opened.
- ReloadOpenFiles() - Reloads all currently opened files. This should be used when opened files are changed outside of the script editor. The user may be prompted to resolve file conflicts, see `EditorSettings.text_editor/behavior/files/auto_reload_scripts_on_external_change`.
- SaveAllScripts() - Saves all open scripts.
- UnregisterSyntaxHighlighter(EditorSyntaxHighlighter syntaxHighlighter) - Unregisters the EditorSyntaxHighlighter from the editor. **Note:** The EditorSyntaxHighlighter will still be applied to scripts that are already opened.
- UpdateDocsFromScript(Script script) - Updates the documentation for the given `script`. **Note:** This should be called whenever the script is changed to keep the open documentation state up to date.

**Signals:**
- EditorScriptChanged(Script script) - Emitted when user changed active script. Argument is a freshly activated Script.
- ScriptClose(Script script) - Emitted when editor is about to close the active script. Argument is a Script that is going to be closed.

