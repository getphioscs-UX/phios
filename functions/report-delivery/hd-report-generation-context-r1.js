import sources from '../../content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W2A-user-authored-source-units-v1.json' with {type:'json'};
import gateSources from '../../content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/source/HD-PRO-R3-W9-gate-source-resolution-v1.json' with {type:'json'};
import {TYPE_RULES} from '../external-profile/hd-intake-reconciliation.js';
import {resolveActivationSubstructure} from '../method-runtime/personal-structure/substructure.js';
import {deriveCalibrationVariables} from '../method-runtime/personal-structure/variable-calibration.js';
import {sha256,stableSerialize} from '../method-runtime/shared-calculation-runtime.js';
import {ACTIVATION_BODIES} from '../method-runtime/personal-structure/activation-builder.js';
import {prepareOpenAIStructuredRequest} from '../personal-reading/narrative/narrative-provider.js';
import {HD_REPORT_SOURCE_POLICY,HD_USER_WORKBOOK_SHA256,HD_REPORT_SOURCE_RULES} from './hd-report-source-policy-r1.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const typeName={GENERATOR:'Generator',MANIFESTING_GENERATOR:'Manifesting Generator',PROJECTOR:'Projector',MANIFESTOR:'Manifestor',REFLECTOR:'Reflector'};
const keyChannel=x=>String(x).split('-').map(Number).sort((a,b)=>a-b).join('-');
const roles=[['designUpper','DETERMINATION'],['designLower','ENVIRONMENT'],['personalityUpper','MOTIVATION'],['personalityLower','PERSPECTIVE']];
const title={SEC01:'Architecture',SEC02:'Type and Strategy',SEC03:'Authority',SEC04:'Definition',SEC05:'Centers',SEC06:'Channels',SEC07:'Gates and Lines',SEC08:'Profile',SEC09:'Cross',SEC10:'Variables and PHS',SEC11:'Environment and Cognition',SEC12:'Relationships',SEC13:'Work',SEC14:'Resources',SEC15:'Integration',SEC16:'Reality Comparison',SEC17:'Practice'};

