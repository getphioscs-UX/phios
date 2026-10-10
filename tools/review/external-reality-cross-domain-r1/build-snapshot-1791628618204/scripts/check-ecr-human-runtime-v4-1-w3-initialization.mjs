import fs from 'node:fs';import assert from 'node:assert/strict';
import {initializeEcrAstronomy} from '../functions/embodied-configuration/ecr-astronomical-initialization-runtime-v2.js';
const fixtures=JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json'));
for(const {canonicalInput} of fixtures.cases){
 const a=await initializeEcrAstronomy(canonicalInput),b=await initializeEcrAstronomy(canonicalInput);assert.deepEqual(a,b);
 assert.equal(a.activations.length,26);assert.equal(a.activations.filter(x=>x.status==='CALCULATED').length,26);
 assert.equal(a.activations.filter(x=>x.bodyCode==='CHIRON').length,0);
 const earth=a.activations.filter(x=>x.bodyCode==='EARTH');assert.equal(earth.length,2);assert(earth.every(x=>x.status==='CALCULATED'));
 for(const layer of ['PERSONALITY','DESIGN']){
  assert.deepEqual(a.activations.filter(x=>x.layer===layer).map(x=>x.bodyCode).sort(),['SUN','MOON','MERCURY','VENUS','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO','EARTH','NORTH_NODE','SOUTH_NODE'].sort());
  const sun=a.activations.find(x=>x.layer===layer&&x.bodyCode==='SUN');
  const e=a.activations.find(x=>x.layer===layer&&x.bodyCode==='EARTH');
  assert(Math.abs((((sun.eclipticLongitude+180)%360)-e.eclipticLongitude))<1e-9);
 }
 assert(Date.parse(a.design.instantUTC)<Date.parse(a.birth.instantUTC));
 const sun=layer=>a.activations.find(x=>x.layer===layer&&x.bodyCode==='SUN').eclipticLongitude;
 assert(Math.abs((sun('PERSONALITY')-sun('DESIGN')+360)%360-88)<1e-6);
 assert.equal(a.nodeConvention,'TRUE_NODE.V1');assert.equal(a.designMoment.fixedDaySubtractionUsed,false);
}
const input=fixtures.cases[0].canonicalInput;assert.equal((await initializeEcrAstronomy({...input,birthTime:null,timeAccuracy:'UNKNOWN'})).status,'UNKNOWN');await assert.rejects(()=>initializeEcrAstronomy({...input,consent:{granted:false}}),/CONSENT/);
console.log('PASS V4.1 W3: 12 synthetic fixtures replay shared AST/88°; 26 calculated activations including deterministic Personality/Design Earth; no operational Chiron.');
