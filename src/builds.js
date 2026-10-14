import { getPref, setPref } from './prefs.js';

// boards I've built and sold. colors are eyeballed from listing photos.
// sound: synth params for sound.js until real recordings are in `samples`.
export const builds = {
  'red-samurai': {
    name: 'Red Samurai',
    case: 'Gamakay CK68',
    switches: 'Akko CS Silver',
    keycaps: 'Red Samurai PBT',
    mods: ['tape mod', 'clipped + lubed stabs'],
    sound: { thump: 165, body: 2300 },
    note: 'clacky and high-pitched. the one on my desk.',
    colors: {
      case: '#111112',
      alpha: '#b3222e', alphaSide: '#7a1620', alphaInk: '#f2c94c',
      mod: '#3a3a3c', modSide: '#232325', modInk: '#f2c94c',
      accent: '#e8ca66', accentSide: '#b3963d', accentInk: '#2a2622',
    },
    samples: [],
  },
  'blue-samurai': {
    name: 'Blue Samurai',
    case: 'Gamakay LK67',
    switches: 'lubed linears',
    keycaps: 'Blue Samurai PBT',
    mods: ['lubed switches', 'lubed stabs'],
    sound: { thump: 125, body: 1400 },
    note: 'same idea, cooler colors, a little deeper.',
    colors: {
      case: '#141518',
      alpha: '#1f4f8f', alphaSide: '#12325e', alphaInk: '#e3c065',
      mod: '#2f3238', modSide: '#1d1f23', modInk: '#e3c065',
      accent: '#e3c065', accentSide: '#ad8f3f', accentInk: '#13294a',
    },
    samples: [],
  },
  olivia: {
    name: 'Olivia',
    case: 'Gamakay LK67',
    switches: 'Gateron Milky Yellow',
    keycaps: 'Olivia-style PBT',
    mods: ['SuperLube on switches', 'dielectric grease on stabs'],
    sound: { thump: 95, body: 800 },
    note: 'the deepest, creamiest one I’ve made.',
    colors: {
      case: '#e8e4de',
      alpha: '#f2ede7', alphaSide: '#cdc5bb', alphaInk: '#2b2b2b',
      mod: '#e6b2ac', modSide: '#c08a84', modInk: '#2b2b2b',
      accent: '#2b2b2b', accentSide: '#121212', accentInk: '#e6b2ac',
    },
    samples: [],
  },
  matcha: {
    name: 'Matcha',
    case: 'Gamakay LK67',
    switches: 'lubed linears',
    keycaps: 'Matcha PBT',
    mods: ['lubed switches', 'lubed stabs'],
    sound: { thump: 110, body: 1050 },
    note: 'thocky, and very green.',
    colors: {
      case: '#e9e6df',
      alpha: '#ece6d3', alphaSide: '#c7bfa5', alphaInk: '#4a5a33',
      mod: '#9bb07a', modSide: '#728657', modInk: '#26301b',
      accent: '#4f6b3a', accentSide: '#354a27', accentInk: '#ece6d3',
    },
    samples: [],
  },
  'wob-white': {
    name: 'White WoB',
    case: 'Gamakay LK67',
    switches: 'Akko CS Silver, Krytox 205g0',
    keycaps: 'WoB doubleshot PBT',
    mods: ['tempest tape mod', 'neoprene foam', 'lubed stabs'],
    sound: { thump: 140, body: 1700 },
    note: 'tape mod makes it poppy.',
    colors: {
      case: '#161616',
      alpha: '#f4f4f1', alphaSide: '#cbcbc6', alphaInk: '#1a1a1a',
      mod: '#f4f4f1', modSide: '#cbcbc6', modInk: '#1a1a1a',
      accent: '#dcdcd7', accentSide: '#b2b2ac', accentInk: '#1a1a1a',
    },
    samples: [],
  },
};

export const buildIds = Object.keys(builds);
export const DEFAULT_BUILD = 'red-samurai';

export function loadBuild(storage) {
  const id = getPref(storage, 'build', DEFAULT_BUILD);
  return Object.hasOwn(builds, id) ? id : DEFAULT_BUILD;
}

export function saveBuild(storage, id) {
  setPref(storage, 'build', id);
}
