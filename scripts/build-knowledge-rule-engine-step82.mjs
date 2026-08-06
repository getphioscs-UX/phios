import {writeCompiledRuleEngine} from './lib/knowledge-rule-engine/knowledge-rule-engine-v1.mjs';
const d=await writeCompiledRuleEngine();console.log(`STEP82 Knowledge Rule Engine compiled: ${d.ruleCodes.length} rules / provider disabled.`);
