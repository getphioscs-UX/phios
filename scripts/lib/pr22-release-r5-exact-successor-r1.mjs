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
 bytes=currentPublicationCheckerPredecessor(file,bytes);
 bytes=currentFounderCheckerPredecessor(file,currentFounderPositioningPredecessor(file,bytes));
 bytes=currentBuildRoutesPredecessor(file,bytes);
 bytes=currentSubjectCountryCheckerPredecessor(file,bytes);
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

// Historical source proof only: actual tester execution keeps all76 assertions.
export function currentSubjectCountryCheckerPredecessor(file,bytes){
 if(file!=="scripts/check-subject-country-spw-fin-r1.mjs")return bytes;
 const before="dbce87753adfdbc99019e0dae23030ba7f75aef320f066474d6bda75423cdadb";if(sha(bytes)===before)return bytes;
 assert.equal(sha(bytes),"e3018c980bdb78ce2be8828e0ac40b3ef38f1f7cd36699f0283233b35bcd190d",'CURRENT_SUBJECT_COUNTRY_CHECKER_UNKNOWN_DELTA');
 let text=bytes.toString('utf8');const ops=[{"before":"","after":"import {rawWorldSnapshotPath,finalInternalPath} from '../functions/_lib/final-release-scope.js';\n"},{"before":"ASSETS:{fetch:async(input)=>{const u=typeof input==='string'?input:input.url;if(u.includes('evidence-current.json'))return Response.json({schemaVersion:'WORLD_COUNTRY_EVIDENCE_POINTER_V1',owner:'WORLD_EVIDENCE',snapshotPath:'content/world/world-country-public-evidence-r1.json',sha256:createHash('sha256').update(snapshotRaw).digest('hex')});if(u.includes('refresh-status.json'))return Response.json({status:'SUCCESS'});return new Response(snapshotRaw);}},get RUNTIME_DB(){privateReads++;throw Error('PRIVATE_DB_MUST_NOT_RUN');}};const request=(query,options={})=>handler({request:new Request('https://preview.phios-github.pages.dev/api/customer-subject-workspace?'+query,{method:options.method||'GET'}),env:options.env||env}","after":"PHIOS_WORLD_R2_LOCAL_FACTS:'true',ASSETS:{fetch:async(input)=>{const u=typeof input==='string'?input:input.url;if(u.includes('evidence-current.json'))return Response.json({schemaVersion:'WORLD_COUNTRY_EVIDENCE_POINTER_V1',owner:'WORLD_EVIDENCE',snapshotPath:'content/world/world-country-public-evidence-r1.json',sha256:createHash('sha256').update(snapshotRaw).digest('hex')});if(u.includes('refresh-status.json'))return Response.json({status:'SUCCESS'});return new Response(snapshotRaw);}},get RUNTIME_DB(){privateReads++;throw Error('PRIVATE_DB_MUST_NOT_RUN');}};const request=(query,options={})=>handler({request:new Request((options.origin||'http://127.0.0.1')+'/api/customer-subject-workspace?'+query,{method:options.method||'GET'}),env:options.env||env});\nfor(const [name,query,options,status]of [['anonymous public pending','publicCountry=MYS',{origin:'https://qa.invalid'},503],['external flag denied','publicCountry=MYS',{origin:'https://qa.invalid',env},503],['loopback without flag denied','publicCountry=MYS',{env:Object.assign(Object.create(env),{PHIOS_WORLD_R2_LOCAL_FACTS:'false'})},503],['query cannot grant engineering','publicCountry=MYS&PHIOS_WORLD_R2_LOCAL_FACTS=true',{},400],['public catalogue remains available','publicCountryCatalog=1',{origin:'https://qa.invalid'},200]]){const r=await request(query,options),v=await r.json();check(name,()=>assert.equal(r.status,status));if(v.code==='PUBLIC_COUNTRY_NUMERICAL_ADMISSION_PENDING')check(name+' strict pending payload',()=>assert.ok(v.answer==='Unknown'&&v.approvedNumericalAnswer===false&&!v.dimensions&&!v.financial&&!v.countryCoverage&&!v.observationProjection));}\nconst rawEvidence='/content/world/world-country-public-evidence-r2-136b941c00f890aa.json';\nfor(const path of [rawEvidence,rawEvidence+'/',rawEvidence+'%2F',rawEvidence+'%252F',rawEvidence+'%5C','/content/world/world-country-public-evidence-r1.json/']){check('Raw source canonical path rejected '+path,()=>{assert.equal(rawWorldSnapshotPath(path),true);assert.equal(finalInternalPath(path),true);});}\nfor(const path of ['/content/world/world-country-public-evidence-current.json','/content/civilization-atlas/geography/world-selection-geometry-r2.json'])check('Public metadata and admitted geometry stay separate '+path,()=>assert.equal(rawWorldSnapshotPath(path),false)"},{"before":"anonymous public","after":"explicit local engineering"}];
 for(const op of ops.toReversed()){assert.equal(text.split(op.after).length,2,'CURRENT_SUBJECT_COUNTRY_CHECKER_HUNK');text=text.replace(op.after,op.before);}
 const previous=Buffer.from(text);assert.equal(sha(previous),before,'CURRENT_SUBJECT_COUNTRY_CHECKER_FULL_INVERSE');return previous;
}

