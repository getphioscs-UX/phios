import assert from 'node:assert/strict';
import fs from 'node:fs';
const file='package.json'; const pkg=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')); pkg.scripts??={};
const desired={
  'check:rre-w5-w10':'node scripts/check-rre-w5-w10-reading-runtime.mjs',
  'check:rre-reading':'npm run check:rre-w5-w10'
};
for(const [key,value] of Object.entries(desired)){ if(pkg.scripts[key]&&pkg.scripts[key]!==value) throw new Error(`RRE_PACKAGE_SCRIPT_CONFLICT:${key}:${pkg.scripts[key]}`); pkg.scripts[key]=value; }
assert.equal(pkg.scripts['check:rre-w0-w4'],'node scripts/check-rre-w0-w4-readout-foundation.mjs','RRE_FOUNDATION_SCRIPT_MISSING');
assert.equal(pkg.scripts['check:rre-foundation'],'npm run check:rre-w0-w4','RRE_FOUNDATION_ALIAS_MISSING');
const current=pkg.scripts['check:rre']; if(current&&current!=='npm run check:rre-foundation'&&current!=='npm run check:rre-foundation && npm run check:rre-reading') throw new Error(`RRE_PACKAGE_SCRIPT_CONFLICT:check:rre:${current}`);
pkg.scripts['check:rre']='npm run check:rre-foundation && npm run check:rre-reading'; fs.writeFileSync(file,JSON.stringify(pkg,null,2)+'\n','utf8');
console.log('✓ RRE-W5-W10 package scripts applied.'); console.log('✓ check:rre now runs foundation then reading runtime.'); console.log('✓ Default postcheck remains unchanged.');
