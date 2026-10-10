import assert from 'node:assert/strict';
import fs from 'node:fs';
import {eclipticLongitudeToP64ScreenAngle as screen,p64VisualSector} from '../assets/customer-ui/js/specialists/ecr/p64-visual-orientation.js';
import {polarPoint} from '../assets/customer-ui/js/specialists/ecr/mandala-geometry.js';
import {renderPhiMandalaVisual} from '../assets/customer-ui/js/specialists/ecr/mandala-renderer.js';
import {resolveEcrP64} from '../functions/embodied-configuration/ecr-p64-mechanical-adapter.js';
const bridge=JSON.parse(fs.readFileSync('content/embodied-configuration/ecr-p64-environment-bridge-v1.json')).entries;
const contract=JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/ecr-p64-visual-orientation-contract-v1.json'));
const mod=x=>((x%360)+360)%360;
const ccw=(a,b)=>mod(a-b);
const expected=[41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60];
assert.equal(contract.direction,'COUNTERCLOCKWISE');
assert.deepEqual(bridge.map(s=>s.gate),expected);
assert.equal(contract.anchorScreenAngleDeg,238);
assert.equal(screen(0),180);assert.equal(screen(90),90);assert.equal(screen(180),0);assert.equal(screen(270),270);
assert.equal(screen(302),238);assert.equal(screen(307.625),232.375);assert.equal(screen(313.25),226.75);
const centers=bridge.map(s=>p64VisualSector(s.eclipticStartDeg,s.eclipticEndDeg).centerAngle);
for(let i=0;i<64;i++){
 const s=bridge[i],v=p64VisualSector(s.eclipticStartDeg,s.eclipticEndDeg);
 assert.equal(v.endAngle-v.startAngle,5.625);
 assert.equal(ccw(centers[i],centers[(i+1)%64]),5.625);
 for(let j=0;j<6;j++){
  const lon=s.eclipticStartDeg+j*.9375;
  assert.equal(resolveEcrP64(lon).gate,s.gate);assert.equal(resolveEcrP64(lon).line,j+1);
  assert.equal(ccw(screen(lon),screen(lon+.9375)),.9375);
 }
 for(let j=0;j<8;j++)assert.equal(ccw(screen(s.eclipticStartDeg+j*.703125),screen(s.eclipticStartDeg+(j+1)*.703125)),.703125);
}
const p={schemaVersion:'PHI-OS-ECR-MANDALA-PROJECTION-v4.1',locale:'en',projectionId:'ORIENTATION-TEST',
 sectors:bridge.map(s=>({...s,label:s.ecrConfigurationRef})),markers:bridge.flatMap(s=>['PERSONALITY','DESIGN'].map(layer=>({layer,bodyCode:'SYNTHETIC-'+s.gate,longitude:s.eclipticStartDeg+.25,gate:s.gate,line:1,activationStage:'A1'}))),pipeline:[],continuity:[],currentReality:'UNBOUND'};
const html=renderPhiMandalaVisual({payload:p});
const rendered=[...html.matchAll(/data-p64-gate="(\d+)" data-p64-center-angle="([\d.]+)"/g)].filter((_,i)=>i%2===0).map(m=>({gate:Number(m[1]),angle:Number(m[2])}));
const traversed=[...rendered].sort((a,b)=>ccw(centers[0],a.angle)-ccw(centers[0],b.angle));
assert.deepEqual(traversed.map(s=>s.gate),expected);
// Review pages embed SVG at build time: testing the renderer alone missed stale HTML.
for(const locale of ['en','zh-Hans']){
 const review=fs.readFileSync(`docs/ecr-human-runtime-v4-1/review-${locale}.html`,'utf8');
 const saved=[...review.matchAll(/data-p64-gate="(\d+)" data-p64-center-angle="([\d.]+)"/g)];
 assert.equal(saved.length,128,`${locale}: regenerate static review SVG`);
 assert.deepEqual(saved.filter((_,i)=>i%2===0).map(m=>({gate:Number(m[1]),angle:Number(m[2])})),rendered,`${locale}: stale visual orientation`);
}
for(const m of p.markers){const point=polarPoint(m.layer==='PERSONALITY'?247:223,screen(m.longitude));assert(html.includes('<circle cx="'+point.x+'" cy="'+point.y+'"'));}
for(const s of bridge)for(const lon of s.lineBoundaries){const point=polarPoint(270,screen(lon));assert(html.includes('x1="'+point.x+'" y1="'+point.y+'"'));}
assert.equal(resolveEcrP64(302).gate,41);assert.equal(resolveEcrP64(302.9375).line,2);assert.equal(resolveEcrP64(302.703125).activationStage,'A2');
assert.equal(bridge[0].ecrConfigurationRef,'ECR-H48');
console.log('PASS orientation: rendered 64-sector CCW traversal, 384 Line starts, 512 independent A8 transform positions; Birth/Design marker alignment and wrap. A8 ticks are not displayed.');
