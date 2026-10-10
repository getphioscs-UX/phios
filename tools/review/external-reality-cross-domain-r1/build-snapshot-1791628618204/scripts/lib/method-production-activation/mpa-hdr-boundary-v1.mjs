import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const BASELINE = 'd150a741231abe608a0d994e9e5787e6c71cfc3d';
export const ROOT = process.cwd();
export const MPA_ROOT = 'content/professional/method-production-activation';
export const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
export const readJson = relative => JSON.parse(read(relative));
export const sha256File = relative => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relative))).digest('hex');
