// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mountKeyboard, codeOf } from '../src/keyboard.js';
import { buildIds } from '../src/builds.js';

const content = {
  projects: [
    {
      id: 'sched',
      key: 'KeyS',
      short: 'sched',
      title: 'Scheduler',
      status: 'shipped',
      body: ['plans things', 'second paragraph'],
      stack: ['JS', 'CSS'],
      links: [
        { label: 'GitHub', href: 'https://github.com/x/y' },
        { label: 'Email', href: 'mailto:a@b.c' },
      ],
    },
    { id: 'bot', key: 'KeyB', short: 'bot', title: 'Robot', body: '<img src=x>', links: [] },
  ],
  sections: {
    about: { title: 'About me', body: 'hi', links: [{ label: 'Read more', href: '/about.html' }] },
    contact: { title: 'Contact', body: '', links: [] },
    experience: { title: 'Experience', body: ['Dev at Acme (2026)'], links: [] },
    education: { title: 'Education', body: ['B.S. CS', 'Somewhere U · 2029'], links: [] },
    resume: { title: 'Resume', body: '', links: [] },
  },
};

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), data };
}

let root, sound, storage, kb;

function mount() {
  kb = mountKeyboard(root, { content, sound, storage });
  return kb;
}

const press = (code, opts = {}) => {
  const e = new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...opts });
  document.body.dispatchEvent(e);
  return e;
};
const release = (code) => document.body.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
const cap = (code) => root.querySelector(`.cap[data-code="${code}"]`);
const display = () => root.querySelector('[data-display]');
const showing = () => display().dataset.showing ?? '';

beforeEach(() => {
  document.body.innerHTML = `
    <main id="desk">
      <div data-display><p class="idle">type a key</p><p class="echo"></p></div>
      <div data-board></div>
      <ul data-hints></ul>
      <p><strong data-build-name></strong> <span data-build-spec></span></p>
      <fieldset data-builds></fieldset>
      <button data-sound></button>
      <button data-keys></button>
    </main>`;
  root = document.querySelector('#desk');
  sound = { play: vi.fn(), setEnabled: vi.fn(), preload: vi.fn() };
  storage = memoryStorage();
});

afterEach(() => kb?.destroy());

