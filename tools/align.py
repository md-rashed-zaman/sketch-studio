"""Align an episode's recorded voice to its script and write timing.json.

    uv run python tools/align.py <episode>            # e.g. sample or episodes/sample
    uv run python tools/align.py <episode> --text     # print the narration only (for TTS placeholders)

WhisperX transcribes audio/voice.wav and force-aligns the transcript for word timings. The heard
words are then matched to the script words, so captions use the script's spelling and every
{cue:name} lands on the end of the script word before it, even where Whisper misheard a word.
"""

import argparse
import difflib
import json
import re
import sys
from pathlib import Path

SCENE = re.compile(r"^##\s*scene:\s*([\w-]+)")
CUE = re.compile(r"\{cue:([\w-]+)\}")


def parse_script(text):
    """Returns (words, cues): words as [(scene, word)], cues as [(name, scene, number of words before it)]."""
    words, cues, scene, seen = [], [], None, set()
    for line in text.splitlines():
        line = re.sub(r"<!--.*?-->", "", line).strip()
        if line.startswith("#"):
            match = SCENE.match(line)
            scene = match.group(1) if match else None
            if scene in seen:
                raise ValueError(f"scene '{scene}' appears twice")
            if scene:
                seen.add(scene)
            continue
        if not scene or not line:
            continue
        for token in CUE.sub(lambda m: f" {m.group(0)} ", line).split():
            cue = CUE.fullmatch(token)
            if cue:
                if any(name == cue.group(1) for name, _, _ in cues):
                    raise ValueError(f"cue '{cue.group(1)}' appears twice")
                cues.append((cue.group(1), scene, len(words)))
            else:
                words.append((scene, token))
    if not words:
        raise ValueError("no narration found: lines must sit under '## scene: <id>' headings")
    return words, cues


def norm(word):
    return re.sub(r"[^a-z0-9]", "", word.lower())


def match_times(script, heard, duration):
    """Gives every script word a (start, end) from the heard words; unheard words are interpolated."""
    heard = [w for w in heard if "start" in w and "end" in w]
    times = [None] * len(script)
    matcher = difflib.SequenceMatcher(None, [norm(w) for w in script], [norm(w["word"]) for w in heard], autojunk=False)
    for op, i1, i2, j1, j2 in matcher.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = (heard[j1 + k]["start"], heard[j1 + k]["end"])
        elif op == "replace":
            # Misheard span (e.g. "forty-two" heard as "42"): share its time by character length.
            start, end = heard[j1]["start"], heard[j2 - 1]["end"]
            sizes = [max(1, len(norm(w))) for w in script[i1:i2]]
            t = start
            for k, size in enumerate(sizes):
                step = (end - start) * size / sum(sizes)
                times[i1 + k] = (t, t + step)
                t += step
    # Words never heard: spread evenly across the gap between their known neighbours.
    i = 0
    while i < len(times):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(times) and times[j] is None:
            j += 1
        left = times[i - 1][1] if i > 0 else 0.0
        right = times[j][0] if j < len(times) else duration
        step = max(0.0, right - left) / (j - i)
        for k in range(i, j):
            times[k] = (left + step * (k - i), left + step * (k - i + 1))
        i = j
    return times


def build_timing(script_text, heard, duration):
    words, cues = parse_script(script_text)
    times = match_times([w for _, w in words], heard, duration)

    scene_ids = list(dict.fromkeys(scene for scene, _ in words))
    first = {s: next(i for i, (scene, _) in enumerate(words) if scene == s) for s in scene_ids}
    last = {s: max(i for i, (scene, _) in enumerate(words) if scene == s) for s in scene_ids}
    bounds = [0.0]
    for prev, nxt in zip(scene_ids, scene_ids[1:]):
        bounds.append((times[last[prev]][1] + times[first[nxt]][0]) / 2)
    bounds.append(max(duration, times[-1][1]))

    def cue_time(scene, index):
        # End of the word before the cue; a cue that opens a scene fires when the scene's first word starts.
        if index > 0 and words[index - 1][0] == scene:
            return times[index - 1][1]
        return times[first[scene]][0]

    r = lambda t: round(t, 3)
    return {
        "duration": r(duration),
        "scenes": {s: [r(bounds[k]), r(bounds[k + 1])] for k, s in enumerate(scene_ids)},
        "cues": {name: r(cue_time(scene, index)) for name, scene, index in cues},
        "captions": [
            {
                "text": word if i == 0 else f" {word}",
                "startMs": round(start * 1000),
                "endMs": round(end * 1000),
                "timestampMs": round(start * 1000),
                "confidence": None,
            }
            for i, ((_, word), (start, end)) in enumerate(zip(words, times))
        ],
    }


def transcribe(wav, model_name):
    import warnings

    # pyannote warns that torchcodec can't load FFmpeg 8; harmless, WhisperX decodes via the ffmpeg CLI.
    warnings.filterwarnings("ignore", message=r"(?s).*torchcodec")
    import whisperx  # heavy; only needed for real alignment

    audio = whisperx.load_audio(str(wav))
    model = whisperx.load_model(model_name, "cpu", compute_type="int8", language="en")
    result = model.transcribe(audio, batch_size=4, language="en")
    del model
    align_model, metadata = whisperx.load_align_model(language_code="en", device="cpu")
    aligned = whisperx.align(result["segments"], align_model, metadata, audio, "cpu", return_char_alignments=False)
    return aligned["word_segments"], len(audio) / whisperx.audio.SAMPLE_RATE


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("episode", help="episode folder, or its name under episodes/")
    parser.add_argument("--model", default="base.en", help="Whisper model; only the transcript comes from it (default: base.en)")
    parser.add_argument("--text", action="store_true", help="print the narration text and exit")
    parser.add_argument("--scenes", action="store_true", help="print one line per scene: number, id, narration")
    args = parser.parse_args()

    folder = Path(args.episode)
    if not folder.is_dir():
        folder = Path(__file__).resolve().parent.parent / "episodes" / args.episode
    script = (folder / "script.md").read_text()

    if args.scenes:
        words, _ = parse_script(script)
        scenes = {}
        for scene, word in words:
            scenes.setdefault(scene, []).append(word)
        for n, (scene, ws) in enumerate(scenes.items(), 1):
            print(f"{n:02d}\t{scene}\t{' '.join(ws)}")
        return

    if args.text:
        words, _ = parse_script(script)
        scenes = {}
        for scene, word in words:
            scenes.setdefault(scene, []).append(word)
        print("\n\n".join(" ".join(ws) for ws in scenes.values()))
        return

    wav = folder / "audio" / "voice.wav"
    if not wav.exists():
        sys.exit(f"{wav} not found: record into audio/raw/ and run npm run voice first")
    heard, duration = transcribe(wav, args.model)
    timing = build_timing(script, heard, duration)
    (folder / "timing.json").write_text(json.dumps(timing, indent=1) + "\n")

    print(f"wrote {folder / 'timing.json'}: {len(timing['scenes'])} scenes, {len(timing['cues'])} cues, {duration:.1f}s; "
          f"heard {sum(1 for w in heard if 'start' in w)} timed words for {len(timing['captions'])} script words")
    _, cues = parse_script(script)
    for name, scene, _ in cues:
        t, end = timing["cues"][name], timing["scenes"][scene][1]
        late = "   <- under 0.8 s before the scene ends; move the cue earlier" if end - t < 0.8 else ""
        print(f"  {t:7.2f}s  {name}{late}")


if __name__ == "__main__":
    main()
