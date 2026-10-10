import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const contract=JSON.parse(fs.readFileSync(path.join(root,'content/professional/hdr2/contracts/hdr2-no-automatic-restricted-calculation-v1.json'),'utf8'));
for(const value of Object.values(contract.automaticCalculation)) assert.equal(value,false);
assert.equal(contract.allowedIngress,'PROFESSIONAL_MANUAL_INPUT_ONLY');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);return e.isDirectory()?walk(p):[p]});}
const functionFiles=walk(path.join(root,'functions')).filter(p=>p.endsWith('.js'));
const forbiddenFile=functionFiles.find(p=>/(phs|dream.?rave).*(calculator|calculation|engine)|(?:calculator|calculation|engine).*(phs|dream.?rave)/i.test(path.basename(p)));
assert.equal(forbiddenFile,undefined,`Restricted automatic calculation file found: ${forbiddenFile}`);
for(const p of functionFiles){const t=fs.readFileSync(p,'utf8');assert.equal(/(?:export\s+)?(?:async\s+)?function\s+calculate(?:PHS|Phs|DreamRave)|DREAM_RAVE_CALCULATION_RUNTIME|PHS_CALCULATION_RUNTIME/.test(t),false,`Restricted automatic calculation symbol found: ${path.relative(root,p)}`);}
console.log('✓ HDR2 no-restricted-auto-calculation gate passed: PHS / DreamRave / advanced extension fields remain professional manual input only.');
