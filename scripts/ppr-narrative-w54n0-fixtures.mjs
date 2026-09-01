import fs from 'node:fs';
import {composeGovernedPersonalReading,buildPersonalReadingReportIRv2} from '../functions/personal-reading/personal-reading-composer-v2.js';
import {caseInput} from './ppr-r2-w47-w54-fixtures.mjs';

export const W53=JSON.parse(fs.readFileSync('content/personal-reading/governed/registries/personal-reading-evidence-writing-rules-v2.json','utf8'));
export const W54=JSON.parse(fs.readFileSync('content/personal-reading/governed/contracts/no-unsupported-factual-personality-claim-v1.json','utf8'));
export const SECTION_REGISTRY=JSON.parse(fs.readFileSync('content/personal-reading/governed/registries/personal-reading-section-registry-v2.json','utf8'));
export const COMPOSITION_RULES=JSON.parse(fs.readFileSync('content/personal-reading/governed/registries/personal-reading-composition-rule-registry-v2.json','utf8'));

export async function sourceReport(index){
  const input=caseInput(index,SECTION_REGISTRY,COMPOSITION_RULES);
  const governed=await composeGovernedPersonalReading(input);
  return buildPersonalReadingReportIRv2({governedReading:governed});
}
export async function briefInput(index){
  return {sourceReport:await sourceReport(index),evidenceWritingRules:W53,factualGuard:W54,styleIntent:index%3===0?{tone:'WARM_PROFESSIONAL',depth:'PROFESSIONAL',phiOsLens:'SPARING',explanationFirst:true,customerReadable:true,governanceJargonDefault:false}:undefined,customerContext:index%4===0?`Customer-supplied narrative context ${index+1}; it is context, not an independent factual authority.`:undefined};
}
