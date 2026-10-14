import { describe, it, expect } from 'vitest';
import { buildKeymap, resolve } from '../src/keymap.js';
import { existsSync } from 'node:fs';
import { builds, loadBuild, DEFAULT_BUILD, buildIds } from '../src/builds.js';
import { rows } from '../src/layout.js';
import { content } from '../src/content.js';

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

describe('content.js', () => {
  it('panels stay compact: one description and at most one how-it-works sentence', () => {
    for (const p of content.projects) {
      expect(typeof p.body, p.id).toBe('string');
      if (p.how) expect(p.how.match(/[.!?](\s|$)/g), p.id).toHaveLength(1);
    }
  });
});

describe('sub-legends', () => {
  it('fit on a cap: 7 characters at most, so none get cut off mid-word', () => {
    const shorts = [
      ...content.projects.map((p) => p.short),
      ...Object.values(content.sections).map((s) => s.short),
      ...Object.values(builds).map((b) => b.short),
    ];
    for (const s of shorts) expect(s?.length, s).toBeLessThanOrEqual(7);
  });
});

describe('buildKeymap', () => {
  it('my real content.js builds a valid keymap', () => {
    expect(() => buildKeymap(content)).not.toThrow();
    for (const action of Object.values(buildKeymap(content).fn)) {
      if (action.type === 'section') expect(content.sections[action.id], action.id).toBeDefined();
    }
    const codes = new Set(rows.flat().map((key) => key.code));
    for (const p of content.projects) expect(codes.has(p.key), `${p.id} uses ${p.key}`).toBe(true);
  });

  it('rejects two projects on the same key', () => {
    expect(() => buildKeymap({ projects: [project('a', 'KeyS'), project('b', 'KeyS')] })).toThrow(/both use KeyS/);
  });

  it('rejects reserved keys', () => {
    expect(() => buildKeymap({ projects: [project('a', 'Escape')] })).toThrow(/reserved/);
    expect(() => buildKeymap({ projects: [project('a', 'ArrowRight')] })).toThrow(/reserved/);
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

describe('builds', () => {
  it('every recording a build points to exists in public/sounds', () => {
    for (const id of buildIds) {
      for (const url of [...builds[id].samples.down, ...builds[id].samples.up]) {
        expect(existsSync(new URL(`../public${url}`, import.meta.url)), url).toBe(true);
      }
    }
  });

  it('every build with releases also has presses', () => {
    for (const id of buildIds) {
      if (builds[id].samples.up.length) expect(builds[id].samples.down.length, id).toBeGreaterThan(0);
    }
  });

  it('every build defines a case color plus all nine keycap colors', () => {
    for (const id of buildIds) expect(Object.keys(builds[id].colors)).toHaveLength(10);
  });
});

describe('builds', () => {
  it('Olivia plays the Blue Samurai recordings', () => {
    expect(builds.olivia.samples).toEqual(builds['blue-samurai'].samples);
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
