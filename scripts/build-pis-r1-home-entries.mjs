import fs from 'node:fs';
import {parseHTML} from 'linkedom';
let html=fs.readFileSync('index.html','utf8');const {document}=parseHTML(html);
const section=document.querySelector('[data-cx-home-section="H03"]');
const old=section.outerHTML;
const cards=[
 ['I have a question','我有一个问题','Ask directly, then follow the reading that helps you go further.','直接提问，再沿有用的阅读继续了解。','/knowledge/ask/','Ask for free','免费提问'],
 ['I want to understand first','我想先了解','Explore the approach or try a free book preview before choosing more.','先了解方法，或免费预览书籍，再决定是否深入。','/books/','Preview the books','预览书籍'],
 ['I want to understand my situation','我想了解自己的处境','Connect what happened, what you know and what you still need to understand.','连接发生的事、已知信息与仍需理解的问题。','/reality/','Open My Reality','打开我的现实'],
 ['I want another perspective','我想从另一个视角看','Compare a method’s interpretation with your observations and circumstances.','把方法提供的解释，与自己的观察和处境比较。','/perspectives/','Explore perspectives','探索不同视角'],
 ['I want to follow changes over time','我希望持续记录变化','Learn about continuing access and check what is available in your account.','了解持续使用的方式，并查看账户中可用的内容。','/membership.html','Understand continuing access','了解持续使用方式'],
 ['I need professional support','我需要专业协助','Find out who can help, what the work involves and whether it fits your question.','了解由谁协助、过程包含什么，以及是否适合自己的问题。','/professional/','Explore professional help','了解专业协助']
];
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;');
section.querySelector('.cx-eyebrow').setAttribute('data-cx-en','SIX WAYS TO BEGIN');section.querySelector('.cx-eyebrow').setAttribute('data-cx-zh','六种开始方式');section.querySelector('.cx-eyebrow').textContent='SIX WAYS TO BEGIN';
section.querySelector('.cx-home-beginnings__grid').innerHTML=cards.map(([en,zh,be,bz,href,ae,az],i)=>`<article class="cx-home-beginning"><p class="cx-meta">0${i+1}</p><h3 class="cx-heading-2" data-cx-en="${esc(en)}" data-cx-zh="${esc(zh)}">${en}</h3><p class="cx-body" data-cx-en="${esc(be)}" data-cx-zh="${esc(bz)}">${be}</p><a class="cx-button cx-button--text" href="${href}" data-cx-en="${esc(ae)}" data-cx-zh="${esc(az)}">${ae}</a></article>`).join('');
html=html.replace(old,section.outerHTML);
fs.writeFileSync('index.html',html);
console.log('PIS: six need-based home entries, using existing destinations only.');
