import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const stable = (value) => JSON.stringify(value, Object.keys(value).sort());

const blueprint = readJson('content/knowledge/blueprints/book-1-knowledge-blueprint.json');
const registry = readJson('content/knowledge/registry/nodes.json');
const meanings = readJson('content/knowledge/meaning/registry/meanings.json');
const rules = readJson('content/knowledge/meaning/registry/formation-rules.json');
const projections = readJson('content/knowledge/meaning/registry/projections.json');
const relationships = readJson('content/knowledge/meaning/registry/meaning-relationships.json');

const registryByCode = new Map(registry.nodes.map((node) => [node.nodeCode, node]));
const meaningByNode = new Map(meanings.records.map((record) => [record.nodeId ?? record.nodeCode, record]));
const rulesByMeaning = new Map();
for (const rule of rules.records) {
  const key = rule.meaningId;
  if (!rulesByMeaning.has(key)) rulesByMeaning.set(key, []);
  rulesByMeaning.get(key).push(rule);
}
const projectionsByNode = new Map();
for (const projection of projections.records) {
  const key = projection.nodeId ?? projection.nodeCode;
  if (!projectionsByNode.has(key)) projectionsByNode.set(key, []);
  projectionsByNode.get(key).push(projection);
}

const articleFiles = [];
for (const locale of ['zh-Hans', 'en']) {
  const dir = path.join(ROOT, 'content/knowledge/articles', locale);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir).filter((entry) => entry.endsWith('.json')).sort()) {
    const rel = path.relative(ROOT, path.join(dir, name)).replaceAll('\\', '/');
    const article = readJson(rel);
    articleFiles.push({ rel, locale, nodeCode: article.canonicalNodeCode ?? article.nodeCode ?? article.canonicalNodeId ?? null });
  }
}
const articlesByNode = new Map();
for (const article of articleFiles) {
  if (!article.nodeCode) continue;
  if (!articlesByNode.has(article.nodeCode)) articlesByNode.set(article.nodeCode, []);
  articlesByNode.get(article.nodeCode).push(article);
}

const blueprintNodeByCode = new Map(blueprint.nodes.map((node) => [node.nodeCode, node]));
const nodes = [];
for (const part of blueprint.parts) {
  for (const nodeCode of part.nodes) {
    const blueprintNode = blueprintNodeByCode.get(nodeCode) ?? {};
    const registeredNode = registryByCode.get(nodeCode) ?? null;
    const meaning = meaningByNode.get(nodeCode) ?? null;
    const nodeProjections = projectionsByNode.get(nodeCode) ?? [];
    const nodeArticles = articlesByNode.get(nodeCode) ?? [];
    const formationRuleCount = meaning ? (rulesByMeaning.get(meaning.meaningId) ?? []).length : 0;
    const projectionTypes = [...new Set(nodeProjections.map((record) => record.projectionType))].sort();
    const articleLanguages = [...new Set(nodeArticles.map((record) => record.locale))].sort();

    let inventoryState = 'blueprint_only';
    if (registeredNode && !meaning) inventoryState = 'registered_without_meaning';
    if (registeredNode && meaning) inventoryState = 'meaning_present';

    nodes.push({
      nodeCode,
      partCode: part.partCode,
      partTitleZhHans: part.title,
      titleZhHans: blueprintNode.titleZhHans ?? null,
      blueprintStatus: blueprintNode.status ?? 'planned',
      registryPresence: Boolean(registeredNode),
      registryStatus: registeredNode?.registryStatus ?? null,
      manuscriptSourcePresence: 'not_inventoryable_from_repository',
      meaningPresence: Boolean(meaning),
      meaningId: meaning?.meaningId ?? null,
      formationRuleCount,
      relationshipCount: relationships.records.filter((record) => record.sourceMeaningId === meaning?.meaningId || record.targetMeaningId === meaning?.meaningId).length,
      projectionRecordCount: nodeProjections.length,
      projectionTypes,
      legacyPublishedArticleAssets: nodeArticles.map((record) => record.rel),
      legacyPublishedArticleLanguages: articleLanguages,
      inventoryState,
      authorityBoundary: meaning ? 'meaning_record_requires_its_own_authority_state' : 'no_meaning_authority_created'
    });
  }
}

const count = (predicate) => nodes.filter(predicate).length;
const summary = {
  plannedCanonicalNodes: nodes.length,
  registeredCanonicalNodes: count((node) => node.registryPresence),
  blueprintOnlyCanonicalNodes: count((node) => !node.registryPresence),
  canonicalMeaningRecords: count((node) => node.meaningPresence),
  nodesWithFormationRules: count((node) => node.formationRuleCount > 0),
  formationRuleRecords: rules.records.length,
  meaningRelationshipRecords: relationships.records.length,
  projectionRecords: projections.records.length,
  nodesWithProjectionRecords: count((node) => node.projectionRecordCount > 0),
  legacyPublishedArticleAssets: articleFiles.length,
  nodesWithLegacyPublishedArticles: count((node) => node.legacyPublishedArticleAssets.length > 0),
  repositoryManuscriptSourcesInventoryable: 0
};

const parts = blueprint.parts.map((part) => {
  const partNodes = nodes.filter((node) => node.partCode === part.partCode);
  return {
    partCode: part.partCode,
    titleZhHans: part.title,
    plannedCanonicalNodes: partNodes.length,
    registeredCanonicalNodes: partNodes.filter((node) => node.registryPresence).length,
    blueprintOnlyCanonicalNodes: partNodes.filter((node) => !node.registryPresence).length,
    canonicalMeaningRecords: partNodes.filter((node) => node.meaningPresence).length,
    nodesWithFormationRules: partNodes.filter((node) => node.formationRuleCount > 0).length,
    nodesWithProjectionRecords: partNodes.filter((node) => node.projectionRecordCount > 0).length,
    nodesWithLegacyPublishedArticles: partNodes.filter((node) => node.legacyPublishedArticleAssets.length > 0).length
  };
});

