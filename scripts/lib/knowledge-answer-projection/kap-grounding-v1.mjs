import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

export const BASELINE='a1c724138c4fcb43599537e6b58cb0b8205253e4';
export const ROOT='content/knowledge/answer-projection';
export const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export const assertFile=p=>assert.ok(fs.existsSync(p),`MISSING_FILE:${p}`);
export const assertEvidence=entry=>{ assertFile(entry.path); assert.equal(sha256(entry.path),entry.sha256,`DIGEST_DRIFT:${entry.path}`); };
export const fakeAssetsEnv=()=>({
  ASSETS:{
    fetch:async request=>{
      const url=new URL(request.url);
      const path=url.pathname.replace(/^\//,'');
      if(!fs.existsSync(path)) return new Response('not found',{status:404});
      return new Response(fs.readFileSync(path),{status:200,headers:{'content-type':'application/json'}});
    }
  }
});
