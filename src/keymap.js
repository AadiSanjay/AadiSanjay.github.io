const RESERVED = new Set(['Escape', 'ShiftLeft', 'ShiftRight', 'Fn']);

// two layers, like qmk. base = projects, fn = everything else.
export function buildKeymap(content) {
  const base = { Escape: { type: 'close' } };
  for (const p of content.projects) {
    if (RESERVED.has(p.key)) throw new Error(`${p.id} can't use reserved key ${p.key}`);
    if (base[p.key]) throw new Error(`${p.id} and ${base[p.key].id} both use ${p.key}`);
    base[p.key] = { type: 'project', id: p.id };
  }

  const fn = {
    KeyA: { type: 'section', id: 'about' },
    KeyC: { type: 'section', id: 'contact' },
    KeyE: { type: 'section', id: 'experience' },
    KeyR: { type: 'section', id: 'resume' },
    Digit1: { type: 'switch', id: 'linear' },
    Digit2: { type: 'switch', id: 'tactile' },
    Digit3: { type: 'switch', id: 'clicky' },
  };

  return { base, fn };
}

// keys not set on the fn layer fall through to base (qmk's KC_TRNS)
export function resolve(keymap, layer, code) {
  if (layer === 'fn' && keymap.fn[code]) return keymap.fn[code];
  return keymap.base[code] ?? null;
}
