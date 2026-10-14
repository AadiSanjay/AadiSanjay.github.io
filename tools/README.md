# Sound tools

How the key sounds in `public/sounds/` were made from my own sound-test videos.
macOS only (uses AVFoundation and `afconvert`), no other dependencies.

```bash
# WORK/videos/*.mp4  ->  WORK/audio/*.wav (mono 44.1k) + WORK/frames/*.jpg (to tell boards apart)
mkdir -p WORK/videos WORK/audio WORK/frames WORK/clips
swift tools/extract-audio.swift WORK

# print press counts + a rough brightness number per recording
python3 tools/presses.py WORK

# cut the most isolated presses (one hit each, loudness matched) into WORK/clips/<build>-N.wav
python3 tools/cut-sounds.py WORK IMG_1947=red-samurai IMG_1216=blue-samurai IMG_5659=rose-red IMG_1210=white

# encode for the web
for f in WORK/clips/*.wav; do afconvert -f m4af -d aac -b 96000 "$f" "${f%.wav}.m4a"; done
```

Press detection: a 5 ms peak envelope, a threshold 25% of the way from the noise floor to the
loud presses, and an "isolation" score (press peak vs. the loudest thing 80 ms before and
120-200 ms after). Clips are cut before any second hit (the key release or the next key) and
faded out. Then I plotted the waveforms and dropped the messy ones by eye.
