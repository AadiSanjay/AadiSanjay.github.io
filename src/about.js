import { content } from './content.js';
import { createSound } from './sound.js';
import { loadBuild } from './builds.js';
import { getPref } from './prefs.js';
import { renderRoles, renderAbout, setupCopy } from './sections.js';
import { setupNav } from './nav.js';

let storage = null;
try {
  storage = window.localStorage;
} catch {
  // blocked storage, prefs just won't stick
}

renderRoles(document, content);
renderAbout(document, content);
for (const button of document.querySelectorAll('[data-copy]')) setupCopy(button);

// the nav caps click like keys here too, in whichever build you last picked, unless sound is off
const sound = createSound();
sound.setEnabled(getPref(storage, 'sound', 'on') === 'on');
setupNav(document.querySelector('.keynav'), { onPress: () => sound.play(loadBuild(storage)) });
