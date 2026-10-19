// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderSections, renderAbout, setupCopy } from '../src/sections.js';
import { buildIds, builds } from '../src/builds.js';
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

  // changed on purpose (twice): the description and links are always on the card; how it works and
  // the tags are extras that show over the image
  it('a card always shows its status, one-line description, and links; extras sit over the image', () => {
    const ft = content.projects.find((p) => p.id === 'focusticker');
    const card = document.querySelector('#focusticker');
    const body = card.querySelector('.project-body');
    expect(body.querySelector('.status').textContent).toBe(ft.status);
    expect(body.querySelector('.blurb').textContent).toBe(ft.body);
    const links = [...body.querySelectorAll('a.btn')];
    expect(links.map((a) => a.href)).toEqual(ft.links.map((l) => l.href));
    expect(links.every((a) => a.target === '_blank' && a.rel === 'noopener')).toBe(true);
    const extras = card.querySelector('.project-media .project-extras');
    expect(extras.querySelector('.how').textContent).toBe(ft.how);
    expect([...extras.querySelectorAll('.stack li')].map((li) => li.textContent)).toEqual(ft.stack);
  });

  it('shows a lazy-loaded screenshot only when a project has one', () => {
    document.querySelector('[data-work]').replaceChildren();
    renderSections(document.querySelector('main'), {
      roles: [],
      projects: [{ id: 'x', key: 'KeyX', title: 'X', status: '', body: 'b', links: [], image: { src: 'x.png', alt: 'X in action' } }],
    });
    const img = document.querySelector('#x .project-media img');
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

  // changed on purpose: Capsule now has a card image, an illustration (not a screenshot)
  it('a project still in development looks lighter, has no links, and its image is an illustration', () => {
    const capsule = document.querySelector('#capsule');
    expect(capsule.classList.contains('in-progress')).toBe(true);
    expect(capsule.querySelector('.status').textContent).toMatch(/in development/);
    expect(capsule.querySelector('a')).toBeNull();
    expect(capsule.querySelector('img').getAttribute('src')).toMatch(/capsule\.svg$/);
    expect(capsule.querySelector('img').alt).toMatch(/^Illustration/);
    expect(document.querySelector('#focusticker').classList.contains('in-progress')).toBe(false);
  });

  it('PNW Keyboards\' image is every build, drawn by the site in its real colors', () => {
    const svg = document.querySelector('#pnwkeyboards .project-media svg');
    expect(svg.getAttribute('role')).toBe('img');
    for (const id of buildIds) expect(svg.getAttribute('aria-label')).toContain(builds[id].name);
    // a case per build, all in their own case color
    const cases = [...svg.querySelectorAll('g > rect:first-child')].map((r) => r.getAttribute('fill'));
    expect(cases).toEqual(buildIds.map((id) => builds[id].colors.case));
  });

  it('FocusTicker, the shipped one, gets the wide featured card; the others don\'t', () => {
    expect(document.querySelector('#focusticker').classList.contains('featured')).toBe(true);
    expect(document.querySelectorAll('.project.featured')).toHaveLength(1);
  });

  it('Capsule\'s image says it\'s an illustration, right on the image', () => {
    expect(document.querySelector('#capsule .project-media .media-label').textContent).toBe('illustration');
    expect(document.querySelector('#focusticker .media-label')).toBeNull(); // a real screenshot
  });

  it('links leaving the site say ↗ and open a new tab; links within it say →', () => {
    const external = document.querySelector('#focusticker a.btn');
    expect(external.textContent).toMatch(/↗$/);
    expect(external.target).toBe('_blank');
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

describe('renderAbout', () => {
  beforeEach(() => {
    document.body.innerHTML = `<main><article data-about></article></main>`;
    renderAbout(document, content);
  });

  it('titles the page About and leads with the intro', () => {
    expect(document.querySelector('h1').textContent).toBe('About');
    const intro = [...document.querySelectorAll('.intro p')].map((p) => p.textContent);
    expect(intro).toEqual(content.sections.about.page.intro);
  });

  it('has a section for each hobby, in order: coding, keyboards, cooking', () => {
    const sections = [...document.querySelectorAll('section.hobby')];
    expect(sections.map((s) => s.id)).toEqual(['coding', 'keyboards', 'cooking']);
    for (const s of sections) expect(s.getAttribute('aria-labelledby')).toBe(s.querySelector('h2').id);
  });
});
