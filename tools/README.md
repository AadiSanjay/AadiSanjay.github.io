# Sound tools

How the key sounds in `public/sounds/` were made from my own sound-test videos.
macOS only (AVFoundation, Accelerate, `afconvert`), no other dependencies.

```bash
# WORK/videos/*.mp4  ->  WORK/audio/*.wav (mono 44.1k) + WORK/frames/*.jpg (to tell boards apart)
mkdir -p WORK/videos WORK/audio WORK/frames WORK/clips
swift tools/extract-audio.swift WORK

# per board: find key events, keep the most typical clean presses + releases
swiftc -O tools/sounds.swift -o WORK/sounds
WORK/sounds WORK/audio/IMG_1947.wav WORK/clips red-samurai
WORK/sounds WORK/audio/IMG_1216.wav WORK/clips blue-samurai
WORK/sounds WORK/audio/IMG_5659.wav WORK/clips apollo
WORK/sounds WORK/audio/IMG_1210.wav WORK/clips white
WORK/sounds WORK/audio/IMG_0478.wav WORK/clips matcha WORK/audio/IMG_0480.wav

# encode for the web
for f in WORK/clips/*.wav; do afconvert -f m4af -d aac -b 128000 "$f" "${f%.wav}.m4a"; done
```

What `sounds.swift` does:

1. **Finds key events** with spectral flux (1024-point FFT, 3 ms hop, adaptive median threshold), merges hits under
   50 ms apart (a press is often fingertip-then-bottom-out), and snaps each onset to the exact sample.
2. **Splits presses from releases** by clustering event loudness into two groups.
3. **Measures every event**: spectral centroid (brightness), share of energy under 400 Hz (thock), and decay time.
   It prints a profile per board, which is how I checked the boards really differ:

   | board | centroid | < 400 Hz | decay |
   |---|---|---|---|
   | Red Samurai | 1.7 kHz | 10% | 10 ms |
   | Blue Samurai | 1.0 kHz | 43% | 36 ms |
   | Apollo | 1.1 kHz | 55% | 34 ms |
   | White | 1.6 kHz | 16% | 40 ms |
   | Matcha | 1.7 kHz | 20% | 16 ms |

4. **Picks the most typical events** (closest to the board's median on all three, at normal loudness), cuts each with
   its full ring-out, runs a noise gate set from the recording's own background level, and rejects any clip with a
   second hit or that doesn't start on its hit.
5. **Matches loudness** across boards on the first 30 ms, evening out individual presses by at most ±4 dB.

Red Samurai and Blue Samurai didn't yield clean releases, so the site plays a softer, slightly higher copy of their
presses on key-up instead.
