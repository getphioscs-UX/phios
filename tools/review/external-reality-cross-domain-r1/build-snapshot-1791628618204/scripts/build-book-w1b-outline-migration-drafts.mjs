import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCE_AUTHORITY_PATH } from './import-book-w1b-source-outline-authority.mjs';

export { SOURCE_AUTHORITY_PATH };

export const MIGRATION_FILES = [
  ['P8', 'p8-runtime-maintenance-outline-migration-v1.json', 'RUNTIME-MAINTENANCE'],
  ['P9', 'p9-coordination-runtime-outline-migration-v1.json', 'COORDINATION-RUNTIME'],
  ['P10', 'p10-runtime-expansion-outline-migration-v1.json', 'RUNTIME-EXPANSION'],
  ['P11', 'p11-civilization-runtime-outline-migration-v1.json', 'CIVILIZATION-RUNTIME'],
  ['P12', 'p12-civilization-atlas-outline-migration-v1.json', 'CIVILIZATION-ATLAS'],
  ['P13', 'p13-reading-science-outline-migration-v1.json', 'READING-SCIENCE'],
  ['P14', 'p14-navigation-science-outline-migration-v1.json', 'NAVIGATION-SCIENCE'],
  ['P15', 'p15-reality-continuation-outline-migration-v1.json', 'REALITY-CONTINUATION']
];

export const ACCEPTANCE_PATH =
  'content/knowledge/migrations/book-w1b/book-w1b-human-acceptance-v1.json';
export const REVIEW_SUMMARY_PATH =
  'docs/audits/BOOK-W1B-part-8-15-outline-reconciliation.md';

const ownerTransitions = {
  P8: ['BOOK-2', 'BOOK-3'], P9: ['BOOK-2', 'BOOK-3'],
  P10: ['BOOK-3', 'BOOK-4'], P11: ['BOOK-3', 'BOOK-4'], P12: ['BOOK-3', 'BOOK-4'],
  P13: ['BOOK-4', 'BOOK-5'], P14: ['BOOK-4', 'BOOK-5'], P15: ['BOOK-4', 'BOOK-5']
};

const W1B_ACCEPTANCE_RECORDED_AT = '2026-08-13';
const W1B_ACCEPTANCE_REASON = 'TL accepts the current primary recommendations; split and merge remain non-dispositive review evidence; new candidates are accepted as candidates only and are not approved Canonical Nodes; overrides: none.';

