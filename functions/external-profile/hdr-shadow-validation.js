import {createHdrInternalValidationReportRuntime} from '../professional/hdr-internal/hdr-internal-validation-report-runtime.js';

export const HDR_SHADOW_VALIDATION_VERSION='PHI-OS-CX-R12R4B-HDR-SHADOW-VALIDATION-v1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};

function sectionMap(report){return new Map((report?.sections||[]).map(section=>[section.sectionCode,section.content]))}
function comparableFromReport(report){
  const sections=sectionMap(report);
  const type=sections.get('type')?.typeCode||null;
  const authority=sections.get('authority')?.authorityCode||null;
  const profile=sections.get('profile')?.profile?.profileCode||sections.get('profile')?.profile||null;
  const definition=sections.get('definition')?.definition?.definitionCode||sections.get('definition')?.definition||null;
  const centers=sections.get('centers')||{};
  const channels=sections.get('channels')||{};
  const gates=sections.get('key_gates')||{};
  return freeze({
    type,authority,profile,definition,
    channels:freeze(channels.channels||[]),
    definedCenters:freeze(centers.definedCenters||[]),
    openCenters:freeze(centers.undefinedCenters||[]),
    activations:freeze(gates.activations||[])
  });
}
function normalizeText(value){return String(value??'').trim().toUpperCase().replace(/[\s_\-（）()]/g,'')}
const TYPE_ALIAS=new Map([['生产者','GENERATOR'],['生產者','GENERATOR'],['GENERATOR','GENERATOR'],['显示生产者','MANIFESTING_GENERATOR'],['顯示生產者','MANIFESTING_GENERATOR'],['MANIFESTINGGENERATOR','MANIFESTING_GENERATOR'],['MG','MANIFESTING_GENERATOR'],['显示者','MANIFESTOR'],['顯示者','MANIFESTOR'],['MANIFESTOR','MANIFESTOR'],['投射者','PROJECTOR'],['PROJECTOR','PROJECTOR'],['反映者','REFLECTOR'],['REFLECTOR','REFLECTOR']].map(([k,v])=>[normalizeText(k),v]));
const AUTH_ALIAS=new Map([['情绪权威','EMOTIONAL'],['情緒權威','EMOTIONAL'],['EMOTIONALAUTHORITY','EMOTIONAL'],['EMOTIONAL','EMOTIONAL'],['骶骨权威','SACRAL'],['薦骨權威','SACRAL'],['SACRALAUTHORITY','SACRAL'],['SACRAL','SACRAL'],['脾权威','SPLENIC'],['脾權威','SPLENIC'],['SPLENICAUTHORITY','SPLENIC'],['SPLENIC','SPLENIC'],['自我投射权威','SELF_PROJECTED'],['SELFPROJECTED','SELF_PROJECTED'],['意志力显示权威','EGO_MANIFESTED'],['EGOMANIFESTED','EGO_MANIFESTED'],['意志力投射权威','EGO_PROJECTED'],['EGOPROJECTED','EGO_PROJECTED'],['环境权威','MENTAL_ENVIRONMENTAL'],['環境權威','MENTAL_ENVIRONMENTAL'],['MENTALENVIRONMENTAL','MENTAL_ENVIRONMENTAL'],['月亮权威','LUNAR'],['月亮權威','LUNAR'],['LUNAR','LUNAR']].map(([k,v])=>[normalizeText(k),v]));
const DEF_ALIAS=new Map([['单一定义','SINGLE_DEFINITION'],['單一定義','SINGLE_DEFINITION'],['SINGLEDEFINITION','SINGLE_DEFINITION'],['二分人','SPLIT_DEFINITION'],['二分定义','SPLIT_DEFINITION'],['二分定義','SPLIT_DEFINITION'],['SPLITDEFINITION','SPLIT_DEFINITION'],['三重分离','TRIPLE_SPLIT_DEFINITION'],['三重分離','TRIPLE_SPLIT_DEFINITION'],['TRIPLESPLIT','TRIPLE_SPLIT_DEFINITION'],['TRIPLESPLITDEFINITION','TRIPLE_SPLIT_DEFINITION'],['四重分离','QUADRUPLE_SPLIT_DEFINITION'],['四重分離','QUADRUPLE_SPLIT_DEFINITION'],['QUADRUPLESPLITDEFINITION','QUADRUPLE_SPLIT_DEFINITION']].map(([k,v])=>[normalizeText(k),v]));
function normalizeExternal(field,value){const token=normalizeText(value);if(field==='type')return TYPE_ALIAS.get(token)||token;if(field==='authority')return AUTH_ALIAS.get(token)||token;if(field==='definition')return DEF_ALIAS.get(token)||token;if(field==='profile')return String(value??'').match(/[1-6]\s*\/\s*[1-6]/)?.[0]?.replace(/\s/g,'')||token;return token}
function recordMap(confirmedProfile){return new Map((confirmedProfile?.records||[]).map(record=>[record.field,record.value]))}
function setNorm(value){return new Set((Array.isArray(value)?value:[]).map(item=>normalizeText(typeof item==='string'?item:(item?.channelCode||item?.gateLine||item?.value||''))).filter(Boolean))}
function compareSet(field,external,shadow){const a=setNorm(external),b=setNorm(shadow);if(!a.size)return null;const missing=[...a].filter(x=>!b.has(x)),extra=[...b].filter(x=>!a.has(x));return freeze({field,status:missing.length||extra.length?'MISMATCH':'MATCH',externalCount:a.size,shadowCount:b.size,missingFromShadow:freeze(missing),additionalShadow:freeze(extra)})}

