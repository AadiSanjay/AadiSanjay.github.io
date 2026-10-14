import { content } from './content.js';
import { createSound } from './sound.js';
import { mountKeyboard } from './keyboard.js';
import { renderSections, setupCopy } from './sections.js';
import { setupNav } from './nav.js';

let storage = null;
try {
  storage = window.localStorage;
} catch {
  // blocked storage, prefs just won't stick
}

const desk = document.querySelector('#desk');
const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const sound = createSound();
let keyboard;
renderSections(document, content, {
  // a project card's key button scrolls up and presses that key on the board
  onKey(code) {
    keyboard.tap(code);
    // bring the panel and the board into view together (the panel is above the board on wide
    // screens and below it on phones)
    const top = Math.min(...['[data-display]', '[data-board]'].map((sel) => desk.querySelector(sel).getBoundingClientRect().top));
    const navHeight = document.querySelector('.keynav')?.offsetHeight ?? 0;
    window.scrollTo({ top: window.scrollY + top - navHeight - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
  },
});
keyboard = mountKeyboard(desk, { content, sound, storage });
setupNav(document.querySelector('.keynav'), {
  sections: ['home', 'work', 'experience'].map((id) => document.getElementById(id)),
  onPress: () => sound.play(keyboard.build),
});
for (const button of document.querySelectorAll('[data-copy]')) setupCopy(button);
