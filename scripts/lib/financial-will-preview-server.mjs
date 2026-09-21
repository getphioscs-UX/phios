// Local QA only. Executes the actual request handlers; static files come from the existing preview.
import http from 'node:http';
import {onRequestPost as financial} from '../../functions/api/customer-financial-reality.js';
import {onRequestPost as estate} from '../../functions/api/customer-estate-planning.js';
const routes={'/api/customer-financial-reality':financial,'/api/customer-estate-planning':estate};
http.createServer(async(req,res)=>{
 try{const url=new URL(req.url,'http://127.0.0.1:8790');let response;
  if(routes[url.pathname]){if(req.method!=='POST'){res.writeHead(405).end();return;}const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>250000){res.writeHead(413).end();return;}chunks.push(chunk);}response=await routes[url.pathname]({request:new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:Buffer.concat(chunks)})});}
  else response=await fetch(`http://127.0.0.1:8788${url.pathname}${url.search}`);
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500).end('Local preview request failed');}
}).listen(8790,'127.0.0.1',()=>console.log('Financial + Will local handler preview: http://127.0.0.1:8790/professional/financial/'));
