// R5 local orchestration adapter. No new calculation, product, release or storage owner.
import {createHmac,timingSafeEqual} from 'node:crypto';
import {digestCanonical} from '../canonical-presentation-runtime/report-release-runtime.js';
import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {reportEconomics} from '../pws/commercial/commerce-economics-policy.js';
import {HD_R3_RUNTIME_SOURCE_INDEX as INDEX} from './human-design-r3-runtime-source-index.js';
import {PERSONAL_STRUCTURE_RUNTIME_CODE,PERSONAL_STRUCTURE_RUNTIME_VERSION,PERSONAL_STRUCTURE_ALGORITHM_CODE,PERSONAL_STRUCTURE_ALGORITHM_VERSION} from '../method-runtime/personal-structure/personal-structure-runtime.js';
import {createReportGenerationStore} from '../personal-reading/report-generation-store.js';

export const HD_REPORT_AUTOMATION_VERSION='HD-REPORT-AUTOMATION-R5-LOCAL-v1';
const PURPOSE='HD_CONFIRMED_CALCULATION_SNAPSHOT';
const fail=code=>{throw new TypeError(code)};
const secretKey=secret=>{if(typeof secret!=='string'||secret.length<32)fail('HD_SNAPSHOT_SIGNING_CONFIGURATION_REQUIRED');return secret};
const actor=value=>{const identity=normalizeVerifiedSymbolicAccountIdentity(value);if(!identity||!identity.sessionId)fail('HD_SNAPSHOT_ACCOUNT_SESSION_REQUIRED');return identity};
const signed=(text,secret)=>createHmac('sha256',secretKey(secret)).update(text).digest('base64url');
const iso=x=>{const n=Date.parse(x);if(!Number.isFinite(n))fail('HD_SNAPSHOT_TIME_INVALID');return n};
function bindings(preview){
 if(preview?.customerConfirmed!==true||!preview.chart||!preview.inputIdentity)fail('HD_CONFIRMED_PREVIEW_REQUIRED');
 const chartDigest=digestCanonical(preview.chart),inputDigest=digestCanonical(preview.inputIdentity);
 const calculationVersion={confirmation:preview.version,runtimeCode:PERSONAL_STRUCTURE_RUNTIME_CODE,runtimeVersion:PERSONAL_STRUCTURE_RUNTIME_VERSION,algorithmCode:PERSONAL_STRUCTURE_ALGORITHM_CODE,algorithmVersion:PERSONAL_STRUCTURE_ALGORITHM_VERSION,gateWheel:preview.chart.activations?.[0]?.mappingVersion,substructure:preview.chart.variables?.calculationVersion,ephemeris:preview.chart.activations?.[0]?.substructure?.ephemeris,nodeConvention:preview.chart.activations?.[0]?.lineage?.nodeConvention};
 if(Object.values(calculationVersion).some(x=>typeof x!=='string'||!x))fail('HD_CALCULATION_VERSION_BINDING_REQUIRED');
 return {inputDigest,chartResultDigest:chartDigest,calculationVersion,calculationVersionDigest:digestCanonical(calculationVersion),previewDigest:preview.chartDigest};
}
export function issueHdConfirmationSnapshot(preview,{identity,secret,runtimeDependencyDigest,confirmationGeneration=1,now=new Date().toISOString(),ttlMs=15*60000}={}){
 const owner=actor(identity);if(!Number.isInteger(ttlMs)||ttlMs<=0||ttlMs>15*60000)fail('HD_SNAPSHOT_TTL_INVALID');
 if(!/^[a-f0-9]{64}$/.test(runtimeDependencyDigest||''))fail('HD_CALCULATION_DEPENDENCY_DIGEST_REQUIRED');
 if(!Number.isSafeInteger(confirmationGeneration)||confirmationGeneration<1)fail('HD_CONFIRMATION_GENERATION_INVALID');
 const body={version:HD_REPORT_AUTOMATION_VERSION,purpose:PURPOSE,ownerAccountId:owner.userId,sessionDigest:digestCanonical(owner.sessionId),...bindings(preview),runtimeDependencyDigest,confirmationGeneration,confirmedAt:new Date(iso(now)).toISOString(),expiresAt:new Date(iso(now)+ttlMs).toISOString(),customerConfirmationScope:'INPUT_AND_PREVIEW_ONLY',publicationAllowed:false};
 const payload=Buffer.from(JSON.stringify(body)).toString('base64url');return {token:payload+'.'+signed(payload,secret),snapshot:body,snapshotDigest:digestCanonical(body)};
}
export function verifyHdConfirmationSnapshot(token,preview,{identity,secret,runtimeDependencyDigest,now=new Date().toISOString()}={}){
 const owner=actor(identity);if(typeof token!=='string'||token.length>16384)fail('HD_SNAPSHOT_INVALID');const parts=token.split('.');if(parts.length!==2)fail('HD_SNAPSHOT_INVALID');
 const expected=Buffer.from(signed(parts[0],secret)),provided=Buffer.from(parts[1]);if(expected.length!==provided.length||!timingSafeEqual(expected,provided))fail('HD_SNAPSHOT_SIGNATURE_INVALID');
 let body;try{body=JSON.parse(Buffer.from(parts[0],'base64url').toString())}catch{fail('HD_SNAPSHOT_INVALID')}
 if(body.version!==HD_REPORT_AUTOMATION_VERSION||body.purpose!==PURPOSE||body.ownerAccountId!==owner.userId||body.sessionDigest!==digestCanonical(owner.sessionId))fail('HD_SNAPSHOT_OWNER_OR_PURPOSE_MISMATCH');
 if(iso(now)>=iso(body.expiresAt)||iso(now)<iso(body.confirmedAt)||iso(body.expiresAt)-iso(body.confirmedAt)>15*60000)fail('HD_SNAPSHOT_EXPIRED');
 const current=bindings(preview);for(const k of ['inputDigest','chartResultDigest','calculationVersionDigest','previewDigest'])if(body[k]!==current[k])fail('HD_SNAPSHOT_STALE_RECALCULATE');
 if(digestCanonical(body.calculationVersion)!==current.calculationVersionDigest)fail('HD_SNAPSHOT_VERSION_MISMATCH');
 if(!/^[a-f0-9]{64}$/.test(runtimeDependencyDigest||'')||body.runtimeDependencyDigest!==runtimeDependencyDigest)fail('HD_SNAPSHOT_CALCULATION_DEPENDENCY_CHANGED');return body;
}

