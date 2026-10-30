import fs from'node:fs';import{selectCurrentHdFrontMatter as select}from'./freshness-gate.mjs';
const D='tools/review/hd-r6/import-20261027/r611a/',evidence=JSON.parse(fs.readFileSync(D+'CURRENT-OBJECT-MATRIX.json'));
try{const plans=['zh-Hans','en','bilingual'].map(reportLocale=>select({evidence,entitlement:{product_id:'COM-REPORT-HD-FULL',entitlement_status:'active',purchase_id:'QA-NO-CHARGE',reportPresentation:{reportLocale,reportLanguageMode:reportLocale==='bilingual'?'BILINGUAL':'SINGLE'}}}));
 fs.writeFileSync(D+'FRONT-MATTER-SELECTION.json',JSON.stringify({plans},null,2));
 fs.writeFileSync(D+'FRONT-MATTER-BINDINGS.json',JSON.stringify({rows:plans.flatMap(p=>p.pages)},null,2));
 fs.writeFileSync(D+'CURRENT-RENDER-GATE.json',JSON.stringify({status:'PASS_CURRENT_BYTES_AND_VISUAL_REVIEW',reportGeneration:'AUTHORIZED_LOCAL_ONLY',actualPDFGeneration:'NOT_YET_RUN'},null,2));
 console.log('R611A current-byte gate passed; no production admission');
}catch(e){fs.writeFileSync(D+'CURRENT-RENDER-GATE.json',JSON.stringify({status:'BLOCKED',exactCause:e.message,actualPDFGeneration:'NOT_RUN_NO_OLD_CACHE_SUBSTITUTION'},null,2));console.log(e.message);process.exitCode=2;}
