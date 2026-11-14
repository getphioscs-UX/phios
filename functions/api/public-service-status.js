import {maintenanceMode} from '../_lib/d1-maintenance-guard.js';
// Public capability only: no account, provider, database or diagnostic details.
export function onRequestGet({env}){
 const mode=maintenanceMode(env.PHIOS_D1_MAINTENANCE_MODE);
 return Response.json({ok:true,ask:mode==='READ_ONLY'?'PUBLIC_BASIC_ONLY':mode==='OFF'?'CHECK_ON_SUBMIT':'MAINTENANCE',publicReading:'AVAILABLE'},{headers:{'Cache-Control':'no-store'}});
}
