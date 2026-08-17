import assert from 'node:assert/strict';
import {P,read,specPath,ids,layout} from './mfig/mfig-lib.mjs';
const style=read(P.style);
const inside=(x,y,b)=>x>b.x&&x<b.x+b.width&&y>b.y&&y<b.y+b.height;
const segHitsBox=(a,b,box)=>{
  if(a[0]===b[0]){const x=a[0],lo=Math.min(a[1],b[1]),hi=Math.max(a[1],b[1]);return x>box.x&&x<box.x+box.width&&hi>box.y&&lo<box.y+box.height;}
  if(a[1]===b[1]){const y=a[1],lo=Math.min(a[0],b[0]),hi=Math.max(a[0],b[0]);return y>box.y&&y<box.y+box.height&&hi>box.x&&lo<box.x+box.width;}
  return false;
};
for(const id of ids()){
 const sp=read(specPath(id)),L=layout(sp,style),boxes=Object.entries(L.nodes);
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const [a,A]=boxes[i],[b,B]=boxes[j];const overlap=A.x<B.x+B.width&&A.x+A.width>B.x&&A.y<B.y+B.height&&A.y+A.height>B.y;assert.equal(overlap,false,`${id} node overlap ${a}/${b}`);}
 for(const [nid,q] of boxes)assert.ok(q.x>=0&&q.y>=0&&q.x+q.width<=style.canvas.width&&q.y+q.height<=style.canvas.height,`${id} canvas overflow ${nid}`);
 for(const e of sp.edges){const q=L.edges[e.edgeId];assert.ok(q,`${id} missing edge geometry ${e.edgeId}`);for(let i=0;i<q.points.length-1;i++){for(const [nid,b] of boxes){if(nid===e.from||nid===e.to)continue;assert.equal(segHitsBox(q.points[i],q.points[i+1],b),false,`${id} edge ${e.edgeId} crosses node ${nid}`);}}}
 for(const b of sp.boundaries){if(!b.contains.length)continue;const q=L.boundaries[b.boundaryId];assert.ok(q,`${id} missing boundary geometry`);for(const excluded of b.mustExclude){const n=L.nodes[excluded];if(!n)continue;const cx=n.x+n.width/2,cy=n.y+n.height/2;assert.equal(inside(cx,cy,q),false,`${id} boundary ${b.boundaryId} geometrically contains excluded node ${excluded}`);}}
}
console.log('✓ MFIG geometry checker: no node overlap/canvas overflow/edge-through-node; excluded nodes remain outside authority boundaries.');
