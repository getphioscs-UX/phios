import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const BASELINE='9bfca2bb8c94072feb0a280d0a4d3cb06c6ec2a9';
const git=(args)=>{const r=spawnSync('git',args,{cwd:process.cwd(),encoding:'utf8'});assert.equal(r.status,0,`git ${args.join(' ')} failed\n${r.stderr||r.stdout}`);return String(r.stdout||'').trim();};
const head=git(['rev-parse','HEAD']);
assert.equal(head,BASELINE,`W33 orchestration patch requires exact evidence baseline ${BASELINE}; current HEAD is ${head}`);

const path='package.json';
const before=fs.readFileSync(path,'utf8');
const pkg=JSON.parse(before);
assert.ok(pkg.scripts&&typeof pkg.scripts==='object','package.json scripts missing');

const transitions={
  'check:iching-depth-current':[
    'node scripts/check-iching-depth-current-v6.mjs',
    'node scripts/check-iching-depth-current-v7.mjs'
  ],
  'check:iching-current':[
    'node scripts/check-iching-current-v8.mjs',
    'node scripts/check-iching-current-v9.mjs'
  ],
  'check:iching-activation-readiness':[
    'node scripts/check-iching-activation-readiness-current-v5.mjs',
    'node scripts/check-iching-activation-readiness-current-v6.mjs'
  ]
};
for(const [k,[oldValue,newValue]] of Object.entries(transitions)){
  assert.ok([oldValue,newValue].includes(pkg.scripts[k]),`W33 package drift outside recoverable transition: ${k}\nactual: ${pkg.scripts[k]}\nallowed: ${oldValue} OR ${newValue}`);
}
assert.equal(pkg.scripts['check:iching-limited-production-observation'],'node scripts/check-iching-limited-production-observation-v2.mjs','W33 observation checker drift');
assert.equal(pkg.scripts['check:iching-product-current'],'npm run check:iching-current && npm run check:iching-activation-readiness','W33 product-current orchestration drift');
if(pkg.scripts['check:iching-w33-final-acceptance']!==undefined){
  assert.equal(pkg.scripts['check:iching-w33-final-acceptance'],'node scripts/check-iching-w33-final-limited-production-acceptance-v1.mjs','W33 final acceptance alias drift');
}

const nl=before.includes('\r\n')?'\r\n':'\n';
const replaceOnce=(source,from,to,label)=>{
  const first=source.indexOf(from);
  assert.ok(first>=0,`W33 package marker missing: ${label}`);
  assert.equal(source.indexOf(from,first+from.length),-1,`W33 package marker duplicated: ${label}`);
  return source.slice(0,first)+to+source.slice(first+from.length);
};
const replaceTransition=(source,key,oldValue,newValue)=>{
  if(pkg.scripts[key]===newValue) return source;
  return replaceOnce(source,`"${key}": "${oldValue}"`,`"${key}": "${newValue}"`,key);
};

let after=before;
for(const [k,[oldValue,newValue]] of Object.entries(transitions)) after=replaceTransition(after,k,oldValue,newValue);

const observationLine='    "check:iching-limited-production-observation": "node scripts/check-iching-limited-production-observation-v2.mjs",';
const w33Line='    "check:iching-w33-final-acceptance": "node scripts/check-iching-w33-final-limited-production-acceptance-v1.mjs",';
if(pkg.scripts['check:iching-w33-final-acceptance']===undefined){
  after=replaceOnce(after,observationLine,observationLine+nl+w33Line,'check:iching-w33-final-acceptance insertion');
}else{
  assert.equal(after.split(w33Line).length-1,1,'W33 final acceptance alias must appear exactly once');
}

const oldGlobal='npm run check:iching-depth-current && npm run check:cx-r12r3b';
const newGlobal='npm run check:iching-depth-current && npm run check:iching-w33-final-acceptance && npm run check:cx-r12r3b';
const currentCheck=String(pkg.scripts.check||'');
if(currentCheck.includes(newGlobal)){
  assert.equal(currentCheck.split(newGlobal).length-1,1,'W33 global-check marker duplicated');
}else{
  assert.ok(currentCheck.includes(oldGlobal),'W33 global-check baseline marker missing');
  assert.equal(currentCheck.split(oldGlobal).length-1,1,'W33 global-check baseline marker duplicated');
  after=replaceOnce(after,oldGlobal,newGlobal,'global check insertion');
}

const check=JSON.parse(after);
assert.equal(check.scripts['check:iching-depth-current'],'node scripts/check-iching-depth-current-v7.mjs');
assert.equal(check.scripts['check:iching-current'],'node scripts/check-iching-current-v9.mjs');
assert.equal(check.scripts['check:iching-activation-readiness'],'node scripts/check-iching-activation-readiness-current-v6.mjs');
assert.equal(check.scripts['check:iching-w33-final-acceptance'],'node scripts/check-iching-w33-final-limited-production-acceptance-v1.mjs');
assert.ok(check.scripts.check.includes(newGlobal));

if(after!==before){
  fs.writeFileSync(path,after,'utf8');
  console.log('✓ ICH-PROD-W33 package orchestration recovered/applied on exact 9bfca2b evidence baseline.');
}else{
  console.log('✓ ICH-PROD-W33 package orchestration already fully applied; no package.json rewrite required.');
}
console.log('  Partial W33 alias state is accepted only when every changed alias equals either the exact predecessor or exact W33 target; unrelated drift remains fail-closed.');
