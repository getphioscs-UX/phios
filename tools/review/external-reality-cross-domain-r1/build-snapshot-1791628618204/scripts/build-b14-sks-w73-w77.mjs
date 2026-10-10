import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {base,page} from './build-b14-sks-book1-acceptance.mjs';
export const specifications=[
 {stage:73,book:3,roman:'III',route:'reality-continuity',tasks:[
 ['SELECT_DEGRADATION','选择 degradation','记录退化主题名称、objectId、点击路径和截图。'],
 ['SEE_SIGNALS','看到 signals','记录实际可见的信号及来源；只有标题或待补充提示应标记 FAIL。'],
 ['SEE_RECOVERY','看到 recovery modes','找到恢复模式，用自己的话说明它与退化的关系；列表相邻不代表存在关系。'],
 ['UNDERSTAND_CONTINUITY','理解 continuity','解释如何维持连续性及其边界；观察员不能代替页面补充解释。']]},
 {stage:74,book:4,roman:'IV',route:'reality-expansion',tasks:[
 ['SELECT_EXPANSION','选择 expansion mode','记录扩展主题、objectId、操作路径和截图。'],
 ['SEE_CONSTRAINT','看到 constraint','记录实际约束及来源；不能仅凭标题推测内容。'],
 ['SEE_THRESHOLD','看到 threshold','指出页面明确提供的阈值或判断条件；没有就标记 FAIL，不能自行编造。'],
 ['UNDERSTAND_SCALE','理解 scale transition','用自己的话解释尺度转换，并区分文章摘要与正式对象定义。'],
 ['ENTER_BOOK_V','进入 Book V','从当前探索流程进入第五册，记录点击链接及落地网址；导航不代表跨册因果关系。']]}
];
export function packet(spec){
 const paths=[`content/knowledge/structured/book-${spec.book}/book-${spec.book}-${spec.book===3?'maintenance-signal':'expansion-mode'}-registry-v1.json`,'assets/js/knowledge/progressive-explorer.js','assets/js/pages/book-volume-seven.js','assets/customer-ui/js/surfaces/knowledge.js','assets/customer-ui/js/surfaces/structured-answer.js'];
 const sourceDigests=Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
 return {stage:`B14-SKS-W${spec.stage}`,sourceDigest:createHash('sha256').update(JSON.stringify(sourceDigests)).digest('hex'),sourceDigests,timeBudgetSeconds:null,humanAcceptanceComplete:false,status:'READY_FOR_DEFERRED_READER_TEST',tasks:spec.tasks.map(([id,label,evidence])=>({id,label,evidence}))};
}
export function html(spec,p){return page(p).replaceAll('W71',`W${spec.stage}`).replaceAll('Book I',`Book ${spec.roman}`).replaceAll('五分钟','本次').replaceAll('五项','全部任务').replaceAll(' / 300 秒',' 秒').replaceAll('且在本次内','').replaceAll('本次全部通过条件','全部任务通过条件').replaceAll('/books/reality-formation/',`/books/${spec.route}/`);}
export function artifacts(){return Object.fromEntries(specifications.flatMap(spec=>{const p=packet(spec);return [[`${base}w${spec.stage}-book${spec.book}-acceptance-v1.json`,JSON.stringify(p,null,2)+'\n'],[`${base}W${spec.stage}-BOOK${spec.book}-READER-REVIEW.html`,html(spec,p)]]}));}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/build-b14-sks-w73-w77.mjs'))for(const [path,text] of Object.entries(artifacts()))fs.writeFileSync(path,text);
