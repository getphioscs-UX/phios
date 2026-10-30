import {VISUAL_REPORT_PRODUCTS} from './visual-report-registry.js';
import currentFixedManifest from '../../content/reports/shared/report-visual-assets-r2.json';
import {REPORT_EDITORIAL_VERIFICATION} from './report-editorial-verification.js';
export const REPORT_EDITORIAL_LOCALES=Object.freeze(['zh-Hans','en','bilingual']);
export const REPORT_EDITORIAL_ROLES=Object.freeze(['COVER','METHOD_INTRO','ORIGIN','PHIOS_LENS','HOW_TO_READ']);
const folders={BZR:'bazi',AST:'astrology',ZWR:'ziwei',NUM:'numerology',PROFILE:'profile',ECR:'ecr',HD:'human-design',CROSS:'cross'};
const keys={BZR:'BAZI',AST:'ASTROLOGY',ZWR:'ZIWEI',NUM:'NUM',PROFILE:'PROFILE',ECR:'ECR',HD:'HD',CROSS:'CROSS'};
export const REPORT_EDITORIAL_ASSETS=Object.freeze(VISUAL_REPORT_PRODUCTS.flatMap(p=>(['PROFILE','ECR'].includes(p.methodId)?['bilingual']:REPORT_EDITORIAL_LOCALES).flatMap(locale=>REPORT_EDITORIAL_ROLES.map((role,i)=>Object.freeze({
 asset_code:`RPT-${keys[p.methodId]}-P0${i+1}-${role.replaceAll('_','-')}-${locale}-v1`,methodId:p.methodId,locale,page:i+1,pageRole:role,
 object_key:`images/reports/${folders[p.methodId]}/editorial/${locale}/RPT-${keys[p.methodId]}-P0${i+1}-${role.replaceAll('_','-')}-v1.webp`,
 version:'1',format:'webp',mime:'image/webp',targetWidth:2480,targetHeight:3508,width:null,height:null,active:false,verification:'unverified',
 semanticAuthority:false,customerSpecific:false,reportStaticEditorial:true,humanReview:'USER_APPROVED_2026_09_20',authorityRef:p.authority,
 ...REPORT_EDITORIAL_VERIFICATION[`${p.methodId}:${locale}:${i+1}`],
 ...((()=>{if(!['PROFILE','ECR'].includes(p.methodId))return {};const a=currentFixedManifest.assets.find(a=>a.methodId===p.methodId&&a.pageId==='P0'+(i+1)&&a.language==='bilingual');return a?{object_key:a.objectKey,active:a.active,verification:a.active?'verified-http-200':'unverified',width:a.width,height:a.height,version:a.version,fixedAssetLanguage:'bilingual',humanReview:a.approval}:{};})())
})))));
export function editorialAsset(methodId,page,locale){return REPORT_EDITORIAL_ASSETS.find(x=>x.methodId===methodId&&x.page===page&&x.locale===locale)||null;}

