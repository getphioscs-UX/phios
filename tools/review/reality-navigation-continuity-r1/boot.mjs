import {mountNavigationContinuity} from '/assets/customer-ui/js/surfaces/ric-navigation-continuity.js';
if(!['localhost','127.0.0.1'].includes(location.hostname))throw Error('LOCAL_ONLY');
const zh=new URL(location.href).searchParams.get('locale')!=='en';
if(location.pathname.startsWith('/reality')){
 const host=document.createElement('section');host.className='rn-continuity cx-container';host.id='continue-question';document.querySelector('main').prepend(host);await mountNavigationContinuity(host);
 document.addEventListener('click',e=>{if(e.target.closest('[data-cx-start-reality],[data-reality-structure-start]')){e.preventDefault();e.stopImmediatePropagation();host.scrollIntoView();host.querySelector('textarea')?.focus();}},true);
}else{
 for(const a of document.querySelectorAll('a[href="/reality/"]'))a.href='/reality/?locale='+(zh?'zh-Hans':'en')+'#continue-question';
}
