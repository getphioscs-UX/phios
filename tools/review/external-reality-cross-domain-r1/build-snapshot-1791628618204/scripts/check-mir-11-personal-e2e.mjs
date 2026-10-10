import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {GATE_SEQUENCE,GATE_SPAN_DEG,LINE_SPAN_DEG,gateWheelAngleToEclipticLongitude} from '../functions/method-runtime/personal-structure/gate-wheel.js';
import {calculatePersonalStructure} from '../functions/method-runtime/personal-structure/personal-structure-runtime.js';
import {projectPersonalStructure} from '../functions/method-runtime/personal-structure/personal-structure-projection-runtime.js';
import {renderPersonalStructureProjection} from '../assets/js/method-client-delivery/renderers/personal-structure-renderer.js';
import {interpretCanonicalProjection} from '../functions/interpretation-runtime/canonical-api-v1.js';
import {composeAcceptedGuidedReading} from '../functions/_lib/guided-reading-v2.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const fixture=j('content/method/personal-structure/fixtures/teresa-26-activation-golden-mir11-v1.json');
const nodeRef=j('content/method/personal-structure/fixtures/teresa-lunar-node-true-reference-v1.json');
const lon=(g,l,p=.1)=>gateWheelAngleToEclipticLongitude(GATE_SEQUENCE.indexOf(g)*GATE_SPAN_DEG+(l-1)*LINE_SPAN_DEG+p);
const longs=layer=>Object.fromEntries(fixture.activations.filter(x=>x.layer===layer).map(a=>[a.bodyCode,lon(a.gate,a.line)]));
const personality=longs('PERSONALITY'); const design=longs('DESIGN');
personality.SUN=232.75; personality.EARTH=52.75; design.SUN=144.75; design.EARTH=324.75;
personality.NORTH_NODE=nodeRef.personality.northNodeLongitudeDeg; personality.SOUTH_NODE=nodeRef.personality.southNodeLongitudeDeg;
design.NORTH_NODE=nodeRef.design.northNodeLongitudeDeg; design.SOUTH_NODE=nodeRef.design.southNodeLongitudeDeg;
const input={birthDate:'1989-11-15',birthTime:'22:50:00',birthPlace:{displayName:'Taiping',countryCode:'MY',latitude:4.85,longitude:100.74},timezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtBirth:'+08:00',source:'PINNED_IANA_TZDB',confidence:'HIGH'},timeAccuracy:'EXACT',locale:'zh-Hans',consent:{},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
const record=(id,type,payload)=>({authority:'SHARED_DATA_AUTHORITY',status:'verified',methodOwner:null,pluginOwner:null,recordId:id,recordType:type,recordVersion:'MIR-11-v1',payload});
const records=[
 record('MIR11-IN','CANONICAL_BIRTH_INPUT',input),
 record('MIR11-PA','PERSONALITY_ASTRONOMY',{instantUTC:'1989-11-15T14:50:00Z',longitudes:personality,astronomyRef:'MIR11_SOURCE_BOUND_REGRESSION'}),
 record('MIR11-DA','DESIGN_ASTRONOMY',{instantUTC:fixture.designInstantUTC,longitudes:design,astronomyRef:'MIR11_SOURCE_BOUND_REGRESSION'}),
 record('MIR11-DM-REC','DESIGN_MOMENT',{designMomentRef:'MIR11-DM',designInstantUTC:fixture.designInstantUTC,personalitySunLongitude:personality.SUN,designSunLongitude:design.SUN,solarArcDeg:88,solverTolerance:1e-7,iterationCount:17,fixedDaySubtractionUsed:false,lineage:{solver:'MIR11_REGRESSION'}}),
 record('MIR11-C','CONSENT',{valid:true})
];
const calculated=await calculatePersonalStructure({calculationId:'MIR11-TERESA-END-TO-END',inputRecords:records,nodeConvention:'TRUE_NODE.V1'});
assert.equal(calculated.output.capabilityReadiness.eligible,true);
assert.equal(calculated.output.activations.length,26);
const projection=await projectPersonalStructure(calculated);
assert.equal(projection.publicVocabulary,'PHI_OS_ONLY');
const rendered=renderPersonalStructureProjection(projection,{locale:'zh-Hans'});
assert.equal(rendered.status,'RENDERED'); assert.match(rendered.html,/data-renderer="PHI_OS_PERSONAL_STRUCTURE"/); assert.match(rendered.html,/<svg/);
const interpretation=await interpretCanonicalProjection(projection,{context:{currentCondition:'MIR11 regression'},requestedDepth:'STANDARD',locale:'zh-Hans'});
assert.equal(interpretation.acceptance.accepted,true); assert.equal(interpretation.authority.calculation,false); assert.equal(interpretation.authority.projection,false); assert.equal(interpretation.authority.reading,false);
const reading=composeAcceptedGuidedReading({result:interpretation,readingConsent:{optedIn:true,readingPermitted:true,interpretationResultId:interpretation.interpretationResultId},context:{currentConcern:'MIR-11 end-to-end regression'},locale:'zh-Hans'});
assert.equal(reading.governance.acceptedInterpretationResultOnly,true); assert.equal(reading.governance.methodRecalculation,false); assert.equal(reading.governance.newInterpretationDerivation,false);

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const readingCount=Object.values(reading.sections).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0);
const html=`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><title>MIR-11 Teresa E2E</title><body><main data-mir11-teresa-e2e="true"><h1>PHI OS Personal Runtime E2E</h1><section data-stage="CALCULATION">26 activations · ${esc(calculated.output.typeCode)} · ${esc(calculated.output.authorityCode)} · ${esc(calculated.output.definition.definitionCode)} · ${esc(calculated.output.profile.profileCode)}</section><section data-stage="PROJECTION">${rendered.html}</section><section data-stage="INTERPRETATION" data-result-id="${esc(interpretation.interpretationResultId)}">${esc(interpretation.resultStatus)}</section><section data-stage="READING" data-reading-count="${readingCount}"><h2>Why am I seeing this?</h2><p>${esc(reading.outcome?.status||'')}</p></section></main></body></html>`;
const tmp=path.join(os.tmpdir(),`phios-mir11-teresa-${process.pid}.html`); fs.writeFileSync(tmp,html);
const dom=fs.readFileSync(tmp,'utf8'); try{fs.unlinkSync(tmp);}catch{}
assert.match(dom,/data-mir11-teresa-e2e="true"/); assert.match(dom,/data-stage="CALCULATION"/); assert.match(dom,/data-stage="PROJECTION"/); assert.match(dom,/data-stage="INTERPRETATION"/); assert.match(dom,/data-stage="READING"/); assert.match(dom,/Why am I seeing this\?/); assert.match(dom,/<svg/);
const personalSurface=fs.readFileSync('personal-runtime.html','utf8'); const guidedSurface=fs.readFileSync('guided-reading.html','utf8'); assert.match(personalSurface,/data-page="personal-runtime"|data-page="method-client-delivery"/); assert.match(guidedSurface,/guided-reading|Guided Reading/i);
console.log('✓ MIR-11 Teresa end-to-end browser-visible regression passed: birth input → calculated Personal Structure → canonical projection → PHI OS SVG renderer → accepted canonical interpretation → explainable Guided Reading.');
