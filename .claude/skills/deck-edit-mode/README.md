# deck-edit-mode

A Claude Code skill that adds an in-browser edit mode to static HTML
presentations/decks.

## Contents

- `SKILL.md` — instructions Claude reads to use this skill.
- `scripts/editor.js` — the editing engine, vanilla JS, no dependencies.
- `scripts/editor.css` — styling for the toolbar and editable elements.
- `scripts/inject_editor.py` — CLI that injects (or upgrades) the editor
  inside a presentation HTML file.

## Usage

```bash
python3 scripts/inject_editor.py path/to/deck.html
python3 scripts/inject_editor.py path/to/deck.html --output path/to/deck.edit.html
```

Open the resulting HTML file in a browser, click the "Edit Mode" toggle in
the bottom-right toolbar, click any text to edit it, drag elements by their
handle to reposition them, then click "Save / Export" to download the
edited deck as a new HTML file.