export function compareConfirmedExternalProfileToHdrShadow({confirmedProfile,shadowProfile}={}){
  const records=recordMap(confirmedProfile),comparisons=[];
  for(const field of ['type','authority','profile','definition']){
    if(!records.has(field)||shadowProfile?.[field]==null)continue;
    const external=normalizeExternal(field,records.get(field)),shadow=normalizeExternal(field,shadowProfile[field]);
    comparisons.push(freeze({field,status:external===shadow?'MATCH':'MISMATCH',externalValue:records.get(field),shadowValue:shadowProfile[field]}));
  }
  for(const field of ['channels','definedCenters','openCenters']){const result=compareSet(field,records.get(field),shadowProfile?.[field]);if(result)comparisons.push(result)}
  const mismatches=comparisons.filter(item=>item.status==='MISMATCH');
  return freeze({
    schemaVersion:HDR_SHADOW_VALIDATION_VERSION,
    state:mismatches.length?'PROFILE_DISCREPANCY':'REFERENCE_MATCH',
    comparisons:freeze(comparisons),
    mismatchCount:mismatches.length,
    boundary:freeze({internalValidationOnly:true,customerProfileOverwritten:false,customerAuthorityChanged:false,reportAuthorityCreated:false,meaningCreated:false,interpretationCreated:false})
  });
}

export async function runHdrShadowValidation({canonicalBirthInput,confirmedProfile,requestId=`HDR-SHADOW-${crypto.randomUUID()}`,runtimeFactory=createHdrInternalValidationReportRuntime}={}){
  if(!canonicalBirthInput||!confirmedProfile)throw new TypeError('HDR_SHADOW_VALIDATION_INPUT_REQUIRED');
  const runtime=runtimeFactory();
  const report=await runtime.generate({
    requestId,
    reportId:`${requestId}:REPORT`,
    generatedAt:new Date().toISOString(),
    canonicalBirthInput:freeze({...canonicalBirthInput,consent:freeze({...canonicalBirthInput.consent,hdrInternalValidation:true})}),
    professionalContext:freeze({professionalId:'PHIOS_HDR_SHADOW_SYSTEM',professionalName:'PHI OS Internal Shadow Validator',clientId:'EPHEMERAL_CUSTOMER',workspaceId:'EPHEMERAL_SHADOW_WORKSPACE',consentReference:canonicalBirthInput.consent?.recordId||'EPHEMERAL',workspaceAccessGranted:true,boundaryAcknowledged:true})
  });
  const shadowProfile=comparableFromReport(report);
  return freeze({shadowProfile,comparison:compareConfirmedExternalProfileToHdrShadow({confirmedProfile,shadowProfile}),governance:freeze({reportVisibility:report.visibility,reportStatus:report.status,productionDispatchAuthorityCreated:false,clientDeliveryAllowed:false,persisted:false})});
}
