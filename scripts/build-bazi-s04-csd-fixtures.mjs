import fs from 'node:fs';
import {buildInputs,generateCampaignCases} from './lib/bazi-fp-w17-campaign.mjs';
import {buildBaziFullReading} from '../functions/api/bazi-full-reading.js';
import {buildBaziProfessionalSurfaceModules} from '../functions/personal-professional-reading/bazi-professional-surface-projection.js';
const profiles={};
for(const index of [0,30]){
 const spec=generateCampaignCases()[index];
 const full=await buildBaziFullReading({schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',...buildInputs(spec),locale:'en'});
 profiles[spec.caseId]={synthetic:true,provenance:'Existing deterministic BAZI-FP-W17 campaign',reading:{professionalModules:buildBaziProfessionalSurfaceModules({readingIR:full.readingIR,report:full.report,temporalState:'EXPLICIT'})},temporalSnapshot:null};
}
fs.writeFileSync('functions/personal-reading/narrative/bazi-s04-csd-fixtures.generated.js','// Synthetic deterministic campaign inputs; regenerate with scripts/build-bazi-s04-csd-fixtures.mjs.\nexport default '+JSON.stringify(profiles)+';\n');
console.log('Built two synthetic S04 comparison inputs; no customer identifiers or provider calls.');
