// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { filterProjects, allTags } from '../src/projects.js';
import { mountGallery } from '../src/gallery.js';

const sample = [
  { title: 'A', blurb: '', tags: ['web'] },
  { title: 'B', blurb: '', tags: ['ml'] },
  { title: 'C', blurb: '', tags: ['web', 'design'] },
];

describe('filterProjects', () => {
  it('returns only projects with the tag', () => {
    expect(filterProjects(sample, 'web').map((p) => p.title)).toEqual(['A', 'C']);
  });

  it('returns everything for "all" or no tag', () => {
    expect(filterProjects(sample, 'all')).toHaveLength(3);
    expect(filterProjects(sample, undefined)).toHaveLength(3);
  });

  it('returns an empty list for a tag nobody has', () => {
    expect(filterProjects(sample, 'rust')).toEqual([]);
  });

  it('lists unique tags alphabetically', () => {
    expect(allTags(sample)).toEqual(['design', 'ml', 'web']);
  });
});

describe('mountGallery', () => {
  let root;

  beforeEach(() => {
    document.body.innerHTML = `
      <section id="work">
        <div data-filters></div>
        <ul data-grid></ul>
        <p data-empty hidden><button data-reset>reset</button></p>
      </section>`;
    root = document.querySelector('#work');
  });

  const titles = () => [...root.querySelectorAll('[data-grid] h3')].map((h) => h.textContent);
  const button = (tag) => root.querySelector(`[data-filters] [data-tag="${tag}"]`);

  it('shows everything on load with "all" pressed', () => {
    mountGallery(root, sample);
    expect(titles()).toEqual(['A', 'B', 'C']);
    expect(button('all').getAttribute('aria-pressed')).toBe('true');
  });

  it('filters when a tag button is clicked', () => {
    mountGallery(root, sample);
    button('ml').click();
    expect(titles()).toEqual(['B']);
    expect(button('ml').getAttribute('aria-pressed')).toBe('true');
    expect(button('all').getAttribute('aria-pressed')).toBe('false');
  });

  it('shows the empty state and reset brings everything back', () => {
    const gallery = mountGallery(root, sample);
    gallery.select('rust');
    expect(titles()).toEqual([]);
    expect(root.querySelector('[data-empty]').hidden).toBe(false);

    root.querySelector('[data-reset]').click();
    expect(titles()).toEqual(['A', 'B', 'C']);
    expect(root.querySelector('[data-empty]').hidden).toBe(true);
  });

  it('renders titles as text, not html', () => {
    mountGallery(root, [{ title: '<img src=x>', blurb: '', tags: ['web'] }]);
    expect(root.querySelector('[data-grid] img')).toBeNull();
    expect(titles()).toEqual(['<img src=x>']);
  });
});
