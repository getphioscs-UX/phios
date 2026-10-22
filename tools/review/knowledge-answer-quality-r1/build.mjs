import fs from 'node:fs';
import crypto from 'node:crypto';
import {argumentTypes} from '../../../functions/_lib/knowledge-answer-quality-local.js';
import {loadBookViiPublishedAdmission} from '../../../functions/_lib/book-vii-published-admission.js';
const dir='tools/review/knowledge-answer-quality-r1/',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const corpus=read(dir+'ADMITTED-PUBLIC-CORPUS.json'),concepts=read('content/registry/concepts.json').concepts;
const units=corpus.articles.flatMap(a=>a.sources.map((s,i)=>({id:s.sourceId,sourceIdentity:a.slug,sourceType:s.sourceType,bookCode:a.bookCode,nodeCode:a.nodeCode,chapter:a.nodeCode,language:a.locale,sourceVersion:a.sourceVersion,textVersion:hash(s.text),bodySha256:a.bodySha256,locator:{href:s.href,paragraphOrdinal:i,fragmentCode:s.fragmentCode,path:a.manifestRecord.path},href:s.href,title:a.title,text:s.text,summary:s.text.slice(0,160),summaryStatus:'EXTRACT_NOT_NEW_THEORY',conceptIds:concepts.filter(c=>[c.en,c['zh-Hans']].filter(Boolean).some(t=>s.text.toLowerCase().includes(t.toLowerCase()))).map(c=>c.id),argumentTypes:argumentTypes(s.text),argumentClassification:'HEURISTIC_REQUIRES_REVIEW',conditions:null,exceptions:null,boundaryStatus:'NOT_SEPARATELY_ANNOTATED_READ_ORIGINAL_PARAGRAPH',permission:{qaEligible:true,publicationOwnerVerified:true,owner:'resolveSelectedArticle',manifest:a.manifest,productionReadable:'RUNTIME_UNVERIFIED'}})));
const b7=await loadBookViiPublishedAdmission(async p=>read(p));
if(b7)for(const f of b7.projections.fragments){const node=b7.projections.nodes.find(n=>n.nodeCode===f.nodeCode&&n.locale===f.locale);units.push({id:f.fragmentCode||f.sourceId||f.nodeCode+':'+units.length,sourceIdentity:f.nodeCode,sourceType:'PUBLISHED_KNOWLEDGE_FRAGMENT',bookCode:'BOOK-7',nodeCode:f.nodeCode,chapter:f.sectionCode||f.nodeCode,language:f.locale,sourceVersion:b7.releaseCode,textVersion:hash(f.text),locator:{path:'content/knowledge/public/successors/book-vii-v2-source-refresh-v1/published-projection.json',fragmentCode:f.fragmentCode},href:node?.href||'/books/world-reconfiguration/',title:node?.title||f.nodeCode,text:f.text,summary:f.text.slice(0,160),conceptIds:[],argumentTypes:argumentTypes(f.text),argumentClassification:'HEURISTIC_REQUIRES_REVIEW',conditions:null,exceptions:null,permission:{qaEligible:true,publicationOwnerVerified:true,owner:'loadBookViiPublishedAdmission',currentRefreshStatus:b7.status,productionReadable:'RUNTIME_UNVERIFIED'}});}
fs.writeFileSync(dir+'ARGUMENT-INDEX.json',JSON.stringify({version:'LOCAL-DERIVED-INDEX-1',originalTextUnchanged:true,authority:'DERIVED_INDEX_NOT_NEW_KNOWLEDGE_AUTHORITY',units},null,2));
const coverage=read(dir+'CORPUS-COVERAGE.json');coverage.book7Owner={path:'functions/_lib/book-vii-published-admission.js',resolved:!!b7,status:b7?.status,fragments:b7?.projections.fragments.length,language:'zh-Hans',newHumanAcceptance:b7?.sourceRefreshAuthorization?.newHumanAcceptance??null,negative:'No standalone article does not mean no published knowledge. Refresh admission is explicit source-refresh authority, not new human semantic acceptance.'};coverage.book8={path:'content/registry/successors/eight-volume-v1/book-8-manifest.json',manifest:read('content/registry/successors/eight-volume-v1/book-8-manifest.json'),claim:'Manifest existence alone does not prove indexed prose or QA admission. No Book8 fragments in these audited public owners.'};
fs.writeFileSync(dir+'CORPUS-COVERAGE.json',JSON.stringify(coverage,null,2));
const cases=read('tools/review/world-answer-quality-r1/QUESTION-RESULTS.json').map(r=>({id:'prior-'+r.id+'-'+r.locale,question:r.question,locale:r.locale,cohort:'PRIOR_TEN_BILINGUAL'}));
const unfamiliar=[
 ['为何公司增加软件预算，员工反而需要更多协调时间？','Why might a company spend more on software yet need more coordination time?'],
 ['家庭收入不变，照顾老人会怎样改变可用时间？','How can caring for an older relative change available time without changing household income?'],
 ['港口很近但供电不稳，工厂选址该比较什么？','What should a factory compare when a nearby port comes with unreliable electricity?'],
 ['同样的贷款利率，两个家庭为何得到不同审批结果？','Why might two households get different loan decisions at the same interest rate?'],
 ['更换工作后哪些观察能说明生活真的改善？','What observations after a job change would show whether life improved?'],
 ['人口减少时为什么人均产出仍可能增加？','Why might output per person rise while population falls?'],
 ['节省运输时间是否必然降低商品零售价？','Does saving transport time necessarily lower retail prices?'],
 ['为什么忙完再休息的安排可能无法持续？','Why might a plan to rest only after finishing everything be unsustainable?'],
 ['改变看法与改变事实有什么区别？','What is the difference between changing an interpretation and changing a fact?'],
 ['重复出现的结果是否足以证明同一个原因？','Do repeated outcomes prove that the same cause is responsible?'],
 ['跨国比较工资之前需要统一什么？','What must be aligned before comparing wages across countries?'],
 ['生活成本上涨是否说明所有家庭受到同样影响？','Does a higher cost of living affect every household equally?'],
 ['两个群体使用同一平台为何会形成不同看法？','Why might two groups using one platform form different interpretations?'],
 ['资源出口增加但地方学校没有改善，该查什么？','What should be checked when resource exports rise but local schools do not improve?'],
 ['住房贷款申请减少是否等于拒绝率上升？','Does a fall in mortgage applications mean the rejection rate rose?'],
 ['马来西亚2025年首次购房者的真实拒贷率是多少？','What was the actual rejection rate for first-time homebuyers in Malaysia in 2025?'],
 ['只知道出生时间能否确定我的收入？','Can my income be determined from my birth time alone?'],
 ['怎样区别选择、实际行动和事后结果？','How can a choice, an actual action and an observed outcome be distinguished?'],
 ['一个人的状态恢复是否能从一次好转确定？','Can one improvement establish that someone has recovered?'],
 ['不同年份的失业率可以直接比较吗？','Can unemployment rates from different years be compared directly?'],
 ['某地用水充足是否代表工业水处理成本低？','Does plentiful water imply low industrial water-treatment costs?'],
 ['全球降息是否代表我的银行一定会降低利率？','Do global rate cuts mean my bank must lower my rate?'],
 ['一个文明的延续是否证明其制度没有改变？','Does the continuity of a civilization prove its institutions never changed?'],
 ['为什么安全约束有时能让合作更持久？','Why might safety constraints make cooperation last longer?']
 ];
for(const [i,pair] of unfamiliar.entries())for(const [j,locale]of ['zh-Hans','en'].entries())cases.push({id:'unfamiliar-'+(i+1)+'-'+locale,question:pair[j],locale,cohort:'AUTHOR_DEFINED_NOT_HUMAN_BLIND',humanGold:{requiredPoints:null,correctUnitIds:null,misleadingUnitIds:null,acceptableBoundary:null,annotator:null}});
fs.writeFileSync(dir+'QUESTIONS.json',JSON.stringify({definedAt:new Date().toISOString(),thresholdSha256:hash(fs.readFileSync(dir+'THRESHOLDS.json')),blindLimitation:'Codex authored; no human gold yet. These are unfamiliar evaluation candidates, not a human blind benchmark.',cases},null,2));
console.log(JSON.stringify({units:units.length,book7:coverage.book7Owner,questions:cases.length}));
