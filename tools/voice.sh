#!/usr/bin/env bash
# Clean an episode's voice: per take noise reduction + silence cutting, then join with chapter pauses,
# then loudness -14 LUFS.
#   npm run voice -- <episode>      reads audio/raw/* in name order, writes audio/voice.wav
# Name takes by scene number: 01-problem.wav, 02-cache-aside.wav. Files sharing the same leading number
# (01a-..., 01b-...) are one scene and are joined without a pause; between scenes a fixed pause of
# tokens audio.chapterGapS is inserted, so the chapter transition plays in silence instead of over speech.
# Noise reduction uses DeepFilterNet's `deep-filter` binary when it is on PATH, else ffmpeg's afftdn.
set -euo pipefail

ep=${1:?usage: npm run voice -- <episode>}
[ -d "$ep" ] || ep="$(dirname "$0")/../episodes/$ep"
raw="$ep/audio/raw"
out="$ep/audio/voice.wav"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

shopt -s nullglob
takes=("$raw"/*.wav "$raw"/*.flac "$raw"/*.m4a "$raw"/*.mp3)
[ ${#takes[@]} -gt 0 ] || { echo "no takes in $raw" >&2; exit 1; }
IFS=$'\n' takes=($(printf '%s\n' "${takes[@]}" | sort)); unset IFS

ff() { ffmpeg -hide_banner -loglevel error -y "$@"; }
gap=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['audio']['chapterGapS'])" "$(dirname "$0")/../design/tokens.json")

# 1-3. Per take: 48 kHz stereo + high-pass (desk rumble), noise reduction, cut pauses longer than the margin.
#      Stereo until the cut: auto-editor 29.3.1 plays mono WAV back at double speed.
parts=(); prev=""
for i in "${!takes[@]}"; do
  f="${takes[$i]}"; scene=$(basename "$f" | grep -oE '^[0-9]+' || true)
  ff -i "$f" -af "highpass=f=80,aformat=sample_rates=48000:channel_layouts=stereo" "$tmp/in$i.wav"
  if command -v deep-filter >/dev/null; then
    deep-filter --output-dir "$tmp/df$i" "$tmp/in$i.wav" >/dev/null; mv "$tmp/df$i/in$i.wav" "$tmp/clean$i.wav"
  else
    ff -i "$tmp/in$i.wav" -af "afftdn=nr=12:nf=-40" "$tmp/clean$i.wav"
  fi
  uv run --project "$(dirname "$0")/.." auto-editor "$tmp/clean$i.wav" --margin 0.25s --no-open -o "$tmp/cut$i.wav" >/dev/null
  # A new leading scene number starts a new chapter: insert the chapter pause before it.
  if [ $i -gt 0 ] && [ -n "$scene" ] && [ "$scene" != "$prev" ]; then
    ff -f lavfi -i "anullsrc=r=48000:cl=stereo" -t "$gap" "$tmp/gap$i.wav"; parts+=("$tmp/gap$i.wav")
  fi
  parts+=("$tmp/cut$i.wav"); prev="$scene"
done
inputs=(); labels=""
for i in "${!parts[@]}"; do inputs+=(-i "${parts[$i]}"); labels+="[$i:a]"; done
ff "${inputs[@]}" -filter_complex "${labels}concat=n=${#parts[@]}:v=0:a=1,pan=mono|c0=0.5*c0+0.5*c1" "$tmp/cut.wav"

# 4. Loudness -14 LUFS (YouTube's reference), -1.5 dBTP ceiling. Raw speech peaks too high for
#    loudnorm alone to reach the target, so: measured gain, a -3 dBFS limiter, then loudnorm to finish.
loudness=$(ffmpeg -hide_banner -i "$tmp/cut.wav" -af ebur128=framelog=quiet -f null - 2>&1 | awk '/^ +I:/ {i=$2} END {print i}')
gain=$(awk -v i="$loudness" 'BEGIN {print -14 - i}')
ff -i "$tmp/cut.wav" -af "volume=${gain}dB,alimiter=limit=0.708:level=disabled:attack=2:release=40,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -ar 48000 -c:a pcm_s16le "$out"

echo "wrote $out ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")s)"