// Historical source proof only: build execution uses the actual new routing.
export function currentBuildRoutesPredecessor(file,bytes){
 if(file!=="scripts/build-cloudflare-pages.mjs")return bytes;
 const before="0fcbf8908906f3d0a8cd8af5562830ffaf7d166b6030310ee81a5ef27ef5e49a",after="270ad49edaeeb4a26b7ed703cfed16bc19c21967127ef9058c8427de261d0f2e";if(sha(bytes)===before)return bytes;
 if(sha(bytes)!==after){
  const raw=fs.readFileSync('content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/AUDIT-R2-PUBLIC34-RECEIVER-R2.json');assert.equal(sha(raw),'f0c9c4175b2dd850e9e71ab09b200ffc9de0a98e3f49398e1a5a2463e44c7871');const registered=JSON.parse(raw).paths.find(x=>x.path===file);assert.equal(registered.sha256,before);
  if(sha(bytes)===registered.previousSHA256){assert.equal(sha(fs.readFileSync(file)),after,'CURRENT_BUILD_ROUTES_PHYSICAL_DRIFT');return bytes;}
 }
 assert.equal(sha(bytes),after,'CURRENT_BUILD_ROUTES_UNKNOWN_DELTA');let text=bytes.toString('utf8');const ops=[{"before":"routes.exclude=[...new Set([...(routes.exclude||[]),'/assets/*','/content/*','/data/*','/favicon.ico','/robots.txt','/sitemap.xml','/reality-entry','/reality-entry/','/reality-entry.html'])];\n","after":"// Content includes internal-only World snapshots. Their public URLs must reach\n// the Worker denial even though env.ASSETS remains available to the projector.\nroutes.exclude=[...new Set([...(routes.exclude||[]),'/assets/*','/data/*','/favicon.ico','/robots.txt','/sitemap.xml','/reality-entry','/reality-entry/','/reality-entry.html'])].filter(p=>p!=='/content/*');\n"}];
 for(const op of ops.toReversed()){assert.equal(text.split(op.after).length,2,'CURRENT_BUILD_ROUTES_UNIQUE_HUNK');text=text.replace(op.after,op.before);}
 const previous=Buffer.from(text);assert.equal(sha(previous),before,'CURRENT_BUILD_ROUTES_FULL_PREDECESSOR');return previous;
}

