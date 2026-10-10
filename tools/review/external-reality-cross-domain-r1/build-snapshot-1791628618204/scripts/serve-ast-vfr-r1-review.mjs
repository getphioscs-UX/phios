import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),rel=pathname==='/'?'tools/review/AST-VFR-R1-TL-PUBLICATION-REVIEW.html':pathname.slice(1);const file=path.resolve(root,rel);const allowed=rel==='tools/review/AST-VFR-R1-TL-PUBLICATION-REVIEW.html'||rel.startsWith('assets/ast-vfr-r1/')||/^assets\/images\/report\/VIS-REPORT-ASTROLOGY-MOTIF-[12]\.svg$/.test(rel);if(!allowed||!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',file.endsWith('.webp')?'image/webp':file.endsWith('.svg')?'image/svg+xml':'text/html; charset=utf-8');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}}).listen(4319,'127.0.0.1',()=>console.log('AST local review http://127.0.0.1:4319/'));
