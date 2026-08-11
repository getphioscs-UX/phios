import fs from 'node:fs';
import crypto from 'node:crypto';
export const BASELINE='9cd28c6ad24ebffeeb553cfe65fb572ef562d3ed';
export const readText=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
export const readJson=p=>JSON.parse(readText(p));
export const digest=p=>crypto.createHash('sha256').update(readText(p),'utf8').digest('hex');
