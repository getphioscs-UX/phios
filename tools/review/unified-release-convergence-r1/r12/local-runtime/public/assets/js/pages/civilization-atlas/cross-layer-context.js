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
  const year=value=>value===null||value===undefined?null:(Number(value)<0?(lang==='zh-Hans'?`公元前${Math.abs(Number(value))}年`:`${Math.abs(Number(value))} BCE`):(lang==='zh-Hans'?`公元${Number(value)}年`:`${Number(value)} CE`));
  const current=primaryCase(state,data);
  const snapshot=byId(data?.world?.snapshots,'snapshotId',state.snapshotId);
  const family=byId(data?.comparison?.families,'familyId',state.comparisonFamilyId);
  const transition=byId(data?.transitions?.transitionWindows,'transitionWindowId',state.transitionWindowId);
  const lossType=byId(data?.loss?.lossTypes,'lossTypeId',state.lossTypeId);
  const trajectoryMap=new Map((data?.trajectories?.trajectories||[]).map(item=>[item.trajectoryId,item]));
  const trajectories=(state.trajectoryIds||[]).map(id=>label(trajectoryMap.get(id)?.title)).filter(Boolean);
  const layerLabel={
    timeline:{en:'Timeline','zh-Hans':'时间线'},world:{en:'World','zh-Hans':'世界'},cases:{en:'Civilizations','zh-Hans':'文明'},
    comparison:{en:'Compare','zh-Hans':'比较'},trajectories:{en:'Long Trends','zh-Hans':'长时段轨迹'},transitions:{en:'Transitions','zh-Hans':'转型窗口'},loss:{en:'Reversal & Loss','zh-Hans':'逆转与损失'}
  }[state.activeLayer||'timeline']?.[lang]||state.activeLayer||'timeline';
  const pieces=[
    layerLabel,
    current?label(current.title):null,
    snapshot?label(snapshot.title):null,
    family?label(family.title):null,
    trajectories.length?trajectories.join(' · '):null,
    transition?label(transition.title):null,
    lossType?label(lossType.title):null,
    year(state.time)
  ].filter(Boolean);
  return [...new Set(pieces)].join(' · ').slice(0,320);
}
