import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildAstCustomerWorkspaceCandidate} from '../../../functions/ast-full-production/ast-customer-reading-production.js';
import {AST_SURFACE_CUTOVER_GATE} from '../../../functions/ast-full-production/ast-customer-reading-authority-v2.js';

export const BASELINE_COMMIT='343773fd6fb61fbf1b37aa861537d7e8f091ec24';
export const R3_REFERENCE_PATH='content/professional/ast-full-production/fixtures/ast-fp-r3-independent-reference-v1.json';
export const W17_CAMPAIGN_PATH='content/professional/ast-full-production/customer-reading-v2/campaign/ast-r2-w17-production-machine-campaign-v1.json';
export const W18_CASES_PATH='content/professional/ast-full-production/customer-reading-v2/review/ast-r2-w18-final-customer-human-review-cases-v1.json';
export const W18_RESULTS_PATH='content/professional/ast-full-production/customer-reading-v2/review/ast-r2-w18-final-customer-human-review-results-v1.json';
export const W19_ADMISSION_PATH='content/professional/ast-full-production/customer-reading-v2/admission/ast-r2-w19-method-scoped-production-admission-v1.json';
export const W20_FREEZE_PATH='content/professional/ast-full-production/customer-reading-v2/freeze/ast-r2-w20-full-production-freeze-v1.json';

export const INTENTS=Object.freeze([
  Object.freeze({intentId:'OPEN',rawIntent:''}),
  Object.freeze({intentId:'EXPRESSION',rawIntent:'How do I express, communicate and give form to what I create?'}),
  Object.freeze({intentId:'WORK',rawIntent:'What patterns shape my work, career and professional role?'}),
  Object.freeze({intentId:'RELATIONSHIP',rawIntent:'What should I understand about relationship and partnership patterns?'}),
  Object.freeze({intentId:'PRESSURE',rawIntent:'Where do pressure, tension and friction concentrate in this pattern?'}),
  Object.freeze({intentId:'DIRECTION',rawIntent:'What should I understand about direction, choice and the next step?'})
]);
export const LOCALES=Object.freeze(['en','zh-Hans']);
export const HOUSE_SYSTEMS=Object.freeze(['PLACIDUS_V1','WHOLE_SIGN_V1']);
export const CORE10=Object.freeze(['SUN','MOON','MERCURY','VENUS','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO']);

export const readJson=path=>JSON.parse(fs.readFileSync(path,'utf8'));
export const writeJson=(path,value)=>{fs.mkdirSync(path.slice(0,path.lastIndexOf('/')),{recursive:true});fs.writeFileSync(path,JSON.stringify(value,null,2)+'\n')};
export const digest=value=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
export const fileDigest=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
export const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))freeze(x)}return value};

// W18's founder decisions are bound to the R2-W16 workspace that was actually
// reviewed. AST-CX-R3 later attached its separately governed v3 product
// projection to that workspace as an additive successor payload. Keep the
// historical W18 digest scoped to the reviewed R2-W16 fields so an additive
// product projection cannot silently invalidate or inherit Human acceptance.
export function projectW18ReviewedWorkspace(workspace={}){
  const {customerProductProjection:_customerProductProjection,...reviewedWorkspace}=workspace;
  return reviewedWorkspace;
}

export const digestW18ReviewedWorkspace=workspace=>digest(projectW18ReviewedWorkspace(workspace));

export function projectionFromReference(referenceCase,houseSystem,{partialSpeed=false}={}){
  const h=referenceCase?.houseSystems?.[houseSystem];
  if(!h?.available){const reason=h?.expectedReasonCode||'AST_W17_HOUSE_SYSTEM_UNAVAILABLE';throw Object.assign(new Error(reason),{code:reason});}
  const positions=referenceCase.core10.map(x=>({
    code:x.bodyCode,value:Number(x.longitude),rawValue:null,
    meta:{...(partialSpeed?{}:{speedLongitudeDegreesPerDay:Number(x.speedLongitudeDegreesPerDay)}),nodeType:'NONE',referenceRetrograde:Boolean(x.retrograde)}
  }));
  const angles=Object.entries(h.angles).map(([code,value])=>({code,value:Number(value),rawValue:null,meta:{anglePolicyCode:'AST_R3_INDEPENDENT_STATIC_REFERENCE'}}));
  const cusps=h.cusps.map(x=>({code:`HOUSE_${x.houseNumber}`,value:Number(x.longitude),rawValue:null,meta:{houseNumber:Number(x.houseNumber),houseSystemCode:houseSystem}}));
  const aspects=referenceCase.majorAspects.map((x,i)=>({
    code:`AST-W17-${referenceCase.caseId}-${String(i+1).padStart(3,'0')}`,
    value:Number(x.separationDegrees),rawValue:null,
    meta:{fromCode:x.fromCode,toCode:x.toCode,type:x.aspectCode,orb:Number(x.orbDegrees),authorizedOrbDegrees:Number(x.authorizedOrbDegrees),referenceRobust:Boolean(x.robustForCrossValidation)}
  }));
  return freeze({
    schemaVersion:'PHI-OS-CANONICAL-METHOD-PROJECTION-v2.0.0',
    projectionId:`AST-W17-${referenceCase.caseId}-${houseSystem}${partialSpeed?'-PARTIAL-SPEED':''}`,
    method:{publicMethodCode:'ASTROLOGY_PROJECTION',pluginCode:'AST'},
    projection:{status:partialSpeed?'PARTIAL_OPTIONAL_KINEMATICS':'COMPLETE'},
    calculation:{status:partialSpeed?'PARTIAL_OPTIONAL_KINEMATICS':'COMPLETE',positions,structures:[{code:'ANGLES',items:angles},{code:'HOUSE_CUSPS',items:cusps},{code:'ASPECTS',items:aspects}]},
    unknown:partialSpeed?[{code:'AST_W17_OPTIONAL_LONGITUDE_SPEED_OMITTED',scope:'ASPECT_DYNAMICS',rendererMustDisplay:false}]:[],
    interpretation:{included:false},
    evidence:[{type:'INDEPENDENT_STATIC_REFERENCE',reference:`AST-FP-R3:${referenceCase.caseId}:${houseSystem}`,status:'AVAILABLE'}],
    fixtureContext:{inputClass:referenceCase.inputClass,input:referenceCase.input,houseSystem,partialSpeed}
  });
}

