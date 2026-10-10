import crypto from 'node:crypto';

const VOID_TAGS=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const RAW_RE=/\b[A-Z]{2,}(?:_[A-Z0-9]+)+\b/g;
const INTERNAL_RE=/\b(?:COUNTERBALANCED|DISTINCT_DOMAIN_EMPHASIS|PARALLEL_CONTEXT|BOUNDED_BY_UNKNOWN|MULTI_PATTERN_CONTEXT|SUPPORTED|QUALIFIED|PARTIAL)\b/g;

function attrsFrom(source=''){
  const attrs={};
  const re=/([:@A-Za-z_][:@A-Za-z0-9_.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;while((m=re.exec(source))){attrs[m[1]]=m[2]??m[3]??m[4]??'';}
  return attrs;
}
function node(tag='root',attrs={},parent=null){return {tag:String(tag).toLowerCase(),attrs,parent,children:[],text:''};}
export function parseAuditDom(html=''){
  const root=node('root');const stack=[root];
  const tokens=String(html).match(/<!--[\s\S]*?-->|<![^>]*>|<[^>]+>|[^<]+/g)||[];
  for(const tok of tokens){
    if(tok.startsWith('<!--')||tok.startsWith('<!'))continue;
    if(tok.startsWith('</')){const tag=tok.slice(2,-1).trim().toLowerCase();for(let i=stack.length-1;i>0;i--){if(stack[i].tag===tag){stack.length=i;break;}}continue;}
    if(tok.startsWith('<')){
      const self=/\/>\s*$/.test(tok);const inner=tok.slice(1,tok.length-(self?2:1)).trim();if(!inner)continue;
      const m=inner.match(/^([^\s/>]+)/);if(!m)continue;const tag=m[1].toLowerCase();const n=node(tag,attrsFrom(inner.slice(m[0].length)),stack.at(-1));stack.at(-1).children.push(n);if(!self&&!VOID_TAGS.has(tag))stack.push(n);continue;
    }
    stack.at(-1).text+=tok;
  }
  return root;
}
function walk(root,out=[]){for(const child of root.children||[]){out.push(child);walk(child,out);}return out;}
function classSet(n){return new Set(String(n.attrs?.class||'').split(/\s+/).filter(Boolean));}
function match(n,selector){
  if(selector.startsWith('.'))return classSet(n).has(selector.slice(1));
  if(selector.startsWith('#'))return n.attrs?.id===selector.slice(1);
  const attr=selector.match(/^\[([^=\]]+)(?:=["']?([^\]"']+)["']?)?\]$/);if(attr)return Object.hasOwn(n.attrs||{},attr[1])&&(attr[2]===undefined||String(n.attrs[attr[1]])===attr[2]);
  return n.tag===selector.toLowerCase();
}
export function queryAll(root,selector){return walk(root,[]).filter(n=>match(n,selector));}
export function textContent(n){return `${n.text||''}${(n.children||[]).map(textContent).join('')}`.replace(/\s+/g,' ').trim();}
export const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');

function rawLeaks(text){RAW_RE.lastIndex=0;INTERNAL_RE.lastIndex=0;return [...new Set([...(String(text).match(RAW_RE)||[]),...(String(text).match(INTERNAL_RE)||[])])];}

export function auditZiweiDom({navigationHtml='',visualHtml='',readingHtml=''}={}){
  const html=`<div data-w14-dom-root="true"><nav data-slot="navigator">${navigationHtml}</nav><div data-slot="visual">${visualHtml}</div><main data-slot="reading">${readingHtml}</main></div>`;
  const dom=parseAuditDom(html),customerText=textContent(dom),legacySelectors=['.cx-smr-report','[data-smr-version]','[data-method-native="ZWR"]','[data-cx-ziwei-workspace]'];
  const palaceButtons=queryAll(dom,'[data-ziwei-palace-index]');
  const inspectors=queryAll(dom,'[data-ziwei-inspector-index]');
  const topicTabs=queryAll(dom,'[data-ziwei-topic-index]');
  const topicPanels=queryAll(dom,'[data-ziwei-topic-panel-index]');
  const timingNodes=queryAll(dom,'.cx-ziwei-timing-node');
  const ownerNodes=queryAll(dom,'[data-ziwei-current-render-owner="W12_W13"]');
  const legacyCounts=Object.fromEntries(legacySelectors.map(s=>[s,queryAll(dom,s).length]));
  const palaceIndices=palaceButtons.map(x=>Number(x.attrs['data-ziwei-palace-index'])).filter(Number.isInteger);
  const inspectorIndices=inspectors.map(x=>Number(x.attrs['data-ziwei-inspector-index'])).filter(Number.isInteger);
  const topicIndices=topicTabs.map(x=>Number(x.attrs['data-ziwei-topic-index'])).filter(Number.isInteger);
  const openPalaceLinks=queryAll(dom,'[data-ziwei-open-palace-index]').map(x=>Number(x.attrs['data-ziwei-open-palace-index'])).filter(Number.isInteger);
  const leaks=rawLeaks(customerText);
  return Object.freeze({
    domEngine:'BUILTIN_HTML_TREE',
    customerHtmlDigest:sha256(`${navigationHtml}\n${visualHtml}\n${readingHtml}`),
    customerTextDigest:sha256(customerText),
    counts:Object.freeze({palaceButtons:palaceButtons.length,inspectors:inspectors.length,topicTabs:topicTabs.length,topicPanels:topicPanels.length,timingNodes:timingNodes.length,currentOwnerNodes:ownerNodes.length,openPalaceLinks:openPalaceLinks.length}),
    invariants:Object.freeze({
      palaceButtons12:palaceButtons.length===12,
      inspectors12:inspectors.length===12,
      oneInspectorIndexPerPalace:new Set(inspectorIndices).size===12&&new Set(palaceIndices).size===12&&palaceIndices.every(i=>inspectorIndices.includes(i)),
      topics8:topicTabs.length===8&&topicPanels.length===8&&new Set(topicIndices).size===8,
      timingLane3:timingNodes.length===3,
      currentRenderOwnerPresent:ownerNodes.length>=1,
      legacyVisibleOwnerCountZero:Object.values(legacyCounts).every(n=>n===0),
      topicPalaceLinksValid:openPalaceLinks.length>0&&openPalaceLinks.every(i=>i>=0&&i<12),
      rawCodeLeakCountZero:leaks.length===0,
      genericStructureItemLabelAbsent:!customerText.includes('结构项'),
      oldCounterbalancedCodeAbsent:!customerText.includes('COUNTERBALANCED')
    }),
    legacyCounts:Object.freeze(legacyCounts),rawLeaks:Object.freeze(leaks),customerTextLength:customerText.length
  });
}

function fakeClassList(){const s=new Set();return {toggle(c,on){if(on)s.add(c);else s.delete(c);},contains:c=>s.has(c),values:()=>[...s]};}
function fakeNode(dataset={}){const attrs={};return {dataset:{...dataset},hidden:false,removed:false,classList:fakeClassList(),setAttribute(k,v){attrs[k]=String(v);},getAttribute:k=>attrs[k]??null,hasAttribute(k){if(k==='data-ziwei-palace-index')return Object.hasOwn(this.dataset,'ziweiPalaceIndex');if(k==='data-ziwei-open-palace-index')return Object.hasOwn(this.dataset,'ziweiOpenPalaceIndex');return Object.hasOwn(attrs,k);},closest(){return null;},remove(){this.removed=true;},_attrs:attrs};}
export function exerciseZiweiInteractionPlan(plan,{defaultPalaceIndex=0}={}){
  if(typeof plan?.afterMount!=='function')return Object.freeze({passed:false,reason:'AFTER_MOUNT_MISSING'});
  const palaces=Array.from({length:12},(_,i)=>fakeNode({ziweiPalaceIndex:String(i)}));
  const inspectors=Array.from({length:12},(_,i)=>fakeNode({ziweiInspectorIndex:String(i)}));
  const topics=Array.from({length:8},(_,i)=>fakeNode({ziweiTopicIndex:String(i)}));
  const topicPanels=Array.from({length:8},(_,i)=>fakeNode({ziweiTopicPanelIndex:String(i)}));
  const legacy=[fakeNode(),fakeNode()];legacy.forEach(x=>x.closest=()=>null);
  const target=fakeNode();let scrolled=false;target.scrollIntoView=()=>{scrolled=true;};
  let clickHandler=null;
  const host={dataset:{},ownerDocument:{defaultView:{matchMedia:()=>({matches:false})}},querySelectorAll(selector){
    if(selector==='[data-ziwei-palace-index]')return palaces;if(selector==='[data-ziwei-inspector-index]')return inspectors;if(selector==='[data-ziwei-topic-index]')return topics;if(selector==='[data-ziwei-topic-panel-index]')return topicPanels;
    if(['.cx-smr-report','[data-smr-version]','[data-method-native="ZWR"]','[data-cx-ziwei-workspace]'].includes(selector))return legacy.filter(x=>!x.removed);return [];
  },querySelector(selector){return selector==='#ziwei-palaces'?target:null;},addEventListener(type,fn){if(type==='click')clickHandler=fn;}};
  plan.afterMount({host});
  const initial=palaces.filter(x=>x._attrs['aria-pressed']==='true').map(x=>Number(x.dataset.ziweiPalaceIndex));
  const topicTarget={closest(selector){return selector==='[data-ziwei-topic-index]'?topics[7]:null;}};clickHandler?.({target:topicTarget});
  const activeTopic=topics.filter(x=>x._attrs['aria-pressed']==='true').map(x=>Number(x.dataset.ziweiTopicIndex));
  const opener=fakeNode({ziweiOpenPalaceIndex:'5'});const palaceTarget={closest(selector){if(selector==='[data-ziwei-topic-index]')return null;if(selector==='[data-ziwei-palace-index],[data-ziwei-open-palace-index]')return opener;return null;}};clickHandler?.({target:palaceTarget});
  const activePalace=palaces.filter(x=>x._attrs['aria-pressed']==='true').map(x=>Number(x.dataset.ziweiPalaceIndex));
  const visibleInspector=inspectors.map((x,i)=>!x.hidden?i:null).filter(Number.isInteger);
  const passed=initial.length===1&&initial[0]===Number(defaultPalaceIndex)&&activeTopic.length===1&&activeTopic[0]===7&&activePalace.length===1&&activePalace[0]===5&&visibleInspector.length===1&&visibleInspector[0]===5&&scrolled&&legacy.every(x=>x.removed)&&host.dataset.ziweiLegacyZwrSuppressed==='true'&&host.dataset.ziweiCurrentRenderOwner==='W12_W13';
  return Object.freeze({passed,initialPalace:initial[0]??null,activeTopic:activeTopic[0]??null,activePalace:activePalace[0]??null,visibleInspector:visibleInspector[0]??null,scrolled,legacyRemoved:legacy.filter(x=>x.removed).length,owner:host.dataset.ziweiCurrentRenderOwner||null});
}
