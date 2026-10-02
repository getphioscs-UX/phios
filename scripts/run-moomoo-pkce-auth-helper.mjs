import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildAuthorizeUrl,assertLoopbackRedirect,pkceChallenge,randomToken,sanitizeClientRegistration} from './lib/civilization-atlas/moomoo-pkce-auth-helper-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const authDir=path.join(root,'.moomoo-auth');
const clientFile=path.join(authDir,'client.json');
const host='https://webapi.moomoo.com';
const redirectUri='http://localhost:60355/callback';
assertLoopbackRedirect(redirectUri);

const safeJson=async res=>{const t=await res.text();try{return JSON.parse(t);}catch{throw new Error('MOOMOO_OAUTH_NON_JSON_RESPONSE:HTTP_'+res.status);}};
const openBrowser=url=>{
  const platform=process.platform;
  const cmd=platform==='win32'?'cmd':platform==='darwin'?'open':'xdg-open';
  const args=platform==='win32'?['/c','start','',''+url]:[url];
  const child=spawn(cmd,args,{detached:true,stdio:'ignore'});
  child.unref();
};
async function registerClient(){
  const envId=String(process.env.MOOMOO_CLIENT_ID||'').trim();
  if(envId)return {clientId:envId,source:'MOOMOO_CLIENT_ID_ENV'};
  if(fs.existsSync(clientFile)){
    const meta=JSON.parse(fs.readFileSync(clientFile,'utf8'));
    if(meta?.clientId)return {clientId:String(meta.clientId),source:'LOCAL_IGNORED_CLIENT_METADATA'};
  }
  const res=await fetch(host+'/oauth2/register',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({
    redirect_uris:[redirectUri],
    token_endpoint_auth_method:'none',
    grant_types:['authorization_code','refresh_token'],
    response_types:['code'],
    client_name:'PHI OS Moomoo OpenAPI'
  })});
  const body=await safeJson(res);
  if(!res.ok||!body?.client_id)throw new Error('MOOMOO_OAUTH_CLIENT_REGISTRATION_FAILED:HTTP_'+res.status);
  const meta=sanitizeClientRegistration(body);
  fs.mkdirSync(authDir,{recursive:true});
  fs.writeFileSync(clientFile,JSON.stringify(meta,null,2)+'\n',{mode:0o600});
  return {clientId:meta.clientId,source:'DYNAMIC_REGISTRATION'};
}
function waitForCallback(expectedState){
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{server.close();reject(new Error('MOOMOO_OAUTH_CALLBACK_TIMEOUT'));},10*60*1000);
    const server=http.createServer((req,res)=>{
      try{
        const u=new URL(req.url,'http://localhost:60355');
        if(u.pathname!=='/callback'){res.writeHead(404);res.end('Not found');return;}
        const error=u.searchParams.get('error');
        if(error){res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});res.end('Moomoo authorization failed. You may close this window.');clearTimeout(timeout);server.close();reject(new Error('MOOMOO_OAUTH_AUTHORIZE_ERROR:'+error));return;}
        const returnedState=u.searchParams.get('state');
        const code=u.searchParams.get('code');
        if(!returnedState||returnedState!==expectedState){res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});res.end('Invalid OAuth state. You may close this window.');clearTimeout(timeout);server.close();reject(new Error('MOOMOO_OAUTH_STATE_MISMATCH'));return;}
        if(!code){res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});res.end('Authorization code missing. You may close this window.');clearTimeout(timeout);server.close();reject(new Error('MOOMOO_OAUTH_CODE_MISSING'));return;}
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
        res.end('<!doctype html><meta charset="utf-8"><title>PHI OS · Moomoo</title><body style="font-family:system-ui;padding:40px"><h1>授权完成</h1><p>PHI OS 已收到 Moomoo 授权。你可以关闭这个窗口，终端会继续执行第一批 live import。</p></body>');
        clearTimeout(timeout);server.close();resolve(code);
      }catch(e){clearTimeout(timeout);server.close();reject(e);}
    });
    server.listen(60355,'127.0.0.1');
    server.on('error',reject);
  });
}
async function exchangeCode({code,clientId,verifier}){
  const body=new URLSearchParams({grant_type:'authorization_code',code,client_id:clientId,redirect_uri:redirectUri,code_verifier:verifier});
  const res=await fetch(host+'/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body});
  const token=await safeJson(res);
  if(!res.ok||!token?.access_token)throw new Error('MOOMOO_OAUTH_TOKEN_EXCHANGE_FAILED:HTTP_'+res.status);
  return token;
}
function runLiveImport(accessToken){
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[path.join(root,'scripts/run-moomoo-first-live-import.mjs')],{
      cwd:root,
      stdio:'inherit',
      env:{...process.env,MOOMOO_ACCESS_TOKEN:accessToken}
    });
    child.on('error',reject);
    child.on('exit',code=>code===0?resolve():reject(new Error('MOOMOO_FIRST_LIVE_IMPORT_EXIT_'+code)));
  });
}

const state=randomToken(32);
const verifier=randomToken(64);
const challenge=pkceChallenge(verifier);
const client=await registerClient();
const authorizeUrl=buildAuthorizeUrl({host,clientId:client.clientId,redirectUri,state,codeChallenge:challenge});
console.log('Moomoo OAuth helper ready. Client source: '+client.source);
console.log('Opening the Moomoo authorization page in your browser. Approve only the quote/read access you intend to use.');
const callback=waitForCallback(state);
openBrowser(authorizeUrl);
const code=await callback;
console.log('OAuth callback validated. Exchanging authorization code without printing secrets...');
const token=await exchangeCode({code,clientId:client.clientId,verifier});
console.log('Access token received in memory. Starting governed HISTORY_KLINE live import...');
await runLiveImport(token.access_token);
console.log('PKCE session complete. Access/refresh tokens were not persisted or printed.');
