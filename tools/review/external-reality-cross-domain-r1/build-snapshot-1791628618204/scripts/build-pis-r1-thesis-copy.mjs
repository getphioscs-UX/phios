import fs from 'node:fs';
import {parseHTML} from 'linkedom';
const edits={
 'route.runtime':['Keeping context','保留情境'],
 'route.implementation':['Explore the ideas','探索这些想法'],
 'position.title':['Why more answers create another question.','为什么更多答案，会带来另一个问题。'],
 'position.copy':['The thesis asks how we can keep answers connected to a situation that continues to change.','核心论述追问：怎样让答案持续连接不断变化的处境。'],
 'position.statement':['More intelligence can help generate answers. Choosing a direction also requires attention to context, constraints and the consequences of action. PHI OS develops this as a research proposition, open to examination.','更多智能可以帮助产生答案。选择方向，还需要关注情境、限制与行动后果。PHI OS 将其作为可讨论、可检验的研究命题。'],
 'position.l1.label':['The question','研究问题'],
 'position.l2.copy':['Ask what helps people notice and understand changes in a situation.','追问什么能帮助人发现并理解处境的变化。'],
 'position.l3.label':['A connected explanation','相互连接的解释'],
 'position.l3.copy':['Relate observations, interpretations, changes and continuity without treating them as the same thing.','连接观察、解释、变化与连续性，同时保留它们的区别。'],
 'position.l4.label':['Ways to explore','探索方式'],
 'position.l4.copy':['Follow the books, ask a question or explore a situation through the available reading tools.','沿书籍阅读，提出问题，或通过现有读取工具探索处境。'],
 'runtime.title':['Keep the situation in view.','让处境始终留在视野里。'],
 'runtime.body':['If each conversation starts from an isolated snapshot, important history and constraints can be lost. Keeping context makes it easier to ask whether an answer still fits today.','如果每次交流都从孤立片段开始，重要经历与限制就可能丢失。保留情境，才能继续追问：这个答案在今天是否仍适合。'],
 'journey.eyebrow':['03 · From question to reflection','03 · 从问题到反思'],
 'journey.s3':['Interpret the present situation without treating interpretation as fact.','解释当前处境，同时不把解释当作事实。'],
 'journey.s6':['Keep what you learned and return when circumstances change.','保留新的理解，在处境变化后再回来看看。'],
 'implementation.eyebrow':['04 · Continue exploring','04 · 继续探索'],
 'implementation.a1':['Explore the fifteen parts through the seven connected books.','通过相互连接的七册书，探索十五部内容。'],
 'implementation.a2':['Describe a situation, understand it, consider a next step and return to its outcome.','描述处境、理解处境、考虑下一步，再回看结果。'],
 'implementation.a3':['Keep observations and earlier questions available for later reflection.','保留观察与曾经的问题，方便以后回看。'],
 'implementation.a4.title':['Tools and human support','工具与真人协助'],
 'implementation.a4.copy':['Choose a reading tool or professional service with a clear purpose and scope.','选择目的与范围清楚的读取工具或专业协助。']
};
const dictionaries={};
for(const [i,locale] of ['en','zh-Hans'].entries()){
 const file=`assets/js/locales/${locale}/thesis.js`;
 const source=fs.readFileSync(file,'utf8');
 const json=JSON.parse(source.slice(source.indexOf('Object.freeze(')+14,source.lastIndexOf(');')));
 for(const [key,pair] of Object.entries(edits)){const parts=key.split('.');let obj=json.thesis;for(const k of parts.slice(0,-1))obj=obj[k];obj[parts.at(-1)]=pair[i];}
 dictionaries[locale]=json;
 fs.writeFileSync(file,'const thesis = Object.freeze('+JSON.stringify(json,null,2)+');\n\nexport default thesis;\n');
}
let html=fs.readFileSync('thesis.html','utf8');
const {document}=parseHTML(html);
for(const [key,[en]] of Object.entries(edits))for(const node of document.querySelectorAll(`[data-i18n="thesis.${key}"]`)){const old=node.outerHTML;node.textContent=en;html=html.replace(old,node.outerHTML);}
html=html.replace('<h3>Runtime Memory</h3>','<h3 data-pis-copy data-cx-en="Remember and return" data-cx-zh="保留记录，再回来看看">Remember and return</h3>');
fs.writeFileSync('thesis.html',html);
console.log('PIS: thesis public copy updated in both locale authorities and static fallback.');
