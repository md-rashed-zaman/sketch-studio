import pytest

from align import build_timing, parse_script

SCRIPT = """# Title, not narration
## scene: problem | pattern: throughput-machine
Here's a server and a database. {cue:app}
Traffic grows. {cue:grow}

## scene: fix
{cue:open} A cache for user forty-two. {cue:hit}

## fact-check
- not spoken
"""


def heard_words():
    # Synthetic WhisperX output: "forty-two" heard as "42", "grows" dropped, an extra "um" inserted.
    spoken = [
        ("Here's", 0.0, 0.3), ("a", 0.3, 0.4), ("server", 0.4, 0.8), ("and", 0.8, 0.9), ("a", 0.9, 1.0),
        ("database.", 1.0, 1.6), ("Traffic", 2.0, 2.4), ("um", 2.5, 2.6),
        ("A", 4.0, 4.1), ("cache", 4.1, 4.5), ("for", 4.5, 4.6), ("user", 4.6, 4.9), ("42.", 5.0, 5.6),
    ]
    return [{"word": w, "start": s, "end": e} for w, s, e in spoken] + [{"word": "x"}]  # untimed word is skipped


def test_cues_scenes_and_captions():
    timing = build_timing(SCRIPT, heard_words(), duration=6.0)

    assert timing["cues"]["app"] == 1.6  # end of "database."
    assert 2.4 <= timing["cues"]["grow"] <= 4.0  # "grows" unheard: interpolated after "Traffic"
    assert timing["cues"]["open"] == 4.0  # opens the scene: first word start
    assert timing["cues"]["hit"] == 5.6  # end of "forty-two", matched to "42."

    problem, fix = timing["scenes"]["problem"], timing["scenes"]["fix"]
    assert problem[0] == 0.0 and fix[1] == 6.0 and problem[1] == fix[0]
    assert timing["cues"]["grow"] <= problem[1] <= 4.0

    texts = [c["text"] for c in timing["captions"]]
    assert texts[0] == "Here's" and " forty-two." in texts and "not" not in " ".join(texts)
    assert all(c["startMs"] <= c["endMs"] for c in timing["captions"])


def test_rejects_duplicate_cues():
    with pytest.raises(ValueError, match="twice"):
        parse_script("## scene: a\nOne {cue:x} two {cue:x}")
