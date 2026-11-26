import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readConvergenceRecord,currentNarrativePreparationPredecessor} from './public-customer-report-convergence-successor-r1.mjs';

export const PROVIDER_PATH='functions/personal-reading/narrative/narrative-provider.js';
export const SUCCESSOR_RECORD='docs/commerce/economics-20261009/bazi-prelive-owner-successors.json';
const REV='2391e4e104269b30d95987dda7f82a00e580227b';
const OLD='38855d13e8fa62be6f190c5c8a92ffaeddcded2e91b2796569943ea549a07212';
const NEW='a2432065d207eab749b8eabb09e957367e06520850db8d04c1055540f94d8168';
const AUDIT='docs/acceptance/bazi-paid-report/deep-manuscript-r2/REPOSITORY-AUDIT.json';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=p=>execFileSync('git',['show',REV+':'+p]);
const step={predecessorSha256:OLD,successorSha256:NEW,
 sourceHandoff:'Release B R2.5 OWNER-SOURCE-PRESERVATION.json',
 sourceHandoffSha256:'bb7d7fd85e570b0942ecb07a13b07110f10a2e79bb5a7e9419589ff42dd13ffd',
 authorization:'EXPLICIT_OWNER_MAIN_CONVERGENCE_R2_1_EXACT_PROVIDER_SUCCESSOR',
 scope:'Only preserve existing durable budget/fence rejection classification; all admission, transport, prompt and response bytes unchanged.',
 authorityOrAcceptedTextRewritten:false,commercialReleaseGranted:false,providerLiveEnabled:false};

function exactCurrentEndpoint(current){
 if(sha(current)===NEW)return NEW;
 const row=readConvergenceRecord().paths.find(x=>x.path===PROVIDER_PATH);
 assert(row,'Unregistered current Provider endpoint');
 assert.equal(row.previousSHA256,NEW,'Exact R2.1 endpoint must precede the separate current source');
 assert.equal(sha(Buffer.from(row.previousBytesBase64,'base64')),NEW,'Immutable R2.1 bytes');
 // Current pure request extraction must invert byte-exactly to the registered source.
 if(sha(current)==='cdf46681ba2bace46a04468c09817293eb67545c61a899327977d3d7a56fc88f'){assert.equal(sha(currentNarrativePreparationPredecessor(PROVIDER_PATH,current)),row.sha256,'PURE_REQUEST_PREPARATION_EXACT_REGISTERED_PARENT');return sha(current);}
 assert.equal(sha(current),row.sha256,'CURRENT Provider must equal the exact registered source, never a substituted predecessor');
 return row.sha256;
}

// This is an additional narrow assertion. The original prelive loop still hashes
// the CURRENT file and compares it against its fully linked registered endpoint.
export function assertExactBaziProviderSuccessor({record=JSON.parse(fs.readFileSync(SUCCESSOR_RECORD,'utf8')),current=fs.readFileSync(PROVIDER_PATH)}={}){
 const oldRecord=git(SUCCESSOR_RECORD);
 assert.equal(sha(oldRecord),'7fb07907c5cb7ccb25b7e0c48e9eae2c3a103dc921f52c787d89060fbdce75f2','immutable prior successor record');
 assert.equal(sha(fs.readFileSync(AUDIT)),'3138f0b2b2df6d5c036ab8042c02a1066a1a076399b678f65b6b997a9afa66a0','historical audit unchanged');
 const expected=JSON.parse(oldRecord),owner=expected.owners.find(x=>x.path===PROVIDER_PATH);
 assert.equal(owner.successorSha256,OLD);assert.equal(owner.successorChain,undefined);
 owner.successorChain=[step];assert.deepEqual(record,expected,'only the exact Owner-authorized chain append is allowed');
 const old=git(PROVIDER_PATH);assert.equal(sha(old),OLD,'immutable provider predecessor');
 const currentEndpoint=exactCurrentEndpoint(current);
 assert.equal(sha(current),currentEndpoint,'current provider must equal exact authorized endpoint');
 const currentOwner=record.owners.find(x=>x.path===PROVIDER_PATH);
 let endpoint=currentOwner.successorSha256;
 for(const link of currentOwner.successorChain){assert.equal(link.predecessorSha256,endpoint);assert.equal(link.authorityOrAcceptedTextRewritten,false);endpoint=link.successorSha256;}
 assert.equal(endpoint,NEW,'Original R2.1 chain endpoint remains unchanged');
 assert.equal(sha(current),currentEndpoint,'CURRENT bytes, never predecessor substitution');
 return {predecessorSha256:OLD,historicalEndpointSha256:NEW,currentSha256:sha(current),historicalAuditUnchanged:true};
}
