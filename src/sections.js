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

function project(p, onKey) {
  const article = el('article', p.inProgress ? 'project in-progress' : 'project');
  article.id = p.id;
  if (p.image) {
    const img = el('img', 'shot');
    img.src = p.image.src;
    img.alt = p.image.alt;
    img.loading = 'lazy';
    article.append(img);
  }
  const head = el('div', 'project-head');
  // the key is a button: it scrolls up and presses that key on the board, which opens this
  // project's panel. it says so, and its name starts with what it shows ("press F")
  const press = el('button', 'press');
  press.type = 'button';
  press.append('press ', el('kbd', null, keyLabel(p.key)), el('span', 'sr', ` on the keyboard to open ${p.title} there`));
  press.title = `opens ${p.title} on the keyboard above`;
  press.addEventListener('click', () => onKey?.(p.key));
  head.append(el('h3', null, p.title), press);
  article.append(head, el('p', 'status', p.status), el('p', null, [p.body].flat()[0]));
  if (p.how) article.append(el('p', 'how', p.how));
  if (p.stack?.length) {
    const tags = el('ul', 'stack');
    tags.setAttribute('aria-label', p.kind ? 'Skills' : 'Built with');
    tags.append(...p.stack.map((t) => el('li', null, t)));
    article.append(tags);
  }
  if (p.links.length) article.append(linkButtons(p.links));
  return article;
}

// about and experience, readable without touching a tiny fn key on a phone
function plain(section, id, s) {
  const title = el('h2', null, s.title);
  title.id = `${id}-title`;
  section.append(title);
  if (s.jobs) {
    const list = el('ol', 'jobs');
    for (const j of s.jobs) {
      const li = el('li');
      const head = el('p', 'job-head');
      head.append(el('strong', null, j.role), ` · ${j.org}`, el('span', 'dates', j.dates));
      li.append(head, el('p', null, j.text));
      list.append(li);
    }
    section.append(list);
  } else {
    const body = el('div', 'prose');
    body.append(...[s.body].flat().map((text) => el('p', null, text)));
    section.append(body);
  }
  if (s.links?.length) section.append(linkButtons(s.links));
}

export function renderSections(root, content, { onKey } = {}) {
  const roles = root.querySelector('[data-roles]');
  for (const { at, what } of content.roles) {
    const li = el('li');
    li.append(el('span', 'at', `@${at}`), el('span', null, what));
    roles.append(li);
  }
  root.querySelector('[data-work]').append(...content.projects.map((p) => project(p, onKey)));
  for (const section of root.querySelectorAll('[data-plain]')) {
    const s = content.sections?.[section.dataset.plain];
    if (s) plain(section, section.dataset.plain, s);
  }
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
