import {CX_NAVIGATION,installNavigationToggle} from './navigation.js';
import {installLocaleControls} from './locale.js';
import {hydrateCustomerAssets} from './assets.js';
import {installCustomerDialogs} from './dialog.js';
import {installExpandableFigures} from './figure-viewer.js';
const t=(en,zh)=>`data-cx-en="${en}" data-cx-zh="${zh}"`;
function navLinks(active){return CX_NAVIGATION.primary.map(item=>`<a class="cx-nav-link" href="${item.href}" ${item.id===active?'aria-current="page"':''} ${t(item.en,item.zh)}>${item.en}</a>`).join('');}
function utilityLinks(){return CX_NAVIGATION.utilities.map(item=>`<a class="cx-utility-link" href="${item.href}" ${t(item.en,item.zh)}>${item.en}</a>`).join('');}
function headerMarkup(active){return `<header class="cx-shell-header" data-open="false"><div class="cx-container cx-shell-header__inner"><a class="cx-brand" href="/" aria-label="PHI OS home"><img data-cx-asset="LOGO-003" alt="PHI OS"><span class="cx-visually-hidden" data-cx-asset-fallback>PHI OS</span></a><button class="cx-menu-button" type="button" data-cx-menu aria-expanded="false" aria-label="Menu"><span ${t('Menu','菜单')}>Menu</span></button><nav class="cx-primary-nav" aria-label="Primary">${navLinks(active)}</nav><div class="cx-utilities">${utilityLinks()}<div class="cx-locale" aria-label="Language"><button type="button" data-cx-locale="en">EN</button><button type="button" data-cx-locale="zh-Hans">中文</button></div></div></div></header>`;}
function footerMarkup(){return `<footer class="cx-shell-footer"><div class="cx-container cx-shell-footer__grid"><div class="cx-stack"><a class="cx-brand" href="/" aria-label="PHI OS home"><img data-cx-asset="LOGO-010" alt="PHI OS"><span class="cx-visually-hidden" data-cx-asset-fallback>PHI OS</span></a><p class="cx-meta" ${t('Reality changes. Your understanding should be able to change with it.','现实会继续变化，你的理解也应该能够随之更新。')}>Reality changes. Your understanding should be able to change with it.</p></div><div><p class="cx-eyebrow" ${t('Continue','继续')}>Continue</p><p class="cx-meta"><a href="/reality/">My Reality</a><br><a href="/knowledge/">Knowledge</a><br><a href="/professional/">Professional</a></p></div><div><p class="cx-eyebrow" ${t('Utilities','工具')}>Utilities</p><p class="cx-meta"><a href="/search/">Search</a><br><a href="/ask">Ask PHI OS</a><br><a href="/account/">Account</a></p></div></div></footer>`;}
export async function initializeCustomerShell(scope=document){const active=document.body.dataset.cxNav||'';const head=scope.querySelector('[data-cx-header]');if(head)head.outerHTML=headerMarkup(active);const foot=scope.querySelector('[data-cx-footer]');if(foot)foot.outerHTML=footerMarkup();const header=scope.querySelector('.cx-shell-header');installNavigationToggle(header);installLocaleControls(scope);installCustomerDialogs(scope);installExpandableFigures(scope);await hydrateCustomerAssets(scope);document.documentElement.dataset.cxShell='ready';}
initializeCustomerShell().then(async()=>{
  if(document.body.dataset.cxSurface==='SYMBOLIC_ICHING'){
    await import('./surfaces/iching-customer-entry.js');
  }
  if(document.body.dataset.cxSurface==='ICHING_FULL_PRODUCTION'){
    await import('./surfaces/iching-casting.js');
    await import('./surfaces/iching-customer-reading.js');
  }
}).catch(error=>console.error('CX_SHELL_INITIALIZATION_FAILED',error));
