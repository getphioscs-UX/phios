import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {base,page} from './build-b14-sks-book1-acceptance.mjs';
export {base};
export function packet(){
 const paths=['content/knowledge/structured/book-2/book-2-runtime-pattern-registry-v1.json','assets/js/knowledge/runtime-interaction-atlas.js','assets/js/knowledge/progressive-explorer.js','assets/js/knowledge/structured-loader.js'];
 const sourceDigests=Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
 return {stage:'B14-SKS-W72',sourceDigest:createHash('sha256').update(JSON.stringify(sourceDigests)).digest('hex'),sourceDigests,timeBudgetSeconds:null,humanAcceptanceComplete:false,status:'READY_FOR_DEFERRED_READER_TEST',tasks:[
 {id:'SELECT_INTERACTION',label:'选择 interaction',evidence:'记录所选主题名称、objectId、个人／双人／群体等范围，以及实际操作路径。'},
 {id:'SEE_FEEDBACK',label:'看到 feedback',evidence:'记录页面实际呈现的反馈内容与来源。只有标题、空字段或待提取提示不算通过；不存在就标记 FAIL。'},
 {id:'UNDERSTAND_PATTERN',label:'理解 relationship / collective pattern',evidence:'用自己的话说明关系或集体模式及其适用范围。不得由观察员补充页面没有的解释；未理解或缺少内容就标记 FAIL。'}]};
}
export function html(p){return page(p).replaceAll('W71','W72').replaceAll('Book I','Book II').replaceAll('五分钟','读者').replaceAll('五项','三项').replaceAll('300 秒','用时（秒）').replaceAll(' / 300','').replaceAll('且在读者内','').replaceAll('未满足读者全部通过条件','未满足三项全部通过条件').replaceAll('读者读者','读者').replaceAll(' / 用时（秒）',' 秒').replaceAll('/books/reality-formation/','/books/reality-runtime/');}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/build-b14-sks-book2-acceptance.mjs')){const p=packet();fs.mkdirSync(base,{recursive:true});fs.writeFileSync(base+'w72-book2-acceptance-v1.json',JSON.stringify(p,null,2)+'\n');fs.writeFileSync(base+'W72-BOOK2-READER-REVIEW.html',html(p));}
