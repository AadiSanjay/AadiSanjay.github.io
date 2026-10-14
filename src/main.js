import { content } from './content.js';
import { createSound } from './sound.js';
import { mountKeyboard } from './keyboard.js';
import { renderSections, setupCopy } from './sections.js';

let storage = null;
try {
  storage = window.localStorage;
} catch {
  // blocked storage, prefs just won't stick
}

const desk = document.querySelector('#desk');
const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let keyboard;
renderSections(desk, content, {
  // a project card's key button scrolls up and presses that key on the board
  onKey(code) {
    keyboard.tap(code);
    // bring the card and the board into view together (the card is above the board on wide
    // screens and below it on phones)
    const top = Math.min(...['[data-display]', '[data-board]'].map((sel) => desk.querySelector(sel).getBoundingClientRect().top));
    window.scrollTo({ top: window.scrollY + top - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
  },
});
keyboard = mountKeyboard(desk, { content, sound: createSound(), storage });
for (const button of document.querySelectorAll('[data-copy]')) setupCopy(button);
