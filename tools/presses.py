import sys, wave, array, math, json, os
SR = 44100
WIN = 220  # 5ms

def load(path):
    w = wave.open(path)
    return array.array('h', w.readframes(w.getnframes()))

def analyze(path):
    x = load(path)
    n = len(x) // WIN
    env = [max(abs(v) for v in x[i*WIN:(i+1)*WIN]) for i in range(n)]
    srt = sorted(env)
    floor = srt[int(n*0.2)]
    peak = srt[int(n*0.995)]
    thr = floor + (peak - floor) * 0.25
    onsets = []
    i = 2
    while i < n - 40:
        if env[i] > thr and env[i-1] <= thr:
            # local max within 30ms
            j = max(range(i, i+6), key=lambda k: env[k])
            pre = max(env[max(0, i-16):i-1])          # 80ms before
            post = max(env[j+24:j+40]) if j+40 < n else peak  # 120-200ms after peak
            onsets.append({'i': i, 'peak': env[j], 'pre': pre, 'post': post})
            i += 16  # 80ms refractory
        else:
            i += 1
    # brightness: ratio of first-difference energy to signal energy around presses
    def bright(o):
        s = o['i']*WIN; seg = x[s:s+int(0.06*SR)]
        e = sum(v*v for v in seg) or 1
        d = sum((seg[k]-seg[k-1])**2 for k in range(1, len(seg)))
        return d / e
    for o in onsets:
        o['iso'] = o['peak'] / (max(o['pre'], o['post'], floor) + 1)
    good = sorted([o for o in onsets if o['iso'] > 2.5], key=lambda o: -o['iso'])
    b = [bright(o) for o in good[:20]]
    return x, floor, peak, onsets, good, (sum(b)/len(b) if b else 0)

if __name__ == '__main__':
    d = sys.argv[1]
    for f in sorted(os.listdir(d + '/audio')):
        if not f.endswith('.wav'): continue
        x, floor, peak, onsets, good, br = analyze(d + '/audio/' + f)
        print(f, 'floor', floor, 'peak', peak, 'presses', len(onsets), 'isolated', len(good), 'brightness %.3f' % br)