// Ephemeral confirmation metadata uses the existing SQL state/lock owner, not a new table or wallet.
export async function createHdConfirmationHeadStore(env,identity){
 const owner=actor(identity);if(env?.PHIOS_HD_INTERNAL_CONFIRMATION_LOCAL!=='true')fail('HD_LOCAL_CONFIRMATION_STORE_ONLY');
 const state=await createReportGenerationStore(env,{environment:'QA',ownerAccountId:owner.userId,orderId:'UNPURCHASED-HD-LOCAL-PREVIEW',reportId:'HD-CONFIRM-'+digestCanonical(owner.sessionId),productId:'COM-REPORT-HD-FULL'},{scope:'delivery'}),key='hd-confirmation-head';
 const held=fn=>state.withLock(key,fn);
 return {
  invalidate:()=>held(async()=>{const old=await state.get(key),generation=(old?.generation||0)+1;await state.put(key,{generation,status:'PREVIEW',proof:null});return generation}),
  assertGeneration:g=>held(async()=>{const row=await state.get(key);if(row?.generation!==g)fail('HD_SNAPSHOT_STALE_RECALCULATE');return row}),
  activate:(generation,issue)=>held(async()=>{const row=await state.get(key);if(row?.generation!==generation)fail('HD_SNAPSHOT_STALE_RECALCULATE');if(row.status==='ACTIVE')return row.proof;const proof=issue();await state.put(key,{generation,status:'ACTIVE',proof});return proof}),
  assertActive:snapshot=>held(async()=>{const row=await state.get(key);if(row?.generation!==snapshot.confirmationGeneration||row.status!=='ACTIVE'||row.proof?.snapshotDigest!==digestCanonical(snapshot))fail('HD_SNAPSHOT_REVOKED');return true})
 };
}

