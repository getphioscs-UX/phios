import { assertRenderableIr, documentLines } from './_renderer-common.js';

function assertWinAnsiish(text) {
  for (const char of text) {
    if (char.codePointAt(0) > 255) throw new Error(`DAR_PDF_FONT_EMBEDDING_REQUIRED:U+${char.codePointAt(0).toString(16).toUpperCase()}`);
  }
}
function pdfEscape(text) { return text.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/\r?\n/g,' '); }
function wrap(line, width = 92) {
  if (line.length <= width) return [line];
  const words = line.split(/\s+/); const out=[]; let current='';
  for (const word of words) {
    if (!current) current=word;
    else if (`${current} ${word}`.length <= width) current += ` ${word}`;
    else { out.push(current); current=word; }
  }
  if (current) out.push(current);
  return out.length ? out : [''];
}
function objectBuffer(number, body) { return Buffer.from(`${number} 0 obj\n${body}\nendobj\n`, 'latin1'); }

export function renderDarPdf(ir) {
  assertRenderableIr(ir);
  const rawLines = documentLines(ir);
  rawLines.forEach(assertWinAnsiish);
  const lines = rawLines.flatMap((line) => wrap(line));
  const pages=[]; for (let i=0;i<lines.length;i+=52) pages.push(lines.slice(i,i+52));
  if (pages.length === 0) pages.push(['']);

  const objects = new Map();
  objects.set(1, objectBuffer(1, '<< /Type /Catalog /Pages 2 0 R >>'));
  objects.set(3, objectBuffer(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'));
  const kids=[];
  pages.forEach((pageLines, pageIndex) => {
    const pageNo=4+pageIndex*2, contentNo=pageNo+1; kids.push(`${pageNo} 0 R`);
    const ops=['BT','/F1 10 Tf','50 790 Td','13 TL'];
    for (const line of pageLines) ops.push(`(${pdfEscape(line)}) Tj`, 'T*');
    ops.push('ET');
    const streamText=ops.join('\n')+'\n';
    const streamBytes=Buffer.from(streamText,'latin1');
    const content=Buffer.concat([Buffer.from(`${contentNo} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`,'latin1'),streamBytes,Buffer.from('endstream\nendobj\n','latin1')]);
    objects.set(contentNo,content);
    objects.set(pageNo,objectBuffer(pageNo,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentNo} 0 R >>`));
  });
  objects.set(2, objectBuffer(2, `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`));

  const maxObj=Math.max(...objects.keys()); const header=Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n','latin1'); const chunks=[header]; const offsets=new Array(maxObj+1).fill(0); let offset=header.length;
  for(let n=1;n<=maxObj;n++){ const buf=objects.get(n); if(!buf) throw new Error(`DAR_PDF_INTERNAL_OBJECT_MISSING:${n}`); offsets[n]=offset; chunks.push(buf); offset+=buf.length; }
  const xrefOffset=offset; let xref=`xref\n0 ${maxObj+1}\n0000000000 65535 f \n`;
  for(let n=1;n<=maxObj;n++) xref += `${String(offsets[n]).padStart(10,'0')} 00000 n \n`;
  const trailer=`trailer\n<< /Size ${maxObj+1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(Buffer.from(xref+trailer,'latin1'));
  return Buffer.concat(chunks);
}

export default Object.freeze({ renderDarPdf });
