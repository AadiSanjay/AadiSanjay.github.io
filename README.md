# personal-site

My personal website. Built with plain HTML/CSS/JS and [Vite](https://vite.dev); tested with [Vitest](https://vitest.dev).

**Live:** _TODO: https://<username>.github.io/<repo>/_

## Interactive feature

The homepage is a drawing of my actual keyboard (65%, red/charcoal/yellow keycaps). Typing on your real keyboard presses the drawn keys:

- keys with a dot open a project
- holding **shift** (or clicking **fn**) switches to a second layer, like QMK firmware: about, contact, resume, and switch types
- the **switch picker** (linear / tactile / clicky) changes the sound and how the caps move, and is remembered between visits
- unmapped keys wiggle; browser shortcuts (cmd/ctrl+anything) and form fields are left alone
- on phones the board is too small to read, so a plain project list opens by default

Sounds are synthesized with the Web Audio API for now.

## Setup

```bash
npm install
npm run dev      # local dev server
```

## Tests

```bash
npm test         # vitest, runs once
npm run lint     # eslint
npm run build    # production build into dist/
```

Tests live in `tests/`:

- `keymap.test.js` - layer resolution, fn falling through to base, duplicate/reserved key validation, the layout really is 16u wide with 68 keys, saved switch prefs (including garbage and storage that throws)
- `keyboard.test.js` - the real DOM in jsdom: pressing/clicking keys opens projects, unmapped keys, esc, key-repeat not spamming sound, browser shortcuts ignored, shift layer + releasing on window blur, one-shot fn, switch picker persistence, sound/list toggles, project text never parsed as HTML

## CI/CD

- `.github/workflows/ci.yml` runs lint, tests, and build on every pull request and on every push to `main`.
- `main` is protected: the `check` job must pass before a PR can merge.
- `.github/workflows/deploy.yml` runs after CI succeeds on `main`, rebuilds that exact commit, and deploys it to GitHub Pages.

## AI use

_TODO: be specific and honest._ e.g. Claude Code was used to scaffold the repo, test setup, and CI/CD workflows. Design, illustrations, and content are my own. Limitations: ...
