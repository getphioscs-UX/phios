import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const sha256File = async file => sha256(await fs.readFile(file));
