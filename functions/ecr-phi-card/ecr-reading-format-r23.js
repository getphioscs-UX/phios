// Content ingestion normalization, not a CSS counter or a prose rewrite.
export function normalizeReadingParagraphs(paragraphs){
 let number=0;
 return paragraphs.map(paragraph=>{
  const clean=String(paragraph).replace(/\*\*/g,'').replace(/^\*+(?=\S)/,'').replace(/\*+$/,'').replace(/(^|[\s(])_(?=[A-Za-z])/g,'$1').replace(/_$/,'');
  return clean.split('\n').map(line=>{const match=/^(\s*)\d+[.)]\s+([\s\S]*)$/.exec(line);if(match)return match[1]+(++number)+'. '+match[2];if(line.trim())number=0;return line;}).join('\n');
 });
}
