// Cuts board-specific key sounds out of my sound-test recordings.
//
//   swift tools/sounds.swift <audio.wav> <out-dir> <name> [<audio2.wav> ...]
//
// Takes mono 16-bit wavs (from extract-audio.swift), finds every key event with
// spectral flux, splits them into presses (down) and releases (up), measures each
// event's tone, and keeps the ones closest to the board's typical sound, with
// their full ring-out. Prints a profile per board so boards can be compared.
import Accelerate
import Foundation

let sr: Float = 44100
let fftN = 1024
let hop = 128

func readWav(_ path: String) -> [Float] {
  let data = try! Data(contentsOf: URL(fileURLWithPath: path)).dropFirst(44)
  return data.withUnsafeBytes { raw in raw.bindMemory(to: Int16.self).map { Float($0) / 32768 } }
}

func writeWav(_ path: String, _ x: [Float]) {
  var pcm = Data(capacity: x.count * 2)
  for v in x {
    var s = Int16(max(-1, min(1, v)) * 32767).littleEndian
    pcm.append(Data(bytes: &s, count: 2))
  }
  var h = Data()
  func u32(_ v: UInt32) { var x = v.littleEndian; h.append(Data(bytes: &x, count: 4)) }
  func u16(_ v: UInt16) { var x = v.littleEndian; h.append(Data(bytes: &x, count: 2)) }
  h.append("RIFF".data(using: .ascii)!); u32(UInt32(36 + pcm.count)); h.append("WAVEfmt ".data(using: .ascii)!)
  u32(16); u16(1); u16(1); u32(44100); u32(88200); u16(2); u16(16)
  h.append("data".data(using: .ascii)!); u32(UInt32(pcm.count))
  try! (h + pcm).write(to: URL(fileURLWithPath: path))
}

let dft = try! vDSP.DiscreteFourierTransform(count: fftN, direction: .forward, transformType: .complexComplex, ofType: Float.self)
let window = vDSP.window(ofType: Float.self, usingSequence: .hanningDenormalized, count: fftN, isHalfWindow: false)

func magnitudes(_ x: [Float], at start: Int) -> [Float] {
  var frame = [Float](repeating: 0, count: fftN)
  let end = min(start + fftN, x.count)
  if start < end { frame.replaceSubrange(0..<(end - start), with: x[start..<end]) }
  frame = vDSP.multiply(frame, window)
  let zeros = [Float](repeating: 0, count: fftN)
  let out = dft.transform(real: frame, imaginary: zeros)
  let re: [Float] = out.real, im: [Float] = out.imaginary
  var mags = [Float](repeating: 0, count: fftN / 2)
  for k in 0..<fftN / 2 {
    let a: Float = re[k], b: Float = im[k]
    mags[k] = (a * a + b * b).squareRoot()
  }
  return mags
}

struct Event {
  var at: Int          // sample index of the onset
  var peak: Float      // loudest sample in the first 15 ms
  var gapBefore = 0, gapAfter = 0
  var centroid: Float = 0, low: Float = 0, decay: Float = 0
  var isDown = true
}

func detect(_ x: [Float]) -> [Event] {
  // spectral flux on log magnitudes
  var flux = [Float]()
  var prev = [Float](repeating: 0, count: fftN / 2)
  var i = 0
  while i + fftN < x.count {
    let m = magnitudes(x, at: i).map { log1p(100 * $0) }
    flux.append(zip(m, prev).reduce(0) { $0 + max(0, $1.0 - $1.1) })
    prev = m
    i += hop
  }
  // adaptive threshold: local median over ~0.4 s, plus a margin
  let half = Int(0.2 * sr) / hop
  let globalMedian = flux.sorted()[flux.count / 2]
  var events = [Event]()
  var last = -1_000_000
  for f in 1..<(flux.count - 1) {
    let lo = max(0, f - half), hi = min(flux.count, f + half)
    let local = Array(flux[lo..<hi]).sorted()[(hi - lo) / 2]
    let thr = 1.5 * max(local, globalMedian) + 0.15 * globalMedian
    guard flux[f] > thr, flux[f] >= flux[f - 1], flux[f] >= flux[f + 1] else { continue }
    let at = f * hop + fftN / 4
    // a press is often two hits ~25 ms apart (fingertip on the cap, then bottom-out): keep them as one event
    guard at - last > Int(0.05 * sr) else { continue }
    // FFT frames are ~23 ms, so snap the onset to the first sample that reaches 20% of the hit's peak
    let from = max(0, at - fftN / 2), to = min(x.count, at + Int(0.04 * sr))
    let seg = x[from..<to]
    let pk = seg.map(abs).max() ?? 0
    let exact = seg.firstIndex { abs($0) > 0.2 * pk } ?? at
    guard exact - last > Int(0.05 * sr) else { continue }
    events.append(Event(at: exact, peak: pk))
    last = exact
  }
  for k in events.indices {
    events[k].gapBefore = k > 0 ? events[k].at - events[k - 1].at : Int.max / 2
    events[k].gapAfter = k + 1 < events.count ? events[k + 1].at - events[k].at : Int.max / 2
  }
  return events
}