describe('typing on the keyboard', () => {
  it('opens a project when its key is pressed', () => {
    mount();
    const e = press('KeyS');
    expect(showing()).toBe('sched');
    expect(display().querySelector('h2').textContent).toBe('Scheduler');
    expect(e.defaultPrevented).toBe(true);
    expect(sound.play).toHaveBeenCalledWith('red-samurai');
  });

  it('shows the cap going down and coming back up, with a press and a release sound', () => {
    mount();
    press('KeyS');
    expect(cap('KeyS').classList.contains('down')).toBe(true);
    expect(sound.play).toHaveBeenLastCalledWith('red-samurai');
    release('KeyS');
    expect(cap('KeyS').classList.contains('down')).toBe(false);
    expect(sound.play).toHaveBeenLastCalledWith('red-samurai', 'up');
  });

  it('a keyup for a key we never saw go down makes no release sound', () => {
    mount();
    release('KeyS');
    expect(sound.play).not.toHaveBeenCalled();
  });

  it('a key that does nothing (tab) wiggles, plays, and leaves the page alone', () => {
    mount();
    const e = press('Tab', { key: 'Tab' });
    expect(cap('Tab').classList.contains('nope')).toBe(true);
    expect(e.defaultPrevented).toBe(false); // tab still tabs
    expect(sound.play).toHaveBeenCalledTimes(1);
  });

  it('a key that types a letter does not wiggle like an error', () => {
    mount();
    press('KeyQ', { key: 'q' });
    expect(cap('KeyQ').classList.contains('nope')).toBe(false);
  });

  it('typing a letter while a project card is open goes back to typing', () => {
    mount();
    press('KeyS');
    press('KeyQ', { key: 'q' });
    expect(showing()).toBe('');
    expect(display().querySelector('.echo').textContent).toBe('q');
  });

  it('every card has a close button that goes back to the idle screen', () => {
    mount();
    press('KeyS');
    const close = display().querySelector('button.close');
    expect(close.getAttribute('aria-label')).toBe('Close');
    close.click();
    expect(showing()).toBe('');
    expect(display().querySelector('.idle')).not.toBeNull();
  });

  it('closing a card with the button gives focus back to the key that opened it', () => {
    mount();
    cap('KeyS').focus();
    cap('KeyS').click();
    display().querySelector('button.close').click();
    expect(document.activeElement).toBe(cap('KeyS'));
  });

  it('esc from a link inside a card also gives focus back', () => {
    mount();
    cap('KeyS').focus();
    cap('KeyS').click();
    const link = display().querySelector('a.btn');
    link.focus();
    link.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }));
    expect(showing()).toBe('');
    expect(document.activeElement).toBe(cap('KeyS'));
  });

  it('esc goes back to the idle screen', () => {
    mount();
    press('KeyS');
    press('Escape');
    expect(showing()).toBe('');
    expect(display().querySelector('.idle')).not.toBeNull();
  });

  it('holding a key does not machine-gun the sound', () => {
    mount();
    press('KeyS');
    press('KeyS', { repeat: true });
    press('KeyS', { repeat: true });
    expect(sound.play).toHaveBeenCalledTimes(1);
  });

  it('holding a letter or backspace repeats in the typing line, like a real keyboard', () => {
    mount();
    press('KeyQ', { key: 'q' });
    press('KeyQ', { key: 'q', repeat: true });
    press('KeyQ', { key: 'q', repeat: true });
    expect(display().querySelector('.echo').textContent).toBe('qqq');
    press('Backspace', { key: 'Backspace' });
    press('Backspace', { key: 'Backspace', repeat: true });
    expect(display().querySelector('.echo').textContent).toBe('q');
    expect(sound.play).toHaveBeenCalledTimes(2); // one per real press, none for repeats
  });

  it('ignores browser shortcuts like cmd+s and ctrl+b', () => {
    mount();
    const e = press('KeyS', { metaKey: true });
    press('KeyB', { ctrlKey: true });
    expect(showing()).toBe('');
    expect(e.defaultPrevented).toBe(false);
    expect(sound.play).not.toHaveBeenCalled();
  });

  it('ignores keys typed into form fields', () => {
    mount();
    const input = document.createElement('input');
    root.append(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS', bubbles: true }));
    expect(showing()).toBe('');
  });

  it('keys we do not draw (F-keys etc) are ignored', () => {
    mount();
    expect(() => press('F5')).not.toThrow();
    expect(sound.play).not.toHaveBeenCalled();
  });

  it('renders project text as text, never html', () => {
    mount();
    press('KeyB');
    expect(display().querySelector('img')).toBeNull();
    expect(display().querySelector('.body').textContent).toBe('<img src=x>');
  });

  // changed on purpose: the screenshot moved to the project card below, so the panel stays short
  it('panels leave the screenshot to the project card below', () => {
    content.projects[1].image = { src: 'bot.jpg', alt: 'the robot' };
    mount();
    press('KeyB');
    expect(display().querySelector('img')).toBeNull();
    delete content.projects[1].image;
  });

  it('the card shows every paragraph of the project', () => {
    mount();
    press('KeyS');
    expect(display().querySelectorAll('.body p')).toHaveLength(2);
  });

  // the robot again, but with a how-it-works sentence and a kind
  const withRobotShop = () => {
    const robot = { ...content.projects[1], how: 'Gears.', kind: 'robot shop' };
    kb = mountKeyboard(root, { content: { ...content, projects: [content.projects[0], robot] }, sound, storage });
  };

  // changed on purpose: the how-it-works sentence moved to the project card, so panels stay short
  it('a project panel shows what it is, and leaves how it works to the card below', () => {
    withRobotShop();
    press('KeyB');
    const paras = [...display().querySelectorAll('.body p')].map((p) => p.textContent);
    expect(paras).toEqual(['<img src=x>']);
  });

  it('a project that isn\'t software says what it is in the kicker', () => {
    withRobotShop();
    press('KeyB');
    expect(display().querySelector('.kicker').textContent).toBe('[B] robot shop');
    press('KeyS');
    expect(display().querySelector('.kicker').textContent).toBe('[S] project');
  });

  it('project cards lead with what it does: no tech-stack chips, links as buttons', () => {
    mount();
    press('KeyS');
    expect(display().querySelectorAll('.stack li')).toHaveLength(0);
    const [gh, mail] = display().querySelectorAll('a.btn');
    expect(gh.target).toBe('_blank');
    expect(gh.rel).toBe('noopener');
    expect(mail.target).toBe(''); // mailto shouldn't open a blank tab
  });
});

