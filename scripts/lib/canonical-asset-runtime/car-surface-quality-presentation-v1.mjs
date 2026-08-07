import crypto from 'node:crypto';
const digest=o=>crypto.createHash('sha256').update(JSON.stringify(o,Object.keys(o).sort())).digest('hex');
const stable=o=>JSON.parse(JSON.stringify(o));
export function buildSurfaceProjection({projectionCode,surface,locale,slots,sourceRecords,knowledgeReferences=[],meaningReferences=[],accessibilityData={}}){
 if(!Array.isArray(sourceRecords)||sourceRecords.length===0) throw new Error('CAR_SURFACE_PUBLISHED_ONLY_REQUIRED');
 for(const r of sourceRecords){if(r.publicationState!=='published') throw new Error('CAR_SURFACE_PUBLISHED_ONLY_REQUIRED'); if(r.surface!==surface) throw new Error('CAR_SURFACE_SOURCE_NOT_PUBLISHED_FOR_TARGET_SURFACE'); if(r.locale!==locale) throw new Error('CAR_SURFACE_LOCALE_MISMATCH');}
 const out={projectionCode,projectionVersion:'1.0.0',surface,locale,slots:[...slots].sort((a,b)=>a.slotCode.localeCompare(b.slotCode)),sourcePublications:[...new Set(sourceRecords.map(x=>x.publicationCode))].sort(),knowledgeReferences:[...new Set(knowledgeReferences)].sort(),meaningReferences:[...new Set(meaningReferences)].sort(),accessibilityData:stable(accessibilityData),projectionState:'validation_projection'}; out.projectionDigest=digest(out); return out;
}
export function evaluateQuality({evaluationCode,subjectCode,checks,lineage,evaluatedAt}){
 const failClosed=['meaningDrift','knowledgeDrift','fragmentDigestDrift','localeDrift','accessibility','rightsStatus','unsupportedClaim','crossAssetContamination']; const decision=failClosed.some(k=>checks[k]==='fail')?'fail':'pass'; const out={evaluationCode,evaluationVersion:'1.0.0',subjectCode,checks:stable(checks),lineage:stable(lineage),decision,evaluatedAt}; out.evaluationDigest=digest(out); return out;
}
export function buildPresentationProjection({presentationCode,presentationType,surfaceProjection,qualityEvaluation,publishedAssetReferences,pdsContractVersion,locale}){
 if(qualityEvaluation.decision!=='pass') throw new Error('CAR_PRESENTATION_QUALITY_GATE_FAILED'); if(surfaceProjection.locale!==locale) throw new Error('CAR_PRESENTATION_LOCALE_MISMATCH'); if(!publishedAssetReferences?.length) throw new Error('CAR_PRESENTATION_PUBLISHED_ASSET_REQUIRED'); const out={presentationCode,presentationVersion:'1.0.0',presentationType,surfaceProjectionCode:surfaceProjection.projectionCode,qualityEvaluationCode:qualityEvaluation.evaluationCode,publishedAssetReferences:[...new Set(publishedAssetReferences)].sort(),pdsContractVersion,locale,presentationState:'validation_projection'}; out.presentationDigest=digest(out); return out;
}
