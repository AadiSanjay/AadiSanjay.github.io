import { getPref, setPref } from './prefs.js';

// sound: params for the synth in sound.js. travel/ease: how far + how the cap moves.
export const switches = {
  linear: {
    label: 'Linear',
    note: 'smooth and deep',
    stem: '#c8323c',
    travel: '4px',
    ease: 'cubic-bezier(.3, 0, .2, 1) 70ms',
    sound: { thump: 105, body: 900, bump: false, click: false },
  },
  tactile: {
    label: 'Tactile',
    note: 'a bump halfway down',
    stem: '#8a5a32',
    travel: '4px',
    ease: 'cubic-bezier(.5, -0.6, .4, 1.6) 110ms',
    sound: { thump: 130, body: 1400, bump: true, click: false },
  },
  clicky: {
    label: 'Clicky',
    note: 'loud. sorry roommates',
    stem: '#3b6fd4',
    travel: '3px',
    ease: 'steps(2, jump-end) 60ms',
    sound: { thump: 150, body: 1800, bump: false, click: true },
  },
};

export const DEFAULT_SWITCH = 'linear';

export function loadSwitch(storage) {
  const id = getPref(storage, 'switch', DEFAULT_SWITCH);
  return Object.hasOwn(switches, id) ? id : DEFAULT_SWITCH;
}

export function saveSwitch(storage, id) {
  setPref(storage, 'switch', id);
}
