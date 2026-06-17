#!/usr/bin/env python3
"""Inject (or upgrade) the deck-edit-mode editor into a static HTML deck."""

import argparse
import re
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent

BLOCK_RE = re.compile(
    r"<!-- deck-edit-mode:start -->.*?<!-- deck-edit-mode:end -->\n?",
    re.DOTALL,
)
BODY_CLOSE_RE = re.compile(r"</body>", re.IGNORECASE)


def build_block() -> str:
    css = (SCRIPTS_DIR / "editor.css").read_text(encoding="utf-8")
    js = (SCRIPTS_DIR / "editor.js").read_text(encoding="utf-8")
    return (
        "<!-- deck-edit-mode:start -->\n"
        f"<style>\n{css}\n</style>\n"
        f"<script>\n{js}\n</script>\n"
        "<!-- deck-edit-mode:end -->\n"
    )


def inject(html: str) -> str:
    block = build_block()
    # Use a replacement function, not a replacement string: re.sub treats
    # backslashes in a string replacement as escapes (e.g. "\n" -> newline),
    # which would corrupt the JS/CSS source embedded in `block`.
    if BLOCK_RE.search(html):
        return BLOCK_RE.sub(lambda _m: block, html)
    if not BODY_CLOSE_RE.search(html):
        raise ValueError("no </body> tag found in deck; cannot inject editor")
    return BODY_CLOSE_RE.sub(lambda _m: block + "</body>", html, count=1)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("deck", type=Path, help="path to the deck HTML file")
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="write to this path instead of editing the deck in place",
    )
    args = parser.parse_args()

    if not args.deck.is_file():
        print(f"error: {args.deck} is not a file", file=sys.stderr)
        return 1

    html = args.deck.read_text(encoding="utf-8")
    try:
        result = inject(html)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    output = args.output or args.deck
    output.write_text(result, encoding="utf-8")
    print(f"deck-edit-mode injected into {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
