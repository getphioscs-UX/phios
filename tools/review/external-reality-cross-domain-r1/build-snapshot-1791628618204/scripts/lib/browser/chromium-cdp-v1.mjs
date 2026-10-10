import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import os from 'node:os';

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8'};
export async function freePort(){return await new Promise((resolve,reject)=>{const s=net.createServer();s.unref();s.on('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
export async function startStaticServer(root=process.cwd()){
  const server=http.createServer((req,res)=>{
    try{
      const url=new URL(req.url,'http://127.0.0.1');
      let pathname=decodeURIComponent(url.pathname);
      if(pathname.endsWith('/'))pathname+='index.html';
      const full=path.resolve(root,'.'+pathname);
      if(!full.startsWith(path.resolve(root)+path.sep)&&full!==path.resolve(root)){res.writeHead(403);res.end('Forbidden');return;}
      if(!fs.existsSync(full)||!fs.statSync(full).isFile()){res.writeHead(404,{'content-type':'text/plain'});res.end('Not found');return;}
      res.writeHead(200,{'content-type':mime[path.extname(full).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
      fs.createReadStream(full).pipe(res);
    }catch(error){res.writeHead(500);res.end(String(error));}
  });
  await new Promise((resolve,reject)=>{server.on('error',reject);server.listen(0,'0.0.0',resolve);});
  const port=server.address().port;
  const host=String(process.env.PHIOS_BROWSER_HOST||'127.0.0.1').trim();
  return {baseUrl:`http://${host}:${port}`,close:()=>new Promise(r=>server.close(r))};
}
function candidates(){
  const out=[process.env.PHIOS_BROWSER_EXECUTABLE,process.env.CHROME_PATH];
  if(process.platform==='win32'){
    for(const base of [process.env.PROGRAMFILES,process.env['PROGRAMFILES(X86)'],process.env.LOCALAPPDATA]) if(base){out.push(path.join(base,'Microsoft','Edge','Application','msedge.exe'));out.push(path.join(base,'Google','Chrome','Application','chrome.exe'));}
  }else out.push('/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable');
  return [...new Set(out.filter(Boolean))];
}
export function findChromium(){for(const p of candidates()){if(path.isAbsolute(p)&&fs.existsSync(p))return p;const r=spawnSync(process.platform==='win32'?'where':'which',[p],{encoding:'utf8'});if(r.status===0&&r.stdout.trim())return r.stdout.trim().split(/\r?\n/)[0];}throw new Error('CHROMIUM_BROWSER_NOT_FOUND: set PHIOS_BROWSER_EXECUTABLE to Edge/Chrome/Chromium');}
class CDP{
  constructor(ws){this.wsUrl=ws;this.seq=0;this.pending=new Map();this.events=new Map();}
  async open(){this.ws=new WebSocket(this.wsUrl);await new Promise((resolve,reject)=>{this.ws.addEventListener('open',resolve,{once:true});this.ws.addEventListener('error',reject,{once:true});});this.ws.addEventListener('message',ev=>{const m=JSON.parse(ev.data);if(m.id&&this.pending.has(m.id)){const p=this.pending.get(m.id);this.pending.delete(m.id);if(m.error)p.reject(new Error(`${m.error.message||'CDP_ERROR'} ${JSON.stringify(m.error)}`));else p.resolve(m.result);}else if(m.method){for(const fn of this.events.get(m.method)||[])fn(m.params||{});}});return this;}
  on(method,fn){if(!this.events.has(method))this.events.set(method,new Set());this.events.get(method).add(fn);return()=>this.events.get(method)?.delete(fn);}
  send(method,params={}){const id=++this.seq;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));});}
  close(){try{this.ws?.close();}catch{}}
}
async function waitJson(url,timeout=10000){const start=Date.now();let last;while(Date.now()-start<timeout){try{const r=await fetch(url);if(r.ok)return await r.json();last=`HTTP ${r.status}`;}catch(e){last=e.message;}await sleep(80);}throw new Error(`CDP_NOT_READY: ${last||url}`);}
export async function launchBrowser({headless=true}={}){
  const executable=findChromium();const port=await freePort();const userData=fs.mkdtempSync(path.join(os.tmpdir(),'phios-browser-'));
  const args=[`--remote-debugging-port=${port}`,`--user-data-dir=${userData}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-sync','--metrics-recording-only','--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files','--ignore-certificate-errors'];
  if(headless)args.push('--headless=new','--disable-gpu');
  args.push('about:blank');
  const child=spawn(executable,args,{stdio:['ignore','pipe','pipe']});let stderr='';child.stderr.on('data',d=>stderr+=d.toString());
  try{const version=await waitJson(`http://127.0.0.1:${port}/json/version`,15000);return {executable,port,userData,child,version,async newPage(url='about:blank'){const r=await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`,{method:'PUT'});if(!r.ok)throw new Error(`CDP_NEW_PAGE_${r.status}`);const target=await r.json();return await new CDP(target.webSocketDebuggerUrl).open();},async close(){try{child.kill('SIGTERM');}catch{}await sleep(150);try{fs.rmSync(userData,{recursive:true,force:true});}catch{}}};}catch(e){try{child.kill('SIGKILL');}catch{}throw new Error(`${e.message}\n${stderr.slice(-3000)}`);}
}
export async function evaluate(cdp,expression,{awaitPromise=true}={}){const r=await cdp.send('Runtime.evaluate',{expression,awaitPromise,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw new Error(`BROWSER_EVAL_FAILED: ${r.exceptionDetails.text||''}`);return r.result?.value;}
export async function waitFor(cdp,expression,{timeout=8000,interval=60,label=expression}={}){const start=Date.now();let value;while(Date.now()-start<timeout){try{value=await evaluate(cdp,expression);if(value)return value;}catch{}await sleep(interval);}throw new Error(`BROWSER_WAIT_TIMEOUT: ${label}`);}
export async function key(cdp,keyName){const code={Tab:'Tab',Enter:'Enter',' ':'Space'}[keyName]||keyName;const keyCode={Tab:9,Enter:13,' ':32}[keyName]||0;await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:keyName,code,windowsVirtualKeyCode:keyCode,nativeVirtualKeyCode:keyCode});await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:keyName,code,windowsVirtualKeyCode:keyCode,nativeVirtualKeyCode:keyCode});}
