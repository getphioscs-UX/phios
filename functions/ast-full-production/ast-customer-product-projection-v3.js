import {sha256Canonical} from '../canonical-meaning-runtime/canonical-meaning-runtime.js';

export const AST_CUSTOMER_PRODUCT_PROJECTION_V3_SCHEMA='PHI-OS-AST-CUSTOMER-PRODUCT-PROJECTION-v3.0.0';
export const AST_CX_R3_BASELINE_COMMIT='150ebe1dd255e4570a0a345fa330b598ebc2a4f8';

const CORE=Object.freeze(['SUN','MOON','MERCURY','VENUS','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO']);
const SIGNS=Object.freeze(['ARIES','TAURUS','GEMINI','CANCER','LEO','VIRGO','LIBRA','SCORPIO','SAGITTARIUS','CAPRICORN','AQUARIUS','PISCES']);
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const list=v=>Array.isArray(v)?v:[];
const uniq=v=>[...new Set(list(v).filter(Boolean))];
const fail=code=>{throw Object.assign(new Error(code),{code})};
const norm=v=>((Number(v)%360)+360)%360;
const signCode=v=>SIGNS[Math.floor(norm(v)/30)]||null;
const pick=(o,l,f='')=>o?.[l]??o?.en??f;
const structure=(p,code)=>list(p?.calculation?.structures).find(x=>x.code===code)?.items||[];
const readingSection=(reading,id)=>list(reading?.sections).find(x=>x.sectionId===id);
const signDegree=v=>Number((norm(v)%30).toFixed(8));

