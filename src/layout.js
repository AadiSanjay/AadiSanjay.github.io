// my board: 65% with an ins/del/pgup/pgdn column on the right.
// each key is [event.code, legend, width in units, shifted legend]
const k = (code, label, w = 1, shifted) => ({ code, label, w, shifted });
const letters = (s) => [...s].map((c) => k(`Key${c}`, c));

export const rows = [
  [
    k('Escape', 'Esc'),
    ...[...'1234567890'].map((d, i) => k(`Digit${d}`, d, 1, '!@#$%^&*()'[i])),
    k('Minus', '-', 1, '_'),
    k('Equal', '=', 1, '+'),
    k('Backspace', 'Backspace', 2),
    k('Insert', 'Ins'),
  ],
  [
    k('Tab', 'Tab', 1.5),
    ...letters('QWERTYUIOP'),
    k('BracketLeft', '[', 1, '{'),
    k('BracketRight', ']', 1, '}'),
    k('Backslash', '\\', 1.5, '|'),
    k('Delete', 'Del'),
  ],
  [
    k('CapsLock', 'CapsLock', 1.75),
    ...letters('ASDFGHJKL'),
    k('Semicolon', ';', 1, ':'),
    k('Quote', "'", 1, '"'),
    k('Enter', 'Enter', 2.25),
    k('PageUp', 'PgUp'),
  ],
  [
    k('ShiftLeft', 'Shift', 2.25),
    ...letters('ZXCVBNM'),
    k('Comma', ',', 1, '<'),
    k('Period', '.', 1, '>'),
    k('Slash', '/', 1, '?'),
    k('ShiftRight', 'Shift', 1.75),
    k('ArrowUp', '↑'),
    k('PageDown', 'PgDn'),
  ],
  [
    k('ControlLeft', 'Ctrl', 1.25),
    k('MetaLeft', 'Win', 1.25),
    k('AltLeft', 'Alt', 1.25),
    k('Space', '', 6.25),
    k('AltRight', 'Alt'),
    k('Fn', 'Fn'),
    k('ControlRight', 'Ctrl'),
    k('ArrowLeft', '←'),
    k('ArrowDown', '↓'),
    k('ArrowRight', '→'),
  ],
];

// colorway: yellow accents, charcoal mods, red everything else
const ACCENTS = new Set(['Escape', 'Backspace', 'Enter', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);
const MODS = new Set([
  'Tab', 'CapsLock', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
  'MetaLeft', 'AltLeft', 'AltRight', 'Fn', 'Insert', 'Delete', 'PageUp', 'PageDown',
]);

export function capColor(code) {
  if (ACCENTS.has(code)) return 'accent';
  if (MODS.has(code)) return 'mod';
  return 'alpha';
}
