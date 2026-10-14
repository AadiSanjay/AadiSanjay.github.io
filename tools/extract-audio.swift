import AVFoundation
import AppKit

let dir = CommandLine.arguments[1]
let files = try! FileManager.default.contentsOfDirectory(atPath: dir + "/videos").filter { $0.hasSuffix(".mp4") }.sorted()
for f in files {
    let name = String(f.dropLast(4))
    let asset = AVURLAsset(url: URL(fileURLWithPath: dir + "/videos/" + f))
    let dur = CMTimeGetSeconds(asset.duration)
    // frames
    let gen = AVAssetImageGenerator(asset: asset)
    gen.appliesPreferredTrackTransform = true
    gen.maximumSize = CGSize(width: 640, height: 640)
    for (i, frac) in [0.2, 0.5].enumerated() {
        if let cg = try? gen.copyCGImage(at: CMTime(seconds: dur * frac, preferredTimescale: 600), actualTime: nil) {
            let rep = NSBitmapImageRep(cgImage: cg)
            try! rep.representation(using: .jpeg, properties: [.compressionFactor: 0.7])!.write(to: URL(fileURLWithPath: "\(dir)/frames/\(name)-\(i).jpg"))
        }
    }
    // audio -> mono 16-bit 44.1k wav (raw pcm + header)
    guard let track = asset.tracks(withMediaType: .audio).first else { print(name, dur, "no audio"); continue }
    let reader = try! AVAssetReader(asset: asset)
    let out = AVAssetReaderTrackOutput(track: track, outputSettings: [
        AVFormatIDKey: kAudioFormatLinearPCM, AVSampleRateKey: 44100, AVNumberOfChannelsKey: 1,
        AVLinearPCMBitDepthKey: 16, AVLinearPCMIsFloatKey: false, AVLinearPCMIsBigEndianKey: false, AVLinearPCMIsNonInterleaved: false,
    ])
    reader.add(out); reader.startReading()
    var pcm = Data()
    while let buf = out.copyNextSampleBuffer(), let block = CMSampleBufferGetDataBuffer(buf) {
        var len = 0; var ptr: UnsafeMutablePointer<Int8>?
        CMBlockBufferGetDataPointer(block, atOffset: 0, lengthAtOffsetOut: nil, totalLengthOut: &len, dataPointerOut: &ptr)
        pcm.append(UnsafeBufferPointer(start: ptr, count: len))
    }
    var h = Data()
    func u32(_ v: UInt32) { var x = v.littleEndian; h.append(Data(bytes: &x, count: 4)) }
    func u16(_ v: UInt16) { var x = v.littleEndian; h.append(Data(bytes: &x, count: 2)) }
    h.append("RIFF".data(using: .ascii)!); u32(UInt32(36 + pcm.count)); h.append("WAVEfmt ".data(using: .ascii)!)
    u32(16); u16(1); u16(1); u32(44100); u32(88200); u16(2); u16(16)
    h.append("data".data(using: .ascii)!); u32(UInt32(pcm.count))
    try! (h + pcm).write(to: URL(fileURLWithPath: "\(dir)/audio/\(name).wav"))
    print(name, String(format: "%.1fs", dur), track.naturalSize)
}
