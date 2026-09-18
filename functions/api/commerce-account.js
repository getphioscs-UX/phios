import {commerceApi} from '../commerce/commerce-stripe-api.js';
export const onRequestGet=context=>commerceApi(context,'account');
export const onRequest=context=>context.request.method==='GET'?onRequestGet(context):new Response(null,{status:405,headers:{Allow:'GET'}});
