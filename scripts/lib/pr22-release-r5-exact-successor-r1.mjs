import {assertPublicHdrVocabulary} from '../../functions/method-production-activation/hdr-boundary-runtime.js';
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {parseHTML} from 'linkedom';
const sha=b=>createHash('sha256').update(b).digest('hex'),PATH="content/web/homepage/pr22-release-r5-exact-successor-r1.json",EXPECTED="d795e5e2034bc2832a567ea29a91a91aaeff1ca8314fc3c25d871979a3cf4b18";
export function readReleaseR5(recordBytes=fs.readFileSync(PATH)){assert.equal(sha(recordBytes),EXPECTED,'RELEASE_R5_RECORD_DRIFT');const r=JSON.parse(recordBytes);assert.equal(r.schema,'PR22_RELEASE_R5_EXACT_SUCCESSOR_R1');for(const v of Object.values(r.boundaries))assert.equal(v,false);assert.equal(new Set(r.rows.map(x=>x.path)).size,r.rows.length);return r;}
const TRUSTED_RELEASE=readReleaseR5();
export function releaseR5Predecessor(file,bytes,{readCurrent=p=>fs.readFileSync(p),recordBytes}={}){bytes=r5CurrentBoundaryBytes(file,bytes,'RELEASE_R5_PHYSICAL_DRIFT');const currentRead=readCurrent;readCurrent=p=>r5CurrentBoundaryBytes(p,currentRead(p),'RELEASE_R5_PHYSICAL_DRIFT');const r=recordBytes?readReleaseR5(recordBytes):TRUSTED_RELEASE,row=r.rows.find(x=>x.path===file);if(!row)return bytes;assert.equal(sha(readCurrent(file)),row.afterSHA256,'RELEASE_R5_PHYSICAL_DRIFT:'+file);const before=Buffer.from(row.beforeBytesBase64,'base64');assert.equal(sha(before),row.beforeSHA256,'RELEASE_R5_ARCHIVE_DRIFT:'+file);return sha(bytes)===row.afterSHA256?before:bytes;}
export function validateReleaseR5({readCurrent=p=>fs.readFileSync(p),recordBytes}={}){const currentRead=readCurrent;readCurrent=p=>r5CurrentBoundaryBytes(p,currentRead(p),'RELEASE_R5_PHYSICAL_DRIFT');const r=readReleaseR5(recordBytes);for(const x of r.protected)assert.equal(sha(r5CurrentBoundaryBytes(x.path,currentRead(x.path),'RELEASE_R5_PROTECTED_DRIFT')),x.sha256,'RELEASE_R5_PROTECTED_DRIFT:'+x.path);for(const x of r.rows){assert.equal(sha(readCurrent(x.path)),x.afterSHA256,'RELEASE_R5_PHYSICAL_DRIFT:'+x.path);const before=Buffer.from(x.beforeBytesBase64,'base64');assert.equal(sha(before),x.beforeSHA256);if(x.inverseHunks){let text=readCurrent(x.path).toString();for(const op of [...x.inverseHunks].reverse()){assert.equal(text.split(op.after).length,2);text=text.replace(op.after,op.before);}assert(Buffer.from(text).equals(before),'RELEASE_R5_EXTRA_HUNK:'+x.path);}}const d=parseHTML(readCurrent('index.html').toString()).document;assert.equal(d.querySelectorAll('main h1').length,1);assert.deepEqual([...d.querySelectorAll('[data-cx-home-section]')].map(x=>x.dataset.cxHomeSection),Array.from({length:10},(_,i)=>'H'+String(i+1).padStart(2,'0')));assert.equal(d.querySelectorAll('[data-cir-form]').length,0,'HOMEPAGE_ASK_MUST_REMAIN_CLOSED');for(const id of ['r3-continue','r3-support','six-perspectives'])assert(d.getElementById(id));for(const s of ['personal','family','team','business','institution','country'])assert(d.querySelector('a[href="/subjects/'+s+'/"]'));assert(d.querySelector('a[href="/account/"]'));assert(d.querySelector('a[href="/books/"]'));assert.doesNotMatch(readCurrent('assets/js/public-shell.js').toString(),/localStorage[^\n]*(?:entitlement|membership)/i);return r;}
export function registeredR5AssertionDocument(document){validateReleaseR5();const raw=fs.readFileSync('index.html');if(document.toString()!==parseHTML(raw.toString()).document.toString())return document;return parseHTML(releaseR5Predecessor('index.html',raw).toString()).document;}
export const R5_HDR_PATHS=Object.freeze({catalog:'content/web-production/px2/successors/public-method-catalog-v6.json',methods:'content/professional/method-production-activation/registries/method-registry-v2.json',freeze:'content/professional/core-method-runtime/hdr-production-freeze-v1.json',manifest:'content/professional/core-method-runtime/hdr-runtime-manifest-v1.json',vocabulary:'content/professional/method-production-activation/registries/mpa-hdr-public-vocabulary-boundary-v1.json',target:'perspectives/personal/human-design/index.html'});
export function assertR5HdrPublicPolicy({catalog,methodRegistry,hdrFreeze,hdrManifest}){
 const entry=catalog.methods.find(x=>x.methodCode==='HUMAN_DESIGN'),method=methodRegistry.methods.find(x=>x.methodCode==='HUMAN_DESIGN');assert(entry&&method,'R5_HDR_POLICY_MISSING');
 assert.equal(entry.label,'Human Design');assert.equal(entry.labelZh,'人类图');assert.equal(entry.route,'/perspectives/personal/');assert.equal(entry.publicState,'AVAILABLE_WITH_CONFIRMED_EXTERNAL_CHART','R5_HDR_EXTERNAL_CHART_REQUIRED');assert.equal(entry.executionMode,'CUSTOMER_SUPPLIED_EXTERNAL_CHART','R5_HDR_EXTERNAL_CHART_ONLY');assert.match(entry.boundary,/does not claim official BodyGraph birth-calculation authority/i);
 assert.equal(method.state,'BLOCKED','R5_HDR_INTERNAL_STATE_BLOCKED');assert.equal(method.productionEligible,false);assert.equal(method.professionalEligible,false);assert.equal(hdrFreeze.executionMode,'validation_only');assert.equal(hdrFreeze.productionGates.productionExecutionAllowed,false,'R5_HDR_PRODUCTION_CALCULATION_FORBIDDEN');assert.equal(hdrFreeze.productionGates.professionalReleaseAllowed,false);assert.equal(hdrManifest.activation.productionEligible,false);assert.equal(hdrManifest.activation.professionalReleaseActivated,false);return true;
}
export function validateR5HdrIntroduction({readCurrent=p=>fs.readFileSync(p)}={}){
 const record=validateReleaseR5({readCurrent}),scope=record.r5HdrVocabularySuccessor,row=record.rows.find(x=>x.path==='index.html');assert.equal(scope.sourceAfterSHA256,row.afterSHA256);assert.equal(scope.predecessorSHA256,row.beforeSHA256);assert.equal(scope.entryRoute,'/perspectives/personal/human-design/');assert.equal(scope.internalHdrActivationGranted,false);assert.equal(scope.publicBirthCalculationGranted,false);assert.equal(scope.rightsOrLicenseGranted,false);
 const json=p=>JSON.parse(readCurrent(p));assertR5HdrPublicPolicy({catalog:json(R5_HDR_PATHS.catalog),methodRegistry:json(R5_HDR_PATHS.methods),hdrFreeze:json(R5_HDR_PATHS.freeze),hdrManifest:json(R5_HDR_PATHS.manifest)});
 const home=parseHTML(readCurrent('index.html').toString()).document,labels=[...home.querySelectorAll('[data-cx-home-section="H06"] h3')].filter(x=>x.getAttribute('data-cx-en')==='Human Design');assert.equal(labels.length,1,'R5_HDR_ONE_REGISTERED_INTRODUCTION');const label=labels[0];assert.equal(label.getAttribute('data-cx-zh'),'人类图');const card=label.closest('article.r5-card');assert(card,'R5_HDR_REGISTERED_CARD_REQUIRED');const links=card.querySelectorAll('a');assert.equal(links.length,1);assert.equal(links[0].getAttribute('href'),scope.entryRoute,'R5_HDR_REGISTERED_TARGET_ONLY');assert(readCurrent(R5_HDR_PATHS.target).length>0,'R5_HDR_REAL_TARGET_REQUIRED');
 label.remove();assertPublicHdrVocabulary({text:home.toString(),restrictedTerms:json(R5_HDR_PATHS.vocabulary).restrictedTerms});return true;
}
export function r5HdrVocabularyPredecessor(file,bytes,{readCurrent=p=>fs.readFileSync(p)}={}){
 if(file!=='index.html')return bytes;
 validateR5HdrIntroduction({readCurrent});const row=TRUSTED_RELEASE.rows.find(x=>x.path===file);assert.equal(sha(bytes),row.afterSHA256,'R5_W24_INPUT_DRIFT');const historical=releaseR5Predecessor(file,bytes,{readCurrent});assert.equal(sha(historical),row.beforeSHA256,'R5_W24_PREDECESSOR_DRIFT');assertPublicHdrVocabulary({text:historical.toString(),restrictedTerms:JSON.parse(readCurrent(R5_HDR_PATHS.vocabulary)).restrictedTerms});return historical;
}
export function bookR5PublicAssetsPredecessor(file,bytes,{readCurrent=p=>fs.readFileSync(p),consumer='scripts/check-book-w1f-wpr-successor-current.mjs'}={}){
 const scope=TRUSTED_RELEASE.bookR5PublicAssetsSuccessor;if(file!==scope.path)return bytes;
 assert(scope.consumers.includes(consumer),'BOOK_R5_UNREGISTERED_CONSUMER');validateReleaseR5({readCurrent});assert.equal(scope.consumer,'scripts/check-book-w1f-wpr-successor-current.mjs');assert.equal(sha(readCurrent(file)),scope.afterSHA256,'BOOK_R5_PHYSICAL_DRIFT');assert.equal(sha(bytes),scope.afterSHA256,'BOOK_R5_UNREGISTERED_INPUT');const before=Buffer.from(scope.beforeBytesBase64,'base64');assert.equal(sha(before),scope.beforeSHA256,'BOOK_R5_ARCHIVE_DRIFT');const prior=JSON.parse(before),current=JSON.parse(bytes),expected=structuredClone(prior);assert.deepEqual(scope.addedRecords.map(x=>x.asset_code),['PHIOS-HERO-HOMEPAGE-D-v1','PHIOS-HERO-HOMEPAGE-M-v1']);expected.assets.push(...scope.addedRecords);for(const key of ['registeredAssetRecords','concreteRenderableMembers','canonicalHeroMembers'])expected.summary[key]+=2;assert.deepEqual(current,expected,'BOOK_R5_ONLY_EXISTING_TWO_HERO_RECORDS');return before;
}

