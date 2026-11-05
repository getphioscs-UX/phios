import fs from 'node:fs';import {createHash} from 'node:crypto';
import {escapeAst} from '../../functions/ast-full-production/ast-figure-escape-v1.js';
const hash=b=>createHash('sha256').update(b).digest('hex');
// Configure only D12 geometry in the existing, hash-pinned renderer. Keep its
// helpers, symbols, labels, colors, relationships and other twelve figures.
// This successor is QA-only pending visual acceptance; the frozen file is never
// edited and its original manifest remains valid for the original publication.
export function reflowAstSubjectD12R33(data,{rendererFile,expectedBaseSHA256}){
 const raw=fs.readFileSync(rendererFile,'utf8');if(hash(raw)!==expectedBaseSHA256)throw Error('AST_D12_BASE_RENDERER_DRIFT');
 const start=raw.indexOf('function pressure(d){'),end=raw.indexOf('\nfunction opportunity(d)',start);if(start<0||end<0)throw Error('AST_D12_NATIVE_RENDERER_SHAPE_CHANGED');
 let body=raw.slice(start,end);const patches=[
 ['const cx=190+i*340;','const cx=houses.length<=2?190+i*340:130+(i%3)*230,cy=houses.length<=2?275:190+Math.floor(i/3)*250,rr=houses.length<=2?132:100;'],
 ['circle(cx,275,132,','circle(cx,cy,rr,'],['text(cx,117,','text(cx,cy-rr-20,'],['75,cx,275)','Math.min(75,rr*.68),cx,cy)'],
 ['pos[k]={x:250+i*160,y:540}','pos[k]={x:250+i*160,y:houses.length<=2?540:720}'],['node(p,k,26)','node(p,k,houses.length<=2?26:22)']];
 for(const[a,b]of patches){if(body.split(a).length!==2)throw Error('AST_D12_PATCH_IDENTITY_MISMATCH');body=body.replace(a,b);}
 const configured=(raw.slice(0,start)+body+raw.slice(end)).replace(/^import .*?;\r?\n/,'').replace(/\bexport /g,'');
 // Only pinned repository source is evaluated, never manuscript/user data.
 const render=new Function('esc',configured+';return renderAstProductionFigure;')(escapeAst),svg=render('AST-D12',data);
 return {svg,proof:{baseRendererSHA256:hash(raw),configuredRendererSHA256:hash(configured),patches:patches.map(([from,to])=>({from,to})),sourceDataSHA256:hash(JSON.stringify(data)),sameNativeDrawingPrimitives:true,sourceFileWritten:false,visualAcceptance:'PENDING_R33_D12_GEOMETRY_ONLY'}};
}
