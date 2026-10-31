import { initializeI18n, onLocaleChange, t } from '../i18n.js';
import { initializeRuntimeWorkspace } from '../modules/runtime-workspace.js';
import { MEMORY_KEY, CONTINUITY_KEY, getWorkspaceOptions } from '../modules/runtime-workspace-state.js';
import { getSession, safeJSON, setSession, cleanText } from '../shared.js';
import { executeRuntimeTransition, getRuntimeTransitionExecution } from '../modules/runtime-transition-engine.js';

const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list=(id,items,emptyKey='memory.none')=>{$(id).innerHTML=(Array.isArray(items)&&items.length?items:[t(emptyKey)]).map(x=>`<li>${escape(typeof x==='string'?x:x?.statement||'')}</li>`).join('');};

function readMemory(){return safeJSON(getSession(MEMORY_KEY),null)}
function readContinuity(){return safeJSON(getSession(CONTINUITY_KEY),null)}
function render(){
  const memory=readMemory();
  initializeRuntimeWorkspace({currentStage:location.hash==='#continuity'?'continuity':'memory'});
  $('memoryEmpty').classList.toggle('hidden',Boolean(memory));
  $('memoryWorkspace').classList.toggle('hidden',!memory);
  if(!memory)return;
  $('memoryId').textContent=memory.memoryId||t('memory.notEstablished');
  $('runtimeEntryId').textContent=memory.runtimeEntryId||t('memory.notEstablished');
  $('memoryPath').textContent=memory.selectedPath?.title||memory.selectedPath?.label||t('memory.notEstablished');
  $('memoryOutcome').textContent=t(`memory.outcome.${memory.outcomeMemory?.nextRuntimeState}`,{},memory.outcomeMemory?.nextRuntimeState||t('memory.notEstablished'));
  list('memoryObserved',memory.reportedMemory?.observedChanges);
  list('memoryUnexpected',memory.reportedMemory?.unexpectedReality);
  list('memoryUnknown',memory.unresolvedMemory?.inheritedUnknownReality);
  list('memoryReasons',memory.outcomeMemory?.reasons);
  const existing=readContinuity();
  const selected=existing?.userChoice?.nextRuntimeState||memory.outcomeMemory?.nextRuntimeState||'';
  document.querySelectorAll('[name="continuityChoice"]').forEach(input=>input.checked=input.value===selected);
  const execution=getRuntimeTransitionExecution();
  $('continuityStatus').textContent=execution?.continuityId===existing?.continuityId?t('memory.transitionExecuted'):existing?.userChoice?.confirmed?t('memory.continuityConfirmed'):t('memory.continuityWaiting');
  $('executeTransition')?.classList.toggle('hidden',!existing?.userChoice?.confirmed||execution?.continuityId===existing?.continuityId);
}
function confirmContinuity(){
  const memory=readMemory();
  const selected=document.querySelector('[name="continuityChoice"]:checked')?.value||'';
  const expected=cleanText(memory?.outcomeMemory?.nextRuntimeState);
  if(!memory||!selected)return;
  if(selected!==expected){$('continuityStatus').textContent=t('memory.continuityMismatch');return;}
  const contract={schemaVersion:'phi-os.continuity.v1',continuityId:`continuity_${crypto.randomUUID().slice(0,8)}`,createdAt:new Date().toISOString(),runtimeEntityId:memory.runtimeEntityId,sourceRuntimeId:memory.lineage?.currentRuntimeId||memory.runtimeEntryId,sourceRuntimeEntryId:memory.runtimeEntryId,sourceMemoryId:memory.memoryId,userChoice:{nextRuntimeState:selected,confirmed:true,confirmedAt:new Date().toISOString(),selectionSource:'user_confirmation',automaticSelection:false},transition:{createsNextRuntime:false,nextRuntimeId:null,preservesSourceRuntime:true},destination:{stage:destination(selected),historicalOverwrite:false},guardrails:{historicalContractOverwriteAllowed:false,readingOverwriteAllowed:false,navigationOverwriteAllowed:false,memoryOverwriteAllowed:false,appendOnly:true}};
  setSession(CONTINUITY_KEY,contract);render();location.hash='continuity';
}
function destination(choice){return ({continue_observation:'review',continue_selected_path:'navigation',return_to_reading:'reading',choose_another_path:'navigation',start_new_entry:'entry',professional_review:'navigation',remain_open:'memory'})[choice]||'memory'}
function executeTransition(){
  const continuity=readContinuity();
  if(!continuity)return;
  try{
    const execution=executeRuntimeTransition(continuity,{userInitiated:true});
    if(execution.route&&execution.route!==location.pathname+location.hash) location.assign(execution.route);
    else render();
  }catch(error){$('continuityStatus').textContent=error?.message||t('memory.transitionFailed');}
}
function boot(){initializeI18n();render();$('confirmContinuity')?.addEventListener('click',confirmContinuity);$('executeTransition')?.addEventListener('click',executeTransition);onLocaleChange(render);window.addEventListener('hashchange',render)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
