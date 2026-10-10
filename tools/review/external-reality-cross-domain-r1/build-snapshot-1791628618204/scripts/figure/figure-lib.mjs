import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let sharpModule;

export const ROOT = process.cwd();
export const BASE = 'f7f6362a1bc6738f8cc7ef6a476cb283a0459c28';
export const P = {
  reg: 'content/visual-production/figure/canonical-client-figure-registry-v2.json',
  runtime: 'content/visual-production/figure/figure-visual-accuracy-runtime-v1.json',
  specDir: 'content/visual-production/figure/figure-visual-spec',
  sourceDir: 'content/visual-production/figure/figure-source-bindings',
  prod: 'content/visual-production/figure/figure-production',
  style: 'content/visual-production/figure/figure-production/figure-style-tokens-v1.json',
  grammar: 'content/visual-production/figure/figure-production/diagram-grammar-v1.json',
  localization: 'content/visual-production/figure/figure-production/figure-localization-zh-Hans-v1.json',
  acceptance: 'content/visual-production/figure/figure-production/figure-machine-acceptance-registry-v1.json'
};

export const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
function sortDeep(x) {
  if (Array.isArray(x)) return x.map(sortDeep);
  if (x && typeof x === 'object') {
    const o = {};
    for (const k of Object.keys(x).sort()) o[k] = sortDeep(x[k]);
    return o;
  }
  return x;
}
export const stable = x => JSON.stringify(sortDeep(x), null, 2) + '\n';
export const shaBytes = b => crypto.createHash('sha256').update(b).digest('hex');
export const sha = p => shaBytes(fs.readFileSync(p));
export const ids = () => Array.from({ length: 57 }, (_, i) => `FIG-${String(i + 1).padStart(3, '0')}`);
export function requestedIds(argv = process.argv.slice(2)) {
  const i = argv.indexOf('--id');
  if (i >= 0 && argv[i + 1]) return [argv[i + 1]];
  return ids();
}
export const specPath = id => `${P.specDir}/${id}.visual-spec.json`;
export const sourcePath = id => `${P.sourceDir}/${id}.source-binding.json`;
export const manifestPath = id => `${P.prod}/manifests/${id}.production-manifest.json`;
export const carPath = id => `${P.prod}/car-candidates/${id}.car-handoff.json`;
export function entryById(id) {
  const e = read(P.reg).entries.find(x => x.figureId === id);
  if (!e) throw new Error(`Unknown ${id}`);
  return e;
}
export const svgPath = id => `${P.prod}/output/svg/${entryById(id).canonicalFilename}`;
export const pngPath = id => `${P.prod}/output/png/${entryById(id).canonicalFilename.replace(/\.svg$/i, '.png')}`;

export function esc(s) {
  return String(s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]));
}
export function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
export function writeFile(p, data) { ensureDir(path.dirname(p)); fs.writeFileSync(p, data); }

function wrapLabel(label, max = 22) {
  const words = String(label).split(/\s+/), lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= max || !cur) cur = next;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > 2) return [lines[0], lines.slice(1).join(' ')];
  return lines;
}
function box(x, y, w, h, row = 0, col = 0) {
  return { x: Math.round(x), y: Math.round(y), width: w, height: h, row, col };
}