const ENGLISH_SEMANTIC_TERMS = [
  ['artificial intelligence', 'ai'], ['human–ai', 'human ai'], ['human-ai', 'human ai'],
  ['runtime', '运行'], ['reality', '现实'], ['structure', '结构'], ['activation', '激活'],
  ['projection', '投影'], ['evidence', '证据'], ['reading', '读取'], ['interpretation', '解释'],
  ['navigation', '导航'], ['governance', 'coordination'], ['civilizational', '文明'],
  ['civilization', '文明'], ['synthetic', '人工'], ['carrier', '载体'], ['system', '系统'],
  ['maintenance', '维护'], ['recovery', '恢复'], ['coordination', '协调'], ['information', '信息'],
  ['continuity', '连续'], ['closure', '闭合'], ['settlement', '收束'], ['residual', '残留'],
  ['residue', '残留'], ['expansion', '扩展'], ['node', '节点'], ['observable', '可观察'],
  ['signature', '签名'], ['artifact', '痕迹'], ['readability', '可读性'], ['signal', '讯号'],
  ['noise', '噪声'], ['resolution', '解析'], ['limits', '极限'], ['limit', '极限'],
  ['observer', '观察者'], ['participation', '参与'], ['categories', '类别'], ['category', '类别'],
  ['reliability', '可靠度'], ['boundaries', '边界'], ['boundary', '边界'],
  ['correlation', '相关性'], ['counter', '反'], ['missing', '缺失'], ['temporal', '时间'],
  ['cross-domain', '跨领域'], ['network', '网络'], ['unified', '统一'], ['model', '模型'],
  ['foundations', '基础'], ['foundation', '基础'], ['grammar', '语法'], ['layers', '层级'],
  ['layer', '层级'], ['consistency', '一致性'], ['conflict', '冲突'],
  ['completeness', '完整性'], ['evolution', '演化'], ['shared', '共同'], ['entry', '入口'],
  ['reconstruction', '重建'], ['prioritization', '排序'], ['confidence', '信心'],
  ['alternative', '替代'], ['unknown', '未知'], ['synthesis', '综合'], ['profile', '画像'],
  ['revision', '修订'], ['contract', '契约'], ['context', '情境'], ['knowledge', '知识'],
  ['integration', '整合'], ['candidate', '候选'], ['multiple', '多重'], ['validation', '验证'],
  ['authority', '权威'], ['professional', '专业'], ['ethics', '伦理'],
  ['responsibility', '责任'], ['standards', '标准'], ['standard', '标准'],
  ['intervention', '干预'], ['decision', '决定'], ['formation', '形成'], ['emergence', '涌现'],
  ['load', '负荷'], ['accumulation', '累积'], ['persistence', '持续'], ['drift', '漂移'],
  ['distortion', '扭曲'], ['chronic', '慢性'], ['fragmentation', '碎裂'], ['saturation', '饱和'],
  ['friction', '摩擦'], ['repetition', '重复'], ['escalation', '升级'], ['threshold', '阈值'],
  ['blindness', '失读'], ['interface', '接口'], ['cost', '成本'], ['transfer', '转移'],
  ['embodied', '载体'], ['constraints', '限制'], ['constraint', '限制'], ['soft', '软性'],
  ['interruptions', '中断'], ['architecture', '架构'], ['medical', '医疗'], ['safety', '安全'],
  ['permission', '许可'], ['resistance', '阻抗'], ['window', '窗口'], ['release', '释放'],
  ['reintegration', '重新整合'], ['re-entry', '重新进入'], ['scheduling', '排程'],
  ['debt', '债务'], ['repair', '修复'], ['rebalancing', '再平衡'], ['adaptive', '适应'],
  ['learning', '学习'], ['nervous', '神经'], ['endocrine', '内分泌'], ['immune', '免疫'],
  ['metabolic', '代谢'], ['psychological', '心理'], ['sustainability', '可持续'],
  ['resilience', '韧性'], ['long-term', '长期'], ['self-maintaining', '自维护'],
  ['pressure', '压力'], ['resources', '资源'], ['resource', '资源'], ['objectives', '目标'],
  ['legitimacy', '合法性'], ['compliance', '服从'], ['market', '市场'], ['planned', '计划'],
  ['institutional', '制度'], ['cultural', '文化'], ['religious', '宗教'], ['hybrid', '混合'],
  ['meaning', '意义'], ['attention', '注意'], ['incentive', '激励'], ['power', '权力'],
  ['risk', '风险'], ['complexity', '复杂度'], ['capture', '俘获'], ['collapse', '崩塌'],
  ['algorithmic', '算法'], ['autonomous', '自主'], ['beyond', '超越'], ['scale', '尺度'],
  ['replacement', '替代'], ['gradient', '梯度'], ['trigger', '触发'], ['replication', '复制'],
  ['distribution', '分发'], ['infrastructure', '基础设施'], ['rigidity', '僵化'],
  ['misalignment', '失配'], ['growth', '成长'], ['capacity', '容量'], ['deferral', '递延'],
  ['compression', '压缩'], ['generational', '代际'], ['future', '未来'], ['fertility', '生育率'],
  ['population', '人口'], ['failure', '失效'], ['invisible', '隐性'], ['locking', '锁定'],
  ['collective', '集体'], ['memory', '记忆'], ['language', '语言'], ['identity', '身份'],
  ['time', '时间'], ['space', '空间'], ['institutions', '制度'], ['law', '法律'],
  ['economy', '经济'], ['markets', '市场'], ['education', '教育'], ['religion', '宗教'],
  ['science', '科学'], ['technology', '技术'], ['organization', '组织'], ['trust', '信任'],
  ['reputation', '信誉'], ['cooperation', '合作'], ['competition', '竞争'], ['innovation', '创新'],
  ['diffusion', '扩散'], ['transformation', '转型'], ['atlas', '图谱'], ['density', '密度'],
  ['alignment', '对齐'], ['historical', '历史'], ['trajectory', '轨迹'], ['position', '位置'],
  ['diagnosis', '诊断'], ['stabilization', '稳定'], ['paths', '路径'], ['path', '路径'],
  ['timing', '时机'], ['commitment', '承诺'], ['feedback', '反馈'], ['outcome', '结果'],
  ['relationship', '关系'], ['biological', '生物'], ['dissolution', '解体'],
  ['termination', '终止'], ['deactivation', '退出'], ['archive', '档案'], ['institution', '制度'],
  ['migration', '迁移']
  , ['signals', '讯号'], ['patterns', '模式'], ['states', '状态'], ['transition', '迁移'],
  ['detection', '检测'], ['mapping', '映射'], ['allocation', '分配'], ['selection', '选择'],
  ['secular', '世俗'], ['adaptation', '适应'], ['initialization', '初始化'],
  ['architect', '架构'], ['financial', '资本'], ['media', '媒体'], ['entertainment', '娱乐'],
  ['human', '人'], ['incentives', '激励'], ['responsibilities', '责任'],
  ['awareness', '意识'], ['adjustment', '调整'], ['optimization', '优化'],
  ['trade-offs', '成本交换'], ['uncertainty', '不确定性'], ['review', '复核'],
  ['loops', '循环'], ['reader', '读取者'], ['exists', '出现'], ['without', '无'],
  ['phases', '阶段'], ['timeline', '时间轴'], ['matrix', '矩阵'], ['diagnostics', '诊断'],
  ['ecologies', '生态'], ['scenarios', '情景'], ['possibility', '可能性'],
  ['archives', '档案'], ['relational', '关系'], ['technological', '技术'],
  ['ecological', '生态'], ['individual', '个体'], ['collective', '集体']
];

const readJson = async (root, relativePath) =>
  JSON.parse(await fs.readFile(path.join(root, relativePath), 'utf8'));
