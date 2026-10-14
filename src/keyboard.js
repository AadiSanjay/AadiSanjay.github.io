import { rows, capColor } from './layout.js';
import { buildKeymap, resolve } from './keymap.js';
import { switches, loadSwitch, saveSwitch } from './switches.js';
import { getPref, setPref } from './prefs.js';

const SHIFTS = new Set(['ShiftLeft', 'ShiftRight']);
const MODIFIERS = new Set([...SHIFTS, 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight']);

export function mountKeyboard(root, { content, sound, storage, win = window }) {
  const board = root.querySelector('[data-board]');
  const display = root.querySelector('[data-display]');
  const picker = root.querySelector('[data-switches]');
  const soundBtn = root.querySelector('[data-sound]');
  const list = root.querySelector('[data-list]');
  const listBtn = root.querySelector('[data-list-toggle]');

  const keymap = buildKeymap(content);
  const projects = new Map(content.projects.map((p) => [p.id, p]));
  const idle = [...display.childNodes].map((n) => n.cloneNode(true));
  const caps = new Map();

  let shiftHeld = false;
  let fnLatched = false;
  let switchId = loadSwitch(storage);

  const layer = () => (shiftHeld || fnLatched ? 'fn' : 'base');

  function describe(action) {
    if (!action || action.type === 'close') return '';
    if (action.type === 'project') return projects.get(action.id).short;
    if (action.type === 'switch') return switches[action.id].label.toLowerCase();
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
        const parts = [base && `opens ${projects.get(keymap.base[code].id).title}`, fn && `with shift: ${fn}`];
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

  function run(action) {
    display.dataset.showing = action.type === 'close' ? '' : action.id;
    if (action.type === 'project') {
      const p = projects.get(action.id);
      const key = caps.get(p.key).querySelector('.legend').textContent;
      showCard({ kicker: `[${key}] project`, ...p });
    } else if (action.type === 'section') {
      const s = content.sections[action.id];
      showCard({ kicker: `[shift] ${action.id}`, title: s.title, body: s.body, links: s.links });
    } else if (action.type === 'switch') {
      setSwitch(action.id);
      const s = switches[action.id];
      showCard({ kicker: '[shift] switch', title: `${s.label} switches`, body: `${s.note}. type something.` });
    } else {
      display.replaceChildren(...idle.map((n) => n.cloneNode(true)));
    }
  }

  function act(code) {
    const action = resolve(keymap, layer(), code);
    if (!action) {
      nope(code);
      return false;
    }
    run(action);
    return true;
  }

  // --- input ---
  function tap(code) {
    sound.play(switchId);
    pulse(code);
    if (code === 'Fn') {
      fnLatched = !fnLatched;
      updateLayer();
      return;
    }
    act(code);
    // clicking fn is one-shot: it only applies to the next key
    if (fnLatched) {
      fnLatched = false;
      updateLayer();
    }
  }

  function onKeyDown(e) {
    const target = e.target;
    if (target?.closest?.('input, textarea, select, [contenteditable]')) return;
    if ((e.ctrlKey || e.metaKey || e.altKey) && !MODIFIERS.has(e.code)) return; // leave browser shortcuts alone
    if ((e.code === 'Enter' || e.code === 'Space') && target?.closest?.('button, a')) return; // native click handles it

    const cap = caps.get(e.code);
    if (!cap) return;
    if (SHIFTS.has(e.code)) {
      shiftHeld = true;
      updateLayer();
    }
    if (e.repeat) {
      if (resolve(keymap, layer(), e.code)) e.preventDefault();
      return;
    }

    cap.classList.add('down');
    sound.play(switchId);
    if (MODIFIERS.has(e.code)) return;
    if (act(e.code)) e.preventDefault();
  }

  function onKeyUp(e) {
    caps.get(e.code)?.classList.remove('down');
    if (SHIFTS.has(e.code)) {
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

  board.addEventListener('click', (e) => {
    const cap = e.target.closest('.cap');
    if (cap) tap(cap.dataset.code);
  });
  win.addEventListener('keydown', onKeyDown);
  win.addEventListener('keyup', onKeyUp);
  win.addEventListener('blur', releaseAll);

  // --- switch picker ---
  function setSwitch(id) {
    switchId = id;
    saveSwitch(storage, id);
    root.dataset.switch = id;
    root.style.setProperty('--travel', switches[id].travel);
    root.style.setProperty('--press', switches[id].ease);
    root.style.setProperty('--stem', switches[id].stem);
    for (const input of picker.querySelectorAll('input')) input.checked = input.value === id;
  }

  for (const [id, s] of Object.entries(switches)) {
    const label = document.createElement('label');
    label.innerHTML = `<input type="radio" name="switch"><span class="stem"></span><span class="name"></span>`;
    label.querySelector('input').value = id;
    label.querySelector('.stem').style.background = s.stem;
    label.querySelector('.name').textContent = s.label;
    label.querySelector('input').addEventListener('change', () => setSwitch(id));
    picker.append(label);
  }
  setSwitch(switchId);

  // --- sound + list toggles ---
  function setSound(on) {
    sound.setEnabled(on);
    setPref(storage, 'sound', on ? 'on' : 'off');
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.textContent = on ? 'sound: on' : 'sound: off';
  }
  soundBtn.addEventListener('click', () => setSound(soundBtn.getAttribute('aria-pressed') !== 'true'));
  setSound(getPref(storage, 'sound', 'on') === 'on');

  for (const p of content.projects) {
    const li = document.createElement('li');
    li.innerHTML = `<kbd></kbd> <strong></strong> <span></span><p></p>`;
    li.querySelector('kbd').textContent = caps.get(p.key).querySelector('.legend').textContent;
    li.querySelector('strong').textContent = p.title;
    li.querySelector('span').textContent = p.status ? `· ${p.status}` : '';
    li.querySelector('p').textContent = [p.body].flat()[0];
    for (const { label, href } of p.links) {
      const a = document.createElement('a');
      a.className = 'btn';
      a.href = href;
      a.textContent = `${label} ↗`;
      li.append(a);
    }
    list.querySelector('ul').append(li);
  }
  function setList(open) {
    list.hidden = !open;
    listBtn.setAttribute('aria-expanded', String(open));
  }
  listBtn.addEventListener('click', () => setList(list.hidden));
  // the board gets too small to read on phones, so start with the list there
  setList(!!win.matchMedia?.('(max-width: 640px)').matches);

  updateLayer();

  return {
    tap,
    setSwitch,
    get layer() {
      return layer();
    },
    destroy() {
      win.removeEventListener('keydown', onKeyDown);
      win.removeEventListener('keyup', onKeyUp);
      win.removeEventListener('blur', releaseAll);
    },
  };
}
