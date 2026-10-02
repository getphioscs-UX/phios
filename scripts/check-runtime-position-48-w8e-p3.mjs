import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildMechanismAnalysis} from './lib/civilization-atlas/runtime-position-w8e-p3-mechanism-analysis-v1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const text=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const ok=(v,c)=>{if(!v)throw new Error('RUNTIME_POSITION_48_W8E_P3:'+c);};
const contract=read('content/civilization-atlas/reconfiguration/runtime-position-w8e-p3-mechanism-analysis-contract-v1.json');
const derived=read('content/civilization-atlas/reconfiguration/runtime-position-w8e-p3-derived-mechanisms-v1.json');
const status=read('content/civilization-atlas/reconfiguration/runtime-position-w8e-p3-status-v1.json');
ok(contract.status==='ACTIVE_EVIDENCE_DERIVED_MECHANISM_ANALYSIS','CONTRACT');
ok(contract.boundaries?.providerSeriesAlonePromotesConstraint===false&&contract.boundaries?.issuerContinuityEqualsNationalContinuity===false,'BOUNDARY');
ok((derived.records||[]).length===0||(derived.records||[]).length===3,'MECHANISM_COUNT');
ok((derived.subsystemCandidates||[]).every(x=>x.scope==='SUBSYSTEM'&&x.state==='HUMAN_REVIEW_READY'),'SUBSYSTEM_SCOPE');
ok(status.completed?.dossierPromotions===0&&status.completed?.runtimePositionCandidates===0,'AUTHORITY_LEAK');

const snapshots={records:[]}, provider={records:[]}, official={records:[]};
const out=buildMechanismAnalysis({snapshots,providerEvidence:provider,officialEvidence:official,thresholds:contract.thresholds});
ok(out.records.length===3&&out.subsystemCandidates.length===0,'EMPTY_FIXTURE');

const snapRows=[];const evRows=[];
for(const issuer of ['US.AAPL','US.MSFT','US.AMZN']){
  for(const st of [1,2]){
    const id=issuer+'-S'+st;
    snapRows.push({snapshotId:id,providerId:'MOOMOO_OPENAPI',capability:'FINANCIAL_STATEMENTS',request:{symbols:[issuer]},records:[
      {meta:{periodText:'2022/FY',statementType:st},value:1},
      {meta:{periodText:'2023/FY',statementType:st},value:1},
      {meta:{periodText:'2024/FY',statementType:st},value:1},
      {meta:{periodText:'2025/FY',statementType:st},value:1}
    ]});
    evRows.push({claimId:'C-'+id,sourceLocator:{value:'x; snapshot='+id+'; digest=x'},rreEligibility:'RRE_ELIGIBLE'});
  }
}
const out2=buildMechanismAnalysis({snapshots:{records:snapRows},providerEvidence:{records:evRows},officialEvidence:{records:[]},thresholds:contract.thresholds});
ok(out2.subsystemCandidates.length===1&&out2.subsystemCandidates[0].grammarId==='G16','CONTINUITY_SUBSYSTEM_FIXTURE');
ok(out2.records.find(x=>x.semanticBasisId==='US-W8E-SEM-SYSTEM-CONTINUITY').humanReviewReady===true,'CONTINUITY_REVIEW_READY');
ok(out2.records.find(x=>x.semanticBasisId==='US-W8E-SEM-FINANCIAL-CONSTRAINT').humanReviewReady===false,'NO_PROVIDER_ONLY_CONSTRAINT');
const pkg=text('package.json');ok(pkg.includes('"build:runtime-position-48:w8e:p3"')&&pkg.includes('"check:runtime-position-48:w8e:p3"'),'PACKAGE');
console.log('PASS W8E-P3: mechanism analysis uses admitted snapshot lineage; provider-only constraint promotion is blocked; selected-issuer continuity can become a subsystem human-review candidate without national/RP promotion.');
