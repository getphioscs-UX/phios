import {CX_PROJECTION_VERSION,boundary,clean,deepFreeze,list,localeOf,safeUrl,sourceLineage,upstreamState} from './projection-common.js';
const strings=value=>list(value).map(item=>clean(typeof item==='string'?item:item?.label||item?.summary||item?.statement)).filter(Boolean);
const option=item=>deepFreeze({
  id:clean(item?.id||item?.pathId||item?.code)||null,
  label:clean(item?.label||item?.title||item?.statement),
  description:clean(item?.description||item?.summary)||null,
  href:safeUrl(item?.href),
  state:clean(item?.state||item?.status)||null,
  evidence:clean(item?.evidenceState)||null,
  tradeOff:clean(item?.tradeOff||item?.tradeoff)||null,
  risks:strings(item?.risks||item?.risk),
  dependencies:strings(item?.dependencies),
  reversibility:clean(item?.reversibility)||null,
  observationPoints:strings(item?.observationPoints||item?.observe)
});
const confirmation=item=>{
  const state=clean(item?.confirmationState||item?.state||item?.status).toUpperCase();
  const customer=item?.customerConfirmed===true||state==='CHOSEN_BY_CUSTOMER';
  const professional=item?.professionalConfirmed===true||state==='CHOSEN_BY_PROFESSIONAL';
  const confirmed=customer||professional||['CONFIRMED','ACCEPTED'].includes(state);
  if(!confirmed)return null;
  return deepFreeze({id:clean(item?.id||item?.actionId)||null,label:clean(item?.label||item?.title||item?.statement),confirmationState:state||'CONFIRMED',confirmedBy:customer?'CUSTOMER':professional?'PROFESSIONAL':'UPSTREAM_CONFIRMED'});
};
export function projectNavigationForCustomer(navigation={}, {locale='en'}={}){
 const source=navigation&&typeof navigation==='object'?navigation:{};
 const options=list(source.options||source.paths||source.choices).map(option).filter(x=>x.label);
 const confirmedActions=list(source.actions).map(confirmation).filter(Boolean);
 return deepFreeze({schemaVersion:`${CX_PROJECTION_VERSION}:NAVIGATION`,locale:localeOf(locale),state:upstreamState(source.state||source.status,'NOT_ESTABLISHED'),currentPosition:clean(source.currentPosition||source.position)||null,options,selectedId:clean(source.selectedId||source.selectedPathId)||null,confirmedActions,governance:{selectionMadeBySystem:false,unconfirmedActionsHidden:true,...sourceLineage(['RNE']),...boundary()}});
}

// Source-only COUNTRY adapter; existing private Navigation state and persistence remain untouched.
export function projectPublicCountryResearchNavigation({subject,dimension,sourceRefs,sourceVersion,locale='en',countryCode,year}={}){
 if(subject?.subjectType!=='COUNTRY'||subject.visibility!=='PUBLIC'||subject.subjectId!=='WORLD:COUNTRY:'+countryCode||!Array.isArray(sourceRefs)||!sourceVersion)throw Error('PUBLIC_COUNTRY_NAVIGATION_SCOPE_REQUIRED');
 const zh=locale==='zh-Hans',t=(z,e)=>zh?z:e,base='/perspectives/profile/?subjectType=COUNTRY&country='+countryCode+'&dimension='+encodeURIComponent(dimension)+'&locale='+locale;
 const projected=projectNavigationForCustomer({state:'SOURCE_BOUND_OPTIONS',options:[{id:'COMPARE_COUNTRY',label:t('比较另一个国家的同年资料','Compare another country for the same year'),href:base+'&view=compare'+(year?'&year='+year:'')},{id:'COMPARE_PERIOD',label:t('选择另一统计期间并复核来源','Select another statistical period and inspect sources'),href:base+'&view=reading'},{id:'INSPECT_SOURCE',label:t('核对当前维度的来源与缺口','Inspect this dimension’s sources and gaps'),href:base+'&view=reading'}],actions:[]},{locale});
 return {...projected,governance:{...projected.governance,sourceAuthorities:['WORLD_EVIDENCE','SUBJECT_CONTEXT_R1'],formalRNEAdmission:false},subjectRef:subject.subjectId,subjectType:'COUNTRY',dimension,sourceRefs,sourceVersion,authority:'PUBLIC_OBSERVER_RESEARCH_ONLY',createsCase:false,createsCheckpoint:false,policyDecisionAuthority:false,savesPersonalFacts:false,persistence:false,automaticAction:false};
}
