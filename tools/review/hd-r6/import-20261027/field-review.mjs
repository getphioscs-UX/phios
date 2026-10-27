// Review projections only; never imported by product/runtime registries or used as a release owner.
import {inspectHdReportChartConsistency,verifyHdConfirmationSnapshot} from '../../../../functions/external-profile/hd-report-automation-candidate.js';
import {orientationFromTone} from '../../../../functions/method-runtime/personal-structure/variable-calibration.js';
export const retiredSourceIds=Object.freeze(['HD-UA-COGNITION-4','HD-R3-W11-COGNITION-4']);
const centerCodes={Ajna:'AJNA',Throat:'THROAT',G:'G',Sacral:'SACRAL',Ego:'EGO',SolarPlexus:'SOLAR_PLEXUS',Head:'HEAD',Spleen:'SPLEEN',Root:'ROOT'},pair=x=>[...x].sort((a,b)=>a-b).join('-');
export function resolveEditorialAlias(chart,alias){
 const a=/^(personality|design)\.(sun|earth)\.(gate|line)$/.exec(alias);if(a){const list=chart.activations?.filter(x=>x.layer===a[1].toUpperCase()&&x.bodyCode===a[2].toUpperCase());if(!list?.length)return {state:'MISSING'};if(list.length!==1)return {state:'CONTRADICTORY',reason:'DUPLICATE_ACTIVATION'};return Number.isInteger(list[0][a[3]])?{state:'VALUE',value:list[0][a[3]]}:{state:'MISSING'};}
 const value=({'type':chart.typeCode,'authority':chart.authority,'definition':chart.definition?.definitionCode,'profile':chart.profile?.profileCode,'centers.defined':chart.definedCenters,'centers.undefined':chart.undefinedCenters,'variables.designTopLeft.orientation':chart.variables?.fields?.designUpper?.orientation,'variables.determination.color':chart.variables?.fields?.designUpper?.color})[alias];
 if(alias==='variables.determination.soundSubtype')return {state:'UNMAPPED',reason:'NO_ADMITTED_LOW_SOUND_SUBTYPE_FIELD'};
 if(alias==='completeChannel'){if(!Array.isArray(chart.channels))return {state:'MISSING'};if(chart.channels.some(c=>!Array.isArray(c.gates)||c.gates.length!==2||c.gateA!=null&&c.gateB!=null&&pair(c.gates)!==pair([c.gateA,c.gateB])))return {state:'CONTRADICTORY',reason:'CHANNEL_STRUCTURE_CONFLICT'};return {state:'VALUE',value:chart.channels.map(c=>pair(c.gates))};}
 if(value===undefined||value===null)return {state:'MISSING'};return {state:'VALUE',value};
}
export function predicateMatches(chart,p){
 const got=resolveEditorialAlias(chart,p.fieldAlias);if(got.state!=='VALUE')return {...got,matched:null};
 let expected=p.value;if(p.fieldAlias==='definition'&&expected==='TRIPLE_SPLIT')expected='TRIPLE_SPLIT_DEFINITION';
 if(p.fieldAlias==='completeChannel')return {state:'VALUE',matched:got.value.includes(pair(String(expected).split('-').map(Number)))};
 if(p.fieldAlias.startsWith('centers.')){if(!Array.isArray(got.value))return {state:'CONTRADICTORY',matched:null};const want=String(expected).split(',').map(k=>centerCodes[k]);if(want.some(v=>!v))return {state:'UNMAPPED',matched:null};return {state:'VALUE',matched:JSON.stringify([...got.value].sort())===JSON.stringify([...want].sort())};}
 if(!['eq','eq_or_contains'].includes(p.op))return {state:'UNMAPPED',matched:null};return {state:'VALUE',matched:got.value===expected};
}
export function checkChartContradictions(chart){
 const issues=[...inspectHdReportChartConsistency(chart).issues],a=chart.activations||[];if(new Set(a.map(x=>x.activationId)).size!==a.length)issues.push('DUPLICATE_ACTIVATION_ID');if(chart.definedCenters?.some(c=>chart.undefinedCenters?.includes(c)))issues.push('CENTER_BOTH_DEFINED_AND_UNDEFINED');
 for(const c of chart.channels||[]){if(c.gateA!=null&&c.gateB!=null&&pair(c.gates)!==pair([c.gateA,c.gateB]))issues.push('CHANNEL_STRUCTURE_CONFLICT');if(c.gates.some(g=>!a.some(x=>x.gate===g)))issues.push('CHANNEL_GATE_NOT_ACTIVATED');}
 for(const v of Object.values(chart.variables?.fields||{})){if(v.tone!=null&&v.orientation!==orientationFromTone(v.tone))issues.push('VARIABLE_TONE_ORIENTATION_CONFLICT');}
 return [...new Set(issues)];
}
export function evaluateEditorialConditions(chart,conditions){const results=conditions.all.map(p=>({...p,...predicateMatches(chart,p)}));return {matched:results.every(r=>r.matched===true),states:results,extraRequiredClearances:conditions.extraRequiredClearances||[]};}
export async function reviewParagraph(row,{rule,preview,token,options,confirmationOwner,activeSourceIds,permittedSourceIds=[],paragraphSemanticPassed=false,paragraphRightsPassed=false,lowSoundSubtypeVerified=false,requestedUse='OWNER_REVIEW'}={}){
 const blockers=[];try{const bound=verifyHdConfirmationSnapshot(token,preview,options);await confirmationOwner.assertActive(bound);if(row.confirmedInputDigest!==bound.inputDigest||row.chartResultDigest!==bound.chartResultDigest||JSON.stringify(row.calculationVersion)!==JSON.stringify(bound.calculationVersion))blockers.push('IMMUTABLE_REVIEW_SNAPSHOT_BINDING_MISMATCH');}catch(e){blockers.push(e.message);}
 blockers.push(...checkChartContradictions(preview.chart));const predicates=evaluateEditorialConditions(preview.chart,{all:[...rule.when.all,...(row.additionalConditions?.all||[])],extraRequiredClearances:[...rule.when.extraRequiredClearances,...(row.additionalConditions?.extraRequiredClearances||[])]});if(!predicates.matched)blockers.push('CALCULATED_PREDICATE_FALSE_MISSING_OR_UNMAPPED');
 const sources=row.activeSourceIds||[];if(sources.length===0)blockers.push('PARAGRAPH_SOURCE_BINDING_UNDECLARED');if(sources.some(s=>!activeSourceIds.includes(s)||retiredSourceIds.includes(s)))blockers.push('UNAUTHORIZED_OR_WITHDRAWN_SOURCE');if(sources.some(s=>!permittedSourceIds.includes(s)))blockers.push('SOURCE_USE_NOT_CLEARED');
 if(row.sectionId==='SEC09'&&preview.chart.incarnationCross?.namedCross==null)blockers.push('UNVERIFIED_CROSS_NAME_STOP');
 if(row.subsectionId==='SEC10.06'&&!lowSoundSubtypeVerified)blockers.push('LOW_SOUND_SUBTYPE_UNVERIFIED_STOP');
 if(row.sectionId==='SEC10'||row.sectionId==='SEC15')blockers.push('RELEVANT_PHS_OR_SYNTHESIS_SCOPE_NOT_ADMITTED');
 if(!paragraphSemanticPassed)blockers.push('PARAGRAPH_SEMANTICS_NOT_ADMITTED');if(!paragraphRightsPassed)blockers.push('PARAGRAPH_RIGHTS_OPEN');
 if(row.canonicalModuleId==null)blockers.push('NO_EXISTING_CANONICAL_PARAGRAPH_MODULE_BINDING');if(row.sectionId==='SEC15')blockers.push('SEC15_OWNER_EDITORIAL_REVIEW_PENDING');
 if(requestedUse!=='OWNER_REVIEW')blockers.push('MODEL_TRAINING_PROFESSIONAL_CORPUS_OR_CUSTOMER_USE_NOT_AUTHORIZED');
 // This candidate never supplies text to a customer renderer. No caller flag bypasses existing release authority.
 return {reviewLocation:row.reviewLocation,selectionProbe:predicates,blockers:[...new Set(blockers)],disposition:'HOLD',customerParagraph:null,publicationAllowed:false,commercialGate:'BLOCKED',providerCalls:0};
}
