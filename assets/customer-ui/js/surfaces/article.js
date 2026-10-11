import {initializeI18n} from '../../../js/i18n.js';
import {installNavigationHandoff} from '../navigation-handoff.js';
// The current shell owns locale controls. Keep the existing article renderer's
// dictionary state in sync before its locale listener renders the next article.
initializeI18n({locale:document.documentElement.lang,persist:false});
window.addEventListener('phios:localechange',event=>{
 initializeI18n({locale:event.detail?.locale||document.documentElement.lang,persist:false});
});
await import('../../../js/pages/article.js');
const articleRoot=document.querySelector('[data-article-slug]');
if(articleRoot?.dataset.articleSlug){const host=document.createElement('section');host.className='cx-card';articleRoot.after(host);installNavigationHandoff(host,{productFamily:'BOOKS',objectId:articleRoot.dataset.articleSlug});}
