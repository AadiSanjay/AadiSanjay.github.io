import { builds } from './builds.js';

// plays a recording of the real board when the build has them, otherwise a synthesized press
export function createSound() {
  let ctx = null;
  let noise = null;
  let enabled = true;
  const files = {}; // 'build:down' -> Promise<ArrayBuffer[] | null>, fetched ahead of time
  const decoded = {}; // 'build:down' -> AudioBuffer[] | null, once decoded
  const last = {}; // 'build:down' -> index of the clip played last

  // fetching doesn't need an AudioContext, so this can run before the first key press
  function preload(id) {
    for (const kind of ['down', 'up']) {
      const key = `${id}:${kind}`;
      const urls = builds[id].samples[kind];
      if (files[key] || !urls.length) continue;
      files[key] = Promise.all(
        urls.map(async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`${url}: ${res.status}`);
          return res.arrayBuffer();
        }),
      ).catch(() => null);
      decode(key); // decode right away so even the first key press uses the real recording
    }
  }

  // an offline context can decode before any user gesture (autoplay rules only apply to playback),
  // and the AudioBuffers it makes play fine in the real context later
  let decoder = null;
  async function decode(key) {
    decoded[key] = null; // also marks "in progress" so we only decode once
    const raw = await files[key];
    if (!raw) return;
    try {
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      decoder ??= new OAC(1, 1, 44100);
      decoded[key] = await Promise.all(raw.map((buf) => decoder.decodeAudioData(buf)));
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

  // kind: 'down' when a key is pressed, 'up' when it's released
  function play(buildId, kind = 'down') {
    if (!enabled) return;
    if (!ctx && !setup()) return;
    if (ctx.state === 'suspended') ctx.resume();

    const key = `${buildId}:${kind}`;
    preload(buildId);

    const recorded = decoded[key];
    if (recorded?.length) {
      // pick a different clip than last time, and vary it only slightly so the board keeps its character
      let i = Math.floor(Math.random() * recorded.length);
      if (recorded.length > 1 && i === last[key]) i = (i + 1) % recorded.length;
      last[key] = i;
      const src = ctx.createBufferSource();
      src.buffer = recorded[i];
      src.playbackRate.value = 0.985 + Math.random() * 0.03;
      const amp = ctx.createGain();
      amp.gain.value = 0.9 + Math.random() * 0.2;
      src.connect(amp).connect(ctx.destination);
      src.start();
      return;
    }
    if (kind === 'up') {
      // no clean release recordings: a softer, slightly higher copy of the board's own press
      const presses = decoded[`${buildId}:down`];
      if (!presses?.length) return; // the synth only does presses
      const src = ctx.createBufferSource();
      src.buffer = presses[Math.floor(Math.random() * presses.length)];
      src.playbackRate.value = 1.2 + Math.random() * 0.05;
      const amp = ctx.createGain();
      amp.gain.value = 0.3;
      src.connect(amp).connect(ctx.destination);
      src.start();
      return;
    }

    const wobble = 0.95 + Math.random() * 0.1;

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
