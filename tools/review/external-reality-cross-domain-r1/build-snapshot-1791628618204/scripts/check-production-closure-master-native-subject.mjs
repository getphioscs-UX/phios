// Reuse the existing native subject/account campaign; historical outputs remain intact.
import fs from 'node:fs';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';import path from 'node:path';
const source='scripts/check-production-closure-batch03-subject.mjs',root='content/production-closure/master-reconciliation';fs.mkdirSync(root,{recursive:true});
let text=fs.readFileSync(source,'utf8');const originalSha256=crypto.createHash('sha256').update(text).digest('hex');
text=text.replace("const d='content/production-closure/batch03/'","const d='content/production-closure/master-reconciliation/'");
if(text===fs.readFileSync(source,'utf8'))throw Error('REUSED_NATIVE_CAMPAIGN_OUTPUT_REDIRECTION_REQUIRED');
text=text.replace("assert.equal(c.snapshot.report,null);","assert.equal(c.snapshot.report,null);assert.equal(c.snapshot.verificationPlan.chapters.length,10);assert.equal(c.snapshot.verificationPlan.semanticReviewActivated,false);assert.equal(c.snapshot.verificationPlan.releaseAllowed,false);");
const temporary='scripts/.production-closure-master-native-subject-local.mjs';if(fs.existsSync(temporary))throw Error('TEMPORARY_CHECK_PATH_ALREADY_EXISTS');
fs.writeFileSync(temporary,text);try{await import(pathToFileURL(path.resolve(temporary)).href);}finally{fs.unlinkSync(temporary);}
fs.writeFileSync(root+'/native-campaign-reuse.json',JSON.stringify({source,originalSha256,change:'Only output directory and three verificationPlan assertions; existing 15 native SQL/account/entitlement/consent groups reused.',historicalOutputsRewritten:false,realAccounts:false,realPayment:false},null,2)+'\n');
