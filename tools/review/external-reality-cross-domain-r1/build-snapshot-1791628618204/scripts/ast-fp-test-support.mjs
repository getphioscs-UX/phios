import fs from 'node:fs';
import * as astronomy from 'astronomy-engine';
import {executeAndProjectAstV2} from '../functions/method-client-delivery/canonical-projection-runtime-ast-v2.js';
import {buildMethodMeaningPayloadV2} from '../functions/customer-projection/method-customer-reading-v2.js';
import {createMethodInterpretationInput,createMethodInterpretationCandidate} from '../functions/interpretation-runtime/cx-r12r3b-shared-runtime-v2.js';
import {AST_FP_COMPOSITION_VERSION} from '../functions/interpretation-runtime/ast-full-production-composer-v1.js';
export const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export const chartFixtures=readJson('content/professional/ast-full-production/fixtures/ast-fp-chart-inputs-v1.json');
export function canonicalInput(c){
  return {birthDate:c.birthDate,birthTime:c.birthTime,birthPlace:{displayName:`Synthetic ${c.id}`,countryCode:'ZZ',latitude:c.latitude,longitude:c.longitude},timezone:{iana:c.iana,utcOffsetAtBirth:c.offset,source:'HUMAN_DECLARATION',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'en',consent:{recordId:'AST-FP-ENGINEERING-FIXTURE',granted:true},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
}
export async function projectChart(c,{houseSystemCode='PLACIDUS_V1',overrides={}}={}){
  const input={...canonicalInput(c),...overrides};
  const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ASTROLOGY',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'AST_FP_ENGINEERING_REGRESSION',canonicalInput:input,executionParameters:{houseSystemCode},consentRecordId:input.consent.recordId,requestId:`${c.id}-${houseSystemCode}`};
  const result=await executeAndProjectAstV2(request,{astronomyModuleLoader:async()=>astronomy});
  // Test fixture metadata only: the bundle digest includes execution time.
  // Pin it so saved regressions compare identical evidence, not wall-clock time.
  const projection=structuredClone(result.canonicalProjection);
  projection.execution.executedAt='2026-08-28T00:00:00.000Z';
  return projection;
}
export async function candidateFor(projection,locale='zh-Hans',options={}){
  const meaningPayload=await buildMethodMeaningPayloadV2({canonicalProjection:projection,locale});
  const input=await createMethodInterpretationInput({canonicalProjection:projection,methodId:'AST',locale,requestedDepth:'PROFESSIONAL'});
  const candidate=await createMethodInterpretationCandidate({input,meaningPayload,compositionVersion:AST_FP_COMPOSITION_VERSION,...options});
  return {candidate,input,meaningPayload};
}