function houseSystemId(cusps){
 const ids=uniq(cusps.map(x=>x?.meta?.houseSystemCode));
 return ids.length===1?ids[0]:ids.length?`MIXED:${ids.join('|')}`:null;
}
function labels(languageRegistry,locale){
 return {
  body:code=>pick(languageRegistry?.bodyLabels?.[code],locale,code),
  sign:code=>pick(languageRegistry?.signLabels?.[code],locale,code),
  angle:code=>pick(languageRegistry?.angleLabels?.[code],locale,({ASC:'Ascendant',MC:'Midheaven',DSC:'Descendant',IC:'Imum Coeli'})[code]||code)
 };
}
function narrativeProjection(reading){
 const overview=readingSection(reading,'OVERVIEW');
 const themes=readingSection(reading,'CORE_THEMES');
 const deep=readingSection(reading,'DEEP_DIVE');
 const signals=readingSection(reading,'SUPPORT_TENSION');
 const intent=readingSection(reading,'INTENT');
 const deepMap=new Map(list(deep?.items).map(x=>[x.themeRef,x]));
 const projectedThemes=list(themes?.items).map(x=>{
  const d=deepMap.get(x.themeRef)||{};
  return {
   themeRef:x.themeRef,rank:x.rank,tier:x.tier,readerTitle:x.readerTitle,readerText:x.text,
   narrativeRef:x.narrativeRef,renderOwnerId:x.renderOwnerId,technicalLabel:x.technicalLabel||null,
   familyCode:d.familyCode||null,patternCode:d.patternCode||null,bodyCodes:list(d.bodyCodes),houseNumbers:list(d.houseNumbers),angleCodes:list(d.angleCodes),
   dynamicCounts:d.dynamicCounts||null,distribution:d.distribution||null,evidenceRefs:list(d.evidenceRefs),sourceRefs:list(x.sourceRefs)
  };
 });
 const support=list(signals?.items).filter(x=>x.itemType==='SUPPORT_SIGNAL').map(x=>({signalRef:x.signalRef,readerText:x.readerText,dynamicState:x.dynamicState||null,sourceRefs:list(x.sourceRefs)}));
 const tension=list(signals?.items).filter(x=>x.itemType==='TENSION_SIGNAL').map(x=>({signalRef:x.signalRef,readerText:x.readerText,dynamicState:x.dynamicState||null,sourceRefs:list(x.sourceRefs)}));
 const intentItem=list(intent?.items)[0]||null;
 return {overview:list(overview?.items)[0]||null,themes:projectedThemes,support,tension,intent:intentItem};
}
function chartProjection({canonicalProjection,synthesis,professionalSemanticProjection,languageRegistry,locale}){
 const L=labels(languageRegistry,locale),bodyEvidence=synthesis?.bodyEvidence||{},positions=list(canonicalProjection?.calculation?.positions).filter(x=>CORE.includes(x.code));
 const cusps=structure(canonicalProjection,'HOUSE_CUSPS');
 const angles=structure(canonicalProjection,'ANGLES');
 const aspects=structure(canonicalProjection,'ASPECTS');
 const dynamics=new Map(list(professionalSemanticProjection?.sections?.aspectDynamics).map(x=>[x.aspectCode,x]));
 const patternMembership=new Map();
 for(const p of list(professionalSemanticProjection?.sections?.aspectPatterns))for(const code of list(p.evidenceAspectCodes)){const current=patternMembership.get(code)||[];current.push(p.patternCode);patternMembership.set(code,current)}
 return {
  houseSystemId:houseSystemId(cusps),
  zodiac:'TROPICAL',
  positions:positions.map(x=>{
   const b=bodyEvidence[x.code]||{},s=b.signCode||signCode(x.value);
   return {bodyCode:x.code,bodyLabel:L.body(x.code),longitude:norm(x.value),signCode:s,signLabel:L.sign(s),degreeWithinSign:signDegree(x.value),houseNumber:Number.isFinite(Number(b.houseNumber))?Number(b.houseNumber):null,retrograde:Number(x?.meta?.speedLongitudeDegreesPerDay)<0,speedLongitudeDegreesPerDay:Number.isFinite(Number(x?.meta?.speedLongitudeDegreesPerDay))?Number(x.meta.speedLongitudeDegreesPerDay):null,meaningRefs:uniq([b.functionMeaningRef,b.directionMeaningRef,b.domainMeaningRef]),sourceRefs:uniq([canonicalProjection.projectionId,b.functionMeaningRef,b.directionMeaningRef,b.domainMeaningRef])};
  }),
  angles:angles.map(x=>({angleCode:x.code,label:L.angle(x.code),longitude:norm(x.value),signCode:signCode(x.value),signLabel:L.sign(signCode(x.value)),degreeWithinSign:signDegree(x.value),sourceRefs:uniq([canonicalProjection.projectionId])})),
  houses:cusps.map(x=>({houseNumber:Number(x?.meta?.houseNumber||String(x.code||'').replace('HOUSE_','')),longitude:norm(x.value),signCode:signCode(x.value),signLabel:L.sign(signCode(x.value)),houseSystemId:x?.meta?.houseSystemCode||null,sourceRefs:uniq([canonicalProjection.projectionId])})).sort((a,b)=>a.houseNumber-b.houseNumber),
  aspects:aspects.map(x=>{const d=dynamics.get(x.code)||{};return {aspectRef:x.code,fromCode:x?.meta?.fromCode||null,toCode:x?.meta?.toCode||null,type:x?.meta?.type||null,orbDegrees:Number(x?.meta?.orb??d.currentOrbDegrees??0),authorizedOrbDegrees:Number(x?.meta?.authorizedOrbDegrees??0),dynamicState:d.state||'UNDETERMINED',patternCodes:uniq(patternMembership.get(x.code)||[]),sourceRefs:uniq([x.code])}})
 };
}
function planetHouseDirectory(chart,synthesis){
 const evidence=synthesis?.bodyEvidence||{};
 return chart.positions.map(p=>{const e=evidence[p.bodyCode]||{};return {bodyCode:p.bodyCode,bodyLabel:p.bodyLabel,signCode:p.signCode,signLabel:p.signLabel,degreeWithinSign:p.degreeWithinSign,houseNumber:p.houseNumber,retrograde:p.retrograde,functionLabel:e.functionLabel||null,directionLabel:e.directionLabel||null,domainLabel:e.domainLabel||null,meaningRefs:uniq([e.functionMeaningRef,e.directionMeaningRef,e.domainMeaningRef]),sourceRefs:uniq([...(p.sourceRefs||[]),e.functionMeaningRef,e.directionMeaningRef,e.domainMeaningRef])}});
}
function technicalProjection({canonicalProjection,professionalSemanticProjection,synthesis,reading,chart}){
 const technicalItem=list(readingSection(reading,'TECHNICAL')?.items)[0]||{};
 return {defaultCollapsed:true,projectionId:canonicalProjection.projectionId||null,canonicalProjectionSchema:canonicalProjection.schemaVersion,professionalSemanticSchema:professionalSemanticProjection.schemaVersion,synthesisSchema:synthesis.schemaVersion,readingSchema:reading.schemaVersion,houseSystemId:chart.houseSystemId,compositionRuleVersion:synthesis?.technicalLineage?.compositionRuleVersion||technicalItem.compositionRuleVersion||null,meaningOntologyVersion:synthesis?.technicalLineage?.meaningOntologyVersion||technicalItem.meaningOntologyVersion||null,r4aAdmissionStatus:technicalItem.r4aAdmissionStatus||null,sourceRefs:uniq([...(technicalItem.sourceRefs||[]),'AST-FP-R3','AST-FP-R4','AST-FP-R4A','AST-FP-R5','AST-R2-W19','AST-R2-W20'])};
}
export async function buildAstCustomerProductProjectionV3({canonicalProjection,professionalSemanticProjection,synthesis,reading,intentResolution,languageRegistry,temporalIR=null}={}){
 if(canonicalProjection?.schemaVersion!=='PHI-OS-CANONICAL-METHOD-PROJECTION-v2.0.0'||canonicalProjection?.method?.publicMethodCode!=='ASTROLOGY_PROJECTION')fail('AST_CX_R3_CANONICAL_AST_REQUIRED');
 if(professionalSemanticProjection?.schemaVersion!=='PHI-OS-AST-PROFESSIONAL-SEMANTIC-PROJECTION-v1.0.0')fail('AST_CX_R3_R4_PROJECTION_REQUIRED');
 if(synthesis?.schemaVersion!=='PHI-OS-AST-WHOLE-CHART-SYNTHESIS-v1.0.0')fail('AST_CX_R3_R5_SYNTHESIS_REQUIRED');
 if(reading?.schemaVersion!=='PHI-OS-AST-CUSTOMER-READING-IA-v2.0.0')fail('AST_CX_R3_READING_V2_REQUIRED');
 const locale=reading.locale==='zh-Hans'?'zh-Hans':'en';
 const narrative=narrativeProjection(reading),chart=chartProjection({canonicalProjection,synthesis,professionalSemanticProjection,languageRegistry,locale});
 const rulership=professionalSemanticProjection.sections?.rulership||{},distribution=professionalSemanticProjection.sections?.elementModality||{};
 const patterns=list(professionalSemanticProjection.sections?.aspectPatterns).map(p=>({patternCode:p.patternCode,label:pick(p.label,locale,p.patternCode),bodyCodes:list(p.bodyCodes),evidenceAspectRefs:list(p.evidenceAspectCodes),apexBodyCode:p.apexBodyCode||null,maxNormalizedOrb:Number.isFinite(Number(p.maxNormalizedOrb))?Number(p.maxNormalizedOrb):null,themeRefs:narrative.themes.filter(t=>t.patternCode===p.patternCode&&list(p.bodyCodes).every(code=>t.bodyCodes.includes(code))).map(t=>t.themeRef),sourceRefs:uniq([...(p.evidenceAspectCodes||[])])}));
 const timingAuthorized=temporalIR?.schemaVersion==='PHI-OS-AST-GOVERNED-TEMPORAL-READING-IR-v1.0.0'&&temporalIR?.customerPublicationAllowed===true;
 const core={schemaVersion:AST_CUSTOMER_PRODUCT_PROJECTION_V3_SCHEMA,workCode:'AST-CX-R3-W2-W4',methodId:'AST',baselineCommit:AST_CX_R3_BASELINE_COMMIT,locale,projectionId:canonicalProjection.projectionId||null,houseSystemId:chart.houseSystemId,overview:{readerTitle:narrative.overview?.readerTitle||null,readerSummary:narrative.overview?.text||narrative.overview?.readerSummary||null,narrativeRef:narrative.overview?.narrativeRef||null,renderOwnerId:narrative.overview?.renderOwnerId||null,sourceRefs:list(narrative.overview?.sourceRefs)},chart,keyConfigurations:narrative.themes,wholeChartReading:{overview:narrative.overview,themes:narrative.themes,support:narrative.support,tension:narrative.tension,unknowns:list(canonicalProjection.unknown)},planetHouseDirectory:planetHouseDirectory(chart,synthesis),aspectNetwork:{aspects:chart.aspects,patterns,dynamics:list(professionalSemanticProjection.sections?.aspectDynamics)},rulership:{schoolPolicy:rulership.schoolPolicy||null,chartRuler:rulership.chartRuler||null,houseRulers:list(rulership.houseRulers),planetaryDispositors:list(rulership.planetaryDispositors),dispositorChains:list(rulership.dispositorChains),finalDispositors:list(rulership.finalDispositors),cycles:list(rulership.cycles),sourceRefs:['AST-R4-RULERSHIP']},distribution:{scope:distribution.scope||null,elementCounts:distribution.elementCounts||{},modalityCounts:distribution.modalityCounts||{},signCounts:distribution.signCounts||{},elementLeader:distribution.elementLeader||null,modalityLeader:distribution.modalityLeader||null,leaderPolicy:distribution.leaderPolicy||null,sourceRefs:['AST-R4-ELEMENT-MODALITY']},intentViews:[{intentId:intentResolution?.intentId||'OPEN',resolution:intentResolution?.resolution||null,priorityThemeRefs:list(narrative.intent?.themeRefs),readerText:narrative.intent?.readerText||null,sourceRefs:list(narrative.intent?.sourceRefs),meaningChanged:false}],timing:timingAuthorized?{state:'AVAILABLE',targetContext:temporalIR.targetContext||null,items:list(temporalIR.items).map(x=>({temporalClaimRef:x.temporalClaimRef||null,readerText:x.readerText||null,sourceRefs:list(x.sourceRefs)})),sourceRefs:uniq(list(temporalIR.items).flatMap(x=>list(x.sourceRefs)))}:{state:'UNAVAILABLE',reason:'AST_TEMPORAL_AUTHORITY_NOT_SUPPLIED',items:[],sourceRefs:[]},realityComparison:{state:'NOT_BOUND',owner:'CX-R12R4B',items:[]},technical:technicalProjection({canonicalProjection,professionalSemanticProjection,synthesis,reading,chart}),governance:{projectionOnly:true,createsCalculation:false,createsCanonicalProjection:false,createsMeaning:false,createsReadingAuthority:false,createsCrossMethodComposition:false,createsCurrentReality:false,rendererMayCreateMeaning:false,customerIntentChangesMeaning:false,rawCandidateMeaningPromoted:false,sourceAuthoritiesPreserved:true,pprR3SharedHostMutationRequired:false}};
 const semanticDigest=await sha256Canonical(core);
 return freeze({...core,semanticDigest});
}
export default Object.freeze({AST_CUSTOMER_PRODUCT_PROJECTION_V3_SCHEMA,AST_CX_R3_BASELINE_COMMIT,buildAstCustomerProductProjectionV3});
