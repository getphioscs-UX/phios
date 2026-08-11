import fs from 'node:fs';
import path from 'node:path';
export const BASELINE = 'b939293cea3ddbe8afd4ca45b25debb98f30a0a1';
export const ROOT = process.cwd();
export const MPA_ROOT = 'content/professional/method-production-activation';
export const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
export const readJson = relative => JSON.parse(read(relative));
export const exists = relative => fs.existsSync(path.join(ROOT, relative));
export const sorted = values => [...values].sort();