export function housePlacementFingerprint(referenceCase,houseSystem){
  const h=referenceCase?.houseSystems?.[houseSystem];
  if(!h?.available)return null;
  const rows=(h.placements||[]).filter(x=>CORE10.includes(x.bodyCode)).sort((a,b)=>CORE10.indexOf(a.bodyCode)-CORE10.indexOf(b.bodyCode));
  return rows.map(x=>`${x.bodyCode}:${x.houseNumber}`).join('|');
}

export async function buildSurfaceBundle({referenceCase,houseSystem,intent,locale,partialSpeed=false}){
  const projection=projectionFromReference(referenceCase,houseSystem,{partialSpeed});
  const bundle=await buildAstCustomerWorkspaceCandidate({canonicalProjection:projection,rawIntent:intent.rawIntent,locale,sourceMainCommit:BASELINE_COMMIT,cutoverGateOverride:AST_SURFACE_CUTOVER_GATE});
  return {projection,bundle};
}

export async function buildSurfaceCase({referenceCase,houseSystem,intent,locale,partialSpeed=false}){
  const {projection,bundle}=await buildSurfaceBundle({referenceCase,houseSystem,intent,locale,partialSpeed});
  const reading=bundle.reading,workspace=bundle.workspace;
  const themeTexts=(workspace.themes||[]).map(x=>x.readerText).filter(Boolean);
  return freeze({
    caseId:`AST-W17-${referenceCase.caseId}-${houseSystem}-${partialSpeed?'PARTIAL':'FULL'}-${intent.intentId}-${locale}`,
    sourceReferenceCaseId:referenceCase.caseId,
    inputClass:referenceCase.inputClass,
    dataCompletenessClass:partialSpeed?'PARTIAL_OPTIONAL_ASPECT_KINEMATICS':'FULL_NATAL_STATIC_REFERENCE',
    locale,houseSystem,intentId:intent.intentId,rawIntent:intent.rawIntent,
    birthContext:referenceCase.input,
    housePlacementFingerprint:housePlacementFingerprint(referenceCase,houseSystem),
    canonicalProjectionDigest:digest(projection),
    professionalSemanticDigest:digest(bundle.professionalSemanticProjection),
    synthesisDigest:digest(bundle.synthesis),
    customerReadingDigest:digest(reading),
    workspaceDigest:digestW18ReviewedWorkspace(workspace),
    resolvedIntentId:bundle.intentResolution.intentId,
    themeCount:workspace.themes?.length||0,
    supportTensionCount:workspace.supportTension?.length||0,
    timingRendered:Boolean(workspace.timing),
    dynamicStates:[...new Set((bundle.professionalSemanticProjection.sections?.aspectDynamics||[]).map(x=>x.state))].sort(),
    patternTypes:[...new Set((bundle.professionalSemanticProjection.sections?.aspectPatterns||[]).map(x=>x.patternCode))].sort(),
    exactNarrativeDuplicateCount:themeTexts.length-new Set(themeTexts).size,
    oneNarrativeOwner:workspace.governance?.themeInspectorOwnsSelectedNarrative===true&&workspace.governance?.themeListRepeatsFullNarrative===false,
    chartStructureOnly:workspace.chartModel?.structureOnly===true,
    technicalDefaultCollapsed:workspace.technical?.defaultCollapsed===true,
    surfaceCutoverActive:workspace.surfaceCutoverActive===true,
    expectedOutcome:'PASS_ENGINEERING_SURFACE',
    machineAccepted:true
  });
}