// Current accepted positioning belongs on the canonical Founder destination.
export function currentFounderPositioningPredecessor(file,bytes){
 if(file!=="about/founder/index.html")return bytes;
 const before="91443c5bee512c6e0c2892b8adc7b7fe3c20d2f4d059deadcf443a41734cfd1e",after="a328895002b5aa06326ea3d8cc8e0199b8de44942334cd88e75c4257ae709785";if(sha(bytes)===before)return bytes;
 assert.equal(sha(bytes),after,"CURRENT_FOUNDER_POSITIONING_UNKNOWN_DELTA");
 const added=Buffer.from("3c73656374696f6e20636c6173733d22666f756e6465722d72332d73656374696f6e222069643d227265616c6974792d696e74656c6c6967656e63652d706c6174666f726d2220617269612d6c6162656c6c656462793d227265616c6974792d696e74656c6c6967656e63652d7469746c65223e0a3c64697620636c6173733d22666f756e6465722d72332d70726f7365223e3c68322069643d227265616c6974792d696e74656c6c6967656e63652d7469746c652220646174612d666f756e6465722d636f707920646174612d63782d656e3d2241205265616c69747920496e74656c6c6967656e636520506c6174666f726d2c2064657369676e656420666f72205265616c697479204e617669676174696f6e2e2220646174612d63782d7a683d22e4b8bae78eb0e5ae9ee5afbce888aae8808ce8aebee8aea1e79a84e78eb0e5ae9ee699bae883bde5b9b3e58fb0e38082223e41205265616c69747920496e74656c6c6967656e636520506c6174666f726d2c2064657369676e656420666f72205265616c697479204e617669676174696f6e2e3c2f68323e0a3c7020646174612d666f756e6465722d636f707920646174612d63782d656e3d22504849204f5320636f6e6e656374732073747275637475726564206b6e6f776c656467652c2072656c6576616e742065766964656e63652c20636f6e7465787475616c2070726f66696c657320616e6420646f6d61696e2d737065636966696320726561736f6e696e6720746f2068656c7020796f7520756e6465727374616e6420736974756174696f6e732c20636f6d7061726520706f73736962696c697469657320616e64206d616b6520696e666f726d65642063686f696365732e2220646174612d63782d7a683d22504849204f5320e8bf9ee68ea5e7bb93e69e84e58c96e79fa5e8af86e38081e79bb8e585b3e8af81e68daee38081e78eb0e5ae9ee794bbe5838fe4b88ee9a286e59f9fe68ea8e79086efbc8ce5b8aee58aa9e4bda0e79086e8a7a3e5a484e5a283e38081e6af94e8be83e58fafe883bde680a7efbc8ce5b9b6e4bd9ce587bae69c89e4be9de68daee79a84e98089e68ba9e38082223e504849204f5320636f6e6e656374732073747275637475726564206b6e6f776c656467652c2072656c6576616e742065766964656e63652c20636f6e7465787475616c2070726f66696c657320616e6420646f6d61696e2d737065636966696320726561736f6e696e6720746f2068656c7020796f7520756e6465727374616e6420736974756174696f6e732c20636f6d7061726520706f73736962696c697469657320616e64206d616b6520696e666f726d65642063686f696365732e3c2f703e0a3c7020646174612d666f756e6465722d636f707920646174612d63782d656e3d2241492070726f7669646573206361706162696c69746965733b20504849204f532070726f7669646573206172636869746563747572652c20726561736f6e696e6720616e64206e617669676174696f6e2e20546f6f6c732063616e2068656c702066696e6420616e64206f7267616e697a6520696e666f726d6174696f6e2c207768696c6520736f75726365732c2063616c63756c6174696f6e7320616e6420706572736f6e616c20636f6e746578742072657461696e207468656972206f776e206c696d6974732e20416e20617661696c61626c6520746f6f6c206973206e6f742c20627920697473656c662c2065766964656e6365206f72207065726d697373696f6e20746f206163742e2220646174612d63782d7a683d22414920e68f90e4be9be883bde58a9befbc8c504849204f5320e68f90e4be9be69eb6e69e84e38081e68ea8e79086e4b88ee78eb0e5ae9ee5afbce888aae38082e5b7a5e585b7e58fafe4bba5e58d8fe58aa9e5afbbe689bee4b88ee7bb84e7bb87e8b584e69699efbc8ce4bd86e69da5e6ba90e38081e8aea1e7ae97e4b88ee4b8aae4babae68385e5a283e59084e69c89e8beb9e7958ce38082e5b7a5e585b7e58fafe794a8efbc8ce69cace8baabe4b88de7ad89e4ba8ee8af81e68daeefbc8ce4b99fe4b88de7ad89e4ba8ee8a18ce58aa8e68e88e69d83e38082223e41492070726f7669646573206361706162696c69746965733b20504849204f532070726f7669646573206172636869746563747572652c20726561736f6e696e6720616e64206e617669676174696f6e2e20546f6f6c732063616e2068656c702066696e6420616e64206f7267616e697a6520696e666f726d6174696f6e2c207768696c6520736f75726365732c2063616c63756c6174696f6e7320616e6420706572736f6e616c20636f6e746578742072657461696e207468656972206f776e206c696d6974732e20416e20617661696c61626c6520746f6f6c206973206e6f742c20627920697473656c662c2065766964656e6365206f72207065726d697373696f6e20746f206163742e3c2f703e0a3c7020646174612d666f756e6465722d636f707920646174612d63782d656e3d224f6e65207265616c20776f726c6420636f6e6e6563747320506572736f6e616c2c2046616d696c792c205465616d2c20427573696e6573732c20496e737469747574696f6e20616e6420436f756e7472792e20537461727420776974682061207175657374696f6e2c206578616d696e652072656c6576616e74206b6e6f776c6564676520616e642065766964656e63652c20636f6d70617265206578706c69636974207363656e6172696f732c2063686f6f7365206120626f756e646564206e657874207374657020616e642072657475726e20746f207265766965772077686174206368616e6765642e2220646174612d63782d7a683d22e4b8aae4babae38081e5aeb6e5baade38081e59ba2e9989fe38081e4bc81e4b89ae38081e69cbae69e84e4b88ee59bbde5aeb6efbc8ce585b1e5a484e4ba8ee4b880e4b8aae79bb8e4ba92e8bf9ee68ea5e79a84e79c9fe5ae9ee4b896e7958ce38082e4bb8ee997aee9a298e587bae58f91efbc8ce6a0b8e5afb9e79bb8e585b3e79fa5e8af86e4b88ee8af81e68daeefbc8ce6af94e8be83e69c89e6988ee7a1aee58187e8aebee79a84e68385e699afefbc8ce98089e68ba9e69c89e8beb9e7958ce79a84e4b88be4b880e6ada5efbc8ce5868de59b9ee69da5e5a48de6a0b8e5ae9ee99985e58f98e58c96e38082223e4f6e65207265616c20776f726c6420636f6e6e6563747320506572736f6e616c2c2046616d696c792c205465616d2c20427573696e6573732c20496e737469747574696f6e20616e6420436f756e7472792e20537461727420776974682061207175657374696f6e2c206578616d696e652072656c6576616e74206b6e6f776c6564676520616e642065766964656e63652c20636f6d70617265206578706c69636974207363656e6172696f732c2063686f6f7365206120626f756e646564206e657874207374657020616e642072657475726e20746f207265766965772077686174206368616e6765642e3c2f703e0a3c7020646174612d666f756e6465722d636f707920646174612d63782d656e3d2246616374732c20696e746572707265746174696f6e7320616e6420706f73736962696c697469657320737461792064697374696e63742e2053796d626f6c6963206d6574686f6473206f666665722070657273706563746976657320726174686572207468616e20736369656e74696669632070726564696374696f6e733b20756e617661696c61626c6520696e666f726d6174696f6e2072656d61696e7320756e6b6e6f776e2e205072697661746520636f6e74657874206e6565647320636f6e73656e7420616e64206163636573732c20616e642070726f66657373696f6e616c206f722070616964207365727669636573206861766520736570617261746520726571756972656d656e74732e2220646174612d63782d7a683d22e4ba8be5ae9ee38081e8a7a3e9878ae4b88ee58fafe883bde680a7e4bf9de68c81e58cbae58886e38082e8b1a1e5be81e680a7e696b9e6b395e68f90e4be9be8a782e5af9fe8a786e8a792efbc8ce4b88de698afe7a791e5ada6e9a284e6b58befbc9be697a0e6b395e58f96e5be97e79a84e8b584e69699e4bb8de698afe69caae79fa5e38082e7a781e5af86e68385e5a283e99c80e8a681e5908ce6848fe4b88ee8aebfe997aee69d83e99990efbc8ce4b893e4b89ae58f8ae4bb98e8b4b9e69c8de58aa1e4b99fe59084e69c89e69da1e4bbb6e38082223e46616374732c20696e746572707265746174696f6e7320616e6420706f73736962696c697469657320737461792064697374696e63742e2053796d626f6c6963206d6574686f6473206f666665722070657273706563746976657320726174686572207468616e20736369656e74696669632070726564696374696f6e733b20756e617661696c61626c6520696e666f726d6174696f6e2072656d61696e7320756e6b6e6f776e2e205072697661746520636f6e74657874206e6565647320636f6e73656e7420616e64206163636573732c20616e642070726f66657373696f6e616c206f722070616964207365727669636573206861766520736570617261746520726571756972656d656e74732e3c2f703e0a3c6e617620636c6173733d22666f756e6465722d72332d616374696f6e732220617269612d6c6162656c3d224578706c6f726520746865206578697374696e6720706c6174666f726d2220646174612d666f756e6465722d706f736974696f6e696e672d6172696120646174612d63782d656e2d617269612d6c6162656c3d224578706c6f726520746865206578697374696e6720706c6174666f726d2220646174612d63782d7a682d617269612d6c6162656c3d22e68ea2e7b4a2e78eb0e69c89e5b9b3e58fb0223e3c6120687265663d222f776f726c642f2220646174612d666f756e6465722d636f707920646174612d63782d656e3d224578706c6f72652065766964656e636520696e20576f726c642220646174612d63782d7a683d22e59ca820576f726c6420e68ea2e7b4a2e8af81e68dae223e4578706c6f72652065766964656e636520696e20576f726c643c2f613e3c6120687265663d222f6b6e6f776c656467652f2220646174612d666f756e6465722d636f707920646174612d63782d656e3d225265616420746865206b6e6f776c65646765206172636869746563747572652220646174612d63782d7a683d22e99885e8afbbe79fa5e8af86e69eb6e69e84223e5265616420746865206b6e6f776c65646765206172636869746563747572653c2f613e3c6120687265663d222f7375626a656374732f706572736f6e616c2f2220646174612d666f756e6465722d636f707920646174612d63782d656e3d225374617274207769746820796f75722070657273706563746976652220646174612d63782d7a683d22e4bb8ee4bda0e79a84e8a782e5af9fe8a786e8a792e5bc80e5a78b223e5374617274207769746820796f75722070657273706563746976653c2f613e3c2f6e61763e0a3c2f6469763e3c2f73656374696f6e3e","hex");const start=bytes.indexOf(added);assert(start>=0&&bytes.indexOf(added,start+1)===-1,"CURRENT_FOUNDER_POSITIONING_UNIQUE_INSERT");
 const withoutPositioning=Buffer.concat([bytes.subarray(0,start),bytes.subarray(start+added.length)]).toString();const currentAttribution="<div data-founder-quote-attribution class=\"founder-r3-role\"><strong>Teresa Lee</strong><br><span data-founder-copy data-cx-en=\"Founder of PHI OS\" data-cx-zh=\"PHI OS 创办人\" >Founder of PHI OS</span></div>",priorAttribution="<footer><strong>Teresa Lee</strong><span data-founder-copy data-cx-en=\"Founder of PHI OS\" data-cx-zh=\"PHI OS 创办人\" >Founder of PHI OS</span></footer>";assert.equal(withoutPositioning.split(currentAttribution).length,2,'CURRENT_FOUNDER_ATTRIBUTION_UNIQUE_INVERSE');const previous=Buffer.from(withoutPositioning.replace(currentAttribution,priorAttribution));assert.equal(sha(previous),before,"CURRENT_FOUNDER_POSITIONING_INVERSE");return previous;
}

