import fs from 'node:fs';
import path from 'node:path';

export const ROOT = process.cwd();
export const BASELINE = '1ebd26901fb63db0753a8fc737ea6423155cf8b0';

export const readText = file =>
  fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/^\uFEFF/, '');

export const readJson = file => JSON.parse(readText(file));

export const exists = file => fs.existsSync(path.join(ROOT, file));

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
