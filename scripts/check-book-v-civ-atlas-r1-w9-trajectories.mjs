import fs from 'node:fs';
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const assert=(v,m)=>{if(!v)throw new Error(m)};

const layers=readJson('content/civilization-atlas/atlas-layers-v1.json');
const reg=readJson('content/civilization-atlas/trajectories/long-duration-trajectories-v1.json');
assert(layers.explorerLayers.find(x=>x.layerId==='trajectories')?.customerEnabled===true,'W9_TRAJECTORIES_NOT_ENABLED');
assert(reg.status==='ACTIVE','W9_REGISTRY_NOT_ACTIVE');
assert(reg.trajectories.length===6,'W9_VERTICAL_SLICE_MUST_HAVE_6');
assert(new Set(reg.trajectories.map(x=>x.trajectoryId)).size===6,'W9_DUPLICATE_ID');
assert(reg.trajectories.some(x=>x.authorityClass==='CONCEPTUAL_TRAJECTORY'),'W9_CONCEPTUAL_AUTHORITY_MISSING');
assert(reg.trajectories.some(x=>x.authorityClass==='HISTORICAL_RECONSTRUCTION'),'W9_RECONSTRUCTION_AUTHORITY_MISSING');
assert(reg.trajectories.some(x=>x.authorityClass==='EVIDENCE_SERIES'),'W9_EVIDENCE_SERIES_MISSING');
assert(!JSON.stringify(reg).match(/civilizationScore|overallScore|rankingScore/i),'W9_FORBIDDEN_SCORE_FIELD');
console.log('✓ BOOK-V-CIV-ATLAS-R1-W9 Long-Duration Trajectories passed.');