// Seventeen content sections, not seventeen fixed pages. Existing visual layout stays its owner.
const SECTIONS=[
 ['Architecture','Human Design Architecture','人类图结构','chart',[]],
 ['TypeStrategy','Type & Strategy','类型与策略','type',['TYPE','STRATEGY']],
 ['Authority','Inner Authority','内在权威','authority',['AUTHORITY']],
 ['Definition','Definition & Integration','定义与整合','definition',['DEFINITION']],
 ['Centers','Nine Centers','九个中心','centers',['CENTER']],
 ['Channels','Channels & Circuits','通道与回路','channels',['CHANNEL']],
 ['Gates','Gates & Lines','闸门与爻线','activations',['GATE','LINE']],
 ['Profile','Profile & Life Role','人生角色','profile',['PROFILE']],
 ['Cross','Incarnation Cross & Life Theme','轮回交叉与生命主题','incarnationCross',['CROSS']],
 ['Variables','Variables & PHS','变量与PHS','variables',['DETERMINATION','COGNITION']],
 ['Environment','Environment & Perception','环境与感知','variables',['ENVIRONMENT','PERSPECTIVE','MOTIVATION']],
 ['Relationship','Relationship & Conditioning','关系与制约','chart',['RELATIONSHIP']],
 ['Career','Career & Collaboration','工作与协作','chart',['WHOLE_CHART']],
 ['Resources','Resources & Contribution','资源与贡献','chart',['WHOLE_CHART']],
 ['Integration','Whole-Chart Integration','整张图整合','chart',['WHOLE_CHART']],
 ['Reality','Reality Comparison','现实对照','observations',['REALITY']],
 ['Practice','Practice, Continuity & Boundaries','练习、持续观察与边界','observations',['BOUNDARY']]
];
const plans=new WeakSet();
export function inspectHdReportChartConsistency(chart){
 const issues=[],a=chart?.activations||[],get=(side,body)=>a.find(x=>x.layer===side&&x.bodyCode===body);
 if(a.length!==26||a.some(x=>!Number.isFinite(x.eclipticLongitude)||!Number.isInteger(x.gate)||x.gate<1||x.gate>64||!Number.isInteger(x.line)||x.line<1||x.line>6))issues.push('ACTIVATION_INCOMPLETE_OR_OUT_OF_RANGE');
 for(const side of ['PERSONALITY','DESIGN']){const sun=get(side,'SUN'),earth=get(side,'EARTH');if(!sun||!earth||Math.abs(((earth.eclipticLongitude-sun.eclipticLongitude+360)%360)-180)>1e-8)issues.push(side+'_SUN_EARTH_OPPOSITION');}
 const ps=get('PERSONALITY','SUN'),ds=get('DESIGN','SUN'),pe=get('PERSONALITY','EARTH'),de=get('DESIGN','EARTH');
 if(!ps||!ds||chart.profile?.profileCode!==`${ps.line}/${ds.line}`)issues.push('PROFILE_SUN_LINE_MISMATCH');
 if(!ps||!ds||!pe||!de||chart.incarnationCross?.configurationCode!==`${ps.gate}/${pe.gate}|${ds.gate}/${de.gate}`)issues.push('CROSS_FOUR_GATE_MISMATCH');
 if(['GENERATOR','MANIFESTING_GENERATOR'].includes(chart.typeCode)&&!['EMOTIONAL','SACRAL'].includes(chart.authority)||chart.typeCode==='REFLECTOR'&&chart.authority!=='LUNAR')issues.push('TYPE_AUTHORITY_CONTRADICTION');
 for(const [slot,side,body]of [['designUpper','DESIGN','SUN'],['designLower','DESIGN','NORTH_NODE'],['personalityUpper','PERSONALITY','SUN'],['personalityLower','PERSONALITY','NORTH_NODE']]){const v=chart.variables?.fields?.[slot],p=get(side,body);if(!v||!p||v.sourceActivationIds?.[0]!==p.activationId||v.instantUTC!==p.instantUTC)issues.push(slot+'_AXIS_MISMATCH');}
 return {passed:issues.length===0,issues,scope:'Structural consistency, not external astronomical accuracy or interpretation validity'};
}
export function buildHdReportAutomationPlan({token,preview,identity,secret,runtimeDependencyDigest,language='en',resources,now}={}){
 const snapshot=verifyHdConfirmationSnapshot(token,preview,{identity,secret,runtimeDependencyDigest,now});if(!['en','zh-Hans','bilingual'].includes(language))fail('HD_REPORT_LANGUAGE_INVALID');
 if(!resources?.sourceIdentity||!Array.isArray(resources.meaningUnits)||!resources.visualInventory?.reports?.HD||!Array.isArray(resources.visualInventory.assets))fail('HD_REPORT_TRUSTED_RESOURCES_REQUIRED');
 const chart=preview.chart,economics=reportEconomics('COM-REPORT-HD-FULL'),consistency=inspectHdReportChartConsistency(chart);
 const scope={gateLine:{status:'PARTIAL',directlyAffected:['DESIGN_VENUS_LINE','LINE_SENSITIVE_INTERPRETATION'],notDirectlyChangedByObservedMismatch:['GATE_NUMBER','GATE_BASED_CENTERS_CHANNELS_TYPE_AUTHORITY','SUN_LINE_PROFILE'],reason:'Observed Venus mismatch is same Gate46, different Line2/3. No claim of universal engine accuracy or validated report exclusion from this one observation.'},tone:{status:'PARTIAL',directlyAffected:['PERSONALITY_NODE_PERSPECTIVE_TONE','PERSONALITY_SUN_MOTIVATION_TONE'],notProvenByArrowAgreement:['PHS_INTERPRETATION','COGNITION_MAPPING'],reason:'Sun and node Tone discrepancies; each axis must be assessed independently.'},regression:{status:'PARTIAL',reason:'Three historical orchestration assertions and one confirmation-owner version acceptance mismatch retained; not four numerical errors.'},currentCohortMatches:(resources.precisionEvidence||[]).filter(x=>x.instantUTC===(x.side==='DESIGN'?preview.designInstantUTC:preview.instantUTC)),currentOutsideCohortIsNotAccuracyProof:true};
 const sourceFor=key=>key==='TypeStrategy'?INDEX.types[chart.typeCode]?.sourceRefs||[]:key==='Authority'?INDEX.authorities[chart.authority]?.sourceRefs||[]:key==='Profile'?INDEX.profiles[chart.profile?.profileCode]?.sourceRefs||[]:[];
 const assets=resources.visualInventory.assets.filter(x=>x.methodId==='HD');
 const activeGates=new Set(chart.activations.map(a=>a.gate)),activeChannels=new Set(chart.channels.flatMap(c=>[c.gates.join('-'),[...c.gates].reverse().join('-')]));
 const definitionKey={SINGLE_DEFINITION:'SINGLE',SPLIT_DEFINITION:'SPLIT',TRIPLE_SPLIT_DEFINITION:'TRIPLE_SPLIT',QUADRUPLE_SPLIT_DEFINITION:'QUAD_SPLIT',NO_DEFINITION:'NO_DEFINITION'}[chart.definition?.definitionCode];
 function applicable(unit){
  if(unit.canonicalType)return unit.canonicalType===chart.typeCode;
  if(unit.canonicalAuthority)return unit.canonicalAuthority===chart.authority;
  if(unit.canonicalProfile)return unit.canonicalProfile===chart.profile?.profileCode;
  if(unit.definition)return unit.definition===definitionKey;
  if(unit.canonicalCenter){const state=chart.definedCenters.includes(unit.canonicalCenter)?'DEFINED':[...activeGates].some(g=>INDEX.gates[String(g)]?.center===unit.canonicalCenter)?'UNDEFINED':'OPEN';return unit.centerState===state;}
  if(unit.channelId)return activeChannels.has(unit.channelId);
  if(Number.isInteger(unit.gate))return activeGates.has(unit.gate);
  if(unit.field==='COGNITION')return false; // Tone-to-cognition rule is not independently admitted.
  const slot={DETERMINATION:'designUpper',ENVIRONMENT:'designLower',PERSPECTIVE:'personalityLower',MOTIVATION:'personalityUpper'}[unit.field];
  if(slot){const v=chart.variables.fields[slot];return unit.canonicalKey===(['DETERMINATION','ENVIRONMENT'].includes(unit.field)?`${v.color}.${v.orientation==='LEFT'?'左':'右'}`:String(v.color));}
  return false;
 }
 const sections=SECTIONS.map(([key,en,zh,field,groups],i)=>{
  const units=resources.meaningUnits.filter(u=>groups.some(g=>u.field===g||u.meaningUnitId?.includes('-'+g+'-'))&&applicable(u));
  const observations=field==='observations';const factualInput=observations?{currentReality:'NOT_SUPPLIED',mode:'QUESTIONS_ONLY',personalExperienceInvented:false}:field==='chart'?{type:chart.typeCode,authority:chart.authority,definition:chart.definition,profile:chart.profile}:field==='centers'?{defined:chart.definedCenters,undefined:chart.undefinedCenters,open:chart.undefinedCenters.filter(center=>![...activeGates].some(g=>INDEX.gates[String(g)]?.center===center))}:chart[field]??null;
  return {section:i+1,sectionKey:key,title:{en,'zh-Hans':zh},confirmedInputDigest:snapshot.inputDigest,chartResultDigest:snapshot.chartResultDigest,calculationVersion:snapshot.calculationVersion,factualInput,interpretationCandidates:units.map(u=>({id:u.meaningUnitId,sourceRefs:u.sourceRefs,sourceSha256:u.sourceTrace?.sourceTextSha256,terms:u.label,approvedForCalculatedInput:false})),sourceRefs:[...new Set([...sourceFor(key),...units.flatMap(u=>u.sourceRefs||[])])],provenance:resources.sourceIdentity,verifiedInterpretationRules:false,terminologyStatus:units.length?'SOURCE_ANCHORED_CANDIDATES_NOT_CALCULATED_SCOPE_ACCEPTANCE':'REQUIRES_SOURCE_RULE_BINDING',missingDataBehavior:observations?'OBSERVATION_QUESTIONS_ONLY_NO_FICTION':key==='Cross'?'STRUCTURAL_FOUR_GATES_ONLY_NO_UNLICENSED_NAME':'HOLD_UNSUPPORTED_SECTION_NO_FILLER',consistencyChecks:['SAME_CONFIRMED_SNAPSHOT','NO_CONTRADICTORY_TYPE_AUTHORITY','SOURCE_IDENTITY_REQUIRED','NO_PERSONAL_FACT_INVENTION','REQUIRED_BOUNDARIES_RETAINED'],pdfPublicationEligible:false,status:'BLOCKED',blockers:[...(factualInput?[]:['MISSING_CALCULATED_INPUT']),'CALCULATED_INTERPRETATION_SCOPE_NOT_ADMITTED',...(assets.length?[]:['APPROVED_HD_VISUAL_ASSETS_NOT_REGISTERED']),'CRITICAL_RIGHTS_NOT_CLEARED','CALCULATION_PRECISION_NOT_CLOSED']};
 });
 const plan={version:HD_REPORT_AUTOMATION_VERSION,scope:'LOCAL_REPORT_READINESS_NOT_CUSTOMER_REPORT',productId:economics.productId,language,amountMinor:economics.amountMinor+(language==='bilingual'?economics.bilingualSurchargeMinor:0),currency:economics.currency,maxProviderCostUsd:economics.providerCapUsd,snapshot,scopeAssessment:scope,consistency,sections,visuals:{registeredAssets:assets.length,inventoryComplete:resources.visualInventory.reports.HD.complete,required:['COVER','INTRODUCTION','SECTION','BODY'],registered:assets,substitutionAllowed:false},providerPlan:{mode:'NOT_INVOKED',modelCalls:0,actualCostUsd:0,ceilingUsd:5,includesBilingualAndRecovery:true},generationAllowed:false,publicationAllowed:false,reportPersistenceAllowed:false,pdfStatus:'BLOCKED',blockers:[...consistency.issues,'CALCULATION_PRECISION_NOT_CLOSED','CALCULATED_INTERPRETATION_SCOPE_NOT_ADMITTED','HD_VISUAL_ASSETS_INCOMPLETE','CRITICAL_RIGHTS_NOT_CLEARED'],customerConfirmationDoesNotOverrideEligibility:true};
 plan.draftBindingDigest=digestCanonical({snapshot,language,sections,sourceIdentity:resources.sourceIdentity});Object.freeze(plan);plans.add(plan);return plan;
}
export async function generateHdAutomatedReportCandidate(plan,{generate,render,save}={}){
 if(!plans.has(plan)||plan.generationAllowed!==true||plan.publicationAllowed!==true||plan.sections.some(s=>s.pdfPublicationEligible!==true))fail('HD_REPORT_GENERATION_BLOCKED');
 // No activation path exists until the existing content, visual and release owners pass.
 fail('HD_AUTOMATIC_DELIVERY_OWNER_NOT_ADMITTED');
}
export function verifyHdReportDraftBinding(plan,preview,options){
 const snapshot=verifyHdConfirmationSnapshot(options.token,preview,options);
 if(plan?.version!==HD_REPORT_AUTOMATION_VERSION||digestCanonical(plan.snapshot)!==digestCanonical(snapshot)||plan.draftBindingDigest!==digestCanonical({snapshot:plan.snapshot,language:plan.language,sections:plan.sections,sourceIdentity:plan.sections[0]?.provenance}))fail('HD_REPORT_DRAFT_STALE_OR_TAMPERED');
 return {valid:true,publicationAllowed:false};
}
