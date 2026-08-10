import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const readJson=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const base='content/professional/canonical-presentation-runtime';
const typeReg=await readJson(`${base}/registries/presentation-type-registry-v1.json`);
const types=new Set(typeReg.presentationTypes.map(x=>x.presentationType));
for (const n of [7,8,9,10,11,12,13]) {
 const files=(await fs.readdir(path.join(root,base,'contracts'))).filter(x=>x.startsWith(`cpr-w${n}-`));
 assert.equal(files.length,1,`CPR-W${n} contract`);
 const c=await readJson(`${base}/contracts/${files[0]}`); assert.equal(c.work,`CPR-W${n}`); assert.equal(types.has(c.presentationType),true);
 assert.equal(c.mayCreateKnowledge,false); assert.equal(c.mayCreateMeaning,false);
}
const responsive=await readJson(`${base}/contracts/cpr-responsive-presentation-runtime-v1.json`); assert.equal(responsive.work,'CPR-W14'); assert.equal(responsive.breakpointAuthority,'PDS');
const a11y=await readJson(`${base}/contracts/cpr-accessibility-presentation-runtime-v1.json`); assert.equal(a11y.work,'CPR-W15');
const locale=await readJson(`${base}/contracts/cpr-locale-presentation-runtime-v1.json`); assert.deepEqual(locale.supportedLocales,['en','zh-Hans']);
const audience=await readJson(`${base}/contracts/cpr-audience-projection-runtime-v1.json`); assert.equal(audience.rules.audienceDoesNotGrantDataAccess,true);
const component=await readJson(`${base}/contracts/cpr-component-composition-contract-v1.json`); assert.equal(component.componentAuthority,'PDS');
console.log('✓ CPR-W7-W18 presentation objects and projection contracts passed.');
