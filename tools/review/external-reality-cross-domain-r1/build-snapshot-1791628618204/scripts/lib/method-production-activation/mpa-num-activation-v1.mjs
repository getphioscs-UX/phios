import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const BASELINE = '78cd282f8677e8da45bc168a28e6e8e563c4a681';
export const ROOT = process.cwd();
export const MPA_ROOT = 'content/professional/method-production-activation';
export const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
export const readJson = relative => JSON.parse(read(relative));
export const exists = relative => fs.existsSync(path.join(ROOT, relative));
export const sha256File = relative => crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(ROOT, relative))).digest('hex');
