import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='docs/acceptance/bazi-paid-report/full-report-c1/',sha=v=>createHash('sha256').update(v).digest('hex');
const manifest=JSON.parse(fs.readFileSync(root+'MANIFEST.json','utf8'));
const rows=manifest.sections.map(s=>{const bytes=fs.readFileSync(root+s.file);assert.equal(sha(bytes),s.sha256,s.file);return {...s,sourcePath:root+s.file,paragraphs:bytes.toString('utf8').replace(/^#[^\n]+\r?\n/,'').trim().split(/\r?\n\s*\r?\n/).map((text,i)=>({id:s.sectionId+':P'+String(i+1).padStart(3,'0'),text:text.trim(),sourceSection:s.sectionId}))};});
assert.deepEqual(rows.map(s=>s.sectionId),['S02','S03','S04','S05','S06','S07','S08','S09','S10']);
const source=structuredClone(rows),changes=[];
const section=id=>rows.find(s=>s.sectionId===id),find=(s,text)=>{const i=s.paragraphs.findIndex(p=>p.text.replace(/\r\n/g,'\n')===text.replace(/\r\n/g,'\n'));assert(i>=0,'Missing editorial anchor: '+s.sectionId+' '+text);return i;};
function trim(id,first,last,owner,reason,preserve=[]){const s=section(id),a=find(s,first),b=find(s,last);assert(b>=a);const removed=s.paragraphs.splice(a,b-a+1);for(const p of removed)changes.push({paragraphId:p.id,sourceSection:id,disposition:preserve.includes(p.text)?'REASSIGN':'TRIM',owningSection:owner,reason,before:p.text,after:preserve.includes(p.text)?p.text:null});return removed.filter(p=>preserve.includes(p.text));}
function insert(id,anchor,items){const s=section(id),i=find(s,anchor);s.paragraphs.splice(i+1,0,...items.map(p=>({...p,movedFrom:p.sourceSection})));}
function edit(id,before,after,reason){const s=section(id),i=find(s,before);s.paragraphs[i].text=after;changes.push({paragraphId:s.paragraphs[i].id,sourceSection:id,disposition:'MINIMAL_EDIT',reason,before,after});}
trim('S02','金生水，水生木。','庚金产生思考和输出，水再生甲木财星。整个链条不是停在“我知道很多”，而是自然地走向“我怎样把理解转成价值”。','S04','The full output-to-market chain belongs to career; S02 retains the accepted capability-to-value tendency.');
trim('S02','如果一个领域本身需要分析、策略、系统、规划、咨询、研究、技术判断、资源配置、商业判断、内容结构、问题诊断，你往往会比只需要重复执行的环境更容易发挥。','如果一个领域本身需要分析、策略、系统、规划、咨询、研究、技术判断、资源配置、商业判断、内容结构、问题诊断，你往往会比只需要重复执行的环境更容易发挥。','S04','Industry/role examples are fully developed in S04.');
const movedPressure=trim('S02','但这也形成另一个需要注意的地方：因为你习惯解决问题，所以有时会无意识地把自己放进太多问题里面。','如果环境一直让你处理琐碎、修补混乱、回应别人不断变化的要求，你会很累，而且容易怀疑自己为什么付出了那么多却没有形成真正积累。','S08','S08 owns sustained cognitive load and capacity. Unique accepted carrying-condition reasoning is reassigned unchanged.',[
 '命局虽然庚金明显，但因为水势较强，金气不断泄向水，并不能简单理解为“金很强，所以什么都扛得住”。',
 '这也是为什么土对这张命盘非常重要。','土能够生金，也能够承载水。',
 '放到生活里，土代表的不是抽象的“五行补救”，而是一种很实际的结构：规律、基础、节奏、确定性、边界与稳定资源。'
]);
insert('S08','而是命局中的水一旦失去承载，就容易不断流动。',movedPressure);
edit('S02','但如果你进入一个能够让你做判断、做结构、做整合、做策略的环境，同样的能力就会变成非常明显的优势。','如果你进入一个能够让你做判断、做结构、做整合、做策略的环境，同样的能力就会变成非常明显的优势。','Remove a dangling contrast after capacity material is reassigned.');
trim('S03','真正让你疲惫的，往往不是“有责任”，而是责任与权力不匹配。','这种变化会直接影响职业、合作甚至家庭中的关系模式。','S04','Detailed authority/resource matching is already explained in S04; S03 retains responsibility increasing through life.');
trim('S03','也正因为如此，人生里某些看起来比较慢的阶段，其实非常重要。','如果答案是有，那么这种变化就是命局正常的成长方式。','S09','S09 owns accumulation, saturation and transition mechanics; life-stage architecture remains in S03.');
trim('S04','命局里辰为日支，其中藏戊、乙、癸。','不是因为变得保守，而是因为你会知道：拥有底盘之后，才有资格选择真正好的机会。','S05','The full retained-resource and growth/foundation explanation is already present in S05.');
trim('S04','在收入层面也是一样。','而不是单纯赚得更多。','S05','Retention, cash flow and asset accumulation belong to S05, after career value creation.');
const movedFamily=trim('S06','在子女或家庭责任方面，时柱庚寅也说明你对“下一代、未来安排、长期生活”通常不会完全随意。','如果做得到，你的家庭关系会柔软很多。','S07','Broad child/generational material belongs to S07; unique emotional-space passages are reassigned unchanged.',[
 '家人并不是系统模块。','有些时候，即使安排不完美，情感本身也需要空间。',
 '有时候让一个人按照自己的节奏成长，比立刻把他带到“正确方案”更重要。',
 '你有能力看见更有效的方式。','但爱有时候不是替别人选择最快的方式。','而是让他拥有自己的过程。'
]);
insert('S07','不是替下一代安排所有路径，\r\n而是帮助他建立能够自己面对现实的能力。',movedFamily);
edit('S03',source.find(s=>s.sectionId==='S03').paragraphs[0].text,'当判断、理解与处理现实的能力进入一生，重点便转向：你通常如何进入一个环境、怎样承担责任，为什么某些阶段会越来越重，以及原有结构何时已经无法继续容纳下一阶段的发展。','Natural capability-to-life transition; no new chart conclusion.');
edit('S04','你知道怎样发现价值，怎样形成价值，也知道怎样让价值留下来。','你知道怎样发现价值，也知道怎样把专业能力持续转成现实成果。','Career closes on value creation; retention follows in S05.');
edit('S07',source.find(s=>s.sectionId==='S07').paragraphs[0].text,'两个人的共同生活进入更大的家庭系统以后，重点便转向：你在这个系统里通常站在什么位置，为什么容易承担比表面更多的责任，以及什么样的支持方式真正对你有帮助。','Natural intimacy-to-family transition using the accepted chapter question.');
edit('S08',source.find(s=>s.sectionId==='S08').paragraphs[0].text,'当总负荷超过支持系统可以分担的范围，压力往往不只是“事情很多”，而是一种更隐蔽的状态：外部看起来仍然能够运作，内部却已经持续超负荷。','Natural support-to-capacity transition; retained accepted overload meaning.');
edit('S09',source.find(s=>s.sectionId==='S09').paragraphs[0].text,'疲惫有时来自暂时的负荷，有时则意味着一个阶段已经接近完成。这张命盘的长期走势，更适合从周期来看：先积累，再扩张；先承载，再重组；先把事情做起来，再重新决定哪些值得继续。','Bridge from S08 overload to S09 cycle mechanics; no event forecast.');
edit('S09','从五行运行来看，土、金、水、木、火对你不同阶段的影响也有不同意义。','当某一种五行在不同阶段成为主要环境力量时，它对你的运行有不同意义。','Required environmental-function reading; no fixed Earth→Metal→Water→Wood→Fire chronology.');
edit('S09','这就是为什么你的长期周期，很适合用“五种状态”来理解：','这些不同环境中的功能，可以分别理解：','Clarify the following five functions are not a chronological sequence.');
edit('S10',source.find(s=>s.sectionId==='S10').paragraphs[0].text,'这些长期周期怎样落到眼前，可以从己巳大运与丙寅年度层的叠加来理解：这里的重点，并不是单纯追求扩张、速度或结果。','General cycles to explicitly admitted current timing; no Gregorian identity added.');
const voiceEdits=[
 ['S04','从命局来说，职业选择应该看“离价值形成中心有多近”，而不能只看职称。','从命局来说，职业位置与价值形成中心的距离，比职称本身更能解释你的发挥空间。'],
 ['S04','这种状态你应该特别留意。','这种状态，是职业承载开始不足的一种表现。'],
 ['S04','所以你的职业发展不能只问：','因此，职业位置的差异，不只在于：'],
 ['S04','还应该问：','还在于：'],
 ['S04','所以你要特别区分两类机会。','这样的职业机会，在长期作用上有两类区别。'],
 ['S04','早期靠个人能力建立价值；\r\n中期必须学会让系统承接价值。','早期靠个人能力建立价值；\n中期则转向由系统承接价值。'],
 ['S05','所以你的财富边界一定要比一般人清楚。','清楚的资源边界，是共同结构能够持续的基础。'],
 ['S05','这就是为什么你在财富上一定要有预先设定的框架。','预先形成的配置框架，能够让敏锐的信息判断保持连贯。'],
 ['S05','所以你衡量资源时，不应该只算钱。','资源的成本并不只在金钱。'],
 ['S05','应该问：这个东西究竟占用了我什么？','时间与注意力同样构成实际占用。'],
 ['S06','所以在关系里，你需要逐渐学会区分两种情况：','关系中的处理顺序，取决于两种不同情况：'],
 ['S06','有些问题不要等到自己已经形成最终结论才说。','重要感受在最终结论形成以前被看见，双方才有共同理解的空间。'],
 ['S07','“她不需要帮助。”','“你不需要帮助。”'],
 ['S07','所以你需要记得：','这个角色的边界在于：'],
 ['S07','你不需要永远站在中间调停。','长期站在中间调停，并不是这个角色唯一的运行方式。'],
 ['S08','所以你的压力课题之一，是学会区分：','压力能否减轻，也与标准怎样分配有关：'],
 ['S08','所以不要等到完全不想动，才承认需要休息。','在完全失去行动意愿以前，这些信号已经反映了恢复需求。'],
 ['S08','这里不需要把任何身体状态简单归因于八字。','身体的具体感受，仍然来自实际生活中的状态。'],
 ['S09','所以你真正需要避免的，是把每一次调整都理解成失败。','每一次调整并不都意味着失败。'],
 ['S10','真正重要的是，不要因为还能运行，就误以为不需要改变。','仍能运行与仍然适合，并不是同一个判断。']
];
for(const [id,before,after]of voiceEdits){const s=section(id),p=s.paragraphs.find(p=>p.text.replace(/\r\n/g,'\n')===before.replace(/\r\n/g,'\n'));assert(p,'Voice edit anchor: '+before);edit(id,p.text,after,'Interpretive customer voice; retain the accepted meaning.');}
const themes={THREE_GENG:/三庚|三庚并见/,WATER_NETWORK:/申.{0,2}子.{0,2}辰|水势|水局/,OUTPUT_TO_VALUE:/食伤生财|输出.{0,12}价值|金生水|水.{0,8}生.{0,4}木/,CLASH_GROWTH:/寅申冲|寅申相冲|寅与申|申与寅/,RESPONSIBILITY:/责任|承担|权限/,PROBLEM_SOLVING:/解决问题|处理问题|看见问题|找到问题|修正问题|收拾残局/,RESOURCE_RETENTION:/留存|净资产|资产|留住|留下来的/,STAGE_TRANSITION:/重组|阶段.{0,8}结束|周期/,SENSITIVE_CAPACITY:/压力|超负荷|疲惫/};
const paragraphMap=source.flatMap(s=>s.paragraphs.map(p=>({...p,primaryOwnership:s.sectionId,themes:Object.entries(themes).filter(([,r])=>r.test(p.text)).map(([k])=>k),disposition:changes.find(c=>c.paragraphId===p.id)?.disposition||'KEEP',destinationSection:changes.find(c=>c.paragraphId===p.id)?.owningSection||s.sectionId})));
const overlap=[];for(const [theme,re]of Object.entries(themes)){const members=rows.flatMap(s=>s.paragraphs.filter(p=>re.test(p.text)).map(p=>({section:s.sectionId,paragraphId:p.id,text:p.text})));for(const a of members)for(const b of members)if(a.section<b.section&&a.text.length>=25&&b.text.length>=25){const bigrams=t=>new Set([...t].slice(0,-1).map((_,i)=>t.slice(i,i+2))),x=bigrams(a.text),y=bigrams(b.text),shared=[...x].filter(z=>y.has(z)).length,score=shared/Math.min(x.size,y.size);if(score>=.18)overlap.push({theme,originatingSection:a.section,duplicateSection:b.section,originatingParagraph:a.paragraphId,duplicateParagraph:b.paragraphId,semanticHeuristicScore:Number(score.toFixed(3)),disposition:a.text===b.text?'KEEP':'DOMAIN-SPECIFIC-KEEP',reason:'Shared admitted natal theme serves distinct chapter ownership; full explanatory duplicates were handled by explicit editorial operations.',origin:a.text,duplicate:b.text});}}
const advice=rows.flatMap(s=>s.paragraphs.flatMap(p=>[...p.text.matchAll(/应该|不应该|必须|建议|最好|需要|你要|可以这样|不能这样/g)].map(m=>({section:s.sectionId,paragraphId:p.id,token:m[0],context:p.text,classification:'INTERPRETIVE_CONDITION_OR_QUOTED_SELF_TALK',disposition:'KEEP',reason:'Retained occurrence expresses an accepted structural requirement, inner expectation, or conditional life context; not automatically removed.'}))));
const packPath='docs/acceptance/bazi-paid-report/editorial/GEN-01-AUTHORITY-PACK-R2.json',packBytes=fs.readFileSync(packPath),pack=JSON.parse(packBytes);assert.deepEqual(Object.values(pack.chart.pillars),['庚申','甲子','庚辰','庚寅']);
const timing={schemaVersion:'BAZI-FR-C1-TIMING-LOCK-v1',source:'User execution specification D plus immutable S10 accepted manuscript; a faithful lock projection, not a newly calculated chart.',sourceManuscript:rows.find(s=>s.sectionId==='S10').sourcePath,sourceSha256:manifest.sections.find(s=>s.sectionId==='S10').sha256,natal:pack.chart.pillars,daYun:'己巳',annual:'丙寅',identityState:'PARTIAL_TEST_STRUCTURE',relations:['甲己合','巳申六合兼破','巳寅害','寅巳申刑','年度寅重复原局寅','年度寅冲原局申','年度寅害大运巳'],gregorianYear:null,age:null,startDate:null,transformationConclusion:null,eventForecasts:false};
const candidate={version:'BAZI-FR-C1',locale:'zh-Hans',sourceAcceptance:'ACCEPTED',fullReportHumanDecision:'PENDING',editorialConvergence:'PENDING_HUMAN_REVIEW',contentFrozen:false,referenceImplementation:false,productionActivated:false,providerCalls:0,natalAuthority:{sourcePath:packPath,sha256:sha(packBytes),pillars:pack.chart.pillars},timingAuthority:timing,sections:rows.map(s=>({sectionId:s.sectionId,title:s.titleZh,sourcePath:s.sourcePath,sourceSha256:s.sha256,paragraphs:s.paragraphs,originalUnits:source.find(x=>x.sectionId===s.sectionId).paragraphs.reduce((n,p)=>n+[...p.text.replace(/\s/g,'')].length,0),units:s.paragraphs.reduce((n,p)=>n+[...p.text.replace(/\s/g,'')].length,0)}))};
fs.mkdirSync(root+'converged',{recursive:true});for(const s of candidate.sections)fs.writeFileSync(root+'converged/'+s.sectionId+'-ZH-CANDIDATE.md','# '+s.title+'\n\n'+s.paragraphs.map(p=>p.text).join('\n\n')+'\n');
const json=(name,v)=>fs.writeFileSync(root+name,JSON.stringify(v,null,2)+'\n');
json('EDITORIAL-INPUT-SNAPSHOT.json',{sourceAcceptance:'ACCEPTED',immutableInputs:manifest.sections,sections:source,providerCalls:0});json('PARAGRAPH-OWNERSHIP.json',paragraphMap);json('EDITORIAL-CHANGES.json',changes);json('DEDUP-AUDIT.json',{method:'Paragraph ownership plus multi-theme bigram semantic-candidate heuristics, followed by explicit minimal editorial dispositions; no provider.',candidates:overlap,operations:changes.filter(c=>['TRIM','REASSIGN'].includes(c.disposition)),remainingExactDuplicates:overlap.filter(x=>x.origin===x.duplicate)});json('ADVICE-LANGUAGE-AUDIT.json',{minimalVoiceEdits:changes.filter(c=>c.reason.includes('customer voice')),retainedOccurrences:advice});json('TIMING-AUTHORITY.json',timing);json('CONVERGED-CANDIDATE.json',candidate);
fs.writeFileSync('functions/personal-reading/narrative/bazi-full-report-c1-copy.generated.js','// Deterministic edition extension of the existing BaZi accepted-copy publication owner.\n// Source manuscripts stay immutable; final convergence remains pending Human Review.\nexport const BAZI_FULL_REPORT_C1='+JSON.stringify(candidate,null,2)+';\n');
console.log('Built C1 candidate from 9 hash-verified accepted sources; '+changes.length+' paragraph dispositions; provider calls 0; final acceptance pending.');
