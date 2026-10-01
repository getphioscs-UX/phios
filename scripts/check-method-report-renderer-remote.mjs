import fs from 'node:fs';
import {createCustomerDeliverySnapshot} from '../functions/personal-reading/narrative/report-section-snapshot.js';
const results=[];
for(const locale of (process.argv[2]?[process.argv[2]]:['en','zh-Hans'])){
 const source=JSON.parse(fs.readFileSync(`docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-01-${locale}.json`));
 const snapshot=await createCustomerDeliverySnapshot({methodId:'ZWR',locale,subjectFingerprint:source.subject.subjectFingerprint,inputFingerprint:source.evidence.inputFingerprint??source.evidence.structured?.inputFingerprint,compositionVersion:'ZIWEI-PRODUCTION-COMPOSER-V1',authorityVersion:'ZIWEI_PRO_R2_AUTHORITY_V2',claimIrVersion:'REPORT_PUBLICATION_IR_V2',verifierVersion:'PRIVATE_QA_BROWSER_SERVICE_V1',semanticContent:{report:source.snapshot},createdAt:'2026-10-01T00:00:00Z'});
 const response=await fetch('http://127.0.0.1:8791/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:'ZWR',compositionVersion:'ZIWEI-PRODUCTION-COMPOSER-V1',candidate:{scope:'CONTROLLED_QA_ONLY',locale,snapshot}})});
 const raw=await response.text();let result;try{result=JSON.parse(raw);}catch{result={code:'NON_JSON_REMOTE_RESPONSE',reason:`HTTP ${response.status}`};}
 results.push({locale,status:response.status,verification:result.verification??null,code:result.code??null,stage:result.stage??null,errorName:result.errorName??null,reason:result.reason??null,limits:result.limits??null});
 console.log(locale,response.status,result.verification??result);
}
fs.writeFileSync('docs/reports/ziwei/production-admission/cpa-v1/remote-renderer-proof.json',JSON.stringify({scope:'PRIVATE_QA_BROWSER_SERVICE_VIA_LOCAL_PREVIEW_NOT_ACCOUNT_DELIVERY',results},null,2)+'\n');
if(results.some(p=>p.status!==200))process.exitCode=1;