// Current pure-request checker reception: exact memory-only inverse for the
// protected checker file. Product Home/Hero/router checks remain unchanged.
export function currentR5ProtectedCheckerPredecessor(file,bytes){
 bytes=currentBookW16CheckerPredecessor(file,currentIChingParentSourcePredecessor(file,currentBzrSharedPredecessor(file,currentCountryScenarioPredecessor(file,currentCountryPublicGatePredecessor(file,bytes)))));
 if(file!=='scripts/lib/public-customer-report-convergence-successor-r1.mjs')return bytes;
 const expected=TRUSTED_RELEASE.rows.find(x=>x.path===file)?.afterSHA256;
 assert(expected,'CURRENT_R5_CHECKER_NOT_PROTECTED');if(sha(bytes)===expected)return bytes;
 assert.equal(sha(bytes),'36b612fce20a0c1cf4dd5c471a862edcf3c182427da613100f194b74a6f4c09f','CURRENT_R5_CHECKER_UNKNOWN_DELTA');
 let text=bytes.toString('utf8');const prefix="import {prepareOpenAIStructuredRequest} from '../../functions/personal-reading/narrative/narrative-provider.js';\n";
 assert(text.startsWith(prefix),'CURRENT_R5_CHECKER_IMPORT_DELTA');text=text.slice(prefix.length);
 const marker='\n// Current Owner-received pure extraction;';assert.equal(text.split(marker).length,2,'CURRENT_R5_CHECKER_TAIL_COUNT');text=text.slice(0,text.indexOf(marker));
 const currentCall="const convergenceChildBytes=(path,bytes)=>zwrChildBytes(path,bzrPublicFidelityPredecessor(path,hdPrivateDecorationPredecessor(path,auditPublicPredecessor(path,currentNarrativePreparationPredecessor(path,bytes)))));",priorCall="const convergenceChildBytes=(path,bytes)=>zwrChildBytes(path,bzrPublicFidelityPredecessor(path,hdPrivateDecorationPredecessor(path,auditPublicPredecessor(path,bytes))));";
 assert.equal(text.split(currentCall).length,2,'CURRENT_R5_CHECKER_CALL_COUNT');text=text.replace(currentCall,priorCall);
 const previous=Buffer.from(text,'utf8');assert.equal(sha(previous),expected,'CURRENT_R5_CHECKER_EXACT_INVERSE_FAILED');return previous;
}

