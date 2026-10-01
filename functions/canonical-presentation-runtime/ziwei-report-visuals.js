import {resolvePublicAsset} from '../../assets/js/runtime/web-production/asset-resolver.js';
import {ZIWEI_REPORT_VISUAL_REGISTRY as registry} from './ziwei-report-visual-registry.generated.js';
export {registry as ZIWEI_REPORT_VISUAL_REGISTRY};
export function resolveZiweiReportAsset(assetCode){
 const a=registry.assets.find(a=>a.asset_code===assetCode);if(!a||!a.active)throw Error('ZIWEI_STATIC_ASSET_UNREGISTERED');
 if(a.delivery==='LOCAL_CANONICAL')return {assetCode,src:'/'+a.localPath,renderable:true,sourceReference:'content/reports/ziwei/visual-registry-r2.json'};
 const resolved=resolvePublicAsset({registry,assetCode,publicBaseUrl:registry.public_base_url,surface:'REPORT'});
 if(!resolved.renderable)throw Error('ZIWEI_STATIC_ASSET_NOT_VERIFIED');return {...resolved,sourceReference:'content/reports/ziwei/visual-registry-r2.json'};
}
export function bindZiweiReportVisual({sectionId,pageNumber,isMaster}){
 const row=registry.sections[sectionId];if(!row)throw Error('ZIWEI_VISUAL_SECTION_UNREGISTERED');
 const motifKey=isMaster?row.motifCode:registry.motifAssetCodes[pageNumber%2];
 return {assetKey:row.assetCode,url:resolveZiweiReportAsset(row.assetCode).src,bodyUrl:resolveZiweiReportAsset(registry.bodyAssetCode).src,motifUrl:resolveZiweiReportAsset(motifKey).src,motifKey,objectPosition:row.objectPosition,candidates:[resolveZiweiReportAsset(row.assetCode).src],required:true,suppressSyntheticMotif:true,intensityByFamily:{SECTION_OPENER_PAGE:.42,NARRATIVE_ANALYSIS_PAGE:.12,METHOD_APPENDIX_PAGE:.1},opacityByLayer:{body:isMaster?.13:.12,motif:isMaster?.16:.09,hero:.42},placement:row.placement,registryRef:'content/reports/ziwei/visual-registry-r2.json',owner:'ZIWEI_REPORT_VISUAL_R2'};
}
