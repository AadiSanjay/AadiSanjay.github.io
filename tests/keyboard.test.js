// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mountKeyboard } from '../src/keyboard.js';

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
    about: { title: 'About me', body: 'hi', links: [] },
    contact: { title: 'Contact', body: '', links: [] },
    experience: { title: 'Experience', body: '', links: [] },
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
      <div data-display><p class="idle">type a key</p></div>
      <div data-board></div>
      <fieldset data-builds></fieldset>
      <button data-sound></button>
      <button data-list-toggle></button>
      <section data-list hidden><ul></ul></section>
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

  it('shows the cap going down and coming back up', () => {
    mount();
    press('KeyS');
    expect(cap('KeyS').classList.contains('down')).toBe(true);
    release('KeyS');
    expect(cap('KeyS').classList.contains('down')).toBe(false);
  });

  it('an unmapped key wiggles, plays, and leaves the page alone', () => {
    mount();
    press('KeyS');
    const e = press('KeyQ');
    expect(cap('KeyQ').classList.contains('nope')).toBe(true);
    expect(showing()).toBe('sched');
    expect(e.defaultPrevented).toBe(false); // e.g. space still scrolls, tab still tabs
    expect(sound.play).toHaveBeenCalledTimes(2);
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

  it('renders every paragraph, the stack, and links as buttons', () => {
    mount();
    press('KeyS');
    expect(display().querySelectorAll('.body p')).toHaveLength(2);
    expect([...display().querySelectorAll('.stack li')].map((li) => li.textContent)).toEqual(['JS', 'CSS']);
    const [gh, mail] = display().querySelectorAll('a.btn');
    expect(gh.target).toBe('_blank');
    expect(gh.rel).toBe('noopener');
    expect(mail.target).toBe(''); // mailto shouldn't open a blank tab
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
    expect(display().textContent).toContain('approximated'); // no recording of olivia yet
  });

  it('starts fetching recordings as soon as a build is picked', () => {
    mount();
    expect(sound.preload).toHaveBeenCalledWith('red-samurai');
    kb.setBuild('rose-red');
    expect(sound.preload).toHaveBeenLastCalledWith('rose-red');
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

describe('sound + list toggles', () => {
  it('sound can be turned off and stays off', () => {
    mount();
    root.querySelector('[data-sound]').click();
    expect(sound.setEnabled).toHaveBeenLastCalledWith(false);
    expect(storage.data.get('sound')).toBe('off');
  });

  it('list view shows every project', () => {
    mount();
    root.querySelector('[data-list-toggle]').click();
    expect(root.querySelector('[data-list]').hidden).toBe(false);
    expect(root.querySelectorAll('[data-list] li')).toHaveLength(2);
  });
});
