/** Source routing only: a ruler's actual placement is distinct from its ruled house. */
export function buildAstHouseRulerSectionRoutes({canonicalProjection,professionalSemanticProjection,bodyEvidence,routePolicy}){
 const r=professionalSemanticProjection.sections.rulership;
 const group=code=>canonicalProjection.calculation.structures.find(x=>x.code===code)?.items||[];
 const aspects=group('ASPECTS'),placements=group('HOUSE_PLACEMENTS');
 return Object.entries(routePolicy||{}).map(([sectionId,policy])=>{
  const routes=policy.houses.map(houseNumber=>{
   const ruler=r.houseRulers.find(x=>x.houseNumber===houseNumber);if(!ruler)return {houseNumber,status:'EVIDENCE_LIMITED'};
   const body=bodyEvidence[ruler.primaryRuler];if(!body)return {houseNumber,status:'EVIDENCE_LIMITED'};
   const chain=r.dispositorChains.find(x=>x.bodyCode===body.bodyCode);
   const aspectRefs=aspects.filter(x=>[x.meta.fromCode,x.meta.toCode].includes(body.bodyCode)).map(x=>x.code).sort();
   return {houseNumber,cuspLongitude:ruler.cuspLongitude,cuspSign:ruler.signCode,rulerBodyCode:ruler.primaryRuler,rulerActualSign:body.signCode,rulerActualHouse:body.houseNumber,dispositorChain:chain,aspectRefs,status:'BOUND',sourceRefs:['HOUSE_'+houseNumber,body.bodyCode,'DISPOSITOR:'+body.bodyCode,...aspectRefs],ruledHouseIsNotRulerOccupancy:true};
  });
  const seeds=[...new Set([...routes.filter(x=>x.status==='BOUND').flatMap(x=>[x.rulerBodyCode,...(x.dispositorChain?.path||[])]),...(policy.additionalBodies||[]),...(policy.includeOccupants?placements.filter(x=>policy.houses.includes(x.value)&&bodyEvidence[x.code]).map(x=>x.code):[])])];
  const routedAspects=aspects.filter(x=>seeds.includes(x.meta.fromCode)||seeds.includes(x.meta.toCode));
  const bodyRefs=[...new Set([...seeds,...routedAspects.flatMap(x=>[x.meta.fromCode,x.meta.toCode])])].sort();
  const angleRefs=(policy.angles||[]).filter(code=>professionalSemanticProjection.sections.angles.some(x=>x.code===code));
  return {sectionId,routes,bodyRefs,houseRefs:[...new Set([...policy.houses,...bodyRefs.map(x=>bodyEvidence[x]?.houseNumber).filter(Number.isFinite)])].sort((a,b)=>a-b),aspectRefs:routedAspects.map(x=>x.code).sort(),angleRefs,claimRefs:['AST-R4A-RULERSHIP-HOUSE-RULER','AST-R4A-RULERSHIP-DISPOSITOR-CHAIN',...angleRefs.map(x=>'AST-R4A-ANGLE-'+x)],status:routes.every(x=>x.status==='BOUND')&&angleRefs.length===(policy.angles||[]).length?'BOUND':'EVIDENCE_LIMITED',routingBoundary:'TOPOLOGY_NOT_HIERARCHY'};
 });
}
export function assertAstAuthoringSectionEvidence(sectionPlan,houseRulerSectionRoutes,canonicalProjection){
 const aspects=canonicalProjection.calculation.structures.find(x=>x.code==='ASPECTS').items;
 const byId=new Map(sectionPlan.map(x=>[x.sectionId,x]));
 for(const id of ['RELATIONSHIPS_RECIPROCITY','WORK_RESPONSIBILITY_PUBLIC_DIRECTION','RESOURCES_SECURITY_DEPENDENCY']){
  const section=byId.get(id),route=houseRulerSectionRoutes.find(x=>x.sectionId===id);
  if(!section||!route)throw Error('AST_R5_SECTION_ROUTE_REQUIRED:'+id);
  if(route.status!=='BOUND'){if(!section.evidenceLimited)throw Error('AST_R5_EVIDENCE_LIMIT_REQUIRED:'+id);continue;}
  const requiredHouses=id==='RELATIONSHIPS_RECIPROCITY'?[7]:id==='WORK_RESPONSIBILITY_PUBLIC_DIRECTION'?[10]:[2,8];
  const requiredAngles=id==='RELATIONSHIPS_RECIPROCITY'?['DSC']:id==='WORK_RESPONSIBILITY_PUBLIC_DIRECTION'?['MC']:[];
  if(requiredHouses.some(h=>!route.routes.some(x=>x.houseNumber===h&&x.status==='BOUND'))||requiredAngles.some(a=>!section.allowedAngleRefs.includes(a)))throw Error('AST_R5_SECTION_ROUTE_REQUIRED:'+id);
  if(!section.allowedBodyRefs.length||!section.allowedAspectRefs.length||route.bodyRefs.some(x=>!section.allowedBodyRefs.includes(x))||route.aspectRefs.some(x=>!section.allowedAspectRefs.includes(x)))throw Error('AST_R5_SECTION_EVIDENCE_INSUFFICIENT:'+id);
 }
 for(const [id,types] of [['PRESSURE_ADAPTATION',['SQUARE','OPPOSITION']],['SUPPORTING_FLOW',['TRINE','SEXTILE']]]){
  const section=byId.get(id);if(!section||!section.allowedAspectRefs.some(code=>aspects.some(x=>x.code===code&&types.includes(x.meta.type))))throw Error('AST_R5_SECTION_ASPECT_EVIDENCE_REQUIRED:'+id);
 }
}