// R6.11B explicit contents evidence stays separate from the five front-page roles.
// All six exact keys now have actual GET200 + decoded byte identities. No -v1 suffix was appended.
export const REPORT_CONTENTS_ASSETS=Object.freeze([
 {
  "methodId": "ZWR",
  "locale": "bilingual",
  "page": 6,
  "pageRole": "SEMIFIXED_CONTENTS",
  "asset_code": "RPT-ZIWEI-P06-CONTENT",
  "object_key": "images/reports/ziwei/editorial/bilingual/RPT-ZIWEI-P06-CONTENT.webp",
  "bucket": "phios-public-assets",
  "ownerEvidence": "OWNER_R611B_SCOPE_AND_ACTUAL_PUBLIC_GET_200",
  "sha256": "e20165dfd79ba879da0f14c53327b13de46604ffae5d2b47e29d5bafc78d95b7",
  "pixelSHA256": "f4daf04b5bbbb737f9c9cecb2246ee40d6f756b0744657d413bfed55ae3852f9",
  "width": 1122,
  "height": 1402,
  "bytes": 409794,
  "mime": "image/webp",
  "active": false,
  "verification": "CURRENT_BYTES_DECODED",
  "visualAcceptance": "PENDING_OWNER_WITH_DOCUMENTED_TITLE_ISSUES",
  "customerPublishable": false
 },
 {
  "methodId": "HD",
  "locale": "bilingual",
  "page": 6,
  "pageRole": "SEMIFIXED_CONTENTS",
  "asset_code": "RPT-HD-P06-CONTENT",
  "object_key": "images/reports/human-design/editorial/bilingual/RPT-HD-P06-CONTENT.webp",
  "bucket": "phios-public-assets",
  "ownerEvidence": "OWNER_R611B_SCOPE_AND_ACTUAL_PUBLIC_GET_200",
  "sha256": "d226a4fa4158e51f9b328caf62b89c4e23295d1ede2ec014688ee945b10ec083",
  "pixelSHA256": "d2920efff6e697daab718dc7bf67cf5ea3a4a358fa8827199de3b38d01d198fd",
  "width": 1024,
  "height": 1536,
  "bytes": 320412,
  "mime": "image/webp",
  "active": false,
  "verification": "CURRENT_BYTES_DECODED",
  "visualAcceptance": "PENDING_OWNER_WITH_DOCUMENTED_TITLE_ISSUES",
  "customerPublishable": false
 },
 {
  "methodId": "BZR",
  "locale": "bilingual",
  "page": 6,
  "pageRole": "SEMIFIXED_CONTENTS",
  "asset_code": "RPT-BAZI-P06-CONTENT",
  "object_key": "images/reports/bazi/editorial/bilingual/RPT-BAZI-P06-CONTENT.webp",
  "bucket": "phios-public-assets",
  "ownerEvidence": "OWNER_R611B_SCOPE_AND_ACTUAL_PUBLIC_GET_200",
  "sha256": "9ab82efc1756b34f810b12a82b542a5df835fb53000d1438c7c1fccc58f243d5",
  "pixelSHA256": "c90da0580113cd219484edfbac8f26937e7ee091436008afc93f7f34dacf2fbf",
  "width": 1055,
  "height": 1491,
  "bytes": 393880,
  "mime": "image/webp",
  "active": false,
  "verification": "CURRENT_BYTES_DECODED",
  "visualAcceptance": "PENDING_OWNER_WITH_DOCUMENTED_TITLE_ISSUES",
  "customerPublishable": false
 },
 {
  "methodId": "NUM",
  "locale": "bilingual",
  "page": 6,
  "pageRole": "SEMIFIXED_CONTENTS",
  "asset_code": "RPT-NUM-P06-CONTENT",
  "object_key": "images/reports/numerology/editorial/bilingual/RPT-NUM-P06-CONTENT.webp",
  "bucket": "phios-public-assets",
  "ownerEvidence": "USER_20261030_P06_CORRECT_BIND_WITHOUT_CONTENT_REVIEW",
  "sha256": "23f46aed1cfde3ff8b2e9d9f3b4b6e28dc43d5809f7af8f267b10a0d7e572a54",
  "pixelSHA256": "a82edb958622b271573459b9cd36e0dd63efcf67a6ea3df58e566db5becae29b",
  "width": 1024,
  "height": 1536,
  "bytes": 405850,
  "mime": "image/webp",
  "active": true,
  "verification": "CURRENT_BYTES_DECODED",
  "visualAcceptance": "OWNER_CONFIRMED_CONTENT_20261030",
  "customerPublishable": false
 },
 {
  "methodId": "AST",
  "locale": "bilingual",
  "page": 6,
  "pageRole": "SEMIFIXED_CONTENTS",
  "asset_code": "RPT-ASTROLOGY-P06-CONTENT",
  "object_key": "images/reports/astrology/editorial/bilingual/RPT-ASTROLOGY-P06-CONTENT.webp",
  "bucket": "phios-public-assets",
  "ownerEvidence": "OWNER_R611B_SCOPE_AND_ACTUAL_PUBLIC_GET_200",
  "sha256": "9ceef3a884c829da8087734f4f627366da9929809c9473cac9c7beb042048097",
  "pixelSHA256": "40eedd98b770e5d5432e661f82c84f16cec95f1cf1227dc4c4f8f7fa1803fa85",
  "width": 1024,
  "height": 1536,
  "bytes": 458058,
  "mime": "image/webp",
  "active": false,
  "verification": "CURRENT_BYTES_DECODED",
  "visualAcceptance": "PENDING_OWNER_WITH_DOCUMENTED_TITLE_ISSUES",
  "customerPublishable": false
 },
 {
  "methodId": "ECR",
  "locale": "bilingual",
  "page": 6,
  "pageRole": "SEMIFIXED_CONTENTS",
  "asset_code": "RPT-ECR-P06-CONTENT",
  "object_key": "images/reports/ecr/editorial/bilingual/RPT-ECR-P06-CONTENT.webp",
  "bucket": "phios-public-assets",
  "ownerEvidence": "OWNER_R611B_SCOPE_AND_ACTUAL_PUBLIC_GET_200",
  "sha256": "446724d48de3f0d16626a5ae1d9c53fea71833acbffe896eee9926b1b10f206e",
  "pixelSHA256": "199a485d4479c5524e51a0a0704dd0f9987e8db185588bbb19b057461acb249e",
  "width": 1055,
  "height": 1491,
  "bytes": 375050,
  "mime": "image/webp",
  "active": false,
  "verification": "CURRENT_BYTES_DECODED",
  "visualAcceptance": "PENDING_OWNER_WITH_DOCUMENTED_TITLE_ISSUES",
  "customerPublishable": false
 }
].map(Object.freeze));
export function reportContentsAsset(methodId){return REPORT_CONTENTS_ASSETS.find(a=>a.methodId===methodId)||null;}
