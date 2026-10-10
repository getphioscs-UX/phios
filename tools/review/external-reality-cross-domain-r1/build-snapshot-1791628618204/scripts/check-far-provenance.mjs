import assert from 'node:assert/strict'; import {runSourceFixture} from './lib/far/far-check-lib.mjs';
const {source,fcr,far}=await runSourceFixture('business-owner.json','PROV');
function facts(n,m=new Set()){if(!n||typeof n!=='object') return m;if(n.factId)m.add(n.factId);for(const v of Object.values(n))facts(v,m);return m;} const fset=facts(source.calculationInput.fdrSnapshot.snapshotPayload);
for(const f of far.findings){ assert.equal(f.provenance.fcrResultDigest,fcr.resultDigest); assert.equal(f.provenance.fdrDigest,fcr.fdrDigest); for(const id of f.factReferences) assert.ok(fset.has(id),`unresolved fact ${id}`); assert.ok(f.sourceCalculationReferences.length>0); }
console.log('✓ FAR-W19 finding → FCR → FDR provenance passed.');
