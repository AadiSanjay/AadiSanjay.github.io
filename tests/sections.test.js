// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderSections, setupCopy } from '../src/sections.js';
import { content } from '../src/content.js';

describe('renderSections (the plain version)', () => {
  beforeEach(() => {
    document.body.innerHTML = `<main><ul data-roles></ul><div data-work></div></main>`;
    renderSections(document.querySelector('main'), content);
  });

  it('renders the short role lines under my name', () => {
    const roles = [...document.querySelectorAll('[data-roles] li')].map((li) => li.textContent);
    expect(roles).toEqual(content.roles.map((r) => `@${r.at}${r.what}`));
  });

  it('renders every project with an anchor id and its keyboard key', () => {
    const projects = [...document.querySelectorAll('.project')];
    expect(projects.map((p) => p.id)).toEqual(content.projects.map((p) => p.id));
    expect(document.querySelector('#focusticker kbd').textContent).toBe('F');
  });

  it('keeps project cards short: status, one blurb, links', () => {
    const ft = content.projects.find((p) => p.id === 'focusticker');
    const article = document.querySelector('#focusticker');
    expect(article.querySelectorAll('p:not(.status, .links)')).toHaveLength(1);
    const links = [...article.querySelectorAll('a.btn')];
    expect(links.map((a) => a.href)).toEqual(ft.links.map((l) => l.href));
    expect(links.every((a) => a.target === '_blank' && a.rel === 'noopener')).toBe(true);
  });

  it('shows a lazy-loaded screenshot only when a project has one', () => {
    document.querySelector('[data-work]').replaceChildren();
    renderSections(document.querySelector('main'), {
      roles: [],
      projects: [{ id: 'x', key: 'KeyX', title: 'X', status: '', body: 'b', links: [], image: { src: 'x.png', alt: 'X in action' } }],
    });
    const img = document.querySelector('#x img.shot');
    expect(img.alt).toBe('X in action');
    expect(img.loading).toBe('lazy');
    expect(document.querySelectorAll('#x img')).toHaveLength(1);
  });

  it('a project with no links gets no empty button row', () => {
    expect(document.querySelector('#capsule .links')).toBeNull();
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
