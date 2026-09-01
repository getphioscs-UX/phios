import fs from 'node:fs';
import crypto from 'node:crypto';

const BASELINE='2b660066669190eee55de54a2bb87b10be0eb3c4';
const W8='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W8-channel-professional-meaning-corpus-v1.json';
const W9='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/semantics/HD-PRO-R3-W9-gate-professional-meaning-corpus-v1.json';
const CLASS='content/personal-reading/relationship/hd-r1/registries/HD-REL-R1-W2-interaction-class-registry-v1.json';
const OUT='content/personal-reading/relationship/hd-r1/semantics/HD-REL-R1-W3-relationship-semantic-claim-corpus-v1.json';
const JSOUT='functions/personal-reading/relationship/hd-rel-r1-semantic-index.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();

function classMeaning(channel,cls){
  const themeZh=clean(channel.relationshipExpression?.zhHans||channel.functionalExpression?.zhHans||channel.label?.zhHans);
  const themeEn=clean(channel.relationshipExpression?.en||channel.functionalExpression?.en||channel.label?.en);
  const id=channel.channelId;
  const owner=`HD_REL:CHANNEL:${id}:${cls.interactionClass}`;
  const frames={
    ELECTROMAGNETIC:{
      zh:`两人的已确认结构分别提供 ${id} 的一端，使这条完整连接只在关系场中成立。关系阅读因此优先观察这条通道主题是否在两人一起时才明显出现：${themeZh} 这不是吸引力、灵魂伴侣或命定关系的证明。`,
      en:`The two confirmed charts contribute opposite ends of ${id}, so the full connection exists only in the relationship field. The reading therefore observes whether this channel theme becomes especially visible when the pair is together: ${themeEn} This is not proof of attraction, soulmate status, or destiny.`
    },
    DOMINANCE:{
      zh:`${id} 的完整结构由一方稳定带入，而另一方没有这条通道的端点 Gate。关系阅读把「主导」理解为结构来源的不对称，并观察这条通道主题如何进入互动：${themeZh} 这不代表一方更强或拥有控制权。`,
      en:`One participant consistently carries the full ${id} structure while the other carries neither endpoint Gate. “Dominance” is treated as asymmetric structural ownership, and the reading observes how this channel theme enters the interaction: ${themeEn} It does not imply superiority or entitlement to control.`
    },
    COMPROMISE:{
      zh:`一方拥有完整 ${id}，另一方只与其中一个 Gate 重叠。关系阅读观察同一主题附近是否出现调整压力、不同节奏或不同完整度：${themeZh} 技术名词「妥协」不被翻译成任何一方必须退让。`,
      en:`One participant owns the full ${id} channel while the other overlaps through one endpoint Gate. The reading observes adjustment pressure, different pacing, or different structural completeness around the same theme: ${themeEn} The technical class “Compromise” is never translated as a requirement that either person yield.`
    },
    COMPANIONSHIP:{
      zh:`双方都拥有完整 ${id}，因此这条通道主题在两边都有稳定结构来源。关系阅读观察这种共享结构是否带来熟悉感，以及两人是否仍以不同方式表达：${themeZh} 共享结构不等于更适配。`,
      en:`Both participants carry the full ${id} channel, so the theme has a stable structural source on both sides. The reading observes whether this shared structure creates familiarity while still allowing different expression: ${themeEn} Shared structure is not compatibility proof.`
    }
  };
  const reality={
    ELECTROMAGNETIC:{zh:`当两人一起时，${id} 的完整主题是否比各自独处或分别行动时更明显？哪些真实情境支持它，哪些情境反而看不出来？`,en:`When the pair is together, is the full ${id} theme more noticeable than when each acts separately? What real situations support that, and where is it not observed?`},
    DOMINANCE:{zh:`由完整拥有 ${id} 的一方带入这个主题时，互动是否真的出现稳定影响？还是只有在某些情境才明显？`,en:`When the participant who owns ${id} brings this theme, does it actually create a stable interaction pattern, or only show up in certain contexts?`},
    COMPROMISE:{zh:`围绕 ${id}，完整通道拥有者与单 Gate 拥有者在哪里容易同步，哪里会出现节奏或理解上的调整压力？`,en:`Around ${id}, where do the full-channel owner and the single-Gate participant align, and where does adjustment pressure appear in pacing or interpretation?`},
    COMPANIONSHIP:{zh:`双方都拥有 ${id} 时，这种共享结构带来的是熟悉、重复，还是两种不同的表达方式？现实里有什么反例？`,en:`When both participants carry ${id}, does the shared structure feel familiar, repetitive, or expressed in two different ways? What real counterexamples exist?`}
  };
  return {owner,meaning:frames[cls.interactionClass],reality:reality[cls.interactionClass]};
}

