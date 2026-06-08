## ScriptEditorBase <- VBoxContainer

Base editor for editing scripts in the ScriptEditor. This does not include documentation items.

**Methods:**
- AddSyntaxHighlighter(EditorSyntaxHighlighter highlighter) - Adds an EditorSyntaxHighlighter to the open script.
- GetBaseEditor() -> Control - Returns the underlying Control used for editing scripts. For text scripts, this is a CodeEdit.

**Signals:**
- EditedScriptChanged - Emitted after script validation.
- GoToHelp(string what) - Emitted when the user requests a specific documentation page.
- GoToMethod(Object script, string method) - Emitted when the user requests to view a specific method of a script, similar to `request_open_script_at_line`.
- NameChanged - Emitted after script validation or when the edited resource has changed.
- ReplaceInFilesRequested(string text) - Emitted when the user request to find and replace text in the file system.
- RequestHelp(string topic) - Emitted when the user requests contextual help.
- RequestOpenScriptAtLine(Object script, int line) - Emitted when the user requests to view a specific line of a script, similar to `go_to_method`.
- RequestSaveHistory - Emitted when the user contextual goto and the item is in the same script.
- RequestSavePreviousState(Godot.Collections.Dictionary state) - Emitted when the user changes current script or moves caret by 10 or more columns within the same script.
- SearchInFilesRequested(string text) - Emitted when the user request to search text in the file system.

