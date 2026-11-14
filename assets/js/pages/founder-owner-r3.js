import {getLocale,onLocaleChange} from '../i18n.js';
function update(){
 const zh=getLocale()==='zh-Hans';
 for(const n of document.querySelectorAll('[data-founder-copy]'))n.textContent=n.getAttribute(zh?'data-cx-zh':'data-cx-en')||'';
 const title=zh?'Teresa Lee · PHI OS 创办人':'Teresa Lee · Founder of PHI OS';
 const description=document.querySelector('.founder-r3-hero-copy>p:nth-of-type(4)')?.textContent||document.querySelector('.founder-r3-hero-copy>p:nth-of-type(3)')?.textContent||'';
 document.title=title;
 for(const s of ['meta[name="description"]','meta[property="og:description"]'])document.querySelector(s)?.setAttribute('content',description);
 document.querySelector('meta[property="og:title"]')?.setAttribute('content',title);
 const schema=document.querySelector('[data-pis-schema]');if(schema){const value=JSON.parse(schema.textContent);value.name=title;value.description=description;schema.textContent=JSON.stringify(value);}
 // Preserve existing inbound section links as aliases for the new reading path.
 const aliases={'founder-s08':'founder-origin','founder-s02':'founder-origin','founder-s03':'founder-published-work','founder-s04':'founder-trust','founder-s05':'founder-connected-reality','founder-s06':'founder-purpose','founder-s07':'founder-commitment','founder-s09':'founder-next-step'};
 const target=aliases[location.hash.slice(1)];if(target)document.getElementById(target)?.scrollIntoView();
}
onLocaleChange(update);update();