const normalizedDigest = value => crypto.createHash('sha256')
  .update(value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');
const objectText = value => `${JSON.stringify(value, null, 2)}\n`;
const objectDigest = value => normalizedDigest(objectText(value));
const compareChapterCodes = (left, right) => {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  return (leftParts[0] - rightParts[0]) || (leftParts[1] - rightParts[1]);
};

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const semanticNormalize = value => {
  let normalized = (value ?? '').toLowerCase().normalize('NFKC').replace(/[–—]/g, '-');
  for (const [source, target] of ENGLISH_SEMANTIC_TERMS) {
    normalized = normalized.replace(new RegExp(`\\b${escapeRegExp(source)}\\b`, 'g'), target);
  }
  normalized = normalized
    .replace(/治理/g, '协调').replace(/噪音/g, '噪声').replace(/信号/g, '讯号')
    .replace(/维护/g, '维持').replace(/残余/g, '残留').replace(/结束/g, '闭合')
    .replace(/终止/g, '闭合').replace(/可靠性/g, '可靠度').replace(/人工智能/g, 'ai')
    .replace(/适应性/g, '适应')
    .replace(/为什么|为何|如何|什么|哪些|何时|什么时候|是否|能够|可以|必须|需要|逐渐|最终|开始|进入|不断|持续|原有|当前|本质|真正|仍然|已经|一次|一个|不同|共同/g, '')
    .replace(/\b(?:why|how|what|when|where|the|a|an|as|is|are|and|or|of|to)\b/g, '')
    .replace(/的|了|会|被|将|使|与|和|及|中|于|从|向|为|在|而|又|都|其/g, '');
  return normalized.replace(/[^a-z0-9\u3400-\u9fff]+/g, '');
};

const bigramDice = (left, right) => {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const minimum = Math.min(left.length, right.length);
  const maximum = Math.max(left.length, right.length);
  if (minimum >= 2 && (left.includes(right) || right.includes(left))) {
    return Math.max(0.82, 0.96 - (1 - minimum / maximum) * 0.2);
  }
  const grams = value => value.length === 1
    ? [value]
    : Array.from({ length: value.length - 1 }, (_, index) => value.slice(index, index + 2));
  const leftGrams = grams(left);
  const rightGrams = grams(right);
  const counts = new Map();
  for (const gram of leftGrams) counts.set(gram, (counts.get(gram) ?? 0) + 1);
  let intersection = 0;
  for (const gram of rightGrams) {
    if ((counts.get(gram) ?? 0) > 0) {
      intersection += 1;
      counts.set(gram, counts.get(gram) - 1);
    }
  }
  const bigramScore = (2 * intersection) / (leftGrams.length + rightGrams.length);
  const characterCounts = new Map();
  for (const character of left) characterCounts.set(character, (characterCounts.get(character) ?? 0) + 1);
  let characterIntersection = 0;
  for (const character of right) {
    if ((characterCounts.get(character) ?? 0) > 0) {
      characterIntersection += 1;
      characterCounts.set(character, characterCounts.get(character) - 1);
    }
  }
  const characterScore = (2 * characterIntersection) / (left.length + right.length);
  let longestSharedRun = '';
  for (let leftStart = 0; leftStart < left.length; leftStart += 1) {
    for (let rightStart = 0; rightStart < right.length; rightStart += 1) {
      let length = 0;
      while (left[leftStart + length] && left[leftStart + length] === right[rightStart + length]) length += 1;
      if (length > longestSharedRun.length) longestSharedRun = left.slice(leftStart, leftStart + length);
    }
  }
  const genericRuns = new Set(['运行', '节点', '文明', '系统', '结构', '扩展', '现实', '连续', '残留', '未来', '人工']);
  const sharedRunScore = longestSharedRun.length >= 2 && !genericRuns.has(longestSharedRun)
    ? Math.min(0.88, 0.78 + (longestSharedRun.length - 2) * 0.03)
    : 0;
  return Math.max(bigramScore, characterScore * 0.9, sharedRunScore);
};

const semanticScore = (node, chapter) => {
  const nodeForms = [node.titleZhHans, node.titleEn].map(semanticNormalize);
  const chapterForms = [chapter.sourceTitle, chapter.canonicalQuestion].map(semanticNormalize);
  let score = 0;
  for (const left of nodeForms) {
    for (const right of chapterForms) score = Math.max(score, bigramDice(left, right));
  }
  return Number(score.toFixed(4));
};

export const scoreNodeOutlineSemantics = semanticScore;

const candidateConfidence = score => score >= 0.9 ? 'HIGH' : score >= 0.8 ? 'MEDIUM' : 'LOW';

const alignOneToOneCandidates = (nodes, chapters) => {
  const scores = nodes.map(node => chapters.map(chapter => semanticScore(node, chapter)));
  const rows = nodes.length;
  const columns = chapters.length;
  const dp = Array.from({ length: rows + 1 }, () => Array(columns + 1).fill(0));
  const take = Array.from({ length: rows + 1 }, () => Array(columns + 1).fill(null));
  for (let row = 1; row <= rows; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      let best = dp[row - 1][column];
      let operation = 'skip-node';
      if (dp[row][column - 1] > best) {
        best = dp[row][column - 1];
        operation = 'skip-chapter';
      }
      const score = scores[row - 1][column - 1];
      const sameCodeBonus = nodes[row - 1].chapterCode === chapters[column - 1].chapterCode ? 0.01 : 0;
      if (score >= 0.82 && dp[row - 1][column - 1] + score + sameCodeBonus > best) {
        best = dp[row - 1][column - 1] + score + sameCodeBonus;
        operation = 'match';
      }
      dp[row][column] = best;
      take[row][column] = operation;
    }
  }

  const pairs = [];
  let row = rows;
  let column = columns;
  while (row > 0 && column > 0) {
    const operation = take[row][column];
    if (operation === 'match') {
      pairs.push({ nodeIndex: row - 1, chapterIndex: column - 1, score: scores[row - 1][column - 1], basis: 'ordered-semantic-alignment' });
      row -= 1;
      column -= 1;
    } else if (operation === 'skip-node') row -= 1;
    else column -= 1;
  }
  pairs.reverse();

  const usedNodes = new Set(pairs.map(pair => pair.nodeIndex));
  const usedChapters = new Set(pairs.map(pair => pair.chapterIndex));
  const reordered = [];
  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
    if (usedNodes.has(nodeIndex)) continue;
    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex += 1) {
      if (usedChapters.has(chapterIndex)) continue;
      if (scores[nodeIndex][chapterIndex] >= 0.9) {
        reordered.push({ nodeIndex, chapterIndex, score: scores[nodeIndex][chapterIndex], basis: 'high-confidence-reordered-semantic-match' });
      }
    }
  }
  reordered.sort((left, right) => right.score - left.score
    || left.nodeIndex - right.nodeIndex || left.chapterIndex - right.chapterIndex);
  for (const pair of reordered) {
    if (usedNodes.has(pair.nodeIndex) || usedChapters.has(pair.chapterIndex)) continue;
    pairs.push(pair);
    usedNodes.add(pair.nodeIndex);
    usedChapters.add(pair.chapterIndex);
  }

  const unmatchedNodeIndexes = nodes.map((_, index) => index).filter(index => !usedNodes.has(index));
  const unmatchedChapterIndexes = chapters.map((_, index) => index).filter(index => !usedChapters.has(index));
  return { scores, pairs, unmatchedNodeIndexes, unmatchedChapterIndexes };
};

