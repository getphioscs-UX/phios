import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildEcrHumanRuntime} from '../functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
import {adaptEcrPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ecr-production-adapter.js';
import {renderEcrProduct} from '../assets/customer-ui/js/specialists/ecr/product-renderer.js';

const root='docs/ecr-human-runtime-v4-1/r8';
fs.mkdirSync(root,{recursive:true});
const input=JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json')).cases[0].canonicalInput;
const bilingual=JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/admission/ecr-bilingual-review-owner-decisions-r4.json'));
assert.equal(bilingual.summary.ACCEPT,14);
assert.equal(bilingual.summary.REVISE,0);

const ir=await buildEcrHumanRuntime({canonicalInput:input});
const entitlement={schemaVersion:'PHI-OS-KAP-W45-METHOD-JOURNEY-ENTITLEMENT-v1.0.0',methodCode:'ECR',access:{methodAllowed:true,readingDepthAllowed:true}};
const earth=ir.initialization.activations.filter(a=>a.bodyCode==='EARTH');
assert.equal(earth.length,2);
assert(earth.every(a=>a.status==='CALCULATED'&&a.p64));
assert.equal(ir.initialization.activations.filter(a=>a.bodyCode==='CHIRON').length,0);

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pages={};
for(const locale of ['en','zh-Hans']){
 const product=adaptEcrPersonalRealityProduct({humanRuntime:ir,runtimeReviewMode:true,locale,sharedEntitlement:entitlement});
 const rendered=renderEcrProduct({product});
 assert.equal(rendered.status,'RENDERED');
 const cards=product.sourceProduct?.phiCardSpread?.cards||[];
 assert.equal(cards.length,6);
 const title=locale==='zh-Hans'?'ECR V4.1 · R8 渲染视觉验收':'ECR V4.1 · R8 Rendered Visual Acceptance';
 const note=locale==='zh-Hans'
  ?'合成测试资料 · 真实 customer renderer · 仅供 R8 人工视觉验收 · 尚未开放生产'
  :'Synthetic fixture · real customer renderer · R8 human visual acceptance only · not production';
 const html=`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><link rel="stylesheet" href="/assets/customer-ui/surfaces/ecr-specialist.css"><style>
 body{font:17px/1.75 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;margin:0;background:#f7f2e9;color:#20394c}
 header,main{max-width:1120px;margin:auto;padding:24px}header{padding-top:38px}
 .r8-banner{border:1px solid #c5b591;border-radius:16px;padding:14px 16px;background:#fffaf0}
 .r8-facts{display:flex;gap:10px;flex-wrap:wrap}.r8-facts span{padding:6px 10px;border-radius:999px;background:#eee4cf;font-size:13px}
 section{break-inside:avoid}svg{width:100%;height:auto;max-height:900px}.cx-ecr-mandala__viewport{max-width:100%;overflow:auto}
 .cx-ecr-v41-cards img{width:100%;height:auto;display:block;border-radius:12px}
 @media(max-width:600px){header,main{padding:14px}svg{min-width:340px}.cx-ecr-spread__grid{grid-template-columns:1fr 1fr!important}}
 @media(max-width:390px){.cx-ecr-spread__grid{grid-template-columns:1fr!important}}
 @media print{body{background:#fff}header,main{max-width:none;padding:12mm}.r8-banner{border-color:#bbb}button{display:none!important}section,article{break-inside:avoid}}
 </style></head><body><header><p class="cx-eyebrow">R8 · RENDERED CUSTOMER VISUAL ACCEPTANCE</p><h1>${esc(title)}</h1><div class="r8-banner"><b>${esc(note)}</b><div class="r8-facts"><span>Gate 41 SVG 238°</span><span>41 → 19 → 13 CCW</span><span>D11 EARTH</span><span>Current Reality = OBSERVATION + COMPARISON</span><span>6 PHI Card slots</span></div></div><p><a href="review-${locale==='en'?'zh-Hans':'en'}.html">${locale==='en'?'简体中文':'English'}</a></p></header><main>${rendered.visualHtml}${rendered.readingHtml}</main><script type="module">import{installPhiMandalaInteractions}from'/assets/customer-ui/js/specialists/ecr/mandala-renderer.js';installPhiMandalaInteractions(document);</script></body></html>`;
 const file=`review-${locale}.html`;fs.writeFileSync(`${root}/${file}`,html);pages[locale]={file,cards:cards.map(c=>({slot:c.slot,cardId:c.cardId,status:c.status,unknownReason:c.unknownReason,assetObjectKey:c.asset?.objectKey||null}))};
}

const checklist={
 schemaVersion:'ECR-V4.1A-R8-RENDERED-VISUAL-ACCEPTANCE-v1',
 generatedAt:'2026-09-28',
 syntheticFixtureOnly:true,
 renderer:'assets/customer-ui/js/specialists/ecr/product-renderer.js',
 pages,
 requiredViewports:['1440-desktop','390-mobile','print-A4'],
 requiredChecks:{
  bilingualLayout:'PENDING_HUMAN_REVIEW',
  mandalaOrientation:'PENDING_HUMAN_REVIEW',
  earthD11VisibleNoChiron:'PENDING_HUMAN_REVIEW',
  phiCards:'PENDING_HUMAN_REVIEW',
  currentRealityBoundary:'PENDING_HUMAN_REVIEW',
  evidenceUnknownBoundary:'PENDING_HUMAN_REVIEW',
  overflowAndClipping:'PENDING_HUMAN_REVIEW',
  printLegibility:'PENDING_HUMAN_REVIEW'
 },
 humanDecision:'PENDING',
 customerProductionAdmitted:false
};
fs.writeFileSync(`${root}/r8-rendered-visual-acceptance.json`,JSON.stringify(checklist,null,2)+'\n');
fs.writeFileSync(`${root}/runtime-lineage-proof.json`,JSON.stringify({configurationId:ir.configurationId,birthInstant:ir.initialization.birth.instantUTC,designInstant:ir.initialization.design.instantUTC,earth:earth.map(a=>({layer:a.layer,longitude:a.eclipticLongitude,gate:a.p64.gate,line:a.p64.line,activationStage:a.p64.activationStage})),drivers:ir.driverField.drivers.map(d=>({driverId:d.driverId,status:d.status,bodies:d.bodyBinding})),semanticDepth:ir.semanticDepth,currentReality:ir.currentReality,unknown:ir.unknown},null,2)+'\n');
console.log('R8 rendered acceptance artifacts built. Human visual decision remains PENDING.');