const currentFounderCheckerOps=[{"file":"scripts/lib/founder-owner-r3-strict-r4.mjs","before":"e9a7107e57c8ecf8c4a34347b237df959768be90eaa5c36866e89125ec3931cd","after":"b577cf9d4b79f2ba341a043f4e087b644e3abf90d445c560a986e2293bff45f9","ops":[{"before":"import fs from 'node:fs';","after":"import {currentFounderPositioningPredecessor,currentR5ProtectedCheckerPredecessor} from './pr22-release-r5-exact-successor-r1.mjs';\nimport fs from 'node:fs';"},{"before":" const bytes=readFile(manifestPath);","after":" const actualPage=readFile('about/founder/index.html');if(actualPage.toString().includes('id=\"reality-intelligence-platform\"'))assertCurrentFounderPositioning(actualPage.toString());const currentRead=readFile;readFile=p=>currentR5ProtectedCheckerPredecessor(p,currentFounderPositioningPredecessor(p,currentRead(p)));\n const bytes=readFile(manifestPath);"},{"before":"export function assertFounderR3StrictTransition","after":"export function assertCurrentFounderPositioning(page){const {document:d}=parseHTML(page);const section=d.querySelector('#reality-intelligence-platform');assert.equal(d.querySelectorAll('#reality-intelligence-platform').length,1,'CURRENT_FOUNDER_POSITIONING_SINGLE');assert(section.classList.contains('founder-r3-section'));for(const n of section.querySelectorAll('h2,p,a')){assert(n.hasAttribute('data-founder-copy'));assert(n.getAttribute('data-cx-en'));assert(n.getAttribute('data-cx-zh'));}assert.equal(section.querySelectorAll('h2').length,1);assert.equal(section.querySelectorAll('p').length,4);assert.equal(d.querySelectorAll('.founder-r3-section').length,8);for(const id of ['founder-origin','founder-published-work','founder-trust','founder-connected-reality','founder-purpose','founder-commitment','founder-next-step'])assert(d.getElementById(id));assert.equal(d.querySelectorAll('.founder-r3-portrait img').length,1);assert.equal(d.querySelectorAll('main h1').length,1);assert(d.querySelector('link[rel=\"canonical\"]').href.endsWith('/about/founder/'));assert(!/licensed|certified|PhD|therapist|guaranteed prediction/i.test(section.textContent));assert(section.textContent.includes('An available tool is not, by itself, evidence or permission to act.'));assert(section.textContent.includes('Private context needs consent and access'));return true;}\nexport function assertFounderR3StrictTransition"},{"before":"return true;}","after":"assert.equal(d.querySelectorAll('main footer').length,0,'FOUNDER_QUOTE_MUST_NOT_BE_SHELL_FOOTER');const attribution=d.querySelector('[data-founder-quote-attribution]');assert(attribution&&attribution.closest('#founder-commitment'));assert.equal(attribution.querySelector('strong')?.textContent,'Teresa Lee');const role=attribution.querySelector('[data-founder-copy]');assert.equal(role?.getAttribute('data-cx-en'),'Founder of PHI OS');assert.equal(role?.getAttribute('data-cx-zh'),'PHI OS 创办人');assert.equal(d.querySelectorAll('[data-public-footer-placeholder]').length,1);assert(!d.querySelector('main [data-public-footer-placeholder]'));return true;}"}]},{"file":"scripts/check-founder-owner-r3.mjs","before":"4ff970df8e6369b775504d1b153be090c67be741c438a2c46cd4dde897419db4","after":"95107b315852923712c66fa2aeb842dad3a24ba40c55d692be439daa0741c58c","ops":[{"before":"import {assertFounderR3StrictTransition}","after":"import {currentFounderPositioningPredecessor} from './lib/pr22-release-r5-exact-successor-r1.mjs';\nimport {assertFounderR3StrictTransition}"},{"before":"const page=fs.readFileSync('about/founder/index.html','utf8')","after":"const page=currentFounderPositioningPredecessor('about/founder/index.html',fs.readFileSync('about/founder/index.html')).toString()"},{"before":"import {assertFounderR3StrictTransition}","after":"import {assertFounderR3StrictTransition,assertCurrentFounderPositioning}"},{"before":"assertFounderR3StrictTransition();","after":"assertCurrentFounderPositioning(fs.readFileSync('about/founder/index.html','utf8'));\nassertFounderR3StrictTransition();"}]},{"file":"scripts/check-client-visual-consumption-homepage-r5-r3.mjs","before":"d7bdac58ea8bdecd11dc97b5e77aec82c5c019e6a09a9317b812bf71d372a8ac","after":"8e87557faa9a47cf3c5ff410b0b7715d630366febd59b79970d0909f73f56f31","ops":[{"before":"import {validateH5HomepageR5Successor} from './lib/client-visual-h5-homepage-r5-successor-r3.mjs';\n","after":"import {currentFounderPositioningPredecessor} from './lib/pr22-release-r5-exact-successor-r1.mjs';\nimport {validateH5HomepageR5Successor} from './lib/client-visual-h5-homepage-r5-successor-r3.mjs';\n"},{"before":"sha256(output.path)","after":"crypto.createHash('sha256').update(output.path==='about/founder/index.html'?currentFounderPositioningPredecessor(output.path,fs.readFileSync(`${ROOT}/${output.path}`)):fs.readFileSync(`${ROOT}/${output.path}`)).digest('hex')"}]}];
export function currentFounderCheckerPredecessor(file,bytes){const row=currentFounderCheckerOps.find(x=>x.file===file);if(!row||sha(bytes)===row.before)return bytes;assert.equal(sha(bytes),row.after,"CURRENT_FOUNDER_CHECKER_UNKNOWN_DELTA");let text=bytes.toString();for(const op of [...row.ops].reverse()){assert.equal(text.split(op.after).length,2,"CURRENT_FOUNDER_CHECKER_UNIQUE_INVERSE");text=text.replace(op.after,op.before);}const prior=Buffer.from(text);assert.equal(sha(prior),row.before,"CURRENT_FOUNDER_CHECKER_INVERSE");return prior;}

