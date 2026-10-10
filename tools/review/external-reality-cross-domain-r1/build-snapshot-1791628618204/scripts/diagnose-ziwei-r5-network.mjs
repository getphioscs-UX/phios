import dns from 'node:dns/promises';
import tls from 'node:tls';

const host='api.openai.com';
const result={
  node:process.version,
  platform:process.platform,
  proxy:{
    HTTPS_PROXY:Boolean(process.env.HTTPS_PROXY||process.env.https_proxy),
    HTTP_PROXY:Boolean(process.env.HTTP_PROXY||process.env.http_proxy),
    NO_PROXY:Boolean(process.env.NO_PROXY||process.env.no_proxy),
    NODE_USE_ENV_PROXY:process.env.NODE_USE_ENV_PROXY||null
  },
  dns:null,tls:null,fetch:null
};
function safeError(error){
 const cause=error?.cause||null;
 return {name:String(cause?.name||error?.name||'Error'),code:String(cause?.code||error?.code||'')||null,message:String(cause?.message||error?.message||'').slice(0,240)};
}
try{
 const rows=await dns.lookup(host,{all:true});
 result.dns={status:'PASS',addresses:rows.map(x=>({family:x.family,address:x.address}))};
}catch(error){result.dns={status:'FAIL',...safeError(error)};}

result.tls=await new Promise(resolve=>{
 const socket=tls.connect({host,port:443,servername:host,rejectUnauthorized:true});
 const timer=setTimeout(()=>{socket.destroy();resolve({status:'FAIL',code:'TLS_TIMEOUT'});},10000);
 socket.once('secureConnect',()=>{clearTimeout(timer);const out={status:'PASS',authorized:socket.authorized,protocol:socket.getProtocol(),remoteFamily:socket.remoteFamily,remoteAddress:socket.remoteAddress};socket.end();resolve(out);});
 socket.once('error',error=>{clearTimeout(timer);resolve({status:'FAIL',...safeError(error)});});
});

try{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 const response=await fetch('https://api.openai.com/v1/models',{method:'GET',signal:controller.signal,headers:{'user-agent':'PHI-OS-R5-NETWORK-DIAGNOSTIC/1'}});
 clearTimeout(timer);
 result.fetch={status:'PASS',httpStatus:response.status,expectedUnauthenticatedStatus:401,serverReachable:true};
 await response.body?.cancel();
}catch(error){result.fetch={status:'FAIL',...safeError(error)};}

console.log(JSON.stringify(result,null,2));
if(result.fetch.status!=='PASS')process.exitCode=1;
