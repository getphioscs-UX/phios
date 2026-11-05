// Emergency scoped QA while C: is ENOSPC. This does not prove persistence.
const fs=require('fs'),{registerHooks}=require('node:module'),{pathToFileURL}=require('url');
const target=pathToFileURL(__dirname+'/check-num-native-account.bundle.mjs').href;
let code=fs.readFileSync(new URL(target),'utf8');
const start=code.indexOf('function qaCoreEnvironment('),end=code.indexOf('// functions/report-delivery/paid-report-numerology-local-adapter.js',start);
if(start<0||end<0)throw Error('QA_BUNDLE_BOUNDARY_CHANGED');
code=code.slice(0,start)+`function qaCoreEnvironment(root2,{clock:clock2=Date.now}={}){const sql=new DatabaseSync(':memory:');for(const m of loadRuntimeMigrations(process.cwd()).migrations)sql.exec(m.sql);const objects=new Map();const bucket={async put(k,v,o={}){const bytes=typeof v==='string'?Buffer.from(v):Buffer.from(v instanceof ArrayBuffer?new Uint8Array(v):v);objects.set(k,{bytes,o});return {size:bytes.length,...o};},async get(k){const a=objects.get(k);return a?{size:a.bytes.length,...a.o,json:async()=>JSON.parse(a.bytes.toString()),text:async()=>a.bytes.toString(),arrayBuffer:async()=>a.bytes.buffer.slice(a.bytes.byteOffset,a.bytes.byteOffset+a.bytes.length)}:null;}};const env={RUNTIME_DB:createSqliteD1Adapter(sql),PRIVATE_REPORTS:bucket,PHIOS_ENVIRONMENT:'local',STRIPE_ENVIRONMENT:'QA',PHIOS_COMMERCE_QA_ENABLED:'true'};const ctx=owner=>({env,data:{symbolicAccountIdentity:{userId:owner,providerId:'P8_QA',verified:true,authenticated:true}},request:new Request('https://local.invalid/api/report')});return {sql,env,ctx,clock:clock2};}\n`+code.slice(end);
const write='fs4.writeFileSync("C:/phios/tools/review/six-method-paid-report-integration-r2/NUM-R30-NATIVE-ACCOUNT-QA.json", JSON.stringify(result, null, 2));';
if(!code.includes(write))throw Error('QA_RECEIPT_BOUNDARY_CHANGED');
code=code.replace(write,"console.log(JSON.stringify({...result,status:'PASS_MEMORY_ONLY_ACCOUNT_PATH',durableStorageVerified:false,environmentBlocker:'ENOSPC',scope:result.scope+' SQLite and private bucket in memory only; not durable delivery or cold reopen.'}));");
code=code.replace("console.log(JSON.stringify({ status: result.status, bytes: first.length, negatives: negatives.length, providerCalls: 0 }));",'');
const hook=registerHooks({load(url,context,next){return url===target?{format:'module',source:code,shortCircuit:true}:next(url,context);}});
import(target).catch(e=>{console.error(e.message,e.stack?.slice(-1500));process.exitCode=1;}).finally(()=>hook.deregister());
