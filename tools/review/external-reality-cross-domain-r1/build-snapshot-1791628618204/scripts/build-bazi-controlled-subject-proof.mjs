import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {build} from 'esbuild';
import {executeAndProjectMcd5CurrentRequest} from '../functions/method-client-delivery/canonical-projection-runtime-current.js';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {projectBaziPublicationPages} from '../functions/personal-reading/bazi-visual-report-projection.js';
import {createReportSubjectPresentationFromAccountPerson,assertReportSubjectBinding,reportBirthInputFingerprint} from '../functions/canonical-presentation-runtime/report-cover-subject.js';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {buildReportPublicationIrV2,assertPublicationIrV2Preservation} from '../functions/personal-reading/narrative/report-publication-ir-v2.js';
import {assemblePublicationSnapshot} from '../functions/canonical-presentation-runtime/visual-report-page-runtime.js';
import {REPORT_EDITORIAL_ASSETS} from '../functions/canonical-presentation-runtime/report-editorial-registry.js';
import {resolveReportEditorialAsset} from '../functions/canonical-presentation-runtime/report-editorial-resolver.js';
import {renderFrozenBaziIntro,renderPublicationReport} from '../assets/customer-ui/js/personal-products/publication-report-pages.js';
const dir='docs/acceptance/bazi-paid-report/controlled-subject-r1';fs.mkdirSync(dir,{recursive:true});const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const accountPerson={personId:'CONTROLLED-BZR-SUBJECT-R1',displayName:'Controlled BaZi Subject',fixtureClass:'GOVERNED_CONTROLLED_SUBJECT_NOT_REAL_CUSTOMER'};
const birthInput={birthDate:'1991-08-17',birthTime:'09:20:00',birthPlace:{displayName:'Kuala Lumpur',countryCode:'MY',latitude:3.139,longitude:101.6869},timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00',source:'HUMAN_DECLARATION',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'en',consent:{recordId:'CONTROLLED-BZR-R1',granted:true,purposeCode:'CONTROLLED_SUBJECT_BINDING_PROOF',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
write(dir+'/governed-input.json',{accountPerson,birthInput,scope:'New synthetic controlled input; no historical fixture identity inferred.'});
const birthSourceRef=dir+'/governed-input.json#birthInput';
// Expected identity is independently derived from the input owner, never from
// an overlay supplied by the renderer or a browser.
const identitySeed={subjectReference:accountPerson.personId,displayName:accountPerson.displayName,birthDate:birthInput.birthDate,birthTime:birthInput.birthTime,timeAccuracy:birthInput.timeAccuracy,identitySourceRef:'RDG_ACCOUNT_PERSON_REFERENCE:'+accountPerson.personId,birthSourceRef};
const inputSubjectFingerprint=await sha256Stable(identitySeed),canonicalBirthInputFingerprint=await reportBirthInputFingerprint(birthInput);
const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'BAZI',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'CONTROLLED_SUBJECT_BINDING_PROOF',canonicalInput:birthInput,executionParameters:{traditionalCalculationSex:'FEMALE'},consentRecordId:'CONTROLLED-BZR-R1',requestId:'CONTROLLED-BZR-R1'};
// No astronomy test loader, manual pillar fixture, projection override or
// accepted historical prose enters this calculation chain.
const execution=await executeAndProjectMcd5CurrentRequest(request);
assert.equal(execution.execution.executionStatus,'EXECUTED_BOUND_SCOPE');assert.equal(execution.canonicalProjection.projection.status,'COMPLETE');
const targetContext={targetDate:'2026-10-01',targetTime:'12:00:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'}};
const temporalSnapshot={mode:'CUSTOM',localDate:targetContext.targetDate,localTime:targetContext.targetTime,timezone:'Asia/Kuala_Lumpur',utcOffset:'+08:00',generatedAt:'2026-10-01T04:00:00.000Z'};
const artifacts=[],stageBase={subjectReference:accountPerson.personId,canonicalBirthInputFingerprint,inputSubjectFingerprint};
const calculationReceipt={...stageBase,requestDigest:await sha256Stable(request),projectionId:execution.canonicalProjection.projectionId,calculationDigest:await sha256Stable(execution.canonicalProjection),engine:'CURRENT_MCD5_PRODUCTION_ADAPTER',mockAstronomyUsed:false};
write(dir+'/calculation.json',{request,execution,receipt:calculationReceipt});
const css=['assets/css/tokens.css','assets/customer-ui/surfaces/visual-report.css','assets/customer-ui/surfaces/report-publication.css'].map(p=>fs.readFileSync(p,'utf8')).join('\n');
const runtime=(await build({stdin:{contents:`import {fitPublicationForPrint,settlePublicationAssets} from './assets/customer-ui/js/personal-products/publication-report-pages.js';await document.fonts.ready;await settlePublicationAssets(document);await Promise.all([...document.querySelectorAll('.pub-static img')].map(i=>i.decode()));window.reviewQuality=fitPublicationForPrint(document);window.batchReady=true;`,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',minify:true})).outputFiles[0].text;
for(const locale of ['zh-Hans','en']){
 const reading=await buildBaziMethodNativeReading({canonicalProjection:execution.canonicalProjection,canonicalInput:birthInput,baseExecution:execution.execution,locale,targetContext});
 const readingReceipt={...calculationReceipt,readingDigest:await sha256Stable(reading),nativeReportDigest:reading.summary.reportDigest,semanticSubjectFingerprint:await sha256Stable(identitySeed)};
 assert.equal(readingReceipt.semanticSubjectFingerprint,calculationReceipt.inputSubjectFingerprint);
 const projection=await projectBaziPublicationPages({reading,locale,temporalContext:temporalSnapshot});
 const publicationIR=[];
 for(const page of projection.pages){
  const internal=projection.internalPages.find(p=>p.pageNumber===page.pageNumber).interpretation;
  const claims=page.paragraphs.map((text,i)=>({claimId:`CONTROLLED-BZR:${page.pageKey}:${i}`,claimType:'CONDITIONAL_EXPRESSION',text,sourceRefs:internal.allowedInterpretations.map(x=>x.sourceRef),conditions:internal.tensionSignals,counterweights:internal.counterSignals,semanticOperators:['CONTEXTUALIZES'],certainty:'CONDITIONAL'}));
  const brief={methodId:'BZR',sectionKey:page.pageKey,claims,briefSemanticDigest:internal.semanticDigest,sourceSemanticDigest:internal.semanticDigest};
  const ir=await buildReportPublicationIrV2({methodId:'BZR',reportVersion:'CONTROLLED-SUBJECT-PROOF-R1',sectionKey:page.pageKey,locale,brief,candidate:{blocks:claims.map(c=>({role:'SOURCE_BOUND_READING',text:c.text,claimRefs:[c.claimId]}))},semanticOwner:'EXISTING_BAZI_NATIVE_READING',compositionOwner:'EXISTING_BAZI_PUBLICATION_PROJECTION',snapshotLineage:readingReceipt});
  assert(assertPublicationIrV2Preservation({publicationIr:ir,brief}).accepted);assert.deepEqual(ir.blocks.map(b=>b.prose),page.paragraphs);publicationIR.push({brief,publicationIr:ir});
 }
 const expectedBinding={...identitySeed,inputSubjectFingerprint,semanticSubjectFingerprint:readingReceipt.semanticSubjectFingerprint,canonicalBirthInputFingerprint};
 const presentation=await createReportSubjectPresentationFromAccountPerson({accountPersonReference:accountPerson,canonicalBirthInput:{...birthInput,locale},birthSourceRef});
 await assertReportSubjectBinding({presentation,expectedBinding});
 const intro=[1,2,3,4,5].map(page=>({pageNumber:page,kind:page===1?'STATIC_COVER':'STATIC',src:resolveReportEditorialAsset({registry:{bucket:'phios-public-assets',assets:REPORT_EDITORIAL_ASSETS},methodId:'BZR',page,locale:page===1?'bilingual':locale,publicBaseUrl:'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev'}).src,alt:'BaZi controlled proof',...(page===1?{subject:presentation}:{})}));
 intro.push({pageNumber:6,kind:'FROZEN_TEMPLATE',html:renderFrozenBaziIntro(projection.reports.find(r=>r.pages.some(p=>p.pageNumber===6)),26)});
 const snapshot=assemblePublicationSnapshot({methodId:'BZR',locale,pages:projection.pages,intro,temporalSnapshot,generatedAt:temporalSnapshot.generatedAt,internalPages:publicationIR,subjectPresentation:presentation}).customer;
 const snapshotReceipt={...readingReceipt,publicationDigest:await sha256Stable(publicationIR),snapshotDigest:await sha256Stable(snapshot)};
 const negativeTests=[];
 for(const [name,mutated] of [['wrong-subject',{...presentation,subjectReference:'OTHER'}],['wrong-date',{...presentation,birthDate:'1992-08-17'}],['wrong-time',{...presentation,birthTime:'10:20:00'}],['wrong-place',{...presentation,birthContext:{...presentation.birthContext,birthPlace:{...birthInput.birthPlace,longitude:114}}}],['wrong-timezone',{...presentation,birthContext:{...presentation.birthContext,timezone:{...birthInput.timezone,utcOffsetAtBirth:'+09:00'}}}]]){
  let error=null;try{await assertReportSubjectBinding({presentation:mutated,expectedBinding});}catch(e){error=e.message;}assert(error,name+' must reject');negativeTests.push({name,result:'REJECTED',error});
 }
 const swapped=await createReportSubjectPresentationFromAccountPerson({accountPersonReference:accountPerson,canonicalBirthInput:{...birthInput,birthDate:'1993-01-03'},birthSourceRef});
 await assert.rejects(()=>assertReportSubjectBinding({presentation:swapped,expectedBinding}),/MISMATCH/);negativeTests.push({name:'valid-overlay-from-different-birth-input',result:'REJECTED'});
 const file=`${dir}/${locale}.json`,htmlPath=`tools/review/BAZI-CONTROLLED-SUBJECT-R1-${locale}.html`;
 write(file,{scope:'SUBJECT_BINDING_PROOF_ONLY_NOT_NEW_EDITORIAL_ACCEPTANCE',reading,readingReceipt,publicationIR,expectedBinding,presentation,snapshot,snapshotReceipt,negativeTests});
 fs.writeFileSync(htmlPath,`<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>BaZi Controlled Subject Proof</title><style>${css}\nbody{margin:0;background:#e8e5de}</style><main>${renderPublicationReport(snapshot)}</main><script type="module">${runtime}</script></html>`);
 artifacts.push({locale,path:htmlPath,evidencePath:file,subjectBindingVerified:true,snapshotDigest:snapshotReceipt.snapshotDigest,artifactDigest:createHash('sha256').update(fs.readFileSync(htmlPath)).digest('hex'),negativeTests});
}
write(dir+'/proof.json',{workId:'BAZI-CONTROLLED-SUBJECT-BINDING-R1',status:'POSITIVE_AND_NEGATIVE_BINDING_PASS',historicalSubjectBindingVerified:false,controlledSubjectBindingVerified:true,calculationReceipt,artifacts,release:{channel:'LOCAL_CONTROLLED_REVIEW',released:true,customerProductionRelease:false,authenticatedCommerceE2E:false},limitation:'Uses existing 26-page source-bound projection for a different controlled chart. It neither replaces nor grants editorial acceptance to the frozen 38-page historical report.',productionAdmissionGranted:false});
fs.writeFileSync('tools/review/BAZI-CONTROLLED-SUBJECT-R1-REVIEW.html',`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><title>BaZi Controlled Subject Binding Proof</title><style>body{max-width:1000px;margin:40px auto;background:#f7f3e9;color:#243742;font:17px/1.8 system-ui}section{padding:24px;border:1px solid #cbb78b;margin:20px 0}code{overflow-wrap:anywhere}a{margin-right:24px}</style><h1>BaZi 受控主体绑定证明</h1><p>新受控主体 · 正向绑定通过 · 每种语言六项负向拒绝 · 历史 38 页样本保持未绑定且不改动。</p><section><h2>同一条来源链</h2><p>Governed canonical person / birth input → 真实 BaZi 计算 → native reading → Publication IR → canonical subject presentation → local review snapshot</p><p>Subject: <code>${accountPerson.personId}</code></p><p>Birth input fingerprint: <code>${canonicalBirthInputFingerprint}</code></p><p>Calculation: <code>${calculationReceipt.projectionId}</code></p></section><section><h2>独立审阅产物</h2>${artifacts.map(a=>`<a href="${a.path.split('/').pop()}">${a.locale==='en'?'English':'中文'} · 26 pages</a>`).join('')}<p>这是当前动态读取链的受控技术证明，不替换已冻结的 38 页参考报告，不代表客户生产发布或 commerce E2E 通过。</p></section><section><h2>负向验证</h2><ul>${artifacts[0].negativeTests.map(t=>`<li>${t.name}: ${t.result}</li>`).join('')}</ul></section><p><a href="../../${dir}/proof.json">机器证明清单</a><a href="../../${dir}/validation.json">独立重放与浏览器验证</a></p></html>`);
console.log('PASS: real governed calculation → reading → Publication IR → canonical cover owner → 26-page controlled review; both locales, 6 negative binding cases each.');