describe('panel focus', () => {
  const heading = () => display().querySelector('h2');

  it('opening a panel with a button (a cap clicked or pressed with enter) moves focus to its heading', () => {
    mount();
    cap('KeyS').focus();
    cap('KeyS').click();
    expect(heading().tabIndex).toBe(-1);
    expect(document.activeElement).toBe(heading());
  });

  it('the same goes for an outside button that taps a key, and closing hands focus back to it', () => {
    mount();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    kb.tap('KeyS');
    expect(document.activeElement).toBe(heading());
    press('Escape');
    expect(document.activeElement).toBe(outside);
  });

  it('opening a panel by typing a letter leaves focus alone', () => {
    mount();
    root.querySelector('[data-sound]').focus();
    press('KeyS');
    expect(showing()).toBe('sched');
    expect(document.activeElement).toBe(root.querySelector('[data-sound]'));
    document.activeElement.blur();
    press('KeyB');
    expect(showing()).toBe('bot');
    expect(document.activeElement).toBe(document.body); // nothing is focused mid-typing
  });

  it('typing on caps (keys that open nothing) never moves focus', () => {
    mount();
    cap('KeyX').focus();
    cap('KeyX').click();
    expect(document.activeElement).toBe(cap('KeyX'));
  });

  it('scrolls the panel into view smoothly, or instantly with reduced motion', () => {
    const scrolls = [];
    Element.prototype.scrollIntoView = function (opts) {
      scrolls.push(opts.behavior);
    };
    try {
      kb = mountKeyboard(root, { content, sound, storage, win: Object.assign(Object.create(window), {
        addEventListener: window.addEventListener.bind(window),
        removeEventListener: window.removeEventListener.bind(window),
        setTimeout: window.setTimeout.bind(window),
        matchMedia: (q) => ({ matches: q.includes('reduce') }),
      }) });
      cap('KeyS').click();
      expect(scrolls).toEqual(['auto']);
    } finally {
      delete Element.prototype.scrollIntoView;
    }
  });
});

describe('codeOf', () => {
  it('uses event.code when there is one', () => {
    expect(codeOf({ code: 'KeyS', key: 'Σ' })).toBe('KeyS');
  });

  it('falls back to event.key when code is empty', () => {
    expect(codeOf({ code: '', key: 'f' })).toBe('KeyF');
    expect(codeOf({ code: '', key: 'F' })).toBe('KeyF');
    expect(codeOf({ code: '', key: '3' })).toBe('Digit3');
    expect(codeOf({ code: '', key: 'Escape' })).toBe('Escape');
    expect(codeOf({ code: '', key: ' ' })).toBe('Space');
    expect(codeOf({ code: '', key: 'Dead' })).toBe('');
  });

  it('a key event with no code still works', () => {
    mount();
    press('', { key: 'f' });
    expect(showing()).toBe('');
    press('', { key: 's' });
    expect(showing()).toBe('sched');
    press('', { key: 'Escape' });
    expect(showing()).toBe('');
  });
});

