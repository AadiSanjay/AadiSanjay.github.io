# personal-site

My personal website. Built with plain HTML/CSS/JS and [Vite](https://vite.dev); tested with [Vitest](https://vitest.dev).

**Live:** _TODO: https://<username>.github.io/<repo>/_

## Interactive feature

_TODO: describe the final feature._ Right now: a project gallery filtered by tag, with an empty state and a reset.

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

Tests live in `tests/`. They cover normal use (filtering by a tag, showing everything) and edge cases (a tag with no projects shows the empty state, reset restores everything, project text is never parsed as HTML).

## CI/CD

- `.github/workflows/ci.yml` runs lint, tests, and build on every pull request and on every push to `main`.
- `main` is protected: the `check` job must pass before a PR can merge.
- `.github/workflows/deploy.yml` runs after CI succeeds on `main`, rebuilds that exact commit, and deploys it to GitHub Pages.

## AI use

_TODO: be specific and honest._ e.g. Claude Code was used to scaffold the repo, test setup, and CI/CD workflows. Design, illustrations, and content are my own. Limitations: ...
