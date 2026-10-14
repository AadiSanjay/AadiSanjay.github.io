// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderSections, setupCopy } from '../src/sections.js';
import { content } from '../src/content.js';

describe('renderSections (the plain version)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main>
        <div data-work></div><div data-experience></div><div data-education></div><div data-about></div>
      </main>`;
    renderSections(document.querySelector('main'), content);
  });

  it('renders every project with an anchor id and its keyboard key', () => {
    const projects = [...document.querySelectorAll('.project')];
    expect(projects.map((p) => p.id)).toEqual(content.projects.map((p) => p.id));
    expect(document.querySelector('#focusticker kbd').textContent).toBe('F');
  });

  it('every project paragraph and link makes it onto the page', () => {
    const ft = content.projects.find((p) => p.id === 'focusticker');
    const article = document.querySelector('#focusticker');
    for (const text of ft.body) expect(article.textContent).toContain(text);
    const links = [...article.querySelectorAll('a.btn')];
    expect(links.map((a) => a.href)).toEqual(ft.links.map((l) => l.href));
    expect(links.every((a) => a.target === '_blank' && a.rel === 'noopener')).toBe(true);
  });

  it('a project with no links gets no empty button row', () => {
    expect(document.querySelector('#capsule .links')).toBeNull();
  });

  it('renders experience and education as timelines with dates', () => {
    const items = document.querySelectorAll('[data-experience] .timeline > li');
    expect(items).toHaveLength(content.sections.experience.items.length);
    expect(items[0].querySelector('.dates').textContent).toBe(content.sections.experience.items[0].dates);
    expect(document.querySelector('[data-education]').textContent).toContain('University of Illinois');
  });

  it('renders the about paragraphs', () => {
    expect(document.querySelectorAll('[data-about] p')).toHaveLength(content.sections.about.body.length);
  });
});

describe('setupCopy', () => {
  let button;
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `<button data-copy="me@example.com">copy</button>`;
    button = document.querySelector('button');
  });

  it('copies the address and says so, then resets', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue() };
    setupCopy(button, { clipboard });
    button.click();
    await vi.waitFor(() => expect(button.textContent).toBe('copied ✓'));
    expect(clipboard.writeText).toHaveBeenCalledWith('me@example.com');
    vi.advanceTimersByTime(2000);
    expect(button.textContent).toBe('copy');
  });

  it('shows the address when the clipboard is blocked', async () => {
    setupCopy(button, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    button.click();
    await vi.waitFor(() => expect(button.textContent).toBe('me@example.com'));
  });
});
