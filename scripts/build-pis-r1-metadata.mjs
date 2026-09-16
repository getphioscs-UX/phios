import fs from 'node:fs';
import {parseHTML} from 'linkedom';
const read=p=>JSON.parse(fs.readFileSync(p));
const pages=read('content/web/index-surfaces/pis-r1-presentation-manifest-v1.json').pages;
const books=read('content/web/index-surfaces/pis-r1-book-context-v1.json').books;
const publication=read('content/registry/successors/seven-volume-v1/books.json').books;
const visuals=read('content/web-production/registries/client-visual-asset-registry-v1.8.json').assets;
const bookVisuals=read('content/web-production/registries/wpr-seven-volume-r2-public-assets-v1.json').assets;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const data=(marker,value)=>`<script type="application/ld+json" ${marker}>${JSON.stringify(value).replaceAll('<','\\u003c')}</script>`;
for(const entry of [...pages,...books]){
 let html=fs.readFileSync(entry.file,'utf8');const d=parseHTML(html).document;
 const route=entry.route||'/'+entry.file.replace(/index\.html$/,'');const url='https://www.getphios.com'+route;
 const title=d.title;const description=d.querySelector('meta[name="description"]')?.getAttribute('content');const tags=[];
 const book=entry.bookId?publication.find(b=>b.book_id===entry.bookId):null;
 const image=book?bookVisuals.find(v=>v.assetId===entry.bookId.toUpperCase()+'-HARDCOVER')?.publicUrl:visuals.find(v=>v.assetCode===(entry.hero||'HERO-001'))?.r2.requestedURL;
 for(const [name,value] of Object.entries({'og:title':title,'og:description':description,'og:type':book?'book':'website','og:url':url,'og:image':image}))if(value&&!d.querySelector(`meta[property="${name}"]`))tags.push(`<meta property="${name}" content="${esc(value)}">`);
 if(book&&!d.querySelector('script[data-pis-book-schema]'))tags.push(data('data-pis-book-schema',{'@context':'https://schema.org','@type':'Book',name:book.title.en,alternateName:book.title['zh-Hans'],url,author:{'@type':'Person',name:'Teresa Lee'},isPartOf:{'@type':'BookSeries',name:'PHI OS'},description,image}));
 if(entry.file==='about/founder/index.html'&&!d.querySelector('script[data-pis-founder-schema]'))tags.push(data('data-pis-founder-schema',{'@context':'https://schema.org','@type':'Person',name:'Teresa Lee',url,jobTitle:'Founder and Principal Architect',worksFor:{'@type':'Organization',name:'PHI OS',url:'https://www.getphios.com/'}}));
 if(tags.length)fs.writeFileSync(entry.file,html.replace('</head>',tags.join('\n')+'\n</head>'));
}
console.log('PIS metadata: existing visual-authority OG images, seven Book records and founder relationship; no offers, ratings or fabricated reviews.');