describe('typing on dead keys', () => {
  const echo = () => display().querySelector('.echo').textContent;

  it('echoes what you type on the idle screen, and backspace works', () => {
    mount();
    for (const key of 'hello') press(`Key${key.toUpperCase()}`, { key });
    press('Backspace', { key: 'Backspace' });
    expect(echo()).toBe('hell');
  });

  it('typing "hire" opens contact', () => {
    mount();
    for (const key of 'hire') press(`Key${key.toUpperCase()}`, { key });
    expect(showing()).toBe('contact');
  });

  it('esc clears the line', () => {
    mount();
    press('KeyQ', { key: 'q' });
    press('Escape', { key: 'Escape' });
    expect(echo()).toBe('');
  });

  it('keys that type nothing (tab, ctrl) don\'t close an open card', () => {
    mount();
    press('KeyS');
    press('Tab', { key: 'Tab' });
    expect(showing()).toBe('sched');
  });

  it('space types a space instead of scrolling while the board is on screen', () => {
    mount();
    press('KeyQ', { key: 'q' });
    const e = press('Space', { key: ' ' });
    expect(e.defaultPrevented).toBe(true);
    expect(echo()).toBe('q ');
  });

  it('space types even when a cap has focus, instead of re-pressing that cap', () => {
    mount();
    cap('KeyQ').focus();
    const e = new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true, cancelable: true });
    cap('KeyQ').dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true); // no native click on the focused cap
    expect(echo()).toBe(' ');
  });

  it('enter on a focused cap is left to the browser, so it activates that cap', () => {
    mount();
    const e = new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true, cancelable: true });
    cap('KeyS').dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(sound.play).not.toHaveBeenCalled();
  });

  it('clicking a cap with the mouse does not focus it', () => {
    mount();
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    cap('KeyS').dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
  });

  it('clicking caps types their character, a space for the spacebar, and nothing for Tab/Ctrl', () => {
    mount();
    for (const code of ['KeyQ', 'Space', 'Digit1', 'Tab', 'ControlLeft', 'Enter', 'Comma']) cap(code).click();
    expect(echo()).toBe('q 1,');
  });

  it('only keeps the last 32 characters', () => {
    mount();
    for (let i = 0; i < 40; i++) press('KeyQ', { key: 'q' });
    expect(echo()).toHaveLength(32);
  });
});

describe('the fn layer', () => {
  it('holding shift switches layers, letting go switches back', () => {
    mount();
    press('ShiftLeft', { shiftKey: true });
    expect(kb.layer).toBe('fn');
    press('KeyA', { shiftKey: true });
    expect(showing()).toBe('about');
    release('ShiftLeft');
    expect(kb.layer).toBe('base');
  });

  it('uses the shift flag on the event even if the shift keydown was missed', () => {
    mount();
    press('KeyU', { shiftKey: true });
    expect(showing()).toBe('education');
    press('KeyQ');
    expect(kb.layer).toBe('base');
  });

  it('an inferred shift layer ends on that key\'s keyup, even with no shift events at all', () => {
    mount();
    press('Digit3', { shiftKey: true });
    expect(kb.layer).toBe('fn');
    document.body.dispatchEvent(new KeyboardEvent('keyup', { code: 'Digit3', shiftKey: true, bubbles: true }));
    expect(kb.layer).toBe('base');
  });

  it('a real held shift stays on across other keys\' keyups', () => {
    mount();
    press('ShiftLeft', { shiftKey: true });
    press('Digit3', { shiftKey: true });
    release('Digit3');
    expect(kb.layer).toBe('fn');
    release('ShiftLeft');
    expect(kb.layer).toBe('base');
  });

  it('project keys still work while shift is held', () => {
    mount();
    press('ShiftRight', { shiftKey: true });
    press('KeyS', { shiftKey: true });
    expect(showing()).toBe('sched');
  });

  it('losing focus mid-hold does not leave shift stuck', () => {
    mount();
    press('ShiftLeft', { shiftKey: true });
    press('KeyS', { shiftKey: true });
    window.dispatchEvent(new Event('blur'));
    expect(kb.layer).toBe('base');
    expect(root.querySelectorAll('.cap.down')).toHaveLength(0);
  });

  it('shift+u shows education, and the card names the exact combo', () => {
    mount();
    press('ShiftLeft', { shiftKey: true });
    press('KeyU', { shiftKey: true });
    expect(display().querySelector('h2').textContent).toBe('Education');
    expect(display().querySelector('.kicker').textContent).toBe('[shift + U] education');
    expect(display().textContent).toContain('2029');
  });

  it('shift+e shows experience', () => {
    mount();
    press('ShiftLeft', { shiftKey: true });
    press('KeyE', { shiftKey: true });
    expect(display().querySelector('.body').textContent).toBe('Dev at Acme (2026)');
  });

  it('a card opened through fn says fn, not shift', () => {
    mount();
    cap('Fn').click();
    cap('KeyA').click();
    expect(display().querySelector('.kicker').textContent).toBe('[fn + A] about');
  });

  it('clicking fn applies to the next key only', () => {
    mount();
    cap('Fn').click();
    expect(kb.layer).toBe('fn');
    expect(cap('Fn').getAttribute('aria-pressed')).toBe('true');
    cap('KeyC').click();
    expect(showing()).toBe('contact');
    expect(kb.layer).toBe('base');
  });
});

