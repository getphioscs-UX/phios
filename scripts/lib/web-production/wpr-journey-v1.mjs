import fs from 'node:fs';

export const BASELINE = '1ebd26901fb63db0753a8fc737ea6423155cf8b0';
export const canonicalStageOrder = Object.freeze([
  'entry',
  'orientation',
  'reading',
  'reconstruction',
  'navigation',
  'review',
  'continuity',
  'closed'
]);

export function readText(relativePath) {
  return fs.readFileSync(relativePath, 'utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
}

export function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

export function exists(relativePath) {
  return fs.existsSync(relativePath);
}
