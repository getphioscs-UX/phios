import assert from 'node:assert/strict';import fs from 'node:fs';
import {inspectAuthorVersion,inspectBilingualVersions,exactTextDigest} from './lib/ecr-author-manuscript-version.mjs';
const text='Synthetic author manuscript.\n原样保存。';
const r={sectionId:'01',language:'zh-Hans',manuscriptVersion:'SYNTHETIC-v1',exactTextDigest:exactTextDigest(text),calculationRef:'SYNTHETIC',sourcePackVersion:'v1',claimRefs:[],rightsStatus:'PENDING',authorDecision:null,decisionDate:null,replacedVersion:null,publicationStatus:'DRAFT'};
const checks=[];function test(id,fn){fn();checks.push({id,status:'PASS'});}
test('draft-is-not-accepted',()=>assert.equal(inspectAuthorVersion(r,text).authorTextAccepted,false));
const accepted={...r,authorDecision:'ACCEPT',decisionDate:'2026-10-25',authorEvidenceRef:'SYNTHETIC-TEST-NOT-AUTHOR-APPROVAL',publicationStatus:'AUTHOR_ACCEPTED_TEXT'};
test('acceptance-is-not-customer-admission',()=>assert.equal(inspectAuthorVersion(accepted,text).customerPublishable,false));
test('one-character-change-invalidates-acceptance',()=>assert.equal(inspectAuthorVersion(accepted,text+' ').authorTextAccepted,false));
test('newline-change-invalidates-acceptance',()=>assert.equal(inspectAuthorVersion(accepted,text.replace('\n','\r\n')).authorTextAccepted,false));
test('missing-evidence-not-accepted',()=>assert.equal(inspectAuthorVersion({...accepted,authorEvidenceRef:null},text).authorTextAccepted,false));
test('cannot-self-upgrade-publication',()=>assert.equal(inspectAuthorVersion({...accepted,publicationStatus:'CUSTOMER_PUBLISHABLE'},text).valid,false));
const receipt={decision:'ACCEPT',exactTextDigest:accepted.exactTextDigest,evidenceRef:'SYNTHETIC'};
test('all-independent-gates-required',()=>assert.equal(inspectAuthorVersion({...accepted,rightsStatus:'CLEARED',publicationStatus:'CUSTOMER_PUBLISHABLE'},text,{semanticReceipt:receipt,rightsReceipt:receipt,customerAdmission:true}).customerPublishable,true));
test('wrong-version-receipt-rejected',()=>assert.equal(inspectAuthorVersion({...accepted,rightsStatus:'CLEARED'},text,{semanticReceipt:{...receipt,exactTextDigest:'old'},rightsReceipt:receipt,customerAdmission:true}).customerPublishable,false));
test('bilingual-requires-both',()=>assert.equal(inspectBilingualVersions({valid:true,customerPublishable:true},{valid:true,customerPublishable:false}).ready,false));
const out='tools/review/phi-configuration-deep-reading-r2-integrated/r3-author-led';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/author-version-tests.json',JSON.stringify({syntheticOnly:true,notAuthorApproval:true,providerCalls:0,checks},null,2));console.log(JSON.stringify({pass:checks.length,providerCalls:0}));
