import fs from 'node:fs';
import {parseHTML} from 'linkedom';
const read=p=>JSON.parse(fs.readFileSync(p));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const copy=read('content/web/index-surfaces/pis-r1-discovery-copy-v1.json');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
// Explicit editorial replacements. Identifiers, access conditions and API contracts are untouched.
const replacements=[
 ['Academy consumes the existing ALR learning authority. It does not create a second learning runtime, fake progress or credentials.','Explore reading paths and practise connecting ideas to a real question.','探索阅读路径，练习把想法连接到真实问题。'],
 ['Approved ALR paths appear below when their structure can be projected safely.','Explore the learning outlines currently available below.','在下方了解目前可查看的学习大纲。'],
 ['Progress, assessments and credentials remain hidden unless ALR explicitly activates them for the customer.','Each path explains whether lessons, practice or assessment are currently available.','每条路径会说明课程、练习或评估是否已经开放。'],
 ['Loading admitted learning structure…','Loading learning paths…','正在加载学习路径……'],
 ['Professional work adds accountable human review. It does not simply expose more runtime fields.','Work with a person who can explain their assessment, its scope and their responsibility.','与能够说明判断、服务范围及责任的专业人士一起核对。'],
 ['Build a dated Financial Reality first; professional recommendations remain a separate governed layer.','Organize your current financial situation before considering professional recommendations.','先整理目前的财务处境，再讨论专业建议。'],
 ['Only released reports belong on the customer surface. Draft report state remains internal.','View reports that have been completed and made available to you.','查看已经完成并交付给你的报告。'],
 ['These diagrams are canonical customer visuals from the existing visual-production registry. They explain structure; they do not create new knowledge authority.','Explore summary diagrams and follow their related reading to understand the relationships in context.','浏览总结图示，并通过相关阅读理解其中的关系。'],
 ['How canonical nodes can project into readable articles and visual explanations.','How ideas connect with articles and visual explanations.','概念如何连接文章与图示说明。'],
 ['Bring admitted personal perspectives into one reading while preserving their source and limits.','Compare personal perspectives while keeping each method’s source and limits in view.','比较个人视角，同时了解各方法的来源与限制。'],
 ['ECR, Astrology, BaZi, Zi Wei, Human Design when admitted, and Numerology remain bounded symbolic or interpretive sources.','Explore the available methods, including Astrology, BaZi, Zi Wei, Human Design and Numerology. Each offers a different interpretive perspective.','了解当前可用的方法，包括占星、八字、紫微、人类图与数字学。不同方法提供不同解释视角。'],
 ['I Ching and Tarot begin from a question. Their live availability remains governed separately.','Bring a question to I Ching or Tarot and check the individual page for available experiences.','带着问题进入易经或塔罗，在各自页面查看可用体验。'],
 ['Retained continuity from the Journey runtime','Return to your previous observations','回看之前的观察'],
 ['Released reports connected to this Reality','Reports available for this situation','与这个处境相关的已交付报告'],
 ['You should know who the service is for, what materials are needed, what happens during review, what is delivered, the price authority and the professional boundary.','Before deciding, check who the service is for, the information needed, the process, deliverables, price and limits.','决定前，先了解适合对象、所需资料、过程、交付内容、价格与服务限制。'],
 ['Appointment availability and booking are separate from this customer presentation. This page does not invent availability or take payment without the commerce authority.','Check the available appointment options and confirmation details before making arrangements.','安排之前，请先查看可预约选项及确认说明。'],
 ['What the governed analysis found in the current structure','What the analysis shows about your current situation','分析显示的当前处境'],
 ['Priorities and options only appear when a governed planning product supplies them','Available planning options appear here when included in your service','服务包含的规划选项会在此显示'],
 ['Only a released governed report can appear here','Your completed report will appear here when available','报告完成并可查看后，将显示在这里']
];
const heroes={
 'about/founder/index.html':'HERO-001','about/reality-navigation/index.html':'HERO-001','thesis.html':'HERO-001',
 'explore/index.html':'HERO-001','explore/how-it-works/index.html':'PIS-040','explore/start/index.html':'PIS-039',
 'knowledge/index.html':'HERO-002','articles/index.html':'HERO-004','knowledge/concepts/index.html':'PIS-041','figures/index.html':'HERO-005','books/index.html':'PIS-039',
 'perspectives/index.html':'PIS-016','membership.html':'PIS-038','academy/index.html':'PIS-036',
 'professional/index.html':'PIS-035','professional/services/index.html':'HERO-014','professional/appointments/index.html':'HERO-014','professional/authority/index.html':'HERO-014','professional/external-readers/index.html':'HERO-014',
 'research/index.html':'PIS-005','research/human-reading-systems/index.html':'HERO-005','research/why-reality-navigation/index.html':'PIS-004'
};
const galleries={
 'thesis.html':[['PIS-001','From answers to direction','从答案走向方向'],['PIS-002','Observation, interpretation and action','观察、解释与行动'],['PIS-004','Choices within a wider economy','更广泛经济中的选择'],['PIS-005','Keeping knowledge connected to action','让知识继续连接行动'],['PIS-006','A visual overview of the thesis','核心论述视觉总览','en'],['PIS-007','A visual overview of the thesis','核心论述视觉总览','zh-Hans']],
 'about/index.html':[['PIS-003','The wider context around a decision','决定所处的更广泛情境']],
 'about/reality-navigation/index.html':[['PIS-017','Rules and responsibility','规则与责任'],['PIS-018','An interpretation to examine','可以核对的解释'],['PIS-019','Consider when a next step is appropriate','考虑何时适合走下一步'],['PIS-020','A model offers a perspective','模型提供一种视角'],['PIS-021','Keep open questions visible','保留尚未明确的问题']],
 'perspectives/index.html':[['PIS-022','Astrology','占星'],['PIS-023','BaZi','八字'],['PIS-024','Human Design','人类图'],['PIS-025','I Ching','易经'],['PIS-026','Numerology','数字学'],['PIS-027','Tarot','塔罗'],['PIS-028','Zi Wei','紫微']],
 'reality/index.html':[['PIS-034','Your situation, in context','结合情境理解自己'],['PIS-040','Return to see what changed','回来看看改变了什么']],
 'professional/financial/index.html':[['PIS-037','Organize the situation before deciding','决定前先整理处境']],
 'knowledge/index.html':[['PHIOS-ILLUSTRATION-LIBRARY-KNOWLEDGE-LANDSCAPE-V1','Find a reading path through connected ideas','沿相互连接的想法寻找阅读路径'],['PIS-041','Follow an idea into its related reading','沿一个想法进入相关阅读']]
};
const begin='<!-- PIS-R1 VISUAL START -->',end='<!-- PIS-R1 VISUAL END -->';
const manifest=[];
for(const file of Object.keys(copy.pages)){
 let html=fs.readFileSync(file,'utf8');
 // Replace complete bilingual elements, leaving selectors and conditions intact.
 for(const [old,en,zh] of replacements){
  const {document}=parseHTML(html);const nodes=[...document.querySelectorAll('[data-cx-en]')].filter(n=>n.getAttribute('data-cx-en')===old);
  for(const n of nodes){const before=n.outerHTML;n.setAttribute('data-cx-en',en);n.setAttribute('data-cx-zh',zh);n.textContent=en;html=html.replace(before,n.outerHTML);}
 }
 const images=galleries[file]||[];
 const gallery=images.length?begin+'\n<section class="pis-editorial pis-visual-story"><div class="pis-editorial__grid">'+images.map(([code,en,zh,locale])=>`<figure${locale?` data-pis-locale="${locale}"`:''}><img data-px2-asset="${code}" loading="lazy" decoding="async" alt="" aria-hidden="true"><figcaption data-pis-copy data-cx-en="${esc(en)}" data-cx-zh="${esc(zh)}">${esc(en)}</figcaption></figure>`).join('')+'</div></section>\n'+end:'';
 if(html.includes(begin))html=html.slice(0,html.indexOf(begin))+gallery+html.slice(html.indexOf(end)+end.length);else html=html.replace('</main>',gallery+'\n</main>');
 if(heroes[file])html=html.replace(/<body\b(?![^>]*data-pis-hero)/,'<body data-pis-hero="'+heroes[file]+'"');
 const {document}=parseHTML(html);const title=document.title;const route=file==='index.html'?'/':'/'+file.replace(/index\.html$/,'');
 const description=copy.pages[file][0].body.en;
 const tags=[];
 if(!document.querySelector('meta[name="description"]'))tags.push(`<meta name="description" content="${esc(description)}">`);
 if(!document.querySelector('link[rel="canonical"]'))tags.push(`<link rel="canonical" href="https://www.getphios.com${route}">`);
 if(!document.querySelector('meta[property="og:title"]'))tags.push(`<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:url" content="https://www.getphios.com${route}">`);
 html=html.replace('</head>',tags.join('\n')+'\n</head>');
 fs.writeFileSync(file,html);
 manifest.push({file,route,hero:heroes[file]||null,images:images.map(x=>x[0]),scope:'PRESENTATION_ONLY',humanReview:'PENDING',stripe:'NOT_TESTED'});
}
write('content/web/index-surfaces/pis-r1-presentation-manifest-v1.json',{baseline:'8d98d06f87a6ac11ce254670680f7cd3f938e0d2',pages:manifest});
console.log(`PIS presentation: ${manifest.length} existing pages, ${Object.keys(heroes).length} hero placements; no commerce activation.`);
