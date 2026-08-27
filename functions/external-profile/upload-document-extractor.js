import {cleanExternalProfileText} from './external-profile-contract.js';

export const EXTERNAL_PROFILE_DOCUMENT_EXTRACTION_VERSION='PHI-OS-EXTERNAL-PROFILE-DOCUMENT-EXTRACTION-v1.0.0';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};

function normalizeConversionResult(result){
  const item=Array.isArray(result)?result[0]:result;
  if(!item||typeof item!=='object')return null;
  const data=cleanExternalProfileText(item.data,24000);
  if(item.format==='error'||!data)return freeze({ok:false,error:cleanExternalProfileText(item.error,240)||'DOCUMENT_CONVERSION_EMPTY'});
  return freeze({ok:true,text:data,format:cleanExternalProfileText(item.format,40)||'markdown',mimeType:cleanExternalProfileText(item.mimetype||item.mimeType,120)||null,tokens:Number.isFinite(item.tokens)?item.tokens:null,conversionId:cleanExternalProfileText(item.id,160)||null});
}

export async function extractUploadedExternalProfileDocument({file,env}={}){
  if(!file||typeof file!=='object')throw new TypeError('EXTERNAL_PROFILE_DOCUMENT_REQUIRED');
  const toMarkdown=env?.AI?.toMarkdown;
  if(typeof toMarkdown!=='function')return freeze({
    schemaVersion:EXTERNAL_PROFILE_DOCUMENT_EXTRACTION_VERSION,
    status:'UNAVAILABLE',
    extractionMethod:'CLOUDFLARE_AI_MARKDOWN_CONVERSION',
    reasonCode:'WORKERS_AI_MARKDOWN_CONVERSION_UNAVAILABLE',
    text:null,
    aiServiceUsed:false,
    meaningCreated:false,
    interpretationCreated:false
  });
  try{
    const blob=file instanceof Blob?file:new Blob([await file.arrayBuffer()],{type:file.type||'application/octet-stream'});
    const converted=await toMarkdown.call(env.AI,{name:String(file.name||'external-profile'),blob},{conversionOptions:{pdf:{metadata:false}}});
    const normalized=normalizeConversionResult(converted);
    if(!normalized?.ok)return freeze({
      schemaVersion:EXTERNAL_PROFILE_DOCUMENT_EXTRACTION_VERSION,
      status:'FAILED',
      extractionMethod:'CLOUDFLARE_AI_MARKDOWN_CONVERSION',
      reasonCode:normalized?.error||'DOCUMENT_CONVERSION_FAILED',
      text:null,
      aiServiceUsed:true,
      meaningCreated:false,
      interpretationCreated:false
    });
    return freeze({
      schemaVersion:EXTERNAL_PROFILE_DOCUMENT_EXTRACTION_VERSION,
      status:'EXTRACTED',
      extractionMethod:'CLOUDFLARE_AI_MARKDOWN_CONVERSION',
      format:normalized.format,
      mimeType:normalized.mimeType,
      characterCount:normalized.text.length,
      tokens:normalized.tokens,
      conversionId:normalized.conversionId,
      text:normalized.text,
      aiServiceUsed:true,
      meaningCreated:false,
      interpretationCreated:false
    });
  }catch(error){
    return freeze({
      schemaVersion:EXTERNAL_PROFILE_DOCUMENT_EXTRACTION_VERSION,
      status:'FAILED',
      extractionMethod:'CLOUDFLARE_AI_MARKDOWN_CONVERSION',
      reasonCode:cleanExternalProfileText(error?.code||error?.message,240)||'DOCUMENT_CONVERSION_FAILED',
      text:null,
      aiServiceUsed:true,
      meaningCreated:false,
      interpretationCreated:false
    });
  }
}
