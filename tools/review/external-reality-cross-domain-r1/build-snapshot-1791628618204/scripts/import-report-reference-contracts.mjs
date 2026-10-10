import {baziVisualMaster} from '../functions/canonical-presentation-runtime/report-visual-master-contract.js';
import fs from 'node:fs';
const root='docs/guided-report-successor-r1';
const read=name=>fs.readFileSync(`${root}/reference-${name}.md`,'utf8');
const methods={BZR:'bazi-blueprint',AST:'astrology',ZWR:'ziwei',NUM:'numerology',PROFILE:'profile',ECR:'ecr',HD:'human-design',CROSS:'cross'};
const plans=Object.entries(methods).map(([methodId,name])=>{
 const source=read(name),matches=[...source.matchAll(/^#{1,2} (\d{2})｜([^\n]+)\n(?:#{2,3} ([^\n]+))?/gm)];
 const pages=matches.map((m,i)=>({pageNumber:Number(m[1]),title:{'zh-Hans':m[2].replaceAll('*','').trim(),en:(m[3]||m[2]).replaceAll('*','').trim()},sourceText:source.slice(m.index,matches[i+1]?.index).split(/\n# (?!\d{2}｜)/)[0].trim(),sourcePath:`${root}/reference-${name}.md`}));
 if(['BZR','AST'].includes(methodId)){
  for(const p of pages)if(p.pageNumber>=3)p.pageNumber++;
  pages.splice(2,0,{pageNumber:3,title:{'zh-Hans':methodId==='BZR'?'为什么八字会传承至今？':'为什么占星会传承至今？',en:methodId==='BZR'?'WHY HAS BAZI ENDURED?':'WHY HAS ASTROLOGY ENDURED?'},sourceText:read('origins-bazi-astrology'),sourcePath:`${root}/reference-origins-bazi-astrology.md`});
 }
 const seen=new Set();for(const p of pages){if(seen.has(p.pageNumber))throw Error(`DUPLICATE_PAGE:${methodId}:${p.pageNumber}`);seen.add(p.pageNumber);p.role=p.title.en.toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'');p.master=methodId==='BZR'?baziVisualMaster(p.pageNumber):p.pageNumber===1?'M01':p.pageNumber<=5?'M02':/SNAPSHOT|OVERVIEW|PHI_CARD/.test(p.role)?'M03':/DISTRIBUTION|BALANCE|TENSION|RELATIONSHIP/.test(p.role)?'M05':/TIMING|PERIOD|CYCLE|CURRENT_REALITY/.test(p.role)?'M07':/SIGNAL|NAVIGATION|EVIDENCE|BOUNDARY|CLOSING|OPPORTUNIT/.test(p.role)?'M08':/CAREER|WORK|MONEY|RESOURCES|SELF|IDENTITY|FAMILY/.test(p.role)?'M06':'M04';}
 return {methodId,sourceConversation:'6aaa576d-03bc-83ec-a176-5f8885313c6f',pages,humanReview:'PENDING',sourceRole:'USER_DESIGN_REFERENCE_NOT_NEW_METHOD_MEANING'};
});
fs.writeFileSync('functions/canonical-presentation-runtime/report-blueprint-reference.js','// Imported from user-provided conversation; source text retained for review.\nexport const REPORT_REFERENCE_BLUEPRINTS='+JSON.stringify(plans,null,2)+';\n');
console.log(plans.map(p=>({method:p.methodId,pages:p.pages.length,numbers:p.pages.map(x=>x.pageNumber)})));
