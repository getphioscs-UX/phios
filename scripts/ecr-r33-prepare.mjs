import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {requirePrivateAuthorDirectory} from './lib/ecr-author-case-store.mjs';
import {inspectAuthorCaseManuscript} from './lib/ecr-author-manuscript-version.mjs';
import {buildEcrHumanRuntime,projectEcrLegacyCompatibility} from '../functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
const root=requirePrivateAuthorDirectory(process.argv[2]),out=path.join(root,'r33-publication');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(out+'/assets',{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const index=read(root+'/CURRENT-EFFECTIVE-CHAPTERS.json'),expected=['V3','V2','V2',...Array(7).fill('V1')],checks=[];
if(index.versions.length!==20)throw Error('TWENTY_ACCEPTED_MANUSCRIPTS_REQUIRED');
for(const entry of index.versions){const folder=entry.folder,record=read(folder+'/accepted-version.json'),text=fs.readFileSync(folder+'/exact-text.txt','utf8'),receipt=read(folder+'/author-decisions/'+entry.acceptanceReceiptId+'.json');
 const version=expected[Number(entry.sectionId)-1],inspection=inspectAuthorCaseManuscript(record,text),good=entry.version.endsWith('_'+version)&&sha(Buffer.from(text))===entry.exactTextSha256&&inspection.valid&&inspection.authorTextAccepted&&receipt.decision==='ACCEPT'&&receipt.sectionId===entry.sectionId&&receipt.language===entry.locale&&receipt.manuscriptVersion===entry.version&&receipt.exactTextDigest===entry.exactTextSha256;
 if(!good)throw Error('MANUSCRIPT_OR_ACCEPTANCE_INTEGRITY_FAILURE');
 checks.push({sectionId:entry.sectionId,locale:entry.locale,version:entry.version,sha256:entry.exactTextSha256,hashVerified:true,explicitFounderEvidence:receipt.evidenceRef,receiptId:receipt.receiptId,sourceWholeFileSha256:entry.sourceFileSha256,status:'AUTHOR_ACCEPTED_TEXT'});
}
const acceptance={checks,fullTextHashesPassed:checks.length,explicitFounderReceipts:checks.length,section10ExplicitFounderAcceptance:checks.filter(c=>c.sectionId==='10').length===2,originalHumanEvidence:[{sections:['01','02'],statement:'SECTION 01 Version V3 Bilingual Author Decision ACCEPT; SECTION 02 Version V2 Bilingual Author Decision ACCEPT',source:'Direct user R3.2 acceptance-update message; overrides earlier ZIP draft metadata.'},{sections:['03','04','05','06','07','08','09','10'],statement:'以上全部皆通过，请继续',source:'Direct user message explicitly accepting all eight attached manuscripts, including Section10.'}],integrationAuthorization:'ALL 10 SECTIONS AUTHOR ACCEPTED — PROCEED PUBLICATION INTEGRATION',private:true};
fs.writeFileSync(out+'/20-MANUSCRIPT-ACCEPTANCE-PROOF.json',JSON.stringify(acceptance,null,2));
const authorRoot=path.dirname(root),input=read(authorRoot+'/input.json').canonicalInput,ir=await buildEcrHumanRuntime({canonicalInput:input}),old=read(authorRoot+'/TL-ECR-V4.1-CALCULATION-REVIEW.json');
const replay={priorDigest:old.calculationDigest,currentDigest:ir.initialization.calculationDigest,matched:old.calculationDigest===ir.initialization.calculationDigest,unknowns:ir.unknown,authorWordsChanged:false};
fs.writeFileSync(out+'/private-runtime-ir.json',JSON.stringify(ir,null,2));
const legacy=await projectEcrLegacyCompatibility(ir,input);fs.writeFileSync(out+'/private-legacy-comparison.json',JSON.stringify({role:'HISTORICAL_COMPATIBILITY_ONLY_NOT_V41_PERSONAL_RUNTIME_AUTHORITY',projection:legacy},null,2));
fs.writeFileSync(out+'/calculation-replay.json',JSON.stringify(replay,null,2));
const manifest=read('content/reports/shared/report-visual-assets-r2.json');fs.writeFileSync(out+'/asset-manifest-snapshot.json',JSON.stringify(manifest,null,2));
const results=[];let cursor=0;const assets=process.argv.includes('--skip-assets')?[]:manifest.assets.filter(a=>a.methodId==='ECR');
async function worker(){while(cursor<assets.length){const a=assets[cursor++];try{const response=await fetch(a.url||('https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/'+a.objectKey),{signal:AbortSignal.timeout(20000)}),bytes=Buffer.from(await response.arrayBuffer()),actual=sha(bytes),valid=response.ok&&response.headers.get('content-type')?.includes('image/webp')&&a.active===true&&actual===a.sha256;
 if(valid)fs.writeFileSync(out+'/assets/'+a.pageId+'.webp',bytes);
 results.push({pageId:a.pageId,objectKey:a.objectKey,url:a.url,http:response.status,mime:response.headers.get('content-type'),expectedSha256:a.sha256,actualSha256:actual,bytes:bytes.length,status:valid?'PASS_BYTES':'BLOCKED_UNVERIFIED_ASSET',width:a.width,height:a.height});
 }catch(e){results.push({pageId:a.pageId,status:'BLOCKED_NETWORK',reason:e.cause?.code||e.name});}}}
await Promise.all(Array.from({length:4},worker));results.sort((a,b)=>a.pageId.localeCompare(b.pageId));if(results.length)fs.writeFileSync(out+'/asset-byte-evidence.json',JSON.stringify({results,productionR2Writes:0},null,2));
fs.writeFileSync(out+'/INTEGRATION-AUTHORIZATION.json',JSON.stringify({mode:'LOCAL_PUBLICATION_INTEGRATION',founderExplicitSignalReceived:true,authorIndexSoleAuthority:true,sourceIndexSha256:sha(fs.readFileSync(root+'/CURRENT-EFFECTIVE-CHAPTERS.json')),customerPublishable:false,productionAuthorized:false,providerCalls:0},null,2));
console.log(JSON.stringify({manuscriptsVerified:checks.length,founderEvidence:checks.length,section10Evidence:acceptance.section10ExplicitFounderAcceptance,calculationDigestMatches:replay.matched,verifiedAssets:results.filter(a=>a.status==='PASS_BYTES').length,blockedAssets:results.filter(a=>a.status!=='PASS_BYTES').map(a=>a.pageId),privateOutput:true,providerCalls:0}));
