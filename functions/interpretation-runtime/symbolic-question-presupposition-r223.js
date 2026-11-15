// Bounded syntactic rejection, never a complete semantic acceptance engine.
export function assertNonPresupposingSymbolicQuestionsR223(statements){
 const patterns=[/(?:换工作|新职位|这份工作|这份邀请|这段关系|这个选择)(?:对你)?的(?:吸引力|诱惑)/u,/你(?:希望|想要|渴望|急于|害怕|担心|厌倦|想逃离).{0,24}(?:哪些|什么|主要|来自|源于|为什么|多久)/u,/(?:what|which|why|how)[^?!.]{0,80}(?:attracts you|you want|you desire|you wish|your dissatisfaction|your desire to escape)/iu,/(?:your attraction|your wish|your urge|your desire|the attraction of)[^?!.]{0,80}(?:mainly|come from|comes from|driven by|because)/iu];
 for(const s of statements||[])if(s?.kind!=='USER_PROVIDED_FACT'&&patterns.some(re=>re.test(String(s.text||''))))throw Object.assign(Error('SYMBOLIC_QUESTION_PRESUPPOSES_UNPROVIDED_STATE'),{code:'SYMBOLIC_QUESTION_PRESUPPOSES_UNPROVIDED_STATE'});
 return {boundedQuestionCheck:'PASS',semanticAcceptance:false};
}
