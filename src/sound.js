import { switches } from './switches.js';

// synthesized for now. TODO: swap for recordings of my actual board.
export function createSound() {
  let ctx = null;
  let noise = null;
  let enabled = true;

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

  function play(switchId) {
    if (!enabled) return;
    if (!ctx && !setup()) return;
    if (ctx.state === 'suspended') ctx.resume();

    const s = switches[switchId].sound;
    const wobble = 0.94 + Math.random() * 0.12; // no two presses sound identical
    let t = ctx.currentTime;

    if (s.bump) {
      burst(t, { type: 'lowpass', freq: 600, gain: 0.25, decay: 0.02 });
      t += 0.014;
    }
    if (s.click) burst(t, { type: 'bandpass', freq: 4200 * wobble, q: 6, gain: 1.4, decay: 0.012 });
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
