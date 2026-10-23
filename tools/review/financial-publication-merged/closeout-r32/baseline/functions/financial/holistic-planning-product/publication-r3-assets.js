import {FINANCE_R3_ASSETS} from './publication-r3-contract.js';
import {sha256Hex} from '../../document-assembly/digest.js';
export async function loadFinancialR3Assets(context){
 const output={};
 for(const [key,asset]of Object.entries(FINANCE_R3_ASSETS)){
  const response=await context.env.ASSETS.fetch(new Request(new URL(asset.localPath,context.request.url)));
  if(!response.ok)throw Error('FINANCE_R3_APPROVED_ASSET_UNAVAILABLE');
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length<1000||String.fromCharCode(...bytes.slice(0,4))!=='RIFF'||String.fromCharCode(...bytes.slice(8,12))!=='WEBP')throw Error('FINANCE_R3_APPROVED_ASSET_INVALID');
  if(sha256Hex(bytes)!==asset.sha256)throw Error('FINANCE_R3_APPROVED_ASSET_DIGEST_MISMATCH');
  output[key]=`data:image/webp;base64,${Buffer.from(bytes).toString('base64')}`;
 }
 return output;
}
