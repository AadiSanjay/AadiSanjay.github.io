// the keycap nav across the top. clicking a cap clicks like a key; on the home page, the cap for
// the section you're reading stays pressed down (aria-current), like a held key.
export function setupNav(nav, { sections = [], onPress, win = window } = {}) {
  const caps = [...nav.querySelectorAll('[data-nav]')];
  for (const cap of caps) cap.addEventListener('click', () => onPress?.(cap.dataset.nav));
  if (!sections.length) return { current: () => null, destroy() {} };

  function mark(id) {
    for (const cap of caps) {
      if (cap.dataset.nav === id) cap.setAttribute('aria-current', 'location');
      else cap.removeAttribute('aria-current');
    }
  }

  // the current section is the last one whose top has scrolled past the upper third of the
  // screen; at the very bottom of the page it's the last section, even if it's short
  let current = null;
  function update() {
    const line = win.innerHeight / 3;
    let id = sections[0].id;
    for (const s of sections) if (s.getBoundingClientRect().top <= line) id = s.id;
    const doc = win.document.documentElement;
    if (win.scrollY > 0 && win.innerHeight + win.scrollY >= doc.scrollHeight - 2) id = sections.at(-1).id;
    if (id !== current) mark((current = id));
  }

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    win.requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  win.addEventListener('scroll', onScroll, { passive: true });
  win.addEventListener('resize', onScroll);
  update();
  return {
    current: () => current,
    update,
    destroy() {
      win.removeEventListener('scroll', onScroll);
      win.removeEventListener('resize', onScroll);
    },
  };
}
