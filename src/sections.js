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

function project(p) {
  const article = el('article', 'project');
  article.id = p.id;
  if (p.image) {
    const img = el('img', 'shot');
    img.src = p.image.src;
    img.alt = p.image.alt;
    img.loading = 'lazy';
    article.append(img);
  }
  const head = el('div', 'project-head');
  const kbd = el('kbd', null, keyLabel(p.key));
  kbd.title = `press ${keyLabel(p.key)} on the keyboard above`;
  head.append(el('h3', null, p.title), kbd);
  article.append(head, el('p', 'status', p.status), el('p', null, [p.body].flat()[0]));
  if (p.links.length) article.append(linkButtons(p.links));
  return article;
}

export function renderSections(root, content) {
  const roles = root.querySelector('[data-roles]');
  for (const { at, what } of content.roles) {
    const li = el('li');
    li.append(el('span', 'at', `@${at}`), el('span', null, what));
    roles.append(li);
  }
  root.querySelector('[data-work]').append(...content.projects.map(project));
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
