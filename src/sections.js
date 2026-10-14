// the plain, scrollable version of everything on the keyboard.
// same content.js, so the two can't drift apart.

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const keyLabel = (code) => code.replace(/^Key|^Digit/, '');

function linkButtons(links) {
  const row = el('p', 'links');
  for (const { label, href } of links) {
    const a = el('a', 'btn', `${label} ↗`);
    a.href = href;
    if (/^https?:/.test(href)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    row.append(a);
  }
  return row;
}

function chips(items) {
  const ul = el('ul', 'stack');
  for (const t of items) ul.append(el('li', null, t));
  return ul;
}

function project(p) {
  const article = el('article', 'project');
  article.id = p.id;
  const head = el('div', 'project-head');
  const kbd = el('kbd', null, keyLabel(p.key));
  kbd.title = `press ${keyLabel(p.key)} on the keyboard above`;
  head.append(el('h3', null, p.title), kbd);
  article.append(head, el('p', 'status', p.status));
  for (const text of [p.body].flat()) article.append(el('p', null, text));
  article.append(chips(p.stack ?? []));
  if (p.links.length) article.append(linkButtons(p.links));
  return article;
}

function timeline(items) {
  const ol = el('ol', 'timeline');
  for (const i of items) {
    const li = el('li');
    li.append(el('p', 'dates', i.dates));
    const body = el('div');
    const h = el('h3', null, i.role);
    h.append(el('span', 'org', ` · ${i.org}`));
    body.append(h, el('p', null, i.blurb));
    if (i.stack.length) body.append(chips(i.stack));
    li.append(body);
    ol.append(li);
  }
  return ol;
}

export function renderSections(root, content) {
  const { sections } = content;
  root.querySelector('[data-work]').append(...content.projects.map(project));
  root.querySelector('[data-experience]').append(timeline(sections.experience.items));
  root.querySelector('[data-education]').append(timeline(sections.education.items));
  const about = root.querySelector('[data-about]');
  for (const text of sections.about.body) about.append(el('p', null, text));
}

// email: the link still works as mailto, the button copies it
export function setupCopy(button, { clipboard = navigator.clipboard, win = window } = {}) {
  const original = button.textContent;
  button.addEventListener('click', async () => {
    try {
      await clipboard.writeText(button.dataset.copy);
      button.textContent = 'copied ✓';
    } catch {
      button.textContent = button.dataset.copy; // at least show it so it can be selected
    }
    win.setTimeout(() => (button.textContent = original), 1600);
  });
}
