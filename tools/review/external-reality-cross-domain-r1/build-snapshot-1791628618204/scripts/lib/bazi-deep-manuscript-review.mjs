import {measureBaziHistoricalDepth} from './bazi-deep-manuscript-depth.mjs';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {projectBaziDeepManuscriptAuthority} from '../../functions/personal-reading/deep-manuscript/bazi-deep-manuscript-authority-pack.js';
export const ROOT='docs/acceptance/bazi-paid-report/deep-manuscript-r2/';
export const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
export const write=(p,value)=>{fs.mkdirSync(p.slice(0,p.lastIndexOf('/')),{recursive:true});fs.writeFileSync(p,JSON.stringify(value,null,2)+'\n');};
export const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export async function loadBaziReviewAuthority(){
 const authorityPath='docs/acceptance/bazi-paid-report/editorial/GEN-01-AUTHORITY-PACK-R2.json',timingPath='docs/acceptance/bazi-paid-report/full-report-c1/TIMING-AUTHORITY.json';
 return projectBaziDeepManuscriptAuthority({authority:read(authorityPath),timing:read(timingPath),subject:{subjectId:'BDM-REFERENCE-GENG',displayName:null,birthDate:null,birthTime:null,timeAccuracy:'UNKNOWN'},sourceLineage:{authority:{path:authorityPath,sha256:sha(authorityPath)},timing:{path:timingPath,sha256:sha(timingPath)},methodVersion:'BAZI-FINAL-STRUCTURAL-VERDICT-R2',reality:'NOT_SUPPLIED'}});
}
export function loadBaziPlanningConfig(){const policy=read('config/reports/bazi-deep-manuscript-r2/policy.json');return {policy,model:read(policy.modelManifestPath),history:measureBaziHistoricalDepth()};}
export const htmlEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function reviewHtml(title,body){return `<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${htmlEscape(title)}</title><style>body{margin:0;background:#182620;color:#ede7d7;font:17px/1.8 'Microsoft YaHei',sans-serif}main{max-width:1120px;margin:auto;padding:40px}h1,h2{color:#d1b375}table{width:100%;border-collapse:collapse}td,th{border:1px solid #566253;padding:12px;text-align:left}pre{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#d1b375}.review-only{padding:28px;background:#182620;color:#ede7d7}.warning{border-left:3px solid #d1b375;padding:15px}article{margin:25px 0;border-top:1px solid #566253;padding-top:15px}</style><main>${body}</main></html>`;}
