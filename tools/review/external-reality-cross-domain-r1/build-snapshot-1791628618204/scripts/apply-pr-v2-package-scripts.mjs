import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const packagePath=path.join(root,'package.json');
assert.ok(fs.existsSync(packagePath),'PACKAGE_JSON_MISSING');

const pkg=JSON.parse(fs.readFileSync(packagePath,'utf8'));
pkg.scripts ||= {};

const requiredAliases={
  'check:pr-w0-w13':'node scripts/check-pr-w0-w13-professional-runtime-v2.mjs',
  'check:pr':'npm run check:pr-w0-w13',
  'check:pr-v2':'npm run check:pr',
  'check:professional-runtime':'npm run check:pr'
};

for (const [key,value] of Object.entries(requiredAliases)) {
  if (pkg.scripts[key] && pkg.scripts[key]!==value) {
    throw new Error(`PR_PACKAGE_ALIAS_CONFLICT:${key}:${pkg.scripts[key]}`);
  }
  pkg.scripts[key]=value;
}

const postcheck=String(pkg.scripts.postcheck||'').trim();
assert.ok(postcheck,'POSTCHECK_MISSING');
const commands=postcheck.split('&&').map(command=>command.trim()).filter(Boolean);
const rre='npm run check:rre';
const rr='npm run check:rr';
const pr='npm run check:pr';
const rreIndex=commands.indexOf(rre);
assert.ok(rreIndex>=0,'POSTCHECK_RRE_REQUIRED_BEFORE_RR_PR');

function removeAll(command) {
  for (let i=commands.length-1;i>=0;i--) if (commands[i]===command) commands.splice(i,1);
}
removeAll(rr);
removeAll(pr);

const newRreIndex=commands.indexOf(rre);
commands.splice(newRreIndex+1,0,rr,pr);

assert.equal(commands.filter(command=>command===rre).length,1,'POSTCHECK_RRE_DUPLICATE');
assert.equal(commands.filter(command=>command===rr).length,1,'POSTCHECK_RR_DUPLICATE');
assert.equal(commands.filter(command=>command===pr).length,1,'POSTCHECK_PR_DUPLICATE');
assert.equal(commands.indexOf(rr),commands.indexOf(rre)+1,'POSTCHECK_RR_MUST_FOLLOW_RRE');
assert.equal(commands.indexOf(pr),commands.indexOf(rr)+1,'POSTCHECK_PR_MUST_FOLLOW_RR');

pkg.scripts.postcheck=commands.join(' && ');
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n','utf8');

console.log('✓ PR v2 package integration applied.');
console.log('✓ check:pr-w0-w13 / check:pr / check:pr-v2 aliases are canonical.');
console.log('✓ postcheck uses exact command tokens and closes RRE → RR → PR in that order.');
console.log('✓ Existing postcheck commands are preserved; substring prefixes such as rr/rre are never used for detection.');