const inventory = {
  contract: 'PHI-OS-KMR-W1-BOOK-I-MEANING-INVENTORY-v1.0.0',
  version: '1.0.0',
  generatedFrom: {
    bookBlueprintContract: blueprint.contract,
    nodeRegistryVersion: registry.version,
    meaningRegistryContract: meanings.contract,
    formationRuleRegistryContract: rules.contract,
    projectionRegistryContract: projections.contract,
    relationshipRegistryContract: relationships.contract
  },
  scope: { bookCode: blueprint.bookCode, canonicalLanguage: blueprint.canonicalLanguage, parts: blueprint.parts.length },
  summary,
  parts,
  nodes,
  boundaries: {
    inventoryOnly: true,
    createsCanonicalMeaning: false,
    createsFormationRules: false,
    createsProjectionRecords: false,
    changesNodeRegistration: false,
    changesPublicationState: false,
    changesPublicWebsite: false,
    manuscriptAbsenceMeaning: 'not_inventoryable_from_repository does not mean the manuscript does not exist; it means no governed repository source was available to this inventory.'
  }
};

inventory.inventoryHash = sha256(JSON.stringify({ summary, parts, nodes }));

const outJson = path.join(ROOT, 'content/knowledge/meaning/inventory/book-i-meaning-inventory.json');
const outMd = path.join(ROOT, 'docs/kmr/KMR-W1-BOOK-I-MEANING-INVENTORY.md');
fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.mkdirSync(path.dirname(outMd), { recursive: true });
fs.writeFileSync(outJson, `${JSON.stringify(inventory, null, 2)}\n`);

const table = parts.map((part) => `| ${part.partCode} | ${part.titleZhHans} | ${part.plannedCanonicalNodes} | ${part.registeredCanonicalNodes} | ${part.blueprintOnlyCanonicalNodes} | ${part.canonicalMeaningRecords} | ${part.nodesWithFormationRules} | ${part.nodesWithProjectionRecords} | ${part.nodesWithLegacyPublishedArticles} |`).join('\n');
const md = `# KMR-W1｜Book I Meaning Inventory\n\n状态：\`Inventory only\`\n\n本阶段把第一册全部 Blueprint Nodes 纳入同一份 Meaning Runtime 库存，但不会自动创建 Meaning、Formation Rule、Projection、审核或发布状态。\n\n## 全书库存\n\n| 项目 | 数量 |\n|---|---:|\n| Blueprint 计划节点 | ${summary.plannedCanonicalNodes} |\n| 已注册节点 | ${summary.registeredCanonicalNodes} |\n| 仅存在于 Blueprint 的节点 | ${summary.blueprintOnlyCanonicalNodes} |\n| Canonical Meaning Records | ${summary.canonicalMeaningRecords} |\n| Formation Rule Records | ${summary.formationRuleRecords} |\n| Meaning Relationship Records | ${summary.meaningRelationshipRecords} |\n| Projection Records | ${summary.projectionRecords} |\n| 旧有公开 Article Assets | ${summary.legacyPublishedArticleAssets} |\n| 拥有旧有公开 Article 的节点 | ${summary.nodesWithLegacyPublishedArticles} |\n\n## 分部库存\n\n| 部 | 名称 | 计划 | 已注册 | Blueprint only | Meaning | Formation | Projection | 旧有 Article 节点 |\n|---|---|---:|---:|---:|---:|---:|---:|---:|\n${table}\n\n## 当前事实\n\n第一册 Blueprint 共包含 ${summary.plannedCanonicalNodes} 个节点，其中 ${summary.registeredCanonicalNodes} 个 Preface 节点已经进入冻结 Registry，另外 ${summary.blueprintOnlyCanonicalNodes} 个节点仍只属于规划层。KMR-W0 的 Meaning、Formation Rule、Projection 与 Relationship Registry 当前均没有权威记录，因此 W1 不把章节标题自动解释成 Meaning，也不把 Blueprint 节点自动提升为已注册节点。\n\n仓库中现有 ${summary.legacyPublishedArticleAssets} 个旧有公开 Article Assets，覆盖 ${summary.nodesWithLegacyPublishedArticles} 个 Canonical Nodes。这些 Article 继续由 PJA 合同治理；W1 只记录它们的存在，不反向推导 Canonical Meaning。\n\n## 书稿边界\n\n库存把每个节点的 \`manuscriptSourcePresence\` 标记为 \`not_inventoryable_from_repository\`。这不表示书稿不存在，而表示当前 GitHub 库存没有提供可由 KMR 自动读取并受治理引用的第一册正文来源。后续 KMR-W2 必须通过明确的 Manuscript Source Contract 导入或映射书稿，不能根据标题自动补写。\n\n## 冻结边界\n\n- 不创建 Canonical Meaning。\n- 不创建 Formation Rules。\n- 不创建 Projection Records。\n- 不改变 Canonical Node 注册状态。\n- 不改变 PJA Article、审核、批准或发布状态。\n- 不改变公开网页与 Cloudflare Production。\n\nInventory hash：\`${inventory.inventoryHash}\`\n`;
fs.writeFileSync(outMd, md);
console.log(JSON.stringify(summary, null, 2));
console.log(`Inventory: ${path.relative(ROOT, outJson)}`);
