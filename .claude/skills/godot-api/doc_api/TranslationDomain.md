## TranslationDomain <- RefCounted

TranslationDomain is a self-contained collection of Translation resources. Translations can be added to or removed from it. If you're working with the main translation domain, it is more convenient to use the wrap methods on TranslationServer.

**Props:**
- Enabled: bool = true
- PseudolocalizationAccentsEnabled: bool = true
- PseudolocalizationDoubleVowelsEnabled: bool = false
- PseudolocalizationEnabled: bool = false
- PseudolocalizationExpansionRatio: float = 0.0
- PseudolocalizationFakeBidiEnabled: bool = false
- PseudolocalizationOverrideEnabled: bool = false
- PseudolocalizationPrefix: string = "["
- PseudolocalizationSkipPlaceholdersEnabled: bool = true
- PseudolocalizationSuffix: string = "]"

- **enabled**: If `true`, translation is enabled. Otherwise, `translate` and `translate_plural` will return the input message unchanged regardless of the current locale.
- **pseudolocalization_accents_enabled**: Replace all characters with their accented variants during pseudolocalization. **Note:** Updating this property does not automatically update texts in the scene tree. Please propagate the `MainLoop.NOTIFICATION_TRANSLATION_CHANGED` notification manually after you have finished modifying pseudolocalization related options.
- **pseudolocalization_double_vowels_enabled**: Double vowels in strings during pseudolocalization to simulate the lengthening of text due to localization. **Note:** Updating this property does not automatically update texts in the scene tree. Please propagate the `MainLoop.NOTIFICATION_TRANSLATION_CHANGED` notification manually after you have finished modifying pseudolocalization related options.
- **pseudolocalization_enabled**: If `true`, enables pseudolocalization for the project. This can be used to spot untranslatable strings or layout issues that may occur once the project is localized to languages that have longer strings than the source language. **Note:** Updating this property does not automatically update texts in the scene tree. Please propagate the `MainLoop.NOTIFICATION_TRANSLATION_CHANGED` notification manually after you have finished modifying pseudolocalization related options.
- **pseudolocalization_expansion_ratio**: The expansion ratio to use during pseudolocalization. A value of `0.3` is sufficient for most practical purposes, and will increase the length of each string by 30%. **Note:** Updating this property does not automatically update texts in the scene tree. Please propagate the `MainLoop.NOTIFICATION_TRANSLATION_CHANGED` notification manually after you have finished modifying pseudolocalization related options.
- **pseudolocalization_fake_bidi_enabled**: If `true`, emulate bidirectional (right-to-left) text when pseudolocalization is enabled. This can be used to spot issues with RTL layout and UI mirroring that will crop up if the project is localized to RTL languages such as Arabic or Hebrew. **Note:** Updating this property does not automatically update texts in the scene tree. Please propagate the `MainLoop.NOTIFICATION_TRANSLATION_CHANGED` notification manually after you have finished modifying pseudolocalization related options.
- **pseudolocalization_override_enabled**: Replace all characters in the string with `*`. Useful for finding non-localizable strings. **Note:** Updating this property does not automatically update texts in the scene tree. Please propagate the `MainLoop.NOTIFICATION_TRANSLATION_CHANGED` notification manually after you have finished modifying pseudolocalization related options.
- **pseudolocalization_prefix**: Prefix that will be prepended to the pseudolocalized string. **Note:** Updating this property does not automatically update texts in the scene tree. Please propagate the `MainLoop.NOTIFICATION_TRANSLATION_CHANGED` notification manually after you have finished modifying pseudolocalization related options.
- **pseudolocalization_skip_placeholders_enabled**: Skip placeholders for string formatting like `%s` or `%f` during pseudolocalization. Useful to identify strings which need additional control characters to display correctly. **Note:** Updating this property does not automatically update texts in the scene tree. Please propagate the `MainLoop.NOTIFICATION_TRANSLATION_CHANGED` notification manually after you have finished modifying pseudolocalization related options.
- **pseudolocalization_suffix**: Suffix that will be appended to the pseudolocalized string. **Note:** Updating this property does not automatically update texts in the scene tree. Please propagate the `MainLoop.NOTIFICATION_TRANSLATION_CHANGED` notification manually after you have finished modifying pseudolocalization related options.

**Methods:**
- AddTranslation(Translation translation) - Adds a translation.
- Clear() - Removes all translations.
- FindTranslations(string locale, bool exact) -> Translation[] - Returns the Translation instances that match `locale` (see `TranslationServer.compare_locales`). If `exact` is `true`, only instances whose locale exactly equals `locale` will be returned.
- GetLocaleOverride() -> string - Returns the locale override of the domain. Returns an empty string if locale override is disabled.
- GetTranslationObject(string locale) -> Translation - Returns the Translation instance that best matches `locale`. Returns `null` if there are no matches.
- GetTranslations() -> Translation[] - Returns all available Translation instances as added by `add_translation`.
- HasTranslation(Translation translation) -> bool - Returns `true` if this translation domain contains the given `translation`.
- HasTranslationForLocale(string locale, bool exact) -> bool - Returns `true` if there are any Translation instances that match `locale` (see `TranslationServer.compare_locales`). If `exact` is `true`, only instances whose locale exactly equals `locale` are considered.
- Pseudolocalize(StringName message) -> StringName - Returns the pseudolocalized string based on the `message` passed in.
- RemoveTranslation(Translation translation) - Removes the given translation.
- SetLocaleOverride(string locale) - Sets the locale override of the domain. If `locale` is an empty string, locale override is disabled. Otherwise, `locale` will be standardized to match known locales (e.g. `en-US` would be matched to `en_US`). **Note:** Calling this method does not automatically update texts in the scene tree. Please propagate the `MainLoop.NOTIFICATION_TRANSLATION_CHANGED` signal manually.
- Translate(StringName message, StringName context = &"") -> StringName - Returns the current locale's translation for the given message and context.
- TranslatePlural(StringName message, StringName messagePlural, int n, StringName context = &"") -> StringName - Returns the current locale's translation for the given message, plural message and context. The number `n` is the number or quantity of the plural object. It will be used to guide the translation system to fetch the correct plural form for the selected language.

