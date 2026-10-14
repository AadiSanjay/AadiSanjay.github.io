// the plain, scrollable version of everything on the keyboard, plus the about page.
// same content.js, so the two can't drift apart.
import { buildsArt } from './art.js';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const keyLabel = (code) => code.replace(/^Key|^Digit/, '');

// external links open in a new tab and get ↗; links within the site get →
export function linkButtons(links) {
  const row = el('p', 'links');
  for (const { label, href } of links) {
    const external = /^https?:/.test(href);
    const a = el('a', 'btn', `${label} ${external ? '↗' : '→'}`);
    a.href = href;
    if (external) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    row.append(a);
  }
  return row;
}

function media(p) {
  const box = el('div', 'project-media');
  if (p.art === 'builds') {
    box.append(buildsArt());
  } else if (p.image) {
    const img = el('img');
    img.src = p.image.src;
    img.alt = p.image.alt;
    img.loading = 'lazy';
    box.append(img);
  }
  return box.childElementCount ? box : null;
}

// a project card: its image, title, and status at rest. the rest (what it is, how it works, tags,
// links) lives in a drawer that opens on hover or focus with a mouse, or with the "details"
// button on touch screens. the drawer's text is always in the page, so screen readers get it all
function project(p, onKey) {
  const article = el('article', p.inProgress ? 'project in-progress' : 'project');
  article.id = p.id;
  const art = media(p);
  if (art) article.append(art);

  const face = el('div', 'project-face');
  const head = el('div', 'project-head');
  // the key is a button: it scrolls up and presses that key on the board, which opens this
  // project's panel. it says so, and its name starts with what it shows ("press F")
  const press = el('button', 'press');
  press.type = 'button';
  press.append('press ', el('kbd', null, keyLabel(p.key)), el('span', 'sr', ` on the keyboard to open ${p.title} there`));
  press.title = `opens ${p.title} on the keyboard`;
  press.addEventListener('click', () => onKey?.(p.key));
  head.append(el('h3', null, p.title), press);
  face.append(head, el('p', 'status', p.status));

  const more = el('div', 'project-more');
  more.id = `${p.id}-more`;
  const text = el('div', 'project-text');
  text.append(el('p', null, [p.body].flat()[0]));
  if (p.how) text.append(el('p', 'how', p.how));
  if (p.stack?.length) {
    const tags = el('ul', 'stack');
    tags.setAttribute('aria-label', p.kind ? 'Skills' : 'Built with');
    tags.append(...p.stack.map((t) => el('li', null, t)));
    text.append(tags);
  }
  if (p.links.length) text.append(linkButtons(p.links));
  more.append(text);

  const toggle = el('button', 'details', 'details');
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', more.id);
  toggle.addEventListener('click', () => {
    const open = !article.classList.contains('open');
    article.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'less' : 'details';
  });
  face.append(toggle);

  article.append(face, more);
  return article;
}

// experience, readable without touching a tiny fn key on a phone
function plain(section, id, s) {
  const title = el('h2', 'section-title', s.title);
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
}

export function renderRoles(root, content) {
  const roles = root.querySelector('[data-roles]');
  for (const { at, what } of content.roles) {
    const li = el('li');
    li.append(el('span', 'at', `@${at}`), el('span', null, what));
    roles.append(li);
  }
}

export function renderSections(root, content, { onKey } = {}) {
  renderRoles(root, content);
  root.querySelector('[data-work]')?.append(...content.projects.map((p) => project(p, onKey)));
  for (const section of root.querySelectorAll('[data-plain]')) {
    const s = content.sections?.[section.dataset.plain];
    if (s) plain(section, section.dataset.plain, s);
  }
}

// about.html: the intro, then a section per hobby
export function renderAbout(root, content) {
  const { title, page } = content.sections.about;
  const box = root.querySelector('[data-about]');
  const h1 = el('h1', 'page-title', title);
  const intro = el('div', 'prose intro');
  intro.append(...page.intro.map((t) => el('p', null, t)));
  box.append(h1, intro);
  for (const h of page.hobbies) {
    const section = el('section', 'hobby');
    section.id = h.id;
    const heading = el('h2', null, h.title);
    heading.id = `${h.id}-title`;
    section.setAttribute('aria-labelledby', heading.id);
    section.append(heading, ...[h.body].flat().map((t) => el('p', null, t)));
    box.append(section);
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
