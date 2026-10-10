import fs from 'node:fs';
import {build} from 'esbuild';
import {parseHTML} from 'linkedom';
fs.mkdirSync('.tmp/page-consolidation-r1',{recursive:true});
await build({stdin:{contents:`
import fs from 'node:fs';
import {buildEcrHumanRuntime} from './functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
import {adaptEcrPersonalRealityProduct} from './functions/personal-reality-product/adapters/ecr-production-adapter.js';
import {renderEcrProduct} from './assets/customer-ui/js/specialists/ecr/product-renderer.js';
import {scoreSelfAssessment,buildSelfAssessmentProfileSignals,SELF_ASSESSMENT_PURPOSE} from './functions/profile/profile-foundation-runtime.js';
import {buildProgressiveProfileView} from './functions/profile/profile-progressive-ux-runtime.js';
import {buildProfileCustomerVisualProjection} from './functions/profile/profile-customer-visual-projection.js';
import {renderPersonalEvidenceFigure} from './assets/customer-ui/js/visuals/profile-visual-mvp.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const input=read('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json').cases[0].canonicalInput;
const ir=await buildEcrHumanRuntime({canonicalInput:input});
const instrument=read('content/professional/profile/assessment/self-assessment-instrument-v2.json'),selection=read('content/profile/ux/profile-quick-profile-selection-v1.json');
const chosen=new Set(selection.itemIds),responses=Object.fromEntries(instrument.items.filter(x=>chosen.has(x.itemId)).map((x,i)=>[x.itemId,(i%5)+1]));
const scored=scoreSelfAssessment({instrument,responses,participantRef:'PUBLIC-SYNTHETIC-EXAMPLE',assessmentDate:'2026-01-01',customerConfirmed:true,consent:true,sensitiveConsent:true,purpose:SELF_ASSESSMENT_PURPOSE});
const view=await buildProgressiveProfileView({mode:'QUICK_PROFILE',profileSignals:await buildSelfAssessmentProfileSignals(scored),participantRef:'PUBLIC-SYNTHETIC-EXAMPLE',asOfDate:'2026-01-01',locale:'en',customerPublishable:true,preview:false});
const projection=buildProfileCustomerVisualProjection({progressiveView:view,participantRef:view.participantRef,asOfDate:view.asOfDate});
const output='assets/customer-ui/media/page-consolidation-r1';fs.mkdirSync(output,{recursive:true});
for(const locale of ['en','zh-Hans']){const product=adaptEcrPersonalRealityProduct({humanRuntime:ir,runtimeReviewMode:true,locale,sharedEntitlement:{schemaVersion:'PHI-OS-KAP-W45-METHOD-JOURNEY-ENTITLEMENT-v1.0.0',methodCode:'ECR',access:{methodAllowed:true,readingDepthAllowed:true}}});const rendered=renderEcrProduct({product});fs.writeFileSync(output+'/configuration-'+locale+'.html',rendered.visualHtml||'');fs.writeFileSync(output+'/profile-'+locale+'.html',projection.figures.filter(f=>f.state==='READY').map(figure=>renderPersonalEvidenceFigure(figure,{locale:'bilingual'})).join(''));console.log(JSON.stringify({locale,renderedKeys:Object.keys(rendered),configurationVisualBytes:(rendered.visualHtml||'').length,profileFigures:projection.figures.map(f=>[f.pfig,f.state])}));}
fs.writeFileSync(output+'/example-provenance.json',JSON.stringify({exampleOnly:true,customerData:false,providerCalls:0,configuration:{fixture:'SYNTHETIC-1',input,configurationId:ir.configurationId,baselineDigest:ir.baselineDigest,authority:ir.lineage.authorityFreeze,owner:'functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js',renderer:'assets/customer-ui/js/specialists/ecr/product-renderer.js',unknown:ir.unknown},profile:{participantRef:view.participantRef,mode:view.mode,semanticDigest:view.semanticDigest,assessmentDate:view.asOfDate,responses,owner:'functions/profile/profile-foundation-runtime.js',renderer:'assets/customer-ui/js/visuals/profile-visual-mvp.js',sourceClasses:view.sourceLegend}},null,2));
`,resolveDir:process.cwd(),sourcefile:'public-examples-r1.js'},bundle:true,platform:'node',format:'esm',outfile:'.tmp/page-consolidation-r1/examples.mjs',packages:'external',logLevel:'silent'});
await import('../.tmp/page-consolidation-r1/examples.mjs');
for(const kind of ['configuration','profile']){
 const dir='assets/customer-ui/media/page-consolidation-r1', {document}=parseHTML(fs.readFileSync(dir+'/'+kind+'-en.html','utf8'));
 const svg=kind==='configuration'?document.querySelector('svg'):document.querySelector('[data-pfig="PFIG-002"] svg');
 if(!svg)throw Error(kind+' real owner SVG missing');
 svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
 const style=document.createElement('style');style.textContent=fs.readFileSync(kind==='configuration'?'assets/customer-ui/surfaces/ecr-specialist.css':'assets/customer-ui/visuals/profile-visual-mvp.css','utf8');svg.prepend(style);
 fs.writeFileSync(dir+'/'+kind+'-preview.svg',svg.outerHTML);
}
