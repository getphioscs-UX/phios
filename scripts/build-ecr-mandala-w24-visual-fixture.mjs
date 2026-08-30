import fs from 'node:fs';
import path from 'node:path';
import {resolveEcrCoordinateFromSolarLongitude} from '../functions/embodied-configuration/ecr-calculation-runtime.js';
import {buildEcrCustomerMandalaProjection} from '../functions/embodied-configuration/ecr-customer-mandala-projection.js';
import {adaptEcrPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ecr-production-adapter.js';
import {renderEcrProduct} from '../assets/customer-ui/js/specialists/ecr/product-renderer.js';
import fixture from '../content/embodied-configuration/acceptance/ecr-mandala-canonical-acceptance-fixture-v1.json' with {type:'json'};

const item=(code,value,meta={})=>({code,value,rawValue:null,meta});
function reading(locale){
 const resolved=resolveEcrCoordinateFromSolarLongitude(fixture.anchorLongitude);
 return {schemaVersion:'PHI-OS-ECR-RUNTIME-READING-IR-v1.0.0',sourceProjectionId:`CMP-ECR-W24-VISUAL-${locale==='zh-Hans'?'ZH':'EN'}`,sourceMeaningBundleCode:'ECR-W24-VISUAL-MEANING-LINEAGE',locale,boundaries:{currentRealityKnown:false,currentDriverPriorityClaimed:false},sections:{coordinate:{anchorLongitude:fixture.anchorLongitude,context:[item(resolved.cosmologicalContext.contextId,resolved.cosmologicalContext.zodiacCode)],grammar:[item(resolved.grammar.code,resolved.grammar.code)],question:[item(resolved.question.questionId,resolved.question.questionId)]},response:{capabilities:[item(resolved.capability.primary.id,'PRIMARY',{priority:'PRIMARY'}),...resolved.capability.supporting.map(x=>item(x.id,'SUPPORTING',{priority:'SUPPORTING'}))],driverPriority:resolved.driverPriority.drivers.map(x=>item(x.driverId,x.baselineAffinity,{rank:x.rank,angularDistanceDegrees:x.angularDistanceDegrees,classification:resolved.driverPriority.classification}))},change:{motion:[item(resolved.motion.motionId,resolved.motion.motionId)],configuration:[item(resolved.configuration.configurationId,resolved.configuration.configurationId)],activation:[item(resolved.activation.activationId,resolved.activation.activationId)]}}};
}
function html(locale){
 const readingIR=reading(locale),mandalaProjection=buildEcrCustomerMandalaProjection(readingIR),product=adaptEcrPersonalRealityProduct({readingIR,mandalaProjection,locale}),rendered=renderEcrProduct({product});
 const css=fs.readFileSync('assets/customer-ui/surfaces/ecr-specialist.css','utf8');
 return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ECR W24 ${locale}</title><style>:root{--cx-surface:#fff;--cx-surface-soft:#f5f3ee;--cx-ink:#17130f;--cx-muted:#6b675f;--cx-line:#d8d3c7;--cx-accent:#9b6a16}*{box-sizing:border-box}body{margin:0;background:#f2efe8;color:var(--cx-ink);font:16px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{width:min(1180px,calc(100% - 32px));margin:24px auto 64px}.cx-eyebrow{font-size:.76rem;letter-spacing:.1em;text-transform:uppercase;color:var(--cx-muted);font-weight:700;margin:.1rem 0}.cx-meta{color:var(--cx-muted);font-size:.88rem}button,summary{font:inherit}button{background:#fff;border:1px solid var(--cx-line);border-radius:10px;padding:.45rem .6rem}${css}</style></head><body><main><div class="fixture-nav">${rendered.navigationHtml||''}</div>${rendered.visualHtml||''}${rendered.readingHtml||''}${rendered.technicalHtml||''}</main></body></html>`;
}
const outDir=process.env.ECR_W24_FIXTURE_DIR||'/mnt/data/ecr-w24-fixture';fs.mkdirSync(outDir,{recursive:true});
for(const locale of ['zh-Hans','en']){const file=path.join(outDir,`ecr-w24-${locale}.html`);fs.writeFileSync(file,html(locale));console.log(file)}