func measure(_ x: [Float], _ e: inout Event) {
  let len = min(Int(0.12 * sr), e.gapAfter - Int(0.003 * sr), x.count - e.at - fftN)
  guard len > fftN / 2 else { return }
  // average spectrum over the event
  var spec = [Float](repeating: 0, count: fftN / 2)
  var s = e.at
  var n: Float = 0
  while s < e.at + len { spec = vDSP.add(spec, magnitudes(x, at: s).map { $0 * $0 }); s += 256; n += 1 }
  let hz = (0..<fftN / 2).map { Float($0) * sr / Float(fftN) }
  let total = spec.reduce(0, +) + 1e-12
  e.centroid = zip(spec, hz).reduce(0) { $0 + $1.0 * $1.1 } / total
  e.low = zip(spec, hz).filter { $0.1 < 400 }.reduce(0) { $0 + $1.0 } / total
  // decay: time from the peak until the 2 ms envelope drops 20 dB below it
  let w = Int(0.002 * sr)
  var env = [Float]()
  var j = e.at
  while j + w < e.at + len { env.append(x[j..<j + w].map(abs).max()!); j += w }
  let pk = env.max() ?? 1, pi = env.firstIndex(of: pk) ?? 0
  let after = env[pi...].firstIndex { $0 < pk * 0.1 } ?? env.count
  e.decay = Float(after - pi) * 2
}

// --- main ---
let args = Array(CommandLine.arguments.dropFirst())
let outDir = args[1], name = args[2]
let files = [args[0]] + args.dropFirst(3)
var all = [(x: [Float], e: Event)]()
var noise = [Int: Float]()  // keyed by recording length, which is unique per file

// background level of a recording: a quiet percentile of 5 ms RMS frames
func noiseFloor(_ x: [Float]) -> Float {
  let w = Int(0.005 * sr)
  var frames = [Float]()
  var i = 0
  while i + w < x.count { frames.append(sqrt(vDSP.meanSquare(Array(x[i..<i + w])))); i += w }
  return frames.sorted()[frames.count / 7]
}
for f in files {
  let x = readWav(f)
  var events = detect(x)
  for k in events.indices { measure(x, &events[k]) }
  all += events.map { (x, $0) }
  noise[x.count] = noiseFloor(x)
}

// split presses from releases: releases are the quiet cluster (2-means on log peak)
let logs = all.map { log($0.e.peak + 1e-6) }
var c1 = logs.min()!, c2 = logs.max()!
for _ in 0..<20 {
  let a = logs.filter { abs($0 - c1) < abs($0 - c2) }, b = logs.filter { abs($0 - c1) >= abs($0 - c2) }
  if !a.isEmpty { c1 = a.reduce(0, +) / Float(a.count) }
  if !b.isEmpty { c2 = b.reduce(0, +) / Float(b.count) }
}
for k in all.indices { all[k].e.isDown = abs(logs[k] - c2) < abs(logs[k] - c1) }

func median(_ v: [Float]) -> Float { v.isEmpty ? 0 : v.sorted()[v.count / 2] }
func rms(_ v: [Float]) -> Float { sqrt(vDSP.meanSquare(v)) }
func pick(_ isDown: Bool, minAfter: Float, count: Int) -> [(x: [Float], e: Event)] {
  let pool = all.filter {
    $0.e.isDown == isDown && $0.e.centroid > 0 && $0.e.peak < 0.98
      && Float($0.e.gapAfter) > minAfter * sr && Float($0.e.gapBefore) > 0.04 * sr
      && $0.e.at > Int(sr) && $0.e.at < $0.x.count - Int(sr)
  }
  guard pool.count >= 2 else { return pool }
  // distance from the board's typical event, in each feature's own spread
  func spread(_ v: [Float]) -> Float { let m = median(v); return median(v.map { abs($0 - m) }) + 1e-6 }
  let cs = pool.map { $0.e.centroid }, ls = pool.map { $0.e.low }, ds = pool.map { $0.e.decay }
  let (mc, ml, md) = (median(cs), median(ls), median(ds))
  let (sc, sl, sd) = (spread(cs), spread(ls), spread(ds))
  let loud = median(pool.map { $0.e.peak })
  return pool.sorted {
    func d(_ e: Event) -> Float {
      let t = abs(e.centroid - mc) / sc + abs(e.low - ml) / sl + abs(e.decay - md) / sd
      return t + 2 * abs(log(e.peak / loud))  // and not unusually loud or soft
    }
    return d($0.e) < d($1.e)
  }.prefix(count).map { $0 }
}

let downs = pick(true, minAfter: 0.13, count: 40)
let ups = pick(false, minAfter: 0.09, count: 40)

