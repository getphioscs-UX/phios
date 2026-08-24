const TAXONOMY = Object.freeze(new Set(['CURRENT','DECISION','RELATIONSHIP','TIME','DOMAIN','STRUCTURE']));
const SURFACES = Object.freeze({
  ASK:{route:'/ask',public:true},
  KNOWLEDGE:{route:'/library',public:true},
  PERSONAL:{route:'/personal-runtime',public:true},
  FINANCIAL:{route:'/financial-reality',public:true},
  REALITY:{route:'/my-reality',public:true},
  JOURNEY:{route:'/reality-journey',public:true},
  LEARN:{route:'/academy',public:true},
  WORK:{route:'/services',public:true}
});
function text(v){return String(v??'').trim().slice(0,500)}
function explicitSurface(q){
  const s=q.toLowerCase();
  if(/\b(personal runtime|birth chart|birth reading)\b|个人运行|出生资料|个人读取/.test(s)) return 'PERSONAL';
  if(/\b(financial reality|financial snapshot|cash flow snapshot|net worth snapshot)\b|财务现实|财务快照|现金流快照|净资产快照/.test(s)) return 'FINANCIAL';
  if(/\b(my reality|continue my reality)\b|我的现实|继续现实/.test(s)) return 'REALITY';
  if(/\b(reality journey|deep case|longitudinal case)\b|现实旅程|深层个案|长期个案/.test(s)) return 'JOURNEY';
  if(/\b(academy|course|learn phi os)\b|学院|课程|学习 phi os/.test(s)) return 'LEARN';
  if(/\b(professional service|work with phi os)\b|专业服务|与 phi os 合作/.test(s)) return 'WORK';
  return null;
}
export function routeClientIntent(input={}){
  const question=text(input.question||input.q);
  const rawHint=String(input.taxonomyHint||input.intent||'').toUpperCase();
  const taxonomyHint=TAXONOMY.has(rawHint)?rawHint:null;
  const requestedSurface=String(input.surface||'').toUpperCase();
  const explicit=SURFACES[requestedSurface]?requestedSurface:explicitSurface(question);
  const surface=explicit||'ASK';
  const target=SURFACES[surface];
  const params=new URLSearchParams();
  if(question) params.set('q',question);
  if(surface==='ASK'&&taxonomyHint) params.set('intent',taxonomyHint);
  const href=`${target.route}${params.size?`?${params}`:''}`;
  return Object.freeze({
    schemaVersion:'PHI-OS-CLIENT-INTENT-ROUTE-v1.0.0',
    surface,
    href,
    taxonomyHint:surface==='ASK'?taxonomyHint:null,
    questionPresent:Boolean(question),
    routeReason:explicit?'EXPLICIT_PRODUCT_INTENT':taxonomyHint?'QUESTION_TAXONOMY_HINT':'OPEN_QUESTION',
    boundaries:Object.freeze({methodChosenByClientRouter:false,lensExecutionAllowed:false,modelCalculationAllowed:false,automaticRealityCase:false,automaticJourneyActivation:false,persistenceAllowed:false})
  });
}
