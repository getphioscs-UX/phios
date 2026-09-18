const allowed=new Set(['order_id','stripe_event_id','checkout_session_id','product_id','status','amount_minor','currency','error_code']);
export function commerceLog(event,fields={}){
  console.info(JSON.stringify({component:'commerce',event,...Object.fromEntries(Object.entries(fields).filter(([key])=>allowed.has(key)))}));
}
