import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveActivationSubstructure as resolve,substructureCellLongitude as lon,SUBDIVISION_WIDTHS,TONE_INDEX_TOLERANCE} from '../functions/method-runtime/personal-structure/substructure.js';
import {resolveGateLine} from '../functions/method-runtime/personal-structure/gate-line.js';
import {GATE_SEQUENCE} from '../functions/method-runtime/personal-structure/gate-wheel.js';
import {toneToOrientation} from '../functions/method-runtime/personal-structure/variable-adapter.js';
import {encodeVariableDirections,decodeVariableDirections,deriveCalibrationVariables,orientationFromTone} from '../functions/method-runtime/personal-structure/variable-calibration.js';
const sets={gate:new Set(),line:new Set(),color:new Set(),tone:new Set()};let boundaryAssertions=0;
for(let i=0;i<13824;i++){
 const x=resolve(lon(i));
 assert.equal(x.parentCompatibility,'MATCH');assert.equal(x.toneIndex,i);
 assert.equal(x.gate,GATE_SEQUENCE[Math.floor(i/216)]);assert.equal(x.line,Math.floor(i/36)%6+1);
 assert.equal(x.color,Math.floor(i/6)%6+1);assert.equal(x.tone,i%6+1);assert.equal(x.base,null);
 assert.equal(x.publicationEligible,false);assert.equal(x.offsets.tone.nearestBoundaryDegrees>0,true);
 sets.gate.add(x.gate);sets.line.add(`${x.gate}.${x.line}`);sets.color.add(`${x.gate}.${x.line}.${x.color}`);sets.tone.add(`${x.gate}.${x.line}.${x.color}.${x.tone}`);
 const entry=lon(i,0),delta=1e-8;
 for(const [angle,want]of [[entry-delta,(i+13823)%13824],[entry,i],[entry+delta,i]]){
  const y=resolve(angle);assert.equal(y.toneIndex,want,`boundary ${i} / ${angle}`);assert.equal(y.parentCompatibility,'MATCH');boundaryAssertions++;
 }
 const legacy=resolveGateLine(lon(i));assert.equal(x.gate,legacy.gate);assert.equal(x.line,legacy.line);
 const opposite=resolve((lon(i)+180)%360);assert.equal(opposite.color,x.color);assert.equal(opposite.tone,x.tone);
}
assert.deepEqual(Object.fromEntries(Object.entries(sets).map(([k,s])=>[k,s.size])),{gate:64,line:384,color:2304,tone:13824});
for(const invalid of [NaN,Infinity,-Infinity,null,'42'])assert.throws(()=>resolve(invalid));
for(const x of [0,1,45,180,302,359.99999])for(const wrap of [-720,-360,360,720])assert.equal(resolve(x).toneIndex,resolve(x+wrap).toneIndex);
for(let tone=1;tone<=6;tone++)assert.equal(toneToOrientation(tone),tone<=3?'LEFT':'RIGHT');
for(const invalid of [0,7,1.5,NaN,null,'1'])assert.throws(()=>orientationFromTone(invalid));
const codes=new Set();for(let mask=0;mask<16;mask++){
 const a=Object.fromEntries(['designUpper','designLower','personalityUpper','personalityLower'].map((k,i)=>[k,(mask>>i)&1?'RIGHT':'LEFT']));
 const code=encodeVariableDirections(a);codes.add(code);assert.deepEqual(decodeVariableDirections(code),a);
 const activation=[];for(const [slot,side,body,opposite,at]of [['designUpper','DESIGN','SUN','EARTH','1989-08-18T00:00:00Z'],['designLower','DESIGN','NORTH_NODE','SOUTH_NODE','1989-08-18T00:00:00Z'],['personalityUpper','PERSONALITY','SUN','EARTH','1989-11-15T00:00:00Z'],['personalityLower','PERSONALITY','NORTH_NODE','SOUTH_NODE','1989-11-15T00:00:00Z']]){
  const l=lon(a[slot]==='LEFT'?0:3);for(const [name,angle]of [[body,l],[opposite,(l+180)%360]])activation.push({activationId:side+'-'+name,layer:side,bodyCode:name,eclipticLongitude:angle,status:'CALCULATED',instantUTC:at,lineage:{nodeConvention:'TRUE_NODE.V1'}});
 }
 assert.equal(deriveCalibrationVariables(activation).variableCode,code);
 assert.equal(deriveCalibrationVariables(activation.filter(x=>x.bodyCode!=='NORTH_NODE')).variableCode,null);
 const broken=activation.map(x=>x.bodyCode==='EARTH'?{...x,eclipticLongitude:x.eclipticLongitude+.1}:x);assert.equal(deriveCalibrationVariables(broken).fields.personalityUpper.status,'UNKNOWN');
 const wrongTime=activation.map(x=>x.layer==='DESIGN'&&x.bodyCode==='NORTH_NODE'?{...x,instantUTC:'1989-11-15T00:00:00Z'}:x);assert.equal(deriveCalibrationVariables(wrongTime).fields.designLower.status,'UNKNOWN');
 const unknownNode=activation.map(x=>x.bodyCode.includes('NODE')?{...x,lineage:{nodeConvention:'UNRESOLVED'}}:x);assert.equal(deriveCalibrationVariables(unknownNode).variableCode,null);
}
assert.equal(codes.size,16);assert.deepEqual(decodeVariableDirections('PRL DRL'),{personalityUpper:'RIGHT',personalityLower:'LEFT',designUpper:'RIGHT',designLower:'LEFT'});
assert.throws(()=>decodeVariableDirections('DRL PRL'));assert.throws(()=>encodeVariableDirections({}));
// Expose, rather than silently replace, legacy EPS behavior in a disputed tiny interval.
const legacyEdge=resolve(lon(36,0)-1e-11);assert.equal(legacyEdge.parentCompatibility,'CONFLICT_WITH_LEGACY_GATE_LINE');assert.equal(legacyEdge.color,null);
const receipt={status:'SUBSTRUCTURE_MATH_PASS',coverage:Object.fromEntries(Object.entries(sets).map(([k,s])=>[k,s.size])),interiorAssertions:13824,boundaryAssertions,pointsTested:55296,orientationCombinations:16,widths:SUBDIVISION_WIDTHS,toleranceToneUnits:TONE_INDEX_TOLERANCE,legacyConflictFailsClosed:true,externalAstronomicalAccuracy:'NOT_PROVEN_BY_MATHEMATICAL_TEST',productionActivated:false};
if(process.env.HD_R3_EVIDENCE_DIR){fs.mkdirSync(process.env.HD_R3_EVIDENCE_DIR,{recursive:true});fs.writeFileSync(`${process.env.HD_R3_EVIDENCE_DIR}/MATH-COVERAGE.json`,JSON.stringify(receipt,null,2));}
console.log(JSON.stringify(receipt));
