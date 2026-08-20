import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const ROOT = process.cwd();
export const rel = p => path.join(ROOT, p);
export const readJson = p => JSON.parse(fs.readFileSync(rel(p), 'utf8'));
export const writeJson = (p, value) => {
  fs.mkdirSync(path.dirname(rel(p)), { recursive: true });
  fs.writeFileSync(rel(p), `${JSON.stringify(value, null, 2)}\n`);
};
export const now = () => new Date().toISOString();
export const sha256 = value => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export const argValue = name => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
};
export const hasArg = name => process.argv.includes(name);
export const normalizeBase = value => {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('HPC2_PRE_PUBLIC_ASSET_BASE_URL_REQUIRED');
  const u = new URL(raw);
  if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash) throw new Error('HPC2_PRE_PUBLIC_ASSET_BASE_URL_INVALID');
  return u.toString().replace(/\/$/, '');
};
export const encodedKey = key => String(key).split('/').map(encodeURIComponent).join('/');
export const criticalCodes = Object.freeze([
  'HERO-001', 'BOOK-1-HARDCOVER', 'BOOK-2-HARDCOVER', 'BOOK-3-HARDCOVER', 'BOOK-4-HARDCOVER', 'BOOK-5-HARDCOVER',
  'FIG-001', 'FIG-002', 'FIG-003', 'FIG-004', 'FIG-005', 'FIG-006', 'FIG-054', 'FIG-055', 'FIG-056', 'FIG-057'
]);
export const homepagePriorityIcons = Object.freeze(['ICON-003','ICON-006','ICON-007','ICON-008','ICON-009','ICON-010','ICON-011','ICON-012','ICON-013','ICON-014','ICON-015','ICON-018']);
export const homepageFigureCodes = Object.freeze(['FIG-001','FIG-002','FIG-003','FIG-004','FIG-005','FIG-006','FIG-054','FIG-055','FIG-056','FIG-057']);
export function webpDimensions(buffer) {
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
  let off = 12;
  while (off + 8 <= buffer.length) {
    const type = buffer.toString('ascii', off, off + 4);
    const size = buffer.readUInt32LE(off + 4);
    const data = off + 8;
    if (type === 'VP8X' && data + 10 <= buffer.length) {
      const w = 1 + buffer[data + 4] + (buffer[data + 5] << 8) + (buffer[data + 6] << 16);
      const h = 1 + buffer[data + 7] + (buffer[data + 8] << 8) + (buffer[data + 9] << 16);
      return { width: w, height: h };
    }
    if (type === 'VP8 ' && data + 10 <= buffer.length && buffer[data + 3] === 0x9d && buffer[data + 4] === 0x01 && buffer[data + 5] === 0x2a) {
      return { width: buffer.readUInt16LE(data + 6) & 0x3fff, height: buffer.readUInt16LE(data + 8) & 0x3fff };
    }
    if (type === 'VP8L' && data + 5 <= buffer.length && buffer[data] === 0x2f) {
      const bits = buffer[data+1] | (buffer[data+2] << 8) | (buffer[data+3] << 16) | (buffer[data+4] << 24);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
    }
    off = data + size + (size % 2);
  }
  return null;
}
export function svgAudit(text) {
  const svg = String(text || '');
  const open = svg.match(/<svg\b[^>]*>/i)?.[0] || '';
  const viewBox = open.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1] || null;
  const width = open.match(/\bwidth\s*=\s*["']([^"']+)["']/i)?.[1] || null;
  const height = open.match(/\bheight\s*=\s*["']([^"']+)["']/i)?.[1] || null;
  const scriptPresent = /<script\b/i.test(svg) || /\bon\w+\s*=/i.test(svg);
  const externalActiveContentPresent = /<(?:iframe|object|embed)\b/i.test(svg) || /(?:href|xlink:href)\s*=\s*["'](?:https?:|\/\/|data:text\/html)/i.test(svg);
  return { validSvg: /^\s*(?:<\?xml[^>]*>\s*)?(?:<!--.*?-->\s*)*<svg\b/is.test(svg), viewBox, width, height, scriptPresent, externalActiveContentPresent };
}
