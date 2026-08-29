import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {selectEcrPhiCards} from '../functions/ecr-phi-card/ecr-card-selector.js';
import {composeEcrPhiCardSpread} from '../functions/ecr-phi-card/ecr-card-reading.js';
const here=path.dirname(fileURLToPath(import.meta.url)); const root=path.resolve(here,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(p,x)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(x,null,2)+'\n')};
const deck=read('content/ecr-phi-card/ecr-phi-card-deck-registry-v2.json');
const mapping=read('content/ecr-phi-card/ecr-result-to-phi-card-mapping-matrix-v2.json');
const assets=read('content/ecr-phi-card/ecr-phi-card-asset-registry-v1.json');
const source=read('content/customer-experience-rebuild/r12r4b/review/ecr-v1/ecr-human-review-cases-v1.json').cases;

const decorated=source.map(c=>({c,sel:selectEcrPhiCards({coordinate:c.coordinate,interpretationUnits:c.interpretationUnits,customerPublishable:true},mapping,deck)}));
const picked=[]; const seen=new Set();
while(picked.length<12){
  let best=null,bestGain=-1;
  for(const x of decorated){if(picked.includes(x))continue; const ids=Object.values(x.sel.groups).map(v=>v?.cardId).filter(Boolean); const gain=ids.filter(id=>!seen.has(id)).length + (picked.filter(p=>p.c.locale===x.c.locale).length<6?0.25:0); if(gain>bestGain){best=x;bestGain=gain}}
  if(!best)break; picked.push(best); for(const v of Object.values(best.sel.groups))if(v?.cardId)seen.add(v.cardId);
}
// balance locales if greedy drifts.
for(const locale of ['en','zh-Hans']){
  while(picked.filter(x=>x.c.locale===locale).length<6){
    const repl=decorated.find(x=>x.c.locale===locale&&!picked.includes(x)); if(!repl)break;
    const idx=picked.findIndex(x=>picked.filter(y=>y.c.locale===x.c.locale).length>6); if(idx<0)break; picked[idx]=repl;
  }
}
const cases=picked.map((x,i)=>({
  caseId:`ECR-PC-BENCH-${String(i+1).padStart(2,'0')}`,
  sourceCaseId:x.c.caseId,
  locale:x.c.locale,
  projectionId:x.c.projectionId,
  spread:composeEcrPhiCardSpread({coordinate:x.c.coordinate,interpretationUnits:x.c.interpretationUnits,customerPublishable:true,locale:x.c.locale},mapping,deck,assets)
}));
const out={schemaVersion:'PHI-OS-ECR-PHI-CARD-BENCHMARK-v1.0.0',work:'ECR-PC-R1-S7',status:'READY_FOR_HUMAN_REVIEW',requiredCaseCount:12,sourceAuthority:'Accepted ECR human-review fixtures',selectionPolicy:'Greedy card-coverage maximization with 6 English + 6 zh-Hans cases.',cases};
write('content/ecr-phi-card/benchmark/ecr-phi-card-benchmark-v1.json',out);

const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ECR PHI Card S7 Human Review</title><style>body{font:15px/1.5 system-ui;margin:0;background:#07111f;color:#eaf0ff}main{max-width:1180px;margin:auto;padding:32px}.case{border:1px solid #34506e;border-radius:18px;padding:24px;margin:22px 0;background:#0b1728}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.card{border:1px solid #2b4463;border-radius:14px;padding:16px;background:#0e1d31}h1,h2,h3{color:#f3d27a}.meta{color:#a9bad1}.prompt{padding:10px 12px;border-left:3px solid #f3d27a;background:#101f34}.review{margin-top:18px;padding-top:16px;border-top:1px solid #29425f}label{margin-right:18px}textarea{width:100%;min-height:72px;background:#081423;color:#fff;border:1px solid #35506f;border-radius:8px}</style></head><body><main><h1>ECR-PC-R1-S7｜12-case Human Review</h1><p>This review checks card fit, runtime copy clarity, non-repetition, customer language, tension/phase boundaries, report complementarity and visual-meaning fit. 12/12 acceptance is required before customer admission.</p>${cases.map(k=>`<section class="case"><h2>${esc(k.caseId)} <span class="meta">${esc(k.locale)} · source ${esc(k.sourceCaseId)}</span></h2><div class="grid">${k.spread.cards.map(c=>`<article class="card"><h3>${esc(c.groupId)}｜${esc(c.title)}</h3><div class="meta">${esc(c.cardId)} · ${esc(c.asset?.fileName)}</div><p><strong>${esc(c.oneLineInsight)}</strong></p><p>${esc(c.canonicalCustomerMeaning)}</p><p class="prompt">${esc(c.observationPrompt)}</p></article>`).join('')}</div><div class="review"><label><input type="radio" name="${k.caseId}" value="ACCEPTED"> ACCEPTED</label><label><input type="radio" name="${k.caseId}" value="REJECTED"> REJECTED</label><p><textarea placeholder="Review notes"></textarea></p></div></section>`).join('')}</main></body></html>`;
fs.writeFileSync(path.join(root,'content/ecr-phi-card/review/ecr-phi-card-human-review-v1.html'),html);
console.log(`✓ Generated ${cases.length} ECR PHI Card benchmark spreads; unique selected cards=${seen.size}.`);
