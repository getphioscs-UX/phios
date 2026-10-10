import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {prioritizeHumanDesignR3WholeChart} from '../functions/external-profile/human-design-r3-whole-chart-priority.js';
import {buildHumanDesignR3ProfessionalReadingIr} from '../functions/external-profile/human-design-r3-reading-ir-v2.js';
import {editorializeHumanDesignR3Reading,assertNoHumanDesignR3EditorialLeaks} from '../functions/external-profile/human-design-r3-customer-editorial.js';
import {buildHumanDesignR3RealityCompositionV2} from '../functions/external-profile/human-design-r3-reality-composition-v2.js';
import {composeHumanDesignR3SingleChartRelationship} from '../functions/external-profile/human-design-r3-relationship-composition.js';
import {inspectHumanDesignR3SensitiveOutput} from '../functions/external-profile/human-design-r3-epistemic-boundary.js';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const CASES=`${ROOT}/campaign/HD-PRO-R3-W20-machine-cases-v1.json`;
const RESULTS=`${ROOT}/campaign/HD-PRO-R3-W20-machine-results-v1.json`;
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex').slice(0,24);
const uniq=a=>[...new Set(a.filter(Boolean))];
const types=read(`${ROOT}/semantics/HD-PRO-R3-W4-type-professional-meaning-corpus-v1.json`).meaningUnits;
const authorities=read(`${ROOT}/semantics/HD-PRO-R3-W5-authority-professional-meaning-corpus-v1.json`).meaningUnits;
const profiles=read(`${ROOT}/semantics/HD-PRO-R3-W6-profile-professional-meaning-corpus-v1.json`).meaningUnits;
const centers=read(`${ROOT}/semantics/HD-PRO-R3-W7-center-professional-meaning-corpus-v1.json`).meaningUnits;
const channels=read(`${ROOT}/semantics/HD-PRO-R3-W8-channel-professional-meaning-corpus-v1.json`).meaningUnits.slice().sort((a,b)=>Number(a.channelId.split('-')[0])-Number(b.channelId.split('-')[0])||Number(a.channelId.split('-')[1])-Number(b.channelId.split('-')[1]));
const gates=read(`${ROOT}/semantics/HD-PRO-R3-W9-gate-professional-meaning-corpus-v1.json`).meaningUnits;
const definitions=read(`${ROOT}/semantics/HD-PRO-R3-W10-definition-integration-corpus-v1.json`).meaningUnits;
const variables=read(`${ROOT}/semantics/HD-PRO-R3-W11-variable-phs-professional-meaning-corpus-v1.json`).meaningUnits;
const typeMap=new Map(types.map(x=>[x.canonicalType,x]));
const authMap=new Map(authorities.map(x=>[x.canonicalAuthority,x]));
const profileMap=new Map(profiles.map(x=>[x.canonicalProfile,x]));
const defMap=new Map(definitions.map(x=>[x.definition,x]));
const centerMap=new Map(centers.map(x=>[`${x.canonicalCenter}.${x.centerState}`,x]));
const gateMap=new Map(gates.map(x=>[x.gate,x]));
const varByField=new Map();for(const v of variables){const k=v.field.toLowerCase();if(!varByField.has(k))varByField.set(k,[]);varByField.get(k).push(v);}
const CENTER_CODES=['HEAD','AJNA','THROAT','G','EGO','SPLEEN','SOLAR_PLEXUS','SACRAL','ROOT'];
const AUTH_CENTER={EMOTIONAL:'SOLAR_PLEXUS',SACRAL:'SACRAL',SPLENIC:'SPLEEN',SELF_PROJECTED:'G',EGO_MANIFESTED:'EGO',EGO_PROJECTED:'EGO'};
const validCombos=[['MANIFESTOR','EMOTIONAL'],['MANIFESTOR','SPLENIC'],['MANIFESTOR','EGO_MANIFESTED'],['GENERATOR','EMOTIONAL'],['GENERATOR','SACRAL'],['MANIFESTING_GENERATOR','EMOTIONAL'],['MANIFESTING_GENERATOR','SACRAL'],['PROJECTOR','EMOTIONAL'],['PROJECTOR','SPLENIC'],['PROJECTOR','SELF_PROJECTED'],['PROJECTOR','EGO_PROJECTED'],['PROJECTOR','MENTAL_ENVIRONMENTAL'],['REFLECTOR','LUNAR']];
const channelCombos=validCombos.filter(([t])=>t!=='REFLECTOR');
const intents=['decisions and commitment','work energy and engagement','relationships and pressure','role and career expectations','environment and attention','integration and repeated patterns'];
const source=(map,key)=>map.get(key)?.sourceRefs||[];
function add(map,key,refs){if(refs?.length)map[key]=uniq([...(map[key]||[]),...refs]);}
function buildCase(i){
  let [type,authority]=(i<36?channelCombos:validCombos)[i%(i<36?channelCombos.length:validCombos.length)];
  if(i===93){type='PROJECTOR';authority='MENTAL_ENVIRONMENTAL';}
  const profile=profiles[i%profiles.length].canonicalProfile;
  const definition=type==='REFLECTOR'?'NO_DEFINITION':['SINGLE','SPLIT','TRIPLE_SPLIT','QUAD_SPLIT'][i%4];
  const sparse=i>=88&&i<=91;
  const channelUnits=[];
  if(!sparse&&type!=='REFLECTOR'){
    channelUnits.push(channels[i%36]);
    if(i%11===0)channelUnits.push(channels[(i+13)%36]);
  }
  const forcedDefined=new Set(channelUnits.flatMap(x=>[x.centerA,x.centerB]));if(AUTH_CENTER[authority])forcedDefined.add(AUTH_CENTER[authority]);
  const state={defined:[],undefined:[],open:[]};
  CENTER_CODES.forEach((c,j)=>{
    if(type==='REFLECTOR'){state.open.push(c);return;}
    if(forcedDefined.has(c)){state.defined.push(c);return;}
    const s=['defined','undefined','open'][(i+j)%3];state[s].push(c);
  });
  if(sparse){state.defined=[...forcedDefined];state.undefined=[];state.open=CENTER_CODES.filter(c=>!forcedDefined.has(c));}
  const fullGateSet=new Set(channelUnits.flatMap(x=>[x.gateA,x.gateB]));
  let hanging=null;
  if(!sparse&&state.undefined.length){
    const hc=state.undefined[0];const g=gates.find(x=>x.center===hc&&!fullGateSet.has(x.gate));if(g)hanging={gate:g.gate,center:hc};
  }
  const advanced={};
  const varFields=['determination','cognition','environment','perspective','motivation','trajectory'];
  if(!sparse&&i%4!==0){const f=varFields[i%6], arr=varByField.get(f)||[]; if(arr.length)advanced[f]=arr[i%arr.length].canonicalKey;}
  if(!sparse&&i%7===0){for(const f of ['determination','environment','motivation']){const arr=varByField.get(f)||[];if(arr.length)advanced[f]=arr[(i+2)%arr.length].canonicalKey;}}
  const pd=[];if(channelUnits.length&&(i%3===0||i===95)){const ch=channelUnits[0];pd.push({personalityGate:ch.gateA,designGate:ch.gateB,relationship:'CHANNEL_COMPONENTS',channelId:ch.channelId});}
  const refs={};
  add(refs,`TYPE.${type}`,source(typeMap,type));add(refs,`AUTHORITY.${authority}`,source(authMap,authority));add(refs,`PROFILE.${profile.replace('/','_')}`,source(profileMap,profile));add(refs,`DEFINITION.${definition}`,source(defMap,definition));
  for(const c of state.defined)add(refs,`CENTER.${c}.DEFINED`,source(centerMap,`${c}.DEFINED`));
  for(const c of state.undefined)add(refs,`CENTER.${c}.UNDEFINED`,source(centerMap,`${c}.UNDEFINED`));
  for(const c of state.open)add(refs,`CENTER.${c}.OPEN`,source(centerMap,`${c}.OPEN`));
  for(const ch of channelUnits){add(refs,`CHANNEL.${ch.channelId}`,ch.sourceRefs);add(refs,`GATE.${ch.gateA}`,source(gateMap,ch.gateA));add(refs,`GATE.${ch.gateB}`,source(gateMap,ch.gateB));}
  if(hanging)add(refs,`GATE.${hanging.gate}`,source(gateMap,hanging.gate));
  for(const p of pd){add(refs,`GATE.${p.personalityGate}.PERSONALITY`,source(gateMap,p.personalityGate));add(refs,`GATE.${p.designGate}.DESIGN`,source(gateMap,p.designGate));}
  for(const [f,v] of Object.entries(advanced)){const unit=(varByField.get(f)||[]).find(x=>x.canonicalKey===v);add(refs,`ADVANCED.${f.toUpperCase()}.${v}`,unit?.sourceRefs||[]);}
  const edgeTags=[];if(sparse)edgeTags.push('SPARSE_CONFIRMED');if(type==='REFLECTOR')edgeTags.push('LOW_COMPOSITION_DENSITY_FAIL_CLOSED');if(i%13===0)edgeTags.push('RICH_CHART');if(Object.keys(advanced).length===0)edgeTags.push('ADVANCED_ABSENT');if(i===92)edgeTags.push('UNKNOWN_OPTIONAL_FIELDS');if(i===93)edgeTags.push('SCHOOL_VARIANT_AUTHORITY');if(i===94)edgeTags.push('CONTRADICTORY_EXTERNAL_REPORT');if(i===95)edgeTags.push('PERSONALITY_DESIGN_STRUCTURAL_ONLY');
  return {caseId:`HD-R3-W20-${String(i+1).padStart(3,'0')}`,fixtureClass:i<36?'CHANNEL_COVERAGE':i<64?'CORE_COVERAGE':i<88?'ADVANCED_AND_EDGE':'SPARSE_EDGE',edgeTags,facts:{type,authority,profile,definition,centers:state,channels:channelUnits.map(ch=>({channelId:ch.channelId,gates:[ch.gateA,ch.gateB],centers:[ch.centerA,ch.centerB]})),hangingGates:hanging?[hanging]:[],personalityDesignPairs:pd,advanced,sourceRefsBySubject:refs,customerIntent:intents[i%intents.length],...(i===92?{optionalUnknown:{tone:'UNKNOWN',color:'UNKNOWN'}}:{}),...(i===94?{externalReportContradiction:{reportedType:'PROJECTOR',confirmedType:type,resolution:'CONFIRMED_CHART_WINS'}}:{})}};
}
function runCase(c){
  const facts=c.facts;
  const p1=prioritizeHumanDesignR3WholeChart(facts,{customerIntent:facts.customerIntent});
  const p2=prioritizeHumanDesignR3WholeChart(JSON.parse(JSON.stringify(facts)),{customerIntent:facts.customerIntent});
  const reading=buildHumanDesignR3ProfessionalReadingIr(facts,{priorityResult:p1});
  const editorial=editorializeHumanDesignR3Reading(facts,{readingIr:reading});assertNoHumanDesignR3EditorialLeaks(editorial);
  const reality=buildHumanDesignR3RealityCompositionV2(facts,{priorityResult:p1});
  const relationship=composeHumanDesignR3SingleChartRelationship(facts,{priorityResult:p1});
  const boundary=inspectHumanDesignR3SensitiveOutput({editorial:editorial.customerSections,reality:reality.questions,relationship:relationship.interpretations});
  const allPrimary=[...p1.primaryFindings];
  const sparse=c.edgeTags.includes('SPARSE_CONFIRMED')||c.edgeTags.includes('LOW_COMPOSITION_DENSITY_FAIL_CLOSED');
  const checks={
    deterministic:p1.priorityDigest===p2.priorityDigest,
    sourceBound:allPrimary.every(x=>x.technicalRefs.sourceRefs.length>0),
    primaryRange:sparse?(p1.counts.primary>=3&&p1.counts.primary<=8):(p1.counts.primary>=5&&p1.counts.primary<=8),
    noPseudoPrecision:allPrimary.every(x=>x.pseudoPrecisionScore===null)&&p1.priorityPolicy.usesOpaqueScore===false,
    readingSections13:reading.sections.length===13,
    editorialNoInternalLeak:editorial.editorialPolicy.detectedForbiddenTerms.length===0,
    sensitiveBoundary:boundary.passed,
    realityQuestionsBound:reality.questions.every(q=>q.technicalRefs.claimIds.length&&q.technicalRefs.sourceRefs.length),
    relationshipSingleChart:relationship.scope==='SINGLE_CHART_RELATIONAL_INTERPRETATION'&&relationship.boundaries.compatibilityScoreAllowed===false,
    unsupportedMeaningNotPrimary:allPrimary.every(x=>!String(x.finding?.en||'').includes('SOURCE_PENDING')),
    unknownOptionalDoesNotLeak:!JSON.stringify({p1,reading,editorial,reality,relationship}).includes('optionalUnknown')&&!JSON.stringify({p1,reading,editorial,reality,relationship}).includes('UNKNOWN_OPTIONAL_FIELDS')
  };
  return {caseId:c.caseId,fixtureClass:c.fixtureClass,edgeTags:c.edgeTags,pass:Object.values(checks).every(Boolean),checks,counts:{primary:p1.counts.primary,secondary:p1.counts.secondary,contextual:p1.counts.contextual,advanced:p1.counts.advanced,readingSections:reading.sections.length,customerCards:editorial.customerSections.reduce((n,s)=>n+s.customerCards.length,0),realityQuestions:reality.questions.length,relationshipInterpretations:relationship.interpretations.length},digests:{priority:p1.priorityDigest,reading:reading.readingIrDigest,editorial:editorial.editorialDigest,reality:reality.realityDigest,relationship:relationship.relationshipDigest}};
}
const cases=Array.from({length:96},(_,i)=>buildCase(i));
const results=cases.map(runCase);
const channelCoverage=uniq(cases.flatMap(c=>c.facts.channels.map(x=>x.channelId))).sort();
const gateCoverage=uniq(cases.flatMap(c=>[...c.facts.channels.flatMap(x=>x.gates),...c.facts.hangingGates.map(x=>x.gate)])).sort((a,b)=>a-b);
const centerStateCoverage=Object.fromEntries(CENTER_CODES.map(code=>[code,{DEFINED:cases.some(c=>c.facts.centers.defined.includes(code)),UNDEFINED:cases.some(c=>c.facts.centers.undefined.includes(code)),OPEN:cases.some(c=>c.facts.centers.open.includes(code))}]));
const campaign={schemaVersion:'PHI-OS-HD-PRO-R3-W20-MACHINE-CASES-v1.0.0',work:'HD-PRO-R3-W20',baselineCommit:'3b5670308f4b5e42d4c1da066dcd5fefc5b0e805',description:'96 deterministic confirmed-external-chart fixtures only; no Human Design birth calculation.',cases};
const report={schemaVersion:'PHI-OS-HD-PRO-R3-W20-MACHINE-RESULTS-v1.0.0',work:'HD-PRO-R3-W20',baselineCommit:'3b5670308f4b5e42d4c1da066dcd5fefc5b0e805',status:results.every(x=>x.pass)?'MACHINE_VERIFIED_96_OF_96':'MACHINE_FAILED',summary:{total:96,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length,types:uniq(cases.map(c=>c.facts.type)).length,authorities:uniq(cases.map(c=>c.facts.authority)).length,profiles:uniq(cases.map(c=>c.facts.profile)).length,definitions:uniq(cases.map(c=>c.facts.definition)).length,channels:channelCoverage.length,gates:gateCoverage.length,centerThreeStateCoverage:centerStateCoverage,advancedPresent:cases.filter(c=>Object.keys(c.facts.advanced).length>0).length,advancedAbsent:cases.filter(c=>Object.keys(c.facts.advanced).length===0).length,sparseCases:cases.filter(c=>c.edgeTags.includes('SPARSE_CONFIRMED')).length,schoolVariantCases:cases.filter(c=>c.edgeTags.includes('SCHOOL_VARIANT_AUTHORITY')).length,contradictoryExternalReportCases:cases.filter(c=>c.edgeTags.includes('CONTRADICTORY_EXTERNAL_REPORT')).length,personalityDesignStructuralCases:cases.filter(c=>c.facts.personalityDesignPairs.length>0).length},coverage:{channelIds:channelCoverage,gateIds:gateCoverage,centerStates:centerStateCoverage},results,campaignDigest:digest(results),publication:{r2RemainsCustomerPublished:true,r3State:'SHADOW_CANDIDATE',machineVerified:results.every(x=>x.pass),humanAccepted:false,customerPublishableR3:false}};
const cRendered=`${JSON.stringify(campaign,null,2)}\n`, rRendered=`${JSON.stringify(report,null,2)}\n`;
if(process.argv.includes('--check')){assert.equal(fs.readFileSync(CASES,'utf8'),cRendered,'HD_R3_W20_MACHINE_CASES_DRIFT');assert.equal(fs.readFileSync(RESULTS,'utf8'),rRendered,'HD_R3_W20_MACHINE_RESULTS_DRIFT');console.log(`✓ HD-PRO-R3-W20 machine campaign is deterministic: ${report.summary.passed}/96 PASS, ${report.summary.channels}/36 Channels, ${report.summary.gates}/64 Gates.`);}else{fs.writeFileSync(CASES,cRendered);fs.writeFileSync(RESULTS,rRendered);console.log(`Generated W20 machine campaign: ${report.summary.passed}/96 PASS.`);}
