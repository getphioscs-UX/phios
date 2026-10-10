/**
 * CX-R12R3B PASS2A customer-language successor.
 *
 * This is a wording projection only. It never changes meaningCode, selectors,
 * mappings, calculation facts, or method semantics. It replaces internal
 * registry prose with bounded ordinary-reader wording for meanings whose
 * admitted locale text was written as system metadata rather than customer copy.
 */
export const CX_R12R3B_CUSTOMER_LANGUAGE_VERSION='CX-R12R3B-CUSTOMER-LANGUAGE-v1.0.0';

const clone=value=>value==null?value:structuredClone(value);
const clean=value=>String(value??'').trim();
const isInternal=text=>/PHI OS canonical|semantic slot|语义槽位/i.test(clean(text));
const t=(locale,en,zh)=>locale==='zh-Hans'?zh:en;
const STEM_ZH={JIA:'甲',YI:'乙',BING:'丙',DING:'丁',WU:'戊',JI:'己',GENG:'庚',XIN:'辛',REN:'壬',GUI:'癸'};
const BRANCH_ZH={ZI:'子',CHOU:'丑',YIN:'寅',MAO:'卯',CHEN:'辰',SI:'巳',WU:'午',WEI:'未',SHEN:'申',YOU:'酉',XU:'戌',HAI:'亥'};
const STEM_EN={JIA:'Yang Wood',YI:'Yin Wood',BING:'Yang Fire',DING:'Yin Fire',WU:'Yang Earth',JI:'Yin Earth',GENG:'Yang Metal',XIN:'Yin Metal',REN:'Yang Water',GUI:'Yin Water'};
const BRANCH_EN={ZI:'Rat branch',CHOU:'Ox branch',YIN:'Tiger branch',MAO:'Rabbit branch',CHEN:'Dragon branch',SI:'Snake branch',WU:'Horse branch',WEI:'Goat branch',SHEN:'Monkey branch',YOU:'Rooster branch',XU:'Dog branch',HAI:'Pig branch'};

function selectorLabel(selector,methodId,locale){
  const match=selector?.match||selector?.childMatch||{};
  if(methodId==='NUM'){
    const value=match.value;
    const role=match.code==='LIFE_PATH'?t(locale,'Life Path','生命路径'):match.code?clean(match.code).toLowerCase().replaceAll('_',' '):t(locale,'calculated role','计算角色');
    return value==null?role:t(locale,`${role} · ${value}`,`${role} · ${value}`);
  }
  if(methodId==='BZR'){
    const raw=match.value;
    const value=locale==='zh-Hans'?(STEM_ZH[raw]||BRANCH_ZH[raw]||raw):(STEM_EN[raw]||BRANCH_EN[raw]||raw);
    if(match.codePrefix){
      const role={YEAR_:['Year pillar','年柱'],MONTH_:['Month pillar','月柱'],DAY_:['Day pillar','日柱'],HOUR_:['Hour pillar','时柱']}[match.codePrefix];
      if(role)return locale==='zh-Hans'?role[1]:role[0];
    }
    if(raw)return t(locale,`${value} in the recorded four-pillar structure`,`${value}在本次四柱结构中的位置`);
    if(selector?.path==='calculation.cycles')return t(locale,'Recorded cycle context','已记录的周期情境');
    return t(locale,'Recorded BaZi structure','本次八字结构');
  }
  return null;
}

function ordinaryDefinition({methodId,selector,locale,label}){
  if(methodId==='NUM')return t(locale,
    `${label} is used here only within the role and reduction path that produced it. Read it together with that calculation context; the number on its own does not define personality, life purpose, ability, destiny, or a future event.`,
    `${label}只在产生它的计算角色与化简路径中阅读。数字本身不会单独定义人格、人生目的、能力、命运，也不会预告未来事件。`);
  if(methodId==='BZR')return t(locale,
    `${label} is one bounded part of the recorded BaZi structure. It becomes useful only when read with its pillar role and the other admitted structural context; by itself it does not establish personality, identity, fate, or an outcome.`,
    `${label}只是本次八字结构中的一个有边界部分。只有与柱位角色及其他已纳入的结构情境一起阅读时才有意义；单独一项不会定义人格、身份、命运或结果。`);
  return null;
}

export function projectCxR12R3bCustomerLanguage({meaningPayload,methodId,locale='en'}={}){
  const payload=clone(meaningPayload||{});
  if(!['NUM','BZR'].includes(methodId))return payload;
  const bundleItems=Array.isArray(payload?.meaningBundle?.items)?payload.meaningBundle.items:[];
  const byCode=new Map(bundleItems.map(item=>[item.meaningCode,item]));
  const items=Array.isArray(payload?.localeProjection?.items)?payload.localeProjection.items:[];
  payload.localeProjection.items=items.map(item=>{
    if(!isInternal(item.definition))return item;
    const source=byCode.get(item.meaningCode);
    const selector=source?.sourceProjectionRef?.selector||null;
    const label=selectorLabel(selector,methodId,locale)||item.label;
    const definition=ordinaryDefinition({methodId,selector,locale,label})||item.definition;
    return {...item,label,definition,customerLanguageProjected:true,customerLanguageVersion:CX_R12R3B_CUSTOMER_LANGUAGE_VERSION};
  });
  payload.customerLanguageAuthority={
    version:CX_R12R3B_CUSTOMER_LANGUAGE_VERSION,
    methodId,
    locale,
    meaningIdentityChanged:false,
    selectorChanged:false,
    sourceMeaningChanged:false,
    newMethodClaimCreated:false,
    purpose:'ORDINARY_READER_WORDING_ONLY'
  };
  return payload;
}
