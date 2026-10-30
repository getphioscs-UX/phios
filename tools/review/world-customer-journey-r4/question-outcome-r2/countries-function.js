export function countriesInQuestion(value){
 const q=countryText(value),original=String(value),rx=n=>new RegExp('\\b'+countryText(n).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i');
 const matched=WORLD_COUNTRIES.filter(c=>Object.entries(c.name).some(([lang,n])=>lang==='zh'?q.includes(countryText(n)):rx(n).test(q))||rx(c.id).test(q)||countryText(c.iso2)===q||(new RegExp('\\b'+c.iso2+'\\b').test(original)&&c.iso2===c.iso2.toUpperCase()));
 const position=c=>Math.min(...names(c).map(n=>/[\u3400-\u9fff]/.test(n)?q.indexOf(countryText(n)):q.search(rx(n))).filter(i=>i>=0));
 return matched.sort((a,b)=>position(a)-position(b));
}
