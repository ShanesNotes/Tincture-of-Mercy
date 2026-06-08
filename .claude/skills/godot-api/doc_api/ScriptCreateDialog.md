## ScriptCreateDialog <- ConfirmationDialog

The ScriptCreateDialog creates script files according to a given template for a given scripting language. The standard use is to configure its fields prior to calling one of the `Window.popup` methods.

**Props:**
- DialogHideOnOk: bool = false
- OkButtonText: string = "Create"
- Title: string = "Attach Node Script"


**Methods:**
- Config(string inherits, string path, bool builtInEnabled = true, bool loadEnabled = true) - Prefills required fields to configure the ScriptCreateDialog for use.

**Signals:**
- ScriptCreated(Script script) - Emitted when the user clicks the OK button.

