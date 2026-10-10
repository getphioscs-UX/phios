import fs from 'node:fs';
import path from 'node:path';

export const BASELINE = '1d4bc9e98d38c743b44f9659fd89d75bdbb1c0f7';
export const ROOT = process.cwd();
export const MPA_ROOT = 'content/professional/method-production-activation';
export const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
export const readJson = relative => JSON.parse(read(relative));
export const exists = relative => fs.existsSync(path.join(ROOT, relative));
export const methodByCode = (registry, code) => registry.methods.find(item => item.methodCode === code);
export const sorted = values => [...values].sort();
