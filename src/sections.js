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
    // say so on the image itself, so a drawing never passes for a screenshot
    if (p.image.illustration) box.append(el('span', 'media-label', 'illustration'));
  }
  return box.childElementCount ? box : null;
}

// a project card. what it is and its links are always on the card; the extras (how it works, the
// tags) show over its image on hover or keyboard focus, or with the details button on touch
// screens. the extras are always in the page, so screen readers get them either way
function project(p, onKey) {
  const article = el('article', ['project', p.inProgress && 'in-progress', p.featured && 'featured'].filter(Boolean).join(' '));
  article.id = p.id;

  const extras = el('div', 'project-extras');
  extras.id = `${p.id}-extras`;
  if (p.how) extras.append(el('p', 'how', p.how));
  if (p.stack?.length) {
    const tags = el('ul', 'stack');
    tags.setAttribute('aria-label', p.kind ? 'Skills' : 'Built with');
    tags.append(...p.stack.map((t) => el('li', null, t)));
    extras.append(tags);
  }
  const art = media(p);
  if (art) {
    if (extras.childElementCount) art.append(extras);
    article.append(art);
  }

  const body = el('div', 'project-body');
  const head = el('div', 'project-head');
  // the key is a button: it scrolls up and presses that key on the board, which opens this
  // project's panel. it says so, and its name starts with what it shows ("press F")
  const press = el('button', 'press');
  press.type = 'button';
  press.append('press ', el('kbd', null, keyLabel(p.key)), el('span', 'sr', ` on the keyboard to open ${p.title} there`));
  press.title = `opens ${p.title} on the keyboard`;
  press.addEventListener('click', () => onKey?.(p.key));
  head.append(el('h3', null, p.title), press);
  body.append(head, el('p', 'status', p.status), el('p', 'blurb', [p.body].flat()[0]));
  if (p.links.length) body.append(linkButtons(p.links));

  if (art && extras.childElementCount) {
    const toggle = el('button', 'details', p.how ? 'how it works' : 'details');
    const label = toggle.textContent;
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', extras.id);
    toggle.addEventListener('click', () => {
      const open = !article.classList.contains('open');
      article.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'hide' : label;
    });
    body.append(toggle);
  }
  article.append(body);
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
