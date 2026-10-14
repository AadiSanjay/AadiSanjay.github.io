import './style.css';
import { content } from './content.js';
import { createSound } from './sound.js';
import { mountKeyboard } from './keyboard.js';

let storage = null;
try {
  storage = window.localStorage;
} catch {
  // blocked storage, prefs just won't stick
}

mountKeyboard(document.querySelector('#desk'), { content, sound: createSound(), storage });
