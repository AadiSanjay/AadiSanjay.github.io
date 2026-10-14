# aadisanjay.github.io

My personal website: my projects, on a keyboard I built. Designed by me and built with Claude Code (see [AI use and limitations](#ai-use-and-limitations)).

**Live:** https://aadisanjay.github.io/

Plain HTML/CSS/JavaScript, bundled with [Vite](https://vite.dev), tested with [Vitest](https://vitest.dev), deployed to GitHub Pages by GitHub Actions. No framework, no UI library.

## The interactive feature

Starting in 2022, I built and sold custom mechanical keyboards ([PNW Keyboards](https://www.etsy.com/shop/PNWKeyboards), formerly Floofd Keebs). The homepage is a drawing of my Red Samurai build (Gamakay CK68, 65%), and typing on your real keyboard presses the drawn keys, with the sound of the real board.

- **Keys with a dot open a project** (F = FocusTicker, C = Capsule, K = PNW Keyboards). Esc closes.
- **Hold shift (or click fn) for a second layer**, like QMK firmware: A about, E experience, U education, C contact, R resume. Keys the layer doesn't use fall through to the base layer (QMK's `KC_TRNS`).
- **← / → browse projects**, and a fixed bar at the bottom lists the shortcuts that work (generated from the keymap) next to which build you're typing on.
- **Try my other builds** (picker, or shift + 1-6) re-skins the board in that build's keycap colorway, switches to its sound, and shows a spec card: case, switches, keycaps, mods. The choice is remembered.
- **Sounds are recorded from my own boards**, separately for key presses and releases. Clips are cut from my sound-test videos with an FFT-based tool that measures each board's tone and keeps its most typical presses (see [`tools/`](tools/)). Olivia is the same core build as Blue Samurai, so it shares that board's recording.
- **You can always type.** Keys that don't open anything type into a line on the idle screen (and on build cards, so you can try a board's sound); held keys repeat, and typing on any other card steps back to the typing line. On a build card every letter types, including the project keys, so trying a board never jumps to a project. Typing `hire` opens contact.
- **Cards** close with Esc or their × button (phones have no Esc), and focus goes back to whatever opened them. On each project card below the board, the key badge is a button that presses that key on the board.
- **A plain version is always there.** The projects are also short cards below the board, generated from the same `src/content.js`, and the resume is one click away, so recruiters can skim and keyboard-averse visitors aren't stuck.
- **The "now typing on" label** at the bottom of the screen follows whichever build you pick.

Details that matter: browser shortcuts (cmd/ctrl + anything) and form fields are never hijacked; holding a key doesn't machine-gun the sound; alt-tabbing mid-press doesn't leave shift stuck; space types while the board is on screen but scrolls once you've left it; only keys that do something are tab stops; touch devices get "tap" copy; axe-core reports zero violations on every colorway.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
```

## Tests

```bash
npm test           # vitest, runs once
npm run lint       # eslint
npm run build      # production build into dist/
```

109 tests in `tests/`:

- `keymap.test.js`: layer resolution and fall-through, shift+number → builds, duplicate/reserved key validation, the layout is 16 units wide with 68 unique keys, every recording a build points to exists, saved prefs (garbage values, prototype keys like `toString`, storage that throws).
- `keyboard.test.js`: the real DOM in jsdom. Typing is checked on every build, reached through the picker, shift + number, and a saved build on load. Pressing and clicking keys, unmapped keys, esc, key repeat, browser shortcuts, typing in inputs, keys with an empty `event.code` (virtual keyboards), the shift layer and releasing it on window blur, one-shot fn, the build picker re-skinning and persisting, the typing echo and `hire` easter egg, project text never parsed as HTML.
- `sections.test.js`: the role lines and short project cards render from `content.js`; click-to-copy email, including when the clipboard is blocked.

## CI/CD

- **`.github/workflows/ci.yml`** runs lint → tests → build on every pull request and every push to `main`.
- **Branch protection on `main`** requires the `check` job to pass before a PR can merge.
- **`.github/workflows/deploy.yml`** runs only after CI succeeds on `main`, rebuilds that exact commit, and deploys it to GitHub Pages. (For a `<user>.github.io` repo it builds with base `/`, otherwise `/<repo>/`.)

## Project layout

```
index.html          page shell: hero, keyboard, project cards, now-typing label
src/content.js      roles, projects, about, experience, contact (single source of truth)
src/builds.js       my keyboard builds: specs, colorways, sound clips
src/layout.js       the 68-key CK68 layout and which caps are mods/accents
src/keymap.js       base + shift layers, validation, resolve()
src/keyboard.js     renders the board, handles keys/clicks, cards, build picker
src/sections.js     renders the role lines + project cards, click-to-copy
src/sound.js        plays recordings (Web Audio), synth fallback
tools/              how the sound clips were cut from my videos
```

## AI use and limitations

I built this with Claude Code, an AI coding assistant. I came up with the concept (my own keyboard as the site), picked the reference sites, supplied the boards, photos, sound-test videos, Etsy listings, project write-ups, and resume, and directed each iteration. Claude Code wrote most of the code, the tests, the CI/CD workflows, and the audio-cutting tools, and drafted the about/experience copy from my resume, which I then edited.

Limitations:

- Colorways are picked by eye from photos and videos, not exact keycap color codes.
- Olivia has no recording of its own; it reuses Blue Samurai's because the builds match. Matcha's sound comes from two audio-only recordings matched to it by date, so that match is a best guess.
- The drawn board is too small to read on phones, so the project cards carry the content there.
- Keys are matched by `event.code`, which is a physical position, so on non-QWERTY layouts the letters on the drawn caps won't match yours.
