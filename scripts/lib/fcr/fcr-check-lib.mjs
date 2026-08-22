import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const ROOT=process.cwd();
export const FCR='content/financial/calculation-runtime';
export function readJson(p){return JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));}
export function read(p){return fs.readFileSync(path.join(ROOT,p),'utf8');}
export function sha256File(p){return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');}
export function walk(dir){const out=[]; for(const e of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){const p=path.posix.join(dir,e.name); if(e.isDirectory()) out.push(...walk(p)); else out.push(p);} return out.sort();}
export function strings(value,out=[]){if(typeof value==='string') out.push(value); else if(Array.isArray(value)) value.forEach(v=>strings(v,out)); else if(value&&typeof value==='object') Object.values(value).forEach(v=>strings(v,out)); return out;}
