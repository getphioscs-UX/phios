import { SESSION_KEYS } from './core/session.js';
import { initializeRuntimePersistence, scheduleRuntimeSnapshot, removePersistedContract } from './modules/runtime-persistence.js';

export const SESSION={
  initial:SESSION_KEYS.initialMessage,
  entryState:SESSION_KEYS.entryState,
  runtimeEntity:SESSION_KEYS.runtimeEntity,
  entry:SESSION_KEYS.runtimeEntry,
  reconstruction:SESSION_KEYS.reconstruction,
  reconstructionInquiry:SESSION_KEYS.reconstructionInquiry,
  readingInput:SESSION_KEYS.readingInput,
  reading:SESSION_KEYS.reading,
  navigationInput:SESSION_KEYS.navigationInput,
  navigation:SESSION_KEYS.navigation
};

export function cleanText(v){
  return typeof v==='string'
    ? v
        .replace(/<br\s*\/?>/gi,'\n')
        .replace(/<[^>]*>/g,'')
        .replace(/&nbsp;/gi,' ')
        .replace(/\n{3,}/g,'\n\n')
        .trim()
    : '';
}

export function qs(s,r=document){
  return r.querySelector(s);
}

export function createId(prefix){
  return `${prefix}_${new Date().toISOString().slice(0,10).replaceAll('-','')}_${crypto.randomUUID().slice(0,8)}`;
}

export function safeJSON(value,fallback=null){
  try{
    return JSON.parse(value);
  }catch{
    return fallback;
  }
}

export function setSession(key,value){
  sessionStorage.setItem(
    key,
    typeof value==='string' ? value : JSON.stringify(value)
  );
  scheduleRuntimeSnapshot(`set:${key}`);
}

export function getSession(key){
  return sessionStorage.getItem(key);
}

export function removeSession(key){
  sessionStorage.removeItem(key);
  removePersistedContract(key);
  scheduleRuntimeSnapshot(`remove:${key}`);
}

export function escapeHTML(s=''){
  return String(s).replace(
    /[&<>'"]/g,
    c=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      "'":'&#39;',
      '"':'&quot;'
    }[c])
  );
}

export async function postJSON(url,payload){
  const res=await fetch(url,{
    method:'POST',
    headers:{
      'content-type':'application/json'
    },
    body:JSON.stringify(payload)
  });

  const data=await res
    .json()
    .catch(()=>({
      success:false,
      error:'Unreadable server response.'
    }));

  if(!res.ok || data.success===false){
    throw new Error(
      data.error || `Request failed (${res.status}).`
    );
  }

  return data;
}

export function initNav(){
  const p=location.pathname;

  document
    .querySelectorAll('.nav-links a')
    .forEach(a=>{
      if(a.getAttribute('href')===p){
        a.classList.add('active');
      }
    });
}

initializeRuntimePersistence();
document.addEventListener('DOMContentLoaded',initNav);