const currentPublicationCheckerRows=[{"file":"scripts/check-pages-static-assets.mjs","before":"bbd1cfa33a78d6adb7d8d87f488d0c40cc687d95d061f2ceb4a473963e1aa100","after":"19d3f79967ce8b23386e86ae054699a4ac2f15379ceb534206246e17a73fb2ff","inverse":{"before":"const routes=JSON.parse(fs.readFileSync(path.join(output,'_routes.json'),'utf8'));if(routes.version!==1||!Array.isArray(routes.include)||routes.include.length===0)failures.push('_routes.json: generated routing contract invalid');","after":"\n    const routes=JSON.parse(fs.readFileSync(path.join(output,'_routes.json'),'utf8'));\n    if(routes.version!==1||!Array.isArray(routes.include)||routes.include.length===0)failures.push('_routes.json: generated routing contract invalid');\n    else {\n      const matches=(pattern,url)=>new RegExp('^'+pattern.split('*').map(s=>s.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')).join('.*')+'$').test(url);\n      for(const url of ['/content/world/world-country-public-evidence-r1.json','/content/world/world-country-public-evidence-r2-136b941c00f890aa.json','/content/world/world-country-public-evidence-r2-136b941c00f890aa.json/','/content/world/world-country-public-evidence-r2-136b941c00f890aa.json%2F']){\n        if(!routes.include.some(p=>matches(p,url))||(routes.exclude||[]).some(p=>matches(p,url)))failures.push('_routes.json: internal World snapshot bypasses Worker '+url);\n      }\n    }\n  "}},{"file":"scripts/check-pages-output-concurrency.mjs","before":"c16beb786deede69d5e1d0ba43178ec7b951a361ba244fd0ff8e039c74c4b7cb","after":"83b5ab8b0a66aeb31bc62d840b62735aa01e25a7e54d47183f0f990da4e9cdaf","inverse":{"before":"","after":",\n [\"const original=fs.readFileSync;fs.readFileSync=(p,...args)=>String(p).endsWith('_routes.json')?JSON.stringify({version:1,include:['/*'],exclude:['/content/*']}):original(p,...args);\",/internal World snapshot bypasses Worker/],\n [\"const original=fs.readFileSync;fs.readFileSync=(p,...args)=>String(p).endsWith('_routes.json')?JSON.stringify({version:1,include:['/api/*'],exclude:[]}):original(p,...args);\",/internal World snapshot bypasses Worker/],\n [\"const original=fs.readFileSync;fs.readFileSync=(p,...args)=>String(p).endsWith('_routes.json')?JSON.stringify({version:1,include:['/*'],exclude:['/content/world/*']}):original(p,...args);\",/internal World snapshot bypasses Worker/]"}}];
export function currentPublicationCheckerPredecessor(file,bytes){const row=currentPublicationCheckerRows.find(x=>x.file===file);if(!row||sha(bytes)===row.before)return bytes;assert.equal(sha(bytes),row.after,"CURRENT_PUBLICATION_CHECKER_UNKNOWN_DELTA");const text=bytes.toString();assert.equal(text.split(row.inverse.after).length,2,"CURRENT_PUBLICATION_CHECKER_UNIQUE_INVERSE");const previous=Buffer.from(text.replace(row.inverse.after,row.inverse.before));assert.equal(sha(previous),row.before,"CURRENT_PUBLICATION_CHECKER_INVERSE");return previous;}
