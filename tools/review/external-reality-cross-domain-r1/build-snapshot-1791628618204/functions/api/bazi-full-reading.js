import {buildCanonicalBaziChartIR} from '../bzr-full-production/bazi-chart-runtime.js';
import {analyzeBaziStrengthSeasonal} from '../bzr-full-production/bazi-strength-seasonal-runtime.js';
import {analyzeBaziRelationships} from '../bzr-full-production/bazi-relationship-runtime.js';
import {analyzeBaziTenGods} from '../bzr-full-production/bazi-ten-god-runtime.js';
import {analyzeBaziPatternCandidates} from '../bzr-full-production/bazi-pattern-runtime.js';
import {analyzeBaziUsefulGodTiaohouViews} from '../bzr-full-production/bazi-useful-god-tiaohou-runtime.js';
import {buildBaziDaYunStructuralIR} from '../bzr-full-production/bazi-da-yun-runtime.js';
import {buildBaziLiuNianInteractionIR} from '../bzr-full-production/bazi-liu-nian-interaction-runtime.js';
import {buildBaziStructuralFindingRegistry} from '../bzr-full-production/bazi-structural-finding-runtime.js';
import {buildBaziInterpretationEvidenceGraph} from '../bzr-full-production/bazi-interpretation-evidence-graph-runtime.js';
import {buildBaziCrossFindingComposition} from '../bzr-full-production/bazi-cross-finding-composition-runtime.js';
import {resolveBaziContradictions} from '../bzr-full-production/bazi-contradiction-resolver-runtime.js';
import {buildBaziSemanticDedupIR} from '../bzr-full-production/bazi-semantic-dedup-runtime.js';
import {buildBaziReadingIR} from '../bzr-full-production/bazi-reading-ir-runtime.js';
import {composeBaziCustomerReport} from '../bzr-full-production/bazi-customer-report-runtime.js';
import {BZR_TEMPORAL_PROJECTION_SCHEMA} from '../bzr-temporal/temporal-runtime.js';
import {authorizeBaziFullProductionPublication} from '../bzr-full-production/bazi-production-gate-runtime.js';
function json(payload,status=200){return new Response(JSON.stringify(payload),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}})}
function fail(code,status=422){const e=new Error(code);e.code=code;e.status=status;throw e;}
export async function buildBaziFullReading(body){
 if(body?.schemaVersion!=='PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0')fail('BAZI_FP_W16_REQUEST_SCHEMA_INVALID',400);
 const canonicalProjection=body.canonicalProjection,temporalProjection=body.temporalProjection,locale=body.locale==='zh-Hans'?'zh-Hans':'en';
 if(canonicalProjection?.method?.publicMethodCode!=='BAZI_PROJECTION')fail('BAZI_FP_W16_CANONICAL_BAZI_PROJECTION_REQUIRED',400);
 if(temporalProjection?.schemaVersion!==BZR_TEMPORAL_PROJECTION_SCHEMA)fail('BAZI_FP_W16_TEMPORAL_PROJECTION_REQUIRED',400);
 if(temporalProjection.sourceNatalProjectionId!==canonicalProjection.projectionId)fail('BAZI_FP_W16_NATAL_TEMPORAL_LINEAGE_MISMATCH',409);
 const chart=await buildCanonicalBaziChartIR({canonicalProjection});
 const strengthSeasonal=await analyzeBaziStrengthSeasonal({chart});
 const relationships=await analyzeBaziRelationships({chart});
 const tenGods=await analyzeBaziTenGods({chart});
 const patterns=await analyzeBaziPatternCandidates({chart,tenGods,relationships});
 const usefulGodTiaohou=await analyzeBaziUsefulGodTiaohouViews({chart,strengthSeasonal,patterns});
 const daYunStructural=await buildBaziDaYunStructuralIR({chart,canonicalProjection});
 const liuNianInteraction=await buildBaziLiuNianInteractionIR({chart,daYunStructural,temporalProjection});
 const structuralFindings=await buildBaziStructuralFindingRegistry({chart,strengthSeasonal,relationships,tenGods,patterns,usefulGodTiaohou,daYunStructural,liuNianInteraction});
 const evidenceGraph=await buildBaziInterpretationEvidenceGraph({structuralFindings});
 const composition=await buildBaziCrossFindingComposition({structuralFindings,evidenceGraph});
 const contradictionResolution=await resolveBaziContradictions({composition,structuralFindings,evidenceGraph});
 const dedup=await buildBaziSemanticDedupIR({composition,contradictionResolution});
 const readingIR=await buildBaziReadingIR({chart,strengthSeasonal,relationships,tenGods,patterns,usefulGodTiaohou,daYunStructural,liuNianInteraction,structuralFindings,evidenceGraph,composition,contradictionResolution,dedup,locale});
 const report=await composeBaziCustomerReport({readingIR,locale});
 const publicationDecision=authorizeBaziFullProductionPublication({readingIR,report});
 return {readingIR,report,publicationDecision,diagnostics:{findingCount:structuralFindings.summary.findingCount,graphNodeCount:evidenceGraph.summary.nodeCount,compositionUnitCount:composition.summary.compositionUnitCount,semanticClusterCount:dedup.summary.semanticClusterCount,reportSectionCount:report.sections.length}};
}
export async function onRequestPost({request}){let body;try{body=await request.json()}catch{return json({ok:false,error:'INVALID_JSON'},400)}try{const result=await buildBaziFullReading(body);return json({ok:true,capabilityAvailability:'AVAILABLE',...result},200)}catch(error){return json({ok:false,error:error?.code||'BAZI_FP_W16_FAILED_CLOSED'},error?.status||422)}}
export async function onRequestGet(){return json({ok:false,error:'BAZI_FP_W16_POST_ONLY'},405)}
