import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url); let sharpModule;
export const ROOT=process.cwd();
export const BASE='3986cca72634d9a09bb4cfd38d1d11981bce571e';
export const P={
 reg:'content/visual-production/figure/canonical-client-figure-registry-v2.json',
 runtime:'content/visual-production/figure/figure-visual-accuracy-runtime-v1.json',
 specDir:'content/visual-production/figure/figure-visual-spec',
 sourceDir:'content/visual-production/figure/figure-source-bindings',
 prod:'content/visual-production/figure/figure-production',
 style:'content/visual-production/figure/figure-production/figure-style-tokens-v1.json',
 grammar:'content/visual-production/figure/figure-production/diagram-grammar-v1.json',
 acceptance:'content/visual-production/figure/figure-production/figure-machine-acceptance-registry-v1.json'
};
export const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
function sortDeep(x){if(Array.isArray(x))return x.map(sortDeep);if(x&&typeof x==='object'){const o={};for(const k of Object.keys(x).sort())o[k]=sortDeep(x[k]);return o;}return x;}
export const stable=x=>JSON.stringify(sortDeep(x),null,2)+'\n';
export const shaBytes=b=>crypto.createHash('sha256').update(b).digest('hex');
export const sha=p=>shaBytes(fs.readFileSync(p));
export const ids=()=>Array.from({length:57},(_,i)=>`FIG-${String(i+1).padStart(3,'0')}`);
export function requestedIds(argv=process.argv.slice(2)){const i=argv.indexOf('--id');if(i>=0&&argv[i+1])return [argv[i+1]];return ids();}
export const specPath=id=>`${P.specDir}/${id}.visual-spec.json`;
export const sourcePath=id=>`${P.sourceDir}/${id}.source-binding.json`;
export const manifestPath=id=>`${P.prod}/manifests/${id}.production-manifest.json`;
export const carPath=id=>`${P.prod}/car-candidates/${id}.car-handoff.json`;
export function entryById(id){const e=read(P.reg).entries.find(x=>x.figureId===id);if(!e)throw new Error(`Unknown ${id}`);return e;}
export const svgPath=id=>`${P.prod}/output/svg/${entryById(id).canonicalFilename}`;
export const pngPath=id=>`${P.prod}/output/png/${entryById(id).canonicalFilename.replace(/\.svg$/i,'.png')}`;
export const webpPath=id=>`${P.prod}/output/webp/${entryById(id).canonicalFilename.replace(/\.svg$/i,'.webp')}`;
export function esc(s){return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
export function ensureDir(p){fs.mkdirSync(p,{recursive:true});}
export function writeFile(p,data){ensureDir(path.dirname(p));fs.writeFileSync(p,data);}
function wrapLabel(label,max=25){const words=String(label).split(/\s+/),lines=[];let cur='';for(const w of words){const next=cur?cur+' '+w:w;if(next.length<=max||!cur)cur=next;else{lines.push(cur);cur=w;}}if(cur)lines.push(cur);if(lines.length>2)return [lines[0],lines.slice(1).join(' ')];return lines;}
function box(x,y,w,h,row=0,col=0){return {x:Math.round(x),y:Math.round(y),width:w,height:h,row,col};}
export function layout(spec,style){
 const c=style.canvas,g=style.geometry,n=spec.nodes.length,nodes={};
 if(spec.diagramRole==='LOOP'){
  const w=240,h=94,cx=c.width/2,cy=625,rx=690,ry=350;
  spec.nodes.forEach((node,i)=>{const a=-Math.PI/2+(2*Math.PI*i/n);nodes[node.nodeId]=box(cx+rx*Math.cos(a)-w/2,cy+ry*Math.sin(a)-h/2,w,h,i,0);});
 } else if(spec.diagramRole==='BOUNDARY' && spec.boundaries.length){
  const b=spec.boundaries[0],inside=new Set(b.contains),left=spec.nodes.filter(x=>inside.has(x.nodeId)),right=spec.nodes.filter(x=>!inside.has(x.nodeId));
  const w=300,h=100; const place=(arr,x0,x1)=>arr.forEach((node,i)=>{const cols=Math.min(2,arr.length),row=Math.floor(i/cols),col=i%cols,step=(x1-x0)/cols;nodes[node.nodeId]=box(x0+col*step+(step-w)/2,260+row*180,w,h,row,col);});
  place(left,90,980); place(right,1110,1910);
 } else {
  const cols=n<=5?n:(n<=8?4:3),rows=Math.ceil(n/cols),w=Math.min(g.nodeWidth,Math.floor((c.width-2*c.padding-(cols-1)*g.colGap)/cols)),h=g.nodeHeight;
  const totalW=cols*w+(cols-1)*g.colGap,x0=(c.width-totalW)/2; const rowStep=Math.min(h+g.rowGap,(c.height-310)/Math.max(1,rows));
  spec.nodes.forEach((node,i)=>{const row=Math.floor(i/cols),raw=i%cols,col=row%2===0?raw:cols-1-raw;nodes[node.nodeId]=box(x0+col*(w+g.colGap),210+row*rowStep,w,h,row,col);});
 }
 const boundaries={};
 for(const b of spec.boundaries){const boxes=b.contains.map(id=>nodes[id]).filter(Boolean);if(!boxes.length)continue;const minX=Math.min(...boxes.map(x=>x.x))-g.boundaryPadding,minY=Math.min(...boxes.map(x=>x.y))-g.boundaryPadding,maxX=Math.max(...boxes.map(x=>x.x+x.width))+g.boundaryPadding,maxY=Math.max(...boxes.map(x=>x.y+x.height))+g.boundaryPadding;boundaries[b.boundaryId]={x:minX,y:minY,width:maxX-minX,height:maxY-minY};}
 const edges={};
 for(const e of spec.edges){const a=nodes[e.from],b=nodes[e.to];if(!a||!b)continue;
  if(spec.diagramRole==='LOOP'){const ac=[a.x+a.width/2,a.y+a.height/2],bc=[b.x+b.width/2,b.y+b.height/2],dx=bc[0]-ac[0],dy=bc[1]-ac[1];const cut=(box,from,to)=>{const cx=box.x+box.width/2,cy=box.y+box.height/2,vx=to[0]-from[0],vy=to[1]-from[1],tx=Math.abs(vx)>1e-9?(box.width/2)/Math.abs(vx):Infinity,ty=Math.abs(vy)>1e-9?(box.height/2)/Math.abs(vy):Infinity,t=Math.min(tx,ty);return [Math.round(cx+vx*t),Math.round(cy+vy*t)];};const p1=cut(a,ac,bc),p2=cut(b,bc,ac);edges[e.edgeId]={points:[p1,p2],mode:'STRAIGHT'};}
  else {const ax=a.x+a.width/2,ay=a.y+a.height/2,bx=b.x+b.width/2,by=b.y+b.height/2;let p1,p2;if(Math.abs(bx-ax)>Math.abs(by-ay)){p1=[bx>ax?a.x+a.width:a.x,ay];p2=[bx>ax?b.x:b.x+b.width,by];const mid=Math.round((p1[0]+p2[0])/2);edges[e.edgeId]={points:[p1,[mid,p1[1]],[mid,p2[1]],p2],mode:'ORTHO'};}else{p1=[ax,by>ay?a.y+a.height:a.y];p2=[bx,by>ay?b.y:b.y+b.height];const mid=Math.round((p1[1]+p2[1])/2);edges[e.edgeId]={points:[p1,[p1[0],mid],[p2[0],mid],p2],mode:'ORTHO'};}}
 }
 return {canvas:c,nodes,boundaries,edges};
}
export function renderSvg(spec,style){
 const L=layout(spec,style),t=style.domainTokens[spec.domain]||style.domainTokens.GLOBAL,g=style.geometry,ty=style.typography,o=[];
 o.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${style.canvas.width} ${style.canvas.height}" width="${style.canvas.width}" height="${style.canvas.height}" data-figure-id="${esc(spec.figureId)}" data-renderer-version="FIG-RENDERER-1.0.0" data-style-version="${esc(style.styleVersion)}">`);
 o.push(`<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="${t.stroke}"/></marker></defs>`);
 o.push(`<rect width="100%" height="100%" fill="${t.background}"/>`);
 o.push(`<text x="72" y="72" fill="${t.accent}" font-family="${ty.fontFamily}" font-size="${ty.titleSize}" font-weight="700">${esc(spec.figureId)} · ${esc(spec.semanticName)}</text>`);
 o.push(`<text x="72" y="108" fill="${t.accent}" opacity="0.72" font-family="${ty.fontFamily}" font-size="${ty.subtitleSize}">${esc(spec.domain)} · ${esc(spec.diagramRole)} · CANONICAL SVG</text>`);
 for(const b of spec.boundaries){const q=L.boundaries[b.boundaryId];if(!q)continue;o.push(`<g id="boundary-${esc(b.boundaryId)}" data-boundary-type="${esc(b.boundaryType)}"><rect x="${q.x}" y="${q.y}" width="${q.width}" height="${q.height}" rx="24" fill="none" stroke="${t.stroke}" stroke-width="2" stroke-dasharray="10 8" opacity="0.72"/><text x="${q.x+15}" y="${q.y+24}" fill="${t.accent}" font-family="${ty.fontFamily}" font-size="${ty.metaSize}">${esc(b.boundaryId)}</text></g>`);}
 for(const e of spec.edges){const q=L.edges[e.edgeId];if(!q)continue;const d=q.points.map((p,i)=>`${i?'L':'M'} ${p[0]} ${p[1]}`).join(' ');o.push(`<g id="edge-${esc(e.edgeId)}" data-from="${esc(e.from)}" data-to="${esc(e.to)}" data-relation="${esc(e.relation)}"><path d="${d}" fill="none" stroke="${t.stroke}" stroke-width="${g.edgeWidth}" stroke-linejoin="round" marker-end="url(#arrow)" opacity="0.88"/></g>`);}
 for(const n of spec.nodes){const q=L.nodes[n.nodeId],lines=wrapLabel(n.displayLabel);let text=`<text x="${q.x+q.width/2}" y="${q.y+(lines.length===1?56:43)}" text-anchor="middle" fill="${t.accent}" font-family="${ty.fontFamily}" font-size="${ty.nodeSize}" font-weight="700">`;lines.forEach((line,i)=>text+=`<tspan x="${q.x+q.width/2}" dy="${i?24:0}">${esc(line)}</tspan>`);text+='</text>';o.push(`<g id="node-${esc(n.nodeId)}" data-figure-node="${esc(n.nodeId)}" data-semantic-key="${esc(n.semanticKey)}"><rect x="${q.x}" y="${q.y}" width="${q.width}" height="${q.height}" rx="${g.nodeRadius}" fill="${t.panel}" stroke="${t.stroke}" stroke-width="2"/>${text}</g>`);}
 o.push(`<text x="72" y="1145" fill="${t.accent}" opacity="0.58" font-family="${ty.fontFamily}" font-size="14">Repository-bound · source-bound · deterministic geometry · long copy excluded</text>`);o.push('</svg>');return o.join('\n')+'\n';
}
export const geometryFingerprint=(spec,style)=>shaBytes(Buffer.from(stable(layout(spec,style))));
export async function rasterize(svg,png,webp){ensureDir(path.dirname(png));ensureDir(path.dirname(webp));try{sharpModule??=require('sharp');}catch(error){throw new Error(`Repository raster backend unavailable. Run npm ci. ${error?.message||error}`);}const input=fs.readFileSync(svg),image=sharpModule(input,{density:96,unlimited:false,failOn:'error'});await Promise.all([image.clone().png({compressionLevel:6,adaptiveFiltering:false,palette:false,effort:4}).toFile(png),image.clone().webp({quality:92,alphaQuality:100,effort:4,smartSubsample:false,lossless:false}).toFile(webp)]);}
