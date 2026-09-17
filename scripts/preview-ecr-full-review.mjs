import http from 'node:http';
import {localAsset} from './lib/ca-r1-preview-server.mjs';
import {onRequestPost} from '../functions/api/customer-current-reality.js';
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1');let response;
 if(url.pathname==='/api/customer-current-reality'&&req.method==='POST'){
  let body='';for await(const chunk of req){body+=chunk;if(body.length>20000){res.writeHead(413).end();return;}}
  response=await onRequestPost({request:new Request(url,{method:'POST',headers:{'content-type':'application/json'},body})});
 }else response=localAsset(url);
 res.writeHead(response.status,{...Object.fromEntries(response.headers),'cache-control':'no-store'});res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500).end('Local preview request failed');}});
server.listen(0,'127.0.0.1',()=>console.log(`ECR_REVIEW_URL=http://127.0.0.1:${server.address().port}/docs/ecr-full-r1/review.html`));
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
