import {parseAuditDom,queryAll,textContent,sha256} from './ziwei-cx-r1-w14-dom-harness.mjs';
const PINYIN=/\b(?:JIA|YI|BING|DING|WU|JI|GENG|XIN|REN|GUI|ZI|CHOU|YIN|MAO|CHEN|SI|WEI|SHEN|YOU|XU|HAI)\b/g;
const LEGACY=['年柱在哪里比较明显','月柱在哪里比较明显','日柱在哪里比较明显','时柱在哪里比较明显','observableSignals'];
const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
export function auditBaziW13Dom(plan,{expectExplicit=false}={}){
 const primary=`<div data-bazi-w13-root>${plan.navigationHtml||''}<main>${plan.readingHtml||''}</main></div>`;
 const dom=parseAuditDom(primary),text=textContent(dom);
 const visibleDom=parseAuditDom(primary.replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi,'')),visibleText=textContent(visibleDom);
 const w15=[...new Set(queryAll(dom,'[data-w15-section]').map(n=>n.attrs['data-w15-section']))].sort();
 const schools=queryAll(dom,'.cx-bazi-school-card').map(textContent);
 const questions=queryAll(dom,'.cx-bazi-reality-card');
 const myReading=queryAll(dom,'#bazi-section-reading').map(textContent).join(' ');
 const repeated=new Map();
 for(const tag of ['p','blockquote','li'])for(const n of queryAll(dom,tag)){const x=normalize(textContent(n));if(x.length>=28)repeated.set(x,(repeated.get(x)||0)+1)}
 const duplicates=[...repeated].filter(([,count])=>count>1).map(([value,count])=>({value,count}));
 const pinyin=[...new Set(visibleText.match(PINYIN)||[])];
 return Object.freeze({
  domEngine:'BUILTIN_HTML_TREE',htmlDigest:sha256(primary),textDigest:sha256(text),w15Sections:w15,schoolTexts:schools,questionCount:questions.length,pinyin,duplicates,
  invariants:Object.freeze({
   fullProductionVisible:text.includes('Full Production'),
   myReadingNonEmpty:myReading.length>20,
   w15SixSections:['FOUNDATION','RELATIONSHIPS','PATTERNS','SCHOOLS','TIMING','OPEN'].every(x=>w15.includes(x)),
   threeSchoolsDistinct:schools.length===3&&new Set(schools).size===3,
   realityQuestionCountSixOrSeven:questions.length===6||questions.length===7,
   legacyPillarQuestionsZero:LEGACY.every(x=>!text.includes(x)),
   genericStructureItemZero:!text.includes('结构项'),
   rawStemBranchPinyinZero:pinyin.length===0,
   duplicateLongProseZero:duplicates.length===0,
   unknownVisible:queryAll(dom,'[data-w15-section="OPEN"]').length===1&&text.includes('仍待确认'),
   timingExpectedState:expectExplicit?(text.includes('当前大运')&&text.includes('流年')&&!text.includes('当前时间未选择')):text.includes('没有替你推断“今天”')
  })
 });
}