func cut(_ x: [Float], _ e: Event, maxLen: Float) -> [Float] {
  let start = max(0, e.at - Int(0.004 * sr))
  let end = min(x.count, e.at + min(Int(maxLen * sr), e.gapAfter - Int(0.004 * sr)))
  var seg = Array(x[start..<end])
  // noise gate: fade each 2 ms block toward silence as it nears the room's background level,
  // and end the clip once it has sat at that level for 24 ms (so the ring-out survives)
  let n = noise[x.count] ?? 0, w = Int(0.002 * sr)
  var g: Float = 1, quiet = 0, stop = seg.count
  var b = 0
  while b < seg.count {
    let blk = Array(seg[b..<min(b + w, seg.count)])
    let level = sqrt(vDSP.meanSquare(blk))
    let target = max(0, min(1, (level - 0.8 * n) / (1.5 * n)))
    g = target > g ? target : 0.7 * g + 0.3 * target  // open fast, close smoothly
    for i in b..<min(b + w, seg.count) { seg[i] *= g }
    quiet = level < 1.3 * n ? quiet + 1 : 0
    if quiet >= 12 && b > Int(0.06 * sr) { stop = b; break }
    b += w
  }
  seg = Array(seg.prefix(stop))
  let fin = Int(0.001 * sr), fout = max(Int(0.015 * sr), seg.count / 4)
  for i in seg.indices {
    let g = min(1, Float(i) / Float(fin), Float(seg.count - i) / Float(fout))
    seg[i] *= g
  }
  return seg
}

// a clean clip has exactly one hit, wherever the loudest point is
func singleHit(_ c: [Float]) -> Bool {
  let w = Int(0.002 * sr)
  var env = [Float]()
  var i = 0
  while i + w <= c.count { env.append(c[i..<i + w].map(abs).max()!); i += w }
  guard let pk = env.max(), pk > 0 else { return false }
  // count separate rises above 30% of the peak, anywhere in the clip (before or after it)
  var hits = 0, below = true
  for v in env {
    if v > 0.3 * pk && below { hits += 1; below = false } else if v < 0.12 * pk { below = true }
  }
  // and the clip has to start with it: loudest point within the first 12 ms
  return hits == 1 && (env.firstIndex(of: pk) ?? 99) * 2 <= 12
}

// keep the candidates (already sorted most-typical first) that survive the gate with a single hit
// and a normal level, then take the best few
func clean(_ picks: [(x: [Float], e: Event)], maxLen: Float, keep: Int) -> [[Float]] {
  let clips = picks.map { cut($0.x, $0.e, maxLen: maxLen) }.filter { $0.count > Int(0.03 * sr) && singleHit($0) }
  guard !clips.isEmpty else { return [] }
  let levels = clips.map { rms(Array($0.prefix(Int(0.06 * sr)))) }
  let typical = median(levels)
  return zip(clips, levels).filter { $0.1 > 0.5 * typical && $0.1 < 2 * typical }.prefix(keep).map { $0.0 }
}

// one gain for the whole board so presses vs releases keep their real balance
let downClips = clean(downs, maxLen: 0.22, keep: 6)
let upClips = clean(ups, maxLen: 0.15, keep: 4)
// loudness is judged mostly on the first ~30 ms, so match boards on that
let ref = median(downClips.map { rms(Array($0.prefix(Int(0.03 * sr)))) })
var gain: Float = 0.16 / max(ref, 1e-6)
let loudest = (downClips + upClips).flatMap { $0 }.map(abs).max() ?? 1
gain = min(gain, 0.95 / loudest)

// even out press-to-press loudness a little (at most ±4 dB) so no single clip jumps out
func level(_ c: [Float], toward target: Float) -> [Float] {
  let r = rms(Array(c.prefix(Int(0.03 * sr)))) * gain
  let adjust = max(0.63, min(1.58, target / max(r, 1e-6)))
  let g = min(gain * adjust, 0.95 / (c.map(abs).max() ?? 1))
  return c.map { $0 * g }
}

try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)
for (k, c) in downClips.enumerated() { writeWav("\(outDir)/\(name)-down-\(k + 1).wav", level(c, toward: 0.13)) }
let upRef = median(upClips.map { rms(Array($0.prefix(Int(0.03 * sr)))) }) * gain
for (k, c) in upClips.enumerated() { writeWav("\(outDir)/\(name)-up-\(k + 1).wav", level(c, toward: upRef)) }

let d = all.filter { $0.e.isDown && $0.e.centroid > 0 }.map { $0.e }
let u = all.filter { !$0.e.isDown && $0.e.centroid > 0 }.map { $0.e }
print(String(format: "%@  events %d (down %d, up %d)  press: centroid %.0f Hz, <400Hz %.0f%%, decay %.0f ms  | release centroid %.0f Hz  | kept %d down, %d up",
  name, all.count, d.count, u.count, median(d.map { $0.centroid }), 100 * median(d.map { $0.low }), median(d.map { $0.decay }),
  u.isEmpty ? 0 : median(u.map { $0.centroid }), downClips.count, upClips.count))
