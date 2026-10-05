import {ZIWEI_REPORT_VISUAL_REGISTRY} from './ziwei-report-visual-registry.generated.js';

const base=ZIWEI_REPORT_VISUAL_REGISTRY.public_base_url;
const assetByCode=new Map((ZIWEI_REPORT_VISUAL_REGISTRY.assets||[]).map(a=>[a.asset_code,a]));

const frontMatter=Object.freeze({
  1:base+'/images/reports/ziwei/editorial/bilingual/RPT-ZIWEI-P01-COVER-v1.webp',
  2:base+'/images/reports/ziwei/editorial/bilingual/RPT-ZIWEI-P02-METHOD-INTRO-v1.webp',
  3:base+'/images/reports/ziwei/editorial/bilingual/RPT-ZIWEI-P03-ORIGIN-v1.webp',
  4:base+'/images/reports/ziwei/editorial/bilingual/RPT-ZIWEI-P04-PHIOS-LENS-v1.webp',
  5:base+'/images/reports/ziwei/editorial/bilingual/RPT-ZIWEI-P05-HOW-TO-READ-v1.webp'
});

function urlFor(code){
 const a=assetByCode.get(code);
 if(!a)return null;
 if(a.object_key)return base+'/'+a.object_key;
 if(a.localPath)return '../../'+a.localPath;
 return null;
}
export function getZwrVfrVisualBinding({pageNumber,sectionId,pageFamily}={}){
 if(frontMatter[pageNumber])return Object.freeze({kind:'STATIC_FRONT_MATTER',url:frontMatter[pageNumber]});
 if(pageNumber===47)return Object.freeze({kind:'CLOSING',hero:urlFor('VIS-REPORT-ZIWEI-SEC-10-EVIDENCE-BOUNDARY'),body:urlFor('VIS-REPORT-ZIWEI-BODY'),motif:urlFor('VIS-REPORT-ZIWEI-MOTIF-2')});
 const section=sectionId?ZIWEI_REPORT_VISUAL_REGISTRY.sections?.[sectionId]:null;
 return Object.freeze({
  kind:pageFamily==='SECTION_MASTER'||pageFamily==='SECTION_MASTER_SUMMARY'?'SECTION_MASTER':'BODY',
  hero:section?urlFor(section.assetCode):null,
  body:urlFor('VIS-REPORT-ZIWEI-BODY'),
  motif:section?urlFor(section.motifCode):urlFor('VIS-REPORT-ZIWEI-MOTIF-1'),
  placement:section?.placement||'hero-bottom',
  objectPosition:section?.objectPosition||'50% 55%'
 });
}
export const ZWR_VFR_FRONT_MATTER=frontMatter;
export default Object.freeze({getZwrVfrVisualBinding,ZWR_VFR_FRONT_MATTER});
