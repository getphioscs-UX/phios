import { loadInterpretationRegistryV2 } from './registry-loader-v2.js';
import { getDerivationOperator } from './operators.js';
import { isInterpretationConfidence } from './confidence.js';
import { evaluateRule } from './rule-engine-v1.js';
import { createInterpretationLineage } from './lineage.js';
export function derive(source,targetType,context={}){
  if(!source?.type||!source?.id) return Object.freeze({result:null,rule:null,confidence:'Unknown',lineage:createInterpretationLineage(),alternatives:[],unknowns:['SOURCE_REQUIRED']});
  const edges=loadInterpretationRegistryV2('edges').edges;
  const candidates=edges.filter(e=>e.sourceType===source.type&&e.sourceId===source.id&&e.targetType===targetType);
  if(!candidates.length) return Object.freeze({result:null,rule:null,confidence:'Unknown',lineage:createInterpretationLineage({sourceRefs:source.lineage?.sourceRefs||[]}),alternatives:[],unknowns:['NO_GOVERNED_EDGE']});
  for(const edge of candidates){
    const operator=getDerivationOperator(edge.operatorId); if(!operator) continue;
    if(!isInterpretationConfidence(edge.confidenceClass)) continue;
    const evaluation=evaluateRule(edge,{...context,conditions:[...(context.conditions||[]),'SOURCE_PRESENT','EVIDENCE_REFS_RESOLVABLE']});
    if(!evaluation.eligible) continue;
    const lineage=createInterpretationLineage({sourceRefs:[...(source.lineage?.sourceRefs||[]),...edge.evidenceRefs],evidenceRefs:edge.evidenceRefs,ruleRef:edge.edgeId,projectionRef:context.projectionRef??null});
    const result=Object.freeze({source:{type:source.type,id:source.id},target:{type:edge.targetType,id:edge.targetId},operatorId:edge.operatorId,authorityStatus:edge.authorityStatus,contextSnapshot:context.contextSnapshot??null,createsCanonicalMeaningIdentity:false});
    return Object.freeze({result,rule:edge.edgeId,confidence:edge.confidenceClass,lineage,alternatives:edge.alternativeEdges||[],unknowns:[]});
  }
  return Object.freeze({result:null,rule:null,confidence:'Unknown',lineage:createInterpretationLineage({sourceRefs:source.lineage?.sourceRefs||[]}),alternatives:candidates.map(x=>x.edgeId),unknowns:['CONDITIONS_NOT_SATISFIED']});
}