const buildPartRecommendations = (nodes, chapters) => {
  const alignment = alignOneToOneCandidates(nodes, chapters);
  const pairByNode = new Map(alignment.pairs.map(pair => [pair.nodeIndex, pair]));
  const pairByChapter = new Map(alignment.pairs.map(pair => [pair.chapterIndex, pair]));

  const entries = nodes.map((node, nodeIndex) => {
    const pair = pairByNode.get(nodeIndex);
    if (!pair) {
      const alternateOutlineCandidates = alignment.unmatchedChapterIndexes
        .map(chapterIndex => ({
          chapterCode: chapters[chapterIndex].chapterCode,
          sourceTitle: chapters[chapterIndex].sourceTitle,
          score: alignment.scores[nodeIndex][chapterIndex]
        }))
        .filter(candidate => candidate.score >= 0.65)
        .sort((left, right) => right.score - left.score || compareChapterCodes(left.chapterCode, right.chapterCode))
        .slice(0, 3);
      return {
        node,
        recommendation: {
          action: 'supersede', candidateOnly: true, confidence: 'UNRESOLVED', score: null,
          sourceOutlineChapterCode: null, sourceOutlineTitle: null,
          basis: 'no-one-to-one-semantic-candidate-above-governed-threshold',
          alternateOutlineCandidates,
          humanDecisionRequired: true, humanDecision: null
        }
      };
    }
    const chapter = chapters[pair.chapterIndex];
    const sameChapterCode = node.chapterCode === chapter.chapterCode;
    const action = sameChapterCode ? (pair.score >= 0.97 ? 'match' : 'rename') : 'move';
    return {
      node,
      recommendation: {
        action, candidateOnly: true, confidence: candidateConfidence(pair.score), score: pair.score,
        sourceOutlineChapterCode: chapter.chapterCode, sourceOutlineTitle: chapter.sourceTitle,
        sourceOutlineQuestion: chapter.canonicalQuestion, basis: pair.basis,
        samePartChapterPositionChanged: !sameChapterCode,
        titleMetadataReviewRequired: semanticNormalize(node.titleZhHans) !== semanticNormalize(chapter.sourceTitle),
        humanDecisionRequired: true, humanDecision: null
      }
    };
  });

  const splitCandidates = [];
  for (const nodeIndex of alignment.unmatchedNodeIndexes) {
    const candidates = alignment.unmatchedChapterIndexes
      .map(chapterIndex => ({ chapterIndex, score: alignment.scores[nodeIndex][chapterIndex] }))
      .filter(candidate => candidate.score >= 0.72)
      .sort((left, right) => right.score - left.score || left.chapterIndex - right.chapterIndex)
      .slice(0, 3);
    if (candidates.length >= 2) {
      splitCandidates.push({
        oldNodeCode: nodes[nodeIndex].nodeCode,
        oldChapterCode: nodes[nodeIndex].chapterCode,
        candidateOutlineChapters: candidates.map(candidate => ({
          chapterCode: chapters[candidate.chapterIndex].chapterCode,
          sourceTitle: chapters[candidate.chapterIndex].sourceTitle,
          score: candidate.score
        })),
        status: 'PENDING_HUMAN_REVIEW', candidateOnly: true
      });
    }
  }

  const mergeCandidates = [];
  for (const chapterIndex of alignment.unmatchedChapterIndexes) {
    const candidates = alignment.unmatchedNodeIndexes
      .map(nodeIndex => ({ nodeIndex, score: alignment.scores[nodeIndex][chapterIndex] }))
      .filter(candidate => candidate.score >= 0.72)
      .sort((left, right) => right.score - left.score || left.nodeIndex - right.nodeIndex)
      .slice(0, 3);
    if (candidates.length >= 2) {
      mergeCandidates.push({
        outlineChapterCode: chapters[chapterIndex].chapterCode,
        sourceTitle: chapters[chapterIndex].sourceTitle,
        candidateExistingNodes: candidates.map(candidate => ({
          oldNodeCode: nodes[candidate.nodeIndex].nodeCode,
          oldChapterCode: nodes[candidate.nodeIndex].chapterCode,
          score: candidate.score
        })),
        status: 'PENDING_HUMAN_REVIEW', candidateOnly: true
      });
    }
  }

  const outlineCandidates = chapters.map((chapter, chapterIndex) => {
    const pair = pairByChapter.get(chapterIndex);
    if (!pair) {
      const alternateExistingNodeCandidates = alignment.unmatchedNodeIndexes
        .map(nodeIndex => ({
          oldNodeCode: nodes[nodeIndex].nodeCode,
          oldChapterCode: nodes[nodeIndex].chapterCode,
          titleEn: nodes[nodeIndex].titleEn,
          titleZhHans: nodes[nodeIndex].titleZhHans,
          score: alignment.scores[nodeIndex][chapterIndex]
        }))
        .filter(candidate => candidate.score >= 0.65)
        .sort((left, right) => right.score - left.score || compareChapterCodes(left.oldChapterCode, right.oldChapterCode))
        .slice(0, 3);
      return {
        outlineChapterCode: chapter.chapterCode, sourceTitle: chapter.sourceTitle,
        canonicalQuestion: chapter.canonicalQuestion, recommendedAction: 'new candidate',
        linkedExistingNodeCodes: [], alternateExistingNodeCandidates,
        candidateOnly: true, canonicalNodeApproved: false,
        humanDecisionRequired: true, humanDecision: null
      };
    }
    const entry = entries[pair.nodeIndex];
    return {
      outlineChapterCode: chapter.chapterCode, sourceTitle: chapter.sourceTitle,
      canonicalQuestion: chapter.canonicalQuestion,
      recommendedAction: entry.recommendation.action,
      linkedExistingNodeCodes: [entry.node.nodeCode],
      confidence: entry.recommendation.confidence, score: entry.recommendation.score,
      candidateOnly: true, canonicalNodeApproved: false,
      humanDecisionRequired: true, humanDecision: null
    };
  });
  return { entries, outlineCandidates, splitCandidates, mergeCandidates };
};

