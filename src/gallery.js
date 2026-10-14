import { allTags, filterProjects } from './projects.js';

export function mountGallery(root, list) {
  const filters = root.querySelector('[data-filters]');
  const grid = root.querySelector('[data-grid]');
  const empty = root.querySelector('[data-empty]');
  let active = 'all';

  function render() {
    const shown = filterProjects(list, active);
    grid.replaceChildren(
      ...shown.map((p) => {
        const li = document.createElement('li');
        li.className = 'card';
        li.innerHTML = `<h3></h3><p></p>`;
        li.querySelector('h3').textContent = p.title;
        li.querySelector('p').textContent = p.blurb;
        return li;
      }),
    );
    empty.hidden = shown.length > 0;
    for (const btn of filters.querySelectorAll('button')) {
      btn.setAttribute('aria-pressed', String(btn.dataset.tag === active));
    }
  }

  function select(tag) {
    active = tag;
    render();
  }

  filters.replaceChildren(
    ...['all', ...allTags(list)].map((tag) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.tag = tag;
      btn.textContent = tag;
      btn.addEventListener('click', () => select(tag));
      return btn;
    }),
  );

  root.querySelector('[data-reset]')?.addEventListener('click', () => select('all'));
  render();
  return { select };
}
