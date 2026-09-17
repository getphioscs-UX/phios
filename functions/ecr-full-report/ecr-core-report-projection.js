import {adaptEcrProductionInput} from '../single-method-reading/ecr-production-adapter.js';
import {buildCustomerClaimIR} from '../single-method-reading/customer-claim-ir.js';
import {ecrFullReportLocale} from '../runtime/locales/ecr-full-report.js';
import {ECR_FULL_REPORT_ADMISSION} from './ecr-full-report-admission.js';
const list=v=>Array.isArray(v)?v:[];
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))freeze(x);Object.freeze(v)}return v};
const fail=code=>{throw new Error(code)};
export const ECR_CORE_SECTION_IDS=Object.freeze(['OVERVIEW','PHI_CARD','CORE_QUESTION','CAPABILITY_REGION','DRIVER_PRIORITY','MOTION','PHI_CONFIGURATION','ACTIVATION','OBSERVABLE_SIGNALS','REALITY_NAVIGATION','METHOD_BOUNDARY']);

// Assembly consumes the existing Reading IR and the shared Customer Claim IR.
// No calculation, meaning lookup, card selection or interpretation is performed here.
export function assembleEcrCoreReport({readingIR,acceptedReading,phiCardSpread,locale='en',sharedEntitlement=null,reviewMode=false,contextProjection=null}){
 const copy=ecrFullReportLocale(locale),envelope=adaptEcrProductionInput(acceptedReading);
 if(acceptedReading.technical.projectionId!==readingIR.sourceProjectionId||acceptedReading.technical.meaningBundleCode!==readingIR.sourceMeaningBundleCode)fail('ECR_FULL_REPORT_SOURCE_MISMATCH');
 if(readingIR.locale!==locale||acceptedReading.locale!==locale||phiCardSpread.locale!==locale)fail('ECR_FULL_REPORT_LOCALE_MISMATCH');
 const admitted=new Map(envelope.acceptedUnits.map(x=>[x.interpretationUnitId,x]));
 for(const card of phiCardSpread.cards)if(!admitted.has(card.lineage?.interpretationUnitId))fail('ECR_FULL_REPORT_CARD_LINEAGE_MISSING');
 const core=readingIR.sections;
 const dimensions={GRAMMAR:core.coordinate.grammar,CORE_QUESTION:core.coordinate.question,CAPABILITY_REGION:core.response.capabilities,DRIVER_PRIORITY:core.response.driverPriority,MOTION:core.change.motion,PHI_CONFIGURATION:core.change.configuration,ACTIVATION:core.change.activation};
 if(Object.values(dimensions).some(x=>!list(x).length))fail('ECR_FULL_REPORT_STRUCTURAL_IDENTITY_REQUIRED');
 const structuralIdentity=Object.fromEntries(Object.entries(dimensions).map(([k,v])=>[k,v.map(x=>({code:x.code,...(x.meta?.rank?{rank:x.meta.rank}:{})}))]));
 const paid=sharedEntitlement?.schemaVersion==='PHI-OS-KAP-W45-METHOD-JOURNEY-ENTITLEMENT-v1.0.0'&&sharedEntitlement.methodCode==='ECR'&&sharedEntitlement.access?.methodAllowed===true&&sharedEntitlement.access?.readingDepthAllowed===true;
 const depth=paid?'PAID':'FREE';
 if(!reviewMode&&!ECR_FULL_REPORT_ADMISSION.customerPublishable)fail('ECR_FULL_REPORT_REVIEW_ONLY');
 const sharedClaims=buildCustomerClaimIR({acceptedMethodReadingEnvelope:envelope});
 const claimFor=group=>{
  const unit=envelope.acceptedUnits.find(x=>x.projectionRefs.some(ref=>ref.includes(`#${group}:`)));
  if(!unit)fail('ECR_FULL_REPORT_DIMENSION_LINEAGE_MISSING');
  return sharedClaims.claims.find(c=>c.interpretationUnitRefs.includes(unit.interpretationUnitId));
 };
 // Motion's atomic definition is already an admitted canonical statement. Reuse
 // the shared claim adapter to retain the same claim schema, with no new prose.
 const motionCode=core.change.motion[0].code;
 const motionStatement=core.canonicalMeaning.statements.find(x=>x.semanticCode===`ECR-M-${motionCode}`);
 if(!motionStatement?.contentCanonical||!motionStatement.mappingReference)fail('ECR_FULL_REPORT_MOTION_MEANING_REQUIRED');
 const motionUnit={interpretationUnitId:motionStatement.statementId,title:copy.sections[5],summary:motionStatement.contentCanonical,projectionRefs:[`${readingIR.sourceProjectionId}#ECR_MOTION:${motionCode}`],meaningRefs:motionStatement.meaningReferences,derivationRefs:[motionStatement.mappingReference],boundaryRefs:motionStatement.limitationReferences,confidenceBoundary:copy.boundary,subject:motionCode};
 const motionClaim=buildCustomerClaimIR({acceptedMethodReadingEnvelope:{...envelope,acceptedUnits:[motionUnit]}}).claims[0];
 const section=(index,fields)=>({sectionId:ECR_CORE_SECTION_IDS[index],number:index+1,title:copy.sections[index],...fields});
 const factRows=key=>dimensions[key].map(item=>({code:item.code,label:locale==='zh-Hans'?(item.meta?.questionZhHans||item.meta?.labelZhHans||item.meta?.label||item.code):(item.meta?.question||item.meta?.label||item.code),rank:item.meta?.rank||null,sourceRefs:[`${readingIR.sourceProjectionId}#${key}:${item.code}`]}));
 const fieldRefs={CORE_QUESTION:'ECR_QUESTION',CAPABILITY_REGION:'ECR_CAPABILITIES',DRIVER_PRIORITY:'ECR_DRIVER_PRIORITY',MOTION:'ECR_MOTION',PHI_CONFIGURATION:'ECR_CONFIGURATION',ACTIVATION:'ECR_ACTIVATION'};
 const facts=key=>factRows(key).map(x=>{const meaning=key==='PHI_CONFIGURATION'?core.canonicalMeaning.statements.find(s=>s.semanticCode===`ECR-H-${x.code}`):null;return {...x,label:meaning?.contentCanonical||x.label,sourceRefs:[`${readingIR.sourceProjectionId}#${fieldRefs[key]}:${x.code}`,...list(meaning?.meaningReferences)]}});
 const observed=new Set(),asked=new Set();
 const collect=(field,seen)=>envelope.acceptedUnits.flatMap(unit=>list(unit[field]).filter(text=>text&&!seen.has(text)&&seen.add(text)).map(text=>({text,interpretationUnitRef:unit.interpretationUnitId,sourceRefs:[...unit.projectionRefs,...unit.meaningRefs,...unit.derivationRefs]})));
 const signals=collect('observableSignals',observed),questions=collect('realityComparisonQuestions',asked);
 if(!signals.length||!questions.length)fail('ECR_FULL_REPORT_OBSERVATION_LINEAGE_REQUIRED');
 const sections=[section(0,{body:copy.overview}),section(1,{cards:phiCardSpread.cards}),section(2,{facts:facts('CORE_QUESTION'),claims:[claimFor('ECR_CONTEXT')]}),section(3,{facts:facts('CAPABILITY_REGION'),claims:[claimFor('ECR_CAPABILITIES')]}),section(4,{facts:facts('DRIVER_PRIORITY'),claims:[claimFor('ECR_DRIVER_PRIORITY')],body:copy.driverBoundary}),section(5,{facts:facts('MOTION'),claims:[motionClaim]}),section(6,{facts:facts('PHI_CONFIGURATION'),claims:[claimFor('ECR_MOTION')]}),section(7,{facts:facts('ACTIVATION'),claims:[claimFor('ECR_ACTIVATION')],body:copy.activationBoundary}),section(8,{observations:signals}),section(9,{observations:questions,body:copy.navigationBoundary}),section(10,{body:copy.boundary})];
 // Context claims arrive from the interpretation owner, never from the renderer.
 const contextSections=list(contextProjection?.sections);
 if(contextSections.length){
  if(contextProjection.owner!=='CANONICAL_INTERPRETATION_KERNEL'||contextProjection.sourceProjectionId!==readingIR.sourceProjectionId||contextProjection.locale!==locale)fail('ECR_FULL_REPORT_CONTEXT_LINEAGE_MISMATCH');
  if(contextSections.some(s=>!['EMBODIED_CONFIGURATION','EXPERIENCE_EXPRESSION','CURRENT_REALITY_COMPARISON'].includes(s.sectionId)))fail('ECR_FULL_REPORT_CONTEXT_SECTION_INVALID');
  for(const s of contextSections)if(reviewMode||ECR_FULL_REPORT_ADMISSION.contextSections[s.sectionId]===true)sections.push(s);
 }
 const safeCards=phiCardSpread.cards.map(({flowingExpression,strainedExpression,canonicalCustomerMeaning,contextualEvidence,observationPrompt,...card})=>card);
 const freeSections=[section(1,{cards:safeCards}),section(0,{body:copy.overview}),...sections.slice(2,8).map(({claims,...s})=>s),section(10,{body:copy.boundary})];
 return freeze({schemaVersion:'PHI-OS-ECR-CUSTOMER-FULL-REPORT-v1.0.0',edition:'ECR_FULL_R1',productId:'ECR_FULL_REPORT',methodId:'ECR',reportId:`ECR-FULL-R1-${readingIR.sourceProjectionId}`,sourceProjectionId:readingIR.sourceProjectionId,locale,depth,publicationState:reviewMode?'INTERNAL_REVIEW':'CUSTOMER_PUBLISHABLE',title:paid?copy.title:copy.freeTitle,subtitle:copy.subtitle,copy,structuralIdentity,phiCardIds:phiCardSpread.cards.map(x=>x.cardId),sections:paid?sections:freeSections,visualAssetId:'COM-REPORT-ECR-FULL',claims:paid?[...sharedClaims.claims,motionClaim,...sections.filter(s=>s.number>11).flatMap(s=>list(s.claims))]:[],lineage:{projectionId:readingIR.sourceProjectionId,meaningBundleCode:readingIR.sourceMeaningBundleCode,acceptedReadingRef:envelope.readingAuthorityRef,semanticDigest:envelope.semanticDigest,phiCardMappingRef:'content/ecr-phi-card/ecr-result-to-phi-card-mapping-matrix-v2.json'},boundaries:{newMeaningCreated:false,recalculated:false,currentRealityOverwritesBaseline:false,crossProseBackfeed:false},access:{depth,entitlementOwner:'KAP_W45_SHARED_METHOD_JOURNEY',paidPayloadIncluded:paid,checkoutEnabled:false}});
}