export async function buildBookW1BOutlineMigrationMaps(root = process.cwd()) {
  const [nodeRegistry, sourceAuthority, ownershipMigration] = await Promise.all([
    readJson(root, 'content/knowledge/registry/nodes.json'), readJson(root, SOURCE_AUTHORITY_PATH),
    readJson(root, 'content/knowledge/migrations/five-volume-book-ownership-migration-v1.json')
  ]);
  assert.equal(sourceAuthority.status, 'TL_AUTHORIZED_SOURCE_AUTHORITY_REVIEW_CANDIDATES_ONLY');
  assert.equal(sourceAuthority.inventory.mainChapterCount, 621);
  assert.equal(sourceAuthority.humanAuthorization.w1bAccepted, false);
  const sourceByPart = new Map(sourceAuthority.parts.map(part => [part.partCode, part]));
  const authorityByPart = new Map(ownershipMigration.currentPartAuthority.map(record => [record.partCode, record]));
  const maps = new Map();

  for (const [partCode, fileName, migrationSlug] of MIGRATION_FILES) {
    const sourcePart = sourceByPart.get(partCode);
    const authority = authorityByPart.get(partCode);
    const [oldPublicationBookCode, newPublicationBookCode] = ownerTransitions[partCode];
    assert(sourcePart, `${partCode} source authority is required.`);
    assert(authority, `${partCode} Current Part Authority is required.`);
    const nodes = nodeRegistry.nodes.filter(node => node.partCode === partCode)
      .sort((left, right) => compareChapterCodes(left.chapterCode, right.chapterCode));
    assert(nodes.every(node => node.publicationBookCode === oldPublicationBookCode));
    const recommendations = buildPartRecommendations(nodes, sourcePart.chapters);
    const entries = recommendations.entries.map(({ node, recommendation: draftRecommendation }) => {
      const recommendation = {
        ...draftRecommendation,
        candidateOnly: false,
        humanDecisionRequired: false,
        humanDecision: 'ACCEPT',
        humanDecisionAuthority: 'TL',
        disposition: 'HUMAN_APPROVED_BOOK_W1B_PRIMARY_RECOMMENDATION',
        applicationGate: 'BOOK-W1C-HUMAN-SUCCESSOR-BLUEPRINT-ACCEPTANCE'
      };
      return ({
      oldNodeCode: node.nodeCode, oldChapterCode: node.chapterCode,
      newChapterCode: recommendation.sourceOutlineChapterCode ?? node.chapterCode,
      action: 'move', actionScope: 'publication-ownership-only',
      canonicalIdentityChanged: false, publicationOwnershipChanged: true,
      reason: `Preserve frozen Canonical Node identity while recording the accepted BOOK-W1A publication move from ${oldPublicationBookCode} to ${newPublicationBookCode}; the outline action is a separate Human-review candidate.`,
      successorNodeCodes: [], oldPublicationBookCode, newPublicationBookCode,
      titleZhHans: node.titleZhHans, titleEn: node.titleEn,
      outlineMatchStatus: 'human-approved-book-w1b-primary-recommendation',
      newChapterCodeIsPreservationPlaceholder: recommendation.sourceOutlineChapterCode === null,
      outlineReconciliationRecommendation: recommendation
      });
    });
    const outlineCandidates = recommendations.outlineCandidates.map(candidate => {
      const isNewCandidate = candidate.recommendedAction === 'new candidate';
      return {
        ...candidate,
        candidateOnly: isNewCandidate,
        canonicalNodeApproved: false,
        humanDecisionRequired: false,
        humanDecision: isNewCandidate ? 'ACCEPT_AS_CANDIDATE_ONLY' : 'ACCEPT',
        humanDecisionAuthority: 'TL',
        disposition: isNewCandidate
          ? 'HUMAN_APPROVED_AS_NON_CANONICAL_CANDIDATE_ONLY'
          : 'HUMAN_APPROVED_BOOK_W1B_PRIMARY_RECOMMENDATION'
      };
    });
    const splitCandidates = recommendations.splitCandidates.map(candidate => ({
      ...candidate,
      status: 'NON_DISPOSITIVE_REVIEW_EVIDENCE',
      humanDecisionRequired: false,
      humanDecision: null,
      disposition: 'RETAINED_AS_NON_DISPOSITIVE_REVIEW_EVIDENCE'
    }));
    const mergeCandidates = recommendations.mergeCandidates.map(candidate => ({
      ...candidate,
      status: 'NON_DISPOSITIVE_REVIEW_EVIDENCE',
      humanDecisionRequired: false,
      humanDecision: null,
      disposition: 'RETAINED_AS_NON_DISPOSITIVE_REVIEW_EVIDENCE'
    }));
    const actionCount = action => entries.filter(entry =>
      entry.outlineReconciliationRecommendation.action === action).length;
    const newCandidateCount = recommendations.outlineCandidates.filter(candidate =>
      candidate.recommendedAction === 'new candidate').length;

    maps.set(fileName, {
      contract: 'PHI-OS-BOOK-W1B-PART-OUTLINE-MIGRATION-v1.1.0', schemaVersion: '1.1.0',
      migrationCode: `BOOK-W1B-${partCode}-${migrationSlug}-OUTLINE-MIGRATION-v1`,
      phase: 'BOOK-W1', step: 'BOOK-W1B',
      status: 'HUMAN_APPROVED_BOOK_W1B_MIGRATION_MAP',
      recordedAt: '2026-08-13',
      partAuthority: {
        partCode, titleZhHans: authority.titleZhHans, titleEn: authority.titleEn,
        legacyAliases: authority.legacyAliases, oldPublicationBookCode, newPublicationBookCode
      },
      sourceOutlineAuthority: {
        path: SOURCE_AUTHORITY_PATH, schemaVersion: sourceAuthority.schemaVersion,
        sourceFileSha256: sourceAuthority.source.originalSha256,
        partInventorySha256: sourcePart.inventorySha256,
        upgradedOutlineChapterCount: sourcePart.mainChapterCount, fullChapterListIncluded: true,
        humanSourceAuthorizationRecorded: true, humanReviewEligible: true,
        bookW1BAcceptanceRecorded: true, canonicalAcceptanceEligible: true,
        sourceNormalizationApplied: partCode === 'P13'
          ? sourceAuthority.normalizationRecord.duplicateDisposition : 'NONE'
      },
      inventory: {
        existingCanonicalNodeCount: nodes.length,
        upgradedOutlineChapterCount: sourcePart.mainChapterCount,
        outlineChapterMinusExistingNodeCount: sourcePart.mainChapterCount - nodes.length,
        preservedExistingNodeCount: entries.length,
        acceptedCanonicalOutlineMatchCount: entries.filter(entry =>
          entry.outlineReconciliationRecommendation.sourceOutlineChapterCode).length,
        unresolvedSourceOutlineChapterCount: 0,
        humanReviewRecommendationCount: entries.length + newCandidateCount,
        recommendedNewCanonicalNodeCandidateCount: newCandidateCount,
        acceptedCandidateOnlyNewOutlineChapterCount: newCandidateCount,
        approvedNewCanonicalNodeCandidateCount: 0,
        chapterCountDeltaIsNotANodeCandidateCount: true
      },
      decisionSummary: {
        recommendationsOnly: false,
        match: actionCount('match'), rename: actionCount('rename'), move: actionCount('move'),
        supersede: actionCount('supersede'), splitCandidateReview: recommendations.splitCandidates.length,
        mergeCandidateReview: mergeCandidates.length, newCandidate: newCandidateCount,
        acceptedPrimaryRecommendationCount: entries.length,
        acceptedNewCandidateOnlyCount: newCandidateCount,
        acceptedDecisionCount: entries.length + newCandidateCount,
        approvedCanonicalNodeCount: 0, publicationOwnershipMoveCount: entries.length,
        moveScope: 'outline move recommendations are separate from BOOK-W1A publication-ownership moves'
      },
      splitCandidates,
      mergeCandidates,
      reconciliationActionGates: [
        { action: 'match', status: 'human-approved-book-w1b-primary-recommendation' },
        { action: 'rename', status: 'human-approved-book-w1b-primary-recommendation' },
        { action: 'same-part-move', status: 'human-approved-book-w1b-primary-recommendation' },
        { action: 'publication-ownership-move', status: 'recorded-by-book-w1a' },
        { action: 'supersede', status: 'human-approved-book-w1b-primary-recommendation' },
        { action: 'split', status: 'non-dispositive-review-evidence' },
        { action: 'merge', status: 'non-dispositive-review-evidence' },
        { action: 'new-candidate', status: 'human-approved-as-candidate-only-not-canonical-node' }
      ],
      blocker: {
        code: null,
        missingAuthority: null,
        w1bAcceptanceBlocked: false, w1cSuccessorBlueprintGenerationAllowed: true,
        nextGate: 'BOOK-W1C-HUMAN-SUCCESSOR-BLUEPRINT-ACCEPTANCE'
      },
      boundaries: {
        canonicalNodeRegistryMutationAllowed: false, frozenNodeDeletionAllowed: false,
        frozenNodeRenumberAllowed: false, automaticCanonicalNodeApprovalAllowed: false,
        articlePublicationAllowed: false, productionAuthorityCreated: false
      },
      entries, outlineCandidates
    });
  }
  return maps;
}

