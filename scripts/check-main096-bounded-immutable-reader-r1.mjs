import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import cp from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {fileURLToPath} from 'node:url';

const cases={
  'unknown-path':/Unexpected immutable path/,
  'duplicate-path':/Duplicate immutable path/,
  'tree-type':/Immutable path must name a blob/,
  'blob-id':/Immutable batch object identity/,
  'blob-bytes':/Immutable blob content identity/,
  'blob-tail':/Unexpected immutable batch remainder/,
  'literal-exists':/Literal blob must be absent/,
  'record-drift':/Immutable receiver governance record/,
  'custom-git':/Literal blob must be absent/,
};
const name=process.argv[2];
if(!name){
  for(const key of Object.keys(cases)){
    const result=cp.spawnSync(process.execPath,[fileURLToPath(import.meta.url),key],{stdio:'inherit'});
    assert.equal(result.status,0,'Bounded immutable reader refusal: '+key);
  }
  console.log(`Main096 bounded immutable reader: ${Object.keys(cases).length} transport/parent refusals PASS; no real Git or Provider calls in negative fixtures.`);
}else{
  assert(Object.hasOwn(cases,name),'Unknown negative fixture');
  const recordPath='content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/SIX-METHOD-MAIN096-RECEIVER-GOVERNANCE-SUCCESSOR.json';
  const recordBytes=fs.readFileSync(recordPath),record=JSON.parse(recordBytes);
  const literal='functions/api/method-reading/[method].js';
  const target=name==='literal-exists'?literal:record.immutableAuthorities[0].path;
  const body=Buffer.from('Isolated negative fixture; never an accepted immutable source.'),object=crypto.createHash('sha1').update(Buffer.from('blob '+body.length+'\0')).update(body).digest('hex');
  let calls=0;
  cp.execFileSync=(file,args)=>{
    assert.equal(file,'git','Negative fixture cannot invoke another executable');calls++;
    if(args.includes('ls-tree')){
      assert.equal(args[0],'--literal-pathspecs');
      const requested=args.slice(args.indexOf('--')+1);assert(requested.includes(target));assert(!args.includes('-r'));
      const entry=`100644 blob ${object}\t${target}\0`;
      if(name==='unknown-path')return Buffer.from(`100644 blob ${object}\t__unregistered__.js\0`);
      if(name==='duplicate-path')return Buffer.from(entry+entry);
      if(name==='tree-type')return Buffer.from(`040000 tree ${object}\t${target}\0`);
      return Buffer.from(entry);
    }
    assert.deepEqual(args,['cat-file','--batch']);
    const content=Buffer.from(body);if(name==='blob-bytes')content[0]^=1;
    const id=name==='blob-id'?(object[0]==='0'?'1':'0')+object.slice(1):object;
    const result=Buffer.concat([Buffer.from(`${id} blob ${body.length}\n`),content,Buffer.from('\n')]);
    return name==='blob-tail'?Buffer.concat([result,Buffer.from('unexpected')]):result;
  };
  syncBuiltinESMExports();
  const {validateMain096ReceiverGovernance}=await import('./lib/ppr-five-method-preentry-successor.mjs');
  const options={readCurrent:path=>fs.readFileSync(path)};
  if(name==='record-drift')options.recordBytes=Buffer.concat([recordBytes,Buffer.from('\n')]);
  if(name==='custom-git')options.readGit=()=>Buffer.from('unexpected historical blob');
  assert.throws(()=>validateMain096ReceiverGovernance(options),cases[name]);
  assert.equal(calls,name==='record-drift'||name==='custom-git'?0:name==='unknown-path'||name==='duplicate-path'||name==='tree-type'?1:2);
}
