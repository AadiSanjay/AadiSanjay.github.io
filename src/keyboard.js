import { rows, capColor } from './layout.js';
import { buildKeymap, resolve } from './keymap.js';
import { builds, buildIds, loadBuild, saveBuild } from './builds.js';
import { getPref, setPref } from './prefs.js';

const SHIFTS = new Set(['ShiftLeft', 'ShiftRight']);
const MODIFIERS = new Set([...SHIFTS, 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight']);

const NAMED = { ' ': 'Space', Escape: 'Escape', Enter: 'Enter', Backspace: 'Backspace', Tab: 'Tab', Shift: 'ShiftLeft' };

// some virtual keyboards and IMEs leave event.code empty, so work it out from event.key
export function codeOf(e) {
  if (e.code) return e.code;
  if (/^[a-z]$/i.test(e.key)) return `Key${e.key.toUpperCase()}`;
  if (/^[0-9]$/.test(e.key)) return `Digit${e.key}`;
  return NAMED[e.key] ?? '';
}

export function mountKeyboard(root, { content, sound, storage, win = window }) {
  const board = root.querySelector('[data-board]');
  const display = root.querySelector('[data-display]');
  const picker = root.querySelector('[data-builds]');
  const soundBtn = root.querySelector('[data-sound]');

  const keymap = buildKeymap(content);
  const projects = new Map(content.projects.map((p) => [p.id, p]));
  const idle = [...display.childNodes].map((n) => n.cloneNode(true));
  const caps = new Map();

  let shiftHeld = false;
  let fnLatched = false;
  let buildId = loadBuild(storage);

  const layer = () => (shiftHeld || fnLatched ? 'fn' : 'base');

  function describe(action) {
    if (!action || action.type === 'close') return '';
    if (action.type === 'project') return projects.get(action.id).short;
    if (action.type === 'browse') return action.step > 0 ? 'next' : 'prev';
    if (action.type === 'build') return builds[action.id].name.toLowerCase();
    return action.id;
  }

  // --- the board ---
  for (const row of rows) {
    const rowEl = document.createElement('div');
    rowEl.className = 'row';
    for (const { code, label, w, shifted } of row) {
      const base = describe(keymap.base[code]);
      const fn = describe(keymap.fn[code]);

      const cap = document.createElement('button');
      cap.type = 'button';
      cap.className = `cap cap-${capColor(code)}`;
      cap.dataset.code = code;
      cap.style.setProperty('--w', w);
      cap.classList.toggle('has-base', !!base);
      cap.classList.toggle('has-fn', !!fn);
      cap.innerHTML = `<span class="top"><span class="legend"></span><span class="sub sub-base"></span><span class="sub sub-fn"></span></span>`;
      cap.querySelector('.legend').textContent = shifted ? `${shifted}\n${label}` : label;
      cap.querySelector('.sub-base').textContent = base;
      cap.querySelector('.sub-fn').textContent = fn;

      if (base || fn || code === 'Fn') {
        const b = keymap.base[code];
        const what = b?.type === 'project' ? `opens ${projects.get(b.id).title}` : b?.type === 'browse' ? `${base} project` : '';
        const parts = [what, fn && `with shift: ${fn}`];
        cap.setAttribute('aria-label', `${label} key, ${parts.filter(Boolean).join(', ') || 'toggles the fn layer'}`);
      } else {
        // decorative. 60 tab stops of nothing would be miserable.
        cap.tabIndex = -1;
        cap.setAttribute('aria-hidden', 'true');
      }

      caps.set(code, cap);
      rowEl.append(cap);
    }
    board.append(rowEl);
  }

  const hints = root.querySelector('[data-hints]');
  if (hints) {
    const items = [
      ...content.projects.map((p) => [[caps.get(p.key).querySelector('.legend').textContent], p.title]),
      [['←', '→'], 'browse'],
      [['shift'], 'about, contact & more'],
      [['esc'], 'back'],
    ];
    for (const [keys, what] of items) {
      const li = document.createElement('li');
      for (const k of keys) {
        const kbd = document.createElement('kbd');
        kbd.textContent = k;
        li.append(kbd);
      }
      li.append(` ${what}`);
      hints.append(li);
    }
  }

  function updateLayer() {
    board.dataset.layer = layer();
    caps.get('Fn').setAttribute('aria-pressed', String(fnLatched));
  }

  function pulse(code) {
    const cap = caps.get(code);
    cap.classList.add('down');
    win.setTimeout(() => cap.classList.remove('down'), 90);
  }

  function nope(code) {
    const cap = caps.get(code);
    cap.classList.remove('nope');
    void cap.offsetWidth; // restart the animation
    cap.classList.add('nope');
  }

  // --- the display ---
  function showCard({ kicker, title, status, body, stack = [], links = [] }) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `<p class="kicker"></p><h2></h2><p class="status"></p><div class="body"></div><ul class="stack"></ul><p class="links"></p>`;
    card.querySelector('.kicker').textContent = kicker;
    card.querySelector('h2').textContent = title;
    card.querySelector('.status').textContent = status ?? '';
    for (const text of [body].flat()) {
      const para = document.createElement('p');
      para.textContent = text;
      card.querySelector('.body').append(para);
    }
    for (const t of stack) {
      const li = document.createElement('li');
      li.textContent = t;
      card.querySelector('.stack').append(li);
    }
    for (const { label, href } of links) {
      const a = document.createElement('a');
      a.className = 'btn';
      a.href = href;
      a.textContent = `${label} ↗`;
      if (/^https?:/.test(href)) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      card.querySelector('.links').append(a);
    }
    display.replaceChildren(card);
  }

  // ← / → walk through the projects in order, wrapping around
  function browse(step) {
    const ids = content.projects.map((p) => p.id);
    const at = ids.indexOf(display.dataset.showing);
    const next = at === -1 ? (step > 0 ? 0 : ids.length - 1) : (at + step + ids.length) % ids.length;
    run({ type: 'project', id: ids[next] });
  }

  function run(action) {
    if (action.type === 'browse') return browse(action.step);
    display.dataset.showing = action.type === 'close' ? '' : action.id;
    if (action.type === 'project') {
      const p = projects.get(action.id);
      const key = caps.get(p.key).querySelector('.legend').textContent;
      showCard({ kicker: `[${key}] project`, ...p });
    } else if (action.type === 'section') {
      const s = content.sections[action.id];
      showCard({ kicker: `[shift] ${action.id}`, title: s.title, body: s.body, links: s.links });
    } else if (action.type === 'build') {
      setBuild(action.id);
      const b = builds[action.id];
      showCard({
        kicker: `[shift] build ${buildIds.indexOf(action.id) + 1}/${buildIds.length}`,
        title: b.name,
        status: `${b.case} · ${b.switches} · ${b.keycaps}`,
        body: [b.note, b.samples.length ? 'The sound is recorded from this exact board. Type something.' : 'No clean recording of this one yet, so the sound is approximated. Type something.'],
        stack: b.mods,
        links: [{ label: b.link.includes('/listing/') ? 'The listing' : 'My old Etsy shop', href: b.link }],
      });
    } else {
      display.replaceChildren(...idle.map((n) => n.cloneNode(true)));
      typed = '';
    }
  }

  let typed = '';
  function echo(char) {
    if (display.dataset.showing) return; // only while the idle screen is up
    if (char === 'Backspace') typed = typed.slice(0, -1);
    else if (char.length === 1) typed = (typed + char).slice(-32);
    else return;
    const line = display.querySelector('.echo');
    if (line) line.textContent = typed;
    if (/hire$/i.test(typed)) {
      typed = '';
      run({ type: 'section', id: 'contact' });
    }
  }

  function act(code, char) {
    const action = resolve(keymap, layer(), code);
    if (!action) {
      nope(code);
      echo(char);
      return false;
    }
    run(action);
    return true;
  }

  // --- input ---
  function tap(code) {
    sound.play(buildId);
    pulse(code);
    if (code === 'Fn') {
      fnLatched = !fnLatched;
      updateLayer();
      return;
    }
    act(code, code === 'Backspace' ? code : caps.get(code).querySelector('.legend').textContent.slice(-1).toLowerCase());
    // clicking fn is one-shot: it only applies to the next key
    if (fnLatched) {
      fnLatched = false;
      updateLayer();
    }
  }

  function onKeyDown(e) {
    const code = codeOf(e);
    const target = e.target;
    if (target?.closest?.('input, textarea, select, [contenteditable]')) return;
    if ((e.ctrlKey || e.metaKey || e.altKey) && !MODIFIERS.has(code)) return; // leave browser shortcuts alone
    if ((code === 'Enter' || code === 'Space') && target?.closest?.('button, a')) return; // native click handles it

    const cap = caps.get(code);
    if (!cap) return;
    // trust the event's own shift flag too, in case we missed the shift keydown (focus changes, synthetic input)
    const shift = SHIFTS.has(code) || !!e.shiftKey;
    if (shift !== shiftHeld) {
      shiftHeld = shift;
      updateLayer();
    }
    if (e.repeat) {
      if (resolve(keymap, layer(), code)) e.preventDefault();
      return;
    }

    cap.classList.add('down');
    sound.play(buildId);
    if (MODIFIERS.has(code)) return;
    if (act(code, e.key)) e.preventDefault();
    // space is for typing while you're at the keyboard, and for scrolling once you've left it
    else if (code === 'Space' && boardVisible) e.preventDefault();
  }

  function onKeyUp(e) {
    const code = codeOf(e);
    caps.get(code)?.classList.remove('down');
    if (SHIFTS.has(code)) {
      shiftHeld = false;
      updateLayer();
    }
  }

  // alt-tabbing away mid-press means we never see the keyup
  function releaseAll() {
    for (const cap of caps.values()) cap.classList.remove('down');
    shiftHeld = false;
    updateLayer();
  }

  let boardVisible = true;
  const observer = win.IntersectionObserver
    ? new win.IntersectionObserver(([entry]) => (boardVisible = entry.isIntersecting))
    : null;
  observer?.observe(board);

  board.addEventListener('click', (e) => {
    const cap = e.target.closest('.cap');
    if (cap) tap(cap.dataset.code);
  });
  win.addEventListener('keydown', onKeyDown);
  win.addEventListener('keyup', onKeyUp);
  win.addEventListener('blur', releaseAll);

  // --- build picker: re-skins the board in that build's colorway ---
  const cssName = (key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

  function setBuild(id) {
    buildId = id;
    saveBuild(storage, id);
    sound.preload?.(id);
    root.dataset.build = id;
    for (const [key, value] of Object.entries(builds[id].colors)) {
      board.style.setProperty(`--${cssName(key)}`, value);
    }
    for (const input of picker.querySelectorAll('input')) input.checked = input.value === id;
    for (const node of document.querySelectorAll('[data-build-name]')) node.textContent = builds[id].name;
    for (const node of document.querySelectorAll('[data-build-spec]')) {
      node.textContent = `${builds[id].case} · ${builds[id].switches}`;
    }
  }

  buildIds.forEach((id, i) => {
    const b = builds[id];
    const label = document.createElement('label');
    label.innerHTML = `<input type="radio" name="build"><span class="swatch" aria-hidden="true"></span><span class="name"></span>`;
    label.querySelector('input').value = id;
    label.querySelector('.swatch').style.background = `linear-gradient(135deg, ${b.colors.alpha} 50%, ${b.colors.mod} 50%)`;
    label.querySelector('.name').textContent = b.name;
    label.title = `shift + ${i + 1}`;
    label.querySelector('input').addEventListener('change', () => run({ type: 'build', id }));
    picker.append(label);
  });
  setBuild(buildId);

  // --- sound toggle ---
  function setSound(on) {
    sound.setEnabled(on);
    setPref(storage, 'sound', on ? 'on' : 'off');
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.textContent = on ? 'sound: on' : 'sound: off';
  }
  soundBtn.addEventListener('click', () => setSound(soundBtn.getAttribute('aria-pressed') !== 'true'));
  setSound(getPref(storage, 'sound', 'on') === 'on');

  updateLayer();

  return {
    tap,
    setBuild,
    get layer() {
      return layer();
    },
    destroy() {
      win.removeEventListener('keydown', onKeyDown);
      win.removeEventListener('keyup', onKeyUp);
      win.removeEventListener('blur', releaseAll);
      observer?.disconnect();
    },
  };
}
