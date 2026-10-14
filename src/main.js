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
renderSections(desk, content);
mountKeyboard(desk, { content, sound: createSound(), storage });
for (const button of document.querySelectorAll('[data-copy]')) setupCopy(button);
