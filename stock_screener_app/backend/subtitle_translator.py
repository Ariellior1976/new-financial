"""
Subtitle Translator: English SRT → Hebrew + Bilingual SRT
Uses Google Gemini AI for translation.
"""

import re
import os
import time
import google.generativeai as genai
from dataclasses import dataclass
from typing import Optional

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.0-flash-lite"
BATCH_SIZE = 30  # subtitles per Gemini call


@dataclass
class SubtitleBlock:
    index: int
    start: str
    end: str
    text: str  # may be multi-line


# ─────────────────────────── SRT parsing ────────────────────────────

_TIMESTAMP_RE = re.compile(
    r"(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})"
)


def parse_srt(content: str) -> list[SubtitleBlock]:
    blocks: list[SubtitleBlock] = []
    # Normalise line endings and split on blank lines
    segments = re.split(r"\n{2,}", content.strip().replace("\r\n", "\n"))
    for seg in segments:
        lines = seg.strip().splitlines()
        if len(lines) < 3:
            continue
        try:
            idx = int(lines[0].strip())
        except ValueError:
            continue
        m = _TIMESTAMP_RE.match(lines[1].strip())
        if not m:
            continue
        text = "\n".join(lines[2:]).strip()
        blocks.append(SubtitleBlock(index=idx, start=m.group(1), end=m.group(2), text=text))
    return blocks


def blocks_to_srt(blocks: list[SubtitleBlock]) -> str:
    parts = []
    for b in blocks:
        parts.append(f"{b.index}\n{b.start} --> {b.end}\n{b.text}")
    return "\n\n".join(parts) + "\n"


# ─────────────────────────── Translation ────────────────────────────

def _init_gemini() -> genai.GenerativeModel:
    if not GEMINI_API_KEY:
        raise EnvironmentError("GEMINI_API_KEY environment variable not set")
    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel(GEMINI_MODEL)


def _translate_batch(model: genai.GenerativeModel, texts: list[str]) -> list[str]:
    """Translate a batch of subtitle lines from English to Hebrew."""
    numbered = "\n".join(f"[{i+1}] {t}" for i, t in enumerate(texts))
    prompt = (
        "You are a professional subtitle translator. "
        "Translate each numbered English subtitle line to natural Hebrew. "
        "Keep the same numbering. Return ONLY the numbered translations, nothing else.\n\n"
        f"{numbered}"
    )
    response = model.generate_content(prompt)
    raw = response.text.strip()

    result: dict[int, str] = {}
    for line in raw.splitlines():
        m = re.match(r"\[(\d+)\]\s*(.*)", line)
        if m:
            result[int(m.group(1))] = m.group(2).strip()

    # Fallback: if parse failed, return originals
    return [result.get(i + 1, texts[i]) for i in range(len(texts))]


def translate_blocks(blocks: list[SubtitleBlock]) -> list[str]:
    """Return Hebrew translations for every block, in order."""
    model = _init_gemini()
    translations: list[str] = []

    for start in range(0, len(blocks), BATCH_SIZE):
        batch = blocks[start: start + BATCH_SIZE]
        # Flatten multi-line text to single line for translation, restore later
        texts = [b.text.replace("\n", " ") for b in batch]
        translated = _translate_batch(model, texts)
        translations.extend(translated)
        if start + BATCH_SIZE < len(blocks):
            time.sleep(0.5)  # gentle rate-limit

    return translations


# ─────────────────────────── Merge ──────────────────────────────────

def merge_bilingual(
    blocks: list[SubtitleBlock],
    hebrew_texts: list[str],
    layout: str = "he_below",  # "he_below" | "he_above" | "he_only"
) -> list[SubtitleBlock]:
    """Create bilingual subtitle blocks (English + Hebrew)."""
    merged = []
    for block, he in zip(blocks, hebrew_texts):
        if layout == "he_only":
            new_text = he
        elif layout == "he_above":
            new_text = f"{he}\n{block.text}"
        else:  # he_below (default)
            new_text = f"{block.text}\n{he}"
        merged.append(
            SubtitleBlock(
                index=block.index,
                start=block.start,
                end=block.end,
                text=new_text,
            )
        )
    return merged


# ─────────────────────────── Public API ─────────────────────────────

def translate_srt_file(
    input_path: str,
    output_path: Optional[str] = None,
    hebrew_only_path: Optional[str] = None,
    layout: str = "he_below",
) -> dict:
    """
    Translate an English SRT file to Hebrew and produce bilingual output.

    Args:
        input_path:       Path to the English .srt file.
        output_path:      Where to save the bilingual .srt (optional).
        hebrew_only_path: Where to save the Hebrew-only .srt (optional).
        layout:           "he_below" | "he_above" | "he_only"

    Returns:
        dict with keys: blocks_count, bilingual_srt, hebrew_srt
    """
    with open(input_path, "r", encoding="utf-8") as f:
        content = f.read()

    blocks = parse_srt(content)
    if not blocks:
        raise ValueError("No valid subtitle blocks found in the input file")

    hebrew_texts = translate_blocks(blocks)

    bilingual_blocks = merge_bilingual(blocks, hebrew_texts, layout)
    bilingual_srt = blocks_to_srt(bilingual_blocks)

    hebrew_blocks = [
        SubtitleBlock(index=b.index, start=b.start, end=b.end, text=he)
        for b, he in zip(blocks, hebrew_texts)
    ]
    hebrew_srt = blocks_to_srt(hebrew_blocks)

    if output_path:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(bilingual_srt)

    if hebrew_only_path:
        with open(hebrew_only_path, "w", encoding="utf-8") as f:
            f.write(hebrew_srt)

    return {
        "blocks_count": len(blocks),
        "bilingual_srt": bilingual_srt,
        "hebrew_srt": hebrew_srt,
    }
