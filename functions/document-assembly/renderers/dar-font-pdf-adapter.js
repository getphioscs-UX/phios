import {renderDarHtml} from './dar-html-renderer.js';
import {renderDarPdf} from './dar-pdf-renderer.js';
export async function renderFontAwareDarPdf(context,ir,{localRenderer}={}){
 const unicode=ir.sections.some(s=>[...s.renderText].some(c=>c.codePointAt(0)>255));if(!unicode)return renderDarPdf(ir);
 const html=renderDarHtml(ir).replace('</head>','<style>@page{size:A4;margin:20mm}body{font:12pt/1.65 "Microsoft JhengHei","SimSun",serif;overflow-wrap:anywhere}section{break-inside:auto}p{orphans:3;widows:3}</style></head>');
 let bytes;
 if(localRenderer){if(context.env.PHIOS_ENVIRONMENT!=='local-test')throw Error('LOCAL_PDF_RENDERER_FORBIDDEN');bytes=await localRenderer({html,assemblyDigest:ir.assemblyDigest});}
 else{
  const renderer=context.env.FINANCE_DOCUMENT_RENDERER;if(!renderer?.fetch)throw Error('WILL_CJK_PDF_RENDERER_BINDING_REQUIRED');
  const response=await renderer.fetch(new Request('https://finance-document-renderer.internal/render',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({html,assemblyDigest:ir.assemblyDigest,format:'A4',networkAllowed:false})}));
  if(!response.ok||response.headers.get('x-phios-assembly-digest')!==ir.assemblyDigest)throw Error('WILL_CJK_PDF_RENDER_IDENTITY_MISMATCH');bytes=new Uint8Array(await response.arrayBuffer());
 }
 if(!(bytes instanceof Uint8Array)||bytes.length>20*1024*1024||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')throw Error('WILL_PDF_RENDER_INVALID');return bytes;
}
