/** Connected subsets of existing canonical edges. No geometry or meanings created. */
export function buildAstAspectNetworkClusters({aspects,bodyEvidence,policy}){
 if(!policy)return [];
 const bodies=Object.keys(bodyEvidence).sort();
 const allowed=new Set(policy.aspectTypes);
 const edges=aspects.filter(e=>allowed.has(e.meta?.type)&&bodyEvidence[e.meta.fromCode]&&bodyEvidence[e.meta.toCode]&&Number.isFinite(e.meta.orb)&&e.meta.authorizedOrbDegrees>0&&e.meta.orb/e.meta.authorizedOrbDegrees<=policy.maximumNormalizedOrb).sort((a,b)=>a.code.localeCompare(b.code));
 const candidates=[];
 for(let mask=0;mask<2**bodies.length;mask++){
  const members=bodies.filter((_,i)=>mask&(1<<i));if(members.length<policy.minimumBodies||members.length>policy.maximumBodies)continue;
  const selected=edges.filter(e=>members.includes(e.meta.fromCode)&&members.includes(e.meta.toCode));if(selected.length<policy.minimumEdges)continue;
  const visited=new Set([members[0]]);let changed=true;
  while(changed){changed=false;for(const e of selected)if(visited.has(e.meta.fromCode)||visited.has(e.meta.toCode))for(const code of [e.meta.fromCode,e.meta.toCode])if(!visited.has(code)){visited.add(code);changed=true;}}
  if(visited.size!==members.length)continue;
  const density=selected.length/(members.length*(members.length-1)/2);if(density<policy.minimumDensity)continue;
  const meanNormalizedOrb=selected.reduce((n,e)=>n+e.meta.orb/e.meta.authorizedOrbDegrees,0)/selected.length;
  const houseNumbers=[...new Set(members.map(b=>bodyEvidence[b].houseNumber))].sort((a,b)=>a-b);
  const score=Number((policy.basePriority+density*policy.densityWeight+(1-meanNormalizedOrb/policy.maximumNormalizedOrb)*policy.tightnessWeight+Math.min(houseNumbers.length,policy.maximumDomainBonus)).toFixed(6));
  candidates.push({clusterId:'CLUSTER:'+members.join('|'),familyCode:'ASPECT_NETWORK_CLUSTER',bodyCodes:members,houseNumbers,evidenceAspectCodes:selected.map(e=>e.code).sort(),edges:selected.map(e=>({aspectCode:e.code,fromCode:e.meta.fromCode,toCode:e.meta.toCode,type:e.meta.type,orbDegrees:e.meta.orb,authorizedOrbDegrees:e.meta.authorizedOrbDegrees})).sort((a,b)=>a.aspectCode.localeCompare(b.aspectCode)),connected:true,density,meanNormalizedOrb,score,namedTraditionalPattern:false});
 }
 // Keep maximal eligible topology rather than all overlapping sub-triangles.
 return candidates.filter(c=>!candidates.some(other=>other.bodyCodes.length>c.bodyCodes.length&&c.bodyCodes.every(b=>other.bodyCodes.includes(b)))).sort((a,b)=>b.score-a.score||a.clusterId.localeCompare(b.clusterId));
}
