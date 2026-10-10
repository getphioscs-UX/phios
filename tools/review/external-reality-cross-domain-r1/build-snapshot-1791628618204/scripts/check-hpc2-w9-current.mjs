import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const text = path => fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const read = path => JSON.parse(text(path));
const sha256 = path => crypto.createHash('sha256').update(text(path), 'utf8').digest('hex');
const digest = value => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const sceneMarkup = (source, code) => { const marker=source.indexOf(`data-hpc2-scene="${code}"`); assert.ok(marker>=0, `${code} missing`); const start=source.lastIndexOf('<section',marker); const end=source.indexOf('</section>',marker); assert.ok(start>=0&&end>marker, `${code} boundary missing`); return source.slice(start,end+'</section>'.length); };

const f=read('content/web/homepage/hpc2/freeze/hpc2-w9-academy-services-professional-freeze-v1.json'),w10=read('content/web/homepage/hpc2/contracts/hpc2-w10-continuity-final-cta-contract-v1.json'),html=text('index.html'); for(const a of f.immutableArtifacts) assert.equal(sha256(a.path),a.sha256,`W9 immutable drift: ${a.path}`); for(const code of ['H01','H02','H03','H04','H05','H06','H07','H08']) assert.equal(digest(sceneMarkup(html,code)),f.structuralFreeze[`${code.toLowerCase()}MarkupSha256`],`W9 frozen ${code} drift`); assert.equal(count(html,/data-hpc2-scene="H09"/g),1); assert.equal(w10.composition.sceneCode,'H09'); console.log('HPC2-W9 current successor: ACCEPTED'); console.log('  frozen H01-H08 and W9 evidence preserved; additive H09 governed by HPC2-W10');
