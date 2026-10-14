# aadisanjay.github.io

My personal website: my projects, on a keyboard I built. Designed by me and built with Claude Code (see [AI use and limitations](#ai-use-and-limitations)).

**Live:** https://aadisanjay.github.io/

Plain HTML/CSS/JavaScript, bundled with [Vite](https://vite.dev), tested with [Vitest](https://vitest.dev), deployed to GitHub Pages by GitHub Actions. No framework, no UI library.

## How the site is laid out

- **Two pages:** the home page (`index.html`) and an About page (`about.html`).
- **Sidebar:** my name, what I build (software and keyboards), a one-line quote, school and role, and contact links sit in a fixed sidebar on wide screens (a compact header on phones), the same on both pages.
- **Keycap nav:** `home · work · experience · about` across the top are drawn as keycaps. They click with the current build's sound, and on the home page the cap for the section you're reading stays pressed down (`aria-current`).
- **Home, in three separate sections:** the keyboard first (its intro line sits right under the nav), then **Selected work**, then **Experience**. At 1440×900 the top of the work already shows on the first screen.
- **Project cards** always show the title, status, a one-line description, and the links (Chrome Web Store, GitHub, Etsy). The extras, how it works and the tags, appear over the card's own image on hover or keyboard focus, so nothing shifts or covers the next section; on touch screens a "how it works" button shows them. The extras are always in the page, so screen readers get all of it. FocusTicker, the shipped one with users, gets a wide featured card. Its image is its real screenshot; Capsule's is an illustration of its code in progress, labeled "illustration" on the image; PNW Keyboards' is all six of my builds drawn by the site in their real colors (`src/art.js`).
- **Light theme:** warm paper with a faint dot grid, ink text, Red Samurai red and brass accents. The keyboard is the color.

## The interactive feature

Starting in 2022, I built and sold custom mechanical keyboards ([PNW Keyboards](https://www.etsy.com/shop/PNWKeyboards), formerly Floofd Keebs). The homepage is a drawing of my Red Samurai build (Gamakay CK68, 65%), and typing on your real keyboard presses the drawn keys, with the sound of the real board.

- **Keys with a dot open a project** (F = FocusTicker, C = Capsule, K = PNW Keyboards). Esc closes.
- **Hold shift (or click fn) for a second layer**, like QMK firmware: A about (with a link to the About page), E experience, U education, C contact, R resume. Keys the layer doesn't use fall through to the base layer (QMK's `KC_TRNS`).
- **← / → browse projects**, and a fixed bar at the bottom lists the shortcuts that work (generated from the keymap) next to which build you're typing on. It's sticky within the keyboard section, so it rides along the bottom of the screen while you're at the board and rests under the build picker; it never covers the work below, and it steps aside whenever it would sit on the picker or the keys.
- **Try my other builds** (picker, or shift + 1-6) re-skins the board in that build's keycap colorway, switches to its sound, and shows a spec card: case, switches, keycaps, mods. Clicking the build you're already on shows its card too. The choice is remembered.
- **Sounds are recorded from my own boards**, separately for key presses and releases. Clips are cut from my sound-test videos with an FFT-based tool that measures each board's tone and keeps its most typical presses (see [`tools/`](tools/)). Olivia is the same core build as Blue Samurai, so it shares that board's recording.
- **You can always type.** Keys that don't open anything type into a line on the idle screen (and on build cards, so you can try a board's sound); held keys repeat, and typing on any other card steps back to the typing line. On a build card every letter types, including the project keys, so trying a board never jumps to a project. Typing `hire` opens contact.
- **Panels** close with Esc or their × button (phones have no Esc), and focus goes back to whatever opened them. Opening one with a button (clicking or tapping a cap, Enter on a focused cap, or a project card's "press F" button) moves focus to the panel's heading; opening one by typing a letter doesn't steal focus, but Tab goes into the panel next. They're inline, not modal, so there's no focus trap. The panel area above the board has a fixed height, so opening one never moves the keyboard; on wide screens a panel sets its title and specs beside its text, which keeps every panel short enough that the space held for it stays small, and none needs to scroll; the × has its own column, so it never scrolls away or covers text. Smooth scrolling and animations turn off with `prefers-reduced-motion`.
- **A plain version is always there.** Below the board, the projects are cards and Experience is an ordinary section, and About is its own page, all generated from the same `src/content.js` as the board, so they can't drift apart. Nobody has to hit a tiny key on a phone to read them, and the resume is one click away.
- **Shortcuts can be turned off.** Because single letters do things on this page, a "keys: on/off" toggle next to "sound: on" turns them off ([WCAG 2.1.4](https://www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts.html)). Off, the page ignores typing (Esc still closes a panel) and the board still works by click and tap. The choice is remembered.
- **The "now typing on" label** at the bottom of the screen follows whichever build you pick.

Details that matter: browser shortcuts (cmd/ctrl/alt + anything), form fields, and contenteditable areas are never hijacked; holding a key doesn't machine-gun the sound; alt-tabbing mid-press doesn't leave shift stuck; space types while the board is on screen but scrolls once you've left it; the page's native scrollbars are recolored to a brass thumb on a warm dark track (a lighter version on panels) with `scrollbar-color`, plus `::-webkit-scrollbar` for Safari, with no JavaScript scrolling; only keys that do something are tab stops; touch devices get "tap" copy that points to the plain sections; every key is named by its visible legend first, then what it does, so voice-control users can say what they see.

**Accessibility testing:** `tests/a11y.test.js` mounts the real pages (`index.html` and `about.html`, with `style.css` and `content.js`) in jsdom and runs axe-core on every build colorway, on the base and fn layers, with a project panel open, with a project card's extras shown, and on the About page, and fails on any violation. jsdom can't render colors, so axe's color-contrast rule is off in that test; contrast was checked with axe in a real browser (Chromium) on every colorway and on the About page.

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

163 tests in `tests/`:

- `keymap.test.js`: every key's sub-legend fits on its cap (7 characters max), project panels stay compact (one description, at most one how sentence), layer resolution and fall-through, shift+number → builds, duplicate/reserved key validation, the layout is 16 units wide with 68 unique keys, every recording a build points to exists, saved prefs (garbage values, prototype keys like `toString`, storage that throws).
- `keyboard.test.js`: the real DOM in jsdom. Typing is checked on every build, reached through the picker, shift + number, and a saved build on load. Pressing and clicking keys, unmapped keys, esc, key repeat, browser shortcuts, typing in inputs, keys with an empty `event.code` (virtual keyboards), the shift layer and releasing it on window blur, one-shot fn, the build picker re-skinning and persisting, the typing echo and `hire` easter egg, project text never parsed as HTML, panel focus (button vs. typing, focus returning on close, reduced-motion scrolling), the keys toggle (off ignores typing but not clicks or Esc, persists, survives broken storage), alt and contenteditable never triggering shortcuts, the panel's one how-it-works sentence and its kind (the keyboard shop isn't called a "project"), Shift+A's "Read more →" link to the About page, the shortcuts bar hiding when the board scrolls away or when it would cover the picker or keys, and clicking the current build.
- `a11y.test.js`: axe-core on both real pages: every build, base and fn layers, a panel open, a card's extras shown (see above).
- `nav.test.js`: both pages share the same keycap nav and sidebar, every link points somewhere real, the About page marks its own cap, and the scroll tracking (which cap is pressed as you scroll, the last section at the very bottom, cleanup).
- `sections.test.js`: the role lines, project cards (status, description, and links always shown; how it works and tags as extras over the image; the touch button; FocusTicker featured; Capsule in development with a labeled illustration and no links; PNW Keyboards drawn as every build in its colors), Experience, and the About page (intro, then coding, keyboards, cooking) render from `content.js` (and the shift + E panel uses the same job list); click-to-copy email, including when the clipboard is blocked.

## CI/CD

- **`.github/workflows/ci.yml`** runs lint → tests → build on every pull request and every push to `main`.
- **Branch protection on `main`** requires the `check` job to pass before a PR can merge. It's enforced for everyone except repo admins, so as the owner I can still override it (GitHub's branch API shows `required_status_checks: ["check"]`, `enforcement_level: "non_admins"`).
- **`.github/workflows/deploy.yml`** runs only after CI succeeds on `main`, rebuilds that exact commit, and deploys it to GitHub Pages. (For a `<user>.github.io` repo it builds with base `/`, otherwise `/<repo>/`.)

## Project layout

```
index.html          home: keycap nav, sidebar, keyboard, selected work, experience, now-typing bar
about.html          the About page: same nav and sidebar
src/main.js         wires up the home page; src/about.js wires up the About page
src/content.js      roles, projects, about (panel + page), experience, contact (single source of truth)
src/builds.js       my keyboard builds: specs, colorways, sound clips
src/layout.js       the 68-key CK68 layout and which caps are mods/accents
src/keymap.js       base + shift layers, validation, resolve()
src/keyboard.js     renders the board, handles keys/clicks, cards, build picker
src/sections.js     renders the role lines, project cards, experience, the About page, click-to-copy
src/nav.js          the keycap nav: clicks, and which section you're in
src/art.js          draws all my builds as SVG for the PNW Keyboards card
src/sound.js        plays recordings (Web Audio), synth fallback
tools/              how the sound clips were cut from my videos
```

## AI use and limitations

I built this with Claude Code, an AI coding assistant. I came up with the concept (my own keyboard as the site), picked the reference sites, supplied the boards, photos, sound-test videos, Etsy listings, project write-ups, and resume, and directed each iteration. Claude Code wrote most of the code, the tests, the CI/CD workflows, and the audio-cutting tools, and drafted the about/experience copy from my resume, which I then edited. It also drew the two generated card images (Capsule's code illustration and the six-build drawing for PNW Keyboards) in SVG; the FocusTicker image is my real Chrome Web Store screenshot.

Limitations:

- Colorways are matched from my own photos and videos of each build rather than from manufacturer color codes.
- Olivia shares Blue Samurai's recording because it's the same core build. Matcha's sound comes from my December 2022 audio recordings.
- On phones the full board is drawn at about 20 px per key, so the plain sections below it carry the content and the touch hint points there.
- Keys follow physical position (`event.code`), so on non-QWERTY layouts the drawn legends stay QWERTY.
