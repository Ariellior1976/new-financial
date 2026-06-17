---
name: deck-edit-mode
description: Add an in-browser edit mode to a static HTML slide deck/presentation. Use when the user wants to edit, tweak, or reposition text and elements directly in a generated presentation/deck HTML file, or asks to "add edit mode" / "make the deck editable".
---

# Deck Edit Mode

Injects a self-contained, dependency-free editing toolbar into a static HTML
presentation so it can be edited directly in the browser: click text to edit
it in place, drag elements to reposition them, and export the edited deck as
a new HTML file.

## When to use

The user has (or asks you to generate) a standalone HTML slide deck and wants
to be able to edit slide content without regenerating it from scratch.

## How to use

Run the injector script against the deck's HTML file:

```bash
python3 .claude/skills/deck-edit-mode/scripts/inject_editor.py <path-to-deck.html>
```

By default this modifies the file in place. Pass `--output <path>` to write
to a new file instead and leave the original untouched.

The script is idempotent: running it again on a deck that already has edit
mode (in-place upgrade) replaces the injected block instead of duplicating
it, so it's safe to re-run after updating `editor.js`/`editor.css`.

## What gets injected

`inject_editor.py` inlines the contents of `scripts/editor.css` and
`scripts/editor.js` directly into the deck's `<head>`/`<body>`, wrapped in
`<!-- deck-edit-mode:start -->` / `<!-- deck-edit-mode:end -->` markers, so
the deck stays a single portable HTML file (no external asset references).

In the browser, the deck gains:
- A floating toolbar (bottom-right) with an Edit Mode toggle and a
  Save/Export button.
- When edit mode is on: text elements become directly editable
  (`contenteditable`) on click, and elements become draggable by their
  top-left handle.
- Edits are kept in memory in the page; Save/Export serializes the current
  DOM state and downloads it as a new HTML file the user can keep or feed
  back into the injector.
- A keyboard shortcut (`E`) toggles edit mode without using the toolbar.

## Notes

- The injector only touches the deck file passed to it; it never modifies
  `editor.js`/`editor.css` themselves.
- If the deck has no recognizable `<head>`/`<body>` tags, the script exits
  with an error rather than guessing where to inject.
