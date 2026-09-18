import {commerceApi} from '../commerce/commerce-stripe-api.js';
export const onRequestPost=context=>commerceApi(context,'checkout');
export const onRequest=context=>context.request.method==='POST'?onRequestPost(context):new Response(null,{status:405,headers:{Allow:'POST'}});
