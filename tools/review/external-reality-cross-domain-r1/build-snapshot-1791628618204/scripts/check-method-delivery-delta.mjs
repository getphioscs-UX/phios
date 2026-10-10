import fs from 'node:fs';
const code=process.argv[2],registry=JSON.parse(fs.readFileSync('content/reports/method-report-delivery-delta-registry-v1.json'));
const entry=registry.methods.find(x=>x.methodCode===code);if(!entry)throw Error('METHOD_DELIVERY_DELTA_NOT_REGISTERED');
const receipt=JSON.parse(fs.readFileSync(entry.receiptRef));
if(receipt.status!=='PASS'||!receipt.deployedProof){console.error(JSON.stringify({methodCode:code,status:receipt.status,blockers:receipt.blockers},null,2));process.exitCode=2;}
else console.log('PASS '+code+' method delivery delta; full shared E2E not repeated.');
