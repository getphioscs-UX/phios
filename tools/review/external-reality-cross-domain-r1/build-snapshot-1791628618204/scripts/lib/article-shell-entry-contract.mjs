import fs from 'node:fs';
export function usesGovernedArticleEntry(html){
 if(html.includes('/assets/js/pages/article.js'))return true;
 if(!html.includes('/assets/customer-ui/js/surfaces/article.js'))return false;
 const bridge=fs.readFileSync('assets/customer-ui/js/surfaces/article.js','utf8');
 return bridge.includes("await import('../../../js/pages/article.js')")&&bridge.includes('initializeI18n')&&bridge.includes('phios:localechange');
}
