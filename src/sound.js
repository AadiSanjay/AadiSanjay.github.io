import { builds } from './builds.js';

// plays recordings of my boards when a build has them, otherwise synthesizes a press
export function createSound() {
  let ctx = null;
  let noise = null;
  let enabled = true;
  const recordings = {}; // build id -> AudioBuffer[] once loaded, null if loading failed

  async function load(id) {
    const urls = builds[id].samples ?? [];
    if (!urls.length) return;
    recordings[id] = [];
    try {
      const files = await Promise.all(
        urls.map(async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`${url}: ${res.status}`);
          return ctx.decodeAudioData(await res.arrayBuffer());
        }),
      );
      recordings[id] = files;
    } catch {
      recordings[id] = null; // fall back to the synth for good
    }
  }

  function playRecording(buffers, wobble) {
    const src = ctx.createBufferSource();
    src.buffer = buffers[Math.floor(Math.random() * buffers.length)];
    src.playbackRate.value = wobble;
    src.connect(ctx.destination);
    src.start();
  }

  function setup() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return true;
  }

  function burst(at, { type, freq, q = 1, gain, decay }) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, at);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    src.connect(filter).connect(amp).connect(ctx.destination);
    src.start(at);
    src.stop(at + decay + 0.01);
  }

  function thump(at, freq) {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(freq, at);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.55, at + 0.06);
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.5, at);
    amp.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
    osc.connect(amp).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.08);
  }

  function play(buildId) {
    if (!enabled) return;
    if (!ctx && !setup()) return;
    if (ctx.state === 'suspended') ctx.resume();

    const wobble = 0.94 + Math.random() * 0.12; // no two presses sound identical
    if (!(buildId in recordings)) load(buildId);
    if (recordings[buildId]?.length) return playRecording(recordings[buildId], wobble);

    const s = builds[buildId].sound;
    const t = ctx.currentTime;

    thump(t, s.thump * wobble);
    burst(t, { type: 'lowpass', freq: s.body * wobble, gain: 0.9, decay: 0.045 });
  }

  return {
    play,
    setEnabled(on) {
      enabled = on;
    },
  };
}
