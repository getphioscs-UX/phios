import fs from 'node:fs';
import {buildAstCustomerWorkspaceCandidate} from '../../functions/ast-full-production/ast-customer-reading-production.js';
import {adaptAstPersonalRealityProduct} from '../../functions/personal-reality-product/adapters/ast-production-adapter.js';
import {buildBaziMethodNativeReading} from '../../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {adaptBaziPersonalRealityProduct} from '../../functions/personal-reality-product/adapters/bazi-production-adapter.js';
import {adaptNumerologyPersonalRealityProduct} from '../../functions/personal-reality-product/adapters/numerology-production-adapter.js';
import {PVP_PHASE10_VISUAL_TYPE} from '../../functions/personal-reality-product/adapters/pvp-phase10-method-visual-projection.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export const projectionOf=product=>(product?.visuals||[]).find(v=>v?.type===PVP_PHASE10_VISUAL_TYPE)?.payload||null;
export function installPhase10DomStub(locale='zh-Hans'){
 globalThis.document={documentElement:{lang:locale},querySelector:()=>null,head:{appendChild(){},append(){}},createElement:()=>({dataset:{},set rel(v){this._rel=v},set href(v){this._href=v}})};
 return globalThis.document;
}
export async function buildAstPhase10Case(){
 const fixture=j('content/professional/ast-full-production/fixtures/ast-fp-r4-professional-semantic-fixture-v1.json');
 const result=await buildAstCustomerWorkspaceCandidate({canonicalProjection:fixture.inputProjection,rawIntent:'work role direction',locale:'zh-Hans'});
 const product=adaptAstPersonalRealityProduct({workspace:result.workspace,locale:'zh-Hans'});
 return Object.freeze({product,projection:projectionOf(product),workspace:result.workspace,sourceProjection:result.customerProductProjection||result.workspace?.customerProductProjection});
}
export async function buildBzrPhase10Case(){
 const natal=j('content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
 const native=await buildBaziMethodNativeReading({canonicalProjection:natal,locale:'zh-Hans'});
 const product=adaptBaziPersonalRealityProduct({report:native,locale:'zh-Hans'});
 return Object.freeze({product,projection:projectionOf(product),native});
}
export function buildNumPhase10Case(){
 const snapshot=[
  {role:'LIFE_PATH',label:'生命路径',value:8},{role:'BIRTHDAY_NUMBER',label:'生日数',value:6},{role:'ATTITUDE_NUMBER',label:'态度数',value:9},{role:'BIRTH_YEAR_NUMBER',label:'出生年份数',value:9},{role:'BIRTH_MONTH_NUMBER',label:'出生月份数',value:2}
 ];
 const reading={schemaVersion:'PHI-OS-NUM-INTEGRATED-READING-IR-v1.0.0',methodCode:'NUMEROLOGY',publicationState:'CUSTOMER_PUBLISHABLE',customerPublishable:true,locale:'zh-Hans',sourceProjectionId:'NUM-P10-FIXTURE-PROJ',sourceMeaningBundleCode:'NUM-P10-FIXTURE-BUNDLE',sections:{snapshot,standoutThemes:[{title:'核心数字在不同角色中形成结构性重复'},{title:'长期周期与当前周期需要分开读取'},{title:'关系层只在明确输入比较生日后出现'}],relationships:[],integratedNarrative:['数字角色保持区分，并以整张结构共同读取。'],timing:{calendar:[]},realityReflection:['哪些结构与你当前经验最吻合？'],expansion:{},depth:{}},semanticDepth:{depthMeaning:'HUMAN_ADMITTED'},boundaries:{fortunePredictionCreated:false,meaningInvented:false}};
 const tiles=snapshot.slice(0,3).map(x=>({id:x.role,label:x.label,value:x.value,tier:'CORE'}));
 const customerEnvelope={schemaVersion:'PHI-OS-NUM-CX-CUSTOMER-READING-ENVELOPE-v1.0.0',locale:'zh-Hans',integratedReading:{customerPublishable:true,roleReadings:[],realityReflection:[],depth:{}},chartModel:{overviewTiles:tiles,priorityNarrative:{items:[]},coreNumberMap:{nodes:tiles.map(x=>({...x})),relations:[]}},inputCoverage:{confirmedBirthName:false,relationshipComparison:false},calculationSummary:[],sourceLineage:{meaningBundleCode:reading.sourceMeaningBundleCode},readingDigest:'NUM-P10-FIXTURE'};
 const product=adaptNumerologyPersonalRealityProduct({reading,customerEnvelope,locale:'zh-Hans'});
 return Object.freeze({product,projection:projectionOf(product),reading,customerEnvelope});
}
export default Object.freeze({buildAstPhase10Case,buildBzrPhase10Case,buildNumPhase10Case,projectionOf,installPhase10DomStub});
