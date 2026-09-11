import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
const root=process.cwd(); const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
const pairs=[
 ['content/civilization-atlas/schemas/atlas-manifest.schema.json','content/civilization-atlas/atlas-manifest-v1.json'],
 ['content/civilization-atlas/schemas/atlas-evidence.schema.json','content/civilization-atlas/evidence/evidence-authority-v1.json'],
 ['content/civilization-atlas/schemas/timeline-period.schema.json','content/civilization-atlas/timeline/timeline-periods-v1.json'],
 ['content/civilization-atlas/schemas/civilization-case.schema.json','content/civilization-atlas/cases/civilization-case-registry-v1.json'],
 ['content/civilization-atlas/schemas/comparison-family.schema.json','content/civilization-atlas/comparison/comparison-families-v1.json'],
 ['content/civilization-atlas/schemas/world-snapshot.schema.json','content/civilization-atlas/snapshots/world-snapshots-v1.json'],
 ['content/civilization-atlas/schemas/trajectory.schema.json','content/civilization-atlas/trajectories/long-duration-trajectories-v1.json'],
 ['content/civilization-atlas/schemas/transition-window.schema.json','content/civilization-atlas/transitions/transition-windows-v1.json'],
 ['content/civilization-atlas/schemas/loss-atlas.schema.json','content/civilization-atlas/loss/reversal-loss-atlas-v1.json']
];
const ajv=new Ajv2020({allErrors:true,strict:false});
for(const [schemaPath,dataPath] of pairs){ const validate=ajv.compile(json(schemaPath)); const data=json(dataPath); if(!validate(data)) throw new Error(`${dataPath} schema invalid: ${ajv.errorsText(validate.errors,{separator:' | '})}`); }
const seeds={
 timeline:json(pairs[2][1]).periods,cases:json(pairs[3][1]).cases,comparison:json(pairs[4][1]).families,world:json(pairs[5][1]).snapshots,trajectories:json(pairs[6][1]).trajectories,transitions:json(pairs[7][1]).transitionWindows,scaleShifts:json(pairs[7][1]).scaleShifts,lossFamilies:json(pairs[8][1]).families,lossTypes:json(pairs[8][1]).lossTypes,lossProfiles:json(pairs[8][1]).caseProfiles
};
const manifest=json('content/civilization-atlas/atlas-manifest-v1.json'); if(manifest.status==='FOUNDATION'){for(const [name,items] of Object.entries(seeds)) assert.equal(items.length,0,`W2 foundation must not pre-execute later data population: ${name}`);}
for(const p of Object.values(manifest.registryRefs)) assert.ok(fs.existsSync(path.join(root,p)),`missing manifest registry ref: ${p}`);
const schemaFiles=pairs.map(x=>x[0]); assert.equal(new Set(schemaFiles).size,9);
const raw=schemaFiles.concat(pairs.map(x=>x[1])).map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('\n');
for(const forbidden of ['"collapseScore"','"civilizationDeclineScore"','"totalLossScore"','"overallCivilizationScore"','"superiorityScore"']) assert.ok(!raw.includes(forbidden),`unsupported ranking/score property found: ${forbidden}`);
// Prove key negative boundaries are enforced by schemas, not comments only.
const caseSchema=json(pairs[3][0]); const caseValidate=ajv.compile(caseSchema); const invalidCase={schemaVersion:'PHI-OS-BOOK-V-CIV-ATLAS-CASES-v1.0.0',version:'1.0.0',status:'FOUNDATION',cases:[{caseId:'CA-T09-01',title:{'zh-Hans':'示例',en:'Example'},collapseScore:87}]}; assert.equal(caseValidate(invalidCase),false,'case schema must reject score shortcut/underspecified case');
const trajSchema=json(pairs[6][0]); const trajValidate=ajv.compile(trajSchema); const invalidTrajectory={schemaVersion:'PHI-OS-BOOK-V-CIV-ATLAS-TRAJECTORIES-v1.0.0',version:'1.0.0',status:'FOUNDATION',trajectories:[{trajectoryId:'TEST',title:{'zh-Hans':'测试',en:'Test'},description:{'zh-Hans':'测试',en:'Test'},authorityClass:'CONCEPTUAL_TRAJECTORY',unitMode:'ABSOLUTE_MEASURED'}]}; assert.equal(trajValidate(invalidTrajectory),false,'trajectory schema must reject incomplete authority presentation');
console.log('✓ BOOK-V-CIV-ATLAS-R1-W2 Schemas & Registry Foundation passed.');
console.log(`  ${pairs.length} schemas/registries validate; later layer registries remain intentionally empty until their assigned execution waves.`);