// Only server-loaded, consent-bound calculation evidence is accepted here.
// Preparation never invokes a model, reserves money or changes a saved chart.
export async function buildHdReportGenerationContext({ownedSource,subjectBinding,calculationEvidence,locale='en',explicitBackground=null}={}){
 if(!['en','zh-Hans'].includes(locale))fail('HD_REPORT_LANGUAGE_REQUIRED');
 for(const k of ['ownerAccountId','personId','personVersion','inputDigest'])if(!subjectBinding?.[k]||subjectBinding[k]!==ownedSource?.subjectBinding?.[k])fail('HD_REPORT_SUBJECT_MISMATCH');
 if(sources.source.sha256!==HD_USER_WORKBOOK_SHA256)fail('HD_REPORT_REGISTERED_WORKBOOK_DRIFT');
 const f=structuredClone(ownedSource.full17Facts?.facts),ref=ownedSource.full17Facts?.calculationReference;
 if(!f||!ref?.outputDigest||!ownedSource.methodConsentRef||!ownedSource.reportConsentRef)fail('HD_REPORT_OWNED_CALCULATION_REQUIRED');
 const acts=f.activations;if(acts?.length!==26||new Set(acts.map(a=>a.layer+':'+a.bodyCode)).size!==26)fail('HD_REPORT_ACTIVATION_IDENTITY_CONFLICT');
 for(const a of acts){if(!['PERSONALITY','DESIGN'].includes(a.layer)||!ACTIVATION_BODIES.includes(a.bodyCode)||!Number.isFinite(a.eclipticLongitude))fail('HD_REPORT_ACTIVATION_IDENTITY_CONFLICT');const mapped=resolveActivationSubstructure(a.eclipticLongitude);if(mapped.gate!==a.gate||mapped.line!==a.line)fail('HD_REPORT_GATE_LINE_MAPPING_CONFLICT');}
 let raw=null;
 if(calculationEvidence){
  if(calculationEvidence.outputDigest!==ref.outputDigest||await sha256(calculationEvidence.output)!==ref.outputDigest)fail('HD_REPORT_CALCULATION_DIGEST_MISMATCH');
  raw=calculationEvidence.output;
  for(const a of acts){const r=raw.activations?.find(r=>r.layer===a.layer&&r.bodyCode===a.bodyCode);if(!r||['gate','line','eclipticLongitude'].some(k=>r[k]!==a[k]))fail('HD_REPORT_CALCULATION_PROJECTION_MISMATCH');}
  if(raw.typeCode!==f.typeCode||raw.authorityCode!==f.authority)fail('HD_REPORT_CORE_FIELD_MISMATCH');
 }
 const four=[['PERSONALITY','SUN'],['PERSONALITY','EARTH'],['DESIGN','SUN'],['DESIGN','EARTH']].map(([layer,bodyCode])=>acts.find(a=>a.layer===layer&&a.bodyCode===bodyCode));
 const tuple=four.map(a=>a.gate).join('/');
 const config=f.incarnationConfiguration;
 const expectedTuple=[config?.personalitySun,config?.personalityEarth,config?.designSun,config?.designEarth].map(x=>typeof x==='object'?x.gate:x);
 // Accept the calculation owner's explicit tuple/code shape; never infer a
 // traditional Cross name or import another subject's prose.
 const declared=config?.configurationCode;
 if(declared&&declared!==`${four[0].gate}/${four[1].gate}|${four[2].gate}/${four[3].gate}`&&declared!==tuple)fail('HD_REPORT_CROSS_TUPLE_CONFLICT');
 if(expectedTuple.every(Number.isInteger)&&stableSerialize(expectedTuple)!==stableSerialize(four.map(a=>a.gate)))fail('HD_REPORT_CROSS_TUPLE_CONFLICT');
 for(let i=0;i<4;i+=2){const delta=((four[i].eclipticLongitude-four[i+1].eclipticLongitude)%360+360)%360;if(Math.abs(delta-180)>1e-8)fail('HD_REPORT_SUN_EARTH_OPPOSITION_CONFLICT');}
 const strategy=TYPE_RULES[typeName[f.typeCode]]?.[0];if(!strategy)fail('HD_REPORT_TYPE_STRATEGY_MAPPING_UNSUPPORTED');
 const variable=raw?deriveCalibrationVariables(raw.activations):null;
 const all=sources.sourceUnits;
 const exact=(category,key)=>all.filter(u=>u.category===category&&u.canonicalKey===key);
 const gateIds=new Set(acts.flatMap(a=>gateSources.gates.find(g=>g.gate===a.gate)?.relationSourceUnitIds||[]));
 const definition=String(f.definition?.definitionCode||'').replace(/_DEFINITION$/,'');
 const core=[...exact('TYPE',f.typeCode),...exact('AUTHORITY',f.authority),...exact('PROFILE',f.profile?.profileCode),...exact('DEFINITION',definition),...all.filter(u=>u.category==='CHANNEL'&&f.channelCodes.some(c=>keyChannel(c)===keyChannel(u.canonicalKey))),...all.filter(u=>u.category==='CENTER'&&[...(f.definedCenters||[]).map(c=>c+'.DEFINED'),...(f.undefinedCenters||[]).map(c=>c+'.UNDEFINED')].includes(u.canonicalKey)),...all.filter(u=>gateIds.has(u.sourceUnitId))];
 const advanced={};
 for(const [slot,category]of roles){const v=variable?.fields?.[slot];const key=v?.color==null?null:['DETERMINATION','ENVIRONMENT'].includes(category)?`${v.color}.${v.orientation==='LEFT'?'左':'右'}`:String(v.color),mapped=key?exact(category,key):all.filter(u=>u.category===category);advanced[category]={value:key,state:v?.status==='CALCULATED_LOCAL_CANDIDATE'&&mapped.length===1?'SOURCE_BOUND_CALCULATED_INPUT':key?'SOURCE_MAPPING_NOT_UNIQUE':'CALCULATION_METADATA_INCOMPLETE',reason:v?.reason||(!raw?'FULL_ACTIVATION_INSTANT_STATUS_AND_NODE_LINEAGE_NOT_RETAINED':key&&mapped.length!==1?'EXISTING_VALUE_SOURCE_MAPPING_NOT_UNIQUE':null),calculation:v||null,precisionBoundary:'SHARED_CALCULATION_AND_AXIS_CHECKS_NOT_A_NEW_EXTERNAL_BENCHMARK_PASS',sources:mapped};}
 // Cognition has its own source mapping. Do not silently equate an arbitrary
 // Color/Tone, Sense value or personality report with Cognition.
 advanced.COGNITION={value:null,state:'CALCULATED_FIELD_MAPPING_PENDING',reason:'DESIGN_TONE_TO_COGNITION_MAPPING_NOT_BOUND_IN_CURRENT_REPORT_REQUEST',sources:all.filter(u=>u.category==='COGNITION')};
 const unit=u=>({sourceUnitId:u.sourceUnitId,category:u.category,canonicalKey:u.canonicalKey,source:u.source,sourceText:u.sourceText,sourceTextSha256:u.sourceTextSha256||null});
 const coreIds=[...new Set(core.map(u=>u.sourceUnitId))];
 const coreByCategory=(...categories)=>core.filter(u=>categories.includes(u.category)).map(u=>u.sourceUnitId);
 const crossIds=new Set(four.flatMap(a=>gateSources.gates.find(g=>g.gate===a.gate)?.relationSourceUnitIds||[]));
 const sectionSources={SEC01:coreIds,SEC02:coreByCategory('TYPE'),SEC03:coreByCategory('AUTHORITY'),SEC04:coreByCategory('DEFINITION','CHANNEL'),SEC05:coreByCategory('CENTER'),SEC06:coreByCategory('CHANNEL'),SEC07:coreByCategory('GATE_CHANNEL_RELATION'),SEC08:coreByCategory('PROFILE'),SEC09:core.filter(u=>crossIds.has(u.sourceUnitId)).map(u=>u.sourceUnitId),SEC10:[...advanced.DETERMINATION.sources,...advanced.MOTIVATION.sources,...advanced.PERSPECTIVE.sources].map(u=>u.sourceUnitId),SEC11:[...advanced.ENVIRONMENT.sources,...advanced.COGNITION.sources].map(u=>u.sourceUnitId),SEC12:coreByCategory('TYPE','AUTHORITY','DEFINITION','CENTER'),SEC13:coreByCategory('TYPE','AUTHORITY','CHANNEL'),SEC14:coreByCategory('AUTHORITY','CHANNEL'),SEC15:coreIds,SEC16:coreIds,SEC17:coreIds};
 const sectionRows=Object.entries(title).map(([sectionId,sectionTitle])=>({sectionId,title:sectionTitle,sourceUnitIds:sectionSources[sectionId],state:sectionId==='SEC09'?'CURRENT_GENERATION_PENDING_VERIFICATION':sectionId==='SEC11'?'ENVIRONMENT_CONNECTED_COGNITION_MAPPING_PENDING':'SOURCE_CONNECTED_GENERATION_NOT_RUN'}));
 const pack={version:HD_REPORT_SOURCE_POLICY,subjectBinding,calculationOutputDigest:ref.outputDigest,locale,facts:f,strategy:{value:strategy,provenance:'DERIVED_FROM_EXISTING_TYPE_RULES',sourceRef:'functions/external-profile/hd-intake-reconciliation.js#TYPE_RULES',decisionAuthorityUnchanged:f.authority},cross:{fourActivations:four,configurationTuple:tuple,namedCross:null,generationPlan:'AUTHORITY_PACK_LLM_INTERPRETATION',state:'CURRENT_GENERATION_PENDING_VERIFICATION',bookScanRequired:false},advanced,sourceUnits:[...new Map([...core,...Object.values(advanced).flatMap(x=>x.sources)].map(u=>[u.sourceUnitId,unit(u)])).values()],sectionRows,explicitBackground,rules:HD_REPORT_SOURCE_RULES,checks:{gateLineConsistency:true,sunEarthOpposition:true,subjectBinding:true,rawOutputDigestChecked:Boolean(raw),externalPrecisionAutomaticallyPassed:false},customerPublicationAllowed:false,providerCalls:0};
 pack.digest=await sha256(pack);return pack;
}

