import assert from 'node:assert/strict';
import fs from 'node:fs';
const readJson=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const writeJson=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n','utf8');
const pkg=readJson('package.json'); pkg.scripts??={};
const expected={
 'check:rre-w0-w4':'node scripts/check-rre-w0-w4-readout-foundation.mjs',
 'check:rre-foundation':'npm run check:rre-w0-w4',
 'check:rre-w5-w10':'node scripts/check-rre-w5-w10-reading-runtime.mjs',
 'check:rre-reading':'npm run check:rre-w5-w10'
};
for(const [k,v] of Object.entries(expected)) assert.equal(pkg.scripts[k],v,`RRE_EXISTING_SCRIPT_CONFLICT:${k}`);
pkg.scripts['check:rre-w11-w16']='node scripts/check-rre-w11-w16-canonical-readout-freeze.mjs';
pkg.scripts['check:rre-canonical']='npm run check:rre-w11-w16';
pkg.scripts['check:rre']='npm run check:rre-foundation && npm run check:rre-reading && npm run check:rre-canonical';
pkg.scripts['check:rre-complete']='npm run check:rre';
const post=String(pkg.scripts.postcheck??'').trim(); if(!post) throw new Error('RRE_POSTCHECK_MISSING'); if(!post.includes('npm run check:rre')) pkg.scripts.postcheck=`${post} && npm run check:rre`;
writeJson('package.json',pkg);

const w0='scripts/check-rre-w0-w4-readout-foundation.mjs'; let s0=fs.readFileSync(w0,'utf8');
const old0="rreAlias === 'npm run check:rre-foundation && npm run check:rre-reading',";
const new0="rreAlias === 'npm run check:rre-foundation && npm run check:rre-reading' ||\n  rreAlias === 'npm run check:rre-foundation && npm run check:rre-reading && npm run check:rre-canonical',";
if(s0.includes(old0)) s0=s0.replace(old0,new0); else assert.ok(s0.includes('check:rre-canonical'), 'RRE_W0_ALIAS_PATCH_ANCHOR_MISSING'); s0=s0.replace('✓ Persistent Canonical Readout remains blocked pending versioned RDG REALITY_READOUT_RECORD authority.','✓ Historical W0-W4 persistence gate remains preserved; W11 successor authority is validated by check:rre-canonical.'); fs.writeFileSync(w0,s0,'utf8');

const w5='scripts/check-rre-w5-w10-reading-runtime.mjs'; let s5=fs.readFileSync(w5,'utf8');
const old5="assert.equal(pkg.scripts['check:rre'],'npm run check:rre-foundation && npm run check:rre-reading');";
const new5="assert.ok([\n  'npm run check:rre-foundation && npm run check:rre-reading',\n  'npm run check:rre-foundation && npm run check:rre-reading && npm run check:rre-canonical'\n].includes(pkg.scripts['check:rre']), `Unexpected check:rre alias: ${pkg.scripts['check:rre']}`);";
if(s5.includes(old5)) s5=s5.replace(old5,new5); else assert.ok(s5.includes('check:rre-canonical'), 'RRE_W5_ALIAS_PATCH_ANCHOR_MISSING'); s5=s5.replace('✓ Persistent Canonical Readout remains blocked pending RDG REALITY_READOUT_RECORD successor authority.','✓ Historical W5-W10 persistence gate remains preserved; W11 successor authority is validated by check:rre-canonical.'); fs.writeFileSync(w5,s5,'utf8');

console.log('✓ RRE-W11-W16 package/checker integration applied.');
console.log('✓ check:rre now covers W0-W16.');
console.log('✓ npm run check postcheck now includes the frozen RRE v1 closure.');
