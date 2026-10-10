import assert from 'node:assert/strict'; import fs from 'node:fs'; import crypto from 'node:crypto';
import {readJson} from './lib/hfp/hfp-check-lib.mjs';
const b=readJson('content/financial/holistic-planning-product/maturity/hfp-w27-mrm-binding-successor-v1.json'); assert.equal(b.registeredRuntime,'HFP'); assert.equal(b.capabilityCount,4); assert.deepEqual(b.capabilities.map(x=>x.capabilityCode),['HFP-COMPOSITION','HFP-PROFESSIONAL-BINDING','HFP-RR-HANDOFF','HFP-CONTINUITY']);
const expected={'HFP-COMPOSITION':['RM-5','EM-2'],'HFP-PROFESSIONAL-BINDING':['RM-4','EM-2'],'HFP-RR-HANDOFF':['RM-5','EM-2'],'HFP-CONTINUITY':['RM-4','EM-2']}; for(const c of b.capabilities) assert.deepEqual([c.currentRM,c.currentEM],expected[c.capabilityCode]);
for(const ref of Object.values(b.predecessorReferences)){ const h=crypto.createHash('sha256').update(fs.readFileSync(ref.path)).digest('hex'); assert.equal(h,ref.sha256,`Historical MRM predecessor drift: ${ref.path}`); }
const ev=readJson('content/financial/holistic-planning-product/maturity/hfp-w27-evidence-registry-v1.json'); for(const r of ev.records){ assert.equal(r.realCaseCount,0); assert.equal(r.pilotVerified,false); assert.equal(r.productionMature,false); assert.equal(r.highestSatisfiedEM,'EM-2'); }
console.log('✓ HFP-W27 capability-level MRM-S / EM binding passed.');
