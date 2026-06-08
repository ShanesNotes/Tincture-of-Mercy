## Translation <- Resource

Translation maps a collection of strings to their individual translations, and also provides convenience methods for pluralization. A Translation consists of messages. A message is identified by its context and untranslated string. Unlike , using an empty context string in Godot means not using any context.

**Props:**
- Locale: string = "en"
- PluralRulesOverride: string = ""

- **locale**: The locale of the translation.
- **plural_rules_override**: The plural rules string to enforce. See for examples and more info. If empty or invalid, default plural rules from `TranslationServer.get_plural_rules` are used. The English plural rules are used as a fallback.

**Methods:**
- GetMessage(StringName srcMessage, StringName context) -> StringName - Virtual method to override `get_message`.
- GetPluralMessage(StringName srcMessage, StringName srcPluralMessage, int n, StringName context) -> StringName - Virtual method to override `get_plural_message`.
- AddMessage(StringName srcMessage, StringName xlatedMessage, StringName context = &"") - Adds a message if nonexistent, followed by its translation. An additional context could be used to specify the translation context or differentiate polysemic words.
- AddPluralMessage(StringName srcMessage, string[] xlatedMessages, StringName context = &"") - Adds a message involving plural translation if nonexistent, followed by its translation. An additional context could be used to specify the translation context or differentiate polysemic words.
- EraseMessage(StringName srcMessage, StringName context = &"") - Erases a message.
- GetMessage(StringName srcMessage, StringName context = &"") -> StringName - Returns a message's translation.
- GetMessageCount() -> int - Returns the number of existing messages.
- GetMessageList() -> string[] - Returns the keys of all messages, that is, the context and untranslated strings of each message. **Note:** If a message does not use a context, the corresponding element is the untranslated string. Otherwise, the corresponding element is the context and untranslated string separated by the EOT character (`U+0004`). This is done for compatibility purposes.
- GetPluralMessage(StringName srcMessage, StringName srcPluralMessage, int n, StringName context = &"") -> StringName - Returns a message's translation involving plurals. The number `n` is the number or quantity of the plural object. It will be used to guide the translation system to fetch the correct plural form for the selected language. **Note:** Plurals are only supported in , not CSV.
- GetTranslatedMessageList() -> string[] - Returns all the translated strings.

