import fs from 'node:fs';import path from 'node:path';
import {startWorldR4Server} from '../world-ux-r1/world-r4/server.mjs';
import {onRequestGet} from '../../../functions/api/book6-runtime-readout.js';
const base='tools/review/48-runtime-matrix-alignment-r1';
export function startMatrixReview({port=0,filename='.tmp/reality-navigation-continuity-r1/m48-review.sqlite',fromBuild=false}={}){
 return startWorldR4Server({port,filename,reviewExtension:async({req,u,origin,send})=>{
  if(req.method!=='GET')return false;
  if(u.pathname==='/api/book6-runtime-readout'){const r=await onRequestGet({request:new Request(origin+u.pathname+u.search)});send(r.status,await r.text());return true;}
  if(fromBuild&&(u.pathname.startsWith('/assets/')||u.pathname.startsWith('/books/reality-reconfiguration/'))){const rel=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname,file=path.resolve('.pages-output','.'+rel);if(!file.startsWith(path.resolve('.pages-output')+path.sep)||!fs.existsSync(file)){send(404,{code:'BUILD_ASSET_NOT_FOUND'});return true;}send(200,fs.readFileSync(file),{'content-type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});return true;}
  const allowed=['/books/reality-reconfiguration/','/books/reality-reconfiguration/index.html','/content/registry/runtime-position-48-v1.json','/content/registry/runtime-position-48-crosswalk-v1.json','/content/registry/runtime-position-48-source-windows-v1.json','/content/registry/figures.json'];
  if(allowed.includes(u.pathname)||u.pathname.startsWith('/'+base+'/')){const rel=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname,file=path.resolve('.'+rel);if(!file.startsWith(process.cwd()+path.sep)||!fs.existsSync(file)){send(404,{code:'NOT_FOUND'});return true;}const ext=path.extname(file);send(200,fs.readFileSync(file),{'content-type':({'.html':'text/html','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.webp':'image/webp','.md':'text/plain'})[ext]||'application/octet-stream'});return true;}
  return false;
 }});
}
if(process.argv.includes('--serve')){const s=await startMatrixReview({port:64248});console.log(s.origin+'/books/reality-reconfiguration/?locale=en&atlas=positions&position=RP-08');}
