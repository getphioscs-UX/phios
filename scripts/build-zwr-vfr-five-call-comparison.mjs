import fs from 'node:fs';

const root='docs/reports/ziwei/vfr-r1';
const onePath=root+'/LIVE-RESULT.json';
const fivePath=root+'/five-call-experiment/RESULT.json';
if(!fs.existsSync(onePath)||!fs.existsSync(fivePath))throw Error('ZWR_FIVE_CALL_COMPARISON_INPUT_REQUIRED');

const one=JSON.parse(fs.readFileSync(onePath,'utf8'));
const five=JSON.parse(fs.readFileSync(fivePath,'utf8'));
const chars=x=>JSON.stringify(x||'').length;
const wc=s=>String(s||'').trim().split(/\s+/).filter(Boolean).length;
const zhChars=s=>[...String(s||'')].filter(ch=>/\p{Script=Han}/u.test(ch)).length;

const rows=five.sections.map(s=>{
 const a=one.reportIr.sections.find(x=>x.sectionId===s.sectionId);
 const raw=five.rawManuscriptSections.find(x=>x.sectionId===s.sectionId);
 return {
  sectionId:s.sectionId,
  oneCallZhChars:chars(a?.zhHans),
  fiveCallZhChars:chars(raw?.zhHans),
  oneCallEnWords:wc(JSON.stringify(a?.en)),
  fiveCallEnWords:wc(JSON.stringify(raw?.en)),
  fiveCallLivedScenariosZh:raw?.zhHans?.livedScenarios?.length||0,
  fiveCallLivedScenariosEn:raw?.en?.livedScenarios?.length||0,
  fiveCallStructuralParagraphsZh:raw?.zhHans?.structuralMechanism?.length||0,
  fiveCallStructuralParagraphsEn:raw?.en?.structuralMechanism?.length||0
 };
});
const summary={
 schemaVersion:'ZWR-VFR-R1-FIVE-CALL-COMPARISON-v1',
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

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cards=five.sections.map(s=>{
 const raw=five.rawManuscriptSections.find(x=>x.sectionId===s.sectionId);
 const old=one.reportIr.sections.find(x=>x.sectionId===s.sectionId);
 const block=(title,x)=>'<section><h3>'+title+'</h3><p><b>Thesis:</b> '+esc(x?.sectionThesis||'')+'</p><h4>Structural mechanism</h4>'+(x?.structuralMechanism||[]).map(p=>'<p>'+esc(p)+'</p>').join('')+'<h4>Lived scenarios</h4><ol>'+(x?.livedScenarios||[]).map(p=>'<li>'+esc(p)+'</li>').join('')+'</ol><h4>Constructive expression</h4>'+(x?.constructiveExpression||[]).map(p=>'<p>'+esc(p)+'</p>').join('')+'<h4>Pressure distortion</h4>'+(x?.pressureDistortion||[]).map(p=>'<p>'+esc(p)+'</p>').join('')+'<h4>Counterweight</h4>'+(x?.counterweight||[]).map(p=>'<p>'+esc(p)+'</p>').join('')+'<h4>Timing overlay</h4>'+(x?.timingOverlay||[]).map(p=>'<p>'+esc(p)+'</p>').join('')+'<h4>Reality navigation</h4>'+(x?.realityNavigation||[]).map(p=>'<p>'+esc(p)+'</p>').join('');
 return '<article class="cmp"><h2>'+esc(s.sectionId)+'</h2><div class="old"><h3>ONE-CALL CURRENT</h3><p>'+esc((old?.zhHans?.interpretation||[]).join(' '))+'</p><p>'+esc((old?.en?.interpretation||[]).join(' '))+'</p></div><div class="new">'+block('FIVE-CALL 中文',raw?.zhHans)+block('FIVE-CALL English',raw?.en)+'</div></article>';
}).join('');

const html='<!doctype html><html><meta charset="utf-8"><title>Zi Wei VFR · One vs Five Call</title><style>body{font:15px/1.65 system-ui;margin:24px;background:#ece8df;color:#282d29}.hero,.cmp{max-width:1200px;margin:0 auto 28px;background:#fff;padding:24px;border:1px solid #c9b98e}.cmp{display:grid;grid-template-columns:1fr 1.7fr;gap:24px}.cmp>h2{grid-column:1/-1}.old{background:#f2eee5;padding:18px}.new{background:#faf7ef;padding:18px}.new section{border-bottom:1px solid #ddd0ad;padding-bottom:18px;margin-bottom:18px}h3,h4{color:#76599f}@media(max-width:800px){.cmp{grid-template-columns:1fr}}</style><div class="hero"><h1>Zi Wei VFR · ONE-CALL vs FIVE-CALL</h1><p>One-call cost: $'+summary.oneCall.estimatedProviderCost+' · Five-call cost: $'+summary.fiveCall.estimatedProviderCost+'</p><p>此页面只用于验证“并发章节数量是否造成语义变薄”，不代表 production admission。</p></div>'+cards+'</html>';
fs.mkdirSync('tools/review',{recursive:true});
fs.writeFileSync('tools/review/ZWR-VFR-FIVE-CALL-COMPARISON.html',html);
console.log('PASS built ZWR-VFR-FIVE-CALL-COMPARISON.html; sections=10; oneCallCost=$'+summary.oneCall.estimatedProviderCost+'; fiveCallCost=$'+summary.fiveCall.estimatedProviderCost+'.');