const migrationPath = fileName => `content/knowledge/migrations/${fileName}`;

export function buildBookW1BHumanAcceptance(maps) {
  return {
    schemaVersion: 'PHI-OS-BOOK-W1B-HUMAN-ACCEPTANCE-v1.2.0',
    phase: 'BOOK-W1', step: 'BOOK-W1B', status: 'HUMAN_APPROVED',
    recordedAt: W1B_ACCEPTANCE_RECORDED_AT, humanActor: 'TL', decision: 'ACCEPT',
    authorizationStatement: W1B_ACCEPTANCE_REASON,
    sourceAuthorityGate: {
      complete: true, completePartCount: 8, requiredPartCount: 8,
      authorityPath: SOURCE_AUTHORITY_PATH,
      authorityDecision: 'TL_AUTHORIZED_SOURCE_AUTHORITY_AND_W1B_ACCEPTANCE_RECORDED_SEPARATELY',
      missingCompleteOutlineAuthorities: []
    },
    reviewedArtifacts: MIGRATION_FILES.map(([partCode, fileName]) => ({
      partCode, path: migrationPath(fileName), sha256: objectDigest(maps.get(fileName))
    })),
    partDecisions: MIGRATION_FILES.map(([partCode, fileName]) => ({
      partCode, migrationMapPath: migrationPath(fileName), decision: 'ACCEPT', reason: W1B_ACCEPTANCE_REASON,
      acceptedRecommendationOverrides: [], rejectedRecommendationIds: []
    })),
    dispositionPolicy: {
      primaryRecommendations: 'HUMAN_APPROVED',
      splitAndMerge: 'NON_DISPOSITIVE_REVIEW_EVIDENCE',
      newCandidates: 'HUMAN_APPROVED_AS_CANDIDATE_ONLY',
      approvedCanonicalNodeCount: 0,
      overrides: []
    },
    allowedDecisions: ['ACCEPT', 'REVISE', 'REJECT'],
    approvalInstructions: {
      chatAuthorizationAccepted: true,
      receivedChatStatement: W1B_ACCEPTANCE_REASON,
      repositoryRecordingRequiredAfterChatAuthorization: false,
      allPartDecisionsMustBeRecorded: true, w1cMayBeginOnlyAfterDecisionAccept: true
    },
    boundaries: {
      sourceAuthorityAuthorizationIsW1BAcceptance: false, systemMaySelfAccept: false,
      acceptanceCreatesCanonicalNodeAutomatically: false,
      w1cHumanReviewMayBegin: true,
      w1cActivationBeforeW1CHumanAcceptanceAllowed: false,
      canonicalRegistryMutationAllowed: false
    }
  };
}

