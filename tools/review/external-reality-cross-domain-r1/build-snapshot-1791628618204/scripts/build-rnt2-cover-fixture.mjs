import fs from 'node:fs';
import {renderReportCoverOverlay,formatReportCoverFields,assertCoverOverlayValues} from '../functions/canonical-presentation-runtime/report-cover-overlay.js';
import {REPORT_COVER_OVERLAY_REGISTRY} from '../functions/canonical-presentation-runtime/report-cover-overlay-registry.js';

const out='artifacts/rnt2-cover';
fs.mkdirSync(out,{recursive:true});
const subject={schemaVersion:'PHI-OS-REPORT-SUBJECT-PRESENTATION-v1.0.0',subjectReference:'RNT2-QA-SUBJECT',displayName:'RNT2 QA 客户',birthDate:'1989-11-15',birthTime:'22:50:00',timeAccuracy:'EXACT',locale:'zh-Hans',subjectFingerprint:'qa'};
const unknown={...subject,subjectReference:'RNT2-QA-UNKNOWN',birthTime:null,timeAccuracy:'UNKNOWN'};
const base='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev';
const folders={BZR:'bazi',ZWR:'ziwei',AST:'astrology',NUM:'numerology',PROFILE:'profile',ECR:'ecr',HD:'human-design',CROSS:'cross'};
const expected={},unknownExpected={},hardGateTests=[];
for(const methodId of Object.keys(REPORT_COVER_OVERLAY_REGISTRY)){
 expected[methodId]=formatReportCoverFields({methodId,subject});
 const u=formatReportCoverFields({methodId,subject:unknown});
 unknownExpected[methodId]=u;
 if(u.birthTime!=='—')throw Error('COVER_UNKNOWN_TIME_FABRICATED:'+methodId);
 assertCoverOverlayValues({methodId,subject,renderedValues:expected[methodId]});
 for(const [field,value,code] of [
  ['name','WRONG','COVER_NAME_MISMATCH'],
  ['birthDate','1900 / 01 / 01','COVER_BIRTHDATE_MISMATCH'],
  ['birthTime','00 : 00','COVER_BIRTHTIME_MISMATCH']
 ]){
  const mutated={...expected[methodId],[field]:value};let threw=false;
  try{assertCoverOverlayValues({methodId,subject,renderedValues:mutated});}catch{threw=true}
  if(!threw)throw Error(code+':'+methodId);
  hardGateTests.push({methodId,field,failClosed:threw});
 }
}
const variants=[
 {id:'short-en',displayName:'Alex Lee'},
 {id:'long-en',displayName:'Alexandra Elizabeth Morgan'},
 {id:'short-zh',displayName:'陈晓明'},
 {id:'long-zh',displayName:'陈欧阳晓明林雅惠'},
 {id:'mixed',displayName:'陈晓明 Alex Lee'},
 {id:'exact',displayName:'Exact QA',birthDate:'2001-02-03',birthTime:'06:12:45'},
 {id:'approximate',displayName:'Approximate QA',timeAccuracy:'APPROXIMATE',birthTime:'18:30:12'},
 {id:'unknown',displayName:'Unknown QA',timeAccuracy:'UNKNOWN',birthTime:null}
];
const cases=[];
const pages=Object.entries(REPORT_COVER_OVERLAY_REGISTRY).flatMap(([methodId,cfg])=>variants.map(variant=>{
 const caseSubject={...subject,...variant},caseId=methodId+'-'+variant.id;
 cases.push({caseId,methodId,variant:variant.id,values:formatReportCoverFields({methodId,subject:caseSubject})});
 const src=base+'/images/reports/'+folders[methodId]+'/editorial/bilingual/'+cfg.assetCode+'.webp';
 return '<section class="cover" data-case="'+caseId+'" data-method="'+methodId+'"><img src="'+src+'" alt="'+methodId+' cover">'+renderReportCoverOverlay({methodId,subject:caseSubject})+'</section>';
})).join('');
const html='<!doctype html><html><meta charset="utf-8"><style>@page{size:A4;margin:0}html,body{margin:0;padding:0}.cover{box-sizing:border-box;width:210mm;height:296mm;min-height:296mm;max-height:296mm;position:relative;overflow:hidden;margin:0;break-inside:avoid-page;page-break-inside:avoid;break-after:page;page-break-after:always}.cover:last-child{break-after:auto;page-break-after:auto}.cover>img{width:100%;height:100%;object-fit:contain;display:block}.pub-cover-overlay{position:absolute;inset:0}.pub-cover-value{position:absolute;display:flex;align-items:center;justify-content:center;font:16px Georgia,serif;color:#173047;white-space:nowrap;overflow:hidden}@media print{html,body{margin:0!important;padding:0!important}.cover{width:210mm!important;height:296mm!important;min-height:296mm!important;max-height:296mm!important;margin:0!important;break-inside:avoid-page!important;page-break-inside:avoid!important;break-after:page!important;page-break-after:always!important}.cover:last-child{break-after:auto!important;page-break-after:auto!important}}</style>'+pages+'</html>';
fs.writeFileSync(out+'/review.html',html);
fs.writeFileSync(out+'/expected.json',JSON.stringify({subject,unknown,expected,unknownExpected,hardGateTests,cases},null,2)+'\n');
console.log('Built RNT2 8-cover fixture.');
