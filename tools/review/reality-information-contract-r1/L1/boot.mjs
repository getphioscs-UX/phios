import {mountRicWorldSession} from '/assets/customer-ui/js/surfaces/ric-world-session-panel.js';
document.documentElement.lang=new URL(location.href).searchParams.get('locale')==='en'?'en':'zh-Hans';mountRicWorldSession(document.querySelector('#product'));
