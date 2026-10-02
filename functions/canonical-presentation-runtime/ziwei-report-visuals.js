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
 const motifKey=isMaster?row.motifCode:registry.motifAssetCodes[pageNumber%2],hero=resolveZiweiReportAsset(row.assetCode).src;
 return {assetKey:row.assetCode,url:hero,bodyUrl:isMaster?null:resolveZiweiReportAsset(registry.bodyAssetCode).src,motifUrl:isMaster?null:resolveZiweiReportAsset(motifKey).src,motifKey,objectPosition:row.objectPosition,candidates:[hero],required:true,suppressSyntheticMotif:true,backgroundMode:isMaster?'SECTION_MASTER_FULL_BLEED':'READING_PAGE_DECORATION',intensityByFamily:{SECTION_OPENER_PAGE:1,NARRATIVE_ANALYSIS_PAGE:.12,METHOD_APPENDIX_PAGE:.1},opacityByLayer:{body:.12,motif:.09,hero:isMaster?1:.12},placement:row.placement,registryRef:'content/reports/ziwei/visual-registry-r2.json',owner:'ZIWEI_REPORT_VISUAL_R2'};
}
