// Customer observation prompts approved in Master R1 §5.4; not a psychometric instrument.
export const PROFILE_OBSERVATION_PROMPTS=Object.freeze({
 identity:{en:'Which roles or values matter to you recently?',zh:'最近哪些角色或事情对你最重要？',kind:'PREFERENCE'},
 expression:{en:'Describe a recent conversation that went well or was difficult.',zh:'请举一个最近沟通顺利或困难的例子。',kind:'FACT'},
 relationships:{en:'In one interaction, what did you do and what did the other person actually say?',zh:'一次让你在意的互动中，你做了什么、对方实际说了什么？',kind:'FACT'},
 environment:{en:'Which current work, home or time conditions help or constrain you?',zh:'当前工作、家庭与时间安排中，哪些条件正在帮助或限制你？',kind:'CONSTRAINT'},
 growth:{en:'What actually changed in your behaviour or circumstances since an earlier observation?',zh:'与上次记录相比，哪些行为或条件真的发生了变化？',kind:'FACT'},
 potential:{en:'What direction would you like to explore, what resources do you have, and what is missing?',zh:'你希望探索哪个方向？已经有什么资源，还缺什么？',kind:'UNKNOWN'},
 body_lifestyle:{en:'Is there a change in rest, energy or environmental comfort you choose to describe? Do not include medical records here.',zh:'最近两周的休息、精力或环境舒适度，有没有你愿意记录的变化？请勿在此填写医疗记录。',kind:'FACT',sensitive:true}
});
