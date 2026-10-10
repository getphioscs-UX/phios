import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const root=process.cwd();
const authority=JSON.parse(fs.readFileSync(path.join(root,'content/professional/personal-reality/r2/authority/ppr-r2-w1-shared-file-ownership-v1.json'),'utf8'));
assert.equal(authority.status,'FROZEN');assert.equal(authority.owner,'PERSONAL_REALITY_PRODUCT_ORCHESTRATION');
for(const file of Object.keys(authority.sharedFiles))assert.ok(fs.existsSync(path.join(root,file)),`Missing shared file ${file}`);
const methodRoots=['functions/ast-full-production','functions/bzr-full-production','functions/num-full-production','functions/zi-wei-full-production','functions/embodied-configuration','functions/ecr-phi-card'];
const forbidden=['functions/api/customer-personal-reality.js','assets/customer-ui/js/surfaces/personal-reality.js','perspectives/personal/index.html'];
function walk(dir){if(!fs.existsSync(dir))return[];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const rel of methodRoots)for(const file of walk(path.join(root,rel)).filter(x=>/\.(?:js|mjs|cjs)$/.test(x))){const txt=fs.readFileSync(file,'utf8').replace(/\\/g,'/');for(const target of forbidden)assert.ok(!txt.includes(target),`${path.relative(root,file)} directly references shared customer file ${target}`)}
console.log('✓ PPR-R2-W1 shared-file ownership authority passed: Personal Reality owns the three convergence files; method production roots do not directly reference them.');
