export const MIR9_BACKEND_STATES = Object.freeze(['entry','orientation','reading','reconstruction','navigation','review','continuity','closed']);
const PROJECTIONS=Object.freeze({
 entry:Object.freeze({clientStage:'Understand',defaultVisibleSections:Object.freeze(['Your Situation'])}),
 orientation:Object.freeze({clientStage:'Understand',defaultVisibleSections:Object.freeze(['Your Situation','What Is Missing'])}),
 reading:Object.freeze({clientStage:'Understand',defaultVisibleSections:Object.freeze(['What Appears Important'])}),
 reconstruction:Object.freeze({clientStage:'Understand',defaultVisibleSections:Object.freeze(['What PHI OS Knows','What May Be Connected'])}),
 navigation:Object.freeze({clientStage:'Choose',defaultVisibleSections:Object.freeze(['What You Can Explore'])}),
 review:Object.freeze({clientStage:'Review',defaultVisibleSections:Object.freeze(['What Changed'])}),
 continuity:Object.freeze({clientStage:'Review',defaultVisibleSections:Object.freeze(['Reality Next'])}),
 closed:Object.freeze({clientStage:'Review',defaultVisibleSections:Object.freeze(['Case Closure','Continuation Record'])})
});
export function projectRjxClientStage(runtimeState){const state=String(runtimeState??'').trim();if(!MIR9_BACKEND_STATES.includes(state))throw Object.assign(new TypeError('MIR9_RUNTIME_STATE_UNKNOWN'),{code:'MIR9_RUNTIME_STATE_UNKNOWN'});const p=PROJECTIONS[state];return Object.freeze({runtimeState:state,clientStage:p.clientStage,defaultVisibleSections:p.defaultVisibleSections,authority:Object.freeze({readOnlyProjection:true,runtimeStateMutated:false,urlOwnsState:false,screenOwnsState:false})});}