// Exact current BZR chart-only reception. Historical consumers see original
// Main shared bytes only after current full bytes and every inverse hunk prove.
const currentBzrSharedHunks=[
  {
    "file": "assets/customer-ui/js/surfaces/method-native-intake-r2.js",
    "before": "070db38ab4d3053f4d700fc5030aa7dfd0963f919cbd6ef91e10e6da2eacd116",
    "after": "cd383e2f0d1c40ac13fe70c252e925232ff824b34f0ff70fbf0094384ea4d353",
    "hunks": [
      {
        "before": "",
        "after": "   if(slug==='bazi'&&form.elements.reportSubjectName){form.elements.reportSubjectName.required=false;const label=form.elements.reportSubjectName.closest('label')?.querySelector('span');if(label){label.dataset.cxEn='Display name (optional)';label.dataset.cxZh='显示姓名（选填）';}}\n"
      }
    ]
  },
  {
    "file": "functions/_lib/stateless-free-request-r3.js",
    "before": "fb5cbf904ddadf40ce87448eac8a45aadaa699f0ce4c33aef30e3bbf53634c06",
    "after": "bc25115ad0aab0dca5ca5518c7cecb87a7cbf549ba8ce828b84604dc35ae4a2e",
    "hunks": [
      {
        "before": "",
        "after": "import {baziFreeChartRequest,baziFreeChartCapability} from './bazi-free-chart-contract.js';\n"
      },
      {
        "before": "      !['/api/location-resolve','/api/customer-contextual-ask',...symbolicPaths].includes(url.pathname)) return null;\n",
        "after": "      !['/api/location-resolve','/api/customer-contextual-ask','/api/method-reading/bazi',...symbolicPaths].includes(url.pathname)) return null;\n"
      },
      {
        "before": "",
        "after": "  if(url.pathname==='/api/method-reading/bazi')return baziFreeChartCapability(env)&&baziFreeChartRequest(body)?'BAZI_FREE_CHART':null;\n"
      }
    ]
  },
  {
    "file": "functions/api/method-reading/[method].js",
    "before": "cdf2d22da76c75c69bdca5f2bacd5dfa4dd4718d732c7fa68aafd527772a81c0",
    "after": "d8c49744e747a0d1104cedba217be3801c4b8af027a4f5067c706de8391a9b9d",
    "hunks": [
      {
        "before": "",
        "after": "import {onRequestPost as pureBaziFree} from '../../personal-professional-reading/bazi-free-chart-request.js';\nimport {baziFreeChartCapability} from '../../_lib/bazi-free-chart-contract.js';\n"
      },
      {
        "before": "export const onRequestPost=scopedMethodReadingR2(owner);\n",
        "after": "export const onRequestPost=scopedMethodReadingR2(context=>context.params?.method==='bazi'?pureBaziFree(context):owner(context));\n"
      },
      {
        "before": "export async function onRequestGet(context){const slug=context.params?.method;if(!['bazi','ziwei','astrology','numerology','human-design','phi-configuration'].includes(slug))return Response.json({ok:false,error:'METHOD_ROUTE_INVALID'},{status:404});const mode=context.env?.PHIOS_D1_MAINTENANCE_MODE;return Response.json({ok:true,method:slug,submissionStatus:mode==='OFF'?'OWNER_CHECK_REQUIRED':'TEMPORARILY_UNAVAILABLE'},{headers:{'cache-control':'no-store'}});}\n",
        "after": "export async function onRequestGet(context){const slug=context.params?.method;if(!['bazi','ziwei','astrology','numerology','human-design','phi-configuration'].includes(slug))return Response.json({ok:false,error:'METHOD_ROUTE_INVALID'},{status:404});const mode=context.env?.PHIOS_D1_MAINTENANCE_MODE;return Response.json({ok:true,method:slug,submissionStatus:slug==='bazi'?(baziFreeChartCapability(context.env)?'OWNER_CHECK_REQUIRED':'TEMPORARILY_UNAVAILABLE'):(mode==='OFF'?'OWNER_CHECK_REQUIRED':'TEMPORARILY_UNAVAILABLE')},{headers:{'cache-control':'no-store'}});}\n"
      }
    ]
  }
];
export function currentBzrSharedPredecessor(file,bytes){
 bytes=currentBaziDraftPredecessor(file,bytes);
 const row=currentBzrSharedHunks.find(x=>x.file===file);if(!row)return bytes;
 if(sha(bytes)===row.before)return bytes;
 // The existing AUDIT consumer may re-enter with its exact pre-Ask bytes.
 // Admit only that immutable registered input, while proving physical BZR current.
 if(file==='functions/_lib/stateless-free-request-r3.js'&&sha(bytes)!==row.after){
  const auditBytes=fs.readFileSync('content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/AUDIT-R2-PUBLIC34-RECEIVER-R2.json');
  assert.equal(sha(auditBytes),'f0c9c4175b2dd850e9e71ab09b200ffc9de0a98e3f49398e1a5a2463e44c7871','CURRENT_BZR_AUDIT_RECORD_DRIFT');
  const audit=JSON.parse(auditBytes).paths.find(x=>x.path===file);
  assert.equal(audit.sha256,row.before,'CURRENT_BZR_AUDIT_PARENT_MISMATCH');
  if(sha(bytes)===audit.previousSHA256){assert.equal(sha(fs.readFileSync(file)),row.after,'CURRENT_BZR_SHARED_PHYSICAL_DRIFT:'+file);return bytes;}
 }
 assert.equal(sha(bytes),row.after,'CURRENT_BZR_SHARED_UNKNOWN_DELTA:'+file);
 let text=bytes.toString('utf8');for(const h of row.hunks.toReversed()){
  assert.equal(text.split(h.after).length,2,'CURRENT_BZR_SHARED_INVERSE_HUNK:'+file);text=text.replace(h.after,h.before);
 }
 const previous=Buffer.from(text,'utf8');assert.equal(sha(previous),row.before,'CURRENT_BZR_SHARED_FULL_PREDECESSOR:'+file);return previous;
}

