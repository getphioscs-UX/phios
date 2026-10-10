import {PublicAssetResolutionError,isAssetVerificationRenderable,resolvePublicAsset} from '../../assets/js/runtime/web-production/asset-resolver.js';

export function resolveReportEditorialAsset({registry,methodId,page,locale,publicBaseUrl}={}){
 const asset=registry?.assets?.find(x=>x.reportStaticEditorial===true&&x.methodId===methodId&&x.page===page&&x.locale===locale);
 if(!asset||asset.active!==true||!isAssetVerificationRenderable(asset.verification))throw new PublicAssetResolutionError('STATIC_EDITORIAL_ASSET_MISSING','Required report editorial asset is unavailable.',{methodId,page,locale,objectKey:asset?.object_key||null});
 return resolvePublicAsset({registry,assetCode:asset.asset_code,publicBaseUrl,locale,surface:'REPORT'});
}
