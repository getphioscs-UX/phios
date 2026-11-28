import {releaseR5Predecessor,currentBzrSharedPredecessor} from './pr22-release-r5-exact-successor-r1.mjs';
import {currentNarrativePreparationPredecessor} from './public-customer-report-convergence-successor-r1.mjs';
import path from 'node:path';import {pathToFileURL} from 'node:url';
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex'),RECORD='content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/ICHING-STATELESS-RECEIVER-R2.json',EXPECTED='0a1272514369a8d696c2a4d1e8f3a20b4ab9fd6e0e6cc60803d2dbb7aac88ca0';
const registered=["functions/iching-full-production/iching-full-production-v1.js", "functions/api/iching-full-context.js", "scripts/check-iching-full-production-deployment-continuity.mjs", "config/reports/zero-cost-check-commands.json"];
export function validateCurrentIChingInputs({readCurrent=p=>fs.readFileSync(p),recordBytes=fs.readFileSync(RECORD)}={}){
 assert.equal(hash(recordBytes),EXPECTED,'ICHING_STATELESS_RECORD_DRIFT');const r=JSON.parse(recordBytes);assert.equal(r.schema,'ICHING_STATELESS_RECEIVER_R2');assert.deepEqual(r.changes.map(x=>x.path),registered);for(const value of Object.values(r.boundaries))assert.equal(value,false);
 for(const item of r.currentInputs)assert.equal(hash(ichingCurrentParentPredecessor(item.path,readCurrent(item.path))),item.sha256,'ICHING_STATELESS_PHYSICAL_DRIFT:'+item.path);
 for(const item of r.changes)assert.equal(hash(Buffer.from(item.beforeBytesBase64,'base64')),item.beforeSHA256,'ICHING_STATELESS_ARCHIVE_DRIFT:'+item.path);
 return r;
}
export function ichingStatelessPredecessor(file,bytes,options){
 bytes=ichingCurrentParentPredecessor(file,bytes);
 if(!registered.includes(file))return bytes;const r=validateCurrentIChingInputs(options),row=r.changes.find(x=>x.path===file),actual=hash(bytes);if(actual===row.beforeSHA256)return bytes;assert.equal(actual,row.afterSHA256,'ICHING_STATELESS_INPUT_DRIFT:'+file);return Buffer.from(row.beforeBytesBase64,'base64');
}
export async function runHistoricalIChingContinuity(){
 const r=validateCurrentIChingInputs(),old=r.changes.find(x=>x.path===registered[0]),test=r.changes.find(x=>x.path===registered[2]);const archive=Buffer.from(test.beforeBytesBase64,'base64').toString();assert.equal(archive.split(r.legacyAuthorityImport).length,2,'ICHING_LEGACY_IMPORT_CARDINALITY');
 const authorityURL='data:text/javascript;base64,'+old.beforeBytesBase64;const legacy=archive.replace(r.legacyAuthorityImport,"from '"+authorityURL+"';");
 await import('data:text/javascript;base64,'+Buffer.from(legacy).toString('base64'));
 console.log('All original IChing continuity assertions PASS on exact archived pre-stateless authority; current successor checked separately.');
}

export function assertIChingLegacyEntry(entry){const r=validateCurrentIChingInputs();assert.equal(path.resolve(entry||''),path.resolve(r.legacyStaticEntry),'ICHING_LEGACY_ENTRY_NOT_ALLOWED');return r;}
export function createIChingHistoricalResolve(){
 const r=validateCurrentIChingInputs(),authorityURL=pathToFileURL(path.resolve(registered[0])).href,old=r.changes.find(x=>x.path===registered[0]);
 const allowed=new Map(r.legacyImports.map(x=>[pathToFileURL(path.resolve(x.parent)).href,x.specifier]));
 return function resolve(specifier,context,nextResolve){const result=nextResolve(specifier,context);if(result.url!==authorityURL)return result;assert(allowed.has(context.parentURL),'ICHING_LEGACY_UNKNOWN_PARENT');assert.equal(specifier,allowed.get(context.parentURL),'ICHING_LEGACY_UNKNOWN_SPECIFIER');return {url:'data:text/javascript;base64,'+old.beforeBytesBase64,format:'module',shortCircuit:true};};
}

// Current I Ching retains its own runtime/corpus/rights checks without unrelated W16 checker recursion.
export function readIChingCurrentParentContract(){const bytes=fs.readFileSync('content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/ICHING-CURRENT-PARENT-SUCCESSOR-R1.json');assert.equal(hash(bytes),'1dd673c57c4c513776799299a70669264e9e047673da4d17cc92e9ce5d3ceeff');const r=JSON.parse(bytes);for(const v of Object.values(r.boundaries))assert.equal(v,false);return r;}
function ichingCurrentParentPredecessor(file,bytes){
 bytes=currentNarrativePreparationPredecessor(file,currentBzrSharedPredecessor(file,releaseR5Predecessor(file,bytes)));
 if(file!=='config/reports/zero-cost-check-commands.json')return bytes;
 const root='content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/';
 const contracts=[['PUBLIC-READABILITY-SOURCE-SUCCESSOR-R1.json','572bfdaab2f94671b28a886b923ae93edb1e45ad15e5b152fbf7860d31f0ae69'],['BOOK-V-W16-BRAND-SOURCE-SUCCESSOR-R1.json','e36b24b4f45039a4a17c17903e5ded39c91518d556a9d2a4fe7a8f7ba284a707'],['ICHING-CURRENT-PARENT-SUCCESSOR-R1.json','1dd673c57c4c513776799299a70669264e9e047673da4d17cc92e9ce5d3ceeff']];
 let matched=false;for(const [path,expected] of contracts){const raw=fs.readFileSync(root+path);assert.equal(hash(raw),expected,'ICHING_CONFIG_RECORD_DRIFT');const r=JSON.parse(raw);for(const v of Object.values(r.boundaries))assert.equal(v,false);const row=r.inputs?.find(x=>x.path===file)||r.config;const after=row.afterSHA256,before=row.beforeSHA256,digest=hash(bytes);if(digest!==after)continue;const prior=Buffer.from(row.beforeBytesBase64,'base64');assert.equal(hash(prior),before,'ICHING_CONFIG_ARCHIVE_DRIFT');bytes=prior;matched=true;}
 assert(matched,'ICHING_CONFIG_UNREGISTERED_INPUT');return bytes;
}