// Current IChing checker-input reception, physical-byte proof at the existing
// release reader. No old source file or historical module is executed/restored.
export function currentIChingParentSourcePredecessor(file,bytes){
 if(file!=='scripts/lib/iching-current-parent-successor-r1.mjs')return bytes;
 const old='6fb2e665227f88f83473d95a31344bd6a551143001b5f0e901155f06bc555b65',current='8896e06c9fc7b037185ff3856fa111bd99ea39f7b4feab4d2291a6c1eaf94a5d';
 if(sha(bytes)===old)return bytes;
 // Existing readability may re-enter with its registered earlier input.
 if(sha(bytes)==='7b1504beb496afa8b533346eb555e960a92a7276cf0492ee38b999aa464fcdc0'){
  const r=fs.readFileSync('content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/PUBLIC-READABILITY-SOURCE-SUCCESSOR-R1.json');assert.equal(sha(r),'572bfdaab2f94671b28a886b923ae93edb1e45ad15e5b152fbf7860d31f0ae69');const row=JSON.parse(r).inputs.find(x=>x.path===file);assert.equal(row.afterSHA256,old);assert.equal(row.beforeSHA256,sha(bytes));assert.equal(sha(fs.readFileSync(file)),current,'CURRENT_ICHING_PARENT_PHYSICAL_DRIFT');return bytes;
 }
 assert.equal(sha(bytes),current,'CURRENT_ICHING_PARENT_UNKNOWN_DELTA');let text=bytes.toString('utf8');
 const prefix="import {currentNarrativePreparationPredecessor} from './public-customer-report-convergence-successor-r1.mjs';\nimport {currentBzrSharedPredecessor} from './pr22-release-r5-exact-successor-r1.mjs';\n";
 assert(text.startsWith(prefix),'CURRENT_ICHING_PARENT_IMPORTS');text=text.slice(prefix.length);
 const marker='\n// This checker-only current replacement removes one obsolete snapshot assertion;';assert.equal(text.split(marker).length,2,'CURRENT_ICHING_PARENT_TAIL');text=text.slice(0,text.indexOf(marker));
 for(const [after,before]of [
  ['currentNarrativePreparationPredecessor(p,currentBzrSharedPredecessor(p,currentIChingCheckerSource(p,rawRead(p))))','rawRead(p)'],
  ['currentNarrativePreparationPredecessor(file,currentBzrSharedPredecessor(file,bytes))','bytes']
 ]){assert.equal(text.split(after).length,2,'CURRENT_ICHING_PARENT_HOOK_CARDINALITY');text=text.replace(after,before);}
 const previous=Buffer.from(text);assert.equal(sha(previous),old,'CURRENT_ICHING_PARENT_EXACT_INVERSE');return previous;
}

