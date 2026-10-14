// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { setupNav } from '../src/nav.js';

const page = (file) => new DOMParser().parseFromString(readFileSync(file, 'utf8'), 'text/html');
const index = page('index.html');
const about = page('about.html');
const caps = (doc) => [...doc.querySelectorAll('.keynav [data-nav]')];

describe('the keycap nav on both pages', () => {
  it('has the same four caps in the same order: home, work, experience, about', () => {
    for (const doc of [index, about]) {
      expect(caps(doc).map((c) => c.textContent.trim())).toEqual(['home', 'work', 'experience', 'about']);
    }
  });

  it('home links within the page; about links back to home\'s sections', () => {
    expect(caps(index).map((c) => c.getAttribute('href'))).toEqual(['#home', '#work', '#experience', 'about.html']);
    expect(caps(about).map((c) => c.getAttribute('href'))).toEqual(['./#home', './#work', './#experience', 'about.html']);
  });

  it('every section home links to exists', () => {
    for (const id of ['home', 'work', 'experience']) expect(index.getElementById(id), id).not.toBeNull();
  });

  it('the about page marks its own cap as the current page', () => {
    expect(about.querySelector('[data-nav="about"]').getAttribute('aria-current')).toBe('page');
    expect(index.querySelector('[aria-current]')).toBeNull(); // home works it out from scrolling
  });

  it('both pages share the same sidebar (the name is the h1 only on home)', () => {
    const side = (doc) => doc.querySelector('.sidebar').innerHTML.replace(/<(\/?)(h1|p) class="site-name"|<\/(h1|p)>/g, '').replace(/\s+/g, ' ');
    expect(side(about)).toBe(side(index));
    expect(index.querySelector('.sidebar h1.site-name')).not.toBeNull();
    expect(about.querySelector('.sidebar h1')).toBeNull(); // about.html's h1 is "About", rendered into the page
  });
});

describe('setupNav', () => {
  let tops, scrollY, scrollHeight, win, sections;

  beforeEach(() => {
    document.body.innerHTML = index.body.innerHTML;
    tops = { home: 64, work: 900, experience: 1800 };
    scrollY = 0;
    scrollHeight = 3000;
    sections = ['home', 'work', 'experience'].map((id) => {
      const s = document.getElementById(id);
      s.getBoundingClientRect = () => ({ top: tops[id] - scrollY });
      return s;
    });
    // a stand-in window whose scroll position we control (getters, so they stay live)
    win = new EventTarget();
    Object.defineProperties(win, {
      innerHeight: { value: 900 },
      scrollY: { get: () => scrollY },
      document: { value: { documentElement: { get scrollHeight() { return scrollHeight; } } } },
      requestAnimationFrame: { value: (f) => f() },
    });
  });

  const current = () => document.querySelector('.keynav [aria-current]')?.dataset.nav;
  const scrollTo = (y) => {
    scrollY = y;
    win.dispatchEvent(new Event('scroll'));
  };

  it('starts on home and follows the section you scroll to', () => {
    setupNav(document.querySelector('.keynav'), { sections, win });
    expect(current()).toBe('home');
    scrollTo(700); // work's top is 200px down the screen: past the upper third
    expect(current()).toBe('work');
    expect(document.querySelector('[data-nav="work"]').getAttribute('aria-current')).toBe('location');
    scrollTo(1600);
    expect(current()).toBe('experience');
    scrollTo(100);
    expect(current()).toBe('home');
    expect(document.querySelectorAll('.keynav [aria-current]')).toHaveLength(1);
  });

  it('at the very bottom, the last section is current even if it never reaches the top third', () => {
    tops.experience = 2700;
    setupNav(document.querySelector('.keynav'), { sections, win });
    scrollTo(2100); // bottom of the page: 2100 + 900 = 3000
    expect(current()).toBe('experience');
  });

  it('clicking a cap presses it (plays the key sound)', () => {
    const onPress = vi.fn();
    setupNav(document.querySelector('.keynav'), { sections, win, onPress });
    document.querySelector('[data-nav="work"]').click();
    expect(onPress).toHaveBeenCalledWith('work');
  });

  it('stops listening once destroyed', () => {
    const nav = setupNav(document.querySelector('.keynav'), { sections, win });
    nav.destroy();
    scrollTo(1600);
    expect(current()).toBe('home');
  });

  it('works with no sections to follow (the about page)', () => {
    expect(() => setupNav(document.querySelector('.keynav'))).not.toThrow();
  });
});
