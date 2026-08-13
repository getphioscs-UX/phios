import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const ROOT=process.cwd();
const sourceRegistryPath=path.join(ROOT,'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v1.json');
const registryPath=path.join(ROOT,'content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json');
const verificationPath=path.join(ROOT,'content/knowledge/source-access/registries/r2-manuscript-object-verification-v1.json');
const sourceRegistry=JSON.parse(fs.readFileSync(sourceRegistryPath,'utf8'));
const registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
const bucketName=sourceRegistry.bucketName;
const verification=JSON.parse(fs.readFileSync(verificationPath,'utf8'));
const args=process.argv.slice(2);
const corpusDir=path.resolve(args.find(arg=>!arg.startsWith('--'))||process.env.KSAR_PRIVATE_CORPUS_DIR||'');
const upload=args.includes('--upload');
const write=args.includes('--write');
if(!corpusDir||!fs.existsSync(corpusDir)) throw new Error('Usage: node scripts/verify-ksar-r2-remote.mjs <private-corpus-dir> [--upload] [--write]');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function localFile(key){return [path.join(corpusDir,key),path.join(corpusDir,key.replace(/^books[\\/]/,''))].find(fs.existsSync);}
function wrangler(command){
  const result=spawnSync(process.platform==='win32'?'npx.cmd':'npx',['wrangler',...command],{cwd:ROOT,stdio:'inherit'});
  if(result.status!==0) throw new Error(`wrangler failed: ${command.join(' ')}`);
}
for(const source of registry.records){
  const file=localFile(source.r2ObjectKey); if(!file) throw new Error(`Missing local file ${source.r2ObjectKey}`);
  const localHash=sha(file); if(localHash!==source.retrievalCorpusSha256) throw new Error(`Local hash mismatch ${source.sourceCode}`);
  const target=`${bucketName}/${source.r2ObjectKey}`;
  if(upload) wrangler(['r2','object','put',target,`--file=${file}`,'--remote']);
  const remoteFile=path.join(os.tmpdir(),`phios-ksar-${source.bookCode.toLowerCase()}-${process.pid}.json`);
  try{
    wrangler(['r2','object','get',target,`--file=${remoteFile}`,'--remote']);
    const remoteHash=sha(remoteFile); if(remoteHash!==source.retrievalCorpusSha256) throw new Error(`REMOTE_SHA256_MISMATCH ${source.sourceCode}: ${remoteHash}`);
    const row=verification.records.find(record=>record.sourceCode===source.sourceCode);
    if(row){row.remoteObjectGetVerified=true;row.remoteBytesSha256=remoteHash;row.productionEligible=true;}
    console.log(`✓ remote GET verified ${source.sourceCode} ${remoteHash}`);
  } finally { if(fs.existsSync(remoteFile)) fs.rmSync(remoteFile,{force:true}); }
}
if(write){
  verification.status='REVIEWED_CORPUS_REMOTE_GET_SHA256_VERIFIED';
  fs.writeFileSync(verificationPath,JSON.stringify(verification,null,2)+'\n','utf8');
  console.log(`✓ updated ${verificationPath}`);
} else {
  console.log('Remote verification passed in this run. Re-run with --write to persist verification evidence in the registry.');
}
