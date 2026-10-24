#!/usr/bin/env bash
# TEMPORARY narration for testing the pipeline before a real recording exists. Never publish it:
# the channel uses the creator's own voice. Writes one Piper TTS file per scene, following the recording
# convention: audio/raw/NN-<scene>-placeholder.wav (NN = scene order).
#   bash tools/placeholder-voice.sh <episode>
set -euo pipefail

ep=${1:?usage: bash tools/placeholder-voice.sh <episode>}
[ -d "$ep" ] || ep="$(dirname "$0")/../episodes/$ep"
voices="${XDG_CACHE_HOME:-$HOME/.cache}/piper-voices"
voice=en_US-lessac-medium
mkdir -p "$voices" "$ep/audio/raw"

[ -f "$voices/$voice.onnx" ] || uvx --from piper-tts python -m piper.download_voices "$voice" --download-dir "$voices"
python3 "$(dirname "$0")/align.py" "$ep" --scenes | while IFS=$'\t' read -r n scene text; do
  out="$ep/audio/raw/$n-$scene-placeholder.wav"
  printf '%s\n' "$text" | uvx --from piper-tts python -m piper -m "$voice" --data-dir "$voices" --sentence-silence 0.35 -f "$out"
  echo "wrote $out (placeholder, not for publishing)"
done
