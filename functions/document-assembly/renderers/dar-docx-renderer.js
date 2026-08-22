import { assertRenderableIr } from './_renderer-common.js';

function xmlEscape(value) { return String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])); }

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=(c&1)?0xEDB88320^(c>>>1):(c>>>1); table[n]=c>>>0; }
  return table;
})();
function crc32(buffer){ let c=0xFFFFFFFF; for(const byte of buffer) c=CRC_TABLE[(c^byte)&0xFF]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
function u16(n){ const b=Buffer.alloc(2); b.writeUInt16LE(n&0xFFFF); return b; }
function u32(n){ const b=Buffer.alloc(4); b.writeUInt32LE(n>>>0); return b; }
function zipStored(entries){
  const locals=[], centrals=[]; let offset=0;
  for(const [name,dataValue] of entries){
    const nameBuf=Buffer.from(name,'utf8'), data=Buffer.isBuffer(dataValue)?dataValue:Buffer.from(dataValue,'utf8'), crc=crc32(data);
    const local=Buffer.concat([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameBuf.length),u16(0),nameBuf,data]);
    locals.push(local);
    const central=Buffer.concat([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameBuf.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nameBuf]);
    centrals.push(central); offset += local.length;
  }
  const centralStart=offset, centralBytes=Buffer.concat(centrals), localBytes=Buffer.concat(locals);
  const end=Buffer.concat([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralBytes.length),u32(centralStart),u16(0)]);
  return Buffer.concat([localBytes,centralBytes,end]);
}
function paragraph(text,bold=false){ return `<w:p><w:r>${bold?'<w:rPr><w:b/></w:rPr>':''}<w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`; }

export function renderDarDocx(ir){
  assertRenderableIr(ir);
  const body=[];
  body.push(paragraph(`${ir.documentType} — ${ir.jurisdiction ?? 'UNSPECIFIED'}`,true));
  for(const section of ir.sections){
    body.push(paragraph(`${section.clauseId} @ ${section.clauseVersion}`,true));
    for(const line of String(section.renderText).split(/\r?\n/)) body.push(paragraph(line));
  }
  body.push('<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>');
  const documentXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body.join('')}</w:body></w:document>`;
  const contentTypes='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
  const rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
  return zipStored([['[Content_Types].xml',contentTypes],['_rels/.rels',rels],['word/document.xml',documentXml]]);
}

export default Object.freeze({ renderDarDocx });
