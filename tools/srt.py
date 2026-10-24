"""Write an episode's long-form captions (out/captions.srt) from the word timings in timing.json.

    uv run python tools/srt.py <episode>      # e.g. sample or episodes/sample

Long-form videos get no burned-in captions; upload this file to YouTube instead.
Cues follow common subtitle limits: at most 2 lines of 42 characters and 6 seconds each, breaking
after a sentence and at pauses.
"""

import json
import sys
from pathlib import Path

MAX_LINE = 42
MAX_SECONDS = 6.0
PAUSE_MS = 800


def fits(text):
    """True if the text is one line, or splits at a space into two lines of at most MAX_LINE."""
    return len(text) <= MAX_LINE or any(
        ch == " " and i <= MAX_LINE and len(text) - i - 1 <= MAX_LINE for i, ch in enumerate(text)
    )


def group(captions):
    """Splits word timings into subtitle cues: [(start_ms, end_ms, text)]."""
    cues, words = [], []

    def flush():
        if words:
            cues.append((words[0]["startMs"], words[-1]["endMs"], " ".join(w["text"].strip() for w in words)))
        words.clear()

    for c in captions:
        if words:
            prev = words[-1]
            text = " ".join(w["text"].strip() for w in words + [c])
            if (
                prev["text"].strip()[-1:] in ".?!"
                or c["startMs"] - prev["endMs"] > PAUSE_MS
                or not fits(text)
                or c["endMs"] - words[0]["startMs"] > MAX_SECONDS * 1000
            ):
                flush()
        words.append(c)
    flush()
    return cues


def wrap(text):
    """One line if it fits, else two lines split near the middle, preferring a break after punctuation."""
    if len(text) <= MAX_LINE:
        return text
    spaces = [i for i, ch in enumerate(text) if ch == " "]
    spaces = [i for i in spaces if max(i, len(text) - i - 1) <= MAX_LINE] or spaces
    cut = min(spaces, key=lambda i: abs(i - len(text) / 2) - (10 if text[i - 1] in ",:;" else 0))
    return f"{text[:cut]}\n{text[cut + 1:]}"


def stamp(ms):
    h, rest = divmod(int(ms), 3_600_000)
    m, rest = divmod(rest, 60_000)
    s, ms = divmod(rest, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def to_srt(captions):
    blocks = [f"{i}\n{stamp(a)} --> {stamp(b)}\n{wrap(t)}\n" for i, (a, b, t) in enumerate(group(captions), 1)]
    return "\n".join(blocks)


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: npm run srt -- <episode>")
    folder = Path(sys.argv[1])
    if not folder.is_dir():
        folder = Path(__file__).resolve().parent.parent / "episodes" / sys.argv[1]
    timing = json.loads((folder / "timing.json").read_text())
    out = folder / "out" / "captions.srt"
    out.parent.mkdir(exist_ok=True)
    out.write_text(to_srt(timing["captions"]))
    print(f"wrote {out}: {len(group(timing['captions']))} cues")


if __name__ == "__main__":
    main()
