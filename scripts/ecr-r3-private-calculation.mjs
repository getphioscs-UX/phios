// Author-only CLI: never put personal input or output in a publication directory.
import fs from 'node:fs';
import path from 'node:path';
import {buildEcrHumanRuntime} from '../functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
const [inputFile,outputDir]=process.argv.slice(2);
if(!inputFile||!outputDir)throw Error('PRIVATE_INPUT_AND_OUTPUT_REQUIRED');
const root=path.resolve('.'),out=path.resolve(outputDir);
if(out.toLowerCase().startsWith(root.toLowerCase()+path.sep))throw Error('OUTPUT_MUST_BE_OUTSIDE_REPOSITORY');
const request=JSON.parse(fs.readFileSync(inputFile,'utf8'));
fs.mkdirSync(out,{recursive:true});
const ir=await buildEcrHumanRuntime({canonicalInput:request.canonicalInput});
const expectedUtc=new Date(`${request.canonicalInput.birthDate}T${request.canonicalInput.birthTime}${request.canonicalInput.timezone.utcOffsetAtBirth}`).toISOString();
if(Date.parse(expectedUtc)!==Date.parse(ir.initialization.birth.instantUTC))throw Error('UTC_INPUT_NORMALIZATION_MISMATCH');
const rows=ir.driverField.drivers.flatMap(d=>[...d.personalityActivation,...d.designActivation]).filter((a,i,all)=>all.findIndex(b=>b.layer===a.layer&&b.bodyCode===a.bodyCode)===i).map(a=>({Layer:a.layer,BodyCode:a.bodyCode,UTCInstant:a.instantUTC,Longitude:a.eclipticLongitude,P64Gate:a.p64?.gate,Line:a.p64?.line,MappingVersion:a.p64?.mappingVersion,ActivationStage:a.p64?.activationStage,ECRH64Ref:a.environment?.ecrConfigurationRef,CalculationStatus:a.status,AstronomyAuthority:a.astronomyRef,SourceVersion:a.lineage}));
const comparisons=(request.historicalReferences||[]).map(r=>{const actual=rows.find(a=>a.Layer===r.layer&&a.BodyCode===r.bodyCode);return {...r,actual:actual?`${actual.P64Gate}.${actual.Line}`:null,match:actual?.P64Gate===r.gate&&actual?.Line===r.line,referenceStatus:'USER_SUPPLIED_COORDINATE_ONLY_NOT_FULL_HISTORICAL_REPORT',cause:'No independent old input, ephemeris or wheel version supplied; attribution remains unresolved.'};});
const sensitivity=[];
for(const deltaMinutes of [-5,-1,1,5]){
 const c=structuredClone(request.canonicalInput),seconds=c.birthTime.split(':').map(Number),minutes=seconds[0]*60+seconds[1]+deltaMinutes;
 if(minutes<0||minutes>=1440)throw Error('SENSITIVITY_DATE_ROLLOVER_REQUIRES_EXPLICIT_INPUT');
 c.birthTime=`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}:${String(seconds[2]||0).padStart(2,'0')}`;
 const alt=await buildEcrHumanRuntime({canonicalInput:c});
 sensitivity.push({deltaMinutes,changedGateLines:alt.initialization.activations.flatMap(a=>{const base=rows.find(b=>b.Layer===a.layer&&b.BodyCode===a.bodyCode);return base.P64Gate===a.p64.gate&&base.Line===a.p64.line?[]:[{layer:a.layer,body:a.bodyCode,from:`${base.P64Gate}.${base.Line}`,to:`${a.p64.gate}.${a.p64.line}`}];}),calculationDigest:alt.initialization.calculationDigest});
}
const boundaries=ir.initialization.activations.map(a=>({layer:a.layer,body:a.bodyCode,gate:a.p64.gate,line:a.p64.line,positionWithinGateDeg:a.p64.positionWithinGateDeg,distanceToGateBoundaryDeg:Math.min(a.p64.positionWithinGateDeg,5.625-a.p64.positionWithinGateDeg),distanceToLineBoundaryDeg:Math.min(a.p64.positionWithinGateDeg%0.9375,0.9375-a.p64.positionWithinGateDeg%0.9375),source:'Shared P64 positions; distances are diagnostic only, not a second wheel'}));
const review={title:'TL-ECR-V4.1-CALCULATION-REVIEW',private:true,canonicalInput:request.canonicalInput,inputAccuracy:request.inputAccuracy,utcInputVerification:{expectedUtc,matched:true},rows,designMoment:ir.initialization.designMoment,nodeConvention:ir.initialization.nodeConvention,driverBindings:ir.driverField.drivers.map(({driverId,bodyBinding})=>({driverId,bodyBinding})),currentDriverPriority:ir.driverField.currentDriverPriority,calculationDigest:ir.initialization.calculationDigest,lineage:ir.lineage,unknowns:ir.unknown,comparisons,sensitivity,gateLineBoundaryDiagnostics:boundaries,semanticDepth:ir.semanticDepth,boundaries:ir.boundaries,providerCalls:0};
fs.writeFileSync(path.join(out,'TL-ECR-V4.1-CALCULATION-REVIEW.json'),JSON.stringify(review,null,2));
const cols=Object.keys(rows[0]);
fs.writeFileSync(path.join(out,'TL-ECR-V4.1-CALCULATION-REVIEW.md'),`# Private author calculation review\n\n${request.inputAccuracy}\n\n|${cols.join('|')}|\n|${cols.map(()=> '---').join('|')}|\n${rows.map(r=>'|'+cols.map(k=>typeof r[k]==='object'?JSON.stringify(r[k]):r[k]).join('|')+'|').join('\n')}\n\n## Design solver, node convention and bindings\n\n\`\`\`json\n${JSON.stringify({designMoment:review.designMoment,nodeConvention:review.nodeConvention,driverBindings:review.driverBindings,currentDriverPriority:review.currentDriverPriority,comparisons,sensitivity,unknowns:review.unknowns},null,2)}\n\`\`\`\n\nNo current lived facts, personalized semantic acceptance or scientific causation are inferred.\n`);
console.log(JSON.stringify({status:'CALCULATED_PRIVATE_REVIEW_ONLY',activations:rows.length,drivers:review.driverBindings.length,sensitivityCases:sensitivity.length,providerCalls:0}));
