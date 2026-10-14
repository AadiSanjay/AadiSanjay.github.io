// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mountKeyboard } from '../src/keyboard.js';

const content = {
  projects: [
    { id: 'sched', key: 'KeyS', short: 'sched', title: 'Scheduler', blurb: 'plans things', tags: ['web'], links: [] },
    { id: 'bot', key: 'KeyB', short: 'bot', title: 'Robot', blurb: '<img src=x>', tags: [], links: [] },
  ],
  sections: {
    about: { title: 'About me', body: 'hi', links: [] },
    contact: { title: 'Contact', body: '', links: [] },
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
      <fieldset data-switches></fieldset>
      <button data-sound></button>
      <button data-list-toggle></button>
      <section data-list hidden><ul></ul></section>
    </main>`;
  root = document.querySelector('#desk');
  sound = { play: vi.fn(), setEnabled: vi.fn() };
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
    expect(sound.play).toHaveBeenCalledWith('linear');
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

describe('switch picker', () => {
  it('picking a switch changes the sound and is remembered', () => {
    mount();
    root.querySelector('input[value="clicky"]').click();
    press('KeyS');
    expect(sound.play).toHaveBeenLastCalledWith('clicky');
    expect(storage.data.get('switch')).toBe('clicky');
    expect(root.dataset.switch).toBe('clicky');
  });

  it('shift+number picks a switch from the keyboard', () => {
    mount();
    press('ShiftLeft', { shiftKey: true });
    press('Digit2', { shiftKey: true });
    expect(root.dataset.switch).toBe('tactile');
    expect(root.querySelector('input[value="tactile"]').checked).toBe(true);
  });

  it('starts with the saved switch', () => {
    storage = memoryStorage({ switch: 'tactile' });
    mount();
    expect(root.querySelector('input[value="tactile"]').checked).toBe(true);
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
    expect(() => kb.setSwitch('clicky')).not.toThrow();
    expect(root.dataset.switch).toBe('clicky');
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
