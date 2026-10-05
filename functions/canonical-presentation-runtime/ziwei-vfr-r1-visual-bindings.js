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
const sectionArt=Object.freeze({
 S02:'VIS-REPORT-ZIWEI-SEC-01-PALACE-ARCHITECTURE',
 S03:'VIS-REPORT-ZIWEI-SEC-02-PATTERN-RESOURCES',
 S04:'VIS-REPORT-ZIWEI-SEC-06-CAREER-SOCIAL',
 S05:'VIS-REPORT-ZIWEI-SEC-07-RESOURCES-WEALTH',
 S06:'VIS-REPORT-ZIWEI-SEC-04-RELATIONSHIP-PARTNERSHIP',
 S07:'VIS-REPORT-ZIWEI-SEC-05-FAMILY-CLOSE-RELATIONSHIPS',
 S08:'VIS-REPORT-ZIWEI-SEC-03-SELF-DEVELOPMENT',
 S09:'VIS-REPORT-ZIWEI-SEC-09-TIMING-NAVIGATION',
 S10:'VIS-REPORT-ZIWEI-SEC-08-MOVEMENT-ENVIRONMENT',
 S11:'VIS-REPORT-ZIWEI-SEC-10-EVIDENCE-BOUNDARY'
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
 const motifCode=sectionId&&['S03','S05','S07','S09','S11'].includes(sectionId)?'VIS-REPORT-ZIWEI-MOTIF-2':'VIS-REPORT-ZIWEI-MOTIF-1';
 if(pageNumber===47)return Object.freeze({
  kind:'CLOSING',
  hero:urlFor('VIS-REPORT-ZIWEI-SEC-10-EVIDENCE-BOUNDARY'),
  body:urlFor('VIS-REPORT-ZIWEI-BODY'),
  motif:urlFor('VIS-REPORT-ZIWEI-MOTIF-2')
 });
 return Object.freeze({
  kind:pageFamily==='SECTION_MASTER'||pageFamily==='SECTION_MASTER_SUMMARY'?'SECTION_MASTER':'BODY',
  hero:sectionId?urlFor(sectionArt[sectionId]):null,
  body:urlFor('VIS-REPORT-ZIWEI-BODY'),
  motif:urlFor(motifCode),
  placement:'hero-bottom',
  objectPosition:'50% 55%'
 });
}
export const ZWR_VFR_FRONT_MATTER=frontMatter;
export const ZWR_VFR_SECTION_ART=sectionArt;
export default Object.freeze({getZwrVfrVisualBinding,ZWR_VFR_FRONT_MATTER,ZWR_VFR_SECTION_ART});
