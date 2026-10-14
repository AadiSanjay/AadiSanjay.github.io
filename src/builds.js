import { getPref, setPref } from './prefs.js';

const base = import.meta.env?.BASE_URL ?? '/';
const SHOP = 'https://www.etsy.com/shop/PNWKeyboards';

// clips cut from my own sound-test videos, one key press each
const clips = (id, n) => Array.from({ length: n }, (_, i) => `${base}sounds/${id}/${i + 1}.m4a`);

// boards I've built and sold. colors are picked from photos and videos of each one.
// `sound` is the synth fallback for builds I don't have a clean recording of.
export const builds = {
  'red-samurai': {
    name: 'Red Samurai',
    case: 'Gamakay CK68',
    switches: 'Akko CS Silver',
    keycaps: 'Red Samurai PBT',
    mods: ['tape mod', 'clipped + lubed stabs'],
    note: 'Clacky and a little high-pitched. This is the one on my desk.',
    link: SHOP,
    sound: { thump: 165, body: 2300 },
    samples: clips('red-samurai', 4),
    colors: {
      case: '#111112',
      alpha: '#b3222e', alphaSide: '#7a1620', alphaInk: '#f2c94c',
      mod: '#3a3a3c', modSide: '#232325', modInk: '#f2c94c',
      accent: '#e8ca66', accentSide: '#b3963d', accentInk: '#2a2622',
    },
  },
  'rose-red': {
    name: 'Rose Red',
    case: 'Gamakay LK67',
    switches: 'Akko Rose Red',
    keycaps: 'slate PBT',
    mods: ['thocky mod', 'lubed stabs'],
    note: 'The last board I built before closing the shop.',
    link: 'https://www.etsy.com/listing/1902725065/custom-mechanical-keyboard-gamakay-lk67',
    sound: { thump: 110, body: 1100 },
    samples: clips('rose-red', 4),
    colors: {
      case: '#ebeae5',
      alpha: '#5b6676', alphaSide: '#3d4553', alphaInk: '#f1f0ec',
      mod: '#3a414c', modSide: '#262b33', modInk: '#f1f0ec',
      accent: '#f1f0ec', accentSide: '#c8c7c1', accentInk: '#3a414c',
    },
  },
  'blue-samurai': {
    name: 'Blue Samurai',
    case: 'Gamakay LK67',
    switches: 'lubed linears',
    keycaps: 'Blue Samurai PBT',
    mods: ['lubed switches', 'lubed stabs', 'RGB'],
    note: 'Deep blue with gold accents. Deeper than the red one.',
    link: SHOP,
    sound: { thump: 125, body: 1400 },
    samples: clips('blue-samurai', 6),
    colors: {
      case: '#121316',
      alpha: '#23558c', alphaSide: '#153862', alphaInk: '#e3c065',
      mod: '#2c3647', modSide: '#1b2230', modInk: '#e3c065',
      accent: '#e3c065', accentSide: '#ad8f3f', accentInk: '#13294a',
    },
  },
  white: {
    name: 'White',
    case: 'Gamakay LK67',
    switches: 'Akko CS Silver, Krytox 205g0',
    keycaps: 'white PBT with blue accents',
    mods: ['tempest tape mod', 'neoprene foam', 'lubed stabs'],
    note: 'The tape mod makes it poppy.',
    link: SHOP,
    sound: { thump: 140, body: 1700 },
    samples: clips('white', 5),
    colors: {
      case: '#eceae5',
      alpha: '#f6f5f2', alphaSide: '#d0cfc9', alphaInk: '#3b3b3b',
      mod: '#ebeae6', modSide: '#c6c5bf', modInk: '#3b3b3b',
      accent: '#a9cfe3', accentSide: '#7ea7bd', accentInk: '#22323c',
    },
  },
  olivia: {
    name: 'Olivia',
    case: 'Gamakay LK67',
    switches: 'Gateron Milky Yellow',
    keycaps: 'Olivia-style PBT',
    mods: ['SuperLube on switches', 'dielectric grease on stabs'],
    note: 'The deepest, creamiest one I’ve made.',
    link: SHOP,
    sound: { thump: 95, body: 800 },
    samples: [],
    colors: {
      case: '#e8e4de',
      alpha: '#f2ede7', alphaSide: '#cdc5bb', alphaInk: '#2b2b2b',
      mod: '#e6b2ac', modSide: '#c08a84', modInk: '#2b2b2b',
      accent: '#2b2b2b', accentSide: '#121212', accentInk: '#e6b2ac',
    },
  },
  matcha: {
    name: 'Matcha',
    case: 'Gamakay LK67',
    switches: 'lubed linears',
    keycaps: 'Matcha PBT',
    mods: ['lubed switches', 'lubed stabs'],
    note: 'Thocky, and very green.',
    link: SHOP,
    sound: { thump: 110, body: 1050 },
    samples: [],
    colors: {
      case: '#e9e6df',
      alpha: '#ece6d3', alphaSide: '#c7bfa5', alphaInk: '#4a5a33',
      mod: '#9bb07a', modSide: '#728657', modInk: '#26301b',
      accent: '#4f6b3a', accentSide: '#354a27', accentInk: '#ece6d3',
    },
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
