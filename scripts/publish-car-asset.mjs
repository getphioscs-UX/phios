import { parseArgs, publishProductionAsset } from './lib/car-production/car-production-v1.mjs';
const { positional, options }=parseArgs(process.argv.slice(2)); const candidateCode=positional[0];
if(!candidateCode) throw new Error('USAGE: npm run car:publish-asset -- <CANDIDATE> [--surface WEBSITE]');
const publication=await publishProductionAsset({candidateCode,surface:options.surface||'WEBSITE'});
console.log(JSON.stringify({status:'PUBLISHED_ASSET_RECORDED',publishedAssetCode:publication.publishedAssetCode,assetCode:publication.assetCode,mediaCode:publication.mediaCode,publicSrc:publication.publicSrc,publicationDigest:publication.publicationDigest},null,2));
