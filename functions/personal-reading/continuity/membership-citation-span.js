// Candidate citation projection only. The original experiment validator and
// outputs remain unchanged. A discontinuous/elliptical quotation is never fixed.
// Preserve words, punctuation and paragraph boundaries. Only a single PDF
// line break / layout space between CJK characters may disappear. Latin word
// spacing remains a space; blank lines and form feeds remain hard barriers.
export function indexedCitationText(text){
 let value='',positions=[];
 for(let i=0;i<text.length;){
  if(!/\s/u.test(text[i])){value+=text[i];positions.push(i++);continue;}
  const start=i;while(i<text.length&&/\s/u.test(text[i]))i++;
  const gap=text.slice(start,i),previous=text[start-1]||'',next=text[i]||'';
  const breaks=(gap.match(/\r\n|\r|\n/g)||[]).length;
  if(breaks>=2||gap.includes('\f')){value+='\n\n';positions.push(start,start);}
  else if(/[\u3400-\u9fff，。；：！？“”‘’（）《》]/u.test(previous)&&/[\u3400-\u9fff，。；：！？“”‘’（）《》]/u.test(next))continue;
  else {value+=' ';positions.push(start);}
 }
 return {value,positions};
}
export function resolveMembershipCitationSpan(ref,source){
 if(!source||ref.sourceId!==source.id||ref.sourceSha256!==source.sourceSha256||ref.sourceVersion!==source.sourceVersion||typeof ref.quote!=='string'||!ref.quote.length||ref.quote.length>160)throw Error('CITATION_IDENTITY_OR_BOUNDARY_REJECTED');
 const indexed=indexedCitationText(source.text),needle=indexedCitationText(ref.quote).value;
 if(!needle||/…|\.\.\./u.test(ref.quote))throw Error('COMPOSITE_QUOTE_NOT_ADMITTED');
 const position=indexed.value.indexOf(needle);if(position<0)throw Error('NONCONTIGUOUS_SOURCE_QUOTE');
 // Ambiguous repeated text requires an exact support offset; do not guess.
 if(indexed.value.indexOf(needle,position+1)>=0)throw Error('AMBIGUOUS_SOURCE_QUOTE');
 const localStart=indexed.positions[position],localEnd=indexed.positions[position+needle.length-1]+1,quote=source.text.slice(localStart,localEnd);
 if(quote.length>160)throw Error('RAW_SOURCE_EXCERPT_LIMIT');
 return {...ref,quote,localStart,localEnd,absoluteStart:(source.support?.startOffset||0)+localStart,absoluteEnd:(source.support?.startOffset||0)+localEnd,normalization:'LAYOUT_WHITESPACE_ONLY_CONTIGUOUS_SPAN',noSemanticAcceptance:true};
}