const markdownEscape = value => String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function buildBookW1BReviewSummary(maps, sourceAuthority) {
  const rows = MIGRATION_FILES.map(([partCode, fileName]) => {
    const map = maps.get(fileName);
    return `| ${partCode} | ${map.inventory.upgradedOutlineChapterCount} | ${map.inventory.existingCanonicalNodeCount} | ${map.decisionSummary.match} | ${map.decisionSummary.rename} | ${map.decisionSummary.move} | ${map.decisionSummary.supersede} | ${map.decisionSummary.splitCandidateReview} | ${map.decisionSummary.mergeCandidateReview} | ${map.decisionSummary.newCandidate} |`;
  });
  const sections = MIGRATION_FILES.map(([partCode, fileName]) => {
    const map = maps.get(fileName);
    const linked = map.entries.filter(entry => entry.outlineReconciliationRecommendation.sourceOutlineChapterCode);
    const linkedRows = linked.map(entry => {
      const recommendation = entry.outlineReconciliationRecommendation;
      return `| ${entry.oldNodeCode} | ${entry.oldChapterCode} | ${recommendation.sourceOutlineChapterCode} | ${recommendation.action} | ${recommendation.confidence} | ${recommendation.score} | ${markdownEscape(recommendation.sourceOutlineTitle)} |`;
    });
    const supersedeCandidates = map.entries
      .filter(entry => entry.outlineReconciliationRecommendation.action === 'supersede');
    const newCandidates = map.outlineCandidates
      .filter(candidate => candidate.recommendedAction === 'new candidate');
    const supersedeRows = supersedeCandidates.map(entry => {
      const alternates = entry.outlineReconciliationRecommendation.alternateOutlineCandidates
        .map(candidate => `${candidate.chapterCode} ${candidate.sourceTitle} (${candidate.score})`).join('<br>');
      return `| ${entry.oldNodeCode} (${entry.oldChapterCode}) | ${markdownEscape(entry.titleZhHans)} / ${markdownEscape(entry.titleEn)} | ${alternates || 'None'} |`;
    });
    const newRows = newCandidates.map(candidate => {
      const alternates = candidate.alternateExistingNodeCandidates
        .map(node => `${node.oldNodeCode} (${node.oldChapterCode}; ${node.score})`).join('<br>');
      return `| ${candidate.outlineChapterCode} | ${markdownEscape(candidate.sourceTitle)} | ${alternates || 'None'} |`;
    });
    const splitRows = map.splitCandidates.map(candidate =>
      `| ${candidate.oldNodeCode} (${candidate.oldChapterCode}) | ${candidate.candidateOutlineChapters.map(chapter => `${chapter.chapterCode} ${chapter.sourceTitle} (${chapter.score})`).join('<br>')} |`);
    const mergeRows = map.mergeCandidates.map(candidate =>
      `| ${candidate.outlineChapterCode} ${candidate.sourceTitle} | ${candidate.candidateExistingNodes.map(node => `${node.oldNodeCode} (${node.oldChapterCode}; ${node.score})`).join('<br>')} |`);
    return [
      `## ${partCode}｜${map.partAuthority.titleEn} / ${map.partAuthority.titleZhHans}`, '',
      `Primary one-to-one review suggestions: ${linked.length}. Supersede candidates: ${supersedeCandidates.length}. New outline candidates: ${newCandidates.length}. Split review clusters: ${map.splitCandidates.length}. Merge review clusters: ${map.mergeCandidates.length}.`, '',
      '| Existing Node | Old chapter | Candidate chapter | Suggested action | Confidence | Score | Source title |',
      '| --- | --- | --- | --- | --- | ---: | --- |',
      ...(linkedRows.length ? linkedRows : ['| — | — | — | — | — | — | — |']), '',
      '### Supersede candidates', '',
      '| Existing Node | Existing title | Lower-confidence outline alternatives |', '| --- | --- | --- |',
      ...(supersedeRows.length ? supersedeRows : ['| None | None | None |']), '',
      '### New candidates', '',
      '| Outline chapter | Source title | Lower-confidence existing-Node alternatives |', '| --- | --- | --- |',
      ...(newRows.length ? newRows : ['| None | None | None |']), '',
      '### Split review candidates', '', '| Existing Node | Candidate outline chapters |', '| --- | --- |',
      ...(splitRows.length ? splitRows : ['| None | None |']), '',
      '### Merge review candidates', '', '| Outline chapter | Candidate existing Nodes |', '| --- | --- |',
      ...(mergeRows.length ? mergeRows : ['| None | None |'])
    ].join('\n');
  });
  return [
    '# BOOK-W1B｜Part 8–15 Canonical Outline Reconciliation — Human approved', '',
    '## Authority and gate state', '',
    `The TL-authorized source file is pinned by SHA-256 \`${sourceAuthority.source.originalSha256}\`. It contains 708 main-chapter occurrences; the exact repeated P13 13.1–13.87 sequence is recorded and normalized to 621 unique main chapters. The original source digest remains authoritative.`, '',
    'The TL has accepted all eight BOOK-W1B migration maps and their current primary recommendations with no overrides. Split and merge records remain non-dispositive review evidence. New candidates are accepted only as candidates and are not approved Canonical Nodes. **At the BOOK-W1B acceptance checkpoint, BOOK-W1C and BOOK-W1D remained unaccepted; later-step status is governed by the five-volume migration contract.**', '',
    '621 outline chapters ≠ 621 Canonical Nodes. Existing frozen identities remain unchanged, `nodes.json` is not mutated, and no outline chapter is automatically approved as a Node.', '',
    '## Per-Part review counts', '',
    '| Part | Outline chapters | Existing nodes | Match | Rename | Move | Supersede | Split review | Merge review | New candidate |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |', ...rows, '',
    'Interpretation: `match`, `rename`, `move` and `supersede` are Human-approved BOOK-W1B primary migration decisions. `split review` and `merge review` remain non-dispositive semantic-overlap evidence. `new candidate` is accepted only for successor review and is not an approved Canonical Node.', '',
    '## Next gate', '',
    `The Human approval is recorded in \`${ACCEPTANCE_PATH}\`. BOOK-W1C successor Blueprint candidates may now enter Human Review. This approval does not accept BOOK-W1C, mutate the Active Blueprint Registry, or authorize BOOK-W1D Canonical Registry reconciliation.`, '',
    ...sections
  ].join('\n') + '\n';
}

async function writeArtifacts(root) {
  const maps = await buildBookW1BOutlineMigrationMaps(root);
  const sourceAuthority = await readJson(root, SOURCE_AUTHORITY_PATH);
  const migrationRoot = path.join(root, 'content/knowledge/migrations');
  for (const [fileName, migration] of maps) {
    await fs.writeFile(path.join(migrationRoot, fileName), objectText(migration), 'utf8');
  }
  await fs.writeFile(path.join(root, ACCEPTANCE_PATH), objectText(buildBookW1BHumanAcceptance(maps)), 'utf8');
  await fs.writeFile(path.join(root, REVIEW_SUMMARY_PATH), buildBookW1BReviewSummary(maps, sourceAuthority), 'utf8');
  console.log(`Generated ${maps.size} Human-approved BOOK-W1B migration maps from complete source authority.`);
  console.log('W1C Human Review is now the next gate; W1C remains unaccepted and inactive.');
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  assert.equal(process.argv[2], '--write', 'Use --write to materialize BOOK-W1B review candidates.');
  await writeArtifacts(process.cwd());
}
