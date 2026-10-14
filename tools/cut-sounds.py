import sys, wave, array, math, os, statistics
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from presses import analyze, WIN, SR
d, mapping = sys.argv[1], dict(a.split('=') for a in sys.argv[2:])
for src, build in mapping.items():
    x, floor, peak, onsets, good, _ = analyze(f'{d}/audio/{src}.wav')
    good = [o for o in good if SR < o['i']*WIN < len(x) - SR and o['peak'] < 30000]
    med = statistics.median(o['peak'] for o in good[:20])
    picks = sorted([o for o in good if 0.6*med < o['peak'] < 1.5*med], key=lambda o: -o['iso'])[:6]
    for k, o in enumerate(picks):
        s = o['i']*WIN - int(0.008*SR)
        seg = list(x[s:s+int(0.19*SR)])
        # cut before a second hit (release click or the next key) so each clip is one press
        w5 = int(0.003*SR)
        env = [max(abs(v) for v in seg[i:i+w5]) for i in range(0, len(seg)-w5, w5)]
        first = max(env[:8]); fell = False
        for bi, e in enumerate(env):
            if bi*w5 < 0.03*SR: continue
            if e < 0.2*first: fell = True
            elif fell and e > 0.35*first:
                seg = seg[:max(bi*w5 - int(0.004*SR), int(0.05*SR))]
                break
        rms = math.sqrt(sum(v*v for v in seg)/len(seg)) or 1
        g = min(2500/rms, 26000/max(abs(v) for v in seg))  # same loudness across builds, no clipping
        fade = min(int(0.04*SR), len(seg)//3); fin = int(0.002*SR)
        out = array.array('h', [int(max(-32767, min(32767, v*g*min(1, i/fin, (len(seg)-i)/fade)))) for i, v in enumerate(seg)])
        w = wave.open(f'{d}/clips/{build}-{k+1}.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(out.tobytes()); w.close()
    print(build, 'from', src, len(picks), 'clips, isolation', [round(o['iso'],1) for o in picks])
