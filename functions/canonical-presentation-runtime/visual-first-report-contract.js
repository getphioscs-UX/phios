// Runtime view of content/professional/vfr-r1/visual-first-report-contract-v1.json.
export const VISUAL_FIRST_REPORT_CONTRACT_V1=Object.freeze({"version":"VISUAL_FIRST_REPORT_CONTRACT_V1","visualFirst":true,"diagramFirst":true,"maxPhysicalPages":50,"targetPhysicalPagesMin":40,"targetPhysicalPagesMax":48,"textRole":"SUPPORTING_INTERPRETATION","longFormSourceMayExist":true,"longFormSourceIsNotPhysicalComposition":true,"providerBudgetUsd":1,"normalProviderCalls":1,"absoluteMaxProviderCalls":2,"aiSemanticVerifierEnabled":false,"automaticRetryEnabled":false,"composerVersion":"VFR-R1","methods":["BZR","ZWR"]});
export function validateVisualReportIR(ir){
 if(!ir||!VISUAL_FIRST_REPORT_CONTRACT_V1.methods.includes(ir.method)||!['zh-Hans','en'].includes(ir.locale)||!ir.authorityDigest||!Array.isArray(ir.sections)||!Array.isArray(ir.diagrams)||!Array.isArray(ir.pages))throw Error('REPORT_IR_SCHEMA_INVALID');
 if(ir.pages.length>50)throw Error('PAGE_LIMIT_EXCEEDED');
 if(ir.pages.some((p,i)=>p.pageNumber!==i+1)||new Set(ir.diagrams.map(d=>d.id)).size!==ir.diagrams.length)throw Error('REPORT_IR_SCHEMA_INVALID');
 for(const p of ir.pages)if(p.diagramIds?.some(id=>!ir.diagrams.some(d=>d.id===id)))throw Error('DIAGRAM_DATA_MISSING');
 if(ir.providerUsage.providerCalls>2||ir.providerUsage.estimatedProviderCost>1||ir.providerUsage.semanticReviewCalls!==0)throw Error('PROVIDER_BUDGET_EXCEEDED');
 return ir;
}
export function canonicalSerialize(value){if(Array.isArray(value))return '['+value.map(canonicalSerialize).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalSerialize(value[k])).join(',')+'}';return JSON.stringify(value);}
export function visualReportCacheIdentity({method,authorityDigest,locale,realityInputDigest='NONE',composerVersion='VFR-R1'}){return canonicalSerialize({method,authorityDigest,locale,realityInputDigest,composerVersion});}
export function compactAuthoringPack({method,chartIdentity,sections,structuralFacts,timingFacts,unknownClaims,diagramSummaries,realityInput=null,outputSchema}){
 const unique=xs=>[...new Map((xs||[]).map(x=>[canonicalSerialize(x),x])).values()];
 return {method,chartIdentity,sections:unique(sections),structuralFacts:unique(structuralFacts),timingFacts:unique(timingFacts),unknownClaims:unique(unknownClaims),diagramSummaries:unique(diagramSummaries),customerRealityInput:realityInput,outputSchema};
}