// Exact received Unknown future-range boundary; source admission is unchanged.
export function currentCountryScenarioPredecessor(file,bytes){
 if(file!=="functions/customer-projection/codex3-public-answer.js")return bytes;
 const before="e39e9ae8a1bd1c65743fb5fb2e8bdc2447c53a6e2bb827bb2af7b927d171c166",after="cdeac0a7bd5b9dc5e7b29b0766b9671f2a6518f186a66d759d5b05423eaf1c0a";
 if(sha(bytes)===before)return bytes;assert.equal(sha(bytes),after,'CURRENT_COUNTRY_SCENARIO_UNKNOWN_DELTA');
 let text=bytes.toString('utf8');const hunks=[{"before":"  if(!definition)return null;\n","after":"  const period=parsed.requestedPeriod;\n  const scenarioRange=period?.kind==='YEAR_RANGE'&&Number.isInteger(period.start)&&Number.isInteger(period.end)&&period.end>period.start&&(period.end>new Date().getUTCFullYear()||/future|scenario|might|could|outlook|未来|未來|情景|可能/i.test(question));\n  if(!definition&&!scenarioRange)return null;\n"},{"before":"","after":"   if(scenarioRange)return make({paragraphs:[\n    t('For ','对于 ')+(parsed.resolvedCountryName||parsed.resolvedCountryCode)+' · '+period.start+'–'+period.end+t(', how the country will change remains Unknown here; I cannot provide a verified outlook from the currently available evidence.','，这里尚不能根据现有证据核实国家将如何变化；具体结果仍为未知。'),\n    t('Historical observations describe measured past periods; current facts need a stated source date. The registered country source is not admitted for a numerical answer here, so no values or trend have been substituted.','历史观测说明已经测量的过去期间，当前事实需要明确的来源日期。已登记国家来源尚未获准在此提供数值答案，因此没有代入数值或趋势。'),\n    t('A future scenario would be conditional on explicit assumptions, not an observed fact or a guaranteed forecast. No scenario or future GDP has been calculated.','未来情景取决于明确假设，不是观测事实或保证实现的预测；这里没有计算情景或未来GDP。'),\n    t('Next, review the country source coverage in World and choose a measure such as GDP, population, employment or inflation, together with the period and assumptions you want to compare.','下一步可在World核对该国家的来源覆盖，再选定GDP、人口、就业或通胀等指标，以及要比较的期间与假设。')\n   ],sources:[{label:t('Country source version and publication boundary','国家来源版次与准入边界'),href:'/'+meta.snapshotPath,sourceVersion:meta.sha256}],state:'INSUFFICIENT',binding:{country:parsed.resolvedCountryCode,requestedPeriod:{start:period.start,end:period.end},sourceVersion:meta.sha256,publicationStatus:meta.publicationStatus,currentnessClaimed:false,scenarioCalculated:false,futureValuesSupplied:false},limits:[t('Public country evidence does not establish your household or business situation; this is not investment advice.','公共国家证据不证明你的家庭或企业情况，也不是投资建议。')],next:{href:'/world/',label:t('Review country sources and choose a measure','核对国家来源并选择指标')},mode:'PUBLIC_COUNTRY_SCENARIO_BOUNDARY'});\n"}];
 for(const h of hunks.toReversed()){assert.equal(text.split(h.after).length,2,'CURRENT_COUNTRY_SCENARIO_HUNK');text=text.replace(h.after,h.before);}
 const previous=Buffer.from(text,'utf8');assert.equal(sha(previous),before,'CURRENT_COUNTRY_SCENARIO_CRLF_INVERSE');return previous;
}

