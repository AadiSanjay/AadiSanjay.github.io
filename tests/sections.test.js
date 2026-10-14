// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderSections, setupCopy } from '../src/sections.js';
import { content } from '../src/content.js';

describe('renderSections (the plain version)', () => {
  beforeEach(() => {
    document.body.innerHTML = `<main><ul data-roles></ul><div data-work></div>
      <section data-plain="about"></section><section data-plain="experience"></section></main>`;
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

  // changed on purpose: cards now carry a little more evidence than the panels (a how-it-works
  // sentence and tags), but still no lists or case studies
  it('keeps project cards scannable: status, one blurb, at most one how sentence, tags, links', () => {
    const ft = content.projects.find((p) => p.id === 'focusticker');
    const article = document.querySelector('#focusticker');
    expect([...article.querySelectorAll('p:not(.status, .links)')].map((p) => p.textContent)).toEqual([ft.body, ft.how]);
    expect([...article.querySelectorAll('.stack li')].map((li) => li.textContent)).toEqual(ft.stack);
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

  it('each project\'s key is a button that presses that key on the board', () => {
    document.querySelector('[data-work]').replaceChildren();
    const pressed = [];
    renderSections(document.querySelector('main'), { roles: [], projects: content.projects }, { onKey: (code) => pressed.push(code) });
    const btn = document.querySelector('#capsule button.press');
    // changed on purpose: the visible text says what it does, and the name starts with it
    expect(btn.hasAttribute('aria-label')).toBe(false);
    expect(btn.textContent).toBe('press C on the keyboard to open Capsule there');
    btn.click();
    expect(pressed).toEqual(['KeyC']);
  });

  it('a project still in development looks lighter, and claims no links or screenshot', () => {
    const capsule = document.querySelector('#capsule');
    expect(capsule.classList.contains('in-progress')).toBe(true);
    expect(capsule.querySelector('.status').textContent).toMatch(/in development/);
    expect(capsule.querySelector('img, a')).toBeNull();
    expect(document.querySelector('#focusticker').classList.contains('in-progress')).toBe(false);
  });

  it('a project with no links gets no empty button row', () => {
    expect(document.querySelector('#capsule .links')).toBeNull();
  });

  it('renders About as plain text from content.js, word for word', () => {
    const about = document.querySelector('[data-plain="about"]');
    expect(about.querySelector('h2').textContent).toBe(content.sections.about.title);
    expect(about.querySelector('h2').id).toBe('about-title'); // the section's aria-labelledby
    const paras = [...about.querySelectorAll('.prose p')].map((p) => p.textContent);
    expect(paras).toEqual([content.sections.about.body].flat());
  });

  it('renders every job in Experience, in order, with its role, org, dates, and sentence', () => {
    const items = [...document.querySelectorAll('[data-plain="experience"] .jobs li')];
    const { jobs } = content.sections.experience;
    expect(items).toHaveLength(jobs.length);
    items.forEach((li, i) => {
      expect(li.querySelector('strong').textContent).toBe(jobs[i].role);
      expect(li.querySelector('.job-head').textContent).toContain(jobs[i].org);
      expect(li.querySelector('.dates').textContent).toBe(jobs[i].dates);
      expect(li.querySelector('p:last-child').textContent).toBe(jobs[i].text);
    });
  });

  it('the shift + E panel and the Experience section come from the same jobs', () => {
    const { jobs, body } = content.sections.experience;
    expect(body).toEqual(jobs.map((j) => `${j.role}, ${j.org} (${j.dates})`));
  });

  it('skips a plain section content.js doesn\'t have', () => {
    document.body.innerHTML = `<main><ul data-roles></ul><div data-work></div><section data-plain="nope"></section></main>`;
    renderSections(document.querySelector('main'), content);
    expect(document.querySelector('[data-plain="nope"]').childElementCount).toBe(0);
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
