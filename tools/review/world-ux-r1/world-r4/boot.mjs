import {mountWorldMeasurementPanel} from '/assets/js/pages/civilization-atlas/world-measurement-panel.js';
if(!['localhost','127.0.0.1'].includes(location.hostname))throw Error('LOCAL_WORLD_R4_ONLY');
const host=document.createElement('section');host.id='world-r4';host.className='world-r4';document.querySelector('main').append(host);
const entry=document.createElement('a');entry.href='#world-r4';entry.className='cx-button';entry.textContent=new URL(location.href).searchParams.get('locale')==='en'?'Read Malaysia price observations':'读取马来西亚价格观察';document.querySelector('main').prepend(entry);
const link=document.createElement('link');link.rel='stylesheet';link.href='/tools/review/world-ux-r1/world-r4/style.css';document.head.append(link);await mountWorldMeasurementPanel(host);
if(location.hash==='#world-r4'||new URL(location.href).searchParams.has('r4Observation'))host.scrollIntoView({block:'start'});
