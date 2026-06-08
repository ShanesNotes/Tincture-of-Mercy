## CodeHighlighter <- SyntaxHighlighter

By adjusting various properties of this resource, you can change the colors of strings, comments, numbers, and other text patterns inside a TextEdit control.

**Props:**
- ColorRegions: Godot.Collections.Dictionary = {}
- FunctionColor: Color = Color(0, 0, 0, 1)
- KeywordColors: Godot.Collections.Dictionary = {}
- MemberKeywordColors: Godot.Collections.Dictionary = {}
- MemberVariableColor: Color = Color(0, 0, 0, 1)
- NumberColor: Color = Color(0, 0, 0, 1)
- SymbolColor: Color = Color(0, 0, 0, 1)

- **color_regions**: Sets the color regions. All existing regions will be removed. The Dictionary key is the region start and end key, separated by a space. The value is the region color.
- **function_color**: Sets color for functions. A function is a non-keyword string followed by a '('.
- **keyword_colors**: Sets the keyword colors. All existing keywords will be removed. The Dictionary key is the keyword. The value is the keyword color.
- **member_keyword_colors**: Sets the member keyword colors. All existing member keyword will be removed. The Dictionary key is the member keyword. The value is the member keyword color.
- **member_variable_color**: Sets color for member variables. A member variable is non-keyword, non-function string proceeded with a '.'.
- **number_color**: Sets the color for numbers.
- **symbol_color**: Sets the color for symbols.

**Methods:**
- AddColorRegion(string startKey, string endKey, Color color, bool lineOnly = false) - Adds a color region (such as for comments or strings) from `start_key` to `end_key`. Both keys should be symbols, and `start_key` must not be shared with other delimiters. If `line_only` is `true` or `end_key` is an empty String, the region does not carry over to the next line.
- AddKeywordColor(string keyword, Color color) - Sets the color for a keyword. The keyword cannot contain any symbols except '_'.
- AddMemberKeywordColor(string memberKeyword, Color color) - Sets the color for a member keyword. The member keyword cannot contain any symbols except '_'. It will not be highlighted if preceded by a '.'.
- ClearColorRegions() - Removes all color regions.
- ClearKeywordColors() - Removes all keywords.
- ClearMemberKeywordColors() - Removes all member keywords.
- GetKeywordColor(string keyword) -> Color - Returns the color for a keyword.
- GetMemberKeywordColor(string memberKeyword) -> Color - Returns the color for a member keyword.
- HasColorRegion(string startKey) -> bool - Returns `true` if the start key exists, else `false`.
- HasKeywordColor(string keyword) -> bool - Returns `true` if the keyword exists, else `false`.
- HasMemberKeywordColor(string memberKeyword) -> bool - Returns `true` if the member keyword exists, else `false`.
- RemoveColorRegion(string startKey) - Removes the color region that uses that start key.
- RemoveKeywordColor(string keyword) - Removes the keyword.
- RemoveMemberKeywordColor(string memberKeyword) - Removes the member keyword.

