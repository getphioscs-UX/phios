import assert from 'node:assert/strict';
import { BASELINE, read, readJson, sha256File } from './lib/method-production-activation/mpa-validation-evidence-v1.mjs';
import { canonicalDigest } from '../functions/method-production-activation/validation-evidence-runtime.js';
const c=readJson('content/professional/method-production-activation/contracts/mpa-calculation-data-authority-v1.json');
const r=readJson('content/professional/method-production-activation/registries/mpa-calculation-data-authority-registry-v1.json');
assert.equal(c.work,'MPA-W11'); assert.equal(c.baselineCommit,BASELINE); assert.equal(c.rules.ungovernedMagicConstantsForbidden,true); assert.equal(c.rules.digestRequiredForProduction,true); assert.equal(r.baselineCommit,BASELINE);
for(const a of r.authorities){ for(const field of ['source','version','license','digestStatus']) assert.ok(field in a,`${a.authorityCode}:${field}`); if(a.digestStatus.startsWith('VERIFIED_')) assert.match(a.digest,/^[a-f0-9]{64}$/); }
const num=r.authorities.find(x=>x.authorityCode==='NUMERIC_REDUCTION_RULES_V1'); assert.equal(num.digest,canonicalDigest(num.payload)); assert.match(read('functions/core-method-runtime/num-birth-number-runtime.js'),/new Set\(\[11, 22, 33\]\)/);
const stems=r.authorities.find(x=>x.authorityCode==='BZR_STEM_BRANCH_TABLES_V1'); assert.equal(stems.digest,canonicalDigest(stems.payload)); const bsrc=read('functions/core-method-runtime/bzr-four-pillars-runtime.js'); for(const value of stems.payload.stems) assert.ok(bsrc.includes(`'${value}'`)); for(const value of stems.payload.branches) assert.ok(bsrc.includes(`'${value}'`));
const hdr=r.authorities.find(x=>x.authorityCode==='HDR_SOLAR_ARC_CONSTANTS_V1'); assert.equal(hdr.digest,canonicalDigest(hdr.payload)); assert.match(read('functions/core-method-runtime/hdr-design-moment-runtime.js'),/TARGET_SOLAR_ARC_DEGREES = 88/);
const ast=r.authorities.find(x=>x.authorityCode==='AST_EPHEMERIS_AUTHORITY'); assert.equal(ast.digest,null); assert.equal(ast.productionUse,'BLOCKED'); const tz=r.authorities.find(x=>x.authorityCode==='IANA_TZDB'); assert.equal(tz.digest,null); assert.equal(tz.productionUse,'BLOCKED');
assert.equal(r.productionEligibilityChanged,false);
console.log('✓ MPA-W11 Calculation Data Authority passed.');
console.log('  Numeric/BaZi/HDR validation literals are authority-bound; unresolved ephemeris/TZDB digests remain Production blockers.');
