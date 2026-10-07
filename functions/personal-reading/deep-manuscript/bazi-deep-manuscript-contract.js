// Independent BaZi manuscript lane. No legacy composer or semantic judge imports.
export const VERSION='BAZI-DEEP-MANUSCRIPT-R2-1';
export const VERSIONS=Object.freeze({authority:'BDM-AUTHORITY-1',batch:'BDM-BATCH-2',prompt:'BDM-PROMPT-2',schema:'BDM-SCHEMA-1',checkpoint:'BDM-CHECKPOINT-1',compiler:'BDM-PUBLICATION-3',diagram:'BDM-DIAGRAM-3',pagePlan:'BDM-PAGES-3',renderer:'BDM-RENDERER-3',printShell:'PHI-OS-REPORT-PRINT-SHELL-V2'});
export const LOCALES=Object.freeze(['zh-Hans','en']);
export const FIELD=Object.freeze({'zh-Hans':'zhHansManuscript',en:'enManuscript'});
export const SECTIONS=Object.freeze([
 ['S02','核心性格与能力','Core Character and Capability'],['S03','人生结构与运行方式','Life Structure and Operating Patterns'],['S04','事业发展与职业方向','Career Development and Direction'],['S05','资源与财富','Resources and Wealth'],['S06','关系与亲密模式','Relationships and Intimacy'],['S07','家庭与支持系统','Family and Support'],['S08','压力与脆弱点','Pressure and Vulnerability'],['S09','长期周期与转折模式','Long-Term Cycles and Turning Points'],['S10','当前时序','Current Timing']
].map(([sectionId,zh,en])=>Object.freeze({sectionId,zh,en})));
export const BATCHES=Object.freeze([['B01',['S02','S03','S04']],['B02',['S05','S06','S07']],['B03',['S08','S09','S10']]].map(([batchId,sectionIds])=>Object.freeze({batchId,sectionIds:Object.freeze(sectionIds)})));
export const POLICY=Object.freeze({normalCalls:3,maxStandardRecoveryCalls:2,deliveryRescue:true,paidDeliveryGuarantee:true,productionHumanReview:false,semanticVerifierCalls:0,semanticReviewCalls:0,editorialRewriteCalls:0,transportRetryLimit:2,backoffMs:[2000,10000,30000],normalCostTarget:null,standardRecoveryWarning:null,highCostDeliveryThreshold:null});
export const unitKey=(s,l)=>`${s}/${l}`;
export const ALL_UNITS=Object.freeze(SECTIONS.flatMap(s=>LOCALES.map(locale=>({sectionId:s.sectionId,locale}))));
export function assertUnits(units){
 if(!Array.isArray(units)||!units.length||new Set(units.map(u=>unitKey(u.sectionId,u.locale))).size!==units.length||units.some(u=>!SECTIONS.some(s=>s.sectionId===u.sectionId)||!LOCALES.includes(u.locale)))throw Error('BDM_INVALID_UNIT_SCOPE');
}
export function stable(value){if(Array.isArray(value))return '['+value.map(stable).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).filter(k=>value[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';return JSON.stringify(value);}
export async function digest(value){const bytes=new TextEncoder().encode(stable(value));const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function deepFreeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(deepFreeze);Object.freeze(value);}return value;}
