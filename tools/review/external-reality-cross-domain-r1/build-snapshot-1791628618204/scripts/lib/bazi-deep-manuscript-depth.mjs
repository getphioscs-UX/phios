import fs from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const outputTokens=text=>{const cjk=(text.match(/[\u3400-\u9fff]/g)||[]).length;return Math.ceil(cjk*1.5+(text.length-cjk)/3);};
const normalize=s=>s.toLowerCase().replace(/[\s\p{P}]/gu,'');
const foundations={dayMaster:/日主|day master/iu,monthCommand:/月令|month command/iu,strength:/身弱|偏弱|承载|strength verdict|carrying/iu,natalRelations:/合冲|刑冲|六合|clash|natal relation/iu,support:/支持|印比|support|resource/iu};
export function measureBaziHistoricalDepth(){
 const paths={composition:'docs/acceptance/bazi-paid-report/composition-r1/baseline.json',vfr:'docs/acceptance/bazi-paid-report/visual-first-r2/VISUAL-REPORT-IR.json',longForm:'docs/acceptance/bazi-paid-report/full-report-c1/CONVERGED-CANDIDATE.json'};
 const composition=read(paths.composition),vfr=read(paths.vfr),long=read(paths.longForm);
 const seen=new Map(),rows=[];
 for(const sectionId of Array.from({length:9},(_,i)=>'S'+String(i+2).padStart(2,'0'))){
  for(const locale of ['zh-Hans','en']){
   const compositionReport=composition.reports[locale]||composition.reports[locale==='zh-Hans'?'zh':'en'];
   const texts={composition:compositionReport?.pages.filter(p=>p.pageKey.startsWith(sectionId+'_')).flatMap(p=>p.paragraphs).join('\n\n')||'',vfr:vfr.sections.find(s=>s.id===sectionId)?.[locale==='en'?'interpretationEn':'interpretationZh']?.join('\n\n')||'',longForm:locale==='zh-Hans'?long.sections.find(s=>s.sectionId===sectionId)?.paragraphs.map(p=>p.text).join('\n\n')||'':''};
   for(const [source,text] of Object.entries(texts)){
    if(!text)continue;
    const key=source+'/'+locale,prior=seen.get(key)||new Map();seen.set(key,prior);
    const sentences=text.match(/[^。！？.!?]+[。！？.!?]+|[^。！？.!?]+$/g)||[];let repeated=0;const duplicates=[];
    for(const sentence of sentences){const normalized=normalize(sentence);if(normalized.length<30)continue;const earlier=prior.get(normalized);if(earlier&&earlier!==sectionId){repeated+=outputTokens(sentence);duplicates.push({fromSection:earlier,text:sentence.trim(),estimatedTokens:outputTokens(sentence)});}else if(!earlier)prior.set(normalized,sectionId);}
    const historicalTokens=outputTokens(text),netUniqueTokens=Math.max(1,historicalTokens-repeated);
    rows.push({sectionId,locale,source,characters:text.length,historicalTokens,estimatedRepeatedFoundationTokens:duplicates.filter(d=>Object.values(foundations).some(r=>r.test(d.text))).reduce((n,d)=>n+d.estimatedTokens,0),estimatedRepeatedTokens:repeated,netUniqueExplanatoryTokens:netUniqueTokens,targetRange:{min:netUniqueTokens,max:Math.ceil(netUniqueTokens*1.1)},foundationMentions:Object.fromEntries(Object.entries(foundations).map(([k,r])=>[k,sentences.filter(s=>r.test(s)).length])),duplicates});
   }
  }
 }
 const unitOutputTokens={},historicalUnitTokens={};
 for(const sectionId of Array.from({length:9},(_,i)=>'S'+String(i+2).padStart(2,'0')))for(const locale of ['zh-Hans','en']){const group=rows.filter(r=>r.sectionId===sectionId&&r.locale===locale);if(!group.length)throw Error('BDM_HISTORICAL_LOCALE_MISSING');const selected=group.reduce((a,b)=>a.netUniqueExplanatoryTokens>=b.netUniqueExplanatoryTokens?a:b);unitOutputTokens[sectionId+'/'+locale]=selected.netUniqueExplanatoryTokens;historicalUnitTokens[sectionId+'/'+locale]=selected.historicalTokens;}
 return {version:'BDM-LOCAL-DEPTH-RECEIPT-1',measurementMethod:'Mixed CJK x1.5 + remaining characters/3 output planning heuristic; not actual token counts',confidence:'CONSERVATIVE_HEURISTIC',repetitionMethod:'Only exact normalized cross-section sentences >=30 characters deducted. Foundation concept mentions flagged; paraphrases/mixed explanations retained. No semantic verifier and no manuscript edits.',sourceDigests:Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,{path:p,sha256:createHash('sha256').update(fs.readFileSync(p)).digest('hex')}])) ,rows,unitOutputTokens,historicalUnitTokens,selection:'Maximum measured net depth per section and locale across available sources, not a fixed chapter allowance',ziWeiTelemetry:{status:'NO_ACCEPTED_DEEP_MANUSCRIPT_USAGE_RECEIPT_LOCATED',historicalEmpiricalReference:'Approximately $0.7 / 5 calls (owner-supplied reference only, excluded from formula)'}};
}