function gateMeaning(gate){
  const identityZh=clean(gate.identity?.zhHans||`闸门 ${gate.gate}`);
  const identityEn=clean(gate.identity?.en||`Gate ${gate.gate}`);
  const coreZh=clean(gate.coreSemanticField?.zhHans||'');
  const coreEn=clean(gate.coreSemanticField?.en||'');
  return {
    zh:`双方都确认带有 ${identityZh}，但当前没有更高优先级的完整 Channel relationship owner 覆盖这项证据。因此这里只保留 Gate 层的「相伴」：两边都带有同一原子主题。${coreZh} 共享 Gate 不代表相同人格、相同表达或更高适配度。`,
    en:`Both confirmed charts carry ${identityEn}, and no higher-priority full-Channel relationship owner currently owns this evidence. The relationship reading therefore keeps a Gate-level Companionship observation only: both sides carry the same atomic theme. ${coreEn} A shared Gate does not imply identical personality, identical expression, or greater compatibility.`
  };
}

const w8=read(W8),w9=read(W9),classes=read(CLASS);
if((w8.meaningUnits||[]).length!==36)throw new Error('HD_REL_W3_CHANNEL_CORPUS_REQUIRES_36');
if((w9.meaningUnits||[]).length!==64)throw new Error('HD_REL_W3_GATE_CORPUS_REQUIRES_64');
if((classes.interactionClasses||[]).length!==4)throw new Error('HD_REL_W3_FOUR_CLASSES_REQUIRED');

