// A session consumer of existing PC, Navigation and RDG owners, not a new store.
import {newRealityCandidateStore,saveSelectedReality,reviewRealityRecord,projectCanonicalReality} from './pc-r1-reality-successor.js';
import {createNavigationContract} from '../runtime/navigation/navigation-contract.js';
import {projectRjxClientStage} from '../reality-journey-runtime/state-projection-v1.js';
import {evaluateVisibility,evaluateDataPermission} from '../../scripts/lib/reality-data-governance/rdg-access-rights-v1.mjs';
const requireValue=(ok,code)=>{if(!ok)throw Object.assign(new Error(code),{code});};
const clean=x=>typeof x==='string'?x.trim().slice(0,1000):'';
// A temporary question is not a selected direction, a fact or a saved case.
export function clarifyRealityQuestion(input,{subject,now=Date.now(),ttlMs=600000}){
 requireValue(input.consent===true,'SESSION_CONSENT_REQUIRED');
 requireValue(clean(input.question),'QUESTION_REQUIRED');
 return {stage:'clarify',question:clean(input.question),subject,locale:input.locale==='en'?'en':'zh-Hans',expiresAt:now+ttlMs};
}
export function beginRealityWorkbench(input,{subject,now=Date.now(),ttlMs=600000,materialVersion=null}){
 requireValue(input.consent===true,'SESSION_CONSENT_REQUIRED');requireValue(clean(input.question)&&clean(input.situation),'SITUATION_REQUIRED');
 const decision=evaluateDataPermission({actorReference:subject,subjectReference:subject,purposeCode:'RUNTIME_CONTINUITY',purposeAllowed:true,visibilityDecision:evaluateVisibility({visibilityScope:'SUBJECT_ONLY',actorReference:subject,subjectReference:subject}),sensitivityClass:'SENSITIVE',consentValid:true});requireValue(decision==='ALLOW','RDG_PERMISSION_DENIED');
 requireValue(input.useSelectedMaterials!==true||typeof materialVersion==='string','SELECTED_MATERIAL_PERMISSION_REQUIRED');
 const options=(input.options||[]).map((x,i)=>({id:'direction-'+i,name:clean(x.name),benefit:clean(x.benefit),tradeoff:clean(x.tradeoff),unknown:clean(x.unknown)}));requireValue(options.length===2&&options.every(x=>x.name&&x.benefit&&x.tradeoff&&x.unknown),'TWO_EXPLICIT_DIRECTIONS_REQUIRED');
 let store=newRealityCandidateStore({accountId:subject,entities:[{id:'session-person',kind:'PERSON',accountId:subject}]});
 const known=String(input.known||'').split('\n').map(clean).filter(Boolean),unknown=String(input.unknown||'').split('\n').map(clean).filter(Boolean);requireValue(unknown.length,'UNKNOWN_REQUIRED');
 store=saveSelectedReality(store,{actorAccountId:subject,entityId:'session-person',sourceProduct:'ASK',sourceKind:'CUSTOMER_ENTERED',selectedItems:[{id:'situation',statement:clean(input.situation),authority:'DECLARED',sourceRef:'USER_EXPLICIT_CURRENT_SESSION'},...known.map((statement,i)=>({id:'known-'+i,statement,authority:'DECLARED',sourceRef:'USER_EXPLICIT_CURRENT_SESSION'}))],action:'SAVE_SELECTED',consent:true,sourceConsent:{CUSTOMER_ENTERED:true},at:new Date(now).toISOString()});
 return {question:clean(input.question),known,unknown,options,store,chosen:null,observation:null,reflection:null,nextReview:clean(input.nextReview),expiresAt:now+ttlMs,stage:'navigation',locale:input.locale==='en'?'en':'zh-Hans',createdAt:now,subject,selectedMaterialVersion:input.useSelectedMaterials===true?materialVersion:null};
}
export function updateRealityWorkbench(state,input,{subject,now=Date.now()}){
 requireValue(state&&state.subject===subject,'SESSION_ACCESS_DENIED');requireValue(state.expiresAt>now,'SESSION_EXPIRED');requireValue(input.consent===true,'SESSION_CONSENT_REQUIRED');const next={...state};
 requireValue(state.stage!=='clarify','COMPLETE_CURRENT_CONDITIONS_FIRST');
 if(input.action==='defer'){requireValue(!state.observation,'REVIEW_EXISTING_OBSERVATION_FIRST');requireValue(clean(input.reason),'DEFER_REASON_REQUIRED');next.chosen=null;next.deferred={reason:clean(input.reason)};next.stage='navigation';}
 else if(input.action==='choose'){requireValue(state.options.some(o=>o.id===input.optionId),'DIRECTION_REQUIRED');requireValue(clean(input.reason),'CHOICE_REASON_REQUIRED');next.chosen={id:input.optionId,reason:clean(input.reason)};next.deferred=null;next.observation=null;next.reflection=null;next.stage='navigation';}
 else if(input.action==='observe'){requireValue(state.chosen,'CHOOSE_FIRST');requireValue(clean(input.statement),'OBSERVATION_REQUIRED');next.store=saveSelectedReality(state.store,{actorAccountId:subject,entityId:'session-person',sourceProduct:'ASK',sourceKind:'CUSTOMER_ENTERED',selectedItems:[{id:'observation-'+state.store.records.length,statement:clean(input.statement),authority:'DECLARED',sourceRef:'USER_REPORTED_SESSION_OBSERVATION',role:'SELF_REPORT_NOT_INDEPENDENT_CONFIRMATION'}],action:'SAVE_SELECTED',consent:true,sourceConsent:{CUSTOMER_ENTERED:true},at:new Date(now).toISOString()});next.observation=clean(input.statement);next.stage='review';}
 else if(input.action==='review'){requireValue(state.observation,'OBSERVE_FIRST');requireValue(clean(input.reflection)&&clean(input.nextReview),'REVIEW_REQUIRED');const record=state.store.records.at(-1);next.store=reviewRealityRecord(state.store,{actorAccountId:subject,entityId:'session-person',recordId:record.id,action:'CONFIRM',reason:clean(input.reflection),at:new Date(now).toISOString(),consent:true});next.reflection=clean(input.reflection);next.nextReview=clean(input.nextReview);next.stage='continuity';}
 else requireValue(false,'ACTION_INVALID');return next;
}
export function projectRealityWorkbench(state,{subject,now=Date.now(),selectedMaterials=[]}){
 if(!state||state.subject!==subject||state.expiresAt<=now)return {available:false,expired:!!state,persisted:false};
 if(state.stage==='clarify')return {available:true,stage:'clarify',question:state.question,locale:state.locale,known:[],unknown:[],options:[],chosen:null,persisted:false,saveAuthorized:false,historyState:'NO_VERIFIED_HISTORY',relationEdges:[],nextRequired:['CURRENT_SITUATION','IMPORTANT_UNKNOWNS'],sourceNature:'USER_QUESTION_NOT_FACT'};
 const workspace=projectCanonicalReality(state.store,{actorAccountId:subject,locale:state.locale,questions:state.unknown}).existingWorkspace;
 const navigation=createNavigationContract({runtimeEntityId:'session-person',runtimeEntryId:'current-question',desiredDirection:state.question,availablePaths:state.options.map(o=>({id:o.id,pathType:'clarify',label:o.name,direction:o.benefit,boundary:o.tradeoff,rationale:'USER_PROPOSED_DIRECTION',unknownReality:[o.unknown],evidenceBasis:['USER_EXPLICIT_CURRENT_SESSION'],reviewConditions:[state.nextReview||'USER_TO_SET_REVIEW']})),selectedPath:state.chosen?{id:state.chosen.id,selectionSource:'user_choice',selectionNote:state.chosen.reason}:null,unknownReality:state.unknown});
 return {available:true,question:state.question,workspace,known:state.known,unknown:state.unknown,options:state.options,chosen:state.chosen,deferred:state.deferred||null,observation:state.observation,reflection:state.reflection,nextReview:state.nextReview,stage:projectRjxClientStage(state.stage).clientStage,navigation,selectedMaterials:state.selectedMaterialVersion?selectedMaterials:[],materialState:state.selectedMaterialVersion?(selectedMaterials.length?'CURRENT_EXPLICIT_SELECTION':'RECHECK_REQUIRED'):'NOT_REQUESTED',sourceNature:'USER_SELF_REPORT',historyState:'NO_VERIFIED_HISTORY',relationEdges:[],persisted:false,saveAuthorized:false};
}
