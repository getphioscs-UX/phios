import fs from 'node:fs';
import {renderReportCoverOverlay,formatReportCoverFields,assertCoverOverlayValues} from '../functions/canonical-presentation-runtime/report-cover-overlay.js';
import {REPORT_COVER_OVERLAY_REGISTRY} from '../functions/canonical-presentation-runtime/report-cover-overlay-registry.js';

const out='artifacts/rnt2-cover';
fs.mkdirSync(out,{recursive:true});
const subject={schemaVersion:'PHI-OS-REPORT-SUBJECT-PRESENTATION-v1.0.0',subjectReference:'RNT2-QA-SUBJECT',displayName:'RNT2 QA 客户',birthDate:'1989-11-15',birthTime:'22:50:00',timeAccuracy:'EXACT',locale:'zh-Hans',subjectFingerprint:'qa'};
const unknown={...subject,subjectReference:'RNT2-QA-UNKNOWN',birthTime:null,timeAccuracy:'UNKNOWN'};
const base='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev';
const folders={BZR:'bazi',ZWR:'ziwei',AST:'astrology',NUM:'numerology',PROFILE:'profile',ECR:'ecr',HD:'human-design',CROSS:'cross'};
const expected={};
for(const methodId of Object.keys(REPORT_COVER_OVERLAY_REGISTRY)){
 expected[methodId]=formatReportCoverFields({methodId,subject});
 const u=formatReportCoverFields({methodId,subject:unknown});
 if(u.birthTime!=='—')throw Error('COVER_UNKNOWN_TIME_FABRICATED:'+methodId);
 assertCoverOverlayValues({methodId,subject,renderedValues:expected[methodId]});
}
const pages=Object.entries(REPORT_COVER_OVERLAY_REGISTRY).map(([methodId,cfg])=>{
 const src=base+'/images/reports/'+folders[methodId]+'/editorial/bilingual/'+cfg.assetCode+'.webp';
 return '<section class="cover" data-method="'+methodId+'"><img src="'+src+'" alt="'+methodId+' cover">'+renderReportCoverOverlay({methodId,subject})+'</section>';
}).join('');
const html='<!doctype html><html><meta charset="utf-8"><style>html,body{margin:0}.cover{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always}.cover:last-child{page-break-after:auto}.cover>img{width:100%;height:100%;object-fit:contain;display:block}.pub-cover-overlay{position:absolute;inset:0}.pub-cover-value{position:absolute;display:flex;align-items:center;justify-content:center;font:16px Georgia,serif;color:#173047;white-space:nowrap;overflow:hidden}@media print{.cover{margin:0;break-after:page}.cover:last-child{break-after:auto}}</style>'+pages+'</html>';
fs.writeFileSync(out+'/review.html',html);
fs.writeFileSync(out+'/expected.json',JSON.stringify({subject,expected},null,2)+'\n');
console.log('Built RNT2 8-cover fixture.');