export const HD_REPORT_WRITER_PROMPT=`Write the requested HD report sections only from the supplied current-subject Authority Pack and user-provided source units. Preserve every calculation and source coordinate. Distinguish calculation facts, symbolic interpretation, conditional application and explicitly supplied background. Never infer experiences, emotions, hidden motives, health, nutrition treatment, guaranteed outcomes, a traditional named Cross, or another person's chart. For Cross synthesize only the four supplied Personality/Design Sun/Earth activations within the given source scope; no book scan is required. Missing calculation/mapping means a precise local uncertainty, not missing user materials and not a reason to block unrelated sections. Never choose or infer a null advanced value even when multiple possible source units are supplied: Cognition is not assigned by this request and must remain unassigned. Calculated advanced values retain the stated precision boundary; do not call them independently benchmarked. Keep the requested language throughout. Provide full connected paragraphs with explicit supportRefs; do not use a generic checklist or repeat the question as analysis. Titles have the same factual boundaries as prose. Output JSON only.`;
export async function prepareHdReportRequest({authorityPack,sectionIds,model,maxOutputTokens,schema}){
 const {digest,...body}=authorityPack||{};if(digest!==await sha256(body))fail('HD_REPORT_AUTHORITY_PACK_CHANGED');
 if(!Array.isArray(sectionIds)||!sectionIds.length||new Set(sectionIds).size!==sectionIds.length||sectionIds.some(id=>!body.sectionRows.some(s=>s.sectionId===id)))fail('HD_REPORT_SECTION_SCOPE_REQUIRED');
 if(typeof model!=='string'||!model||!Number.isSafeInteger(maxOutputTokens)||maxOutputTokens<=0||!schema)fail('HD_REPORT_EXPLICIT_MODEL_PLAN_REQUIRED');
 const payload={authorityPack,requestedSectionIds:sectionIds};
 return prepareOpenAIStructuredRequest({model,systemPrompt:HD_REPORT_WRITER_PROMPT,userPayload:payload,schema,schemaName:'hd_report_sections',maxOutputTokens});
}
