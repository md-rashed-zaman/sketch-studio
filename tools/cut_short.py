"""Cut a stretch of an episode's narration into a Short: its voice and its timing, shifted to start at 0.

    uv run python tools/cut_short.py <episode> <scene> <start_s> <end_s> <name>
    uv run python tools/cut_short.py caching stampede 507.85 555.60 stampede

Writes episodes/<episode>/shorts/<name>.wav and <name>.json. The JSON is a timing.json with one scene
(<scene>, 0 to the cut's length), the cues and caption words inside the cut, all shifted by -start.
"""

import json
import subprocess
import sys
from pathlib import Path


def cut_timing(timing, scene, start, end):
    """The part of `timing` between start and end seconds, as a one-scene timing starting at 0."""
    if scene not in timing["scenes"]:
        raise SystemExit(f"no scene {scene!r} in timing.json")
    length = round(end - start, 3)
    shift_ms = round(start * 1000)
    captions = [
        {**c, "startMs": c["startMs"] - shift_ms, "endMs": c["endMs"] - shift_ms, "timestampMs": c["timestampMs"] - shift_ms}
        for c in timing["captions"]
        if c["startMs"] >= shift_ms and c["endMs"] <= round(end * 1000)
    ]
    return {
        "duration": length,
        "scenes": {scene: [0, length]},
        "cues": {k: round(v - start, 3) for k, v in timing["cues"].items() if start <= v <= end},
        "captions": captions,
    }


def main():
    if len(sys.argv) != 6:
        sys.exit(__doc__)
    episode, scene, start, end, name = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
    folder = Path(__file__).resolve().parent.parent / "episodes" / episode
    out = folder / "shorts"
    out.mkdir(exist_ok=True)
    part = cut_timing(json.loads((folder / "timing.json").read_text()), scene, start, end)
    (out / f"{name}.json").write_text(json.dumps(part, indent=1) + "\n")
    # short fades so the cut never clicks
    fade = f"afade=t=in:d=0.05,afade=t=out:st={part['duration'] - 0.25}:d=0.25"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(start), "-to", str(end), "-i", str(folder / "audio" / "voice.wav"),
                    "-af", fade, str(out / f"{name}.wav")], check=True)
    print(f"wrote {out / name}.wav and .json: {part['duration']} s, {len(part['cues'])} cues, {len(part['captions'])} words")


if __name__ == "__main__":
    main()
