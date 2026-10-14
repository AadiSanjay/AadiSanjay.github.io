// @vitest-environment jsdom
// the real page (index.html + style.css + content.js) mounted in jsdom and scanned with axe-core
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import axe from 'axe-core';
import { content } from '../src/content.js';
import { buildIds } from '../src/builds.js';
import { mountKeyboard } from '../src/keyboard.js';
import { renderSections } from '../src/sections.js';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('src/style.css', 'utf8');

const options = {
  rules: {
    // jsdom doesn't render, so axe can't work out real foreground/background colors here.
    // contrast is checked in a real browser instead (see README).
    'color-contrast': { enabled: false },
    // off by default in axe because it's "experimental"; it's the one that caught the keys
    // whose aria-label didn't contain their visible legend
    'label-content-name-mismatch': { enabled: true },
  },
};

async function violations() {
  const { violations, incomplete } = await axe.run(document, options);
  // a rule that crashed would otherwise pass silently
  const crashed = incomplete.filter((r) => r.error).map((r) => `${r.id} crashed: ${r.error.message}`);
  return [...crashed, ...violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)];
}

let kb;
beforeEach(() => {
  // axe draws text on a canvas to tell icon fonts from real text. jsdom has no canvas, and without
  // one axe gives up on the name-mismatch rule, so hand it a canvas where text is always plain text
  // jsdom has no layout either, so nothing is "at" a point; axe just needs the function to exist
  document.elementFromPoint ??= () => null;
  const canvas = { width: 0, height: 0 };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    canvas,
    measureText: (text) => ({ width: text.length * 20 }),
    fillText() {},
    clearRect() {},
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.ceil(w) * Math.ceil(h) * 4).fill(1) }),
  });
  const page = new DOMParser().parseFromString(html, 'text/html');
  document.documentElement.lang = page.documentElement.lang;
  document.head.innerHTML = `<title>${page.title}</title><style>${css}</style>`;
  document.body.innerHTML = page.body.innerHTML;
  const desk = document.querySelector('#desk');
  renderSections(desk, content, { onKey: (code) => kb.tap(code) });
  kb = mountKeyboard(desk, {
    content,
    sound: { play: vi.fn(), setEnabled: vi.fn(), preload: vi.fn() },
    storage: null,
  });
});

afterEach(() => kb.destroy());

describe('axe-core finds no violations (color contrast is checked separately)', () => {
  for (const id of buildIds) {
    it(`${id}: base layer, fn layer, and with a project panel open`, async () => {
      kb.setBuild(id);
      expect(await violations()).toEqual([]);

      kb.tap('Fn'); // latches the fn layer: the caps show their second legends
      expect(document.querySelector('[data-board]').dataset.layer).toBe('fn');
      expect(await violations()).toEqual([]);
      kb.tap('Fn');

      kb.tap('KeyF');
      expect(document.querySelector('[data-display]').dataset.showing).toBe('focusticker');
      expect(await violations()).toEqual([]);
    });
  }
});