// Exact received BZR-only page draft privacy successor, before existing shared inverse.
export function currentBaziDraftPredecessor(file,bytes){
 if(file!=='assets/customer-ui/js/surfaces/method-native-intake-r2.js')return bytes;
 const before='cd383e2f0d1c40ac13fe70c252e925232ff824b34f0ff70fbf0094384ea4d353';
 if(sha(bytes)===before||sha(bytes)==='070db38ab4d3053f4d700fc5030aa7dfd0963f919cbd6ef91e10e6da2eacd116')return bytes;
 assert.equal(sha(bytes),'166dd4a7151711cd13f129fc8515756a5e7765f3dd3fc680582eb2a397247ae8','CURRENT_BAZI_DRAFT_UNKNOWN_DELTA');
 let text=bytes.toString('utf8');const start=text.indexOf('function prepareBaziFreeForm(form){'),end=text.indexOf('export function installMethodNativeIntakeR2',start);
 assert(start>=0&&end>start,'CURRENT_BAZI_DRAFT_FUNCTION_REQUIRED');assert.equal(text.split('function prepareBaziFreeForm(form){').length,2);
 text=text.slice(0,start)+text.slice(end);const call="   if(slug==='bazi')prepareBaziFreeForm(form);\n";assert.equal(text.split(call).length,2,'CURRENT_BAZI_DRAFT_CALL_REQUIRED');text=text.replace(call,'');const previous=Buffer.from(text);assert.equal(sha(previous),before,'CURRENT_BAZI_DRAFT_EXACT_INVERSE');return previous;
}

// Exact checker-only W15 payload retirement, preserving its original W16 source.
export function currentBookW16CheckerPredecessor(file,bytes){
 if(file!=="scripts/check-book-v-w16-brand-source-successor-r1.mjs")return bytes;
 const before="c511edd623c2c5edd0266b31d0ff7c8af39b3dbeb812556c9a4bc1695edad8cb",after="2fcf6ade613ee96556969e2703eaa83d57e9a51e16cf1c36b9a4f211784469b3";if(sha(bytes)===before)return bytes;
 assert.equal(sha(bytes),after,'CURRENT_BOOK_W15_CHECKER_UNKNOWN_DELTA');let text=bytes.toString('utf8');const tail="\n// Owner Override 2026-11-26: retire only the old W15 review JSON dependency.\nexport function currentBookW16View(source){\n const retired=\"const decision=json('tools/review/BOOK-V-CIV-ATLAS-R1-W15-HUMAN-DECISION.json');\\nassert.equal(decision.status,'HUMAN_ACCEPTED');\\nassert.equal(decision.reviewerDeclaration,'USER_EXPLICIT_ALL_HUMAN_ACCEPTED');\\nassert.deepEqual(decision.requiredViewports,[360,768,1440]);\\nassert.equal(decision.dimensions.length,11);\\nassert.ok(decision.dimensions.every(x=>x.status==='ACCEPTED'));\\n\\n\",replacement=\"// Current registered Human acceptance survives retirement of the old review payload.\\nconst recordedHumanAudit=json('content/civilization-atlas/audits/book-v-civ-atlas-r1-w15-acceptance-v1.json');\\nassert.equal(recordedHumanAudit.status,'HUMAN_ACCEPTED');\\nassert.equal(recordedHumanAudit.w16BlockedUntil,'SATISFIED_HUMAN_ACCEPTED');\\nassert.deepEqual(recordedHumanAudit.viewports,[360,768,1440]);\\nassert.equal(recordedHumanAudit.acceptedAt,'2026-09-11');\\nassert.equal(recordedHumanAudit.acceptedAgainstCommit,'d7d3a82b6fec2c48033fac346030702928065eb7');\\nassert.equal(freeze.admission.w15Human,'HUMAN_ACCEPTED');\\nassert.equal(freeze.admission.humanDecision,recordedHumanAudit.humanDecision);\\nassert.match(freeze.admission.humanAcceptanceNote,/Reviewer explicitly declared all human accepted on 2026-09-11/);\\n// The retired eleven-dimension payload is not reconstructed or newly accepted.\\nassert(fs.readFileSync(path.join(root,'books/reality-differentiation/index.html')).length>0,'CURRENT_BOOK_V_PUBLICATION_PAGE_REQUIRED');\\n\\n\";\n assert.equal(source.split(retired).length,2,'BOOK_W15_DECISION_BLOCK_EXACT');let view=source.replace(retired,replacement);\n const loop='for(const f of freeze.frozenFiles){';assert.equal(view.split(loop).length,2,'BOOK_W15_FROZEN_LOOP_EXACT');\n view=view.replace(loop,loop+\"\\n  if(f.path==='tools/review/BOOK-V-CIV-ATLAS-R1-W15-HUMAN-DECISION.json'){assert.equal(f.sha256,'19230a9a3aac22e8ad943769d214c5149f50e2af8cdb28e5a183baaf528f9382');continue;} // retired QA payload only\");\n return view;\n}\n";
 assert(text.endsWith(tail),'CURRENT_BOOK_W15_CHECKER_TAIL');text=text.slice(0,-tail.length);
 const current='input:currentBookW16View(createBookW16CurrentView())',prior='input:createBookW16CurrentView()';assert.equal(text.split(current).length,2,'CURRENT_BOOK_W15_CHECKER_CALL');text=text.replace(current,prior);
 const previous=Buffer.from(text);assert.equal(sha(previous),before,'CURRENT_BOOK_W15_CHECKER_EXACT_INVERSE');return previous;
}

