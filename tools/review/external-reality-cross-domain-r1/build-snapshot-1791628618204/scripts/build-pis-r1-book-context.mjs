import fs from 'node:fs';
const books=[
 ['reality-formation','What makes a situation take shape?','一个处境如何形成？','Begin with the conditions, perspectives, changes and carriers through which a reality takes shape. This volume is a useful starting point when you want to understand the foundations before moving into interaction or navigation.','从条件、投影、变化与载体，理解现实怎样形成。想先了解基础，再进入人与世界的互动或导航时，可以从这一册开始。'],
 ['reality-runtime','How do experience, relationships and collective life interact?','经验、关系与集体生活如何相互作用？','Follow the movement from conscious experience into relationships and collective activity. This volume is useful when a question involves more than one person or when individual and shared patterns need to be considered together.','从意识经验进入关系与集体活动。当问题涉及不止一个人，或需要一起理解个人与共同模式时，可以从这一册继续。'],
 ['reality-continuity','What allows something to keep going—and recover?','什么让一件事得以持续，并能够恢复？','Explore maintenance, recovery, coordination and continuity. This volume is useful when a situation can begin but struggles to remain workable, or when restoring conditions matters more than simply adding more activity.','探索维持、恢复、协调与连续性。当一件事能够开始，却难以持续；或恢复条件比继续增加活动更重要时，可以阅读这一册。'],
 ['reality-expansion','Why does a larger scale change the problem?','为什么规模变大，问题也会改变？','Explore expansion and changes of scale, including the questions that arise in civilization. This volume is useful when continued operation is being mistaken for readiness to expand. Read the distinctions in context rather than treating a summary as a numerical threshold.','探索扩展与尺度变化，以及文明中的相关问题。当持续运行被误认为已经适合扩展时，可以阅读这一册。请结合正文理解区分，总结本身不是数值阈值。'],
 ['reality-differentiation','How can civilizations be compared without ranking them?','怎样比较文明，而不把它们排成高低？','Explore the Civilization Atlas through its cases, positions and changing trajectories. This volume is useful for noticing different carriers and boundaries in historical context. Illustrations support exploration; they are not independent proof of a historical claim.','通过案例、位置与变化轨迹探索文明图谱。这一册帮助结合历史情境，理解不同载体与边界。插图辅助探索，本身不独立证明历史主张。'],
 ['reality-observation','What did we observe, and what did we interpret?','哪些是观察，哪些是解释？','Explore the relationship between observation, evidence, models and interpretation. This volume is useful before relying on a reading or comparing methods: it helps you ask what a statement is based on and what remains uncertain.','探索观察、证据、模型与解释之间的关系。依赖某次读取或比较方法之前，这一册帮助追问：陈述根据什么，又有哪些仍不确定。'],
 ['reality-navigation','How can understanding lead to a next step?','理解如何走向下一步？','Follow the relationship between reading a situation, considering direction, taking action and returning to the outcome. This volume is useful when you want to connect reflection with what happens next, without expecting a book to choose your life for you.','理解处境、考虑方向、采取行动，再回看结果。这一册帮助把反思与后来发生的事连接起来，而不是期待一本书替自己决定人生。']
];
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;');
const node=(tag,en,zh)=>`<${tag} data-pis-copy data-cx-en="${esc(en)}" data-cx-zh="${esc(zh)}">${en}</${tag}>`;
const begin='<!-- PIS BOOK CONTEXT START -->',end='<!-- PIS BOOK CONTEXT END -->';
for(const [i,[slug,en,zh,bodyEn,bodyZh]] of books.entries()){
 const file=`books/${slug}/index.html`;let html=fs.readFileSync(file,'utf8');
 // This retired stylesheet no longer exists; use the current reading styles.
 html=html.replace(/\s*<link rel="stylesheet" href="\/assets\/css\/knowledge-spine\.css">/g,'');
 const next=books[(i+1)%books.length];
 const section=begin+`<section class="pis-editorial" aria-label="Reading orientation">${node('h2',en,zh)}${node('p',bodyEn,bodyZh)}${node('p','Free preview pages and summary figures are available on this page. A complete volume develops the argument further; availability is stated in the book details.','本页提供免费预览页与总结图。完整书册进一步展开论述，是否开放获取以书籍详情为准。')}<nav aria-label="Related reading"><a href="/books/" data-pis-copy data-cx-en="Compare all seven books" data-cx-zh="比较七册书">Compare all seven books</a><a href="/books/${next[0]}/" data-pis-copy data-cx-en="Continue to the next volume" data-cx-zh="继续了解下一册">Continue to the next volume</a></nav></section>`+end;
 if(html.includes(begin))html=html.slice(0,html.indexOf(begin))+section+html.slice(html.indexOf(end)+end.length);else html=html.replace('</main>','</main>\n'+section);
 if(!html.includes('/assets/customer-ui/surfaces/public-index.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/customer-ui/surfaces/public-index.css">\n</head>');
 if(!html.includes('/assets/customer-ui/js/public-index-copy.js'))html=html.replace('</body>','<script type="module" src="/assets/customer-ui/js/public-index-copy.js"></script>\n</body>');
 html=html.replace('<title>PHI OS Books</title>',`<title>${en} — Book ${i+1} — PHI OS</title>`).replace('content="PHI OS canonical seven-volume knowledge architecture."',`content="${esc(bodyEn)}"`);
 fs.writeFileSync(file,html);
}
fs.writeFileSync('content/web/index-surfaces/pis-r1-book-context-v1.json',JSON.stringify({scope:'PUBLIC_READING_ORIENTATION_NOT_NEW_DEFINITIONS',books:books.map(([slug,en,zh,bodyEn,bodyZh],i)=>({bookId:`book-${i+1}`,file:`books/${slug}/index.html`,question:{en,zh},description:{en:bodyEn,zh:bodyZh},humanReview:'PENDING'}))},null,2)+'\n');
console.log('PIS: seven distinct book reading orientations; original dynamic reader and commerce unchanged.');
