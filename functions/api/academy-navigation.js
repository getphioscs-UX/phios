import {navigationPublicCatalog} from '../academy/navigation-public-catalog.js';
export async function onRequestGet(context){
 let media={};try{media=JSON.parse(context.env?.PHIOS_NAVIGATION_PUBLIC_VIDEO_MANIFEST||'{}');}catch{return Response.json({ok:false,code:'PUBLIC_VIDEO_MANIFEST_INVALID'},{status:503});}
 try{return Response.json({ok:true,...navigationPublicCatalog(media)},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}catch{return Response.json({ok:false,code:'PUBLIC_VIDEO_MANIFEST_INVALID'},{status:503});}
}
