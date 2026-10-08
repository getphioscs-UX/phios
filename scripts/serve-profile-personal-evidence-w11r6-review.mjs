import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const root=path.resolve(process.env.W11R6_REPAIR_AUDIT||'content/profile/successors/personal-evidence-r1/w11r6'),port=Number(process.argv[2]||8806);
http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
 const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file;
 if(route==='/w11r6/'||route==='/')file=path.join(root,'PRD-W11R6-PFIG-HUMAN-REVIEW.html');
 else if(route==='/w11r6/report.pdf')file=path.resolve(process.env.W11R6_REPAIR_PDF||'output/pdf/w11r6','PRD-W11R6-CASE-01-PUBLICATION-REVIEW.pdf');
 else if(/^\/w11r6\/CASE-(08|09)\.pdf$/.test(route))file=path.resolve(process.env.W11R6_REPAIR_PDF||'output/pdf/w11r6',path.basename(route,'.pdf')+'-bilingual-dossier.pdf');
 else if(route.startsWith('/w11r6/artwork/'))file=path.resolve('.tmp/w11r3',path.basename(route));
 else if(/^\/w11r6\/(?:PRD-W11R6-[A-Z0-9-]+\.(?:html|json|md)|synthetic-explicit-observation\.html|(?:before|after)\/[A-Za-z0-9-]+\.png)$/.test(route))file=path.resolve(root,route.slice('/w11r6/'.length));
 else if(process.env.W11R6_REPAIR_AUDIT&&/^\/w11r6\/(?:[A-Za-z0-9_.-]+\.(?:json|jsonl|md|log)|pdf-render\/[A-Za-z0-9-]+\.png)$/.test(route))file=path.resolve(root,route.slice('/w11r6/'.length));
 if(!file||!fs.existsSync(file)){res.writeHead(404).end();return;}
 const mime={'.html':'text/html; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.pdf':'application/pdf','.md':'text/plain; charset=utf-8'};
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log('W11R6 review http://127.0.0.1:'+port+'/w11r6/'));
