import fs from 'node:fs';
export const manifests=['content/knowledge/public/visual-article-release.json','content/knowledge/public/abl-bilingual-release.json','content/knowledge/public/successors/book4-publication-v1/visual-article-release.json'];
export const staticRoutes=['/','/explore/','/about/','/knowledge/','/knowledge/ask/','/knowledge/concepts/','/articles/','/figures/','/books/','/books/reality-formation/','/books/reality-runtime/','/books/reality-continuity/','/books/reality-expansion/','/books/reality-differentiation/','/books/reality-observation/','/books/reality-navigation/','/reality/','/perspectives/','/perspectives/personal/','/perspectives/profile/','/perspectives/relationship/','/perspectives/iching/','/perspectives/tarot/','/professional/','/professional/financial/','/professional/services/','/professional/authority/','/search/'];
export function publicationRoutes(){
 const routes=new Set(staticRoutes);
 for(const manifest of manifests)for(const row of JSON.parse(fs.readFileSync(manifest)).records||[]){
  if(row.status!=='published')continue;
  if(!/^\/articles\/[a-z0-9-]+$/.test(row.href)||!row.path.startsWith('/content/knowledge/public/')||row.path.includes('..'))throw new Error('UNSAFE_PUBLICATION_ROUTE');
  const article=JSON.parse(fs.readFileSync('.'+row.path));
  if(article.publicationStatus!=='published'||article.reviewStatus!=='approved'||article.slug!==row.slug||article.locale!==row.locale)throw new Error('UNPUBLISHED_ARTICLE:'+row.path);
  routes.add(row.href);
 }
 return [...routes].sort();
}
export function sitemapXml(){return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+publicationRoutes().map(p=>'  <url><loc>https://getphios.com'+p+'</loc></url>').join('\n')+'\n</urlset>\n';}
