// Shared binary boundary within the existing private renderer, not a public API.
export const methodPdfSHA=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
const fail=()=>{throw Object.assign(Error('METHOD_PDF_TRANSFER_INVALID'),{status:409});};
export async function methodPdfMultipart(html,verification,bytes){
 if(!(bytes instanceof Uint8Array)||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-'||bytes.length<1000||bytes.length>128*1024*1024)fail();
 const pdfDerivative={bytes:bytes.length,outputDigest:await methodPdfSHA(bytes),pages:verification.pageCount,sourceHtmlDigest:verification.outputDigest,publicationDigest:verification.publicationIrDigest,semanticSnapshotId:verification.semanticSnapshotId,optimization:'NONE_VERIFIED_NATIVE_RENDER'};
 const form=new FormData();form.append('metadata',new Blob([JSON.stringify({html,verification:{...verification,pdfDerivative}})],{type:'application/json'}),'metadata.json');form.append('pdf',new Blob([bytes],{type:'application/pdf'}),'PHI-OS-Zi-Wei.pdf');
 return new Response(form,{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
export async function readMethodPdfMultipart(response){
 if(!response.ok||!response.headers.get('content-type')?.startsWith('multipart/form-data'))fail();
 const stream=response.body?.getReader();if(!stream)fail();const chunks=[];let size=0;
 for(;;){const {value,done}=await stream.read();if(done)break;size+=value.length;if(size>136*1024*1024){await stream.cancel();fail();}chunks.push(value);}
 const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}
 const form=await new Response(all,{headers:{'Content-Type':response.headers.get('content-type')}}).formData(),meta=form.get('metadata'),pdf=form.get('pdf');
 if(!meta||!pdf||meta.size>8000000||pdf.type!=='application/pdf'||pdf.size<1000||pdf.size>128*1024*1024)fail();
 const output=JSON.parse(await meta.text()),bytes=new Uint8Array(await pdf.arrayBuffer()),v=output.verification,d=v?.pdfDerivative;
 if(typeof output.html!=='string'||await methodPdfSHA(new TextEncoder().encode(output.html))!==v.outputDigest||!d||d.bytes!==bytes.length||d.outputDigest!==await methodPdfSHA(bytes)||d.sourceHtmlDigest!==v.outputDigest||d.publicationDigest!==v.publicationIrDigest||d.semanticSnapshotId!==v.semanticSnapshotId||d.pages!==v.pageCount||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')fail();
 return {...output,pdfBytes:bytes};
}
