import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
export const BASELINE='00b5d580c9dbc4fc460694095b7519afad4b0b61';
export const ROOT='content/knowledge/answer-projection';
export const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export const assertFile=(p)=>assert.ok(fs.existsSync(p),`MISSING_FILE:${p}`);
export const assertEvidence=(entry)=>{ assertFile(entry.path); assert.equal(sha256(entry.path),entry.sha256,`DIGEST_DRIFT:${entry.path}`); };