describe('typing works on every build', () => {
  const typeWord = (w) => {
    for (const ch of w) {
      press(ch === ' ' ? 'Space' : `Key${ch.toUpperCase()}`, { key: ch });
      release(ch === ' ' ? 'Space' : `Key${ch.toUpperCase()}`);
    }
  };
  const line = () => display().querySelector('.echo')?.textContent;

  for (const id of buildIds) {
    it(`${id}: picked from the picker, typing shows on its card and plays its sound`, () => {
      mount();
      root.querySelector(`input[value="${id}"]`).click();
      typeWord('thock it');
      expect(line()).toBe('thock it');
      expect(sound.play).toHaveBeenCalledWith(id);
      expect(sound.play).toHaveBeenCalledWith(id, 'up');
    });

    it(`${id}: picked with shift + number, typing still works`, () => {
      mount();
      const n = buildIds.indexOf(id) + 1;
      press('ShiftLeft', { shiftKey: true });
      press(`Digit${n}`, { shiftKey: true, key: String(n) });
      release(`Digit${n}`);
      release('ShiftLeft');
      expect(root.dataset.build).toBe(id);
      typeWord('yo');
      expect(line()).toBe('yo');
    });

    it(`${id}: saved from last visit, typing works on the idle screen`, () => {
      storage = memoryStorage({ build: id });
      mount();
      typeWord('hey');
      expect(line()).toBe('hey');
      expect(sound.play).toHaveBeenLastCalledWith(id, 'up');
    });
  }

  it('typing keeps working right after clicking a build in the picker (radio has focus)', () => {
    mount();
    const radio = root.querySelector('input[value="apollo"]');
    radio.click();
    radio.focus();
    for (const ch of 'yo') radio.dispatchEvent(new KeyboardEvent('keydown', { code: `Key${ch.toUpperCase()}`, key: ch, bubbles: true }));
    expect(line()).toBe('yo');
  });

  it('arrow keys on a focused build radio are left to the browser (moving between builds)', () => {
    mount();
    const radio = root.querySelector('input[value="apollo"]');
    radio.focus();
    const e = new KeyboardEvent('keydown', { code: 'ArrowRight', key: 'ArrowRight', bubbles: true, cancelable: true });
    radio.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(showing()).not.toBe('sched'); // didn't browse projects
  });

  it('on a build card, project letters type instead of opening the project', () => {
    mount();
    root.querySelector('input[value="apollo"]').click();
    typeWord('xsbx'); // S and B open projects in the test content
    expect(showing()).toBe('apollo');
    expect(line()).toBe('xsbx');
  });

  it('held project letters repeat on a build card too', () => {
    mount();
    root.querySelector('input[value="apollo"]').click();
    press('KeyS', { key: 's' });
    press('KeyS', { key: 's', repeat: true });
    expect(line()).toBe('ss');
  });

  it('after closing the build card, project letters open projects again', () => {
    mount();
    root.querySelector('input[value="apollo"]').click();
    press('Escape', { key: 'Escape' });
    press('KeyS', { key: 's' });
    expect(showing()).toBe('sched');
  });

  it('on a build card, shift + number still switches builds and esc still closes', () => {
    mount();
    root.querySelector('input[value="apollo"]').click();
    press('ShiftLeft', { shiftKey: true });
    press('Digit6', { shiftKey: true, key: '^' });
    release('ShiftLeft');
    expect(showing()).toBe('matcha');
    press('Escape', { key: 'Escape' });
    expect(showing()).toBe('');
  });

  it('clicking a project cap on a build card types too', () => {
    mount();
    root.querySelector('input[value="apollo"]').click();
    cap('KeyS').click();
    expect(showing()).toBe('apollo');
    expect(line()).toBe('s');
  });

  it('what you typed carries over when you switch builds', () => {
    mount();
    typeWord('xy');
    root.querySelector('input[value="olivia"]').click();
    typeWord('z');
    root.querySelector('input[value="matcha"]').click();
    expect(line()).toBe('xyz');
  });
});

