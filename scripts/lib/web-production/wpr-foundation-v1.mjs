import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const root = process.cwd();
export const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
export const exists = relative => fs.existsSync(path.join(root, relative));
export const sha256 = relative => 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');
export const BASELINE = '9c6ab5b198f6603a2e8ac3d95ef743b5b2694db9';
