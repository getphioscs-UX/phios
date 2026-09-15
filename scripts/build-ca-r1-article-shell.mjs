import fs from 'node:fs';
import {publicationRoutes} from './lib/customer-publication-sitemap.mjs';
const paths=publicationRoutes().filter(p=>p.startsWith('/articles/')&&p!=='/articles/').map(p=>p.slice(1)+'.html');
for(const p of paths){
 let html=fs.readFileSync(p,'utf8');
 if(!html.includes('data-article-slug='))throw new Error('ARTICLE_SHELL_MISSING:'+p);
 html=html.replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="https://getphios.com/${p.slice(0,-5)}">`);
 html=html.replace(/\s*<link[^>]+(?:rel="stylesheet"|rel="preconnect")[^>]*>/g,'');
 const styles=['tokens','base','typography','layout','components','motion','utilities'].map(x=>`  <link rel="stylesheet" href="/assets/customer-ui/${x}.css">`).join('\n')+'\n  <link rel="stylesheet" href="/assets/customer-ui/surfaces/article.css">';
 html=html.replace('</head>',styles+'\n</head>');
 html=html.replace(/<body[^>]*>/,'<body class="cx-article-page" data-cx-surface="ARTICLE_DETAIL" data-cx-nav="KNOWLEDGE" data-page="knowledge-article">');
 html=html.replace(/class="skip-link"/g,'class="cx-skip"').replace(/<header data-public-header-placeholder><\/header>/,'<div data-cx-header></div>').replace(/<footer data-public-footer-placeholder><\/footer>/,'<div data-cx-footer></div>');
 html=html.replace(' data-wpr-production-surface="ARTICLE"','').replace('/assets/js/public-shell.js','/assets/customer-ui/js/shell.js').replace('/assets/js/pages/article.js','/assets/customer-ui/js/surfaces/article.js');
 fs.writeFileSync(p,html);
}
console.log(`Current customer shell applied to ${paths.length} published article routes; article content authority unchanged.`);
