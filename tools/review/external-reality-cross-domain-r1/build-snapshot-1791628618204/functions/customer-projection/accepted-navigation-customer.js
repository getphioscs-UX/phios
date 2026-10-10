import {evaluateAcceptedNavigationThrough30,projectAcceptedNavigationThrough30} from '../runtime/navigation/nav-accepted-batch-06-runtime.js';
import {personIdentity} from '../account/canonical-person-store.js';
import {deepFreeze} from './projection-common.js';

// HTTP intake is a session projection, not an owner-confirmed canonical decision.
// Only server middleware may provide an existing owner-scoped admitted snapshot.
export function acceptedNavigationForCustomer(context,{reality,locale='en',sessionInput=false}={}){
 let identity=null;try{identity=personIdentity(context);}catch{}
 const sources=context?.data?.cxRealitySources||{},candidate=sources.acceptedNavigation;
 const snapshot=candidate?.snapshot,admission=candidate?.admission;
 const admitted=!sessionInput&&identity&&admission?.processingConsent===true&&admission?.ownerId===identity.userId&&
  snapshot?.ownerId===identity.userId&&admission?.personId===snapshot.personId&&
  admission?.realityId===reality?.overview?.bundleId&&!!admission?.realityId&&
  !!sources.bundle?.version&&admission?.realityVersion===sources.bundle.version&&
  admission?.decisionVersion===snapshot.decisionVersion&&admission?.positionVersion===snapshot.positionVersion&&
  !!admission?.sourceRef&&!!admission?.sourceVersion;
 const runtime=evaluateAcceptedNavigationThrough30(admitted?snapshot:{},{ownerId:admitted?identity.userId:null,personId:admitted?snapshot.personId:null});
 const projected=projectAcceptedNavigationThrough30(runtime,{locale});
 const modules=runtime.modules.map((m,i)=>({moduleId:m.moduleId,title:projected.sections[i].title,state:m.canContinue?'READY_FOR_NEXT_ACCEPTED_MODULE':'NOT_ESTABLISHED',contractVersion:m.contractVersion,sourceSHA256:m.sourceSHA256,
  known:m.canContinue?m.items.map(item=>({description:item.description||item.claim||'',value:['string','number','boolean'].includes(typeof item.value)?item.value:null,evidenceState:item.evidenceState,sourceClass:item.sourceClass,sourceRef:item.sourceRef||null,sourceVersion:item.sourceVersion||null,asOf:item.asOf||null,currentness:item.currentness||null,interpretiveContext:['PROFILE_EVIDENCE','REPORT_INTERPRETATION','SYMBOLIC_READING'].includes(item.sourceClass)})):[],unknown:m.canContinue?[]:[locale==='zh-Hans'?'需要已确认、当前且与本人绑定的现实资料。':'Confirmed, current, owner-bound Reality information is required.']}));
 return deepFreeze({schemaVersion:'CX_ACCEPTED_NAVIGATION_V1',state:admitted&&runtime.modules.some(m=>m.canContinue)?'PARTIALLY_ESTABLISHED':'NOT_ESTABLISHED',
  currentPosition:null,options:[],selectedId:null,confirmedActions:[],acceptedEvaluation:{acceptedThrough:'NAV-30',evaluatedModules:30,modules,
   applicable:!!admitted,sourceRef:admitted?admission.sourceRef:null,sourceVersion:admitted?admission.sourceVersion:null,
   realityVersion:admitted?admission.realityVersion:null,decisionVersion:runtime.decisionVersion,positionVersion:runtime.positionVersion,
   userConfirmed:admitted&&snapshot.decision?.confirmation==='USER_CONFIRMED'&&snapshot.decision.confirmedBy===identity.userId,
   processingConsent:sessionInput||!!admitted&&admission?.processingConsent===true,persistenceConsent:false,persisted:false,finalAction:null,providerCalls:0},
  governance:{sourceAuthorities:['NAV-01–NAV-30','RMO'],legacyRNEUsed:false,selectionMadeBySystem:false,rawRuntimeExposed:false,persisted:false}});
}
