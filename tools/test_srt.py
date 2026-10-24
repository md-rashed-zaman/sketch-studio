from srt import MAX_LINE, group, to_srt, wrap


def words(text, start=0, step=300, gap_after=None):
    out, t = [], start
    for i, w in enumerate(text.split()):
        out.append({"text": w if i == 0 else f" {w}", "startMs": t, "endMs": t + 250})
        t += step + (2000 if gap_after == i else 0)
    return out


def test_breaks_after_sentences_and_pauses():
    cues = group(words("A normal app. Every read hits the database then it waits", gap_after=7))
    assert [c[2] for c in cues] == ["A normal app.", "Every read hits the database", "then it waits"]


def test_cues_fit_two_lines_and_six_seconds():
    long = words(" ".join(["word"] * 60), step=200)
    for start, end, text in group(long):
        assert all(len(line) <= MAX_LINE for line in wrap(text).split("\n")) and end - start <= 6000


def test_srt_format():
    srt = to_srt(words("Here is a cache."))
    assert srt.startswith("1\n00:00:00,000 --> 00:00:01,150\nHere is a cache.\n")


def test_wrap_prefers_punctuation():
    assert wrap("Here's a normal app: a server and a database.") == "Here's a normal app:\na server and a database."


def test_wrap_never_fails_on_long_text():
    assert "\n" in wrap("a" * 50 + " " + "b" * 30)
