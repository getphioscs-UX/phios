import fs from 'node:fs';
import {REPORT_EDITORIAL_COPY} from '../functions/canonical-presentation-runtime/report-editorial-copy.js';
const root='docs/guided-report-successor-r1';
const sources={BZR:['bazi-copy','BAZI'],AST:['astrology',''],ZWR:['ziwei','ZWR'],NUM:['numerology','NUM'],PROFILE:['profile','PROFILE'],ECR:['ecr','ECR'],HD:['human-design','HD'],CROSS:['cross','CROSS']};
function section(file,heading){const text=fs.readFileSync(`${root}/reference-${file}.md`,'utf8');const lines=text.split('\n'),start=lines.findIndex(l=>new RegExp(`^#{1,2} ${heading}｜`).test(l));if(start<0)return '';let end=lines.findIndex((l,i)=>i>start&&/^# (?!#)/.test(l));if(end<0)end=lines.length;return lines.slice(start,end).join('\n');}
function field(text,pattern){const lines=text.split('\n'),start=lines.findIndex(l=>/^#{2,4} /.test(l)&&pattern.test(l));if(start<0)return '';let end=lines.findIndex((l,i)=>i>start&&(/^#{1,4} /.test(l)||l==='---'));if(end<0)end=lines.length;return lines.slice(start+1,end).join('\n').trim();}
const evidence=[];
const rows=REPORT_EDITORIAL_COPY.map(row=>{
 let [file,prefix]=sources[row.methodId],number={METHOD_INTRO:'02',ORIGIN:'03',PHIOS_LENS:'04',HOW_TO_READ:'05'}[row.pageRole];
 if(row.methodId==='BZR'){
  if(row.pageRole==='ORIGIN')file='origins-bazi-astrology';
  if(row.pageRole==='PHIOS_LENS')number='03';
  if(row.pageRole==='HOW_TO_READ'){file='bazi-blueprint';number='04';}
 }
 if(row.methodId==='AST'){
  if(row.pageRole==='ORIGIN'){file='origins-bazi-astrology';prefix='ASTROLOGY';}
  if(row.pageRole==='PHIOS_LENS')number='03';
  if(row.pageRole==='HOW_TO_READ')number='04';
 }
 const block=section(file,prefix?`${prefix}-${number}`:number);
 const cn=field(block,/中文.*正文|固定中文|中文固定/),en=field(block,/Fixed English Copy|English fixed copy/i);
 const clean=v=>v.replaceAll('**','').replace(/^> ?/gm,'').trim();
 const next={...row,sourcePath:`${root}/reference-${file}.md`,sourceSection:prefix?`${prefix}-${number}`:number,sourceConversation:'6aaa576d-03bc-83ec-a176-5f8885313c6f',canonicalCopyImported:Boolean(cn&&en)};
 const lines=block.split('\n');const titleZh=lines[0]?.replace(/^#+ (?:[A-Z]+-)?[0-9]+｜/,'').trim();const titleEn=lines.find(l=>/^## [A-Z]/.test(l))?.replace(/^## /,'').trim();
 const subtitle=field(block,/固定副标题/).split('\n').map(clean).filter(Boolean);
 if(titleZh&&titleEn){next['zh-Hans']={...row['zh-Hans'],title:titleZh,alt:titleZh,subtitle:subtitle.find(x=>/[\u3400-\u9fff]/.test(x))||row['zh-Hans'].subtitle};next.en={...row.en,title:titleEn,alt:titleEn,subtitle:subtitle.find(x=>!/[\u3400-\u9fff]/.test(x))||row.en.subtitle};}
 if(cn&&en){next['zh-Hans']={...next['zh-Hans'],body:clean(cn)};next.en={...next.en,body:clean(en)};}
 else next.copyCompletionState='SOURCE_HAS_NO_COMPLETE_BILINGUAL_BODY';
 evidence.push({methodId:row.methodId,pageRole:row.pageRole,imported:next.canonicalCopyImported,sourcePath:next.sourcePath,sourceSection:next.sourceSection});return next;
});
fs.writeFileSync('functions/canonical-presentation-runtime/report-editorial-copy.js','// Canonical source bodies imported verbatim from the user-designated conversation.\n// Unspecified supporting slots remain review candidates, never human-accepted automatically.\nexport const REPORT_EDITORIAL_COPY='+JSON.stringify(rows,null,2)+';\n');
fs.writeFileSync(`${root}/editorial-copy-import.json`,JSON.stringify(evidence,null,2)+'\n');
console.log({imported:evidence.filter(x=>x.imported).length,pending:evidence.filter(x=>!x.imported)});
