## AcceptDialog <- Window

The default use of AcceptDialog is to allow it to only be accepted or closed, with the same result. However, the `confirmed` and `canceled` signals allow to make the two actions different, and the `add_button` method allows to add custom buttons and actions. **Note:** AcceptDialog is invisible by default. To make it visible, call one of the `popup_*` methods from Window on the node, such as `Window.popup_centered_clamped`.

**Props:**
- DialogAutowrap: bool = false
- DialogCloseOnEscape: bool = true
- DialogHideOnOk: bool = true
- DialogText: string = ""
- Exclusive: bool = true
- KeepTitleVisible: bool = true
- MaximizeDisabled: bool = true
- MinimizeDisabled: bool = true
- OkButtonText: string = ""
- Title: string = "Alert!"
- Transient: bool = true
- Visible: bool = false
- WrapControls: bool = true

- **dialog_autowrap**: Sets autowrapping for the text in the dialog.
- **dialog_close_on_escape**: If `true`, the dialog will be hidden when the `ui_close_dialog` action is pressed (by default, this action is bound to [kbd]Escape[/kbd], or [kbd]Cmd + W[/kbd] on macOS).
- **dialog_hide_on_ok**: If `true`, the dialog is hidden when the OK button is pressed. You can set it to `false` if you want to do e.g. input validation when receiving the `confirmed` signal, and handle hiding the dialog in your own logic. **Note:** Some nodes derived from this class can have a different default value, and potentially their own built-in logic overriding this setting. For example FileDialog defaults to `false`, and has its own input validation code that is called when you press OK, which eventually hides the dialog if the input is valid. As such, this property can't be used in FileDialog to disable hiding the dialog when pressing OK.
- **dialog_text**: The text displayed by the dialog.
- **ok_button_text**: The text displayed by the OK button (see `get_ok_button`). If empty, a default text will be used.

**Methods:**
- AddButton(string text, bool right = false, string action = "") -> Button - Adds a button with label `text` and a custom `action` to the dialog and returns the created button. If `action` is not empty, pressing the button will emit the `custom_action` signal with the specified action string. If `true`, `right` will place the button to the right of any sibling buttons. You can use `remove_button` method to remove a button created with this method from the dialog.
- AddCancelButton(string name) -> Button - Adds a button with label `name` and a cancel action to the dialog and returns the created button. You can use `remove_button` method to remove a button created with this method from the dialog.
- GetLabel() -> Label - Returns the label used for built-in text. **Warning:** This is a required internal node, removing and freeing it may cause a crash. If you wish to hide it or any of its children, use their `CanvasItem.visible` property.
- GetOkButton() -> Button - Returns the OK Button instance. **Warning:** This is a required internal node, removing and freeing it may cause a crash. If you wish to hide it or any of its children, use their `CanvasItem.visible` property.
- RegisterTextEnter(LineEdit lineEdit) - Registers a LineEdit in the dialog. When the enter key is pressed, the dialog will be accepted.
- RemoveButton(Button button) - Removes the `button` from the dialog. Does NOT free the `button`. The `button` must be a Button added with `add_button` or `add_cancel_button` method. After removal, pressing the `button` will no longer emit this dialog's `custom_action` or `canceled` signals.

**Signals:**
- Canceled - Emitted when the dialog is closed or the button created with `add_cancel_button` is pressed.
- Confirmed - Emitted when the dialog is accepted, i.e. the OK button is pressed.
- CustomAction(StringName action) - Emitted when a custom button with an action is pressed. See `add_button`.

