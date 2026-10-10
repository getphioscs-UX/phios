import { writeW28 } from './lib/visual-article-production/production-visual-acceptance-freeze-v1.mjs';
const result=await writeW28(); console.log(`VAP-W28 ${result.status}: ${result.productionUrl}`);
