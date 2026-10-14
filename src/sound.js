import { builds } from './builds.js';

// plays a recording of the real board when the build has them, otherwise a synthesized press
export function createSound() {
  let ctx = null;
  let noise = null;
  let enabled = true;
  const files = {}; // build id -> Promise<ArrayBuffer[] | null>, fetched ahead of time
  const decoded = {}; // build id -> AudioBuffer[] | null, once decoded

  // fetching doesn't need an AudioContext, so this can run before the first key press
  function preload(id) {
    if (files[id] || !builds[id].samples.length) return;
    files[id] = Promise.all(
      builds[id].samples.map(async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${url}: ${res.status}`);
        return res.arrayBuffer();
      }),
    ).catch(() => null);
  }

  async function decode(id) {
    decoded[id] = null; // also marks "in progress" so we only decode once
    const raw = await files[id];
    if (!raw) return;
    try {
      decoded[id] = await Promise.all(raw.map((buf) => ctx.decodeAudioData(buf.slice(0))));
    } catch {
      // can't decode (old browser, bad file): stick with the synth
    }
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

    const wobble = 0.95 + Math.random() * 0.1; // no two presses sound identical
    preload(buildId);
    if (files[buildId] && !(buildId in decoded)) decode(buildId);

    const recorded = decoded[buildId];
    if (recorded?.length) {
      const src = ctx.createBufferSource();
      src.buffer = recorded[Math.floor(Math.random() * recorded.length)];
      src.playbackRate.value = wobble;
      src.connect(ctx.destination);
      src.start();
      return;
    }

    const s = builds[buildId].sound;
    const t = ctx.currentTime;
    thump(t, s.thump * wobble);
    burst(t, { type: 'lowpass', freq: s.body * wobble, gain: 0.9, decay: 0.045 });
  }

  return {
    play,
    preload,
    setEnabled(on) {
      enabled = on;
    },
  };
}
