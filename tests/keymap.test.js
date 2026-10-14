import { describe, it, expect } from 'vitest';
import { buildKeymap, resolve } from '../src/keymap.js';
import { loadBuild, DEFAULT_BUILD, buildIds } from '../src/builds.js';
import { rows } from '../src/layout.js';

const project = (id, key) => ({ id, key, short: id, title: id, blurb: '', tags: [], links: [] });
const keymap = buildKeymap({ projects: [project('alpha', 'KeyA'), project('sched', 'KeyS')] });

describe('resolve', () => {
  it('maps a project key on the base layer', () => {
    expect(resolve(keymap, 'base', 'KeyS')).toEqual({ type: 'project', id: 'sched' });
  });

  it('uses the fn layer when it has something for that key', () => {
    expect(resolve(keymap, 'fn', 'KeyA')).toEqual({ type: 'section', id: 'about' });
    expect(resolve(keymap, 'base', 'KeyA')).toEqual({ type: 'project', id: 'alpha' });
  });

  it('falls through to base for keys fn leaves empty', () => {
    expect(resolve(keymap, 'fn', 'KeyS')).toEqual({ type: 'project', id: 'sched' });
  });

  it('shift + number picks each build in order', () => {
    buildIds.forEach((id, i) => {
      expect(resolve(keymap, 'fn', `Digit${i + 1}`)).toEqual({ type: 'build', id });
    });
    expect(resolve(keymap, 'fn', `Digit${buildIds.length + 1}`)).toBeNull();
  });

  it('returns null for keys nothing is mapped to', () => {
    expect(resolve(keymap, 'base', 'KeyQ')).toBeNull();
    expect(resolve(keymap, 'fn', 'F13')).toBeNull();
  });
});

describe('buildKeymap', () => {
  it('rejects two projects on the same key', () => {
    expect(() => buildKeymap({ projects: [project('a', 'KeyS'), project('b', 'KeyS')] })).toThrow(/both use KeyS/);
  });

  it('rejects reserved keys', () => {
    expect(() => buildKeymap({ projects: [project('a', 'Escape')] })).toThrow(/reserved/);
  });
});

describe('layout', () => {
  it('every row is 16 units wide, like the real board', () => {
    for (const row of rows) expect(row.reduce((sum, key) => sum + key.w, 0)).toBe(16);
  });

  it('has 68 keys with unique codes', () => {
    const codes = rows.flat().map((key) => key.code);
    expect(codes).toHaveLength(68);
    expect(new Set(codes).size).toBe(68);
  });
});

describe('loadBuild', () => {
  const store = (value) => ({ getItem: () => value });

  it('loads a saved build', () => {
    expect(loadBuild(store('olivia'))).toBe('olivia');
  });

  it('falls back on garbage, prototype keys, or nothing saved', () => {
    expect(loadBuild(store('blue-ish'))).toBe(DEFAULT_BUILD);
    expect(loadBuild(store('toString'))).toBe(DEFAULT_BUILD);
    expect(loadBuild(store(null))).toBe(DEFAULT_BUILD);
    expect(loadBuild(null)).toBe(DEFAULT_BUILD);
  });

  it('falls back when storage throws', () => {
    const broken = {
      getItem() {
        throw new Error('SecurityError');
      },
    };
    expect(loadBuild(broken)).toBe(DEFAULT_BUILD);
  });
});
