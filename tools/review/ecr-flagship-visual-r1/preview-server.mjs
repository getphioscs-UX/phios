import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {onRequestGet as publicAssets} from '../../../functions/api/public-asset-config.js';
import {onRequestGet as catalog} from '../../../functions/api/commerce-catalog.js';
export function createPreviewServer(requests=[]){
 const root=process.cwd(),types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.ttf':'font/ttf','.ico':'image/x-icon'};
 return http.createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://127.0.0.1');requests.push({method:req.method,path:u.pathname});
  if(req.method!=='GET'){res.writeHead(405);return res.end();}
  if(u.pathname==='/api/public-asset-config'){const r=publicAssets({env:{PHIOS_PUBLIC_ASSET_BASE_URL:'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev'}});res.writeHead(r.status,{'content-type':'application/json'});return res.end(await r.text());}
  if(u.pathname==='/api/commerce-catalog'){const r=await catalog({request:new Request('http://127.0.0.1'+req.url),env:{REPORT_PROVIDER_LIVE_ALLOWED:'false'},data:{}});res.writeHead(r.status,{'content-type':'application/json'});return res.end(await r.text());}
  if(u.pathname.startsWith('/api/')){res.writeHead(401,{'content-type':'application/json'});return res.end(JSON.stringify({ok:false,code:'LOCAL_AUTH_REQUIRED'}));}
  const name=decodeURIComponent(u.pathname);let file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)||/[/\\]\.[^/\\]/.test(file)){res.writeHead(404);return res.end();}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');const ext=path.extname(file);if(!types[ext]||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.writeHead(200,{'content-type':types[ext],'cache-control':'no-store'});fs.createReadStream(file).pipe(res);
 }catch(e){res.writeHead(500);res.end('LOCAL_PREVIEW_UNAVAILABLE');}});
}
if(process.argv.includes('--serve')&&path.resolve(process.argv[1]||'')===fileURLToPath(import.meta.url)){const server=createPreviewServer();server.listen(0,'127.0.0.1',()=>{const origin='http://127.0.0.1:'+server.address().port;fs.writeFileSync('tools/review/ecr-flagship-visual-r1/PREVIEW-SERVER.json',JSON.stringify({origin,pid:process.pid,onlyGet:true,providerCalls:0,productionWrites:0},null,2));console.log(origin);});}
