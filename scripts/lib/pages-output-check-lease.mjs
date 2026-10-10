import {setTimeout as delay} from 'node:timers/promises';
import {acquirePagesOutputLock} from './pages-output-lock.mjs';

// Wait for normal owner release; never delete locks or inspect protected output.
export async function acquirePagesCheckLease(root,{waitMs=Number(process.env.PHIOS_PAGES_CHECK_WAIT_MS??60000)}={}){
 if(!Number.isFinite(waitMs)||waitMs<0||waitMs>60000)throw Error('PAGES_CHECK_WAIT_INVALID');
 const deadline=Date.now()+waitMs;let announced=false;
 for(;;){
  try{return acquirePagesOutputLock(root,'CHECK');}
  catch(error){
   if(!error.message.startsWith('PAGES_OUTPUT_BUSY:')||Date.now()>=deadline)throw error;
   if(!announced){console.error('Pages output is locked; waiting for owner release (up to '+waitMs+' ms).');announced=true;}
   await delay(Math.min(250,Math.max(1,deadline-Date.now())));
  }
 }
}
