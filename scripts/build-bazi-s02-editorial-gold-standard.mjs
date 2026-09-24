import fs from 'node:fs';
import {evaluateS02GoldStandard} from '../functions/personal-reading/narrative/bazi-s02-editorial-depth.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const packs=read('functions/personal-reading/narrative/bazi-t3-preview-baseline.generated.json').packs;
const entries={};
for(const locale of ['en','zh-Hans']){
 const pack=packs[`BASELINE_NOW:${locale}:S02_PERSONALITY`];if(!pack?.editorialGoldStandard||!pack?.editorialDepthContract)throw Error('S02_GOLD_STANDARD_PACK_REQUIRED:'+locale);
 const evaluation=evaluateS02GoldStandard(pack.editorialGoldStandard,pack);if(evaluation.status!=='PASS')throw Object.assign(Error('S02_GOLD_STANDARD_REJECTED:'+locale),{evaluation});
 entries[locale]={canonicalEvidenceHash:pack.canonicalEvidenceHash,meaningEvidenceHash:pack.meaningEvidenceHash,depthContract:pack.editorialDepthContract,goldStandard:pack.editorialGoldStandard,evaluation};
}
const artifact={schemaVersion:'BAZI_S02_EDITORIAL_GOLD_STANDARD_ARTIFACT_V1',profileId:'BASELINE_NOW',humanAccepted:false,production:false,entries};
const artifactPath='docs/acceptance/bazi-paid-report/editorial/S02-EDITORIAL-GOLD-STANDARD.json';fs.mkdirSync('docs/acceptance/bazi-paid-report/editorial',{recursive:true});fs.writeFileSync(artifactPath,JSON.stringify(artifact,null,2)+'\n');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BaZi S02 · Editorial Gold Standard</title><style>body{max-width:980px;margin:auto;padding:28px;font:17px/1.8 system-ui;background:#f5f1e8;color:#213547}article{background:#fffaf1;padding:26px;margin:24px 0;border:1px solid #d8d1c2}h1,h2,h3{line-height:1.25}small,code{color:#59656d}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>BaZi S02 · Editorial Gold Standard</h1><p>Deterministic editorial benchmark built only from the existing licensed S02 Claim IR. It is not a customer snapshot, human acceptance, or Production activation.</p>${Object.entries(entries).map(([locale,e])=>`<article><h2>${esc(locale)}</h2>${e.goldStandard.blocks.map(b=>`<section><h3>${esc(b.role)}</h3><p>${esc(b.text)}</p><small>claimIds: ${esc(b.claimIds.join(', '))}</small></section>`).join('')}<h3>Observation prompts</h3><ul>${e.goldStandard.observationPrompts.map(q=>`<li>${esc(q.text)}</li>`).join('')}</ul><h3>Boundary</h3><p>${esc(e.goldStandard.boundary.text)}</p><details><summary>Depth gate / hashes</summary><pre>${esc(JSON.stringify({evaluation:e.evaluation,depthContract:e.depthContract,canonicalEvidenceHash:e.canonicalEvidenceHash},null,2))}</pre></details></article>`).join('')}</html>`;
fs.mkdirSync('docs/guided-report-successor-r2/bazi-t3',{recursive:true});fs.writeFileSync('docs/guided-report-successor-r2/bazi-t3/s02-gold-standard.html',html);
console.log(JSON.stringify({built:true,profileId:'BASELINE_NOW',locales:Object.fromEntries(Object.entries(entries).map(([locale,e])=>[locale,e.evaluation])),providerInvoked:false,humanAccepted:false,production:false},null,2));
