---
name: godot-api
display_name: Godot API Lookup
short_description: Targeted Godot class and C# API lookup
default_prompt: "Use /godot-api to answer a specific Godot API or C# Godot syntax question."
allow_implicit_invocation: false
description: |
  Look up Godot engine class APIs, methods, properties, signals, enums, or C# Godot syntax. Use when you need a targeted Godot API answer or a specific engine-class recommendation.
context: fork
model: sonnet
agent: Explore
---

# Godot API Lookup

This skill is a narrow reference tool. Keep answers targeted to the caller's question.

Do not list or enumerate `.claude/skills/godot-api/doc_api/` or `.claude/skills/godot-api/doc_source/`. Those directories contain nearly a thousand files and listing them wastes context. Navigate through `_common.md`, `_other.md`, and the specific class file you actually need.

## How to answer

1. If you already know the class or likely class, search `.claude/skills/godot-api/doc_api/_common.md` and `_other.md` for the class name instead of reading the whole index files.
2. If the caller does not name a class, use `.claude/skills/godot-api/doc_api/_common.md` and `_other.md` to identify likely candidates, then read only the relevant docs.
3. Read only the relevant `.claude/skills/godot-api/doc_api/{ClassName}.md` file or files.
4. Return only what the caller needs:
   - **Specific question** (for example, "how to detect collisions") -> return the relevant methods, signals, or patterns with short descriptions
   - **Full API request** (for example, "full API for CharacterBody3D") -> return the whole class doc summary

**C# syntax reference:** `.claude/skills/godot-api/csharp.md` — C# Godot syntax, patterns, and recipes. Read it when the caller asks about C# Godot syntax, idioms, or common patterns such as input handling, tweens, state machines, or signals.

Bootstrap if `doc_api` is empty:

```bash
bash .claude/skills/godot-api/tools/ensure_doc_api.sh
```
