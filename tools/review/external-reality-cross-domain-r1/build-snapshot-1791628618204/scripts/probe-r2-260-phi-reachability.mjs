import {buildEcrCanonicalProjectionFromAnchor} from '../functions/embodied-configuration/ecr-canonical-projection-runtime.js';
import {fixtureInput} from './lib/ecr-full-report-fixture.mjs';
import {selectEcrPhiCards} from '../functions/ecr-phi-card/ecr-card-selector.js';
import {ECR_PHI_CARD_MAPPING as mapping,ECR_PHI_CARD_DECK as deck} from '../functions/ecr-phi-card/ecr-card-runtime-authority.js';
import {writeJson,evidenceDir} from './lib/r2-260-evidence.mjs';
const witnesses={},cases=[];
for(let index=0;index<512;index++){
 const longitude=(index+.5)*360/512,projection=await buildEcrCanonicalProjectionFromAnchor({canonicalInput:fixtureInput('en'),anchor:{longitude,utcIso:'2000-01-01T04:00:00.000Z',engineCode:'ECR_TEST_ANCHOR',referenceFrame:'TEST_DETERMINISTIC_SOLAR_ANCHOR'},requestId:'R2-260-REACHABILITY-'+index});
 const coordinate=Object.fromEntries(projection.calculation.structures.map(s=>[s.code,s.items]));
 // Probe only selector reachability; no display claim or fabricated reading.
 const selection=selectEcrPhiCards({coordinate,interpretationUnits:[{probeOnly:true}],customerPublishable:true},mapping,deck);
 const ids=Object.values(selection.groups).map(g=>g?.cardId).filter(Boolean);for(const id of ids)if(!witnesses[id])witnesses[id]={index,longitude,coordinate,selectionReason:Object.values(selection.groups).find(g=>g?.cardId===id)?.reasons};
 cases.push({index,longitude,ids});
}
const missing=deck.cards.filter(c=>!witnesses[c.cardId]).map(c=>c.cardId);
writeJson(evidenceDir+'/r2-260-phi-reachability-v2.json',{scope:'Selector reachability across all 512 canonical activation-sector midpoints; not browser evidence',witnesses,missing,cases});console.log({covered:Object.keys(witnesses).length,missing});