const channelClaims=[];
for(const channel of w8.meaningUnits){
  for(const cls of classes.interactionClasses){
    const x=classMeaning(channel,cls);
    channelClaims.push({
      semanticClaimId:`HD-REL-R1-CH-${channel.channelId.replace('-','_')}-${cls.interactionClass}`,
      ownerType:'CHANNEL',channelId:channel.channelId,gateA:channel.gateA,gateB:channel.gateB,centerA:channel.centerA,centerB:channel.centerB,
      interactionClass:cls.interactionClass,claimClass:cls.claimClass,semanticOwnerId:x.owner,
      structuralCondition:cls.structuralCondition,
      headline:{zhHans:`${channel.label?.zhHans||channel.channelId} · ${cls.technicalLabel.zhHans}`,en:`${channel.label?.en||channel.channelId} · ${cls.technicalLabel.en}`},
      relationshipMeaning:x.meaning,realityObservation:x.reality,
      counterObservation:{zhHans:'若现实中长期看不到这个互动主题，或只在非常特殊的情境出现，应标记为未观察到或情境依赖，而不是强行套用。',en:'If the interaction theme is not repeatedly observable, or appears only in a very specific context, mark it as not observed or context-dependent rather than forcing the interpretation.'},
      sourceRefs:[...new Set(['HD-REL-SRC-DISTINCTION-SCIENCE-P58-P60','HD-REL-SRC-HD-PRO-R3-W8',...(channel.sourceRefs||[])])],
      upstreamSemanticOwnerId:channel.semanticOwnerId,
      semanticAdmissionStatus:'SEMANTIC_ADMITTED_SHADOW',compositionSupported:true,machineVerified:false,humanAccepted:false,customerPublishable:false,
      boundary:{channelMeaningReusedNotRewritten:true,componentGatesSupportingOnly:true,compatibilityScore:false,destinyVerdict:false,partnerHiddenStateInference:false,individualAuthorityPreserved:true}
    });
  }
}
const gateClaims=[];
for(const gate of w9.meaningUnits){
  const text=gateMeaning(gate);
  gateClaims.push({
    semanticClaimId:`HD-REL-R1-GATE-${String(gate.gate).padStart(2,'0')}-COMPANIONSHIP`,ownerType:'GATE',gate:gate.gate,center:gate.center,harmonicGates:gate.harmonicGates||[gate.harmonicGate].filter(Boolean),interactionClass:'COMPANIONSHIP',claimClass:'CONNECTION',semanticOwnerId:`HD_REL:GATE:${gate.gate}:COMPANIONSHIP`,
    structuralCondition:'Both participants carry the same confirmed Gate and no higher-priority Channel relationship interaction owns that Gate evidence.',
    headline:{zhHans:`${gate.identity?.zhHans||`闸门 ${gate.gate}`} · 相伴`,en:`${gate.identity?.en||`Gate ${gate.gate}`} · Companionship`},relationshipMeaning:text,
    realityObservation:{zhHans:`双方都带有 Gate ${gate.gate} 时，这个共同主题是否真的容易彼此辨认？两人的表达在哪些现实情境中仍明显不同？`,en:`When both participants carry Gate ${gate.gate}, is the shared theme actually easy to recognize in each other? In what situations do their expressions remain clearly different?`},
    counterObservation:{zhHans:'若共同 Gate 在现实互动中没有形成可辨认的共同主题，应保留为结构证据而不扩大解释。',en:'If the shared Gate does not form a recognizable common theme in real interaction, retain it as structural evidence without expanding the interpretation.'},
    sourceRefs:[...new Set(['HD-REL-SRC-DISTINCTION-SCIENCE-P58-P60','HD-REL-SRC-HD-PRO-R3-W9',...(gate.sourceRefs||[])])],upstreamSemanticOwnerId:gate.semanticOwnerId,
    semanticAdmissionStatus:'SEMANTIC_ADMITTED_SHADOW',compositionSupported:true,machineVerified:false,humanAccepted:false,customerPublishable:false,
    boundary:{gateAtomicMeaningReused:true,personalityDesignDistinctMeaningInvented:false,channelPrimaryIfComplete:true,compatibilityScore:false,destinyVerdict:false}
  });
}
const body={
  schemaVersion:'PHI-OS-HD-REL-R1-W3-RELATIONSHIP-SEMANTIC-CLAIM-CORPUS-v1.0.0',work:'HD-REL-R1-W3',baselineCommit:BASELINE,status:'SEMANTIC_CLAIM_CORPUS_ACTIVE_SHADOW',
  upstream:{channelCorpus:W8,gateCorpus:W9,interactionClassRegistry:CLASS},
  counts:{channelInteractionClaims:channelClaims.length,gateCompanionshipClaims:gateClaims.length,totalClaims:channelClaims.length+gateClaims.length},
  ownershipRule:'Complete relationship Channel interaction is primary. Gate companionship is used only when no primary Channel interaction owns the same evidence. Center field remains supporting context.',
  channelClaims,gateClaims,
  publication:{semanticAdmittedShadow:channelClaims.length+gateClaims.length,machineVerified:0,humanAccepted:0,customerPublishable:0}
};
const json=JSON.stringify(body,null,2)+'\n';
const runtime={
  schemaVersion:'PHI-OS-HD-REL-R1-RUNTIME-SEMANTIC-INDEX-v1.0.0',
  generatedFrom:OUT,
  corpusSha256:sha(json),
  channelClaims:Object.fromEntries(channelClaims.map(x=>[`${x.channelId}|${x.interactionClass}`,{semanticClaimId:x.semanticClaimId,semanticOwnerId:x.semanticOwnerId,interactionClass:x.interactionClass,claimClass:x.claimClass,headline:x.headline,relationshipMeaning:x.relationshipMeaning,realityObservation:x.realityObservation,counterObservation:x.counterObservation,sourceRefs:x.sourceRefs,boundary:x.boundary} ])),
  gateClaims:Object.fromEntries(gateClaims.map(x=>[String(x.gate),{semanticClaimId:x.semanticClaimId,semanticOwnerId:x.semanticOwnerId,interactionClass:x.interactionClass,claimClass:x.claimClass,headline:x.headline,relationshipMeaning:x.relationshipMeaning,realityObservation:x.realityObservation,counterObservation:x.counterObservation,sourceRefs:x.sourceRefs,boundary:x.boundary}]))
};
const js=`// Generated by scripts/build-hd-rel-r1-w3-semantic-corpus.mjs. Do not hand-edit.\nexport const HD_REL_R1_SEMANTIC_INDEX=Object.freeze(${JSON.stringify(runtime)});\nexport default HD_REL_R1_SEMANTIC_INDEX;\n`;
if(process.argv.includes('--check')){
  if(!fs.existsSync(OUT)||fs.readFileSync(OUT,'utf8')!==json)throw new Error('HD_REL_R1_W3_CORPUS_DRIFT');
  if(!fs.existsSync(JSOUT)||fs.readFileSync(JSOUT,'utf8')!==js)throw new Error('HD_REL_R1_W3_RUNTIME_INDEX_DRIFT');
  console.log(`✓ HD-REL-R1 W3 corpus current: ${channelClaims.length} channel interaction + ${gateClaims.length} gate companionship = ${channelClaims.length+gateClaims.length}.`);
}else{
  fs.mkdirSync(new URL('../content/personal-reading/relationship/hd-r1/semantics/',import.meta.url).pathname,{recursive:true});
  fs.writeFileSync(OUT,json);fs.writeFileSync(JSOUT,js);
  console.log(`Built ${OUT} and ${JSOUT}.`);
}
