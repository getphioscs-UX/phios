import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
export const RECONCILED_EDIT_VERSION='S02-S03-MARKET-EDIT-v1.0.0';
const expected={'S02_PERSONALITY:en':'14ccd380b858719a46900fa1ad037a5ce039fd34353cef4df89d91591de9bae2','S02_PERSONALITY:zh-Hans':'177693fc0f21c7eb499992fc3c6de9a38ca80d77c502767fe479c394a3647bd8','S03_LIFE_STRUCTURE:en':'fecda15ec6f7121907633a9ce13dafc7f2e5d503b7f88c876f33b7a77358c9c9','S03_LIFE_STRUCTURE:zh-Hans':'e2ae8950a3204cd566e3d16ed3c9c78f5094c1a8776efe94831983e5907250b4'};
export async function editFrozenReconciledCandidate(candidate,locale,sectionKey){
 const beforeDigest=await sha256Stable(candidate);if(expected[sectionKey+':'+locale]!==beforeDigest)throw Error('RECONCILED_EDITORIAL_SOURCE_MISMATCH');
 const next=structuredClone(candidate),blocks=next.blocks;
 const replace=(i,from,to)=>{if(!blocks[i].text.includes(from))throw Error('RECONCILED_EDIT_SPAN_MISSING');blocks[i].text=blocks[i].text.replace(from,to);};
 const s02=sectionKey==='S02_PERSONALITY',zh=locale==='zh-Hans';
 if(s02&&zh){
  replace(2,'条件是方法必须经过实际验证，而不是停留在搜集资料。','把整理的方法用于实际练习，才能检查它是否适用。');
  replace(2,'而非把“独立”或“合作”绝对化','按实际任务选择独立或协作的方式');
  replace(3,'；但不能据此诊断焦虑，也不能推断过去曾经如何表现。','。');
  replace(3,'未来要承担的要求','所承担的要求');
  replace(4,'先用正印与偏印的主题建立资料地图，再以官杀所代表的标准设计练习，最后把每次练习整理成短说明、案例或可交付成果。','用正印与偏印的主题整理资料，以官杀所代表的标准设计练习，也把练习写成短说明或案例。');
  blocks[6].text=blocks[6].text.split('\n\n')[0]+'\n\n八字反映的是结构倾向与阶段变化，实际能力发展仍会受到练习、个人选择与现实条件影响。';
 }else if(s02){
  replace(0,'This is a qualitative elemental and Ten-God context, not a statement of strength or a fixed “Water personality.”','Fire and Earth occur more often in the raw inventory, with Metal and Water also present and no Wood. These counts describe composition, not strength.');
  replace(1,'hidden in all three branches 巳、午、丑','hidden in the Month 午, Day 丑 and Hour 午 branches');
  replace(3,'future-facing standards','the standards of a task');
  replace(3,'; they do not diagnose anxiety or describe past performance.','.');
  replace(4,'strong Officer emphasis','Officer emphasis');
  replace(6,'This reading concerns capability, learning, and expression rather than fixed personality, occupation, income, or guaranteed life events.','BaZi describes structural tendencies and changes across periods; practice, personal choices and real-world circumstances also shape learning and expression.');
 }else if(zh){
  blocks[0].text+='\n\n原始五行分布中火土较多，金水也有呈现而木未见；这描述的是组成，不直接判断旺衰。';
  replace(2,'且官杀在四柱均有藏根','并且官杀在四支都有藏干落点');
  replace(4,'财星在巳、午中均有出现，故每项承诺都应附带现实核对：需要多少时间、资源和持续投入，所得结果是否匹配。','巳藏丙正财，两午藏丁偏财，使现实需求与投入也参与这份生活安排。涉及客户或有报酬的任务时，可以核对对方需要什么、收入约定与完成成本是否相称；在生活章中，这只是比较责任轻重的一项依据。');
  replace(5,'并触及月时午午自刑','并分别有午午自刑关系');
  replace(6,'以上只用于理解生活安排与取舍，不替代对具体职业、收入或财务事项的专门判断。','八字反映的是结构倾向与阶段变化，实际生活安排仍会受到个人选择与现实环境影响。');
 }else{
  blocks[0].text+='\n\nFire and Earth occur more often in the raw element inventory, with Metal and Water present and no Wood. This describes composition, not strength.';
  replace(2,'A third is the ability to compare demand with commitment before agreeing.','A third opportunity is comparing demand with commitment before agreeing.');
  replace(3,'later responsibilities','responsibilities');
  replace(3,'\n\nThese are coordination themes, not verdicts. They do not by themselves describe relationships, health, accidents, or personal history.','');
  replace(6,'This section addresses symbolic life-operation patterns, not fixed personality, biography, or guaranteed outcomes.','BaZi describes structural tendencies and changes across periods; personal choices and real-world circumstances also shape life arrangements.');
  blocks[6].text=`Choose responsibilities whose standards and intended result you can explain. Include preparation time and practical costs when comparing commitments. Visible Geng Direct Resource gives knowledge and methods a place alongside the Officer demands, while hidden Wealth keeps actual needs in view.

During Jia-Xu, consider how clearer expression can help you discuss an obligation and propose a workable method. For 2026 Bing-Wu, check overlapping commitments and leave room for personal arrangements. BaZi describes structural tendencies and changes across periods; personal choices and real-world circumstances also shape life arrangements.`;
 }
 return {candidate:next,audit:{version:RECONCILED_EDIT_VERSION,editor:'ASSISTANT_EDITORIAL_REVISION',beforeDigest,afterDigest:await sha256Stable(next),writerCalls:0,requiresFreshIndependentReview:true,reasons:['CORRECT_SEVEN_KILLINGS_HIDDEN_POSITIONS','ADD_RAW_ELEMENT_CONTEXT','REMOVE_REPEATED_NEGATED_DIAGNOSIS_AND_PREDICTION_LANGUAGE','REMOVE_UNSUPPORTED_PILLAR_FUTURE_MAPPING','KEEP_SECTION_SCOPE']}};
}
