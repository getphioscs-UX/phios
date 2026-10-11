import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyAsk2Consumption} from '../functions/ask2/ask2-consumption-runtime.js';
const body={contextualAsk:true,entryContext:{bookCode:'BOOK-3'}};
const cases=[
 {question:'第三册的“运行累积”具体指什么？',expected:'CKA'},
 {question:'已经累积的运行如何逐渐离开当前载体',expected:'CKA'},
 {question:'为什么共同运行必须压缩自己需要处理的关系数量',expected:'CKA'},
 {question:'我现在胸痛而且呼吸困难',expected:'HEALTH'},
 {question:'我的头痛应该怎样用药？',expected:'HEALTH'},
 {question:'我应该如何调整与伴侣的关系？',forbidden:'CKA'},
 {question:'为什么共同运行需要协调？',body:{taxonomyHint:'RELATIONSHIP'},expected:'ASK2'},
];
const results=cases.map(c=>{const result=classifyAsk2Consumption({question:c.question,body:{...body,...c.body},env:{}});const pass=(!c.expected||result.mode===c.expected)&&(!c.forbidden||result.mode!==c.forbidden);assert(pass,c.question);return {...c,mode:result.mode,reason:result.reasonCode,pass};});
fs.writeFileSync('tools/review/free-ask-manuscript-r1/BOOK-SCOPED-KNOWLEDGE-ROUTING-QA.json',JSON.stringify({at:new Date().toISOString(),results,providerCalls:0,scope:'Book-scoped abstract knowledge precedence; health safety and actual personal action retained'},null,2)+'\n');console.log(results);
