import fs from 'node:fs';
import crypto from 'node:crypto';
import {composeAstPlanetSignMeaning} from '../functions/ast-full-production/ast-planet-sign-composition-runtime.js';

const CURRENT_BASELINE='7c6126404fe8e257b44937a0149bf23c837c538f';
const MACHINE_PATH='content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-machine-campaign-v1.json';
const REVIEW_PATH='content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-human-review-v1.json';
const REVIEW_HTML_PATH='content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-human-review-v1.html';
const ADMISSION_PATH='content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-production-admission-v1.json';
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ontology=readJson('content/professional/ast-production/meaning/ast-meaning-ontology-v1.json');
const rule=readJson('content/professional/ast-full-production/recovery/ast-mfp-r-planet-sign-composition-rule-v1.json');
const planets=ontology.entries.filter(x=>x.meaningFamily==='AST_FUNCTIONAL_DRIVER').map(x=>x.semanticKey);
const signs=ontology.entries.filter(x=>x.meaningFamily==='AST_DIRECTION_MODE').map(x=>x.semanticKey);
const locales=['en','zh-Hans'];
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sourceEqual=(a,b)=>JSON.stringify(a||[])===JSON.stringify(b||[]);

function currentHumanReview(expectedCases){
  if(!fs.existsSync(REVIEW_PATH))return null;
  const old=readJson(REVIEW_PATH);
  const expectedById=new Map(expectedCases.map(x=>[x.caseId,x]));
  const oldCases=Array.isArray(old.cases)?old.cases:[];
  const sameCandidates=oldCases.length===expectedCases.length&&oldCases.every(x=>{
    const e=expectedById.get(x.caseId);
    return e&&x.planetCode===e.planetCode&&x.signCode===e.signCode&&x.locale===e.locale&&x.customerText===e.customerText&&sourceEqual(x.sourceRefs,e.sourceRefs);
  });
  const accepted=old.status==='HUMAN_ACCEPTED'&&old.accepted===24&&old.rejected===0&&old.pending===0&&oldCases.every(x=>x.decision==='ACCEPTED');
  return sameCandidates&&accepted?old:null;
}

const cases=[];
for(const locale of locales)for(const planetCode of planets)for(const signCode of signs){
  const a=composeAstPlanetSignMeaning({planetCode,signCode,locale,meaningOntology:ontology,compositionRule:rule});
  const b=composeAstPlanetSignMeaning({planetCode,signCode,locale,meaningOntology:ontology,compositionRule:rule});
  if(JSON.stringify(a)!==JSON.stringify(b))throw new Error('AST_MFP_R_NON_DETERMINISTIC');
  cases.push({caseId:`AST-MFP-R-${locale}-${planetCode}-${signCode}`,locale,planetCode,signCode,digest:digest(a),sourceRefs:a.sourceRefs,boundaries:a.boundaries,status:'PASS'});
}

const expectedReviewCases=[];
for(let i=0;i<24;i++){
  const planetCode=planets[i%planets.length],signCode=signs[(i*5)%signs.length],locale=i%2?'en':'zh-Hans';
  const unit=composeAstPlanetSignMeaning({planetCode,signCode,locale,meaningOntology:ontology,compositionRule:rule});
  expectedReviewCases.push({
    caseId:`AST-MFP-R-HR-${String(i+1).padStart(2,'0')}`,planetCode,signCode,locale,
    customerText:unit.customerText,sourceRefs:unit.sourceRefs,
    reviewCriteria:['SOURCE_BOUND_COMPONENTS','COMPOSITION_FAITHFUL','CUSTOMER_READABLE','NO_PERSONALITY_FACT','NO_DESTINY_OR_EVENT_PREDICTION','NO_RENDERER_MEANING'],
    decision:'PENDING',reviewerNote:''
  });
}

const preserved=currentHumanReview(expectedReviewCases);
const review=preserved?{
  ...preserved,
  baselineCommit:CURRENT_BASELINE,
  governance:{...(preserved.governance||{}),reviewImmutableUnlessCandidateTextOrSourceLineageChanges:true}
}:{
  schemaVersion:'PHI-OS-AST-MFP-R-PLANET-SIGN-HUMAN-REVIEW-v1.0.0',workCode:'MFP-R-AST-001',baselineCommit:CURRENT_BASELINE,
  status:'HUMAN_REVIEW_PENDING',requiredCases:24,accepted:0,rejected:0,pending:24,cases:expectedReviewCases,
  governance:{machineEvidenceSubstitutionAllowed:false,modelMayApprove:false,reviewImmutableUnlessCandidateTextOrSourceLineageChanges:true,customerRuntimeUseRequiresSeparateProductionAdmission:true}
};
fs.writeFileSync(REVIEW_PATH,JSON.stringify(review,null,2)+'\n');

const humanAccepted=review.status==='HUMAN_ACCEPTED'&&review.accepted===24&&review.pending===0&&review.rejected===0;
let productionAdmission=null;
if(fs.existsSync(ADMISSION_PATH))productionAdmission=readJson(ADMISSION_PATH);
const productionAdmitted=humanAccepted&&productionAdmission?.status==='PRODUCTION_ADMITTED'&&productionAdmission?.productionAllowed===true&&productionAdmission?.customerRuntimeUseAllowed===true;
const campaign={
  schemaVersion:'PHI-OS-AST-MFP-R-PLANET-SIGN-MACHINE-CAMPAIGN-v1.0.0',workCode:'MFP-R-AST-001',baselineCommit:CURRENT_BASELINE,status:'MACHINE_VERIFIED',
  coverage:{planetCount:planets.length,signCount:signs.length,localeCount:locales.length,totalCases:cases.length,expectedCases:240},
  actual:{passed:cases.length,failed:0,deterministicReplayCases:cases.length},
  governance:{humanAccepted,productionAdmitted,customerRuntimeUseAllowed:productionAdmitted,rendererMeaningCreated:false},cases
};
fs.writeFileSync(MACHINE_PATH,JSON.stringify(campaign,null,2)+'\n');

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cards=review.cases.map(x=>`<article><header><b>${esc(x.caseId)}</b><span>${esc(x.planetCode)} × ${esc(x.signCode)} · ${esc(x.locale)}</span></header><p>${esc(x.customerText)}</p><details><summary>Source lineage</summary><code>${esc(x.sourceRefs.join('\n'))}</code></details><div class="decision">Decision: <strong>${esc(x.decision)}</strong></div></article>`).join('\n');
const html=`<!doctype html><meta charset="utf-8"><title>AST MFP-R Planet × Sign Human Review</title><style>body{font-family:system-ui,sans-serif;max-width:1100px;margin:40px auto;padding:0 20px;line-height:1.55}h1{font-size:2rem}article{border:1px solid #ccc;border-radius:14px;padding:18px;margin:16px 0;break-inside:avoid}header{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}code{white-space:pre-wrap;font-size:.8rem}.decision{margin-top:12px;padding-top:10px;border-top:1px solid #ddd}small{opacity:.72}</style><h1>AST MFP-R｜Planet × Sign</h1><p>24-case human review pack. Machine campaign is 240/240. Current human state: ${esc(review.status)} (${review.accepted}/${review.requiredCases} accepted).</p>${cards}`;
fs.writeFileSync(REVIEW_HTML_PATH,html+'\n');
console.log(`AST MFP-R machine/review artifacts generated: ${cases.length}/${cases.length} machine PASS; human ${review.accepted}/${review.requiredCases} accepted; production admitted=${productionAdmitted}.`);