describe('browsing with the arrow keys', () => {
  it('→ opens the first project, then walks forward and wraps', () => {
    mount();
    press('ArrowRight');
    expect(showing()).toBe('sched');
    press('ArrowRight');
    expect(showing()).toBe('bot');
    press('ArrowRight');
    expect(showing()).toBe('sched');
  });

  it('← from nothing opens the last project, then walks back', () => {
    mount();
    press('ArrowLeft');
    expect(showing()).toBe('bot');
    press('ArrowLeft');
    expect(showing()).toBe('sched');
  });

  it('→ from a section starts at the first project', () => {
    mount();
    press('KeyU', { shiftKey: true });
    press('ArrowRight');
    expect(showing()).toBe('sched');
  });

  it('arrow caps are labeled for screen readers', () => {
    mount();
    // named by its visible legend first, then what it does (no aria-label that hides the legend)
    expect(cap('ArrowRight').hasAttribute('aria-label')).toBe(false);
    expect(cap('ArrowRight').textContent).toBe('→next, next project');
    expect(cap('ArrowRight').tabIndex).toBe(0);
  });
});

describe('controls legend', () => {
  it('lists exactly the shortcuts that work, starting with each project key', () => {
    mount();
    const items = [...root.querySelectorAll('[data-hints] li')].map((li) => li.textContent);
    expect(items).toEqual(['S Scheduler', 'B Robot', '←→ browse', 'shift about, contact & more', 'esc back']);
  });
});

describe('clicking caps', () => {
  it('clicking a project cap opens it', () => {
    mount();
    cap('KeyS').click();
    expect(showing()).toBe('sched');
  });

  it('only interesting caps are tab stops', () => {
    mount();
    expect(cap('KeyS').tabIndex).toBe(0);
    expect(cap('KeyA').tabIndex).toBe(0); // fn: about
    expect(cap('KeyQ').tabIndex).toBe(-1);
    expect(cap('KeyQ').getAttribute('aria-hidden')).toBe('true');
  });
});

describe('build picker', () => {
  const board = () => root.querySelector('[data-board]');

  it('picking a build re-skins the board, changes the sound, and is remembered', () => {
    mount();
    root.querySelector('input[value="olivia"]').click();
    expect(board().style.getPropertyValue('--alpha')).toBe('#f2ede7');
    expect(board().style.getPropertyValue('--alpha-ink')).toBe('#2b2b2b');
    expect(showing()).toBe('olivia');
    press('KeyF');
    expect(sound.play).toHaveBeenLastCalledWith('olivia');
    expect(storage.data.get('build')).toBe('olivia');
    expect(display().textContent).toContain('that board’s recording'); // shares the blue samurai's sound
  });

  it('fetches every build\'s recordings once the page is idle', () => {
    vi.useFakeTimers();
    mount();
    vi.advanceTimersByTime(2000);
    for (const id of buildIds) expect(sound.preload).toHaveBeenCalledWith(id);
    vi.useRealTimers();
  });

  it('starts fetching recordings as soon as a build is picked', () => {
    mount();
    expect(sound.preload).toHaveBeenCalledWith('red-samurai');
    kb.setBuild('apollo');
    expect(sound.preload).toHaveBeenLastCalledWith('apollo');
  });

  it('shift+number picks a build from the keyboard and shows its specs', () => {
    mount();
    press('ShiftLeft', { shiftKey: true });
    press('Digit3', { shiftKey: true });
    expect(root.dataset.build).toBe('blue-samurai');
    expect(root.querySelector('input[value="blue-samurai"]').checked).toBe(true);
    expect(display().querySelector('h2').textContent).toBe('Blue Samurai');
    expect(display().querySelector('.status').textContent).toContain('Gamakay LK67');
  });

  it('the "now typing on" label follows the picked build', () => {
    mount();
    expect(root.querySelector('[data-build-name]').textContent).toBe('Red Samurai');
    root.querySelector('input[value="apollo"]').click();
    expect(root.querySelector('[data-build-name]').textContent).toBe('Apollo');
    expect(root.querySelector('[data-build-spec]').textContent).toBe('Gamakay LK67 · Akko Rose Red');
  });

  it('starts with the saved build', () => {
    storage = memoryStorage({ build: 'matcha' });
    mount();
    expect(root.querySelector('input[value="matcha"]').checked).toBe(true);
    expect(board().style.getPropertyValue('--case')).toBe('#e9e6df');
  });

  it('a saved build that no longer exists falls back to the default', () => {
    storage = memoryStorage({ build: 'sold-and-gone' });
    mount();
    expect(root.dataset.build).toBe('red-samurai');
  });

  it('still works when storage is broken', () => {
    storage = {
      getItem() {
        throw new Error('nope');
      },
      setItem() {
        throw new Error('nope');
      },
    };
    mount();
    expect(() => kb.setBuild('white')).not.toThrow();
    expect(root.dataset.build).toBe('white');
  });
});

