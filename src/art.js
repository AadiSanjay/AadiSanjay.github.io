import { rows, capColor } from './layout.js';
import { builds, buildIds } from './builds.js';

const NS = 'http://www.w3.org/2000/svg';

// one board as svg shapes, in a build's colors. same 68-key layout as the big one
function board(colors, x, y, u) {
  const g = document.createElementNS(NS, 'g');
  const pad = u * 0.22;
  const add = (tag, attrs) => {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    g.append(node);
  };
  add('rect', { x, y, width: 16 * u + pad * 2, height: 5 * u + pad * 2, rx: u * 0.2, fill: colors.case });
  rows.forEach((row, r) => {
    let cx = x + pad;
    for (const { code, w } of row) {
      const kind = capColor(code);
      const inset = u * 0.06;
      add('rect', { x: cx + inset, y: y + pad + r * u + inset, width: w * u - inset * 2, height: u - inset * 2, rx: u * 0.12, fill: colors[`${kind}Side`] });
      add('rect', { x: cx + w * u * 0.14, y: y + pad + r * u + u * 0.1, width: w * u * 0.72, height: u * 0.62, rx: u * 0.1, fill: colors[kind] });
      cx += w * u;
    }
  });
  return g;
}

// every build I've made, two to a row: the card image for PNW Keyboards
export function buildsArt() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 720 450');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Drawings of the ${buildIds.length} keyboards I built: ${buildIds.map((id) => builds[id].name).join(', ')}`);
  const bg = document.createElementNS(NS, 'rect');
  Object.entries({ width: 720, height: 450, fill: '#141210' }).forEach(([k, v]) => bg.setAttribute(k, v));
  svg.append(bg);
  const u = 19;
  const w = 16 * u + u * 0.44; // rows are 16 units wide, plus the case's padding
  const h = 5 * u + u * 0.44;
  const gapX = (720 - w * 2) / 3;
  const gapY = (450 - h * 3) / 4;
  buildIds.forEach((id, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    svg.append(board(builds[id].colors, gapX + col * (w + gapX), gapY + row * (h + gapY), u));
  });
  return svg;
}
