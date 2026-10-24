import fs from 'node:fs';import crypto from 'node:crypto';
const root='tools/review/financial-publication-merged',out=root+'/asset-reuse-r4';if(fs.existsSync(out+'/MASTER-before.html'))throw Error('CORRECTION_ALREADY_APPLIED_DO_NOT_OVERWRITE_HISTORY');fs.mkdirSync(out,{recursive:true});const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const master=root+'/MASTER-HUMAN-REVIEW.html';fs.copyFileSync(master,out+'/MASTER-before.html');
const renderer='functions/financial/holistic-planning-product/publication-merged-renderer.js';let code=fs.readFileSync(renderer,'utf8');fs.writeFileSync(out+'/renderer-before.txt',code);
code="import {assertApprovedMethodAsset,coverFields} from './publication-fixed-asset-reuse.js';\n"+code;
code=code.replace(" if(p.displayName!=='TEST_ONLY'"," assertApprovedMethodAsset();\n if(p.displayName!=='TEST_ONLY'");
let a=code.indexOf(' const core=contract.pages.map(s=>'),b=code.indexOf('\n if(s.page===22)',a);
code=code.slice(0,a)+` const core=contract.pages.map(s=>{if(s.page<6)return sheet(s,s.page===1?coverFields({name:p.displayName,reportDate:p.asOfDate,savedVersion:String(p.source.version)}):'');\n if(s.page===21)throw Error('P21_APPROVED_EMPTY_SLOT_SOURCE_REQUIRED');`+code.slice(b);
fs.writeFileSync(renderer,code);
fs.writeFileSync('functions/financial/holistic-planning-product/publication-fixed-asset-reuse.js',`// Fail closed until an approved empty-slot source and slot map are provided. No replacement poster.
export const FIXED_ASSET_POLICY=Object.freeze({mode:'EXACT_R2_IMAGE_WITH_ALLOWED_OVERLAYS',p03:'FROZEN_APPROVED',nativeR4:'HISTORICAL_ONLY',p21:'BLOCKED_APPROVED_EMPTY_SLOT_SOURCE_REQUIRED'});
export function assertApprovedMethodAsset(){throw Error('P21_APPROVED_EMPTY_SLOT_SOURCE_REQUIRED');}
const esc=v=>String(v).replace(/[&<>\x22']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\x22':'&quot;',"'":'&#39;'}[c]));
export function coverFields({name,reportDate,savedVersion}){
 if([name,reportDate,savedVersion].some(v=>typeof v!=='string'||!v.trim()))throw Error('COVER_REQUIRED_SAVED_FIELDS');
 return '<div class="cover-fields" style="position:absolute;top:61.4%;left:26%;right:6%;font:14px/1.7 sans-serif"><div>'+esc(name)+'</div><div>'+esc(reportDate)+'</div><div>'+esc(savedVersion)+'</div></div>';
}
`);
const assets=JSON.parse(fs.readFileSync(root+'/approved-assets.json','utf8').replace(/^\uFEFF/,''));const checks=assets.map((a,i)=>{const actual=sha(fs.readFileSync(a.path));if(actual!==a.sha256)throw Error('ASSET_CHANGED');return {page:[1,2,3,4,5,21,22,'BODY'][i],path:a.path,sha256:actual,exactApprovedBytes:true}});fs.writeFileSync(out+'/asset-byte-checks.json',JSON.stringify(checks,null,2));
const protectedFiles=Object.fromEntries(fs.readdirSync('output/pdf/financial-merged').filter(n=>n.endsWith('.pdf')).map(n=>{const p='output/pdf/financial-merged/'+n;return[p,sha(fs.readFileSync(p))]}));fs.writeFileSync(out+'/protected-before.json',JSON.stringify(protectedFiles,null,2));
let h=fs.readFileSync(master,'utf8');h=h.replace('<h2>R4 · 固定出版页视觉＋原生文字候选</h2>','<h2>历史 R4 原生试样：已停止，不得用于正式报告</h2><p class="hold">本节及其原准入意见已被最新资产复用要求取代。P03 保留冻结批准版，P21 不使用本节重制稿。</p>');
h=h.replace(/(<(?:button|select|input|textarea)\b[^>]*\bid="r4-[^"]*"[^>]*)(>)/g,'$1 disabled$2');
h=h.replace('<main>',`<main><section id="asset-reuse-r4"><h2>当前 R4：正式 R2 原图复用＋限定动态字段</h2><p class="hold">P21 BLOCKED：没有批准的空槽位来源。新生成入口硬阻断；禁止遮盖示例或制作替代海报。Provider 0；未标记 Production PASS。</p><p>P01 原图仅填写姓名、报告日期、保存版本；P02–P05 不重排。P03 使用冻结 SHA a80fa756…，同名新对象待人工确认。P22 保留原图与实际附录 checkbox、状态、页码。动态正文和计算未改。</p><p><a href="asset-reuse-r4/asset-preview.html">原图与限定字段核验</a> · <a href="asset-reuse-r4/asset-byte-checks.json">实际 SHA256</a> · <a href="asset-reuse-r4/RESULTS.json">验证结果与阻断</a></p><p>六页原生试样只保留为历史。37／37／22／80／22 候选保留。指定附件在桌面、下载、附件目录未找到；本次依据用户明确消息执行，附件全文验收仍未完成。</p></section>`);fs.writeFileSync(master,h);
console.log('Asset reuse correction written; prior master and renderer archived.');