describe('sound toggle', () => {
  it('sound can be turned off and stays off', () => {
    mount();
    root.querySelector('[data-sound]').click();
    expect(sound.setEnabled).toHaveBeenLastCalledWith(false);
    expect(storage.data.get('sound')).toBe('off');
  });
});

describe('keys toggle (single-letter shortcuts can be turned off)', () => {
  const keysBtn = () => root.querySelector('[data-keys]');

  it('starts on, shown with aria-pressed like the sound toggle', () => {
    mount();
    expect(keysBtn().getAttribute('aria-pressed')).toBe('true');
    expect(keysBtn().textContent).toBe('keys: on');
  });

  it('when off, letters, digits, and space do nothing to the page', () => {
    mount();
    keysBtn().click();
    expect(keysBtn().getAttribute('aria-pressed')).toBe('false');
    expect(keysBtn().textContent).toBe('keys: off');
    sound.play.mockClear();
    const f = press('KeyS', { key: 's' });
    const shiftDigit = press('Digit2', { key: '@', shiftKey: true });
    const space = press('Space', { key: ' ' });
    expect(showing()).toBe('');
    expect(root.querySelector('.echo').textContent).toBe('');
    expect(cap('KeyS').classList.contains('down')).toBe(false);
    expect(sound.play).not.toHaveBeenCalled();
    expect([f, shiftDigit, space].some((e) => e.defaultPrevented)).toBe(false); // space scrolls again
    expect(kb.layer).toBe('base');
  });

  it('when off, clicking and tapping caps still works', () => {
    mount();
    keysBtn().click();
    cap('KeyS').click();
    expect(showing()).toBe('sched');
  });

  it('when off, esc still closes a panel', () => {
    mount();
    keysBtn().click();
    cap('KeyS').click();
    press('Escape');
    expect(showing()).toBe('');
  });

  it('is remembered, and turns back on', () => {
    mount();
    keysBtn().click();
    expect(storage.data.get('keys')).toBe('off');
    kb.destroy();
    root.querySelector('[data-board]').replaceChildren();
    root.querySelector('[data-builds]').replaceChildren();
    root.querySelector('[data-hints]').replaceChildren();
    mount();
    expect(keysBtn().getAttribute('aria-pressed')).toBe('false');
    press('KeyS');
    expect(showing()).toBe('');
    keysBtn().click();
    expect(storage.data.get('keys')).toBe('on');
    press('KeyS');
    expect(showing()).toBe('sched');
  });

  it('turning keys off mid-hold drops the shift layer', () => {
    mount();
    press('ShiftLeft');
    expect(kb.layer).toBe('fn');
    keysBtn().click();
    expect(kb.layer).toBe('base');
  });

  it('still works when storage is broken', () => {
    storage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    mount();
    keysBtn().click();
    expect(keysBtn().textContent).toBe('keys: off');
  });
});

describe('shortcuts never fire where they shouldn\'t', () => {
  it('not with alt held (alt+letter types special characters on a Mac)', () => {
    mount();
    const e = press('KeyS', { key: 'ß', altKey: true });
    expect(showing()).toBe('');
    expect(e.defaultPrevented).toBe(false);
  });

  it('not inside a contenteditable or textarea', () => {
    mount();
    for (const html of ['<div contenteditable="true"></div>', '<textarea></textarea>']) {
      const field = document.createElement('div');
      field.innerHTML = html;
      document.body.append(field);
      field.firstChild.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS', key: 's', bubbles: true, cancelable: true }));
      expect(showing()).toBe('');
      field.remove();
    }
  });
});

