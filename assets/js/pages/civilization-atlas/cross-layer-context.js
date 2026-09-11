const first=value=>Array.isArray(value)&&value.length?value[0]:null;
const byId=(items,key,id)=>(items||[]).find(item=>item?.[key]===id)||null;
const primaryCase=(state,data)=>byId(data?.cases?.cases,'caseId',state?.primaryCaseId)||byId(data?.cases?.cases,'caseId',first(state?.caseIds));

export function reconcileAtlasContextForLayer(targetLayer,state={},data={}){
  const patch={activeLayer:targetLayer};
  const current=primaryCase(state,data);
  if(!current) return patch;

  if(targetLayer==='timeline'&&!state.timeWindowId){
    const period=(data?.timeline?.periods||[]).find(item=>(item.caseIds||[]).includes(current.caseId));
    if(period){patch.timeWindowId=period.periodId;if(state.time===null||state.time===undefined)patch.time=period.startYear;}
  }
  if(targetLayer==='comparison'&&!state.comparisonFamilyId){
    const family=first(current.comparisonFamilies);
    if(family) patch.comparisonFamilyId=family;
  }
  if(targetLayer==='world'&&!state.snapshotId){
    const available=new Set((data?.world?.snapshots||[]).map(item=>item.snapshotId));
    const snapshotId=(current.snapshots||[]).find(id=>available.has(id))||null;
    const snapshot=byId(data?.world?.snapshots,'snapshotId',snapshotId);
    if(snapshot){patch.snapshotId=snapshot.snapshotId;if(state.time===null||state.time===undefined)patch.time=snapshot.year;}
  }
  if(targetLayer==='trajectories'&&!(state.trajectoryIds||[]).length){
    const ids=(data?.trajectories?.trajectories||[]).filter(item=>(item.relatedCases||[]).includes(current.caseId)).map(item=>item.trajectoryId).slice(0,3);
    if(ids.length) patch.trajectoryIds=ids;
  }
  if(targetLayer==='transitions'&&!state.transitionWindowId){
    const direct=first(current.transitionWindows);
    const fallback=(data?.transitions?.transitionWindows||[]).find(item=>(item.relatedCases||[]).includes(current.caseId))?.transitionWindowId;
    if(direct||fallback) patch.transitionWindowId=direct||fallback;
  }
  if(targetLayer==='loss'&&(!state.lossFamilyId||!state.lossTypeId)){
    const profile=(data?.loss?.caseProfiles||[]).find(item=>item.caseId===current.caseId);
    const type=profile?byId(data?.loss?.lossTypes,'lossTypeId',profile.lossTypeId):null;
    if(type){if(!state.lossTypeId)patch.lossTypeId=type.lossTypeId;if(!state.lossFamilyId)patch.lossFamilyId=type.familyId;}
  }
  return patch;
}

export function atlasContextSummary(state={},data={},locale='en'){
  const lang=locale==='zh-Hans'?'zh-Hans':'en';
  const label=value=>value?.[lang]||value?.en||null;
  const current=primaryCase(state,data);
  const snapshot=byId(data?.world?.snapshots,'snapshotId',state.snapshotId);
  const family=byId(data?.comparison?.families,'familyId',state.comparisonFamilyId);
  const transition=byId(data?.transitions?.transitionWindows,'transitionWindowId',state.transitionWindowId);
  const lossType=byId(data?.loss?.lossTypes,'lossTypeId',state.lossTypeId);
  const pieces=[
    `Layer=${state.activeLayer||'timeline'}`,
    current?`Case=${current.caseId} ${label(current.title)}`:null,
    snapshot?`Snapshot=${snapshot.snapshotId} ${label(snapshot.title)}`:null,
    family?`Family=${family.familyId} ${label(family.title)}`:null,
    (state.trajectoryIds||[]).length?`Trajectories=${state.trajectoryIds.join(',')}`:null,
    transition?`Transition=${transition.transitionWindowId} ${label(transition.title)}`:null,
    lossType?`Loss=${lossType.lossTypeId} ${label(lossType.title)}`:null,
    state.time!==null&&state.time!==undefined?`Time=${state.time}`:null
  ].filter(Boolean);
  return pieces.join(' · ').slice(0,320);
}
