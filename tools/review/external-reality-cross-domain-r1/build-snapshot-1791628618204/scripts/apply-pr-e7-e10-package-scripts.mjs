import assert from 'node:assert/strict';
import fs from 'node:fs';

const file='package.json';
const pkg=JSON.parse(fs.readFileSync(file,'utf8'));
const scripts=pkg.scripts||{};

assert.equal(scripts['check:pr'],'npm run check:pr-w0-w13','PR_BASE_ALIAS_DRIFT');
assert.equal(scripts['check:pr-production'],'npm run check:pr-production-foundation','PR_E1_E3_ALIAS_DRIFT');
assert.equal(scripts['check:pr-production-e4-e6'],'npm run check:pr-production && npm run check:pr-decision-integration','PR_E4_E6_ALIAS_DRIFT');

const expected={
  'check:pr-e7-e10':'node scripts/check-pr-e7-e10-production-final-freeze.mjs',
  'check:pr-production-final':'npm run check:pr-e7-e10',
  'check:pr-production-complete':'npm run check:pr && npm run check:pr-production-e4-e6 && npm run check:pr-production-final'
};
for(const [key,value] of Object.entries(expected)){
  if(scripts[key]!==undefined && scripts[key]!==value) throw new Error(`PACKAGE_ALIAS_CONFLICT:${key}`);
  scripts[key]=value;
}

const integration='npm run check:pr-decision-integration';
const finalCommand='npm run check:pr-production-final';
let tokens=String(scripts.postcheck||'').split('&&').map(x=>x.trim()).filter(Boolean);
assert.ok(tokens.includes('npm run check:pr-production-foundation'),'POSTCHECK_PR_FOUNDATION_MISSING');
assert.ok(tokens.includes(integration),'POSTCHECK_PR_E4_E6_INTEGRATION_MISSING');
tokens=tokens.filter(x=>x!==finalCommand);
tokens.push(finalCommand);
scripts.postcheck=tokens.join(' && ');
pkg.scripts=scripts;
fs.writeFileSync(file,JSON.stringify(pkg,null,2)+'\n','utf8');

const finalTokens=scripts.postcheck.split('&&').map(x=>x.trim()).filter(Boolean);
assert.equal(finalTokens.filter(x=>x===finalCommand).length,1,'POSTCHECK_PR_FINAL_DUPLICATE');
assert.ok(finalTokens.indexOf(finalCommand)>finalTokens.indexOf(integration),'POSTCHECK_PR_FINAL_ORDER');

console.log('✓ PR-E7-E10 package integration applied.');
console.log('✓ Frozen PR base, E1-E3 and E4-E6 aliases remain unchanged.');
console.log('✓ check:pr-production-complete now closes PR base + E1-E10.');
console.log('✓ Existing postcheck commands retain their relative order; PR production-final is appended once.');
