import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
export function createPhiCardReviewServer(){return http.createServer((req,res)=>{
 if(req.method!=='GET'){res.writeHead(405);return res.end();}
 const url=new URL(req.url,'http://localhost'),name=url.pathname.split('/').pop();
 let file;
 if(url.pathname==='/content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html')file='content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html';
 else if(url.pathname.startsWith('/card-assets/')&&/^ECR-PC-[CDGTFP]\d{2}\.webp$/.test(name))file=path.join('.tmp/phi-card-reading-r1/assets',name);
 else if(['/','/index.html','/review.js','/gallery.json','/synthetic-example.json','/ASSET-BYTES.json'].includes(url.pathname))file=path.join('tools/review/phi-card-reading-r1',name||'index.html');
 if(!file||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 const mime=file.endsWith('.webp')?'image/webp':file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':'text/html';
 res.writeHead(200,{'content-type':mime+'; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});fs.createReadStream(file).pipe(res);
 });}