describe('about panel and the shortcuts bar', () => {
  it('shift + A opens a short About panel with a link to the about page, not a jump', () => {
    mount();
    press('KeyA', { shiftKey: true });
    expect(showing()).toBe('about');
    const link = display().querySelector('a.btn');
    expect(link.getAttribute('href')).toBe('/about.html');
    expect(link.textContent).toBe('Read more →'); // → stays on the site, ↗ leaves it
    expect(link.target).toBe('');
  });

  it('the shortcuts bar steps aside once the board scrolls out of view', () => {
    root.insertAdjacentHTML('beforeend', '<div class="bottom-bar"></div>');
    let seen;
    const win = Object.assign(Object.create(window), {
      addEventListener: window.addEventListener.bind(window),
      removeEventListener: window.removeEventListener.bind(window),
      setTimeout: window.setTimeout.bind(window),
      IntersectionObserver: class {
        constructor(cb) {
          seen = cb;
        }
        observe() {}
        disconnect() {}
      },
    });
    kb = mountKeyboard(root, { content, sound, storage, win });
    const bar = root.querySelector('.bottom-bar');
    seen([{ isIntersecting: false }]);
    expect(bar.classList.contains('away')).toBe(true);
    seen([{ isIntersecting: true }]);
    expect(bar.classList.contains('away')).toBe(false);
  });

  it('reports the build it\'s on (the nav caps click in that build\'s sound)', () => {
    mount();
    expect(kb.build).toBe('red-samurai');
    press('Digit3', { shiftKey: true });
    expect(kb.build).toBe('blue-samurai');
  });
});

describe('build picker, clicking the build you\'re on', () => {
  it('shows its card instead of doing nothing', () => {
    mount();
    root.querySelector('input[value="red-samurai"]').click();
    expect(showing()).toBe('red-samurai');
  });

  it('a different build still shows only once per click', () => {
    mount();
    const seen = [];
    new MutationObserver(() => seen.push(showing())).observe(display(), { attributes: true, attributeFilter: ['data-showing'] });
    root.querySelector('input[value="apollo"]').click();
    return Promise.resolve().then(() => expect(seen).toEqual(['apollo']));
  });
});

describe('the shortcuts bar never covers the build picker or the keys', () => {
  it('steps aside while the picker is in the bar\'s spot at the bottom of the screen, and comes back', () => {
    root.insertAdjacentHTML('beforeend', '<div class="bottom-bar"></div>');
    let seen;
    const listeners = {};
    const win = Object.assign(Object.create(window), {
      innerHeight: 720,
      addEventListener: (type, f) => (listeners[type] = f),
      removeEventListener() {},
      setTimeout: window.setTimeout.bind(window),
      requestAnimationFrame: (f) => f(),
      IntersectionObserver: class {
        constructor(cb) {
          seen = cb;
        }
        observe() {}
        disconnect() {}
      },
    });
    kb = mountKeyboard(root, { content, sound, storage, win });
    const bar = root.querySelector('.bottom-bar');
    const picker = root.querySelector('[data-builds]');
    bar.getBoundingClientRect = () => ({ top: 670, bottom: 706, height: 36 }); // stuck to the bottom of a 720px screen
    let top = 660; // the picker is under it
    picker.getBoundingClientRect = () => ({ top, bottom: top + 44, height: 44 });
    seen([{ isIntersecting: true }]);
    expect(bar.classList.contains('away')).toBe(true);
    top = 400; // scrolled: the picker is up the screen now, clear of the bar
    listeners.scroll();
    expect(bar.classList.contains('away')).toBe(false);
    // a short screen: the bar is stuck over the keyboard's bottom row
    root.querySelector('[data-board]').getBoundingClientRect = () => ({ top: 400, bottom: 700, height: 300 });
    listeners.scroll();
    expect(bar.classList.contains('away')).toBe(true);
  });
});
