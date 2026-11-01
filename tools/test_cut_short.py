from cut_short import cut_timing

TIMING = {
    "duration": 30,
    "scenes": {"intro": [0, 10], "bug": [10, 30]},
    "cues": {"early": 5.0, "hot": 12.5, "down": 20.0, "late": 29.0},
    "captions": [
        {"text": "Before", "startMs": 9000, "endMs": 9500, "timestampMs": 9000, "confidence": None},
        {"text": "Imagine", "startMs": 11000, "endMs": 11400, "timestampMs": 11000, "confidence": None},
        {"text": "down.", "startMs": 19800, "endMs": 20200, "timestampMs": 19800, "confidence": None},
        {"text": "after", "startMs": 24900, "endMs": 25300, "timestampMs": 24900, "confidence": None},
    ],
}


def test_cut_keeps_only_the_window_and_shifts_it_to_zero():
    part = cut_timing(TIMING, "bug", 10.5, 25.0)
    assert part["duration"] == 14.5
    assert part["scenes"] == {"bug": [0, 14.5]}
    assert part["cues"] == {"hot": 2.0, "down": 9.5}
    # a word that runs past the end of the cut is dropped, not truncated
    assert [c["text"] for c in part["captions"]] == ["Imagine", "down."]
    assert part["captions"][0]["startMs"] == 500 and part["captions"][0]["timestampMs"] == 500
