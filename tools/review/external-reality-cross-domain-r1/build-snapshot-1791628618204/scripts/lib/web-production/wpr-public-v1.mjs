import fs from 'node:fs';
import path from 'node:path';

export const ROOT = process.cwd();
export const BASELINE = 'b939293cea3ddbe8afd4ca45b25debb98f30a0a1';
export const readText = file => fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/^\uFEFF/, '');
export const readJson = file => JSON.parse(readText(file));
export const exists = file => fs.existsSync(path.join(ROOT, file));
export const count = (source, needle) => source.split(needle).length - 1;
