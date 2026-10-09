import thesis from '../../content/registry/thesis.json';

export async function onRequestGet(){
 const delivery=thesis.current_public_delivery;
 if(!delivery?.owner_confirmation||delivery.object_key!=='downloads/thesis/reality-navigation-thesis.pdf')return new Response('Thesis delivery unavailable',{status:503});
 const upstream=await fetch(delivery.public_url);
 if(!upstream.ok||!upstream.headers.get('content-type')?.includes('application/pdf'))return new Response('Thesis PDF unavailable',{status:502});
 const bytes=await upstream.arrayBuffer();
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 if(bytes.byteLength!==delivery.size_bytes||digest!==delivery.sha256)return new Response('Thesis version requires review',{status:502});
 return new Response(bytes,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="reality-navigation-thesis.pdf"','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
}
