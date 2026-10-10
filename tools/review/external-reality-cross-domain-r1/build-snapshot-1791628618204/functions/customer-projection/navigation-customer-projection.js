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