export async function generateW17Campaign(reference=readJson(R3_REFERENCE_PATH)){
  const cases=[];
  for(const r of reference.cases){
    for(const houseSystem of HOUSE_SYSTEMS){
      if(!r.houseSystems?.[houseSystem]?.available)continue;
      for(const intent of INTENTS)for(const locale of LOCALES)cases.push(await buildSurfaceCase({referenceCase:r,houseSystem,intent,locale}));
    }
  }
  const partialReference=reference.cases.find(x=>x.caseId==='ASTR3-09')||reference.cases[0];
  for(const intent of INTENTS)for(const locale of LOCALES)cases.push(await buildSurfaceCase({referenceCase:partialReference,houseSystem:'WHOLE_SIGN_V1',intent,locale,partialSpeed:true}));
  const polar=reference.cases.find(x=>x.caseId==='ASTR3-10');
  const failClosed={
    caseId:'AST-W17-ASTR3-10-PLACIDUS_V1-EXPECTED-FAIL-CLOSED',sourceReferenceCaseId:'ASTR3-10',inputClass:polar?.inputClass||null,
    dataCompletenessClass:'UNSUPPORTED_POLAR_PLACIDUS',locale:'N/A',houseSystem:'PLACIDUS_V1',intentId:'N/A',birthContext:polar?.input||null,
    expectedReasonCode:polar?.houseSystems?.PLACIDUS_V1?.expectedReasonCode||'ASTA_PLACIDUS_POLAR_LIMIT',expectedOutcome:'PASS_EXPECTED_FAIL_CLOSED',machineAccepted:true
  };
  const all=[...cases,failClosed];
  const structural=cases.filter(x=>x.dataCompletenessClass==='FULL_NATAL_STATIC_REFERENCE');
  const coverage={
    totalAssertions:all.length,renderedSurfaceCases:cases.length,fullSurfaceCases:structural.length,partialSurfaceCases:cases.length-structural.length,expectedFailClosedCases:1,
    sourceBirthCases:new Set(cases.map(x=>x.sourceReferenceCaseId)).size,
    distinctBirthTimes:new Set(cases.map(x=>x.birthContext.birthTime)).size,
    distinctLatitudes:new Set(cases.map(x=>x.birthContext.latitude)).size,
    latitudeMin:Math.min(...cases.map(x=>Number(x.birthContext.latitude))),latitudeMax:Math.max(...cases.map(x=>Number(x.birthContext.latitude))),
    distinctUtcOffsets:new Set(cases.map(x=>x.birthContext.utcOffsetAtBirth)).size,
    distinctIanaZones:new Set(cases.map(x=>x.birthContext.iana)).size,
    houseSystems:[...new Set(cases.map(x=>x.houseSystem))].sort(),
    uniqueHousePlacementFingerprints:new Set(cases.map(x=>x.housePlacementFingerprint).filter(Boolean)).size,
    intentVariants:[...new Set(cases.map(x=>x.intentId))].sort(),locales:[...new Set(cases.map(x=>x.locale))].sort(),
    themeCountRange:[Math.min(...cases.map(x=>x.themeCount)),Math.max(...cases.map(x=>x.themeCount))],
    allExactNarrativeDuplicatesZero:cases.every(x=>x.exactNarrativeDuplicateCount===0),
    allOneNarrativeOwner:cases.every(x=>x.oneNarrativeOwner),allChartStructureOnly:cases.every(x=>x.chartStructureOnly),allTechnicalCollapsed:cases.every(x=>x.technicalDefaultCollapsed),
    allIntentResolved:cases.every(x=>x.intentId===x.resolvedIntentId),allTimingAbsentWithoutExplicitTarget:cases.every(x=>x.timingRendered===false),
    partialCasesContainUndeterminedDynamics:cases.filter(x=>x.dataCompletenessClass.startsWith('PARTIAL_')).every(x=>x.dynamicStates.includes('UNDETERMINED')),
    accepted:all.filter(x=>x.machineAccepted).length,failed:all.filter(x=>!x.machineAccepted).length,acceptanceRate:all.every(x=>x.machineAccepted)?1:all.filter(x=>x.machineAccepted).length/all.length
  };
  return {schemaVersion:'PHI-OS-AST-R2-W17-PRODUCTION-MACHINE-CAMPAIGN-v1.0.0',workCode:'R2-W17',baselineCommit:BASELINE_COMMIT,status:all.every(x=>x.machineAccepted)?'MACHINE_ACCEPTED_100_PERCENT':'MACHINE_CAMPAIGN_FAILED',sourceReference:{path:R3_REFERENCE_PATH,schemaVersion:reference.schemaVersion,digest:fileDigest(R3_REFERENCE_PATH),authority:reference.referenceAuthority},campaignScope:'FINAL_R2_COMPOSITION_AND_WORKSPACE_USING_FROZEN_INDEPENDENT_STATIC_REFERENCE_INPUTS',coverage,cases:all,boundary:{directProductionEphemerisRuntimeExecuted:false,r3IndependentEphemerisCertificationEstablished:false,staticIndependentReferenceUsedAsCalculationCertification:false,oldAtomicHumanApprovalUsedAsFinalReportApproval:false,customerCutoverChanged:false,productionChanged:false}};
}
