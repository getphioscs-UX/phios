import fs from'node:fs';import{createHash}from'node:crypto';
const p='tools/review/free-ask-manuscript-r1/whole-chapter-batch-r1/INDEPENDENT-QUESTIONS.json';if(fs.existsSync(p))throw Error('INDEPENDENT_SET_ALREADY_FROZEN_DO_NOT_RECREATE');
const cases=[
 {id:'H-I-CITY-IDENTITY',book:'BOOK-1',section:'B1V3-P1-S006',q:'城市设施不断被替换，为什么还能算同一座城市？',must:['城市','运行','变化']},
 {id:'H-I-READABILITY',book:'BOOK-1',section:'B1V3-P1-S006',q:'结构保持连续，就等于已经可以读取其中的一切吗？',must:['尚未','读取','压缩']},
 {id:'H-III-FUNCTIONS-WORK',book:'BOOK-3',section:'CM-B3V1-P8-S001',q:'功能还正常时就安排维护，是不是多此一举？',must:['维护','更早','运行']},
 {id:'H-III-COST-TRANSFER',book:'BOOK-3',section:'CM-B3V1-P8-S001',q:'长期维护只是让本部门轻松，把成本转移出去也算成功吗？',must:['成本','隐藏','消耗']},
 {id:'H-V-INTERNAL-DIVERSITY',book:'BOOK-5',section:'B5-S002',q:'同一国界之内能否同时有多种文明传统？',must:['国家','多种','差异']},
 {id:'H-V-COLLAPSE-LANGUAGE',book:'BOOK-5',section:'B5-S002',q:'政权垮台以后，语言和宗教网络是否也必然归零？',must:['国家灭亡并不等于文明消失','继续']}
];
fs.writeFileSync(p,JSON.stringify({role:'UNSEEN_FIRST_EXECUTION_NOT_USED_TO_TUNE_RULES',at:new Date().toISOString(),runtimeDependencySnapshot:'Source rules fixed before this question set; future repairs become regression',cases},null,2)+'\n');console.log({path:p,sha256:createHash('sha256').update(fs.readFileSync(p)).digest('hex'),cases:cases.length});
