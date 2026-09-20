import {VISUAL_REPORT_PRODUCTS} from './visual-report-registry.js';
export const REPORT_EDITORIAL_LOCALES=Object.freeze(['zh-Hans','en','bilingual']);
export const REPORT_EDITORIAL_ROLES=Object.freeze(['COVER','METHOD_INTRO','ORIGIN','PHIOS_LENS','HOW_TO_READ']);
const folders={BZR:'bazi',AST:'astrology',ZWR:'ziwei',NUM:'numerology',PROFILE:'profile',ECR:'ecr',HD:'human-design',CROSS:'cross'};
const keys={BZR:'BAZI',AST:'ASTROLOGY',ZWR:'ZIWEI',NUM:'NUM',PROFILE:'PROFILE',ECR:'ECR',HD:'HD',CROSS:'CROSS'};
export const REPORT_EDITORIAL_ASSETS=Object.freeze(VISUAL_REPORT_PRODUCTS.flatMap(p=>REPORT_EDITORIAL_LOCALES.flatMap(locale=>REPORT_EDITORIAL_ROLES.map((role,i)=>Object.freeze({
 asset_code:`RPT-${keys[p.methodId]}-P0${i+1}-${role.replaceAll('_','-')}-${locale}-v1`,methodId:p.methodId,locale,page:i+1,pageRole:role,
 object_key:`images/reports/${folders[p.methodId]}/editorial/${locale}/RPT-${keys[p.methodId]}-P0${i+1}-${role.replaceAll('_','-')}-v1.webp`,
 version:'1',format:'webp',mime:'image/webp',targetWidth:2480,targetHeight:3508,width:null,height:null,active:false,verification:'unverified',
 semanticAuthority:false,customerSpecific:false,reportStaticEditorial:true,humanReview:'PENDING',authorityRef:p.authority
})))));
export function editorialAsset(methodId,page,locale){return REPORT_EDITORIAL_ASSETS.find(x=>x.methodId===methodId&&x.page===page&&x.locale===locale)||null;}