// Historical source-reader reception only. Runtime imports and anti-leak tests
// execute the true current modules; these exact inverses never authorize data.
const countryPublicGateHunks=[
  {
    "path": "functions/_lib/final-release-scope.js",
    "beforeSHA256": "9209f8dbd739691810edbaba07589af159c31ffc633da94da7cc9a510b19fab7",
    "afterSHA256": "a6592e43c8fff7c126560c7c16dbc700f633fd994d4123a944206774ebdacdf8",
    "ops": [
      {
        "before": "finalInternalPath(pathname){const p=finalReleasePath(pathname);return p===null||financialQa",
        "after": "rawWorldSnapshotPath(pathname){const p=finalReleasePath(pathname);return p!==null&&/^\\/content\\/world\\/world-country-public-evidence-(?:r1|r2-[a-f0-9]{16})\\.json\\/?$/i.test(p);}\nexport function finalInternalPath(pathname){const p=finalReleasePath(pathname);return p===null||financialQaPath(pathname)||rawWorldSnapshot",
        "count": 1
      }
    ]
  },
  {
    "path": "functions/_middleware.js",
    "beforeSHA256": "eda99c06c5a96768a7717721bd2be87621dda06014f5155040717ccf50a00563",
    "afterSHA256": "9d8d2f16e4b9021683b555a4ac2c9730c1589769cd2141a6705697c649e112ad",
    "ops": [
      {
        "before": "",
        "after": ",rawWorldSnapshotPath",
        "count": 1
      },
      {
        "before": "",
        "after": "||rawWorldSnapshotPath(new URL(context.request.url).pathname)",
        "count": 1
      }
    ]
  },
  {
    "path": "functions/customer-projection/codex3-public-answer.js",
    "beforeSHA256": "cdeac0a7bd5b9dc5e7b29b0766b9671f2a6518f186a66d759d5b05423eaf1c0a",
    "afterSHA256": "5f135e091d492f14248dd74586b26f5cc512d5ee2bcc55a45c321c9cd9eecb37",
    "ops": [
      {
        "before": "'+meta.snapshotPath",
        "after": "content/world/world-country-public-evidence-current.json'",
        "count": 2
      }
    ]
  },
  {
    "path": "functions/api/customer-subject-workspace.js",
    "beforeSHA256": "fe22cf398741b71cd6b05aca7d3baf415edb553de3137efeda7c71369d367572",
    "afterSHA256": "b5bad05f3bd90d3cffa8d0349d7999161374959a083bc2472bdb0b7b3d59dbf4",
    "ops": [
      {
        "before": "",
        "after": "if(!u.searchParams.has('publicCountryCatalog')){const engineering=context.env?.PHIOS_WORLD_R2_LOCAL_FACTS==='true'&&['127.0.0.1','localhost','[::1]'].includes(u.hostname);if(!engineering)return reply({ok:false,code:'PUBLIC_COUNTRY_NUMERICAL_ADMISSION_PENDING',subject:body.subject,publicationStatus:body.sourceMeta?.publicationStatus||'UNSPECIFIED',sourceVersion:body.sourceVersion||null,sourceSHA256:body.sourceMeta?.sha256||null,evidenceHref:'/content/world/world-country-public-evidence-current.json',answer:'Unknown',approvedNumericalAnswer:false},503);body.scope='LOCAL_ENGINEERING';body.approvedNumericalAnswer=false;}",
        "count": 1
      }
    ]
  },
  {
    "path": "assets/customer-ui/js/surfaces/profile-country-r1.js",
    "beforeSHA256": "8bf8ce35d31a8d5342a2ca14a85997df005f58d3892325a165ffdf16bd2c94a1",
    "afterSHA256": "2a813c9610fbf7d3dfc71c2aec7864c3da4b6e0e91e3acd2efa785d95e653d22",
    "ops": [
      {
        "before": "YEAR_INVALID'?t('所选年份不在支持范围内。请选择有效统计年或最近可用期间；未自动替换年份。','The selected year is outside the supported range. Choose a valid statistical year or the latest available period; no year was substituted.'):error==='COUNTRY_IDENTITY_UNKNOWN'?t('国家身份未确认，请选择有效国家；没有自动改用其他国家。','Country identity is unconfirmed. Choose a valid country; no substitute is selected.'):t('来源暂不可用，未用其他国家或估计值代替。请重试。','Sources unavailable; no other country or estimated value was substituted. Retry.'))+'</p>",
        "after": "PUBLIC_COUNTRY_NUMERICAL_ADMISSION_PENDING'?t('国家数值尚未获准用于此公开入口，当前答案为未知；可先阅读历史来源与缺口。','Country numerical answers are not admitted at this public entrance. The answer is Unknown; historical sources and gaps remain available.'):error==='YEAR_INVALID'?t('所选年份不在支持范围内。请选择有效统计年或最近可用期间；未自动替换年份。','The selected year is outside the supported range. Choose a valid statistical year or the latest available period; no year was substituted.'):error==='COUNTRY_IDENTITY_UNKNOWN'?t('国家身份未确认，请选择有效国家；没有自动改用其他国家。','Country identity is unconfirmed. Choose a valid country; no substitute is selected.'):t('来源暂不可用，未用其他国家或估计值代替。请重试。','Sources unavailable; no other country or estimated value was substituted. Retry.'))+'</p>'+(error==='PUBLIC_COUNTRY_NUMERICAL_ADMISSION_PENDING'?'<a data-cp-world href=\"'+worldLink(selected,true)+'\">'+t('历史来源与缺口','Historical sources and gaps')+'</a>':'')+'",
        "count": 1
      }
    ]
  }
];
export function currentCountryPublicGatePredecessor(file,bytes){
 const row=countryPublicGateHunks.find(x=>x.path===file);if(!row)return bytes;
 if(sha(bytes)===row.beforeSHA256)return bytes;
 if(file==='functions/customer-projection/codex3-public-answer.js'&&sha(bytes)==='e39e9ae8a1bd1c65743fb5fb2e8bdc2447c53a6e2bb827bb2af7b927d171c166')return bytes;
 if(['functions/_middleware.js','assets/customer-ui/js/surfaces/profile-country-r1.js'].includes(file)&&sha(bytes)!==row.afterSHA256){
  const raw=fs.readFileSync('content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/AUDIT-R2-PUBLIC34-RECEIVER-R2.json');assert.equal(sha(raw),'f0c9c4175b2dd850e9e71ab09b200ffc9de0a98e3f49398e1a5a2463e44c7871');const audit=JSON.parse(raw).paths.find(x=>x.path===file);assert.equal(audit.sha256,row.beforeSHA256);
  if(sha(bytes)===audit.previousSHA256){assert.equal(sha(fs.readFileSync(file)),row.afterSHA256,'CURRENT_COUNTRY_PUBLIC_GATE_PHYSICAL_DRIFT');return bytes;}
  if(file==='assets/customer-ui/js/surfaces/profile-country-r1.js'){
   const registered=fs.readFileSync('content/civilization-atlas/maintenance/unified-country-consumer-reception-r1-successor.json');assert.equal(sha(registered),'55c4f46fd9630a1782d4b666e71d40d4db51bf435054f00a5361db330879e9be');const prior=JSON.parse(registered).changes.find(x=>x.path===file);assert.equal(prior.successorSHA256,audit.previousSHA256);
   if(sha(bytes)===prior.predecessorSHA256){assert.equal(sha(fs.readFileSync(file)),row.afterSHA256,'CURRENT_COUNTRY_PUBLIC_GATE_PHYSICAL_DRIFT');return bytes;}
  }
 }
 assert.equal(sha(bytes),row.afterSHA256,'CURRENT_COUNTRY_PUBLIC_GATE_UNKNOWN_DELTA:'+file);let text=bytes.toString('utf8');
 for(const op of row.ops.toReversed()){assert.equal(text.split(op.after).length,op.count+1,'CURRENT_COUNTRY_PUBLIC_GATE_HUNK:'+file);text=text.split(op.after).join(op.before);}
 const previous=Buffer.from(text,'utf8');assert.equal(sha(previous),row.beforeSHA256,'CURRENT_COUNTRY_PUBLIC_GATE_FULL_PREDECESSOR:'+file);return previous;
}

// Preserve the original release reader's error contract without admitting drift.
// Direct current* predecessor calls retain their own precise rejection errors.
function r5CurrentBoundaryBytes(file,bytes,boundary){
 try{return currentR5ProtectedCheckerPredecessor(file,bytes);}
 catch(cause){
  const error=new assert.AssertionError({message:boundary+':'+file,actual:cause?.actual,expected:cause?.expected,operator:cause?.operator||'strictEqual'});
  error.cause=cause;error.sourceDriftMessage=cause?.message||String(cause);
  throw error;
 }
}
