import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {finalizeNewReportPdf} from '../../functions/report-delivery/report-pdf-finalization-r1.js';
const here=path.dirname(fileURLToPath(import.meta.url));
// This local bridge never runs in Pages Functions. The runtime accepts only a
// trusted server-owned finalizer; cloud integration requires its own admission.
export function createLocalReportPdfFinalizer({python,legacyRoot,outputRoot,policyForMethod}){
 if(!path.isAbsolute(outputRoot)||!path.isAbsolute(python)||!path.isAbsolute(legacyRoot)||typeof policyForMethod!=='function')throw Error('LOCAL_PDF_FINALIZER_CONFIGURATION_REQUIRED');
 return async({bytes,binding,bindingDigest,inputSHA256})=>{
  const policy=await policyForMethod(binding.methodCode,binding);
  if(!policy||policy.methodCode!==binding.methodCode||!Array.isArray(policy.assets))throw Error('METHOD_ASSET_POLICY_REQUIRED');
  const dir=path.join(outputRoot,binding.methodCode+'-'+randomUUID());fs.mkdirSync(dir,{recursive:true});
  const source=path.join(dir,'publication-source.pdf'),target=path.join(dir,'publication-final.pdf'),receipt=path.join(dir,'optimization-receipt.json'),config=path.join(dir,'optimization-input.json');
  fs.writeFileSync(source,bytes,{flag:'wx'});
  fs.writeFileSync(config,JSON.stringify({source,target,receipt,legacyRoot,policy,binding,bindingDigest,inputSHA256}),{flag:'wx'});
  await new Promise((resolve,reject)=>{
   const child=spawn(python,[path.join(here,'report-pdf-optimize-r1.py'),config],{cwd:dir,windowsHide:true,env:{...process.env,REPORT_PROVIDER_LIVE_ALLOWED:'false',REPORT_ZERO_COST_REPLAY:'true',PYTHONDONTWRITEBYTECODE:'1',TEMP:dir,TMP:dir},stdio:['ignore','pipe','pipe']});let output='';
   child.stdout.on('data',b=>{output=(output+b).slice(-4000);});child.stderr.on('data',b=>{output=(output+b).slice(-4000);});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('PDF_OPTIMIZER_FAILED '+code+' '+output)));
  });
  const data=JSON.parse(fs.readFileSync(receipt,'utf8'));
  if(createHash('sha256').update(fs.readFileSync(source)).digest('hex')!==inputSHA256)throw Error('PDF_SOURCE_CHANGED_DURING_FINALIZATION');
  return {bytes:new Uint8Array(fs.readFileSync(target)),receipt:data};
 };
}
export function createOptimizedReportRenderer({render,finalizer,bindingFor}){
 if(typeof render!=='function'||typeof finalizer!=='function'||typeof bindingFor!=='function')throw Error('OPTIMIZED_RENDERER_CONFIGURATION_REQUIRED');
 return async(...args)=>{
  const binding=await bindingFor(...args),bytes=new Uint8Array(await render(...args));
  return (await finalizeNewReportPdf({bytes,binding,finalizer})).bytes;
 };
}
