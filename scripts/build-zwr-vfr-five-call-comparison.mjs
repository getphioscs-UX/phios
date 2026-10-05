import fs from 'node:fs';

const root='docs/reports/ziwei/vfr-r1';
const onePath=root+'/LIVE-RESULT.json';
const fivePath=root+'/five-call-experiment/RESULT.json';
if(!fs.existsSync(onePath)||!fs.existsSync(fivePath))throw Error('ZWR_FIVE_CALL_COMPARISON_INPUT_REQUIRED');

const one=JSON.parse(fs.readFileSync(onePath,'utf8'));
const five=JSON.parse(fs.readFileSync(fivePath,'utf8'));
const wc=s=>String(s||'').trim().split(/\s+/).filter(Boolean).length;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const rows=five.rawManuscriptSections.map(s=>{
 const old=one.reportIr.sections.find(x=>x.sectionId===s.sectionId);
 return {
  sectionId:s.sectionId,
  oneCallZhChars:JSON.stringify(old?.zhHans||'').length,
  fiveCallZhChars:String(s.zhHansManuscript||'').length,
  oneCallEnWords:wc(JSON.stringify(old?.en||'')),
  fiveCallEnWords:wc(s.enManuscript)
 };
});

const summary={
 schemaVersion:'ZWR-VFR-R1-FIVE-CALL-COMPARISON-v2',
 hypothesis:'Does reducing Sol from 10 bilingual sections per call to 2 bilingual sections per call materially improve long-form editorial depth?',
 oneCall:{
  providerCalls:one.providerCalls,
  estimatedProviderCost:one.reportIr?.providerUsage?.estimatedProviderCost,
  inputTokens:one.reportIr?.providerUsage?.inputTokens,
  outputTokens:one.reportIr?.providerUsage?.outputTokens
 },
 fiveCall:{
  providerCalls:five.providerUsage.providerCalls,
  estimatedProviderCost:five.providerUsage.estimatedProviderCost,
  inputTokens:five.providerUsage.inputTokens,
  outputTokens:five.providerUsage.outputTokens
 },
 sections:rows
};
fs.writeFileSync(root+'/five-call-experiment/COMPARISON.json',JSON.stringify(summary,null,2)+'\n');

const cards=five.rawManuscriptSections.map(s=>{
 const old=one.reportIr.sections.find(x=>x.sectionId===s.sectionId);
 const oldZh=(old?.zhHans?.interpretation||[]).join('\n\n');
 const oldEn=(old?.en?.interpretation||[]).join('\n\n');
 return '<article class="cmp">'+
  '<h2>'+esc(s.sectionId)+'</h2>'+
  '<section class="old"><h3>ONE-CALL CURRENT · 中文</h3><p>'+esc(oldZh)+'</p><h3>ONE-CALL CURRENT · English</h3><p>'+esc(oldEn)+'</p></section>'+
  '<section class="new"><h3>FIVE-CALL DEEP · 中文</h3>'+String(s.zhHansManuscript||'').split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+esc(p)+'</p>').join('')+
  '<h3>FIVE-CALL DEEP · English</h3>'+String(s.enManuscript||'').split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+esc(p)+'</p>').join('')+'</section>'+
  '<footer>ONE zh chars '+JSON.stringify(old?.zhHans||'').length+' → FIVE '+String(s.zhHansManuscript||'').length+
  ' · ONE en words '+wc(JSON.stringify(old?.en||''))+' → FIVE '+wc(s.enManuscript)+'</footer>'+
 '</article>';
}).join('');

const html='<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><title>Zi Wei VFR · One vs Five Call</title><style>'+
'body{font:15px/1.75 system-ui,"Microsoft YaHei",sans-serif;margin:0;padding:28px;background:linear-gradient(135deg,#241b36,#133243);color:#282d29}'+
'.hero,.cmp{max-width:1240px;margin:0 auto 28px;background:#fffaf0;padding:28px;border-radius:18px;box-shadow:0 18px 48px #0004}'+
'.hero{background:linear-gradient(135deg,#f4e7c8,#e8ddff)}.cmp{display:grid;grid-template-columns:1fr 1.7fr;gap:24px}.cmp>h2,.cmp>footer{grid-column:1/-1}'+
'.old{background:#eee9df;padding:20px;border-radius:14px}.new{background:linear-gradient(145deg,#faf5e8,#f0e9ff);padding:22px;border-radius:14px;border:1px solid #9675c566}'+
'h2{color:#64459c}h3{color:#76599f}.new p{margin:0 0 16px}.old p{white-space:pre-line}.cmp footer{font-size:12px;color:#6c685f;border-top:1px solid #d8c9a6;padding-top:12px}'+
'@media(max-width:850px){.cmp{grid-template-columns:1fr}}</style>'+
'<section class="hero"><h1>Zi Wei VFR · ONE-CALL vs FIVE-CALL DEEP MANUSCRIPT</h1>'+
'<p>验证变量：同一个 Sol、同一个 Authority Pack、同样双语；只改变每次承担的章节数量与写作形式。</p>'+
'<p>One-call cost: $'+summary.oneCall.estimatedProviderCost+' · Five-call cost: $'+summary.fiveCall.estimatedProviderCost+'</p>'+
'<p>此页面只用于内容质量 A/B，不代表 production cutover。</p></section>'+cards+'</html>';

fs.mkdirSync('tools/review',{recursive:true});
fs.writeFileSync('tools/review/ZWR-VFR-FIVE-CALL-COMPARISON.html',html);
console.log('PASS built ZWR-VFR-FIVE-CALL-COMPARISON.html; sections=10; oneCallCost=$'+summary.oneCall.estimatedProviderCost+'; fiveCallCost=$'+summary.fiveCall.estimatedProviderCost+'.');