export function layout(spec, style) {
  const c = style.canvas, g = style.geometry, n = spec.nodes.length, nodes = {};
  if (spec.diagramRole === 'LOOP') {
    const w = 240, h = 112, cx = c.width / 2, cy = 625, rx = 690, ry = 350;
    spec.nodes.forEach((node, i) => {
      const a = -Math.PI / 2 + (2 * Math.PI * i / n);
      nodes[node.nodeId] = box(cx + rx * Math.cos(a) - w / 2, cy + ry * Math.sin(a) - h / 2, w, h, i, 0);
    });
  } else if (spec.diagramRole === 'BOUNDARY' && spec.boundaries.length) {
    const b = spec.boundaries[0], inside = new Set(b.contains), left = spec.nodes.filter(x => inside.has(x.nodeId)), right = spec.nodes.filter(x => !inside.has(x.nodeId));
    const w = 300, h = 112;
    const place = (arr, x0, x1) => arr.forEach((node, i) => {
      const cols = Math.min(2, arr.length), row = Math.floor(i / cols), col = i % cols, step = (x1 - x0) / cols;
      nodes[node.nodeId] = box(x0 + col * step + (step - w) / 2, 260 + row * 180, w, h, row, col);
    });
    place(left, 90, 980); place(right, 1110, 1910);
  } else {
    const cols = n <= 5 ? n : (n <= 8 ? 4 : 3), rows = Math.ceil(n / cols);
    const w = Math.min(g.nodeWidth, Math.floor((c.width - 2 * c.padding - (cols - 1) * g.colGap) / cols)), h = g.nodeHeight;
    const totalW = cols * w + (cols - 1) * g.colGap, x0 = (c.width - totalW) / 2;
    const rowStep = Math.min(h + g.rowGap, (c.height - 310) / Math.max(1, rows));
    spec.nodes.forEach((node, i) => {
      const row = Math.floor(i / cols), raw = i % cols, col = row % 2 === 0 ? raw : cols - 1 - raw;
      nodes[node.nodeId] = box(x0 + col * (w + g.colGap), 210 + row * rowStep, w, h, row, col);
    });
  }

  const boundaries = {};
  for (const b of spec.boundaries) {
    const boxes = b.contains.map(id => nodes[id]).filter(Boolean);
    if (!boxes.length) continue;
    const minX = Math.min(...boxes.map(x => x.x)) - g.boundaryPadding;
    const minY = Math.min(...boxes.map(x => x.y)) - g.boundaryPadding;
    const maxX = Math.max(...boxes.map(x => x.x + x.width)) + g.boundaryPadding;
    const maxY = Math.max(...boxes.map(x => x.y + x.height)) + g.boundaryPadding;
    boundaries[b.boundaryId] = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  const edges = {};
  for (const e of spec.edges) {
    const a = nodes[e.from], b = nodes[e.to];
    if (!a || !b) continue;
    if (spec.diagramRole === 'LOOP') {
      const ac = [a.x + a.width / 2, a.y + a.height / 2], bc = [b.x + b.width / 2, b.y + b.height / 2];
      const cut = (bx, from, to) => {
        const cx = bx.x + bx.width / 2, cy = bx.y + bx.height / 2, vx = to[0] - from[0], vy = to[1] - from[1];
        const tx = Math.abs(vx) > 1e-9 ? (bx.width / 2) / Math.abs(vx) : Infinity;
        const ty = Math.abs(vy) > 1e-9 ? (bx.height / 2) / Math.abs(vy) : Infinity;
        const t = Math.min(tx, ty);
        return [Math.round(cx + vx * t), Math.round(cy + vy * t)];
      };
      const p1 = cut(a, ac, bc), p2 = cut(b, bc, ac);
      edges[e.edgeId] = { points: [p1, p2], mode: 'STRAIGHT' };
    } else {
      const ax = a.x + a.width / 2, ay = a.y + a.height / 2, bx = b.x + b.width / 2, by = b.y + b.height / 2;
      let p1, p2;
      if (Math.abs(bx - ax) > Math.abs(by - ay)) {
        p1 = [bx > ax ? a.x + a.width : a.x, ay];
        p2 = [bx > ax ? b.x : b.x + b.width, by];
        const mid = Math.round((p1[0] + p2[0]) / 2);
        edges[e.edgeId] = { points: [p1, [mid, p1[1]], [mid, p2[1]], p2], mode: 'ORTHO' };
      } else {
        p1 = [ax, by > ay ? a.y + a.height : a.y];
        p2 = [bx, by > ay ? b.y : b.y + b.height];
        const mid = Math.round((p1[1] + p2[1]) / 2);
        edges[e.edgeId] = { points: [p1, [p1[0], mid], [p2[0], mid], p2], mode: 'ORTHO' };
      }
    }
  }
  return { canvas: c, nodes, boundaries, edges };
}

function localizedFigureName(spec, loc) {
  const value = loc.figureNames?.[spec.semanticName];
  if (!value) throw new Error(`${spec.figureId}: missing zh-Hans figure name for ${spec.semanticName}`);
  return value;
}
function localizedNodeLabel(spec, node, loc) {
  const value = loc.labels?.[node.displayLabel];
  if (!value) throw new Error(`${spec.figureId}: missing zh-Hans node label for ${node.displayLabel}`);
  return value;
}

export function renderSvg(spec, style) {
  const L = layout(spec, style), loc = read(P.localization), t = style.domainTokens[spec.domain] || style.domainTokens.GLOBAL, g = style.geometry, ty = style.typography, o = [];
  const zhFigureName = localizedFigureName(spec, loc);
  o.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${style.canvas.width} ${style.canvas.height}" width="${style.canvas.width}" height="${style.canvas.height}" data-figure-id="${esc(spec.figureId)}" data-renderer-version="FIG-RENDERER-1.1.0" data-style-version="${esc(style.styleVersion)}" data-presentation-locales="en,zh-Hans">`);
  o.push(`<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="${t.stroke}"/></marker></defs>`);
  o.push(`<rect width="100%" height="100%" fill="${t.background}"/>`);
  o.push(`<text x="72" y="62" fill="${t.accent}" font-family="${ty.fontFamily}" font-size="30" font-weight="700">${esc(spec.figureId)} · ${esc(spec.semanticName)}</text>`);
  o.push(`<text x="72" y="96" fill="${t.accent}" opacity="0.92" font-family="${ty.fontFamily}" font-size="22" font-weight="600" data-localized-title="zh-Hans">${esc(zhFigureName)}</text>`);
  o.push(`<text x="72" y="128" fill="${t.accent}" opacity="0.70" font-family="${ty.fontFamily}" font-size="${ty.subtitleSize}">${esc(spec.domain)} · ${esc(spec.diagramRole)} · CANONICAL SVG · EN + 简体中文</text>`);

  for (const b of spec.boundaries) {
    const q = L.boundaries[b.boundaryId];
    if (!q) continue;
    o.push(`<g id="boundary-${esc(b.boundaryId)}" data-boundary-type="${esc(b.boundaryType)}"><rect x="${q.x}" y="${q.y}" width="${q.width}" height="${q.height}" rx="24" fill="none" stroke="${t.stroke}" stroke-width="2" stroke-dasharray="10 8" opacity="0.72"/><text x="${q.x + 15}" y="${q.y + 24}" fill="${t.accent}" font-family="${ty.fontFamily}" font-size="${ty.metaSize}">${esc(b.boundaryId)}</text></g>`);
  }

  for (const e of spec.edges) {
    const q = L.edges[e.edgeId];
    if (!q) continue;
    const d = q.points.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
    o.push(`<g id="edge-${esc(e.edgeId)}" data-from="${esc(e.from)}" data-to="${esc(e.to)}" data-relation="${esc(e.relation)}"><path d="${d}" fill="none" stroke="${t.stroke}" stroke-width="${g.edgeWidth}" stroke-linejoin="round" marker-end="url(#arrow)" opacity="0.88"/></g>`);
  }

  for (const n of spec.nodes) {
    const q = L.nodes[n.nodeId], enLines = wrapLabel(n.displayLabel), zh = localizedNodeLabel(spec, n, loc), totalLines = enLines.length + 1, lineGap = 20;
    const startY = q.y + q.height / 2 - ((totalLines - 1) * lineGap) / 2 + 5;
    let text = `<text x="${q.x + q.width / 2}" y="${Math.round(startY)}" text-anchor="middle" fill="${t.accent}" font-family="${ty.fontFamily}" font-size="16" font-weight="700">`;
    enLines.forEach((line, i) => { text += `<tspan x="${q.x + q.width / 2}" dy="${i ? lineGap : 0}">${esc(line)}</tspan>`; });
    text += `<tspan x="${q.x + q.width / 2}" dy="${lineGap}" font-size="15" font-weight="600" opacity="0.86">${esc(zh)}</tspan></text>`;
    o.push(`<g id="node-${esc(n.nodeId)}" data-figure-node="${esc(n.nodeId)}" data-semantic-key="${esc(n.semanticKey)}" data-canonical-label="${esc(n.displayLabel)}" data-localized-label="${esc(zh)}"><rect x="${q.x}" y="${q.y}" width="${q.width}" height="${q.height}" rx="${g.nodeRadius}" fill="${t.panel}" stroke="${t.stroke}" stroke-width="2"/>${text}</g>`);
  }

  o.push(`<text x="72" y="1145" fill="${t.accent}" opacity="0.58" font-family="${ty.fontFamily}" font-size="14">Repository-bound · source-bound · deterministic geometry · bilingual presentation · SVG master + PNG derivative</text>`);
  o.push('</svg>');
  return o.join('\n') + '\n';
}

export const geometryFingerprint = (spec, style) => shaBytes(Buffer.from(stable(layout(spec, style))));
export async function rasterize(svg, png) {
  ensureDir(path.dirname(png));
  try { sharpModule ??= require('sharp'); }
  catch (error) { throw new Error(`Repository raster backend unavailable. Run npm ci. ${error?.message || error}`); }
  const input = fs.readFileSync(svg), image = sharpModule(input, { density: 96, unlimited: false, failOn: 'error' });
  await image.png({ compressionLevel: 6, adaptiveFiltering: false, palette: false, effort: 4 }).toFile(png);
}
