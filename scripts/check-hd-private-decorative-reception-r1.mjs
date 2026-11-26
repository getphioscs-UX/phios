import {validateHdPrivateDecorationCurrent,hdPrivateDecorationCurrentPaths,retiredHdParagraphFlowGenerator} from './lib/hd-private-decorative-reception-r1.mjs';
import assert from 'node:assert/strict';import fs from 'node:fs';import {buildHdFull17DecorativeBindingR1,prepareHdFullManuscriptPublisherR1,mapHdFull17PublisherParagraphsR1} from '../functions/report-delivery/hd-full-manuscript-publisher-r1.js';
const ids=Array.from({length:17},(_,i)=>'SEC'+String(i+1).padStart(2,'0'));for(const contentLanguage of ['en','zh-Hans','bilingual']){const r=buildHdFull17DecorativeBindingR1({contentLanguage,sectionIds:ids});assert.equal(r.rows.length,18);assert.deepEqual(r.rows.map(x=>x.id),['BODY',...ids]);for(const flag of ['commercialAdmission','semanticAuthority','assetActivation'])assert.equal(r[flag],false);assert(!/E:\/|QA-TEMP|identityEvidence/.test(JSON.stringify(r)),'NO_LOCAL_EVIDENCE_RUNTIME_DEPENDENCY');}
for(const x of [{contentLanguage:'unknown',sectionIds:ids},{contentLanguage:'en',sectionIds:ids.slice(1)},{contentLanguage:'en',sectionIds:ids.toReversed()}])assert.throws(()=>buildHdFull17DecorativeBindingR1(x));assert(!fs.existsSync('content/reports/shared/hd-full17-decorative-bindings-r1.json'),'PRIVATE_BINDING_NOT_PUBLIC_CONTENT');console.log('HD actual target private binding: three languages / three refusals PASS; no local QA dependency or commercial activation');

const receipt=validateHdPrivateDecorationCurrent();for(const row of hdPrivateDecorationCurrentPaths(receipt))assert.throws(()=>validateHdPrivateDecorationCurrent(p=>p===row.path?Buffer.concat([fs.readFileSync(p),Buffer.from("drift")]):fs.readFileSync(p)));console.log("HD exact private child: two current-runtime drift cases refused; immutable Report16 parent retained");

// Current rights, ownership and restricted-public execution replace the old generator's existence gate.
const savedFetch=globalThis.fetch;let dbCalls=0;globalThis.fetch=()=>{throw Error('UNEXPECTED_NETWORK');};
try {
 const job={ownerAccountId:'owner-A'};
 const deniedDb={prepare(){dbCalls++;throw Error('UNEXPECTED_PRIVATE_DB');}};
 await assert.rejects(prepareHdFullManuscriptPublisherR1({env:{PHIOS_ENVIRONMENT:'production',RUNTIME_DB:deniedDb}},{job}),{code:'FULL_PUBLICATION_LOCAL_OWNER_REVIEW_ONLY'});
 await assert.rejects(prepareHdFullManuscriptPublisherR1({env:{PHIOS_ENVIRONMENT:'local',RUNTIME_DB:deniedDb},data:{symbolicAccountIdentity:{userId:'owner-B',providerId:'fixture',verified:true,authenticated:true}}},{job}),{code:'FULL_PUBLICATION_LOCAL_OWNER_REVIEW_ONLY'});
 await assert.rejects(prepareHdFullManuscriptPublisherR1({env:{PHIOS_ENVIRONMENT:'local',RUNTIME_DB:deniedDb}},{job}),{code:'ACCOUNT_REQUIRED'});
 assert.equal(dbCalls,0);
 const sections=ids.map(sectionId=>({sectionId,title:sectionId,paragraphs:[{paragraphId:sectionId+'-p',coverageUnitId:sectionId+'-c',text:'synthetic structure only'}]}));
 const mapped=mapHdFull17PublisherParagraphsR1(sections,'CURRENT_TEST');assert.equal(mapped.publicationAccepted,false);assert.equal(mapped.selection.sections.length,17);
 assert.throws(()=>mapHdFull17PublisherParagraphsR1(sections.slice(1),'CURRENT_TEST'),{code:'HD_FULL17_COMPLETE_STRUCTURE_REQUIRED'});
 const {evaluateHdrRestrictedBoundary,assertHdrRestrictedExecutionBlocked}=await import('../functions/method-production-activation/hdr-boundary-runtime.js');
 const decision=evaluateHdrRestrictedBoundary({gates:{production:true,public:true},publicPresentation:{controlledLabelAllowed:true,restrictedInternalNameAllowed:false}});
 for(const key of ['productionEligible','productionExecutionAllowed','professionalReleaseAllowed','publicMethodExecutionAllowed'])assert.equal(decision[key],false);
 for(const mode of ['production','public','professional'])assert.throws(()=>assertHdrRestrictedExecutionBlocked(mode),/MPA_HDR_RESTRICTED_METHOD_EXECUTION_BLOCKED/);
 assert.equal(assertHdrRestrictedExecutionBlocked('validation'),true);
 assert.equal(hdPrivateDecorationCurrentPaths(receipt).length,2);
 validateHdPrivateDecorationCurrent(p=>{assert.notEqual(p,retiredHdParagraphFlowGenerator,'RETIRED_GENERATOR_MUST_NOT_BE_READ');return fs.readFileSync(p);});
 console.log('HD current private/public boundaries PASS: production, anonymous and cross-owner refusal before DB; 17-section projection stays unaccepted; public HDR remains blocked; network/private DB 0');
}finally{globalThis.fetch=savedFetch;}
